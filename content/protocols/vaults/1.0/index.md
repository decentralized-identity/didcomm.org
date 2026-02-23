---
title: Vaults
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/vaults/1.0
status: Proposed
summary: A DIDComm-based coordination protocol that lets agents create, share, and retire end-to-end encrypted data vaults (EDV) on heterogeneous backends (e.g., S3, Arweave). It handles who gets access, for how long, and to which objects, while all actual bytes flow over the EDV HTTP API as JOSE/JWE ciphertext with encrypted indexes for equality querying.
tags: [vaults, edv, encrypted-data-vaults, storage, s3, arweave, zcap, jwe, encryption, access-control, mediator-pickup, threshold-decrypt]
authors:
  - name: Vinay Singh
    email: vinay@verid.id
---

## Summary

Vaults 1.0 is a DIDComm-based **coordination protocol** that lets agents create, share, and retire **end-to-end encrypted data vaults** (EDV) on heterogeneous backends (e.g., S3, Arweave). It handles **who gets access, for how long, and to which objects**, while all actual bytes flow over the **EDV HTTP API** as JOSE/JWE ciphertext with **encrypted indexes** for equality querying. It purposely **does not** handle signing—pair it with your existing **Signing 1.0** protocol via content references (digest + location + capability). ([identity.foundation][2])

This draft also defines an **optional Threshold Decryption ** that allows data (or its content-encryption key) to become decryptable **only after N-of-M approvals**, coordinated via DIDComm and Signing 1.0.

---

## Goals / Non-Goals

**Goals**

* Provision **ephemeral or durable** shared vaults among agents.
* Delegate **least-privilege** capabilities (time/size/path caveats).
* Support **multi-recipient encryption** and **encrypted equality indexes**.
* Coordinate **N-of-M approval-gated release** and **true threshold decryption** (cryptographic N-of-M) for decryption events.

**Non-Goals**

* No signing, canonicalization, threshold **signature** orchestration, or business policy logic (defer to **Signing 1.0**).
* No duplicate CRUD—agents use the **EDV HTTP API** for data path. ([identity.foundation][2])

---

## Roles

* **Requester**: initiates a shared vault for a workflow (controller by default).
* **Participant**: granted constrained access (read/write/replicate).
* **Vault Host**: EDV server fronting storage (S3, Arweave, etc.).

---

## External References (normative)

* **EDV v0.1**: model, sequence/OCC, encrypted indexes, HTTP API. ([identity.foundation][2])
* **JWE (RFC 7516)**: content encryption, general JSON serialization (multi-recipient). ([IETF Datatracker][5])
* **HPKE (RFC 9180)**: KEM+KDF+AEAD envelopes for sealed secrets / key delivery. ([IETF Datatracker][9])

**Backend notes**

* **S3**: deletable objects.
* **Arweave**: immutable "permanent" storage; practical deletion via **cryptographic erasure** (destroy keys). ([SwissBorg Academy][7])
* **IPFS**: decentralized storage

---

## Data Model

### VaultDescriptor

```json
{
  "vault_id": "urn:edv:zA1...:vault123",
  "controller": "did:example:controller",
  "base_url": "https://edv.example.com/edvs/vault123",
  "zcap_root": { "...": "root-capability" },
  "encryption": { "content": "JWE+ECDH-ES", "index_hmac": "HMAC-SHA-256" },
  "retention": { "kind": "ephemeral|durable", "expires_at": "2025-10-20T00:00:00Z" },
  "backend": { "type": "s3|arweave|...", "hints": { "region": "us-east-1" } },
  "limits": { "max_docs": 200, "max_bytes": 104857600, "max_doc_bytes": 10485760 },
  "index_schema": ["workflow_id","digest","stage"]
}
```

> EDV documents carry `id`, `sequence`, and a JWE payload; searchable **encrypted indexes** are computed client-side. ([identity.foundation][2])

### ContentRef (to bridge to **Signing 1.0**)

