---
title: Swarm
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/swarm/1.0
status: Proposed
summary: A DIDComm v2 protocol for decentralized, content-addressed peer storage. Mediators and willing agents form a swarm that holds encrypted, sharded, capability-gated data with proof-of-storage challenges, replication factor guarantees, and TTL-based pledges. Composes with Vaults, Issue Credential, Media Sharing, Message Pickup, Signing, and Payments to provide a shared durability layer for the entire DIDComm ecosystem.
tags: [swarm, storage, replication, durability, content-addressed, sharding, erasure-coding, proof-of-storage, mediator, pinning, backup, recovery]
authors:
  - name: Vinay Singh
    email: vinay@ajna.inc
---

## Summary

Swarm 1.0 is a DIDComm v2 protocol for **decentralized, content-addressed peer storage**. Mediators and willing agents form a swarm: they pledge to retain encrypted shards of data for a TTL, attest to durability via signed receipts, respond to proof-of-storage challenges, and serve retrieval requests when authorized.

Where DIDComm has solved **routing** (forward, mediation, pickup), Swarm solves **durability**: vault host failures, lost-device credential recovery, CDN deletion, mediator crashes with unacked queues, and large-file resilience. It is designed as a **composition target** — other protocols emit `pthid`-linked Swarm requests rather than reinventing replication.

---

## Motivation

Every existing DIDComm protocol that handles non-trivial data has the same gap:

- **Vaults 1.0** stores documents at a single EDV host. The `replicate` message is manual and typically yields one mirror — not Byzantine-resilient.
- **Issue Credential 3.0** delivers credentials to the holder's wallet. Lose the device, lose the credential. No mediator-assisted recovery.
- **Media Sharing 1.0** relies on the sender's CDN. CDN deletion = file gone.
- **Message Pickup 4.0** queues messages at one mediator. Mediator crash before ack = lost messages; no failover.
- **Coordinate Mediation 3.0** keeps routing tables in mediator memory. Database loss = recipients unreachable.

You could add ad-hoc backup messages to each protocol, but that creates N reinvented replication mechanisms with no shared trust model, no standard proof-of-storage, and no shared payment hooks. **Swarm centralizes the durability primitive** so every other protocol can lean on it via `pthid` composition.

---

## Goals / Non-Goals

**Goals**

* Decentralized, content-addressed storage that survives single-host failure.
* Sharded, erasure-coded blobs with configurable replication factor and TTL.
* Capability-gated retrieval reusing Vaults 1.0 ZCAP-LD model.
* Proof-of-storage challenges to detect silent data loss.
* Payment integration for long-TTL or high-replication pledges via Payments 1.0.
* Composition with existing protocols (Vaults, Issue Credential, Media, Pickup) via `pthid`.
* Work over any transport including Mesh-constrained environments.

**Non-Goals**

* No global content discovery or DHT — peer sets are negotiated explicitly per blob.
* No public anonymous storage — every peer is DID-authenticated.
* No consensus on storage state — we use signed pledges + curator audits, not blockchain.
* No on-chain payments — payment integration uses Payments 1.0 (off-chain or chain-abstracted).
* No replacement for Vaults — Swarm replicates **vault ciphertext shards**, doesn't replace EDV semantics.

---

## Roles

* **requester**: Originates a storage pledge. Owner of the data being stored. Holds the master capability and recovery key.
* **pledger**: Peer (mediator or agent) that commits to retain a shard for a specified TTL. Signs `store-receipt` with monotonic sequence number.
* **curator**: Peer that audits pledgers via `ping-commitment` proof-of-storage challenges. May be the requester's own agent or a delegated service.
* **retriever**: Agent requesting stored data back. Often the original requester or a designated recovery DID. Authenticated via Signing 1.0 ticket.

### Role Requirements

**requester** implementations MUST:

* Generate content-addressed shards via configured erasure coding (default: Reed-Solomon 6-of-9)
* Track all pledger commitments with their `peer_did`, `shard_id`, `expiry`, and `digest`
* Issue ZCAP-LD capabilities for retrieval, scoped to specific retriever DIDs
* Re-pledge before TTL expiry or at curator-flagged failures

**pledger** implementations MUST:

* Verify content digest before issuing `store-receipt`
* Persist shards in encrypted form (server-side encryption RECOMMENDED in addition to client-side ciphertext)
* Respond to `ping-commitment` challenges with valid Merkle proofs within `challenge_timeout`
* Honor `release` messages and `expiry` dates by deleting shards
* Maintain monotonic `sequence` per `(requester_did, blob_id)` pair

**curator** implementations MAY:

* Schedule periodic `ping-commitment` challenges (recommended: every 24-72 hours)
* Report pledger failures to the requester via `pledge-status`
* Pre-emptively trigger re-pledging when below replication threshold

---

## Discovery

Clients MUST use Discover Features 2.0 to advertise Swarm 1.0 support:

```json
{
  "type": "https://didcomm.org/discover-features/2.0/disclose",
  "body": {
    "disclosures": [{
      "feature-type": "protocol",
      "id": "https://didcomm.org/swarm/1.0",
      "roles": ["pledger", "curator"],
      "extensions": {
        "max_shard_bytes": 16777216,
        "supported_erasure_codes": ["reed-solomon@1", "fountain@1"],
        "supported_digests": ["sha256", "sha3-256"],
        "max_ttl_days": 3650,
        "min_replication_factor": 1,
        "max_replication_factor": 16,
        "proof_of_storage": ["merkle-challenge@1"],
        "payment_required": false,
        "rate_per_gb_month": null,
        "available_capacity_bytes": 107374182400
      }
    }]
  }
}
```

---

## Data Model

### BlobDescriptor

