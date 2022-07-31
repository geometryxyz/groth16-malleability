pragma circom 2.0.6;

template Multiplier() {
    signal input a;
    signal input b;
    signal output c;
    signal input x; //public signal x is never used

    c <== a * b;
}

component main {public [x]} = Multiplier();