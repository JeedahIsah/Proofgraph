;; ProofGraph Core Contract
;; Core utilities and constants for the ProofGraph ecosystem

;; Contract version
(define-constant CONTRACT-VERSION u1)

;; Core error constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-INPUT (err u101))
(define-constant ERR-ALREADY-EXISTS (err u102))
(define-constant ERR-NOT-FOUND (err u103))
(define-constant ERR-INSUFFICIENT-BALANCE (err u104))
(define-constant ERR-SYSTEM-ERROR (err u105))

;; Contract owner (deployer)
(define-constant CONTRACT-OWNER tx-sender)

;; Helper function to check if caller is contract owner
(define-read-only (is-contract-owner (caller principal))
  (is-eq caller CONTRACT-OWNER))

;; Helper function to validate principal
(define-read-only (is-valid-principal (address principal))
  (not (is-eq address 'SP000000000000000000002Q6VF78)))

;; Helper function to get current block height
(define-read-only (get-current-height)
  block-height)

;; Helper function to get current timestamp approximation
(define-read-only (get-current-timestamp)
  (+ u1640995200 (* block-height u600)))