The canonical record a requester maintains for a stored blob:

```json
{
  "blob_id": "blob-7f1b8c5e-a4d9-49b1-9c3e-12d8b8f1c2a4",
  "content_digest": "sha256-BASE64URL(...)",
  "size_bytes": 4194304,
  "shard_params": {
    "algorithm": "reed-solomon@1",
    "k": 6,
    "m": 9,
    "shard_size_bytes": 524288,
    "merkle_root": "sha256-BASE64URL(...)"
  },
  "encryption": {
    "suite": "xchacha20poly1305@1",
    "kek_ref": {
      "vault_id": "urn:edv:...:keys",
      "doc_id": "z19keymaterial-001",
      "digest": "sha256-BASE64URL(...)"
    }
  },
  "replication_factor": 3,
  "ttl_expiry": "2027-04-21T00:00:00Z",
  "pledges": [
    {
      "peer_did": "did:example:mediator-a",
      "shard_ids": ["s1", "s4"],
      "sequence": 0,
      "receipt_id": "rcpt-a1b2c3",
      "expiry": "2027-04-21T00:00:00Z",
      "last_audit": "2026-04-20T00:00:00Z",
      "status": "healthy"
    },
    {
      "peer_did": "did:example:mediator-b",
      "shard_ids": ["s2", "s5"],
      "sequence": 0,
      "receipt_id": "rcpt-d4e5f6",
      "expiry": "2027-04-21T00:00:00Z",
      "last_audit": "2026-04-20T00:00:00Z",
      "status": "healthy"
    },
    {
      "peer_did": "did:example:mediator-c",
      "shard_ids": ["s3", "s6", "s7", "s8", "s9"],
      "sequence": 0,
      "receipt_id": "rcpt-g7h8i9",
      "expiry": "2027-04-21T00:00:00Z",
      "last_audit": "2026-04-20T00:00:00Z",
      "status": "healthy"
    }
  ],
  "retrieval_capability": {
    "type": "ZCAP-LD",
    "invoker": ["did:example:alice", "did:example:alice-recovery"],
    "caveats": [
      { "type": "expires", "expires_at": "2027-04-21T00:00:00Z" },
      { "type": "max_invocations", "limit": 100 }
    ],
    "controller": "did:example:alice",
    "proof": "<JWS>"
  },
  "pthid": "vault-evt-2c7d4a1f",
  "tags": ["credential-backup", "personal"],
  "created_at": "2026-04-21T10:00:00Z",
  "updated_at": "2026-04-21T10:00:00Z"
}
```

**Field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `blob_id` | string | Globally unique identifier (`blob-` prefix + UUID v4). Used as `thid` for the storage thread. |
| `content_digest` | string | Digest of the original (pre-shard) ciphertext. |
| `shard_params.k` | integer | Minimum shards required to reconstruct (data shards in Reed-Solomon). |
| `shard_params.m` | integer | Total shards generated (data + parity). Recovery requires any `k` of `m`. |
| `shard_params.merkle_root` | string | Root of a Merkle tree over shard digests; basis for proof-of-storage. |
| `encryption.kek_ref` | object | `$ref` pointer (Vaults 1.0 pattern) to the key-encryption-key. |
| `replication_factor` | integer | Number of distinct pledger DIDs holding the blob. Each holds `ceil(m / RF)` shards on average. |
| `ttl_expiry` | ISO 8601 | Absolute expiry; pledgers MUST delete after this time. |
| `pledges` | array | Per-pledger commitments with their assigned shards and audit status. |
| `retrieval_capability` | ZCAP-LD | Capability for the retriever to invoke `retrieve-request`. |
| `pthid` | string | Parent thread ID linking to the originating protocol (vault, credential, message, media). |

### Shard

Each shard is identified by `shard_id` (e.g., `s1`...`sN`), carries a position in the Merkle tree, and is delivered as a base64url-encoded byte array:

```json
{
  "shard_id": "s1",
  "merkle_index": 0,
  "merkle_path": ["sha256-BASE64URL(...)", "sha256-BASE64URL(...)"],
  "digest": "sha256-BASE64URL(...)",
  "size_bytes": 524288,
  "data": "BASE64URL(...)"
}
```

### PledgeReceipt

A signed commitment from a pledger:

```json
{
  "receipt_id": "rcpt-a1b2c3",
  "pledger": "did:example:mediator-a",
  "requester": "did:example:alice",
  "blob_id": "blob-7f1b8c5e",
  "shard_ids": ["s1", "s4"],
  "shard_digests": {
    "s1": "sha256-BASE64URL(...)",
    "s4": "sha256-BASE64URL(...)"
  },
  "sequence": 0,
  "expiry": "2027-04-21T00:00:00Z",
  "payment_ref": {
    "session_id": "pay-sess-9f1c",
    "tx_ref": "0xabc123..."
  },
  "jws": "<JWS over the above by pledger's DID key>"
}
```

The JWS MUST cover `{ pledger, requester, blob_id, shard_ids, shard_digests, sequence, expiry }`.

---

## States / State Machine

### Requester View

| State | Event | Next State | Notes |
|-------|-------|------------|-------|
| `IDLE` | `store-request` sent | `PLEDGING` | Awaiting pledger receipts |
| `PLEDGING` | `store-receipt` received from RF pledgers | `STORED` | Replication factor met |
| `PLEDGING` | `store-decline` received / timeout, RF not met | `RETRY` | Find new pledgers |
| `STORED` | `pledge-status` reports failure | `DEGRADED` | Below RF, re-pledge needed |
| `DEGRADED` | `store-request` to replacement pledger acked | `STORED` | Restored to RF |
| `STORED` | `retrieve-request` sent | `RETRIEVING` | Recovery flow |
| `RETRIEVING` | `retrieve-response` covering >= k shards | `RECONSTRUCTED` | Decode and verify digest |
| `RETRIEVING` | < k shards available within timeout | `LOST` | Data unrecoverable |
| `STORED` | `release` sent | `RELEASED` | Voluntary early teardown |
| `STORED` | `ttl_expiry` passed | `EXPIRED` | Pledgers free to delete |

