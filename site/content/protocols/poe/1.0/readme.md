---
title: Proof of Execution (PoE)
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/poe/1.0
status: Proposed
summary: A DIDComm v2 protocol for requesting and receiving zero-knowledge proofs that a named program executed correctly on inputs bound to a transaction context, without revealing private inputs.
tags: [poe, zk, proof, didcomm, policy, attestation, generic]
authors:
  - name: Vinay Singh
    email: vinay@verid.id

---

## Summary

The Proof of Execution (PoE) 1.0 protocol lets a Requester ask a Prover to run a named program and return a zero-knowledge proof that the program executed correctly on inputs bound to a transaction context — while keeping private inputs confidential. It is generic and supports many programs (e.g., device checks, policy evaluators, cryptographic attestations) with program-specific public schemas validated by the Requester.

---

## Goals

* Generic request/response flow for program execution proofs
* Strong anti-replay via binding to `{nonce, context_hash, session_id}`
* Minimal disclosure: `proof-only` by default; optional summaries or encrypted evidence references
* Program capability negotiation when needed
* Local registry enforcement for verifying keys and program parameters

---

## Roles

* `requester`: Verifier relying on the PoE result (e.g., login, payments, issuance)
* `prover`: Holder/Agent that executes or delegates the program and returns the proof
* `attester` (optional): Compute service (possibly TEE-backed) that can generate PoE on Prover’s behalf

### Security Model (Summary)

* Binding: Every PoE instance MUST bind to `{nonce, context_hash, session_id}` to prevent replay/cross-use.
* Freshness: Messages carry short TTLs; programs may enforce timing/sequence constraints in-proof.
* Privacy: Only the ZK proof and public outputs are revealed. Private inputs never leave the Prover unless policy demands by-reference encrypted evidence.
* Unlinkability: Use pairwise DIDs and ephemeral keys per thread.

---

## Discovery

Provers advertise PoE support with Discover-Features 2.0. They should disclose supported `program_id`s and optional resource hints.

```json
{
  "type":"https://didcomm.org/discover-features/2.0/disclose",
  "body":{
    "disclosures":[
      {"feature_type":"protocol","id":"https://didcomm.org/poe/1.0","roles":["prover"]},
      {"feature_type":"goal-code","id":"poe/programs","claims":{"programs":[
        {"program_id":"vendor.policy.eval.v1","max_runtime_s":60,"max_artifact_mb":8}
      ]}}
    ]
  }
}
```

---

## States

Requester

```
IDLE → REQUEST_SENT → (optional) CHALLENGE_SENT* ← SUBMIT_RECEIVED → COMPLETE | PROBLEM
```

Prover

```
IDLE ← REQUEST_POE ↔ (optional) PROPOSE/ACCEPT ↔ (optional) CHALLENGE ← → SUBMIT_POE ← COMPLETE | PROBLEM
```

---

## Basic Walkthrough

1. Requester sends `request-poe` naming one or more `program_id`s with public constraints and binds them to `{nonce, context_hash, session_id}`.
2. Prover may reply with `propose-poe` to adjust capabilities or proceed directly.
3. For interactive programs, Requester MAY send a `challenge` describing steps.
4. Prover returns `submit-poe` with `public` block and `zk` proof.
5. Requester verifies registry, binding, proof, and policy, then responds with `complete` or `problem-report`.

---

## Message Reference

All PoE messages use DIDComm v2 with type: `https://didcomm.org/poe/1.0/<message-name>` and standard headers (`id`, `thid`/`pthid`, `from`, `to`, `expires_time`).

### request-poe

Message Type URI: `https://didcomm.org/poe/1.0/request-poe`

Purpose: Ask the Prover to run a program and return PoE.

From: requester → prover

```json
{
  "type": "https://didcomm.org/poe/1.0/request-poe",
  "id": "req-123",
  "pthid": "txn-abc123",
  "body": {
    "programs": [
      {
        "program_id": "vendor.policy.eval.v1",
        "public_constraints": { "params_hash": "0x…32B" }
      }
    ],
    "bind_to_context": {
      "nonce": "0x…32B",
      "context_hash": "0x…32B",
      "session_id": "0x…16B"
    },
    "inputs": {
      "schema": "vendor.policy.eval.v1/inputs@1",
      "by_value": { "params": { "ttl_s": 60, "policy_ref": "policy-abc@1" } }
    },
    "disclosure": "proof-only",
    "expiry": "2025-11-11T14:35:00Z",
    "transport_hints": { "webrtc_ok": true, "offline_ok": true },
    "policy": { "max_runtime_s": 60, "max_artifact_mb": 8 }
  }
}
```