```json
{
  "vault_id": "urn:edv:...:vault123",
  "doc_id": "z19abc...",
  "digest": "sha256-BASE64URL(...)",
  "capability": { "...": "zcap granting read (and optionally write)" }
}
```

---

## Protocol Overview

**Control plane:** DIDComm v2 messages for negotiation, capability distribution, lifecycle (create/join/seal/tombstone), optional replication.

**Data plane:** EDV HTTP for CRUD/queries; attach ZCAP invocation; encrypt/decrypt at the edge; use JWE general serialization for multi-recipient. ([identity.foundation][2])

**Decryption events:** (optional) may be **approval-gated** (N-of-M) or use **true cryptographic threshold decryption** per the in this spec. In both cases, **keys are never published on immutable backends**; key release or partial-decrypt shares occur off-chain via DIDComm.

---

## Messages

> All messages are DIDComm v2 **`type`** = `https://didcomm.org/vaults/1.0/<name>` with **`id`**, **`pthid`** (parent thread = workflow), and optional **`thid`** threading. ([identity.foundation][1])

### propose

Propose creating a shared vault.

**Body**

```json
{
  "purpose": "workflow:pdf-signing#42",
  "participants": ["did:example:alice","did:example:bob"],
  "constraints": {
    "retention": "ephemeral",
    "ttl_seconds": 86400,
    "limits": { "max_docs": 200, "max_bytes": 104857600, "max_doc_bytes": 10485760 }
  },
  "backend_prefs": ["s3","arweave"],
  "index_schema": ["workflow_id","digest","stage"]
}
```

**Expected reply**: `offer` (from provisioner/host or a peer offering to host).

---

### offer

Return a ready vault.

**Body**

```json
{
  "vault_descriptor": { "...": "VaultDescriptor" },
  "provisioner": "did:example:host"
}
```

---

### grant-access

Controller delegates a capability to a participant (ZCAP-LD).

**Body**

```json
{
  "to": "did:example:bob",
  "capability": {
    "...": "zcap with caveats (verb=read|write|query|replicate, path=/docs/pdf-42-*, expires_at, max_bytes, non_delegable)"
  }
}
```

> Capabilities and caveats per ZCAP-LD; delegation chains MUST verify on the server. ([w3c-ccg.github.io][6])

**Problem reports**: `cap-invalid`, `cap-expired`, `cap-unauthorized`.

---

### notify (optional)

Lightweight announcement of interesting changes (new doc, sealed, replicated).

**Body**

```json
{
  "kind": "doc-created|doc-updated|sealed|replicated",
  "doc_id": "z19abc...",
  "indexed": { "workflow_id": "HMAC(...)", "stage": "HMAC(...)" }
}
```

---

### replicate (optional)

Ask a mirror host to replicate ciphertext to another EDV (e.g., S3 → Arweave).

**Body**

```json
{
  "target": { "type": "arweave", "endpoint": "https://edv.mirror/edvs/vaultX" },
  "scope": { "prefix": "pdf-42-", "include_indexes": true }
}
```

**Reply**: `replicate-receipt` with list of digests and target doc IDs.

---

### seal

Rotate capabilities to read-only; freeze the workspace.

**Body**

```json
{ "mode": "read-only" }
```

---

### tombstone

Retire a vault.

* For **S3/ordinary EDV**: delete documents + indexes.
* For **Arweave**: perform **cryptographic erasure** (destroy keys) and emit a finalization record listing affected digests—data stays immutable but **unreadable** without keys. ([SwissBorg Academy][7])

**Body**

```json
{
  "strategy": "delete|destroy-keys",
  "evidence_doc_id": "z1finalnote..."
}
```

---

## Flows

### Capability discovery (pre-flight)

Use **Discover Features 2.0** to check support for `vaults/1.0`, max sizes, backends, replication ability. ([didcomm.org][4])

### Two-party ephemeral vault for PDF signing (happy path)

