;; ProofGraph Fungible Token (PGT)

(define-constant CONTRACT-VERSION u1)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-INPUT (err u101))
(define-constant ERR-ALREADY-EXISTS (err u102))
(define-constant ERR-NOT-FOUND (err u103))
(define-constant ERR-INSUFFICIENT-BALANCE (err u104))
(define-constant ERR-INTERNAL (err u105))
(define-constant ERR-MINTER-NOT-SET (err u302))

;; Owner at deploy time
(define-constant CONTRACT-OWNER tx-sender)

;; Metadata
(define-data-var token-name (string-ascii 32) "ProofGraph Token")
(define-data-var token-symbol (string-ascii 16) "PGT")
(define-data-var token-decimals uint u6)

;; Supply and balances
(define-data-var total-supply uint u0)
(define-map balances
  principal
  uint
)

;; Minter (contract allowed to mint)
(define-data-var minter (optional principal) none)

;; Internal helpers
(define-read-only (get-balance (who principal))
  (default-to u0 (map-get? balances who))
)

;; Public: transfer tokens from tx-sender to recipient
(define-public (transfer
    (recipient principal)
    (amount uint)
  )
  (begin
    (asserts! (> amount u0) ERR-INVALID-INPUT)
    (let (
        (sender tx-sender)
        (from-bal (get-balance tx-sender))
      )
      (asserts! (>= from-bal amount) ERR-INSUFFICIENT-BALANCE)
      (map-set balances sender (- from-bal amount))
      (map-set balances recipient (+ (get-balance recipient) amount))
      (ok true)
    )
  )
)

;; Admin: set minter contract/principal
(define-public (set-minter (who principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set minter (some who))
    (ok true)
  )
)

;; Minter-only: mint tokens to recipient
(define-public (mint-to
    (recipient principal)
    (amount uint)
  )
  (begin
    (asserts! (> amount u0) ERR-INVALID-INPUT)
    (let ((m (var-get minter)))
      (match m
        minter-principal (begin
          (asserts! (is-eq tx-sender minter-principal) ERR-NOT-AUTHORIZED)
          (map-set balances recipient (+ (get-balance recipient) amount))
          (var-set total-supply (+ (var-get total-supply) amount))
          (ok amount)
        )
        ERR-MINTER-NOT-SET
      )
    )
  )
)

;; Optional: burn (owner only)
(define-public (burn
    (from principal)
    (amount uint)
  )
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-INPUT)
    (let ((bal (get-balance from)))
      (asserts! (>= bal amount) ERR-INSUFFICIENT-BALANCE)
      (map-set balances from (- bal amount))
      (var-set total-supply (- (var-get total-supply) amount))
      (ok amount)
    )
  )
)

;; Read-only metadata and views
(define-read-only (get-name)
  (var-get token-name)
)
(define-read-only (get-symbol)
  (var-get token-symbol)
)
(define-read-only (get-decimals)
  (var-get token-decimals)
)
(define-read-only (get-total-supply)
  (var-get total-supply)
)
(define-read-only (get-balance-of (who principal))
  (get-balance who)
)