### Pledger View

| State | Event | Next State | Notes |
|-------|-------|------------|-------|
| `IDLE` | `store-request` received, capacity available | `EVALUATING` | Validating digests, payment terms |
| `EVALUATING` | `store-receipt` sent | `HOLDING` | Shard committed |
| `EVALUATING` | `store-decline` sent | `IDLE` | Insufficient capacity / declined |
| `HOLDING` | `ping-commitment` received | `HOLDING` | Respond with Merkle proof |
| `HOLDING` | `retrieve-request` received with valid capability | `SERVING` | Streaming shard back |
| `SERVING` | `retrieve-response` sent | `HOLDING` | Returned to holding state |
| `HOLDING` | `release` received | `RELEASED` | Delete shard, free capacity |
| `HOLDING` | `expiry` reached | `EXPIRED` | Auto-delete shard |

---

## Message Reference

All messages use type URI `https://didcomm.org/swarm/1.0/<message-name>` with standard DIDComm v2 headers. All signaling MUST use **authcrypt**.

---

### store-request

Type: `https://didcomm.org/swarm/1.0/store-request`

**From**: `requester` -> `pledger`

Ask a pledger to store specific shards of a blob.

```json
{
  "type": "https://didcomm.org/swarm/1.0/store-request",
  "id": "sreq-a1b2c3",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:mediator-a"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "content_digest": "sha256-BASE64URL(...)",
    "size_bytes": 4194304,
    "shard_params": {
      "algorithm": "reed-solomon@1",
      "k": 6,
      "m": 9,
      "shard_size_bytes": 524288,
      "merkle_root": "sha256-BASE64URL(...)"
    },
    "shard_assignment": ["s1", "s4"],
    "ttl_expiry": "2027-04-21T00:00:00Z",
    "replication_factor": 3,
    "payment_offer": {
      "rate_per_gb_month": "0.10 USD",
      "session_id": "pay-sess-9f1c",
      "currency": "USD"
    },
    "audit_policy": {
      "challenge_interval_hours": 24,
      "challenge_timeout_seconds": 30
    },
    "tags": ["credential-backup"],
    "pthid": "credential-thread-2c7d4a1f"
  },
  "attachments": [
    {
      "id": "s1",
      "media_type": "application/octet-stream",
      "data": { "base64": "...shard s1 ciphertext..." }
    },
    {
      "id": "s4",
      "media_type": "application/octet-stream",
      "data": { "base64": "...shard s4 ciphertext..." }
    }
  ]
}
```

**Field notes:**

* `shard_assignment`: Specific shard IDs the pledger is asked to retain. Other shards go to other pledgers.
* `payment_offer`: Optional. If present, the pledger MAY require a Payments 1.0 handshake before issuing a receipt.
* `audit_policy`: Curator's challenge cadence the pledger commits to honoring.
* Shards are delivered as **DIDComm attachments**, keeping the body small and allowing transport-level chunking.

---

### store-receipt

Type: `https://didcomm.org/swarm/1.0/store-receipt`

**From**: `pledger` -> `requester`

Pledger commits to storing the shards.

```json
{
  "type": "https://didcomm.org/swarm/1.0/store-receipt",
  "id": "srcpt-d4e5f6",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:mediator-a",
  "to": ["did:example:alice"],
  "body": {
    "receipt_id": "rcpt-a1b2c3",
    "blob_id": "blob-7f1b8c5e",
    "shard_ids": ["s1", "s4"],
    "shard_digests": {
      "s1": "sha256-BASE64URL(...)",
      "s4": "sha256-BASE64URL(...)"
    },
    "sequence": 0,
    "expiry": "2027-04-21T00:00:00Z",
    "audit_endpoint": "did:example:mediator-a",
    "payment_ref": {
      "session_id": "pay-sess-9f1c",
      "tx_ref": "0xabc123..."
    },
    "jws": "<JWS over { pledger, requester, blob_id, shard_ids, shard_digests, sequence, expiry } by pledger's DID key>"
  }
}
```

* `sequence`: Monotonic per `(requester, blob_id)` pair. Incremented on every re-pledge or update of the same shards.
* The `jws` MUST be verifiable against the pledger's DID document.

---

### store-decline

Type: `https://didcomm.org/swarm/1.0/store-decline`

**From**: `pledger` -> `requester`

```json
{
  "type": "https://didcomm.org/swarm/1.0/store-decline",
  "id": "sdec-g7h8i9",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:mediator-c",
  "to": ["did:example:alice"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "reason": "insufficient-capacity",
    "alternative_peers": ["did:example:mediator-d", "did:example:mediator-e"]
  }
}
```

* `reason`: One of `insufficient-capacity`, `payment-rejected`, `policy-rejected`, `digest-invalid`, `quota-exceeded`, or free text.
* `alternative_peers`: Optional referral to other pledgers with capacity.

---

### ping-commitment

Type: `https://didcomm.org/swarm/1.0/ping-commitment`

**From**: `curator` -> `pledger`

Proof-of-storage challenge. Curator picks a random shard and a random byte range; pledger MUST return the requested bytes plus a Merkle proof to the blob's `merkle_root`.