1. **Alice → Bob + Host**: `propose` (purpose, ttl, limits, backends).
2. **Host → Alice**: `offer` (VaultDescriptor + root zcap).
3. **Alice → Bob**: `grant-access` (write to `/docs/pdf-42-*`, TTL 24h).
4. **Data path (EDV)**:

   * Alice **PUT** encrypted PDF (`stage=src`).
   * Signing 1.0 sends `ContentRef` to Bob; Bob **GET** + verify digest; Bob **PUT** partial signature (`stage=partial`).
   * Aggregator **PUT** final signature + receipt (`stage=final`).
5. **Alice → All**: `seal` (read-only).
6. **(Optional)** `replicate` to Arweave archive vault; then `tombstone` the working vault. ([identity.foundation][2])


---

## State Machine (controller view)

| State    | Event              | Next State | Notes                                                 |
| -------- | ------------------ | ---------- | ----------------------------------------------------- |
| `NEW`    | `offer` accepted   | `ACTIVE`   | VaultDescriptor stored; root zcap held by controller. |
| `ACTIVE` | `grant-access`     | `ACTIVE`   | Participants can perform EDV ops per caveats.         |
| `ACTIVE` | `seal`             | `SEALED`   | Rotate caps to read-only; no more writes.             |
| `SEALED` | `replicate` (opt.) | `SEALED`   | Mirror ciphertext; collect receipts.                  |
| `SEALED` | `tombstone`        | `RETIRED`  | Delete or cryptographically erase.                    |

---

## EDV Usage (normative)

* **Encryption**: Agents MUST encrypt content as **JWE** before upload; multi-party access MAY use **General JSON Serialization** for multiple recipients. ([IETF Datatracker][5])
* **Indexes**: Agents SHOULD compute equality-only indexes via HMAC and upload with each document to enable queries with minimal leakage. ([identity.foundation][2])
* **Concurrency**: Agents MUST respect **`sequence`** for optimistic concurrency control and retry on conflict. ([identity.foundation][2])

---

## Authorization (normative)

* Capabilities MUST be expressed as **ZCAP-LD** documents, bound to vault endpoints and **caveated** by:
  `expires_at`, verbs (`read|write|query|replicate`), path/prefix, and size/byte limits; optionally non-delegable. ([w3c-ccg.github.io][6])
* Hosts MUST verify capability chains and caveats for each EDV request (out of band from DIDComm messages).

---

## **Threshold Decryption (Optional)**

**Purpose:** Make decryption happen **only after N-of-M approvals**. Two modes are supported:

1. **Approval-gated release (policy-level)** — N approvals collected via DIDComm / Signing 1.0; coordinator releases the CEK as a **sealed secret** (HPKE) to the authorized device.
2. **True cryptographic threshold decryption** — The CEK (or data) is encrypted under a **threshold public key**; any N holders produce **partial decrypt shares** that combine to recover the CEK (or plaintext). No single party can decrypt alone.

> This covers **(2)**. Mode (1) already works without changes (use Signing 1.0 threshold collection + `sealed-secret@1` delivery).

### Threshold KEM Header (attached to the object descriptor)

```json
{
  "threshold_kem": {
    "scheme": "threshold-kem@1",
    "t": 2,
    "n": 3,
    "pub": "base64url(public_key_bytes)",
    "params": {
      "kem": "ECIES-X25519",
      "kdf": "HKDF-SHA256",
      "aead": "AES-256-GCM"
    },
    "cipher_cek": "base64url(...)",   // CEK encrypted under the threshold public key
    "aad": {
      "session_id": "sess_...",
      "object_id": "so_...",
      "kem_params_hash": "sha-256:...",
      "policy_hash": "sha-256:..."    // optional but recommended
    }
  }
}
```

> If you encrypt the **data directly** under the threshold key, use `cipher_data` instead of `cipher_cek`. The rest of the flow is identical; the aggregator yields plaintext rather than CEK.

### Message Reuse

We reuse the existing DIDComm messages; we only define **what goes in them**.

#### `request` (decrypt session using threshold)

