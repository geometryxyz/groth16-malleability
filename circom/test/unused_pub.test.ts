import { config } from "../package.json"
import path from "path"
import fs from "fs"
// const snarkjs = require("snarkjs");
import { genProof, verifyProof } from "../src";


const circuit = "unused_pub";
const wasmFilePath = path.join(config.build.snark, circuit, `${circuit}.wasm`)
const finalZkeyPath = path.join(config.build.snark, circuit, `${circuit}_final.zkey`)
const vkeyPath = path.join(config.build.snark, circuit, `${circuit}_verification_key.json`)
const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"))

describe('Proof test', () => {
    it("Should create valid proof", async () => {
        const witness = {
            a: BigInt(3),
            b: BigInt(5),
            x: BigInt(2),
        };

        const fullProof = await genProof(witness, wasmFilePath, finalZkeyPath);

        const validProof = await verifyProof(vKey, fullProof);
        expect(validProof).toBe(true)

        fullProof.publicSignals[1] = BigInt(3)
        const malleableProof = await verifyProof(vKey, fullProof);
        expect(malleableProof).toBe(true)
    }, 30000)
})