```json
{
  "type": "https://didcomm.org/swarm/1.0/ping-commitment",
  "id": "ping-j1k2l3",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:mediator-a"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "shard_id": "s4",
    "byte_range": { "start": 102400, "end": 106496 },
    "challenge_nonce": "BASE64URL(random-32-bytes)",
    "expires": "2026-04-21T10:00:30Z"
  }
}
```

---

### pong-commitment

Type: `https://didcomm.org/swarm/1.0/pong-commitment`

**From**: `pledger` -> `curator`

```json
{
  "type": "https://didcomm.org/swarm/1.0/pong-commitment",
  "id": "pong-m4n5o6",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:mediator-a",
  "to": ["did:example:alice"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "shard_id": "s4",
    "byte_range": { "start": 102400, "end": 106496 },
    "bytes": "BASE64URL(...4096 bytes...)",
    "merkle_path": [
      "sha256-BASE64URL(...)",
      "sha256-BASE64URL(...)"
    ],
    "challenge_nonce": "BASE64URL(random-32-bytes)",
    "jws": "<JWS over { blob_id, shard_id, byte_range, bytes_digest, challenge_nonce } by pledger>"
  }
}
```

The curator MUST verify:
1. `merkle_path` reconstructs to the blob's `merkle_root`.
2. Hash of returned `bytes` matches the leaf in the Merkle tree.
3. `challenge_nonce` matches the original challenge (prevents replay).
4. `jws` is signed by the pledger's DID key.

A failed verification flips the pledge status to `failed` and triggers re-pledging.

---

### pledge-status

Type: `https://didcomm.org/swarm/1.0/pledge-status`

**From**: `curator` -> `requester` (when curator is a separate agent)

Periodic health summary of all pledges for a blob.

```json
{
  "type": "https://didcomm.org/swarm/1.0/pledge-status",
  "id": "pstat-p7q8r9",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:curator",
  "to": ["did:example:alice"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "as_of": "2026-04-21T10:00:00Z",
    "summary": {
      "replication_factor_target": 3,
      "replication_factor_current": 3,
      "healthy_shards": 9,
      "missing_shards": 0
    },
    "pledges": [
      { "peer_did": "did:example:mediator-a", "status": "healthy", "last_audit": "2026-04-21T08:00:00Z" },
      { "peer_did": "did:example:mediator-b", "status": "healthy", "last_audit": "2026-04-21T08:00:00Z" },
      { "peer_did": "did:example:mediator-c", "status": "healthy", "last_audit": "2026-04-21T08:00:00Z" }
    ]
  }
}
```

---

### retrieve-request

Type: `https://didcomm.org/swarm/1.0/retrieve-request`

**From**: `retriever` -> `pledger`

Recovery flow. Retriever asks pledgers to return shards. Authentication is via a Signing 1.0 ticket plus a ZCAP-LD capability invocation.

```json
{
  "type": "https://didcomm.org/swarm/1.0/retrieve-request",
  "id": "rreq-s1t2u3",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:alice-recovery",
  "to": ["did:example:mediator-a"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "shard_ids": ["s1", "s4"],
    "capability_invocation": "<ZCAP-LD invocation JWS>",
    "ticket": {
      "typ": "signing-ticket",
      "session_id": "recovery-sess-001",
      "scope": "swarm:retrieve",
      "device": "did:key:z6Mk...new-device",
      "ctr": 7,
      "exp": "2026-04-21T11:00:00Z",
      "cap": 1
    },
    "ticket_sig": {
      "suite": "jws-ed25519@1",
      "kid": "did:example:alice-recovery#key-1",
      "value": "base64url-encoded-signature"
    }
  }
}
```

The pledger MUST verify:
1. The ZCAP-LD invocation chains to the `retrieval_capability.controller` for this blob.
2. The Signing 1.0 ticket counter is monotonic for this `device`.
3. The ticket has not expired.
4. Capability caveats (expires, max_invocations) are still satisfied.

---

### retrieve-response

Type: `https://didcomm.org/swarm/1.0/retrieve-response`

**From**: `pledger` -> `retriever`

```json
{
  "type": "https://didcomm.org/swarm/1.0/retrieve-response",
  "id": "rres-v4w5x6",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:mediator-a",
  "to": ["did:example:alice-recovery"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "shard_ids": ["s1", "s4"],
    "merkle_paths": {
      "s1": ["sha256-BASE64URL(...)", "sha256-BASE64URL(...)"],
      "s4": ["sha256-BASE64URL(...)", "sha256-BASE64URL(...)"]
    }
  },
  "attachments": [
    { "id": "s1", "media_type": "application/octet-stream", "data": { "base64": "..." } },
    { "id": "s4", "media_type": "application/octet-stream", "data": { "base64": "..." } }
  ]
}
```

The retriever collects shards from multiple pledgers until they have at least `k` distinct shards, then reconstructs the original blob via the configured erasure code, verifies the `content_digest`, and decrypts using the KEK from `kek_ref`.

---

### release

Type: `https://didcomm.org/swarm/1.0/release`

**From**: `requester` -> `pledger`

Voluntarily release a pledge before TTL expiry. Pledger MUST delete the shards.

```json
{
  "type": "https://didcomm.org/swarm/1.0/release",
  "id": "rel-y7z8a9",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:mediator-a"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "shard_ids": ["s1", "s4"],
    "reason": "blob-superseded",
    "settle_payment": true
  }
}
```

* `reason`: `blob-superseded`, `migrated`, `no-longer-needed`, or free text.
* `settle_payment`: If `true`, indicates the requester will issue a final Payments 1.0 settlement for prorated storage time.

---

### release-ack

Type: `https://didcomm.org/swarm/1.0/release-ack`

**From**: `pledger` -> `requester`

