;; ProofGraph Staking & Rewards (virtual staking, rewards minted in PGT)

(define-constant CONTRACT-VERSION u1)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-INPUT (err u101))
(define-constant ERR-ALREADY-EXISTS (err u102))
(define-constant ERR-NOT-FOUND (err u103))
(define-constant ERR-PAUSED (err u300))
(define-constant ERR-INSUFFICIENT-STAKE (err u301))

;; Owner at deploy time
(define-constant CONTRACT-OWNER tx-sender)

;; Reward scaling (fixed-point: 1e6)
(define-constant SCALE u1000000)

;; Config/state
(define-data-var reward-rate uint u1000) ;; tokens * 1e-6 per block per staked unit
(define-data-var paused bool false)
(define-data-var initialized bool false)

(define-map user-stakes
  principal
  {
    amount: uint,
    last-height: uint,
    unclaimed: uint,
  }
)

;; Internal: get or default stake record
(define-read-only (get-stake (who principal))
  (default-to {
    amount: u0,
    last-height: block-height,
    unclaimed: u0,
  }
    (map-get? user-stakes who)
  )
)

;; Internal: compute pending rewards at current block
(define-read-only (pending-for (who principal))
  (let (
      (s (get-stake who))
      (delta (if (> block-height (get last-height s))
        (- block-height (get last-height s))
        u0
      ))
      (rate (var-get reward-rate))
    )
    (let ((accrued (/ (* (* (get amount s) rate) delta) SCALE)))
      (+ (get unclaimed s) accrued)
    )
  )
)

;; Admin: initialize once
(define-public (initialize)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (not (var-get initialized)) ERR-ALREADY-EXISTS)
    (var-set reward-rate u1000)
    (var-set paused false)
    (var-set initialized true)
    (ok true)
  )
)

;; Admin: set reward rate
(define-public (set-reward-rate (new-rate uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set reward-rate new-rate)
    (ok new-rate)
  )
)

;; Admin: pause/resume
(define-public (pause)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set paused true)
    (ok true)
  )
)

(define-public (resume)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set paused false)
    (ok true)
  )
)

;; Stake (virtual)
(define-public (stake (amount uint))
  (begin
    (asserts! (var-get initialized) ERR-NOT-FOUND)
    (asserts! (not (var-get paused)) ERR-PAUSED)
    (asserts! (> amount u0) ERR-INVALID-INPUT)
    (let (
        (who tx-sender)
        (s (get-stake tx-sender))
        (new-unclaimed (pending-for tx-sender))
        (new-amount (+ (get amount s) amount))
      )
      (map-set user-stakes who {
        amount: new-amount,
        last-height: block-height,
        unclaimed: new-unclaimed,
      })
      (ok new-amount)
    )
  )
)

;; Unstake (virtual)
(define-public (unstake (amount uint))
  (begin
    (asserts! (var-get initialized) ERR-NOT-FOUND)
    (asserts! (not (var-get paused)) ERR-PAUSED)
    (asserts! (> amount u0) ERR-INVALID-INPUT)
    (let ((s (get-stake tx-sender)))
      (asserts! (>= (get amount s) amount) ERR-INSUFFICIENT-STAKE)
      (let (
          (new-unclaimed (pending-for tx-sender))
          (left (- (get amount s) amount))
        )
        (map-set user-stakes tx-sender {
          amount: left,
          last-height: block-height,
          unclaimed: new-unclaimed,
        })
        (ok left)
      )
    )
  )
)

;; Claim rewards -> mints PGT to caller via pg-token
(define-public (claim)
  (begin
    (asserts! (var-get initialized) ERR-NOT-FOUND)
    (asserts! (not (var-get paused)) ERR-PAUSED)
    (let ((owed (pending-for tx-sender)))
      (map-set user-stakes tx-sender {
        amount: (get amount (get-stake tx-sender)),
        last-height: block-height,
        unclaimed: u0,
      })
      (if (> owed u0)
        (match (contract-call? .pg-token mint-to tx-sender owed)
          okv (ok owed)
          err (err err)
        )
        (ok u0)
      )
    )
  )
)

;; Views
(define-read-only (pending-rewards-of (who principal))
  (pending-for who)
)
(define-read-only (get-stake-of (who principal))
  (get-stake who)
)
(define-read-only (is-paused)
  (var-get paused)
)
(define-read-only (get-reward-rate)
  (var-get reward-rate)
)
