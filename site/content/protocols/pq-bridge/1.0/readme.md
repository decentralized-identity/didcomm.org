---
title: PQ-Bridge
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/pq-bridge/1.0
status: Proposed
summary: A DIDComm v2 protocol that adds post-quantum and hybrid (classical + PQ) key exchange, encryption, and signing on top of the existing DIDComm handshake. Bridges the gap until DIDComm core adopts NIST FIPS 203/204 primitives natively. Supports ML-KEM-768/1024 encapsulation, ML-DSA-65/87 signatures, hybrid X25519+ML-KEM and Ed25519+ML-DSA modes, suite negotiation via Discover Features, key rotation, and replay-protected envelope wrapping for arbitrary message bodies and attachments.
tags: [post-quantum, pqc, ml-kem, ml-dsa, kyber, dilithium, hybrid, key-exchange, fips-203, fips-204, quantum-safe, harvest-now-decrypt-later]
authors:
  - name: Vinay Singh
    email: vinay@verid.id
---

## Summary

PQ-Bridge 1.0 is a DIDComm v2 protocol that adds **post-quantum (PQ) key exchange, hybrid encryption, and PQ signatures** on top of the existing DIDComm handshake. It is designed as a **bridge** — a stable, interoperable wire format for adding NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) protection to DIDComm traffic until the DIDComm core specification adopts these primitives natively.

The protocol runs **after** a DIDComm connection reaches its `completed` state. Peers negotiate a PQ suite via Discover Features 2.0, exchange encapsulation keys, derive a session-bound shared secret, and optionally upgrade subsequent message bodies and attachments to **hybrid encryption** (classical + PQ) so that breaking the channel requires breaking *both* primitives.

The protocol covers seven specific areas: proper type URIs for PQ messages, suite negotiation, hybrid mode selection, replay protection across reconnections, key rotation with overlap windows, PQ signatures as a first-class flow, and explicit HKDF transcript binding.

---

## Motivation

DIDComm v2 today uses **classical X25519/Ed25519** for authcrypt and signing. A sufficiently capable quantum adversary could break these primitives with Shor's algorithm, and the **harvest-now-decrypt-later** threat is already real: an attacker recording today's DIDComm traffic can decrypt it years later.

Three options exist:

1. Wait for DIDComm core to add PQ — slow standards process.
2. Roll PQ ad-hoc per implementation — fragments interop.
3. **Standardize a bridge protocol** that wraps existing PQ implementations behind a stable wire format.

This protocol is option 3. It does not modify DIDComm authcrypt or replace existing JOSE primitives; instead, it adds a **second cryptographic layer** sitting inside DIDComm message bodies. When DIDComm core eventually adopts ML-KEM and ML-DSA in JWE/JWS, this protocol can be deprecated cleanly since its envelope format mirrors the structures DIDComm core will likely converge on.

---

## Design Properties

The protocol is built around the following invariants:

| Property | How it's enforced |
|----------|-------------------|
| Every PQ message has a proper DIDComm type URI | All messages use `https://didcomm.org/pq-bridge/1.0/<name>` |
| Suite is explicitly negotiated, never assumed | `propose-upgrade`/`accept-upgrade` selects from a registered suite list |
| Hybrid vs pure-PQ is an explicit choice | `mode` field: `pq-only`, `hybrid-encrypt`, `hybrid-sign`, `hybrid-full` |
| Replay and downgrade attacks are blocked | Transcript hash + per-`propose-upgrade` 32-byte `nonce` mixed into HKDF |
| Keys can be rotated cleanly without dropping in-flight messages | `rotate-key` with `generation` counter and overlap window |
| ML-DSA signatures are first-class, not bolted on | `pq-signature` message and signed `pq-envelope` mode |
| Anti-replay combines timestamp window + nonce + transcript | All three required, individually insufficient |
| Cross-implementation interop is achievable | Normative HKDF info string `didcomm.org/pq-bridge/1.0/{purpose}` |
| Failures are machine-readable | Standard problem-report codes (`pq.suite_unsupported`, `pq.kid_mismatch`, etc.) |

---

## Goals / Non-Goals

**Goals**

* Add post-quantum key exchange and signing to any DIDComm v2 connection without modifying DIDComm core.
* Negotiate suite and hybrid mode explicitly so peers fail loudly when one cannot meet the other's security posture.
* Bind the PQ shared secret to a transcript hash so it cannot be replayed in a different session context.
* Support clean key rotation while in-flight messages still decrypt.
* Compose with Vaults 1.0, Swarm 1.0, Issue Credential 3.0, and Rooms 1.0 for end-to-end PQ-protected workflows.
* Allow implementations migrating from non-standard PQ key exchanges (e.g., a body-typed `kem-key-exchange` ridden over BasicMessage) to coexist during a transition window.

**Non-Goals**

* Not a replacement for DIDComm authcrypt — this protocol layers on top.
* Not a transport — relies on standard DIDComm v2 routing and transports.
* Not a PKI — DIDs and DID documents remain the trust root.
* Not a PQ DID method — verification keys can still be classical; PQ keys are session-scoped.
* Not a re-implementation of MLS — Rooms 1.0 handles group keying; this protocol covers pairwise sessions.

---

## Roles

