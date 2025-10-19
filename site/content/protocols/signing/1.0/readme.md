---
title: Signing
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/signing/1.0
status: Draft
summary: A modular, transport-agnostic protocol for requesting, producing, coordinating, and verifying digital signatures over arbitrary payloads (documents, transactions, packages, attestations) with single-signer and multi-party modes.
tags: [signing, signatures, multisig, cryptography, pdf, evm, bitcoin]
authors:
  - name: Vinay Singh
    email: vinay@verid.id
---

## Summary

The **Signing Protocol** provides a unified DIDComm-based approach to digital signature orchestration across heterogeneous media types including PDF documents, blockchain transactions, software packages, and cryptographic attestations. It supports single-signer workflows, threshold signatures (N-of-M), cryptographic aggregation (MuSig2, FROST, BLS), and contract-based multisig (e.g., Gnosis Safe, ERC-1271).

### Goals

- **Unified**: One protocol to drive signing across heterogeneous media (PDF, CMS, JWT, EVM, PSBT, OCI, etc.)
- **Modular**: Pluggable canonicalizers, signature suites, aggregators, and policies
- **Multisig**: Support signature collection (N independent sigs), cryptographic aggregation (e.g., MuSig2/FROST/BLS), and contract/account-based multisig (e.g., Gnosis Safe, ERC-1271)
- **Auditable**: Strong consent mechanisms, digest pinning (WYSIWYS - What You See Is What You Sign), idempotency, and receipts
- **Transport-agnostic**: Works seamlessly over DIDComm v2 message routing and pickup

### Non-Goals

This protocol does not define the cryptographic primitives themselves (e.g., ECDSA, EdDSA algorithms), nor does it replace existing signature standards. Instead, it orchestrates signature workflows using those standards as pluggable modules.

## Motivation

Digital signature workflows today are fragmented across domains:
- **Documents**: Adobe PDF signatures, CAdES/PAdES standards
- **Blockchain**: Ethereum transaction signing, Bitcoin PSBT coordination, Safe multisig
- **Supply Chain**: Sigstore/cosign for container images
- **Identity**: Verifiable Credentials and DID authentication

Each domain uses proprietary APIs and coordination mechanisms. This protocol provides a **universal coordination layer** that:

1. **Abstracts signature mechanics** behind pluggable modules (canonicalizers, suites, aggregators)
2. **Provides multisig orchestration** for threshold and aggregated signatures
3. **Enforces security invariants** like digest pinning and consent flows
4. **Enables auditability** through receipts and idempotency
5. **Works offline-first** via DIDComm message routing and pickup

## Roles

- **`requester`**: Party initiating a signing request. May be a document management system, blockchain application, or any service requiring signatures.
- **`signer`**: Party controlling a private key or smart account. The signer provides consent and produces signatures.
- **`coordinator`**: Orchestrates multi-signer sessions, collecting partial signatures and triggering aggregation. May be the same party as the requester or a separate orchestration service.
- **`observer`**: Read-only recipient for audit trails or UX mirroring. Observers receive session updates but do not participate in signing.

### Role Cardinality

- A session MUST have exactly one `requester`
- A session MUST have at least one `signer`
- For multisig sessions (`mode.type` = `threshold`), there MUST be a `coordinator` (may be same as requester)
- A session MAY have zero or more `observer` roles

## Terminology

- **Canonicalizer**: Module that converts an input to canonical bytes and provides a digest method
- **Signature Suite**: Module that produces/verifies signatures for a class of payloads/keys
- **Aggregator**: Module that combines partial signatures and/or executes on-chain submissions to produce a final artifact
- **Policy**: Module that enforces business/authorization constraints
- **Session**: A scoped interaction for signing a specific object (or set of objects)
- **WYSIWYS**: "What You See Is What You Sign" - the principle that signers must view content derived from the same canonical bytes they are signing

Normative keywords (MUST, SHOULD, MAY) are to be interpreted as in RFC 2119.

## States

### Single-Signer State Machine

```
[idle] → propose-signing (optional) → request-signing → consent (optional) →
partial-signature → provide-artifacts → ack → [completed]
                                    ↓
                                 decline/problem-report → [failed]
```

**States:**
- `idle`: No active signing session
- `proposed`: Capabilities exchanged, session parameters negotiated
- `requested`: Signing request received by signer
- `consented`: Signer has approved and provided key binding proof
- `signed`: Signature produced
- `artifacts-provided`: Final signed artifacts delivered
- `completed`: Session acknowledged and finalized
- `failed`: Session declined or encountered errors