Use `vaults/1.0` to set up access + transport, and **Signing 1.0** (recommended) to orchestrate the threshold session:

```json
{
  "type": "https://didcomm.org/signing/1.0/request-signing",
  "body": {
    "session": { "session_id": "sess_...", "mode": { "type": "threshold" } },
    "object": { "...": "Signable (or Decryptable) Object + threshold_kem header" },
    "suite": { "suite": "threshold-kem@1" },
    "constraints": {
      "not_before": "...", "expires_time": "...",
      "intended_audience": ["did:ex:device"], "use_limit": 1
    }
  }
}
```

#### `partial-signature` (carries **partial decrypt share**)

```json
{
  "type": "https://didcomm.org/signing/1.0/partial-signature",
  "body": {
    "session_id": "sess_...",
    "object_id": "so_...",
    "signer": "did:ex:holder2",
    "suite": "threshold-kem@1",
    "kind": "partial-decrypt",
    "data": {
      "share": "base64url(partial_decrypt_share)",
      "aad_hash": "sha-256:..."  // MUST equal hash(serialize(threshold_kem.aad))
    }
  }
}
```

#### `combine` (threshold met)

```json
{
  "type": "https://didcomm.org/signing/1.0/combine",
  "body": {
    "session_id": "sess_...",
    "status": "threshold_met",
    "aggregation_result": {
      "type": "threshold-decrypt@1",
      "n": 2, "m": 3
    }
  }
}
```

#### `provide-artifacts` (deliver CEK or plaintext)

**CEK delivery (recommended)** sealed to the device using **HPKE** (RFC 9180) and bound to a **one-use authorization token** (counter, expiry, device):

```json
{
  "type": "https://didcomm.org/signing/1.0/provide-artifacts",
  "body": {
    "session_id": "sess_...",
    "artifacts": [
      {
        "type": "sealed-secret@1",
        "suite": "envelope-hpke@1",
        "aad": { "ticket_digest": "sha-256:..." },
        "ciphertext": "base64url(HPKE(CEK))",
        "enc": { "kem": "X25519", "kdf": "HKDF-SHA256", "aead": "AES-256-GCM", "ek_pub": "..." }
      }
    ],
    "token": {
      "token": {
        "typ": "signing-ticket",
        "session_id": "sess_...",
        "scope": "decrypt",
        "device": "did:ex:device#k1",
        "ctr": 42,
        "exp": "2025-10-19T16:02:00Z",
        "cap": 1
      },
      "sig": { "suite":"jws-ed25519@1","kid":"did:ex:coord#k1","value":"..." }
    }
  }
}
```

*(Data-direct variant: stream plaintext or attach a reference after the same token checks.)*

### Registry Additions (Threshold Decrypt)

**Suites**

| Registry Key      | Description                                                         | Inputs                                                                         | Outputs                 |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------- |
| `threshold-kem@1` | Threshold public-key encryption for CEK (ElGamal/ECIES/HPKE-style). | KEM header (`cipher_cek` or `cipher_data`), holder’s private share, `aad_hash` | `partial_decrypt_share` |

> Implementations MUST commit to `aad_hash = sha256(serialize(aad))` to prevent cross-session replay. The concrete math (curve/KEM) is pluggable; publish parameters via `kem_params_hash`.

**Aggregators**

| Registry Key          | Description                                                    | Input                                                                                      | Output                                    |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `threshold-decrypt@1` | Combines **N** partial decrypt shares into CEK (or plaintext). | N `partial-signature(kind=partial-decrypt)` with consistent `aad_hash` + common KEM header | CEK (then `sealed-secret@1`) or plaintext |

** Problem Reports (delta)**

* `share-invalid` — malformed or fails combine/validation
* `share-duplicate` — duplicate signer/index
* `threshold-not-reached` — insufficient valid shares
* `aggregation-failed` — combine failed integrity checks

### Security Requirements (delta)