* **initiator**: Sends the first `propose-upgrade` after the DIDComm connection reaches `completed`. Either peer MAY initiate; concurrent initiations are resolved by the tie-break rule below.
* **responder**: Receives `propose-upgrade` and replies with `accept-upgrade` or `decline-upgrade`.
* **rotator**: Either peer can act as a rotator at any time after `KEM_BOUND` by sending `rotate-key`.

### Role Requirements

**initiator** implementations MUST:

* Send `propose-upgrade` with at least one supported suite and one supported mode.
* Generate a fresh 32-byte `nonce` for each `propose-upgrade`.
* Maintain a per-connection state machine including the negotiated suite, mode, current key generation, and last-seen peer `kid`.

**responder** implementations MUST:

* Reply with `accept-upgrade` selecting one suite + one mode from the proposal, OR `decline-upgrade` with a reason.
* Verify the `propose-upgrade.nonce` is fresh (not seen for this connection in the last `nonce_window`).
* Bind the negotiated `nonce` into the transcript hash.

**rotator** implementations MUST:

* Maintain at least one prior key generation for the configured `rotation_overlap_seconds` after rotation.
* Refuse decapsulation requests using a generation older than the overlap window.

### Tie-Break Rule for Concurrent Initiation

If both peers send `propose-upgrade` simultaneously, the peer with the **lexicographically lower DID** is the initiator; the other peer treats its own `propose-upgrade` as superseded and processes the peer's instead. Without this rule, dual-init races leave the connection in an ambiguous state where each side has a different idea of which keypair won.

---

## Discovery

Clients MUST use Discover Features 2.0 to advertise PQ-Bridge support before sending `propose-upgrade`:

```json
{
  "type": "https://didcomm.org/discover-features/2.0/disclose",
  "body": {
    "disclosures": [{
      "feature-type": "protocol",
      "id": "https://didcomm.org/pq-bridge/1.0",
      "roles": ["initiator", "responder"],
      "extensions": {
        "suites": [
          "pq-suite-p1",
          "pq-suite-p2",
          "pq-suite-h1"
        ],
        "modes": [
          "pq-only",
          "hybrid-encrypt",
          "hybrid-sign",
          "hybrid-full"
        ],
        "max_envelope_bytes": 16777216,
        "rotation_supported": true,
        "rotation_overlap_seconds": 300,
        "nonce_window_seconds": 600
      }
    }]
  }
}
```

---

## Suite Registry

Suites are identifiers that pin specific KEM, signature, AEAD, and KDF algorithms. Implementations MUST reject unknown suite identifiers.

| Suite ID | KEM | Signature | AEAD | KDF | Notes |
|----------|-----|-----------|------|-----|-------|
| `pq-suite-p1` | ML-KEM-768 | none | AES-256-GCM | HKDF-SHA-256 | Encryption only. Minimum viable PQ profile. |
| `pq-suite-p2` | ML-KEM-768 | ML-DSA-65 | AES-256-GCM | HKDF-SHA-256 | Adds PQ signing. |
| `pq-suite-p3` | ML-KEM-1024 | ML-DSA-87 | AES-256-GCM | HKDF-SHA-512 | Higher security level (NIST level 5). |
| `pq-suite-h1` | X25519 + ML-KEM-768 | Ed25519 + ML-DSA-65 | AES-256-GCM | HKDF-SHA-256 | **Hybrid (recommended).** Both classical and PQ must be broken. |
| `pq-suite-h2` | X25519 + ML-KEM-1024 | Ed25519 + ML-DSA-87 | AES-256-GCM | HKDF-SHA-512 | Hybrid, NIST level 5. |
| `pq-suite-x1` | X-Wing | none | AES-256-GCM | HKDF-SHA-256 | Reserved for X-Wing hybrid KEM (IETF draft). |

### Algorithm Sizes

| Algorithm | Public key | Secret key | Ciphertext | Shared secret | Signature |
|-----------|-----------|-----------|-----------|---------------|-----------|
| ML-KEM-768 | 1184 B | 2400 B | 1088 B | 32 B | — |
| ML-KEM-1024 | 1568 B | 3168 B | 1568 B | 32 B | — |
| ML-DSA-65 | 1952 B | 4032 B | — | — | 3309 B |
| ML-DSA-87 | 2592 B | 4896 B | — | — | 4627 B |

These sizes are normative for byte-length validation in `kem-exchange`, `pq-signature`, and `pq-envelope` messages. Implementations MUST reject messages with mismatched lengths before any cryptographic processing.

---

## Modes

Modes determine which message components are protected with PQ primitives.

| Mode | Body encryption | Body signature | Notes |
|------|-----------------|---------------|-------|
| `pq-only` | PQ KEM + AEAD only | none / classical | Discouraged: lose DIDComm classical security if PQ has a flaw. |
| `hybrid-encrypt` | DIDComm authcrypt + PQ envelope | classical | **Default.** Body decryption requires breaking both classical and PQ. |
| `hybrid-sign` | classical authcrypt | classical + PQ signature | Adds non-repudiation against PQ adversary. |
| `hybrid-full` | both layers | both layers | Maximum security. Use for high-value workflows. |

Mode is negotiated per connection in `accept-upgrade`. A peer MAY downgrade per-message via the `pq-envelope.mode` field, but MUST NOT upgrade beyond the negotiated maximum without re-running `propose-upgrade`.

---

## Data Model

### KemKeypair (local persistence)