**Events (Messages):**
- `propose-signing`: Capability discovery and negotiation
- `request-signing`: Initiate signing with object descriptor, suite, and constraints
- `consent`: Human approval with key binding proof
- `partial-signature`: Submit signature (or signature fragment)
- `provide-artifacts`: Deliver final signed artifacts
- `ack`: Receipt acknowledgment
- `decline`: Reject signing request
- `problem-report`: Error reporting

### Threshold State Machine (N-of-M Collection)

```
[idle] → propose-signing (optional) → request-signing →
[consent x M (optional)] → [partial-signature x M] →
combine (threshold_met) → provide-artifacts → ack → [completed]
```

**Additional States:**
- `collecting`: Gathering partial signatures from M signers
- `threshold-met`: N of M required signatures collected
- `aggregating`: Coordinator combining signatures

**Additional Events:**
- `combine`: Announce aggregation status or trigger on-chain submission

### Cryptographic Aggregation (FROST/MuSig2)

Similar to threshold state, but with **multi-round** partial-signature messages carrying commitments, nonces, and signature shares across multiple rounds until combine can aggregate to a single signature.

**Rounds:**
- Round 1: Commitment/nonce exchange
- Round 2+: Signature share computation
- Final: Aggregation to single signature

### Contract/Account-based Multisig (e.g., Safe)

```
request-signing (includes tx descriptor/hash) →
[confirmations as partial-signature x N] →
combine (submit/execution) → provide-artifacts (txid/receipt) → ack
```

**Smart Contract States:**
- `pending`: Transaction proposed but not confirmed
- `confirmed`: Sufficient confirmations collected
- `executed`: Transaction submitted to blockchain
- `finalized`: Transaction included in block

## Data Model

### Signable Object Descriptor

A `SignableObject` describes what is being signed:

```json
{
  "id": "so_7c9b...",
  "media_type": "application/pdf",
  "canonicalization": {
    "method": "pdf-incremental-update@1",
    "parameters": {
      "byte_range": [0, 123, 456, 789]
    }
  },
  "digest": {
    "alg": "sha-256",
    "value": "mVxT...=="
  },
  "display_hints": {
    "title": "NDA v3.1",
    "preview_links": ["https://.../nda.pdf"],
    "summary": "Non-Disclosure Agreement"
  }
}
```

**Required Fields:**
- `id`: Unique identifier for this signable object
- `media_type`: MIME type of the payload
- `canonicalization`: Method and parameters for canonical byte representation
- `digest`: Cryptographic digest over canonical bytes

**Optional Fields:**
- `display_hints`: Human-readable metadata for consent UX

**Invariants:**
- `digest` MUST be computed over canonical bytes as specified by `canonicalization`
- Signers MUST verify digest matches their local canonicalization before signing

### Session

A `Session` describes the coordination mode and participants:

```json
{
  "session_id": "sess_b5f1...",
  "mode": {
    "type": "single"
  }
}
```

For threshold/multisig:

```json
{
  "session_id": "sess_b5f1...",
  "mode": {
    "type": "threshold"
  },
  "threshold": {
    "scheme": "n-of-m",
    "n": 2,
    "m": 3,
    "signers": ["did:ex:s1", "did:ex:s2", "did:ex:s3"],
    "aggregation": "none"
  }
}
```

**Mode Types:**
- `single`: One signer produces one signature
- `threshold`: N-of-M signature collection or aggregation

**Threshold Schemes:**
- `n-of-m`: Collect N signatures from M designated signers
- `cryptographic`: MuSig2, FROST, BLS aggregation
- `contract`: On-chain multisig (Safe, multi-owner accounts)

### Suite & Constraints

The `Suite` specifies the signature algorithm and constraints:

```json
{
  "suite": "evm-eip712@1",
  "key_binding": {
    "controller": "eip155:1:0xAbC...",
    "proof_purpose": "assertionMethod"
  },
  "constraints": {
    "not_before": "2025-09-20T16:00:00Z",
    "expires_time": "2025-10-20T16:00:00Z",
    "intended_audience": ["did:example:acme"],
    "use_limit": 1,
    "policy_uri": "https://.../policies/pci"
  }
}
```

**Required Fields:**
- `suite`: Signature suite identifier from registry (§7.2)
- `key_binding.controller`: DID or blockchain address of signing key

**Optional Constraints:**
- `not_before`: Signature not valid before this time
- `expires_time`: Signature expires after this time
- `intended_audience`: DIDs for which signature is intended
- `use_limit`: Maximum number of times signature can be used
- `policy_uri`: Reference to external policy document

### Idempotency & Receipts

