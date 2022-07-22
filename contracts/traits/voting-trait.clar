(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-trait voting-trait
	(
		(add-proposal (<proposal-trait> {startBlockHeight: uint, endBlockHeight: uint, proposer: principal}) (response bool uint))
	)
)