```json
{
  "kid": "BASE64URL(SHA-256(public_key))",
  "suite": "pq-suite-p1",
  "generation": 0,
  "public_key": "BASE64URL(...1184 bytes...)",
  "secret_key": "BASE64URL(...2400 bytes...)",
  "connection_id": "conn-abc",
  "created_at": "2026-04-21T10:00:00Z",
  "rotated_from": null
}
```

`generation` increments on each rotation. The `kid` is a function of the public key only, so a rotation produces a new `kid` automatically.

### PeerKemKey

```json
{
  "kid": "BASE64URL(SHA-256(peer_public_key))",
  "suite": "pq-suite-p1",
  "generation": 0,
  "public_key": "BASE64URL(...)",
  "peer_did": "did:example:bob",
  "connection_id": "conn-abc",
  "received_at": "2026-04-21T10:00:01Z"
}
```

### Transcript Hash

The transcript hash binds the shared secret to the negotiation context. After both sides have exchanged `propose-upgrade` and `accept-upgrade`:

```
transcript = SHA-256(
  "didcomm.org/pq-bridge/1.0/transcript" ||
  initiator_did ||
  responder_did ||
  connection_id ||
  proposed_suites_canonical_json ||
  selected_suite ||
  selected_mode ||
  initiator_nonce ||
  responder_nonce
)
```

`transcript` is then mixed into HKDF when deriving session keys (see "Key Schedule" below). This prevents an attacker from substituting a different suite/mode after the fact, even if they later compromise a key.

### Key Schedule

When `kem-exchange` completes for suite `pq-suite-p1` (ML-KEM-768):

```
ss          = MLKEM768.Decapsulate(local_secret_key, peer_ciphertext)   // 32 B
session_key = HKDF-Extract(salt = transcript, ikm = ss)                  // 32 B
kek         = HKDF-Expand(session_key, info = "didcomm.org/pq-bridge/1.0/kek/{generation}", L = 32)
auth_key    = HKDF-Expand(session_key, info = "didcomm.org/pq-bridge/1.0/auth/{generation}", L = 32)
```

For hybrid suites (`pq-suite-h1`, `pq-suite-h2`):

```
ss_pq       = MLKEM768.Decapsulate(local_pq_sk, peer_pq_ct)
ss_classical = X25519(local_classical_sk, peer_classical_pk)
ss          = ss_classical || ss_pq                                      // 64 B concatenation
session_key = HKDF-Extract(salt = transcript, ikm = ss)
```

The HKDF info string `didcomm.org/pq-bridge/1.0/{purpose}` is normative. Implementations migrating from a non-standard info string MUST run both HKDF derivations and accept either during a transition window.

---

## States / State Machine

### Per-Connection PQ State

| State | Trigger | Next State | Notes |
|-------|---------|------------|-------|
| `IDLE` | DIDComm `completed` reached | `READY` | Eligible for PQ upgrade |
| `READY` | `propose-upgrade` sent | `PROPOSING` | Awaiting `accept-upgrade` |
| `READY` | `propose-upgrade` received | `EVALUATING` | Decide accept/decline |
| `PROPOSING` | `accept-upgrade` received | `KEX_PENDING` | Await `kem-exchange` |
| `PROPOSING` | `decline-upgrade` received | `READY` | Optionally retry with different suites |
| `EVALUATING` | `accept-upgrade` sent | `KEX_PENDING` | Both sides have suite/mode |
| `EVALUATING` | `decline-upgrade` sent | `READY` | Suite/mode mismatch |
| `KEX_PENDING` | `kem-exchange` sent (initiator side) | `KEX_AWAIT_CONFIRM` | Local keypair generated |
| `KEX_PENDING` | `kem-exchange` received (responder side) | `KEX_AWAIT_CONFIRM` | Decapsulate, derive shared secret |
| `KEX_AWAIT_CONFIRM` | `kem-confirm` received | `KEM_BOUND` | Shared secret active |
| `KEM_BOUND` | `rotate-key` initiated | `ROTATING` | Old key valid for overlap window |
| `ROTATING` | `kem-exchange` for new generation done | `KEM_BOUND` | New generation active |
| `KEM_BOUND` | DIDComm connection closed | `IDLE` | Discard session keys |

---

## Message Reference

All messages use type URI `https://didcomm.org/pq-bridge/1.0/<message-name>` with standard DIDComm v2 headers. All messages MUST use **DIDComm authcrypt** for transport-layer confidentiality and authenticity.

---

### propose-upgrade

Type: `https://didcomm.org/pq-bridge/1.0/propose-upgrade`

**From**: `initiator` -> `responder`

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/propose-upgrade",
  "id": "prop-a1b2c3",
  "thid": "pq-conn-abc",
  "from": "did:example:alice",
  "to": ["did:example:bob"],
  "created_time": 1775318400,
  "body": {
    "suites": ["pq-suite-h1", "pq-suite-p2", "pq-suite-p1"],
    "modes": ["hybrid-full", "hybrid-encrypt"],
    "nonce": "BASE64URL(32-bytes)",
    "rotation_overlap_seconds": 300,
    "max_envelope_bytes": 16777216
  }
}
```

* `suites`: Ordered by initiator preference (most preferred first).
* `modes`: Ordered by initiator preference.
* `nonce`: 32 fresh random bytes; mixed into transcript hash.
* `thid`: A UUID identifying the PQ session for this connection. Used as the `thid` for all subsequent PQ-Bridge messages on this connection.

---

### accept-upgrade

Type: `https://didcomm.org/pq-bridge/1.0/accept-upgrade`