```json
{
  "type": "https://didcomm.org/swarm/1.0/release-ack",
  "id": "rack-b1c2d3",
  "thid": "blob-7f1b8c5e",
  "from": "did:example:mediator-a",
  "to": ["did:example:alice"],
  "body": {
    "blob_id": "blob-7f1b8c5e",
    "shard_ids_deleted": ["s1", "s4"],
    "deletion_proof": "sha256-BASE64URL(...random-tombstone-token...)",
    "deleted_at": "2026-04-21T11:00:00Z"
  }
}
```

* `deletion_proof`: Pledger commits to having destroyed the data; future retrieval requests for these shards MUST be rejected.

---

### find-pledgers

Type: `https://didcomm.org/swarm/1.0/find-pledgers`

**From**: `requester` -> `coordinator` (a peer that maintains a roster of known pledgers)

Optional helper for peer discovery.

```json
{
  "type": "https://didcomm.org/swarm/1.0/find-pledgers",
  "id": "fp-e4f5g6",
  "from": "did:example:alice",
  "to": ["did:example:coordinator"],
  "body": {
    "min_capacity_bytes": 4194304,
    "max_rate_per_gb_month": "0.20 USD",
    "min_ttl_days": 365,
    "preferred_regions": ["us-east", "eu-west"],
    "exclude_dids": ["did:example:mediator-x"]
  }
}
```

---

### pledger-list

Type: `https://didcomm.org/swarm/1.0/pledger-list`

**From**: `coordinator` -> `requester`

```json
{
  "type": "https://didcomm.org/swarm/1.0/pledger-list",
  "id": "pl-h7i8j9",
  "thid": "fp-e4f5g6",
  "from": "did:example:coordinator",
  "to": ["did:example:alice"],
  "body": {
    "pledgers": [
      {
        "peer_did": "did:example:mediator-a",
        "available_capacity_bytes": 53687091200,
        "rate_per_gb_month": "0.10 USD",
        "region": "us-east",
        "uptime_30d": 0.998,
        "supported_extensions": ["reed-solomon@1", "fountain@1"]
      },
      {
        "peer_did": "did:example:mediator-b",
        "available_capacity_bytes": 21474836480,
        "rate_per_gb_month": "0.08 USD",
        "region": "eu-west",
        "uptime_30d": 0.995,
        "supported_extensions": ["reed-solomon@1"]
      }
    ]
  }
}
```

The coordinator role is **non-authoritative** — it's a directory service. Requesters MAY use multiple coordinators or skip them entirely if peer DIDs are known a priori.

---

## Flows

### Flow 1: Basic Blob Storage (RF=3)

```
Alice (requester)            Mediator A    Mediator B    Mediator C
       |                          |             |             |
       |-- store-request (s1,s4)->|             |             |
       |-- store-request (s2,s5)----------------->|             |
       |-- store-request (s3,s6,s7,s8,s9)-------->|             |
       |                          |             |             |
       |<- store-receipt --------|             |             |
       |<- store-receipt --------------------|             |
       |<- store-receipt --------------------------------------|
       |                                                       |
       |   [Blob is now STORED at RF=3]                        |
       |                                                       |
  [24h]                                                        |
       |-- ping-commitment (s4) ->|             |             |
       |<- pong-commitment ------|             |             |
       |   [Verify Merkle proof]                              |
       |                                                       |
  [TTL]                                                        |
       |-- release (or auto-expire) ->|        |             |
       |<- release-ack ----------|             |             |
```

### Flow 2: Recovery on a New Device

```
Alice-new-device         Mediator A    Mediator B    Mediator C
       |                       |             |             |
   [Alice unlocks recovery key, derives ZCAP invocation]     |
       |                       |             |             |
       |-- retrieve-request --->|            |             |
       |   (s1, s4 + ZCAP)     |             |             |
       |-- retrieve-request -------------------->|             |
       |   (s2, s5 + ZCAP)                    |             |
       |-- retrieve-request -------------------------------->|
       |   (s3, s6, s7, s8, s9 + ZCAP)                       |
       |                       |             |             |
       |<- retrieve-response --|            |             |
       |<- retrieve-response --------------|             |
       |<- retrieve-response --------------------------------|
       |                                                     |
   [Have 9 shards; need only 6 (k=6); reconstruct blob,      |
    verify content_digest, decrypt with KEK]                 |
```

### Flow 3: Pledger Failure -> Re-Pledge

```
Alice (requester)        Mediator B (failing)    Mediator D (replacement)
       |                       |                          |
       |-- ping-commitment --->|                          |
       |   (challenge s5)      |                          |
       |   [no response within timeout]                   |
       |                                                  |
   [Mark Mediator B as failed; reconstruct s5 from k other shards]
       |                                                  |
       |-- store-request (s5) ------------------------->  |
       |<- store-receipt ----------------------------- ---|
       |                                                  |
   [RF restored to 3]                                     |
```

### Flow 4: Composition with Vaults 1.0 — EDV Mirror

```
Alice                  EDV (primary)         Swarm (peers x3)
       |                      |                     |
       |-- vaults/update ---->|                     |
       |<- ack ---------------|                     |
       |                                            |
   [Compute swarm shards of new ciphertext]         |
       |                                            |
       |-- swarm/store-request (RF=3) ------------->|
       |   (pthid = vault thid)                     |
       |<- swarm/store-receipt ---------------------|
       |                                            |
   [If primary EDV becomes unreachable]             |
       |                                            |
       |-- swarm/retrieve-request ------------------>|
       |<- swarm/retrieve-response (ciphertext) -----|
       |                                            |
   [Reconstruct + verify; vault data available]     |
```

### Flow 5: Composition with Issue Credential 3.0 — Backup

