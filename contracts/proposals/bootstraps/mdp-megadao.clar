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

;; Title: MegaDAO Initializer
;; Author: StackerDAO Dev Team
;; Type: Bootstrap

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(let
			(
				(decimals (unwrap-panic (contract-call? .mega-token get-decimals)))
				(microTokens (pow u10 decimals))
			)

			;; Enable extensions.
			(try! (contract-call? .mega-dao set-extensions
				(list
					{extension: .mde-vault, enabled: true}
					{extension: .mega-token, enabled: true}
					{extension: .mde-emergency-execute, enabled: true}
          {extension: .mde-emergency-proposals, enabled: true}
				)
			))

			;; Set emergency team
			(try! (contract-call? .mde-emergency-proposals set-emergency-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))

    	;; Set emergency signers.
    	(try! (contract-call? .mde-emergency-execute set-executive-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))
			(try! (contract-call? .mde-emergency-execute set-executive-team-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true))
			(try! (contract-call? .mde-emergency-execute set-signals-required u2))

			;; Whitelist token
			(try! (contract-call? .mde-vault set-whitelist .mega-token true))

			;; Change minimum start delay
			(try! (contract-call? .mde-proposal-submission set-parameter "minimumProposalStartDelay" u25))

			;; Change duration of voting
			(try! (contract-call? .mde-proposal-submission set-parameter "proposalDuration" u75))

			;; Change execution delay
			(try! (contract-call? .mde-snapshot-voting set-parameter "executionDelay" u25))

			;; Mint 237,500k tokens to the DAO treasury upon initialization.
			(try! (contract-call? .mega-token mint (* microTokens u700000) .mde-vault))
			
			;; Mint 100,000 tokens to the deployer.
			(try! (contract-call? .mega-token mint (* microTokens u100000) sender))
			

			(print {message: "...to be a completely separate network and separate block chain, yet share CPU power with Bitcoin.", sender: sender})
			(ok true)
		)
	)
)