**From**: `responder` -> `initiator`

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/accept-upgrade",
  "id": "acc-d4e5f6",
  "thid": "pq-conn-abc",
  "from": "did:example:bob",
  "to": ["did:example:alice"],
  "body": {
    "selected_suite": "pq-suite-h1",
    "selected_mode": "hybrid-full",
    "nonce": "BASE64URL(32-bytes)",
    "rotation_overlap_seconds": 300,
    "transcript_hash": "BASE64URL(SHA-256(transcript))"
  }
}
```

* `transcript_hash`: Responder computes the transcript hash and includes it for explicit confirmation. Initiator MUST verify equality before proceeding.

---

### decline-upgrade

Type: `https://didcomm.org/pq-bridge/1.0/decline-upgrade`

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/decline-upgrade",
  "id": "dec-g7h8i9",
  "thid": "pq-conn-abc",
  "from": "did:example:bob",
  "to": ["did:example:alice"],
  "body": {
    "reason": "no_supported_suite",
    "supported_suites": ["pq-suite-p1"],
    "supported_modes": ["pq-only"]
  }
}
```

* `reason`: One of `no_supported_suite`, `no_supported_mode`, `policy_rejected`, `rate_limited`, free text.

---

### kem-exchange

Type: `https://didcomm.org/pq-bridge/1.0/kem-exchange`

**From**: either peer

Carries the encapsulation key (initiator side) and/or the encapsulation ciphertext (responder side). For hybrid suites, carries both classical and PQ components.

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/kem-exchange",
  "id": "kex-j1k2l3",
  "thid": "pq-conn-abc",
  "from": "did:example:alice",
  "to": ["did:example:bob"],
  "body": {
    "suite": "pq-suite-h1",
    "generation": 0,
    "kid": "BASE64URL(SHA-256(public_key))",
    "public_key": "BASE64URL(ML-KEM-768 encapsulation key, 1184 bytes)",
    "classical_public_key": "BASE64URL(X25519 public key, 32 bytes)",
    "ciphertext": null,
    "classical_ciphertext": null,
    "signature": {
      "alg": "ML-DSA-65",
      "kid": "did:example:alice#pq-key-1",
      "value": "BASE64URL(3309 bytes)"
    },
    "transcript_hash": "BASE64URL(SHA-256(transcript))",
    "timestamp": "2026-04-21T10:00:00Z"
  }
}
```

* `public_key` / `classical_public_key`: Present when this peer is contributing a fresh public key (typically the initiator's first message and the responder's first message).
* `ciphertext` / `classical_ciphertext`: Present when this peer is encapsulating to the *peer's* public key (typically the responder echoing back, or any peer initiating rotation against an existing peer key).
* `signature`: Present iff the negotiated mode includes signing (`hybrid-sign` or `hybrid-full`). Signature covers `{ suite, generation, kid, public_key|ciphertext, classical_public_key|classical_ciphertext, transcript_hash, timestamp }` canonicalized.
* `kid`: MUST equal `BASE64URL(SHA-256(public_key))` when `public_key` is present, otherwise the kid of the peer key being encapsulated to.

The size validation rules are normative:

| Field | Required size when present |
|-------|----------------------------|
| `public_key` (ML-KEM-768) | 1184 bytes |
| `public_key` (ML-KEM-1024) | 1568 bytes |
| `ciphertext` (ML-KEM-768) | 1088 bytes |
| `ciphertext` (ML-KEM-1024) | 1568 bytes |
| `classical_public_key` | 32 bytes |
| `classical_ciphertext` | 32 bytes (X25519 public key acting as ciphertext) |

Mismatched byte lengths MUST be rejected with `pq.public_key_invalid_size` or `pq.ciphertext_invalid_size` before any decapsulation is attempted.

---

### kem-confirm

Type: `https://didcomm.org/pq-bridge/1.0/kem-confirm`

**From**: either peer

Confirms successful derivation of the shared secret with a HKDF-derived MAC.

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/kem-confirm",
  "id": "conf-m4n5o6",
  "thid": "pq-conn-abc",
  "from": "did:example:bob",
  "to": ["did:example:alice"],
  "body": {
    "generation": 0,
    "confirm_mac": "BASE64URL(HMAC-SHA-256(auth_key, 'confirm' || transcript_hash || generation))"
  }
}
```

A peer MUST verify `confirm_mac` before sending application data over the PQ envelope. Mismatch indicates a man-in-the-middle or transcript divergence; abort and emit `pq.kem_confirm_failed`.

---

### rotate-key

Type: `https://didcomm.org/pq-bridge/1.0/rotate-key`

**From**: either peer

Triggers re-keying. The triggering peer commits to issuing a fresh `kem-exchange` for `generation + 1` and accepts decapsulation against the old generation for `rotation_overlap_seconds`.

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/rotate-key",
  "id": "rot-p7q8r9",
  "thid": "pq-conn-abc",
  "from": "did:example:alice",
  "to": ["did:example:bob"],
  "body": {
    "current_generation": 0,
    "new_generation": 1,
    "reason": "ttl_expiry",
    "overlap_seconds": 300
  }
}
```

* `reason`: `ttl_expiry`, `message_count_threshold`, `compromise_suspected`, `policy`, free text.
* After sending `rotate-key`, the peer MUST send `kem-exchange` with the new generation. Both peers run the full kex+confirm again.

---

### pq-envelope

Type: `https://didcomm.org/pq-bridge/1.0/pq-envelope`

