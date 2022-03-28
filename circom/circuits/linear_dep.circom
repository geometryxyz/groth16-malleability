pragma circom 2.0.0;

/*
(a1 + 2*a2) * a3 = a4
(a1 + 2*a2) * (a3 - 1) = (a4 - 3)

a1 = 1
a2 = 1

a3 = 6
a4 = 18

1. (1 + 2) * 6 = 18
2. (1 + 2) * 5 = 15

A = ( 
    0 1 2 0 0 
    0 1 2 0 0
    )
B = (
    0  0 0 1 0
    -1 0 0 1 0
    )

C = (
    0  0 0 0 1
    -3 0 0 0 1
    )

=> 

    2 * u1(x) = u2(x)

    nominator: beta * ui(x) + alpha * vi(x) + wi(x)

    1: beta * u1(x) + 0 + 0 = T -> a1*T

    2: beta * 2 * u1(x) + 0 + 0 -> a2*2*T

    change pi: 

    a1` = (a1 + 2 * a2) -> a1*T + 2*a2*T
    a2` = 0 -> 0 
*/

include "../node_modules/circomlib/circuits/poseidon.circom";

template LDependence() {
    signal input a;
    signal input b;
    signal input c;
    signal input d;

    signal input private_inputs_hash;

    signal d_minus_three; 
    d_minus_three <== d - 3;

    signal c_minus_one;
    c_minus_one <== c - 1;

    d === (a + 2*b) * c;
    d_minus_three === (a + 2*b) * c_minus_one;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== c;
    poseidon.inputs[1] <== d;

    private_inputs_hash === poseidon.out;

}

component main {public [a, b, private_inputs_hash]} = LDependence();

