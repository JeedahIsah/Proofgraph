;; Data Verification Contract v1
;; Core data anchoring and verification functionality for ProofGraph

;; Contract version
(define-constant CONTRACT-VERSION u1)

;; Error constants specific to data verification
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-DATA-EXISTS (err u101))
(define-constant ERR-INSUFFICIENT-FEE (err u102))
(define-constant ERR-INVALID-DATA (err u103))
(define-constant ERR-NOT-FOUND (err u104))
(define-constant ERR-SYSTEM-ERROR (err u105))
(define-constant ERR-INVALID-METADATA (err u106))
(define-constant ERR-DATA-TOO-LARGE (err u107))
(define-constant ERR-ALREADY-EXISTS (err u108))
(define-constant ERR-CONTRACT-NOT-INITIALIZED (err u109))

;; Contract deployer (admin)
(define-constant CONTRACT-ADMIN tx-sender)

;; System configuration constants
(define-constant DEFAULT-MIN-FEE u1000)
(define-constant DEFAULT-MAX-DATA-SIZE u1048576)
(define-constant MAX-METADATA-URI-LENGTH u256)

;; Data maps for verification records
(define-map verification-records 
  uint 
  {
    contributor: principal,
    data-hash: (buff 32),
    timestamp: uint,
    metadata-uri: (string-ascii 256),
    verification-count: uint,
    fee-paid: uint
  })

;; Track data hash uniqueness to prevent duplicates
(define-map data-hashes (buff 32) uint)

;; System configuration parameters
(define-map system-config 
  (string-ascii 32)
  uint)

;; Verification ID counter for generating unique IDs
(define-data-var verification-id-counter uint u0)

;; Contract initialization flag
(define-data-var contract-initialized bool false);
; Initialize contract with default parameters
(define-public (initialize-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-ADMIN) ERR-NOT-AUTHORIZED)
    (asserts! (not (var-get contract-initialized)) ERR-ALREADY-EXISTS)
    
    ;; Set default system parameters
    (map-set system-config "min-fee" DEFAULT-MIN-FEE)
    (map-set system-config "max-data-size" DEFAULT-MAX-DATA-SIZE)
    (map-set system-config "total-records" u0)
    (map-set system-config "total-verifications" u0)
    (map-set system-config "total-fees-collected" u0)
    
    ;; Mark contract as initialized
    (var-set contract-initialized true)
    
    ;; Emit initialization event
    (print {
      event: "contract-initialized",
      admin: CONTRACT-ADMIN,
      version: CONTRACT-VERSION,
      min-fee: DEFAULT-MIN-FEE,
      max-data-size: DEFAULT-MAX-DATA-SIZE
    })
    
    (ok true)))

;; Helper function to check if caller is admin
(define-read-only (is-admin (caller principal))
  (is-eq caller CONTRACT-ADMIN))

;; Helper function to get system parameter
(define-read-only (get-system-param (param-name (string-ascii 32)))
  (default-to u0 (map-get? system-config param-name)))

;; Helper function to validate data hash format
(define-read-only (is-valid-data-hash (data-hash (buff 32)))
  (is-eq (len data-hash) u32))

;; Helper function to validate metadata URI
(define-read-only (is-valid-metadata-uri (metadata-uri (string-ascii 256)))
  (and 
    (> (len metadata-uri) u0)
    (<= (len metadata-uri) MAX-METADATA-URI-LENGTH)))

;; Helper function to check if data hash already exists
(define-read-only (data-hash-exists (data-hash (buff 32)))
  (is-some (map-get? data-hashes data-hash)))

;; Helper function to get current timestamp approximation
(define-read-only (get-current-timestamp)
  (+ u1640995200 (* block-height u600)))

;; Get next verification ID
(define-private (get-next-verification-id)
  (let ((current-id (var-get verification-id-counter)))
    (var-set verification-id-counter (+ current-id u1))
    (+ current-id u1)))

;; Read-only function to get verification metadata by ID
(define-read-only (get-verification-metadata (verification-id uint))
  (map-get? verification-records verification-id))

;; Read-only function to get system statistics
(define-read-only (get-system-stats)
  {
    total-records: (get-system-param "total-records"),
    total-verifications: (get-system-param "total-verifications"),
    total-fees-collected: (get-system-param "total-fees-collected"),
    min-fee: (get-system-param "min-fee"),
    max-data-size: (get-system-param "max-data-size"),
    contract-version: CONTRACT-VERSION
  })

;; Read-only function to check if contract is initialized
(define-read-only (is-contract-initialized)
  (var-get contract-initialized))

;; Read-only function to get current verification ID counter
(define-read-only (get-current-verification-id)
  (var-get verification-id-counter))