**From**: either peer

Wraps an inner DIDComm message (or arbitrary attachment) in a PQ-protected envelope. The inner message is encrypted with the AEAD using a key derived from the session.

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/pq-envelope",
  "id": "env-s1t2u3",
  "thid": "pq-conn-abc",
  "from": "did:example:alice",
  "to": ["did:example:bob"],
  "body": {
    "suite": "pq-suite-h1",
    "generation": 0,
    "mode": "hybrid-full",
    "kid": "BASE64URL(...)",
    "aad": "BASE64URL(canonical(inner_type || inner_thid))",
    "nonce": "BASE64URL(12 bytes)",
    "ciphertext": "BASE64URL(AES-256-GCM(kek, nonce, plaintext, aad))",
    "signature": {
      "alg": "ML-DSA-65",
      "kid": "did:example:alice#pq-key-1",
      "value": "BASE64URL(3309 bytes)"
    }
  }
}
```

* `aad`: Additional authenticated data binding the envelope to the inner message's type and thread ID.
* `signature`: Present when mode is `hybrid-sign` or `hybrid-full`. Covers `{ suite, generation, mode, kid, aad, nonce, ciphertext }`.
* `ciphertext`: AEAD-protected serialized inner DIDComm message (JWM bytes or canonical JSON of the body). Recipient decrypts, then dispatches the inner message to its normal handler.

A common attachment-level use case is wrapping a per-recipient file decryption key in a compact form (e.g., a `WrappedFileKey`-style structure containing `kem`, `ct`, `kid`, `algorithm`). Such structures fit naturally as the inner ciphertext of a `pq-envelope` and SHOULD reuse the same field names where possible to ease cross-protocol composition.

---

### pq-signature

Type: `https://didcomm.org/pq-bridge/1.0/pq-signature`

**From**: either peer

Carries an ML-DSA signature over an arbitrary referenced object. Used when signing without encryption (e.g., signed acknowledgments, audit attestations) or when a peer wants a separate PQ signature alongside an existing classical-signed message.

```json
{
  "type": "https://didcomm.org/pq-bridge/1.0/pq-signature",
  "id": "sig-v4w5x6",
  "thid": "pq-conn-abc",
  "from": "did:example:alice",
  "to": ["did:example:bob"],
  "body": {
    "covers": {
      "type": "message-id",
      "value": "msg-abc123"
    },
    "digest": "sha256-BASE64URL(...)",
    "alg": "ML-DSA-65",
    "kid": "did:example:alice#pq-key-1",
    "signature": "BASE64URL(3309 bytes)"
  }
}
```

* `covers.type`: `message-id`, `digest-only`, `attachment-id`, `external-uri`.
* `digest`: Required canonical digest of the covered object. The verifier hashes the referenced object and compares before verifying the signature.


---

### problem-report

Type: `https://didcomm.org/pq-bridge/1.0/problem-report`

Standard DIDComm problem-report format. Codes defined below in **Error Codes**.

---

## Flows

### Flow 1: Hybrid Upgrade After DIDComm Connection

```
Alice                                         Bob
  |                                             |
  | [DIDComm connection: completed]             |
  |                                             |
  |-- Discover Features (advertise pq-bridge) ->|
  |<-- Discover Features (advertise pq-bridge) -|
  |                                             |
  |-- propose-upgrade ------------------------->|
  |   (suites: [h1,p2,p1], modes: [full,enc])   |
  |                                             |
  |<-- accept-upgrade --------------------------|
  |   (suite: h1, mode: hybrid-full)            |
  |                                             |
  |-- kem-exchange (alice's pubkeys) ---------->|
  |                                             |
  |<-- kem-exchange (bob's ct's, signed) -------|
  |                                             |
  |-- kem-confirm ----------------------------->|
  |<-- kem-confirm ----------------------------|
  |                                             |
  |   [KEM_BOUND - session keys derived]        |
  |                                             |
  |-- pq-envelope { inner: any DIDComm msg } -->|
  |<-- pq-envelope { inner: any DIDComm msg } --|
```

### Flow 2: Key Rotation (TTL Driven)

```
Alice                               Bob
  | [KEM_BOUND, gen=0]                |
  |                                   |
  | [TTL reached: 30 days]            |
  |                                   |
  |-- rotate-key (gen 0->1) -------->|
  |<-- ack/inline ----------------- -|
  |                                   |
  |-- kem-exchange (gen=1, new pks) ->|
  |<-- kem-exchange (gen=1, new ct) --|
  |                                   |
  |-- kem-confirm (gen=1) --------- ->|
  |<-- kem-confirm (gen=1) -----------|
  |                                   |
  | [Both gens valid for 300s overlap]|
  | [Then gen=0 keys destroyed]       |
```

### Flow 3: Concurrent Initiation Resolution