Notes:
* `programs` MAY include several options ordered by preference.
* `inputs` describe public inputs supplied by the requester; others may be computed by the Prover or Attester.
* `disclosure` controls summaries or encrypted evidence refs beyond the ZK proof.

---

### propose-poe

Message Type URI: `https://didcomm.org/poe/1.0/propose-poe`

Purpose: Negotiate capabilities or parameters (optional).

From: prover → requester

```json
{
  "type": "https://didcomm.org/poe/1.0/propose-poe",
  "id": "prop-1",
  "thid": "req-123",
  "body": {
    "program": {
      "program_id": "vendor.policy.eval.v1",
      "public_constraints": { "params_hash": "0x…32B" }
    },
    "disclosure": "proof-only"
  }
}
```

---

### accept-poe / decline-poe

Message Type URI: `https://didcomm.org/poe/1.0/accept-poe` and `…/decline-poe`

Purpose: Confirm or decline the chosen program/params.

From: requester ↔ prover

```json
{
  "type": "https://didcomm.org/poe/1.0/accept-poe",
  "id": "acc-1",
  "thid": "req-123",
  "body": {
    "program_id": "vendor.policy.eval.v1",
    "public_constraints": { "params_hash":"0x…32B" },
    "inputs_digest": "0x…32B"
  }
}
```

Parties MAY skip propose/accept if capabilities already match and proceed directly to `submit-poe`.

---

### challenge

Message Type URI: `https://didcomm.org/poe/1.0/challenge`

Purpose: For interactive programs, carry step schedule or updates.

From: requester → prover

```json
{
  "type": "https://didcomm.org/poe/1.0/challenge",
  "id": "chal-1",
  "thid": "req-123",
  "body": { "challenge_spec": { "steps":[{"action":"perform","payload":["taskA","taskB"]}], "ttl_s": 10 }, "sequence": 1 }
}
```

---

### submit-poe

Message Type URI: `https://didcomm.org/poe/1.0/submit-poe`

Purpose: Deliver the ZK proof and optional summary/evidence.

From: prover → requester

```json
{
  "type": "https://didcomm.org/poe/1.0/submit-poe",
  "id": "sub-1",
  "thid": "req-123",
  "body": {
    "program_id": "vendor.policy.eval.v1",
    "result": "pass",                        
    "public": {
      "schema": "vendor.policy.eval.v1/public@1",
      "nonce": "0x…32B",
      "context_hash": "0x…32B",
      "session_id": "0x…16B",
      "outputs_hash": "0x…32B",
      "vk_hash": "0x…32B"
    },
    "zk": {
      "scheme": "stark",
      "circuit_id": "vendor-policy-eval-v1",
      "vk_hash": "0x…32B",
      "proof_b64": "base64(urlsafe)…"
    },
    "summary": { "evidence_summary": ["constraint_A_met","constraint_B_met"] }
  },
  "attachments": [
    { "id": "evidence-ref", "format": "by-reference", "media_type": "application/json",
      "data": { "links": ["ipfs://…", "https://…/cap/…"], "alg": "A256GCM", "keyref": "eke-1" } }
  ]
}
```

Requirements:
* `public` MUST match the program’s public schema.
* `zk.vk_hash` MUST be in the Requester’s registry for the `circuit_id`.
* If `result = pass`, the proof MUST verify and assert the program’s declared constraints/policy are satisfied.

---

### complete / problem-report

Message Type URI: `https://didcomm.org/poe/1.0/complete` and `…/problem-report`

Purpose: Signal success (optionally with a receipt) or report a canonical error.

From: requester ↔ prover

```json
{
  "type": "https://didcomm.org/poe/1.0/problem-report",
  "id": "err-1",
  "thid": "req-123",
  "body": { "code": "invalid_proof", "explain": "ZK verification failed or vk_hash not allowed", "details": { "circuit_id": "vendor-policy-eval-v1" } }
}
```

---

## Registry & Schemas