* **No single holder can decrypt alone**; a single share reveals nothing.
* **Binding**: Shares MUST commit to `aad_hash` (session/object/policy binding).
* **Replay-proof release**: CEK/plaintext delivery MUST be bound to an authorization token (device DID, monotonic `ctr`, expiry).
* **Verification**: Aggregator MUST verify AEAD tag (or CEK checksum) after combine; reject otherwise.
* **DKG**: Secure DKG ceremony is out-of-scope for messages; deployments MUST pin `kem_params_hash`.

---

## Security Considerations

* **Client-side encryption**: Providers see only ciphertext and HMAC'd indexes; plaintext lives only at the edge. ([identity.foundation][2])
* **Transport**: DIDComm **authcrypt** recommended for authenticity + confidentiality of control messages. ([identity.foundation][1])
* **Capabilities**: Prefer short TTLs, tight path scoping, byte limits, and non-delegability where appropriate. Rotate caps at **seal**. ([w3c-ccg.github.io][6])
* **Leakage**: Encrypted equality indexes leak **existence and equality**; avoid sensitive tags; no range/prefix queries. ([identity.foundation][2])
* **Immutability backends**: For Arweave, treat "delete" as **cryptographic erasure** (destroy keys) and publish a finalization record listing affected digests. ([SwissBorg Academy][7])
* **Threshold Decrypt** : Never publish keys on immutable backends. Shares, tokens, and sealed secrets travel only via DIDComm.

---

## Privacy Considerations

* Minimize metadata in DIDComm headers and EDV indexes.
* Consider **group encryption** via JWE general serialization to avoid separate per-recipient blobs. ([IETF Datatracker][5])

---

## Interop Notes

* **Discover Features 2.0** SHOULD advertise: supported backends (`s3`, `arweave`, …), max object size, index support, replication availability, and whether **`threshold-decrypt`** is supported. ([didcomm.org][4])
* **Composition with Signing 1.0**:

  * Use Signing 1.0 threshold sessions to collect **approvals** and carry **partial-decrypt shares**.
  * Use Signing 1.0 **sealed-secret** profile (HPKE envelopes bound to tokens) for key delivery.

---

## Worked Example

**Create & grant**

```json
// Alice → Host
{ "type":"https://didcomm.org/vaults/1.0/propose", "body": { "purpose":"workflow:pdf-signing#42", "participants":["did:ex:bob"], "constraints":{"ttl_seconds":86400}, "backend_prefs":["s3"], "index_schema":["workflow_id","digest","stage"] } }

// Host → Alice
{ "type":"https://didcomm.org/vaults/1.0/offer", "body": { "vault_descriptor": { "...": "VaultDescriptor" } } }

// Alice → Bob
{ "type":"https://didcomm.org/vaults/1.0/grant-access", "body": { "to":"did:ex:bob", "capability": { "...": "zcap w/ path=/docs/pdf-42-*, verb=read|write, expires_at=..." } } }
```

**Use with Signing 1.0**

```json
// Sign-request (separate protocol) carries a ContentRef
{ "type":"https://didcomm.org/signing/1.0/request", "body": { "content_ref": { "vault_id":"urn:edv:...:vault123","doc_id":"pdf-42-src","digest":"sha256-...","capability":{ "...": "read-cap" } }, "suite":"PAdES", "policy":{ "...": "digest pinning etc." } } }
```

**Threshold Decrypt (CEK-wrap) — 2-of-3**

