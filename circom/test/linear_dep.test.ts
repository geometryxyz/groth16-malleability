import { config } from "../package.json"
import path from "path"
import fs from "fs"
import { genProof, verifyProof } from "../src"
const { buildPoseidon } = require("circomlibjs") 


const { ZqField, Scalar } = require("ffjavascript")

const circuit = "linear_dep";
const wasmFilePath = path.join(config.build.snark, circuit, `${circuit}.wasm`)
const finalZkeyPath = path.join(config.build.snark, circuit, `${circuit}_final.zkey`)
const vkeyPath = path.join(config.build.snark, circuit, `${circuit}_verification_key.json`)
const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"))

const F = new ZqField(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));
const two = F.e("2")

describe('Proof test', () => {
    let poseidon: any;
    beforeAll(async () => {
        poseidon = await buildPoseidon();
    })

    it("Should create malleable proof", async () => {
        const a = F.e("1")
        const b = F.e("1")
        const c = F.e("6")
        const d = F.e("18")

        const private_inputs_hash_buff = poseidon([c.toString(), d.toString()])
        const private_inputs_hash = poseidon.F.toString(private_inputs_hash_buff)

        console.log(private_inputs_hash)

        const witness = {
            a: a.toString(),
            b: b.toString(),
            c: c.toString(),
            d: d.toString(),
            private_inputs_hash
        };

        const fullProof = await genProof(witness, wasmFilePath, finalZkeyPath);
        const validProof = await verifyProof(vKey, fullProof);
        expect(validProof).toBe(true)

        const newB = Scalar.fromString(BigInt("0x32Be343B94f860124dC4fEe278FDCBD38C102D88").toString())
        const newA = F.add(a, F.mul(two, F.sub(b, newB)))

        fullProof.publicSignals[0] = newA.toString()
        fullProof.publicSignals[1] = newB;

        const malleableProof = await verifyProof(vKey, fullProof);
        expect(malleableProof).toBe(true)
    }, 30000)
})