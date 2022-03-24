import { config } from "../package.json"
import path from "path"
import fs from "fs"
// const snarkjs = require("snarkjs");
import { genProof, verifyProof } from "../src";


const circuit = "linear_dep";
const wasmFilePath = path.join(config.build.snark, circuit, `${circuit}.wasm`)
const finalZkeyPath = path.join(config.build.snark, circuit, `${circuit}_final.zkey`)
const vkeyPath = path.join(config.build.snark, circuit, `${circuit}_verification_key.json`)
const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"))

describe('Proof test', () => {
    it("Should create valid proof", async () => {
        const witness = {
            a: BigInt(1),
            b: BigInt(1),
            c: BigInt(6),
            d: BigInt(18)
        };

        const fullProof = await genProof(witness, wasmFilePath, finalZkeyPath);

        const res = await verifyProof(vKey, fullProof);
        expect(res).toBe(true)
    })
    it("Should create malleable proof", async () => {
        const witness = {
            a: BigInt(1),
            b: BigInt(1),
            c: BigInt(6),
            d: BigInt(18)
        };

        const fullProof = await genProof(witness, wasmFilePath, finalZkeyPath);

        fullProof.publicSignals[0] = BigInt(fullProof.publicSignals[0]) + BigInt(2) * BigInt(fullProof.publicSignals[1]);
        fullProof.publicSignals[1] = BigInt(0);

        const res = await verifyProof(vKey, fullProof);
        expect(res).toBe(true)
    })
})