```
Issuer                 Holder                 Mediators (RF=3)
       |                      |                     |
       |-- issue-credential ->|                     |
       |<- ack ---------------|                     |
       |                      |                     |
   [Holder encrypts credential with backup key]     |
       |                      |                     |
       |                      |-- swarm/store-request ->|
       |                      |   (pthid = credential thid)
       |                      |<- swarm/store-receipt -|
       |                                            |
   [Holder loses device]                            |
   [New device, recovery key unlocked from backup]  |
       |                      |                     |
       |                      |-- swarm/retrieve-request ->|
       |                      |<- swarm/retrieve-response -|
       |                                            |
   [Credential restored without re-issuance]        |
```

### Flow 6: Composition with Media Sharing 1.0 — Pin

```
Sender              Receiver              Swarm Peers
       |                  |                   |
       |-- share-media ->|                    |
       |   (CDN URL,    |                    |
       |    CEK)        |                    |
       |                  |                   |
   [Receiver downloads + decrypts]            |
       |                  |                   |
       |                  |-- swarm/store-request (RF=5, TTL=90d)
       |                  |   (pthid = share-media thid)
       |                  |<- swarm/store-receipt
       |                                      |
   [CDN deletes file]                         |
   [Receiver loses local copy]                |
       |                  |-- swarm/retrieve-request
       |                  |<- swarm/retrieve-response
       |                                      |
   [Media recovered from swarm]               |
```

### Flow 7: Composition with Message Pickup 4.0 — Mediator Failover

```
Sender         Mediator A (primary)    Mediator B + C (swarm peers)
       |                |                       |
       |-- forward ---->|                       |
       |                |   [Queue locally]     |
       |                |-- swarm/store-request -->|
       |                |   (pthid = message id) |
       |                |<- swarm/store-receipt --|
       |                                         |
   [Mediator A crashes]                          |
       |                                         |
   [Recipient comes online, registered with B too]
       |                                         |
       |   Recipient -- pickup/delivery-request ->|
       |   B consults its swarm copies           |
       |   B <- pickup/delivery -- with messages |
```

---

## Composition with Other Protocols

### Vaults 1.0

* **Cross-host replication**: Vault descriptors gain an optional `swarm_replicas` array. After every vault `update`, the controller emits `swarm/store-request` with the new ciphertext and `pthid` set to the vault thread.
* **Recovery on host failure**: When the primary EDV is unreachable, the controller invokes `swarm/retrieve-request` to peers and reads ciphertext from the swarm.
* **OCC sequence sync**: Pledger's `sequence` field on `store-receipt` mirrors the vault's optimistic concurrency token to detect divergence.
* **Capability reuse**: The vault's existing ZCAP-LD authorization extends to swarm retrieval — no separate capability infrastructure.

### Issue Credential 3.0

* **Holder-side backup**: After receiving a credential, the holder MAY emit `swarm/store-request` with the encrypted credential, `pthid` pointing to the credential thread.
* **Recovery without re-issuance**: A new device with the recovery key derives the ZCAP invocation and pulls credentials back via `swarm/retrieve-request`.
* **Selective backup**: Holders MAY backup individual credentials with different replication factors (e.g., RF=5 for high-value KYC credentials, RF=2 for ephemeral access tokens).

### Media Sharing 1.0

* **Receiver pinning**: After `share-media`, the receiver MAY emit `swarm/store-request` to make the file durable beyond the sender's CDN lifetime.
* **Sender pinning**: Senders that want guaranteed availability MAY pin proactively before sending the share message.
* **Large file chunking**: Swarm shards align with the natural chunk boundaries of the encrypted file.

### Message Pickup 4.0

* **Queue replication**: Mediators MAY shadow-write inbound forward messages to swarm peers via `swarm/store-request` with `pthid` set to the message ID.
* **Failover**: A second mediator the recipient has registered with can pull queued messages from the swarm if the primary fails.
* **Idempotency**: The swarm `blob_id` MAY equal the message's DIDComm `id` for natural deduplication.

### Coordinate Mediation 3.0

* **Routing table backup**: Mediators MAY periodically snapshot their routing tables and store them via `swarm/store-request`.
* **Disaster recovery**: A rebuilt mediator can restore its routing table from swarm peers, then re-advertise to recipients.

### Signing 1.0

* **Authorization tickets**: `retrieve-request` reuses Signing 1.0 tickets for replay protection (monotonic counter per device, expiry, scope `swarm:retrieve`).
* **Pledge co-signing**: Threshold-signed pledges (FROST/MuSig2) where multiple mediators jointly attest to durability.
* **Signed deletion proofs**: Future revision MAY require Signing 1.0 attestations on `release-ack` for compliance use cases.

### Payments 1.0

* **Pay for storage**: `payment_offer` in `store-request` aligns with Payments 1.0 `handshake-request`. Pledger's `store-receipt` references `tx_ref`.
* **Recurring storage subscriptions**: `mandate-offer` for monthly per-GB charges; pledger renews TTL on each successful charge cycle.
* **Settlement on release**: `release` with `settle_payment: true` triggers a Payments 1.0 settlement for prorated storage.

### Receipts 1.0

* **Audit logging**: `pong-commitment` responses MAY be summarized as Receipts 1.0 entries for downstream observability.
* **Health dashboards**: `pledge-status` summaries can be relayed via Receipts 1.0 to monitoring systems.

### Mesh 1.0

* **Sharded transport**: Swarm shards MAY travel as Mesh frames when the network is offline-first; `shard_size_bytes` SHOULD be tuned to the Mesh frame budget.
* **Cluster-local pledgers**: Mesh gateways can serve as pledgers for nearby agents without internet, providing region-local durability.
* **Compact attestations**: PledgeReceipts SHOULD use compact CBOR encoding when serialized over Mesh transports.