```
Alice (lower DID)                Bob (higher DID)
  |                                 |
  |-- propose-upgrade ------------->|
  |<-- propose-upgrade -------------|   [crossed in flight]
  |                                 |
  |  [Tie-break: alice DID < bob DID]
  |  [Alice's proposal wins]        |
  |                                 |
  |  [Bob discards own proposal,    |
  |   processes alice's]            |
  |<-- accept-upgrade --------------|
  |                                 |
  |   [Continue normally]           |
```

### Flow 4: PQ-Wrapped Vault Reference

```
Alice                                Bob
  | [pq-bridge: KEM_BOUND, h1/full]   |
  |                                   |
  |-- pq-envelope ------------------->|
  |   inner: vaults/1.0/grant-access  |
  |   { vault_id, doc_id, ZCAP }      |
  |                                   |
  | [Bob decrypts pq-envelope -> classical authcrypt was already verified]
  | [Bob receives the vault grant message; can resolve $ref via vaults protocol]
```

### Flow 5: Coexistence With Non-Standard PQ Predecessors

If a peer has previously deployed a non-standard PQ key exchange (e.g., a body-typed `kem-key-exchange` over BasicMessage) and does not yet advertise `pq-bridge/1.0` in Discover Features:

```
Alice (pq-bridge)             Bob (legacy PQ impl)
  |                               |
  |-- Discover Features --------->|
  |<-- Discover Features (no pq-bridge) -|
  |                               |
  |  [Fallback: Alice may speak the legacy
  |   wire format if she still supports it]
  |                               |
  |  [Bob processes via legacy handler]
```

A legacy `kem-key-exchange` body matches the cryptographic profile of `pq-suite-p1`/`pq-only` mode. Implementations supporting both MUST disambiguate by checking Discover Features and SHOULD log a deprecation warning when the legacy fallback is used.

---

## Composition with Other Protocols

### DIDComm v2 (Authcrypt)

* PQ-Bridge runs **inside** DIDComm authcrypt. All PQ-Bridge messages travel as authcrypted DIDComm messages.
* `hybrid-encrypt` mode wraps the inner message body once with PQ AEAD; the outer authcrypt envelope is unchanged.
* If DIDComm core later adopts ML-KEM in JWE, this protocol can be deprecated since both layers would be PQ.

### Vaults 1.0

* `$ref` pointers MAY be carried inside `pq-envelope` for high-sensitivity vault grants.
* Vault `grant-access` capabilities can be co-signed with `pq-signature` for non-repudiation against PQ adversaries.
* The `kek_ref` in vault descriptors MAY point to a PQ-wrapped key (a compact `{ kem, ct, kid, algorithm }` structure delivered as `pq-envelope` ciphertext).

### Swarm 1.0

* Swarm pledger DIDs SHOULD advertise `pq-bridge` support so shard transfers can use `pq-envelope`.
* Long-TTL pledges (cold archive tier) SHOULD use hybrid suites: harvest-now-decrypt-later is the dominant threat for long-lived storage.
* Swarm `retrieve-request` ZCAP invocations MAY be co-signed with `pq-signature`.

### Issue Credential 3.0

* Credentials MAY be issued inside `pq-envelope` for PQ-protected delivery.
* Issuers with `hybrid-sign` mode SHOULD attach `pq-signature` over the credential body for PQ non-repudiation.
* Holder backup to Swarm SHOULD use `hybrid-encrypt` for credential ciphertext.

### Rooms 1.0 (MLS Group Messaging)

* MLS already has draft PQ ciphersuites (`MLS_256_DHKEMP384_AES256GCM_SHA384_P384` plus PQ variants). PQ-Bridge handles **only** the pairwise DIDComm signaling channel into/out of MLS — KeyPackage exchange, admin authz, etc.
* MLS group keying does NOT depend on PQ-Bridge; the two are complementary.

### Signing 1.0

* `pq-signature` complements Signing 1.0 — Signing 1.0 messages MAY include `pq_artifacts` carrying ML-DSA signatures alongside classical ones.
* Signing 1.0 authorization tickets MAY ride inside `pq-envelope` when the underlying secret being delivered (e.g., HPKE-sealed credential) is high-value.

### Payments 1.0

* Payment receipts and mandate offers MAY be PQ-signed via `pq-signature` for audit-grade non-repudiation.
* Payment session establishment MAY upgrade to `hybrid-full` mode before exchanging mandate details.

### Coordinate Mediation 3.0

* Mediators SHOULD advertise `pq-bridge` support if they want to handle PQ-protected forward messages.
* Mediation grant messages MAY be carried inside `pq-envelope`.

### Mesh 1.0

* `pq-envelope` adds 1088 bytes of ML-KEM ciphertext + 32 bytes nonce + AEAD tag — non-trivial for LoRa frame budget.
* For mesh deployments, prefer to run PQ-Bridge once per session and use the derived AEAD key for many subsequent compact messages without re-running KEM.

---

## Security Considerations

1. **Hybrid by default**: Pure PQ (`pq-only`) loses the well-studied classical security guarantee. Implementations SHOULD default to `hybrid-encrypt` or stronger and SHOULD warn when peers select `pq-only`.

2. **Transcript binding**: The transcript hash MUST be computed over canonical JSON of the proposed suites/modes. Without binding, a downgrade attack could substitute weaker suites after the fact.

3. **Replay protection**: The combination of `nonce`, `transcript_hash`, and `kid` MUST be unique. Implementations MUST persist a per-connection seen-set and reject duplicates within `nonce_window_seconds`.