Requesters maintain a local registry mapping `program_id`/`circuit_id` to allowed verifying keys and program parameters/hashes.

Example registry:

```json
{
  "vendor-policy-eval-v1": {
    "vk_hash": ["0xVK_A", "0xVK_B"],
    "params": ["0xPARAMS_A","0xPARAMS_B"],
    "public_schema": "vendor.policy.eval.v1/public@1"
  }
}
```

Example public schema (program-defined):

```json
{
  "type":"object",
  "required":["nonce","context_hash","session_id","vk_hash"],
  "properties":{
    "nonce":{"type":"string"},
    "context_hash":{"type":"string"},
    "session_id":{"type":"string"},
    "outputs_hash":{"type":"string","pattern":"^0x[0-9a-fA-F]{64}$"},
    "vk_hash":{"type":"string"}
  }
}
```

Requesters MUST reject any `vk_hash` or program parameter/hash not in the registry.

---

## Transport & Packaging

* Encryption: DIDComm v2 Authcrypt or Anoncrypt
* Delivery: mediator-optional; Out-of-Band deep links or QR are fine
* Attachments: DIDComm v2 Attachments 2.0
* Streaming: Optional upgrade (e.g., WebRTC datachannel) for interactive challenges; the final proof still returns via DIDComm unless both parties agree otherwise

---

## Verification Pipeline (Requester)

1. Expiry: Reject if `expiry` or TTL violated.
2. Registry: Check `program_id ∈ registry`; `vk_hash` and any pinned parameters/hashes are allowed.
3. ZK Verify: `verify_zk(proof_b64, public, circuit_id, vk_hash)` MUST pass.
4. Binding: Confirm `nonce`, `context_hash`, `session_id` match the ones issued.
5. Program Policy: Enforce program-specific constraints and any additional contextual policy (e.g., device attestation, geo-velocity).
6. Issue Receipt: Optionally issue a short-lived VC (e.g., `ExecutionReceiptCredential`) embedding a `proof_hash` for audit.

---

## Error Codes

* `program_not_supported`
* `inputs_invalid`
* `expired_challenge`
* `policy_violation`
* `invalid_proof`
* `vk_unknown`
* `params_unknown`
* `context_mismatch`
* `too_large`
* `rate_limited`
* `attester_unavailable`

Every `problem-report` MUST include `code` and SHOULD include `details`.

---

## Privacy & Retention

* Default `disclosure = proof-only`.
* If `proof+summary`, include only aggregate fields (e.g., step booleans or aggregate metrics).
* If `proof+evidence-ref`, references MUST be E2EE (e.g., AES-GCM with DIDComm-negotiated key).
* Server retention SHOULD be hashes/receipts only, with short TTLs (≤30 min) unless law/policy demands more.

---

## Program Examples

### WebAuthn presence as PoE (`vendor.device.webauthn.v1`)

* Public: `nonce`, `context_hash`, RP ID hash, flags (UP/UV policy)
* Proof: zkVM/zk-circuit proving assertion verified and flags met, bound to `nonce||context_hash`
* Result: `pass|fail`

Additional programs can follow the same mold.

---

## Conformance

1. Nominal PASS: valid proof; binding matches; in-policy.
2. Policy FAIL: valid proof but public outputs do not satisfy constraints → `result=fail` or reject per policy.
3. Replay FAIL: wrong `nonce/context_hash` → verify fails.
4. Tamper FAIL: integrity/public hash mismatch → verify/reject.
5. Unknown VK/Params: registry rejects.
6. Expired: TTL exceeded → reject before verify.

---

## Versioning

* Protocol version is part of the PIURI (`/poe/1.0`).
* Program versions live in `program_id` (e.g., `vendor.program.v1`).
* Verifiers MUST pin `vk_hash` to a `circuit_id` and rotate via registry updates.

---

## Example Generic Program

1. Requester → Prover: `request-poe` with `program_id="vendor.policy.eval.v1"`, `public_constraints.params_hash=0x…`, program inputs, and `{nonce, context_hash, session_id}`.
2. Prover executes and generates proof.
3. Prover → Requester: `submit-poe` with `public` block and `zk` proof, `result="pass"`.
4. Requester verifies ZK + registry + policy and replies `complete` (optionally minting a short-lived receipt VC).

