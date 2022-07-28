;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     ___  ___  ____  ___  ____  _______   __               
;;    / _ \/ _ \/ __ \/ _ \/ __ \/ __/ _ | / /               
;;   / ___/ , _/ /_/ / ___/ /_/ /\ \/ __ |/ /__              
;;  /_/  /_/|_|\____/_/   \____/___/_/ |_/____/              
;;                                                         

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(let
			(
				(decimals (unwrap-panic (contract-call? .token get-decimals)))
				(microTokens (pow u10 decimals))
			)

			;; Enable extensions.
			(try! (contract-call? .mega-dao set-extensions
				(list
					{extension: .vault, enabled: true}
					{extension: .token, enabled: true}
					{extension: .proposal-submission, enabled: true}
					{extension: .proposal-voting, enabled: true}
					{extension: .emergency-execute, enabled: true}
          {extension: .emergency-proposals, enabled: true}
				)
			))

			;; Set emergency team
			(try! (contract-call? .emergency-proposals set-emergency-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))

    	;; Set emergency signers.
    	(try! (contract-call? .emergency-execute set-executive-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))
			(try! (contract-call? .emergency-execute set-executive-team-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true))
			(try! (contract-call? .emergency-execute set-signals-required u2))

			;; Whitelist token
			(try! (contract-call? .vault set-whitelist .token true))
			
			;; Mint 100,000 tokens to the deployer.
			(try! (contract-call? .token mint (* microTokens u150) sender))
			(try! (contract-call? .token mint (* microTokens u1) 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
			

			(print {message: "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.", sender: sender})
			(ok true)
		)
	)
)