4. **Key rotation**: After `rotation_overlap_seconds`, old generation keys MUST be securely erased (zeroize on drop). Long-lived old keys defeat forward secrecy.

5. **Generation monotonicity**: `generation` MUST be strictly increasing per connection. Decapsulation requests for a generation lower than `current_generation - 1` MUST be rejected.

6. **kid binding**: `kid` MUST equal `BASE64URL(SHA-256(public_key))`. A peer that sends a `kid` not matching the public key it advertises is Byzantine; abort the session.

7. **Signature scope**: `pq-signature` MUST cover a digest computed over the canonical form of the referenced object. Non-canonical signing allows substitution attacks.

8. **Confirm-MAC**: The `kem-confirm` MAC catches transcript divergence early (e.g., a MITM that reordered suite preferences). MUST be verified before any application data flows.

9. **No PQ-only when peer is offline**: If a recovery flow requires later decryption by a separate device, the PQ secret key MUST be made available there. Use Vaults 1.0 + Swarm 1.0 to back up PQ secret keys with appropriate access controls.

10. **Algorithm agility**: Implementations MUST be prepared to add new suites without code changes (e.g., via a suite registry table). When a new suite is added, both peers MUST advertise it in Discover Features before negotiation.

11. **HKDF context strings are normative**: Implementations MUST use `didcomm.org/pq-bridge/1.0/{purpose}` as the HKDF info string. Implementations migrating from a non-standard predecessor info string MUST support both derivations during the transition window and prefer the normative one.

12. **Side-channel defenses**: ML-KEM and ML-DSA implementations SHOULD use constant-time operations. Production deployments SHOULD use audited, hardened implementations (e.g., `pqcrypto`, `liboqs`, `mlkem-native`).

13. **Quantum threat model**: This protocol assumes a future quantum adversary recording today's traffic. It does NOT assume the adversary has present-day quantum decryption capability; classical authcrypt remains the primary defense for present-day attacks.

---

## Privacy Considerations

1. **Suite advertisement leaks capability**: Discover Features disclosure reveals which PQ suites a peer supports. This is acceptable — PQ capability is not sensitive — but be aware that it fingerprints the implementation.

2. **Pairwise DIDs**: Use pairwise DIDs per peer to prevent cross-connection PQ-key correlation.

3. **PQ key reuse**: PQ keypairs SHOULD be per-connection. Reusing the same PQ secret key across connections enables correlation by adversaries who control multiple peers.

4. **Rotation timing**: Predictable rotation cadence reveals usage patterns. Implementations SHOULD jitter `rotation_overlap_seconds` and prefer message-count or volume-based triggers over wall-clock TTL alone.

---

## Validation Rules (Normative)

1. `kid` MUST equal `BASE64URL(SHA-256(public_key))`. Mismatch -> reject with `pq.kid_mismatch`.

2. PQ `public_key` and `ciphertext` byte lengths MUST match the suite's algorithm sizes (see Suite Registry table).

3. `propose-upgrade.suites` MUST be non-empty.

4. `accept-upgrade.selected_suite` MUST be one of the proposed suites.

5. `accept-upgrade.selected_mode` MUST be one of the proposed modes.

6. `accept-upgrade.transcript_hash` MUST equal the locally computed transcript hash. Mismatch -> abort with `pq.transcript_mismatch`.

7. `kem-exchange.timestamp` MUST be within ±300 seconds of receiver's clock.

8. `kem-confirm.confirm_mac` MUST verify against the locally derived `auth_key`.

9. `pq-envelope.aad` MUST bind the inner message's type and `thid`.

10. `generation` MUST be strictly monotonic per `(connection_id, peer_did)` pair.

11. `nonce` MUST be 32 bytes of fresh randomness.

12. `signature` (when present) MUST verify against a key in the signer's DID document with appropriate `verificationMethod` type.

---

## Error Codes (Problem Reports)

All errors use type `https://didcomm.org/pq-bridge/1.0/problem-report`.

| Code | Description |
|------|-------------|
| `pq.suite_unsupported` | Proposed suite is not supported by responder |
| `pq.mode_unsupported` | Proposed mode is not supported by responder |
| `pq.no_intersection` | No suite/mode intersection found |
| `pq.transcript_mismatch` | Computed transcript hash differs from received |
| `pq.kid_mismatch` | `kid` does not match `SHA-256(public_key)` |
| `pq.public_key_invalid_size` | Public key byte length does not match suite |
| `pq.ciphertext_invalid_size` | KEM ciphertext byte length does not match suite |
| `pq.signature_invalid` | ML-DSA signature verification failed |
| `pq.timestamp_window` | Message timestamp outside ±300s window |
| `pq.replay_detected` | Nonce or `kid` previously seen for this connection |
| `pq.generation_stale` | `kem-exchange` carries generation older than current - 1 |
| `pq.kem_confirm_failed` | `kem-confirm` MAC did not verify |
| `pq.rotation_in_progress` | Cannot start a new rotation while one is in progress |
| `pq.envelope_decrypt_failed` | AEAD decryption of `pq-envelope` failed |
| `pq.unknown_kid` | Referenced `kid` does not match any known peer key |
| `pq.policy_rejected` | Local policy declined the upgrade or rotation |

---

## Implementation Hints

### Hybrid Suite Decapsulation