- `idempotency_key` SHOULD be present in `request-signing` to prevent duplicate processing
- `ack` SHOULD be a compact JWS over `{received, session_id, receipt_jti, step_hash}` for non-repudiation

## Message Reference

All messages are DIDComm v2 JWM (JSON Web Messages) envelopes. Threading uses `thid` (thread ID) and `pthid` (parent thread ID). Large payloads use DIDComm attachments with `data.links` + `hash` for integrity verification.

### propose-signing

**Purpose:** Capability discovery and negotiation before initiating a signing session.

**Sender:** `requester`
**Receiver:** `signer` or `coordinator`

**Message Type URI:**
```
https://didcomm.org/signing/1.0/propose-signing
```

**Body:**
```json
{
  "session": {
    "session_id": "sess_...",
    "mode": {
      "type": "threshold"
    },
    "threshold": {
      "scheme": "n-of-m",
      "n": 2,
      "m": 3
    }
  },
  "capabilities": {
    "supported_suites": ["evm-eip712@1", "pades-b-lta@1", "psbt@2"],
    "max_attachment_size": 10485760
  }
}
```

**Validation:**
- `session.session_id` MUST be unique and high-entropy
- `capabilities.supported_suites` SHOULD list suite identifiers from registry (§7.2)

### request-signing

**Purpose:** Initiate signing of an object with specified suite and constraints.

**Sender:** `requester`
**Receiver:** `signer`

**Message Type URI:**
```
https://didcomm.org/signing/1.0/request-signing
```

**Body:**
```json
{
  "session": {
    "session_id": "sess_...",
    "mode": {"type": "single"}
  },
  "object": {
    "id": "so_...",
    "media_type": "application/pdf",
    "canonicalization": {"method": "pdf-incremental-update@1", "parameters": {...}},
    "digest": {"alg": "sha-256", "value": "..."}
  },
  "suite": {
    "suite": "pades-b-lta@1",
    "key_binding": {"controller": "did:ex:signer#key1"}
  },
  "idempotency_key": "txn_9f27...",
  "ui": {
    "must_display_summary": true
  }
}
```

**Attachments:**
- MAY carry full payloads (e.g., EIP-712 typed data, PSBT, PDF bytes) via `data.json` or `data.links` + `hash`

**Validation:**
- `session`, `object`, `suite` are REQUIRED
- `object.digest` MUST match canonicalized bytes
- `idempotency_key` SHOULD be unique per request

### consent

**Purpose:** Human approval and key binding proof before signing.

**Sender:** `signer`
**Receiver:** `requester` or `coordinator`

**Message Type URI:**
```
https://didcomm.org/signing/1.0/consent
```

**Body:**
```json
{
  "session_id": "sess_...",
  "object_id": "so_...",
  "key_binding_proof": {
    "type": "jws",
    "kid": "did:ex:signer#k1",
    "payload": "eyJpbnRlbnQiOiJzaWduIn0",
    "signature": "..."
  }
}
```

**Validation:**
- `key_binding_proof` MUST be verifiable with `suite.key_binding.controller`
- Payload SHOULD contain intent statement (e.g., "I consent to sign object so_...")

### partial-signature

**Purpose:** Submit a signature fragment, confirmation, or round data.

**Sender:** `signer`
**Receiver:** `requester` or `coordinator`

**Message Type URI:**
```
https://didcomm.org/signing/1.0/partial-signature
```

**Body (Single-round):**
```json
{
  "session_id": "sess_...",
  "object_id": "so_...",
  "signer": "did:ex:s2",
  "suite": "evm-eip712@1",
  "signature": {
    "format": "eip-712",
    "value": "0x...",
    "public_key_hint": "eip155:1:0xABC..."
  }
}
```

**Body (Multi-round, e.g., MuSig2/FROST):**
```json
{
  "session_id": "sess_...",
  "object_id": "so_...",
  "signer": "did:ex:s2",
  "suite": "schnorr-musig2@1",
  "round": 1,
  "data": {
    "nonceCommitment": "..."
  }
}
```

**Validation:**
- For single-round: `signature` MUST be present and verifiable
- For multi-round: `round` and `data` specify current round state
- `signer` MUST be in `session.threshold.signers` (if applicable)

### combine

**Purpose:** Announce aggregation status, threshold satisfaction, or on-chain submission.

**Sender:** `coordinator`
**Receiver:** `requester`, `signer`(s), `observer`(s)

**Message Type URI:**
```
https://didcomm.org/signing/1.0/combine
```

