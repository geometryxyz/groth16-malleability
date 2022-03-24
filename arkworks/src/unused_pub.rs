use ark_ff::{Field};
use ark_relations::{
    lc,
    r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError},
};

struct Circuit<F: Field> {
    a: Option<F>,
    b: Option<F>,
    x: Option<F>,
}

impl<ConstraintF: Field> ConstraintSynthesizer<ConstraintF> for Circuit<ConstraintF> {
    fn generate_constraints(
        self,
        cs: ConstraintSystemRef<ConstraintF>,
    ) -> Result<(), SynthesisError> {
        let a = cs.new_witness_variable(|| self.a.ok_or(SynthesisError::AssignmentMissing))?;
        let b = cs.new_witness_variable(|| self.b.ok_or(SynthesisError::AssignmentMissing))?;
        let c = cs.new_input_variable(|| {
            let mut a = self.a.ok_or(SynthesisError::AssignmentMissing)?;
            let b = self.b.ok_or(SynthesisError::AssignmentMissing)?;

            a.mul_assign(&b);
            Ok(a)
        })?;

        let _x = cs.new_input_variable(|| self.x.ok_or(SynthesisError::AssignmentMissing))?;

        cs.enforce_constraint(lc!() + a, lc!() + b, lc!() + c)?;

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

    #[test]
    fn valid_proof() {

        let rng = &mut test_rng();

        let params =
            generate_random_parameters::<Bls12_381, _, _>(Circuit { a: None, b: None, x: None }, rng).unwrap();

        let pvk = prepare_verifying_key::<Bls12_381>(&params.vk);

        let a = Fr::from(2 as u64);
        let b = Fr::from(2 as u64);
        let x = Fr::from(1 as u64);

        let c = Fr::from(4 as u64);

        let proof = create_random_proof(
            Circuit {
                a: Some(a),
                b: Some(b),
                x: Some(x)
            },
            &params,
            rng,
        )
        .unwrap();

        assert!(verify_proof(&pvk, &proof, &[c, x]).unwrap());
    }

    #[test]
    fn malleable_proof() {
        let rng = &mut test_rng();

        let params =
            generate_random_parameters::<Bls12_381, _, _>(Circuit { a: None, b: None, x: None }, rng).unwrap();

        let pvk = prepare_verifying_key::<Bls12_381>(&params.vk);

        let a = Fr::from(2 as u64);
        let b = Fr::from(2 as u64);
        let x = Fr::from(1 as u64);

        let c = Fr::from(4 as u64);

        let proof = create_random_proof(
            Circuit {
                a: Some(a),
                b: Some(b),
                x: Some(x)
            },
            &params,
            rng,
        )
        .unwrap();

        assert!(verify_proof(&pvk, &proof, &[c, a]).unwrap());
    }
}