```javascript
function decapsulateHybrid(suite, localKp, kemExchange, peerClassicalPk) {
  const ssPq = mlkem.decapsulate(localKp.pqSk, kemExchange.ciphertext);
  const ssClassical = x25519(localKp.classicalSk, peerClassicalPk);

  const sharedSecret = concat(ssClassical, ssPq);
  return sharedSecret;
}
```

### Transcript Hash Computation

```javascript
function computeTranscript({ initiatorDid, responderDid, connectionId,
                             proposedSuites, selectedSuite, selectedMode,
                             initiatorNonce, responderNonce }) {
  const canon = JSON.stringify({
    label: "didcomm.org/pq-bridge/1.0/transcript",
    initiator_did: initiatorDid,
    responder_did: responderDid,
    connection_id: connectionId,
    proposed_suites: proposedSuites.sort(),
    selected_suite: selectedSuite,
    selected_mode: selectedMode,
    initiator_nonce: initiatorNonce,
    responder_nonce: responderNonce
  });
  return sha256(canon);
}
```

### Key Schedule Derivation

```javascript
function deriveSessionKeys(sharedSecret, transcript, generation) {
  const sessionKey = hkdfExtract(transcript, sharedSecret);
  const kek = hkdfExpand(sessionKey,
    `didcomm.org/pq-bridge/1.0/kek/${generation}`, 32);
  const authKey = hkdfExpand(sessionKey,
    `didcomm.org/pq-bridge/1.0/auth/${generation}`, 32);
  return { kek, authKey };
}
```

### Confirm-MAC

```javascript
function computeConfirmMac(authKey, transcript, generation) {
  const input = concat(
    Buffer.from("confirm"),
    transcript,
    Buffer.from(String(generation))
  );
  return hmacSha256(authKey, input);
}
```

### pq-envelope Wrapping

```javascript
async function wrapEnvelope({ kek, authKey, mode, suite, generation, kid,
                              innerMessage, signingKey }) {
  const nonce = randomBytes(12);
  const aad = canonicalAad(innerMessage.type, innerMessage.thid);
  const plaintext = serialize(innerMessage);
  const ciphertext = aesGcm(kek, nonce, plaintext, aad);

  const env = { suite, generation, mode, kid, aad, nonce, ciphertext };

  if (mode === "hybrid-sign" || mode === "hybrid-full") {
    env.signature = await mldsaSign(signingKey, canonicalSignedFields(env));
  }
  return env;
}
```

### Concurrent Initiation Tie-Break

```javascript
function resolveConcurrentProposal(localProposal, peerProposal, localDid, peerDid) {
  if (localDid < peerDid) {
    // Local wins - peer should accept ours
    return { winner: "local", proposal: localProposal };
  }
  // Peer wins - we accept theirs
  return { winner: "peer", proposal: peerProposal };
}
```

---

## Recommended Rollout Phases

Implementations adopting this spec — including those that previously shipped a non-standard PQ key exchange — SHOULD follow this phased rollout to preserve interop while moving the ecosystem forward:

1. **Phase 1 (additive)**: Implement `propose-upgrade`/`accept-upgrade`/`kem-exchange`/`kem-confirm` with the normative type URIs. Advertise `pq-bridge/1.0` in Discover Features. If the implementation also supports a non-standard predecessor wire format, accept both during this phase.

2. **Phase 2 (default hybrid)**: Default to `hybrid-encrypt` mode with `pq-suite-h1`. Mark `pq-only` as discouraged in operator logs.

3. **Phase 3 (signatures live)**: Add `pq-signature` and signed `pq-envelope` modes. Begin attaching ML-DSA signatures alongside classical ones for high-value flows.

4. **Phase 4 (rotation live)**: Add `rotate-key` triggers (TTL, message count, manual). Begin actually rotating session keys.

5. **Phase 5 (legacy off)**: Once all interop partners advertise `pq-bridge/1.0`, refuse any non-standard predecessor wire format and require negotiation through this protocol.

---

## References

* [NIST FIPS 203 — Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM)](https://csrc.nist.gov/pubs/fips/203/final)
* [NIST FIPS 204 — Module-Lattice-Based Digital Signature Standard (ML-DSA)](https://csrc.nist.gov/pubs/fips/204/final)
* [DIDComm Messaging v2.0](https://identity.foundation/didcomm-messaging/spec/v2.0/)
* [Discover Features Protocol 2.0](https://didcomm.org/discover-features/2.0/)
* [Vaults 1.0 Protocol](https://didcomm.org/vaults/1.0/)
* [Swarm 1.0 Protocol](https://didcomm.org/swarm/1.0/)
* [Rooms 1.0 Protocol](https://didcomm.org/rooms/1.0/)
* [Signing 1.0 Protocol](https://didcomm.org/signing/1.0/)
* [HKDF (RFC 5869)](https://datatracker.ietf.org/doc/html/rfc5869)
* [X-Wing: Hybrid KEM (IETF draft)](https://datatracker.ietf.org/doc/draft-connolly-cfrg-xwing-kem/)
* [Hybrid PQC for TLS 1.3 (RFC 9620)](https://datatracker.ietf.org/doc/html/rfc9620)
* [MLS Protocol (RFC 9420)](https://datatracker.ietf.org/doc/rfc9420/) — for PQ ciphersuite alignment with Rooms 1.0