**Body:**
```json
{
  "session_id": "sess_...",
  "status": "threshold_met",
  "aggregation_result": {
    "type": "none",
    "artifact_link": "https://...",
    "digest": "sha-256:..."
  }
}
```

For on-chain execution:
```json
{
  "session_id": "sess_...",
  "status": "executed",
  "aggregation_result": {
    "type": "contract",
    "txid": "0x...",
    "chain_id": "eip155:1"
  }
}
```

**Aggregation Types:**
- `none`: Simple collection (bundle of N signatures)
- `math`: Cryptographic aggregation (MuSig2/FROST/BLS)
- `contract`: Smart contract multisig execution

### provide-artifacts

**Purpose:** Deliver final signed artifacts (signed PDF, CMS, transaction receipts, finalized PSBT, OCI signatures).

**Sender:** `coordinator` or `signer` (single-signer mode)
**Receiver:** `requester`

**Message Type URI:**
```
https://didcomm.org/signing/1.0/provide-artifacts
```

**Body:**
```json
{
  "session_id": "sess_...",
  "artifacts": [
    {
      "type": "pades-b-lta",
      "digest": "sha-256:mVxT...",
      "links": ["https://.../nda-signed.pdf"]
    }
  ]
}
```

**Attachments:**
- Artifacts MAY be attached directly or referenced via `links`

**Validation:**
- Each artifact MUST include `type`, `digest`, and `links` or inline data
- `digest` SHOULD be verified by requester

### ack

**Purpose:** Receipt and non-repudiation acknowledgment.

**Sender:** `requester`
**Receiver:** `signer`, `coordinator`

**Message Type URI:**
```
https://didcomm.org/signing/1.0/ack
```

**Body:**
```json
{
  "received": "provide-artifacts",
  "session_id": "sess_...",
  "receipt_jti": "rcpt_22a8..."
}
```

**Receipt:**
- MAY be a compact JWS over `{received, session_id, receipt_jti, step_hash}`
- Provides non-repudiation proof of delivery

### decline

**Purpose:** Reject a signing request.

**Sender:** `signer`
**Receiver:** `requester`

**Message Type URI:**
```
https://didcomm.org/signing/1.0/decline
```

**Body:**
```json
{
  "session_id": "sess_...",
  "reason": "User declined to sign"
}
```

### problem-report

**Purpose:** Error reporting per DIDComm conventions.

**Sender:** Any role
**Receiver:** Any role

**Message Type URI:**
```
https://didcomm.org/signing/1.0/problem-report
```

**Body:**
```json
{
  "code": "unsupported-suite",
  "explain": "Signer does not support PAdES LTA."
}
```

**Error Codes:** See Design By Contract section.

## Pluggable Modules

The protocol defines **registries** for canonicalizers, signature suites, aggregators, and policies. Implementations MUST reject unknown registry keys unless operating in permissive mode.

### Canonicalizers

Canonicalizers convert inputs to canonical bytes and compute digests.

| Registry Key | Description | Parameters |
|--------------|-------------|------------|
| `raw-bytes@1` | Identity canonicalization; signs raw bytes | None |
| `pdf-incremental-update@1` | PAdES byte ranges for incremental updates | `byte_range`: array of integers |
| `cms-detached@1` | Detached CMS for CAdES | Digest context |
| `eip-712@1` | EIP-712 typed data canonicalization | `domain`, `types`, `message` |
| `psbt@2` | PSBT (BIP-174/370) as base64 bytes | None |
| `oci-manifest@1` | OCI manifest for Sigstore/cosign | None |

### Signature Suites

Signature suites produce and verify signatures.

| Registry Key | Description | Output Format |
|--------------|-------------|---------------|
| `jws-ed25519@1` | Detached JWS with Ed25519 | JWS compact |
| `jws-secp256k1@1` | Detached JWS with secp256k1 | JWS compact |
| `pades-b-b@1` | PDF Advanced Electronic Signature (basic) | CMS blob |
| `pades-b-lta@1` | PAdES with Long-Term Archival (timestamp/OCSP) | CMS blob + evidence |
| `cades-bes@1` | CMS/CAdES Basic Electronic Signature | CMS blob |
| `evm-eth_sign@1` | EVM eth_sign (deprecated) | 65-byte hex |
| `evm-personal_sign@1` | EVM personal_sign | 65-byte hex |
| `evm-eip712@1` | EVM EIP-712 structured data signing | 65-byte hex |
| `evm-safe-tx@1` | Gnosis Safe transaction confirmation | Confirmation data |
| `erc-1271-check@1` | ERC-1271 contract signature verification | Boolean verification |
| `psbt@2` | PSBT input signing | Updated PSBT fragment |
| `schnorr-musig2@1` | MuSig2 aggregated Schnorr (multi-round) | Aggregated signature |
| `frost-ed25519@1` | FROST threshold EdDSA (multi-round) | Aggregated signature |
| `bls-aggregate@1` | BLS signature aggregation | Aggregated signature |
| `sigstore-fulcio@1` | Fulcio/OIDC key material + Rekor witness | Transparency log entry |

