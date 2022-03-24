use ark_ff::{Field};
use ark_relations::{
    lc,
    r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError},
};

struct Circuit<F: Field> {
    a: Option<F>,
    b: Option<F>,
    c: Option<F>,
    d: Option<F>,
}

impl<ConstraintF: Field> ConstraintSynthesizer<ConstraintF> for Circuit<ConstraintF> {
    fn generate_constraints(
        self,
        cs: ConstraintSystemRef<ConstraintF>,
    ) -> Result<(), SynthesisError> {

        let one = ConstraintF::from(1u8);
        let two = ConstraintF::from(2u8);
        let three = ConstraintF::from(3u8);

        let a = cs.new_input_variable(|| self.a.ok_or(SynthesisError::AssignmentMissing))?;
        let b = cs.new_input_variable(|| self.b.ok_or(SynthesisError::AssignmentMissing))?;

        let c = cs.new_witness_variable(|| self.c.ok_or(SynthesisError::AssignmentMissing))?;
        let d = cs.new_witness_variable(|| self.d.ok_or(SynthesisError::AssignmentMissing))?;

        let c_minus_one = cs.new_witness_variable(|| {
            let c = self.c.ok_or(SynthesisError::AssignmentMissing)?;
            Ok(c - one)
        })?;

        let d_minus_three = cs.new_witness_variable(|| {
            let d = self.d.ok_or(SynthesisError::AssignmentMissing)?;
            Ok(d - three)
        })?;

        cs.enforce_constraint(
            lc!() + a + (two, b), 
            lc!() + c, 
            lc!() + d)?;

        cs.enforce_constraint(
            lc!() + a + (two, b), 
            lc!() + c_minus_one, 
            lc!() + d_minus_three)?;

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use ark_groth16::{
        create_random_proof, generate_random_parameters, prepare_verifying_key,
        verify_proof,
    };
    use super::*;
    use ark_bls12_381::{Bls12_381, Fr};
    use ark_std::test_rng;
    use ark_ff::Zero;

    #[test]
    fn valid_proof() {

        let rng = &mut test_rng();

        let params =
            generate_random_parameters::<Bls12_381, _, _>(Circuit { a: None, b: None, c: None, d: None }, rng).unwrap();

        let pvk = prepare_verifying_key::<Bls12_381>(&params.vk);

        let a = Fr::from(1 as u64);
        let b = Fr::from(1 as u64);
        let c = Fr::from(6 as u64);
        let d = Fr::from(18 as u64);

        let proof = create_random_proof(
            Circuit {
                a: Some(a),
                b: Some(b),
                c: Some(c),
                d: Some(d),
            },
            &params,
            rng,
        )
        .unwrap();

        assert!(verify_proof(&pvk, &proof, &[a, b]).unwrap());
    }

    #[test]
    fn malleable_proof() {
        let rng = &mut test_rng();

        let params =
            generate_random_parameters::<Bls12_381, _, _>(Circuit { a: None, b: None, c: None, d: None }, rng).unwrap();

        let pvk = prepare_verifying_key::<Bls12_381>(&params.vk);

        let a = Fr::from(1 as u64);
        let b = Fr::from(1 as u64);
        let c = Fr::from(6 as u64);
        let d = Fr::from(18 as u64);

        let proof = create_random_proof(
            Circuit {
                a: Some(a),
                b: Some(b),
                c: Some(c),
                d: Some(d),
            },
            &params,
            rng,
        )
        .unwrap();

        let two = Fr::from(2u8);
        let a = a + two*b;
        let b = Fr::zero();

        assert!(verify_proof(&pvk, &proof, &[a, b]).unwrap());
    }
}