### Routing 2.0

* Swarm messages travel through DIDComm `forward` like any other DIDComm message — no special routing semantics required.

---

## Security Considerations

1. **DIDComm authcrypt**: All swarm messages MUST use DIDComm v2 authcrypt. Pledgers MUST verify the requester's DID before issuing receipts.

2. **Content encryption**: Swarm pledgers receive **ciphertext only**. The blob's encryption key MUST be managed outside the swarm (e.g., in a Vaults 1.0 EDV via `kek_ref`). Pledgers without access to the KEK cannot read content even with full shard access.

3. **Sybil resistance**: Replication factor only provides durability if the `replication_factor` distinct DIDs are independently controlled. Requesters SHOULD prefer pledgers with established reputation (uptime, prior receipts) and geographic diversity.

4. **Proof-of-storage**: `ping-commitment` challenges with random byte ranges and nonces detect silent data loss. Pledgers MUST NOT cache challenge responses; each response MUST come from the actual stored shard.

5. **Replay protection on retrieval**: `retrieve-request` carries a Signing 1.0 ticket with a monotonic counter. Pledgers MUST persist `last_seen_ctr(device)` BEFORE serving and reject any `ctr <= last_seen_ctr`.

6. **Capability scope**: ZCAP-LD invocations MUST be scoped to the specific `blob_id`. A capability for one blob MUST NOT be valid for another. Caveats (`expires_at`, `max_invocations`) MUST be enforced.

7. **Erasure code DoS protection**: Implementations MUST cap `m` (total shards) at a reasonable limit (recommended: 64) to prevent abuse via excessive shard counts.

8. **TTL enforcement**: Pledgers MUST delete shards within a grace window after `expiry`. Late-deleted shards MUST NOT be served to retrieval requests after `expiry + grace`.

9. **Deletion proofs**: `release-ack` includes a `deletion_proof` token. Pledgers serving a shard for which they previously sent a deletion proof MUST be considered Byzantine and excluded.

10. **Curator independence**: The curator role SHOULD be separable from the pledger role. A pledger auditing its own shards has no value. Use independent curators or rotate curator duties across pledgers.

11. **Coordinator integrity**: `pledger-list` results from a coordinator are advisory. Requesters MUST verify pledger DIDs and not rely on coordinator-supplied metadata for trust decisions.

12. **Side-channel timing**: Retrieval response time can leak whether a pledger holds a particular shard. Pledgers SHOULD implement constant-time response or jitter to limit fingerprinting.

---

## Privacy Considerations

1. **Pairwise DIDs**: Use pairwise DIDs per (requester, pledger) pair to prevent cross-blob correlation by pledgers.

2. **Tag minimization**: The `tags` field on `BlobDescriptor` MUST NOT contain sensitive content (e.g., "alice's-bank-credential"). Use opaque identifiers when categorization is needed.

3. **Pledger metadata leakage**: Pledgers learn `(requester_did, blob_size, ttl, payment_amount)` per pledge. To reduce correlation, requesters MAY use pairwise DIDs and randomize pledge timing.

4. **Coordinator privacy**: Coordinators learn which pledgers are advertising capacity but do not learn what blobs are stored. They MAY still profile activity volume; sensitive deployments should self-coordinate without a directory.

5. **Audit cadence inference**: Predictable `ping-commitment` schedules reveal storage patterns. Curators SHOULD jitter challenge timing.

6. **Reconstruction observation**: A pledger that responds to `retrieve-request` learns the requester is recovering data. Sensitive recoveries MAY use cover retrievals or onion routing (out of scope here).

---

## Validation Rules (Normative)

1. `blob_id` MUST be globally unique (UUID v4 recommended with `blob-` prefix).

2. `shard_params.k`, `shard_params.m` MUST satisfy `0 < k <= m <= 64` and `k <= number_of_pledgers`.

3. `replication_factor` MUST be `>= 1` and `<= m`. Each pledger holds `ceil(m / replication_factor)` shards on average.

4. `ttl_expiry` MUST be a future timestamp at the time of `store-request`.

5. All Merkle paths MUST verify against the blob's `merkle_root`.

6. `store-receipt.sequence` MUST be monotonic per `(pledger_did, blob_id)` pair.

7. `ping-commitment.expires` MUST be a near-future timestamp (recommended: <=60s after issuance) to prevent challenge hoarding.

8. `pong-commitment` MUST echo the original `challenge_nonce`; mismatches MUST be treated as failed challenges.

9. ZCAP-LD invocations MUST chain to `retrieval_capability.controller` for the target blob.

10. Signing 1.0 ticket counters MUST be monotonic per `(retriever_did, device)` pair across all swarm interactions.

11. Pledgers MUST reject `store-request` with `digest` mismatch on the delivered shards.

12. `release-ack.deletion_proof` MUST be unique per release and recorded by the pledger to prevent re-serve.

---

## Error Codes (Problem Reports)

All errors use the standard DIDComm `problem-report` format with type `https://didcomm.org/swarm/1.0/problem-report`.