### Aggregators

Aggregators combine partial signatures or execute on-chain submissions.

| Registry Key | Description | Output |
|--------------|-------------|--------|
| `bundle-none@1` | Bundle N detached signatures (co-sign) | Array of signatures |
| `pdf-co-sign@1` | Merge incremental updates into final PAdES PDF | Signed PDF |
| `safe-exec@1` | Verify Safe confirmations and execute | Transaction ID |
| `psbt-finalize@2` | Finalize PSBT to hex transaction; optionally broadcast | Transaction hex + txid |
| `math-aggregate@1` | Combine MuSig2/FROST/BLS partials to one signature | Single signature |
| `oci-multi-sign@1` | Attach multiple signatures to OCI manifest | OCI signature bundle |

### Policies

Policies enforce business/authorization constraints.

| Registry Key | Description |
|--------------|-------------|
| `time-window@1` | Enforce `not_before` and `expires_time` |
| `audience@1` | Enforce `intended_audience` |
| `usage-limit@1` | Enforce `use_limit` |
| `vp-gate@1` | Require Verifiable Presentation proving role/entitlement |
| `spend-limit@1` | EVM field checks: token, amount, chainId |

## Basic Walkthrough

### Scenario: Single-Signer PDF Signing

**Participants:**
- **Requester:** Document management system (`did:ex:dms`)
- **Signer:** Alice (`did:ex:alice`)

**Flow:**

1. **Request**

Requester sends `request-signing` to Alice:

```json
{
  "type": "https://didcomm.org/signing/1.0/request-signing",
  "id": "msg1",
  "from": "did:ex:dms",
  "to": ["did:ex:alice"],
  "thid": "thread1",
  "body": {
    "session": {
      "session_id": "sess_abc123",
      "mode": {"type": "single"}
    },
    "object": {
      "id": "so_nda_v3",
      "media_type": "application/pdf",
      "canonicalization": {
        "method": "pdf-incremental-update@1",
        "parameters": {"byte_range": [0, 1234, 5678, 9012]}
      },
      "digest": {
        "alg": "sha-256",
        "value": "mVxT3jQ...=="
      },
      "display_hints": {
        "title": "NDA v3.1",
        "preview_links": ["https://dms.example/nda.pdf"]
      }
    },
    "suite": {
      "suite": "pades-b-lta@1",
      "key_binding": {
        "controller": "did:ex:alice#key1"
      }
    },
    "idempotency_key": "txn_nda_001"
  }
}
```

2. **Consent** (Optional but Recommended)

Alice reviews the PDF preview, verifies the digest, and sends `consent`:

```json
{
  "type": "https://didcomm.org/signing/1.0/consent",
  "id": "msg2",
  "from": "did:ex:alice",
  "to": ["did:ex:dms"],
  "thid": "thread1",
  "body": {
    "session_id": "sess_abc123",
    "object_id": "so_nda_v3",
    "key_binding_proof": {
      "type": "jws",
      "kid": "did:ex:alice#key1",
      "payload": "eyJpbnRlbnQiOiJzaWduIiwib2JqZWN0X2lkIjoic29fbmRhX3YzIn0",
      "signature": "..."
    }
  }
}
```

3. **Sign**

Alice's agent produces the PAdES-B-LTA signature and sends `partial-signature`:

```json
{
  "type": "https://didcomm.org/signing/1.0/partial-signature",
  "id": "msg3",
  "from": "did:ex:alice",
  "to": ["did:ex:dms"],
  "thid": "thread1",
  "body": {
    "session_id": "sess_abc123",
    "object_id": "so_nda_v3",
    "signer": "did:ex:alice",
    "suite": "pades-b-lta@1",
    "signature": {
      "format": "pades-b-lta",
      "value": "<base64-encoded CMS blob>",
      "timestamp_token": "<RFC3161 timestamp>",
      "ocsp_response": "<OCSP stapling>"
    }
  }
}
```

4. **Provide Artifacts**

