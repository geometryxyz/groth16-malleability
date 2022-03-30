import { config } from "../package.json"
import path from "path"
import fs from "fs"
import { genProof, verifyProof } from "../src"
const { buildPoseidon } = require("circomlibjs") 


const { ZqField, Scalar, buildBn128, utils } = require("ffjavascript")
const { unstringifyBigInts, stringifyBigInts } = utils;
const binFileUtils = require("@iden3/binfileutils");

const circuit = "linear_dep";
const wasmFilePath = path.join(config.build.snark, circuit, `${circuit}.wasm`)
const finalZkeyPath = path.join(config.build.snark, circuit, `${circuit}_final.zkey`)
const vkeyPath = path.join(config.build.snark, circuit, `${circuit}_verification_key.json`)
const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"))

const F = new ZqField(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));


const buildMalleabeC = async (stringified_c: string, matching_base_index: number, matching_pub_input: BigInt, new_public_input: BigInt, lf: BigInt) => {
    const c = unstringifyBigInts(stringified_c)

    const {fd: fdZKey, sections: sectionsZKey} = await binFileUtils.readBinFile(finalZkeyPath, "zkey", 2, 1<<25, 1<<23)
    const buffBasesC = await binFileUtils.readSection(fdZKey, sectionsZKey, 8)
    fdZKey.close()

    const curve = await buildBn128();
    const Fr = curve.Fr;
    const G1 = curve.G1;

    const new_pi = new Uint8Array(Fr.n8);
    Scalar.toRprLE(new_pi, 0, new_public_input, Fr.n8);

    const matching_pub = new Uint8Array(Fr.n8);
    Scalar.toRprLE(matching_pub, 0, matching_pub_input, Fr.n8);

    const sGIn = curve.G1.F.n8*2
    const matching_base = buffBasesC.slice(matching_base_index*sGIn, matching_base_index*sGIn + sGIn)
    
    const linear_factor = Fr.e(lf.toString(10))

    const delta_lf = Fr.mul(linear_factor, Fr.sub(matching_pub, new_pi));

    const p = await curve.G1.timesScalar(matching_base, delta_lf);
    const affine_c = G1.fromObject(c);

    const malleable_c = G1.toAffine(G1.add(affine_c, p))
    return stringifyBigInts(G1.toObject(malleable_c))
}

describe('Proof test', () => {
    let poseidon: any;
    beforeAll(async () => {
        poseidon = await buildPoseidon();
    })

    it("Should create malleable proof", async () => {
        const a = F.e("1")
        const b = F.e("1")
        const c = F.e("1")
        const d = F.e("1")
        const e = F.e("3")

        // const private_inputs_hash_buff = poseidon([c.toString(), d.toString()])
        // const private_inputs_hash = poseidon.F.toString(private_inputs_hash_buff)

        // console.log(private_inputs_hash)

        const witness = {
            a: a.toString(),
            b: b.toString(),
            c: c.toString(),
            d: d.toString(),
            e: e.toString(),
            // private_inputs_hash
        };

        const fullProof = await genProof(witness, wasmFilePath, finalZkeyPath);
        const validProof = await verifyProof(vKey, fullProof);
        expect(validProof).toBe(true)

        const newPi = BigInt("0x32Be343B94f860124dC4fEe278FDCBD38C102D88")
        const linearDep = BigInt(2)
        const matchingBase = 1;
        const malleable_c = await buildMalleabeC(fullProof.proof.pi_c, matchingBase, BigInt(a), newPi, linearDep)
        fullProof.proof.pi_c = malleable_c;
        fullProof.publicSignals[0] = newPi

        const malleableProof = await verifyProof(vKey, fullProof);
        expect(malleableProof).toBe(true)
    }, 30000)
})