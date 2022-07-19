pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template LDependence() {
    signal input a;
    signal input b;
    signal input c;
    signal input d;
    signal input e;

    signal input private_inputs_hash;

    signal sixteen_e; 
    sixteen_e <== 16 * e;

    e === (2*a + c - 3 + b) * (b + 2);
    sixteen_e === (b + 2*d + 1) * (6*a + 2*b + 3*c + d);

    component poseidon = Poseidon(4);
    poseidon.inputs[0] <== b;
    poseidon.inputs[1] <== c;
    poseidon.inputs[2] <== d;
    poseidon.inputs[3] <== e;

    private_inputs_hash === poseidon.out;
}

component main {public [a, private_inputs_hash]} = LDependence();

/*
pragma circom 2.0.0;

// include "../node_modules/circomlib/circuits/poseidon.circom";

template LDependence() {
    signal input a;
    signal input b;
    signal input c;
    signal input d;
    signal input e;

    // signal input private_inputs_hash;

    signal sixteen_e; 
    sixteen_e <== 16 * e;

    e === (2*a + c - 3 + b) * (b + 2);
    sixteen_e === (b + 2*d + 1) * (6*a + 2*b + 3*c + d);

    // component poseidon = Poseidon(2);
    // poseidon.inputs[0] <== c;
    // poseidon.inputs[1] <== d;

    // private_inputs_hash === poseidon.out;

}

component main {public [a]} = LDependence();
*/