Requester (or Alice's agent) sends the final signed PDF:

```json
{
  "type": "https://didcomm.org/signing/1.0/provide-artifacts",
  "id": "msg4",
  "from": "did:ex:dms",
  "to": ["did:ex:alice"],
  "thid": "thread1",
  "body": {
    "session_id": "sess_abc123",
    "artifacts": [
      {
        "type": "pades-b-lta",
        "digest": "sha-256:9fX2...",
        "links": ["https://dms.example/nda-signed.pdf"]
      }
    ]
  }
}
```

5. **Acknowledge**

Alice's agent acknowledges receipt:

```json
{
  "type": "https://didcomm.org/signing/1.0/ack",
  "id": "msg5",
  "from": "did:ex:alice",
  "to": ["did:ex:dms"],
  "thid": "thread1",
  "body": {
    "received": "provide-artifacts",
    "session_id": "sess_abc123",
    "receipt_jti": "rcpt_xyz789"
  }
}
```

## Advanced Walkthroughs

### Scenario 1: EIP-712 Single-Signer

**Use Case:** Web3 app requests user to sign an EIP-712 order

**Key Differences:**
- `object.media_type`: `application/eip-712`
- `canonicalization.method`: `eip-712@1`
- `suite`: `evm-eip712@1`
- Attachment `data.json` carries `{types, domain, message}`
- `partial-signature.signature.value`: 65-byte hex `0x...`

### Scenario 2: PDF PAdES 2-of-3 Threshold

**Participants:**
- Requester: HR system
- Signers: Alice, Bob, Carol (need 2 of 3)
- Coordinator: HR system

**Flow:**

1. Requester sends `request-signing` to Alice, Bob, Carol with `mode.type: "threshold"` and `threshold: {scheme: "n-of-m", n: 2, m: 3, signers: [...], aggregation: "pdf-co-sign@1"}`
2. Alice and Bob each send `partial-signature` with their CMS blobs
3. Coordinator sends `combine` with `status: "threshold_met"` and `aggregation_result.type: "pdf"`
4. Coordinator sends `provide-artifacts` with final co-signed PDF
5. All parties send `ack`

### Scenario 3: Gnosis Safe 2-of-3 Multisig

**Use Case:** Execute a Safe transaction requiring 2 confirmations

**Key Differences:**
- `suite`: `evm-safe-tx@1`
- `object` includes `safeTxHash` and transaction details
- `partial-signature` represents Safe confirmations
- `combine` executes the transaction via `safe-exec@1` aggregator
- `provide-artifacts.artifacts[0].type`: `safe-execution` with `txid`

### Scenario 4: Bitcoin PSBT Multi-Party

**Use Case:** Coordinate a 2-of-3 multisig Bitcoin transaction

**Key Differences:**
- `object.media_type`: `application/psbt`
- `canonicalization.method`: `psbt@2`
- `suite`: `psbt@2`
- Each `partial-signature` carries an updated PSBT fragment
- `combine` runs `psbt-finalize@2` aggregator
- `provide-artifacts` includes hex transaction + txid

## Profiles

### Profile: PDF / PAdES

- **Media Type:** `application/pdf`
- **Canonicalization:** `pdf-incremental-update@1` with `byte_range` parameter
- **Suite:** `pades-b-b@1` (basic) or `pades-b-lta@1` (long-term archival with timestamps/OCSP)
- **Artifacts:** Final PDF link + SHA-256 digest; optionally RFC3161 timestamp and OCSP/CRL evidence

### Profile: EVM — EIP-712

- **Media Type:** `application/eip-712`
- **Canonicalization:** `eip-712@1`
- **Suite:** `evm-eip712@1`
- **Attachment:** `data.json` MUST carry `{types, domain, message}` per EIP-712 spec
- **Signature Output:** 65-byte hex `0x...` (r, s, v)

### Profile: EVM — Safe Multisig

- **Suite:** `evm-safe-tx@1`
- **Object:** Describes `safeTxData` and/or `safeTxHash`
- **Partial Signatures:** Safe owner confirmations
- **Combine:** MAY execute transaction and return `txid` in `aggregation_result`

### Profile: Bitcoin — PSBT

- **Media Type:** `application/psbt`
- **Canonicalization:** `psbt@2`
- **Suite:** `psbt@2`
- **Partial Signatures:** Updated PSBT fragments
- **Combine:** `psbt-finalize@2` aggregator produces finalized hex transaction
- **Artifacts:** Transaction hex + txid (if broadcast)

### Profile: Supply Chain — OCI (Sigstore)

- **Media Type:** `application/vnd.oci.image.manifest.v1+json`
- **Canonicalization:** `oci-manifest@1`
- **Suite:** `sigstore-fulcio@1`
- **Combine:** `oci-multi-sign@1` aggregator
- **Artifacts:** Signature references (e.g., Rekor transparency log entries)

## Design By Contract

### Preconditions

- Requester MUST provide valid `session`, `object`, and `suite` in `request-signing`
- `object.digest` MUST match canonicalized bytes per `canonicalization.method`
- Signer MUST control the key specified in `suite.key_binding.controller`

### Postconditions

- Upon successful `ack`, requester has non-repudiation receipt
- Final artifacts MUST be cryptographically verifiable against `object.digest`
- For threshold sessions, `combine` MUST verify N-of-M threshold satisfaction

### Invariants

- `session_id` MUST remain constant throughout session lifecycle
- `object_id` MUST remain constant for a given signable object
- Message threading (`thid`) MUST be consistent across all session messages

### Side Effects

- Signing operations MAY trigger on-chain state changes (e.g., Safe execution, PSBT broadcast)
- Artifacts MAY be stored in external systems (IPFS, cloud storage, transparency logs)

### Timeout & Error Handling

| Error Code | Description | Recovery |
|------------|-------------|----------|
| `unsupported-suite` | Signer does not support requested signature suite | Requester retries with different suite |
| `unsupported-media-type` | Media type not recognized | Requester provides different media type |
| `unsupported-canonicalization` | Canonicalization method not supported | Requester selects compatible method |
| `policy-failed` | Policy module rejected request | Review and adjust constraints |
| `authz-insufficient` | Signer lacks authorization | Update permissions or provide VP |
| `expired` | Request timestamp exceeded `expires_time` | Requester resends with updated time |
| `not-yet-valid` | Current time before `not_before` | Wait until valid time window |
| `mismatch-digest` | Computed digest does not match `object.digest` | Requester recomputes and resends |
| `idempotency-conflict` | Duplicate `idempotency_key` with different request | Requester uses new idempotency key |
| `threshold-not-reached` | Insufficient partial signatures collected | Wait for more signers or timeout |
| `aggregation-failed` | Aggregator could not combine signatures | Retry or change aggregation strategy |
| `attachment-too-large` | Attachment exceeds `max_attachment_size` | Use `data.links` instead of inline |
| `artifact-missing` | Expected artifact not found | Coordinator resends `provide-artifacts` |

**Timeout Recommendations:**
- Requester SHOULD set `expires_time` constraint (e.g., 24-48 hours)
- Coordinator SHOULD timeout threshold sessions after reasonable period (e.g., 1 hour for online sessions)
- Multi-round protocols SHOULD timeout individual rounds (e.g., 30 seconds per round)

## Security

### Threat Model

**Threats Addressed:**

1. **WYSIWYS Mismatch**: Attacker shows signer different content than what is signed
   - **Mitigation**: Digest pinning; signer UI MUST render from canonical bytes

2. **Signer Confusion**: Signer signs unintended content or for wrong purpose
   - **Mitigation**: Display hints with human-readable summary; consent flow with key binding proof

3. **Replay Attacks**: Signature reused in different context
   - **Mitigation**: Time windows (`not_before`, `expires_time`), `use_limit`, `intended_audience`

4. **Double-Sign**: Signer produces multiple conflicting signatures (e.g., blockchain slashing)
   - **Mitigation**: Idempotency keys; signer tracks previous signatures

5. **Coordinator Tampering**: Malicious coordinator modifies signatures or session state
   - **Mitigation**: All signatures include `session_id` and `object_id`; signers verify final artifacts

6. **Downgrade Attacks**: Attacker forces weak signature suite during negotiation
   - **Mitigation**: `propose-signing` capabilities discovery; signer rejects unsupported suites

### Security Requirements

- **Digest Pinning (MUST)**: `object.digest` computed over canonical bytes; Signer UI MUST render preview derived from same canonicalization (or prominently display digest)
- **Consent (SHOULD)**: Send `consent` with `key_binding_proof` prior to signing
- **Key Binding (MUST)**: Include DID/key identifier; verify key control during session
- **Replay Protection (MUST)**: Enforce time windows and `use_limit`
- **Idempotency (SHOULD)**: Use `idempotency_key` and constraints.`use_limit`

### Privacy & Confidentiality

- **Confidentiality**: Use DIDComm authenticated encryption; avoid leaking object contents unless necessary
- **Minimize Personal Data**: Prefer references (`links` + `hash`) over inline payloads
- **Large Artifacts**: Use attachments with `data.links` to avoid inline mega-payloads
- **Observer Privacy**: Observers see session state but not necessarily full payload content

### Mediation & Transport

- **DIDComm Pickup v2**: Compatible with offline-first workflows and mediation
- **Message Expiration**: Consider setting `expires_time` headers for pickup mediators
- **Routing**: Works transparently over DIDComm routing agents

## Composition

### Supported Goal Codes

| Goal Code | Notes |
|-----------|-------|
| `sign.document` | Sign a document (PDF, Word, etc.) |
| `sign.transaction` | Sign a blockchain transaction |
| `sign.credential` | Sign a Verifiable Credential |
| `sign.package` | Sign a software package or container image |
| `sign.attestation` | Sign a cryptographic attestation or receipt |

### Co-Protocol Support

This protocol MAY be composed with:

- **Issue Credential v2**: Signing protocol can sign Verifiable Credentials as final step
- **Present Proof v2**: Signers MAY be required to present VPs proving authorization (`vp-gate@1` policy)
- **Workflow**: Signing can be orchestrated as steps within larger workflow
- **Payments**: Signing sessions MAY require payment (e.g., notary services)

## Discoverability

Agents SHOULD advertise support using DIDComm feature discovery (similar to Aries RFC-0031):

```json
{
  "protocol": "https://didcomm.org/signing/1.0",
  "roles": ["signer", "requester", "coordinator"],
  "suites": [
    "pades-b-lta@1",
    "evm-eip712@1",
    "evm-safe-tx@1",
    "psbt@2"
  ],
  "max_attachment_size": 10485760
}
```

**Discovery Methods:**
- DIDComm `discover-features` protocol
- DID Document service endpoints with protocol metadata
- Out-of-band invitations with protocol capabilities

## Implementations

| Name / Link | Implementation Notes |
|-------------|---------------------|
| *To be published* | Reference implementations pending |

## Versioning & Compatibility

- **Protocol Version**: Specified in message type URI (`…/signing/1.0/…`)
- **Module Versions**: Registry keys use suffix `@N` to denote major version (e.g., `eip-712@1`)
- **Backward Compatibility**:
  - Minor version bumps (1.0 → 1.1): Add optional features, maintain compatibility
  - Major version bumps (1.0 → 2.0): Breaking changes to message structure or semantics

## Conformance

An implementation is **conformant** if it:

1. Produces and consumes message types in §Message Reference per schemas
2. Implements at least one Canonicalizer (e.g., `raw-bytes@1`) and one Suite (e.g., `jws-secp256k1@1`)
3. Enforces digest pinning: verifies `object.digest` matches canonicalized bytes
4. Enforces idempotency: rejects duplicate `idempotency_key` with different request
5. Supports `problem-report` with error codes from §Design By Contract

**Optional Conformance:**
- Multi-signer orchestration (coordinator role)
- Multi-round cryptographic aggregation
- On-chain execution (Safe, PSBT broadcast)
- Advanced policies (VP-gate, spend limits)

## Test Fixtures

Reference test vectors (to be published):

- **PDF Fixture**: Byte ranges + expected digest + two CMS co-signatures
- **EIP-712 Order**: Typed data + expected signature
- **Safe Transaction**: Hash + two confirmations + txid on testnet
- **PSBT**: 2-of-3 multisig with expected final txid

## Future Considerations

Potential enhancements for v1.1+:

- **Transparency Log Witness**: Optional transparency log entries for all steps/artifacts (e.g., Rekor integration)
- **Observer Subscription Stream**: Standardized pub/sub for observers
- **Hash Agility Registry**: Support for SHA-256, SHA-512, BLAKE3 in `digest.alg`
- **JSON-LD Profile**: Support for Linked Data Proof suites (e.g., Ed25519Signature2020)
- **Batch Signing**: Sign multiple objects in single session
- **Revocation**: Protocol extension for signature revocation/invalidation

## Endnotes

1. **EIP-712**: Ethereum Improvement Proposal for typed structured data signing
2. **PAdES**: PDF Advanced Electronic Signatures (ETSI EN 319 142)
3. **CAdES**: CMS Advanced Electronic Signatures (ETSI EN 319 122)
4. **PSBT**: Partially Signed Bitcoin Transaction (BIP-174, BIP-370)
5. **MuSig2**: Multi-signature Schnorr protocol with two communication rounds
6. **FROST**: Flexible Round-Optimized Schnorr Threshold signatures
7. **Gnosis Safe**: Multi-signature smart contract wallet
8. **ERC-1271**: Standard signature validation method for contracts
9. **Sigstore/Fulcio**: Keyless signing with OIDC identities and transparency logs
10. **OCI**: Open Container Initiative image format