| Code | Description |
|------|-------------|
| `blob_not_found` | Referenced `blob_id` does not exist at this pledger |
| `shard_not_held` | Specific shard is not held by this pledger |
| `digest_mismatch` | Delivered shard digest does not match advertised digest |
| `merkle_invalid` | Merkle proof does not verify against `merkle_root` |
| `capacity_exceeded` | Pledger has insufficient available storage |
| `payment_required` | Pledger requires Payments 1.0 handshake before pledging |
| `payment_insufficient` | Offered payment below pledger's minimum rate |
| `capability_invalid` | ZCAP-LD invocation does not chain or does not authorize this blob |
| `capability_expired` | Capability has passed its `expires_at` caveat |
| `capability_invocation_limit` | Capability has hit its `max_invocations` caveat |
| `ticket_replay` | Signing 1.0 ticket counter <= last_seen_ctr |
| `ticket_expired` | Signing 1.0 ticket past `exp` |
| `challenge_expired` | `ping-commitment` past `expires` |
| `challenge_nonce_mismatch` | `pong-commitment.challenge_nonce` does not match |
| `pledge_expired` | Pledge has passed `ttl_expiry`; data deleted |
| `pledge_released` | Pledge was released; data deleted |
| `replication_below_threshold` | Healthy shard count below `k`; blob unrecoverable |
| `erasure_code_unsupported` | Pledger does not support requested erasure algorithm |
| `coordinator_unavailable` | Coordinator service is unreachable or rejected the query |

---

## Implementation Hints

### Sharding a Blob

```javascript
async function shardBlob(plaintext, kek, params) {
  const ciphertext = await encrypt(plaintext, kek);
  const contentDigest = sha256(ciphertext);

  const { k, m, shard_size_bytes, algorithm } = params;
  const shards = await erasureEncode(ciphertext, { k, m, algorithm });

  const shardDigests = shards.map(sha256);
  const merkleTree = buildMerkleTree(shardDigests);

  return {
    blob_id: `blob-${uuidv4()}`,
    content_digest: contentDigest,
    size_bytes: ciphertext.length,
    shard_params: {
      algorithm,
      k,
      m,
      shard_size_bytes,
      merkle_root: merkleTree.root
    },
    shards: shards.map((data, i) => ({
      shard_id: `s${i + 1}`,
      merkle_index: i,
      merkle_path: merkleTree.proof(i),
      digest: shardDigests[i],
      data
    }))
  };
}
```

### Distributing Shards Across Pledgers

```javascript
function assignShards(shards, pledgers, replicationFactor) {
  const shardsPerPledger = Math.ceil(shards.length / replicationFactor);
  const assignments = new Map();
  let cursor = 0;

  for (const pledger of pledgers) {
    const slice = shards.slice(cursor, cursor + shardsPerPledger);
    assignments.set(pledger.peer_did, slice.map(s => s.shard_id));
    cursor += shardsPerPledger;
  }

  return assignments;
}
```

### Verifying a Proof-of-Storage Response

```javascript
function verifyPongCommitment(challenge, response, blobDescriptor) {
  if (response.challenge_nonce !== challenge.challenge_nonce) {
    throw new SwarmError("challenge_nonce_mismatch");
  }
  if (Date.now() > new Date(challenge.expires).getTime()) {
    throw new SwarmError("challenge_expired");
  }

  const reconstructed = reconstructLeafFromBytes(response.bytes);
  const root = applyMerklePath(reconstructed, response.merkle_path);

  if (root !== blobDescriptor.shard_params.merkle_root) {
    throw new SwarmError("merkle_invalid");
  }

  return verifyJWS(response.jws, getDIDKey(response.from));
}
```

### Reconstructing a Blob

```javascript
async function reconstructBlob(blobDescriptor, shards) {
  if (shards.length < blobDescriptor.shard_params.k) {
    throw new SwarmError("replication_below_threshold");
  }

  const ciphertext = await erasureDecode(shards, blobDescriptor.shard_params);
  const digest = sha256(ciphertext);

  if (digest !== blobDescriptor.content_digest) {
    throw new SwarmError("digest_mismatch");
  }

  const kek = await resolveRef(blobDescriptor.encryption.kek_ref);
  return await decrypt(ciphertext, kek);
}
```

---

## Storage Tiers (Informative)

A single Swarm spec serves multiple use cases via parameter choices:

| Tier | RF | TTL | Payment | Use Case |
|------|----|----|---------|----------|
| **Hot queue** | 2 | hours | free / mediator-bundled | Message Pickup failover |
| **Warm vault** | 3 | months | small fee | Vault EDV mirror |
| **Cold archive** | 5 | years | mandate-based | Credential backup, audit trails |
| **Public pin** | N | indefinite | community-funded | Public schemas, large media |

These are guidance, not normative tiers. Requesters set `replication_factor` and `ttl_expiry` per blob.

---

## References

* [DIDComm Messaging v2.0](https://identity.foundation/didcomm-messaging/spec/v2.0/)
* [Discover Features Protocol 2.0](https://didcomm.org/discover-features/2.0/)
* [Vaults 1.0 Protocol](https://didcomm.org/vaults/1.0/)
* [Issue Credential 3.0 Protocol](https://didcomm.org/issue-credential/3.0/)
* [Media Sharing 1.0 Protocol](https://didcomm.org/media-sharing/1.0/)
* [Message Pickup 4.0 Protocol](https://didcomm.org/messagepickup/4.0/)
* [Coordinate Mediation 3.0 Protocol](https://didcomm.org/coordinate-mediation/3.0/)
* [Signing 1.0 Protocol](https://didcomm.org/signing/1.0/)
* [Payments 1.0 Protocol](https://didcomm.org/payments/1.0/)
* [Receipts 1.0 Protocol](https://didcomm.org/receipts/2.0/)
* [Mesh 1.0 Protocol](https://didcomm.org/mesh/1.0/)
* [Routing 2.0 Protocol](https://didcomm.org/routing/2.0/)
* [Report Problem 2.0](https://didcomm.org/report-problem/2.0/)
* [Authorization Capabilities for Linked Data (ZCAP-LD)](https://w3c-ccg.github.io/zcap-spec/)
* [Reed-Solomon error correction](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction)
* [HPKE (RFC 9180)](https://datatracker.ietf.org/doc/rfc9180/)
