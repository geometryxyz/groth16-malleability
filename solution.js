const { config } = require("../package.json");
const path = require("path");
const fs = require("fs");
const { genProof, verifyProof } = require("./utils.js");
// const { ZqField, Scalar } = require("ffjavascript")

const { ZqField, Scalar, buildBn128, utils } = require("ffjavascript")
const { unstringifyBigInts, stringifyBigInts } = utils;
const binFileUtils = require("@iden3/binfileutils");

const F = new ZqField(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));

const circuit = "circuit";
const wasmFilePath = path.join(config.paths.build.snark, circuit, `${circuit}.wasm`)
const finalZkeyPath = path.join(config.paths.build.snark, circuit, `${circuit}_final.zkey`)
const vkeyPath = path.join(config.paths.build.snark, circuit, `${circuit}_verification_key.json`)
const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"))

const buildMalleabeC = async (stringified_c, matching_base_index, matching_pub_input, new_public_input, lf) => {
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

const a = F.e("1")
const b = F.e("1")
const c = F.e("1")
const d = F.e("1")

const witness = {
    a: a.toString(),
    b: b.toString(),
    c: c.toString(),
    d: d.toString(),
};

console.assert = (cond, msg) => {
	if( cond )	return;
	if( console.assert.useDebugger ) debugger;
	throw new Error(msg || "Assertion failed!");
};

const run = async () => {
    const { proof, publicSignals } = await genProof(witness, wasmFilePath, finalZkeyPath);
    const isValid = await verifyProof(vKey, { proof, publicSignals });
    console.assert(isValid === true, "Proof is not valid");

    const new_a = BigInt("PUT_YOUR_ADDRESS_HERE");
    publicSignals[0] = new_a;

    const linearDep = BigInt(2)
    const matchingBase = 0;
    const malleable_c = await buildMalleabeC(proof.pi_c, matchingBase, BigInt(a), new_a, linearDep)
    proof.pi_c = malleable_c;

    /*
        PUT YOUR SOLUTION HERE

        Change the proof such that isValidMalleable = true and passes assertion

    */

    const isValidMalleable = await verifyProof(vKey, { proof, publicSignals });
    console.assert(isValidMalleable === true, "Malleable is not valid");

    const proofForTx = [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1],
    ];
    
    const proofAsStr = JSON.stringify(
        proofForTx.map((x) => BigInt(x).toString(10)),
    ).split('\n').join().replaceAll('"', '');

    /********** Paste this stringified proof to `solve` method as explained in README **********/
    console.log(proofAsStr);
};

run().then(() => {
    process.exit(0);
});
