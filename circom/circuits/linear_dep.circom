pragma circom 2.0.6;

// include "../node_modules/circomlib/circuits/poseidon.circom";

// template LDependence() {
//     signal input a;
//     signal input b;
//     signal input c;
//     signal input d;
//     signal input e;

//     // signal input private_inputs_hash;

//     signal sixteen_e; 
//     sixteen_e <== 16 * e;

//     e === (2*a + c - 3 + b) * (b + 2);
//     sixteen_e === (b + 2*d + 1) * (6*a + 2*b + 3*c + d);

//     // component poseidon = Poseidon(2);
//     // poseidon.inputs[0] <== c;
//     // poseidon.inputs[1] <== d;

//     // private_inputs_hash === poseidon.out;

// }

template LDependence() {
    signal input a;
    signal input b;
    signal input c;
    signal input d;

    35*b === (2*a + 2*d + c + 2) * (d + 4);
    656*b === (8*d + 8) * (6*a + 16 + 3*c + 16*d);
    2100*b === (2*a + 32 + c) * (64 - d - 2*a - c);
    1 === d * d;
}

component main {public [a, b]} = LDependence();

