;; Data Verification Contract v1
;; Core data anchoring and verification functionality for ProofGraph

;; Contract version
(define-constant CONTRACT-VERSION u1)

;; Error constants specific to data verification
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-DATA-EXISTS (err u201))
(define-constant ERR-INSUFFICIENT-FEE (err u202))
(define-constant ERR-INVALID-DATA (err u203))
(define-constant ERR-INVALID-METADATA (err u204))
(define-constant ERR-DATA-TOO-LARGE (err u205))
(define-constant ERR-CONTRACT-NOT-INITIALIZED (err u206))
(define-constant ERR-ALREADY-EXISTS (err u102))
(define-constant ERR-NOT-FOUND (err u104))

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
(define-data-var contract-initialized bool false)

;; Initialize contract with default parameters
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

;; Read-only function to get verification record by data hash
(define-read-only (get-verification-by-hash (data-hash (buff 32)))
  (match (map-get? data-hashes data-hash)
    verification-id (map-get? verification-records verification-id)
    none))

;; Read-only function to check if verification ID exists
(define-read-only (verification-exists (verification-id uint))
  (is-some (map-get? verification-records verification-id)))

;; Read-only function to get contributor's verification count
(define-read-only (get-contributor-stats (contributor principal))
  (let (
    (total-records (get-system-param "total-records"))
  )
    ;; Note: This is a simplified version. In a production system,
    ;; you might want to maintain a separate map for contributor statistics
    ;; for better performance with large datasets
    {
      contributor: contributor,
      estimated-contributions: u0  ;; Placeholder - would need iteration to calculate exactly
    }))

;; Read-only function to get verification history summary
(define-read-only (get-verification-history-summary)
  {
    total-records: (get-system-param "total-records"),
    total-verifications: (get-system-param "total-verifications"),
    total-fees-collected: (get-system-param "total-fees-collected"),
    current-verification-id: (var-get verification-id-counter),
    contract-initialized: (var-get contract-initialized)
  })

;; Read-only function to get detailed system metrics
(define-read-only (get-detailed-system-metrics)
  {
    contract-version: CONTRACT-VERSION,
    contract-admin: CONTRACT-ADMIN,
    total-records: (get-system-param "total-records"),
    total-verifications: (get-system-param "total-verifications"),
    total-fees-collected: (get-system-param "total-fees-collected"),
    min-fee: (get-system-param "min-fee"),
    max-data-size: (get-system-param "max-data-size"),
    current-verification-id: (var-get verification-id-counter),
    contract-initialized: (var-get contract-initialized),
    current-block-height: block-height,
    estimated-timestamp: (get-current-timestamp)
  })

;; Read-only function to validate verification parameters
(define-read-only (validate-verification-params 
    (verification-id uint)
    (data-hash (buff 32)))
  {
    valid-verification-id: (verification-exists verification-id),
    valid-data-hash: (is-valid-data-hash data-hash),
    contract-initialized: (var-get contract-initialized)
  })

;; Public function to anchor data with validation
(define-public (anchor-data 
    (data-hash (buff 32))
    (metadata-uri (string-ascii 256))
    (fee uint))
  (let (
    (min-fee (get-system-param "min-fee"))
    (verification-id (get-next-verification-id))
    (current-timestamp (get-current-timestamp))
  )
    ;; Validate contract is initialized
    (asserts! (var-get contract-initialized) ERR-CONTRACT-NOT-INITIALIZED)
    
    ;; Validate data hash format
    (asserts! (is-valid-data-hash data-hash) ERR-INVALID-DATA)
    
    ;; Validate metadata URI
    (asserts! (is-valid-metadata-uri metadata-uri) ERR-INVALID-METADATA)
    
    ;; Check if data hash already exists (prevent duplicates)
    (asserts! (not (data-hash-exists data-hash)) ERR-DATA-EXISTS)
    
    ;; Validate fee meets minimum requirement
    (asserts! (>= fee min-fee) ERR-INSUFFICIENT-FEE)
    
    ;; Transfer fee to contract (STX payment)
    (try! (stx-transfer? fee tx-sender (as-contract tx-sender)))
    
    ;; Store verification record
    (map-set verification-records verification-id {
      contributor: tx-sender,
      data-hash: data-hash,
      timestamp: current-timestamp,
      metadata-uri: metadata-uri,
      verification-count: u0,
      fee-paid: fee
    })
    
    ;; Track data hash to prevent duplicates
    (map-set data-hashes data-hash verification-id)
    
    ;; Update system statistics
    (map-set system-config "total-records" (+ (get-system-param "total-records") u1))
    (map-set system-config "total-fees-collected" (+ (get-system-param "total-fees-collected") fee))
    
    ;; Emit data anchoring event
    (print {
      event: "data-anchored",
      verification-id: verification-id,
      contributor: tx-sender,
      data-hash: data-hash,
      metadata-uri: metadata-uri,
      fee-paid: fee,
      timestamp: current-timestamp
    })
    
    ;; Return verification ID
    (ok verification-id)))

;; Public function to verify data integrity against stored verification record
(define-public (verify-data 
    (verification-id uint)
    (data-hash (buff 32)))
  (let (
    (verification-record (map-get? verification-records verification-id))
    (current-timestamp (get-current-timestamp))
  )
    ;; Validate contract is initialized
    (asserts! (var-get contract-initialized) ERR-CONTRACT-NOT-INITIALIZED)
    
    ;; Validate data hash format
    (asserts! (is-valid-data-hash data-hash) ERR-INVALID-DATA)
    
    ;; Check if verification record exists
    (match verification-record
      record
      (let (
        (stored-hash (get data-hash record))
        (contributor (get contributor record))
        (timestamp (get timestamp record))
        (current-count (get verification-count record))
        (verified (is-eq data-hash stored-hash))
      )
        ;; Update verification count
        (map-set verification-records verification-id 
          (merge record { verification-count: (+ current-count u1) }))
        
        ;; Update system verification statistics
        (map-set system-config "total-verifications" 
          (+ (get-system-param "total-verifications") u1))
        
        ;; Emit verification event
        (print {
          event: "data-verified",
          verification-id: verification-id,
          contributor: contributor,
          verified: verified,
          verifier: tx-sender,
          timestamp: current-timestamp
        })
        
        ;; Return verification result with metadata
        (ok {
          contributor: contributor,
          timestamp: timestamp,
          verified: verified
        }))
      
      ;; Verification ID not found
      (err u104))))  ;; ERR-NOT-FOUND