```json
// Object descriptor carries threshold_kem header with cipher_cek
// Requester starts a Signing 1.0 threshold session:
{ "type":"https://didcomm.org/signing/1.0/request-signing",
  "body": { "session": { "session_id": "sess_dec1", "mode": {"type":"threshold"} },
            "object": { "...": "includes threshold_kem" },
            "suite": { "suite":"threshold-kem@1" },
            "constraints": { "intended_audience": ["did:ex:alice#device"], "use_limit": 1, "expires_time": "..." } } }

// Two holders return partial-decrypt shares:
{ "type":"https://didcomm.org/signing/1.0/partial-signature",
  "body":{ "session_id":"sess_dec1","object_id":"so_xyz","signer":"did:ex:holder1",
           "suite":"threshold-kem@1","kind":"partial-decrypt","data":{"share":"...","aad_hash":"sha-256:..."}} }

// Coordinator combines shares → CEK, then delivers as sealed secret + token:
{ "type":"https://didcomm.org/signing/1.0/provide-artifacts",
  "body": { "session_id":"sess_dec1",
            "artifacts":[{"type":"sealed-secret@1","suite":"envelope-hpke@1","aad":{"ticket_digest":"sha-256:..."},"ciphertext":"...","enc":{"kem":"X25519","kdf":"HKDF-SHA256","aead":"AES-256-GCM","ek_pub":"..."}} ],
            "token":{ "...": "device-bound, ctr, exp, cap=1" } } }
```

---

## Implementation Hints

* Use or adapt an existing **EDV server** (e.g., TrustBloc EDV) and plug different backends under it. ([GitHub][8])
* Client library should expose:

  * **EDV client** (encrypt/JWE, HMAC indexes, sequence handling).
  * **ZCAP** issuance/delegation helpers.
  * DIDComm handlers for `propose`, `offer`, `grant-access`, `seal`, `tombstone`, `replicate`.
  * **Threshold holders**: API to compute `partial_decrypt_share` given the KEM header + private share.
  * **Aggregator**: `threshold-decrypt@1` to combine N shares, verify integrity (AEAD/CEK checksum), and emit sealed-secret + token.
* For multi-party read, prefer **JWE general serialization** (one ciphertext, many recipients) where policy allows. For immutable archives (e.g., Arweave), keep **keys off-chain** and gate key release with this extension.

---

## Security & Compliance Checklist

* [ ] DIDComm messages **authcrypt**ed, with correct `thid/pthid`. ([identity.foundation][1])
* [ ] Capabilities scoped to **verb + path + TTL + size**; non-delegable when needed. ([w3c-ccg.github.io][6])
* [ ] EDV **sequence** checked on updates; retry on conflict. ([identity.foundation][2])
* [ ] Equality indexes only; avoid sensitive attribute leakage. ([identity.foundation][2])
* [ ] Arweave "deletion" via **key destruction** documented with finalization record. ([SwissBorg Academy][7])
* [ ] Keys never published on immutable backends; key release/partials only via DIDComm.
* [ ] Authorization token enforced (device, counter, expiry) for CEK/plaintext delivery.
* [ ] `aad_hash` binding validated for all partial-decrypt shares.

---

## Change Log

* **v1.0-draft** — Initial publication

---

### References

EDV v0.1 spec; DIDComm v2; Discover Features 2.0; Message Pickup 3.0; JWE (RFC 7516); ZCAP-LD; DIDComm v2 announcement; Arweave permanence & crypto-erasure background; HPKE (RFC 9180).
([identity.foundation][2])

---

[1]: https://identity.foundation/didcomm-messaging/spec/v2.0/ "DIDComm Messaging Specification v2.0"
[2]: https://identity.foundation/edv-spec/ "Encrypted Data Vaults v0.1"
[3]: https://didcomm.org/messagepickup/3.0/ "Message Pickup 3.0"
[4]: https://didcomm.org/discover-features/2.0/ "Discover Features 2.0"
[5]: https://datatracker.ietf.org/doc/html/rfc7516 "RFC 7516 - JSON Web Encryption (JWE)"
[6]: https://w3c-ccg.github.io/zcap-spec/ "Authorization Capabilities for Linked Data v0.3"
[7]: https://academy.swissborg.com/en/learn/arweave "What is Arweave? Decentralized Permanent Storage on ..."
[8]: https://github.com/trustbloc/edv "GitHub - trustbloc/edv: Encrypted data vault implementation ..."
[9]: https://www.rfc-editor.org/rfc/rfc9180.html "RFC 9180 - Hybrid Public Key Encryption (HPKE)"
