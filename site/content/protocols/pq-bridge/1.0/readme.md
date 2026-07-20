---
title: PQ-Bridge
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/pq-bridge/1.0
status: Proposed
summary: A DIDComm v2 protocol that adds post-quantum and hybrid (classical + PQ) key exchange, encryption, and signing on top of the existing DIDComm handshake. Acts as a transitional layer until DIDComm core adopts NIST FIPS 203/204 in its JWE/JWS profiles. Every PQ session is bound to a fresh ephemeral DID generated per-session, so PQ key material is unlinkable across connections and rotation does not modify either peer's long-lived DID document. Supports ML-KEM-768/1024 encapsulation, ML-DSA-65/87 signatures, hybrid X25519+ML-KEM and Ed25519+ML-DSA modes, suite negotiation via Discover Features, key rotation, and replay-protected envelope wrapping for arbitrary message bodies and attachments.
tags: [post-quantum, pqc, ml-kem, ml-dsa, kyber, dilithium, hybrid, key-exchange, fips-203, fips-204, quantum-safe, harvest-now-decrypt-later, ephemeral-did, did-peer]
authors:
  - name: Vinay Singh
    email: vinay@verid.id
---

## Summary

PQ-Bridge 1.0 is a DIDComm v2 protocol that adds **post-quantum (PQ) key exchange, hybrid encryption, and PQ signatures** on top of the existing DIDComm handshake. The protocol is a **bridge**: a versioned wire format that delivers NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) protection for DIDComm traffic now, before the DIDComm core specification incorporates these primitives into its JWE and JWS profiles. The format is chosen so that retirement, once core support exists, requires no changes to higher-level callers.

The protocol runs **after** a DIDComm connection reaches its `completed` state. Each peer generates a **fresh ephemeral DID** (a self-certifying `did:peer:4` is RECOMMENDED) whose DID document embeds the session's ML-KEM key-agreement key and, when signing modes are negotiated, the ML-DSA assertion key. Peers negotiate a PQ suite via Discover Features 2.0, exchange their ephemeral DIDs in `propose-upgrade` / `accept-upgrade`, run KEM encapsulation against the ephemeral key-agreement keys, derive a session-bound shared secret, and optionally upgrade subsequent message bodies and attachments to **hybrid encryption** (classical + PQ) so that breaking the channel requires breaking *both* primitives.

The protocol covers eight specific areas: type URIs for every PQ message, suite negotiation, hybrid mode selection, replay protection across reconnections, key rotation with overlap windows, ML-DSA signatures carried in their own message type and an explicit signed-envelope mode, HKDF info-string and transcript binding, and ephemeral-DID isolation of all session crypto material from the peers' long-lived DIDs.

---

## Motivation

DIDComm v2 today uses **classical X25519/Ed25519** for authcrypt and signing. A sufficiently capable quantum adversary could break these primitives with Shor's algorithm, and the **harvest-now-decrypt-later** threat is already real: an attacker recording today's DIDComm traffic can decrypt it years later.

Three options exist:

1. Wait for DIDComm core to add PQ — slow standards process.
2. Roll PQ ad-hoc per implementation — fragments interop.
3. **Standardize a bridge protocol** that wraps existing PQ implementations behind a stable wire format.

This protocol is option 3. It does not modify DIDComm authcrypt or replace existing JOSE primitives; instead, it adds a **second cryptographic layer** sitting inside DIDComm message bodies. When DIDComm core adopts ML-KEM and ML-DSA in JWE/JWS, this protocol can be retired: its envelope structure (transcript-bound KEM output → HKDF → AEAD with associated data) is the same shape JOSE-side PQ adoption requires, so migration is a renaming and re-routing exercise rather than a re-design.

---

## Design Properties

The protocol is built around the following invariants:

| Property | How it's enforced |
|----------|-------------------|
| Every PQ message has a proper DIDComm type URI | All messages use `https://didcomm.org/pq-bridge/1.0/<name>` |
| Session crypto is unlinkable from long-lived identity | Each peer mints a fresh ephemeral DID (RECOMMENDED `did:peer:4`) per PQ session; long-lived DID only authenticates the outer authcrypt |
| Suite is explicitly negotiated, never assumed | `propose-upgrade`/`accept-upgrade` selects from a registered suite list |
| Hybrid vs pure-PQ is an explicit choice | `mode` field: `pq-only`, `hybrid-encrypt`, `hybrid-sign`, `hybrid-full` |
| Replay and downgrade attacks are blocked | Transcript hash + per-`propose-upgrade` 32-byte `nonce` + ephemeral DIDs mixed into HKDF |
| Keys rotate without dropping in-flight messages | `rotate-key` mints a new ephemeral DID with incremented `generation` and an overlap window |
| ML-DSA signatures have their own message type and an explicit signed-envelope mode | `pq-signature` message; `hybrid-sign` and `hybrid-full` modes attach an ML-DSA signature to `pq-envelope` |
| Anti-replay combines timestamp window + nonce + transcript | All three required, individually insufficient |
| Cross-implementation interop is achievable | Normative HKDF info string `didcomm.org/pq-bridge/1.0/{purpose}` |
| PQ key compromise cannot leak the long-lived DID | Ephemeral DID's secret key never exists outside the PQ session; long-lived DID never holds PQ secret keys |
| Failures are machine-readable | Standard problem-report codes (`pq.suite_unsupported`, `pq.kid_mismatch`, `pq.ephemeral_did_invalid`, etc.) |

---

## Goals / Non-Goals

**Goals**

* Add post-quantum key exchange and signing to any DIDComm v2 connection without modifying DIDComm core.
* Isolate all session-scoped PQ key material inside a fresh ephemeral DID so PQ keys are unlinkable across connections and rotate without touching long-lived DID documents.
* Negotiate suite, hybrid mode, and ephemeral DID method explicitly so a peer that cannot meet the requested posture aborts with a machine-readable problem-report code rather than silently downgrading.
* Bind the PQ shared secret to a transcript hash that includes both ephemeral DIDs so it cannot be replayed in a different session context.
* Support clean key rotation by minting a new ephemeral DID while in-flight messages under the old ephemeral DID still decrypt during the overlap window.
* Compose with Vaults 1.0, Swarm 1.0, Issue Credential 3.0, and Rooms 1.0 for end-to-end PQ-protected workflows.
* Allow implementations migrating from non-standard PQ key exchanges (e.g., a body-typed `kem-key-exchange` ridden over BasicMessage, or a flow that attached PQ keys directly to long-lived DID documents) to coexist during a transition window.

**Non-Goals**

* Not a replacement for DIDComm authcrypt — this protocol layers on top, and authcrypt continues to use the long-lived DID.
* Not a transport — relies on standard DIDComm v2 routing and transports.
* Not a PKI — long-lived DIDs and their DID documents remain the trust root; the ephemeral DID is scoped to one PQ session and is authenticated *through* the outer authcrypted envelope, not by an independent PKI step.
* Not a general-purpose PQ DID method — the ephemeral DID is intentionally scoped to one PQ session. Long-lived PQ DID methods are out of scope.
* Not a re-implementation of MLS — Rooms 1.0 handles group keying; this protocol covers pairwise sessions.

---

## Roles

* **initiator**: Sends the first `propose-upgrade` after the DIDComm connection reaches `completed`. Either peer MAY initiate; concurrent initiations are resolved by the tie-break rule below.
* **responder**: Receives `propose-upgrade` and replies with `accept-upgrade` or `decline-upgrade`.
* **rotator**: Either peer can act as a rotator at any time after `KEM_BOUND` by sending `rotate-key`.

### Role Requirements

**initiator** implementations MUST:

* Mint a fresh ephemeral DID (RECOMMENDED `did:peer:4` long form) before sending `propose-upgrade`, embedding only the verification methods required by the chosen suite + mode.
* Send `propose-upgrade` with at least one supported suite, one supported mode, and the ephemeral DID + DID document.
* Generate a fresh 32-byte `nonce` for each `propose-upgrade`.
* Maintain a per-connection state machine including the negotiated suite, mode, current key generation, current ephemeral DID, previous ephemeral DID (during overlap), and last-seen peer ephemeral DID.

**responder** implementations MUST:

* Validate the peer's `ephemeral_did` is self-certifying, uses an advertised method, and contains only the expected verification-method shapes.
* Mint their own fresh ephemeral DID before sending `accept-upgrade`.
* Reply with `accept-upgrade` (carrying their ephemeral DID) selecting one suite + one mode from the proposal, OR `decline-upgrade` with a reason.
* Verify the `propose-upgrade.nonce` is fresh (not seen for this connection in the last `nonce_window`).
* Bind the negotiated `nonce` AND both ephemeral DIDs into the transcript hash.

**rotator** implementations MUST:

* Mint a NEW ephemeral DID for the rotated generation — never reuse the existing ephemeral DID.
* Maintain at least one prior ephemeral DID and its secret keys for the configured `rotation_overlap_seconds` after rotation, then zeroize.
* Refuse decapsulation requests using a generation older than the overlap window.

### Tie-Break Rule for Concurrent Initiation

If both peers send `propose-upgrade` simultaneously, the peer with the **lexicographically lower long-lived DID** (the DID on the outer authcrypt envelope, NOT the ephemeral DID) is the initiator; the other peer treats its own `propose-upgrade` as superseded and processes the peer's instead. The ephemeral DID is excluded from tie-break because it is freshly random — using it would let either peer grind their ephemeral DID to win. Without this rule, dual-init races leave the connection in an ambiguous state where each side has a different idea of which keypair won.

---

## Ephemeral DIDs (Normative)

Every PQ session binds its key material to a **fresh ephemeral DID** generated at session start, not to either peer's long-lived DID. The ephemeral DID is self-certifying — the DID is derived from the document, so the document needs no external resolution — and its DID document holds exactly the session's ML-KEM key-agreement method and, when signing modes are negotiated, the ML-DSA assertion method. The long-lived DID remains the trust root and the address used for routing; the ephemeral DID is the identifier under which the session's keys are resolved.

### Rationale

Attaching PQ keys directly to the long-lived DID document has three problems that the ephemeral-DID model eliminates:

1. **Cross-connection correlation.** The same PQ verification key appearing in two DID documents links those connections forever, even when the underlying DIDs are pairwise.
2. **Slow, externally visible rotation.** Rotating a key inside a long-lived DID document requires publishing a DID update — heavy and, depending on the DID method, observable on a public network.
3. **No forward secrecy against DID compromise.** Compromising the long-lived DID's signing key would let an adversary impersonate any PQ session that ever rode it.

Binding PQ material to an ephemeral DID gives session-scoped keys an addressable identifier (`<ephemeral-did>#<key-fragment>`) that any DIDComm component capable of DID resolution can dereference, with no parallel key-management code path required.

### Ephemeral DID Method Requirements

The ephemeral DID method MUST be:

* **Self-certifying** — the DID can be verified from the DID itself without an external resolution call. `did:peer:4` (long form), `did:key`, and `did:jwk` qualify; `did:web`, `did:ion`, etc. do NOT.
* **Multi-key capable** — the DID document MUST be able to embed both `keyAgreement` (ML-KEM, optionally X25519) and, when signing modes are negotiated, `assertionMethod` (ML-DSA, optionally Ed25519) verification methods.
* **Inline-resolvable** — the receiver MUST be able to resolve the DID from the message contents alone, with no network call.

`did:peer:4` (long form) is RECOMMENDED. Implementations MAY use `did:key` for `pq-only` or `hybrid-encrypt` sessions that need only a key-agreement key, but MUST use a multi-key method (typically `did:peer:4`) when the negotiated mode is `hybrid-sign` or `hybrid-full`.

### Ephemeral DID Lifecycle

| Event | Effect on ephemeral DID |
|-------|-------------------------|
| Local PQ state enters `READY` | Peer generates fresh PQ keypairs and constructs an ephemeral DID document embedding them |
| `propose-upgrade` sent / received | Each peer advertises its ephemeral DID and (for `did:peer:4` long form) the embedded document |
| `kem-exchange` | All `kid` values resolve under the sender's ephemeral DID; `signature.kid` references an `assertionMethod` of the sender's ephemeral DID |
| `rotate-key` | A **new** ephemeral DID is generated for the next `generation`; the previous ephemeral DID and its secret keys are retained only until `rotation_overlap_seconds` expires, then zeroized |
| DIDComm connection closes, PQ state returns to `IDLE`, or `decline-upgrade` is sent | The ephemeral DID document and all secret keys are zeroized immediately |

### Binding the Ephemeral DID to the Long-Lived Identity

Authentication of the ephemeral DID flows through the **outer DIDComm authcrypt envelope**, which is encrypted/signed using the long-lived DID's key-agreement and signing keys. A receiver authenticates `propose-upgrade` (and the ephemeral DID it carries) by virtue of decrypting and verifying that authcrypted envelope. No second binding signature is required for the default flow — the same mechanism that authenticates every other DIDComm message authenticates the ephemeral DID announcement.

For high-assurance flows (e.g., a recovery or delegation context where the recipient cannot trust the authcrypt envelope alone), `propose-upgrade.binding` MAY carry an explicit detached signature, made with the sender's long-lived `assertionMethod` key, over the canonical form of the ephemeral DID document. Receivers MUST verify this binding when present and SHOULD require it for any flow that touches Vaults custodial keys, Swarm pledger admission, or Payments mandate establishment.

### What the Ephemeral DID Does NOT Replace

* It does **not** replace the long-lived DID in the DIDComm `from` / `to` headers. Those fields continue to carry the long-lived DIDs so existing routing, mediation, and policy continue to work.
* It does **not** become a portable identity. The ephemeral DID exists only for the duration of one PQ session and SHOULD NOT be persisted, exported, or referenced from credentials or other long-lived artifacts.
* It does **not** carry any non-PQ verification methods. Classical key-agreement (X25519) and signing (Ed25519) material for hybrid suites is embedded **in the same ephemeral DID document** so that both halves of a hybrid suite share the same lifecycle.

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
        "ephemeral_did_methods": [
          "did:peer:4",
          "did:key"
        ],
        "binding_signature_supported": true,
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

### EphemeralDIDState (local persistence)

The ephemeral DID is the root container for all PQ key material in a session. It is created when the peer enters `READY` and destroyed when the session ends.

```json
{
  "ephemeral_did": "did:peer:4zQm...",
  "ephemeral_did_document": { /* embedded DID document */ },
  "connection_id": "conn-abc",
  "long_lived_did": "did:example:alice",
  "generation": 0,
  "created_at": "2026-04-21T10:00:00Z",
  "expires_at": "2026-05-21T10:00:00Z",
  "rotated_from": null,
  "keys": {
    "ml-kem-768": { "kid": "...", "public_key": "...", "secret_key": "..." },
    "x25519":     { "kid": "...", "public_key": "...", "secret_key": "..." },
    "ml-dsa-65":  { "kid": "...", "public_key": "...", "secret_key": "..." },
    "ed25519":    { "kid": "...", "public_key": "...", "secret_key": "..." }
  }
}
```

* `ephemeral_did`: A self-certifying DID (RECOMMENDED `did:peer:4` long form). The DID document embeds every key in `keys`.
* `long_lived_did`: The persistent DID used on the outer DIDComm authcrypt envelope. Stored locally only — NEVER transmitted inside PQ-Bridge message bodies (it already appears in the envelope `from` header).
* `rotated_from`: The previous ephemeral DID this one replaced, if any. Used to enforce the overlap window during rotation.
* `keys`: Only the entries the negotiated suite + mode require are populated; the rest are absent.

### KemKeypair (per-key view, derived from EphemeralDIDState)

```json
{
  "kid": "<ephemeral_did>#<key-fragment>",
  "suite": "pq-suite-h1",
  "generation": 0,
  "public_key": "BASE64URL(...1184 bytes...)",
  "secret_key": "BASE64URL(...2400 bytes...)",
  "ephemeral_did": "did:peer:4zQm...",
  "connection_id": "conn-abc",
  "created_at": "2026-04-21T10:00:00Z",
  "rotated_from": null
}
```

`generation` increments on each rotation. The DID-relative `kid` (e.g., `did:peer:4zQm...#key-1`) is the canonical reference; for low-level wire integrity checks the byte-level `kid_thumbprint = BASE64URL(SHA-256(public_key))` MUST also match. A rotation produces a new ephemeral DID and therefore a new `kid` automatically.

### PeerKemKey

```json
{
  "kid": "<peer_ephemeral_did>#<key-fragment>",
  "kid_thumbprint": "BASE64URL(SHA-256(peer_public_key))",
  "suite": "pq-suite-h1",
  "generation": 0,
  "public_key": "BASE64URL(...)",
  "peer_long_lived_did": "did:example:bob",
  "peer_ephemeral_did": "did:peer:4zQm...",
  "connection_id": "conn-abc",
  "received_at": "2026-04-21T10:00:01Z"
}
```

### Transcript Hash

The transcript hash binds the shared secret to the negotiation context, including the ephemeral DIDs each peer announced. After both sides have exchanged `propose-upgrade` and `accept-upgrade`:

```
transcript = SHA-256(
  "didcomm.org/pq-bridge/1.0/transcript" ||
  initiator_long_lived_did ||
  responder_long_lived_did ||
  initiator_ephemeral_did ||
  responder_ephemeral_did ||
  connection_id ||
  proposed_suites_canonical_json ||
  selected_suite ||
  selected_mode ||
  initiator_nonce ||
  responder_nonce
)
```

`transcript` is then mixed into HKDF when deriving session keys (see "Key Schedule" below). Both DID classes appear in the transcript by design: the long-lived DID identifies the counterparty, the ephemeral DID identifies which generation of session keys this transcript belongs to. Omitting the ephemeral DID would let a passive recorder who later compromises one peer's ephemeral key splice a captured `kem-exchange` into a different session and obtain a colliding transcript.

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
| `READY` | Local intent to upgrade | `MINTING_EPHEMERAL` | Generate fresh ephemeral DID + PQ keypair(s) |
| `MINTING_EPHEMERAL` | Ephemeral DID document constructed and validated | `PROPOSING` | Send `propose-upgrade` carrying the ephemeral DID |
| `READY` | `propose-upgrade` received | `EVALUATING` | Validate peer's ephemeral DID, decide accept/decline |
| `EVALUATING` | Peer's ephemeral DID validated, suite/mode acceptable | `MINTING_EPHEMERAL` | Generate own ephemeral DID before responding |
| `MINTING_EPHEMERAL` (responder path) | Ephemeral DID built | `KEX_PENDING` | Send `accept-upgrade` carrying responder's ephemeral DID |
| `PROPOSING` | `accept-upgrade` received | `KEX_PENDING` | Validate peer's ephemeral DID + transcript hash, await `kem-exchange` |
| `PROPOSING` | `decline-upgrade` received | `READY` | Zeroize the unused ephemeral DID; optionally retry with different suites |
| `EVALUATING` | `decline-upgrade` sent | `READY` | Suite/mode/ephemeral-DID-method mismatch |
| `KEX_PENDING` | `kem-exchange` sent (initiator side) | `KEX_AWAIT_CONFIRM` | Ephemeral keypair already exists; KEM encapsulation/decapsulation runs against it |
| `KEX_PENDING` | `kem-exchange` received (responder side) | `KEX_AWAIT_CONFIRM` | Decapsulate using ephemeral DID's secret key, derive shared secret |
| `KEX_AWAIT_CONFIRM` | `kem-confirm` received | `KEM_BOUND` | Shared secret active, keyed to (long-lived DID, ephemeral DID, generation) tuple |
| `KEM_BOUND` | `rotate-key` initiated | `ROTATING` | Mint NEW ephemeral DID for `generation+1`; old ephemeral DID's secret keys retained until overlap expires |
| `ROTATING` | `kem-exchange` for new generation done, `kem-confirm` exchanged | `KEM_BOUND` | New ephemeral DID active; schedule zeroization of previous ephemeral DID at `now + overlap_seconds` |
| `KEM_BOUND` | Rotation overlap timer expires | `KEM_BOUND` | Previous ephemeral DID document + keys zeroized; only current generation valid |
| `KEM_BOUND` | DIDComm connection closed | `IDLE` | Zeroize ephemeral DID document and all PQ secret keys immediately |

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
    "ephemeral_did": "did:peer:4zQm...",
    "ephemeral_did_document": { /* inline DID document (REQUIRED for did:peer:4 long form) */ },
    "binding": {
      "alg": "Ed25519",
      "kid": "did:example:alice#key-1",
      "value": "BASE64URL(detached signature over canonical ephemeral_did_document)"
    },
    "rotation_overlap_seconds": 300,
    "max_envelope_bytes": 16777216
  }
}
```

* `suites`: Ordered by initiator preference (most preferred first).
* `modes`: Ordered by initiator preference.
* `nonce`: 32 fresh random bytes; mixed into transcript hash.
* `thid`: A UUID identifying the PQ session for this connection. Used as the `thid` for all subsequent PQ-Bridge messages on this connection.
* `ephemeral_did`: The fresh ephemeral DID this peer will use for this PQ session. The DID method MUST be one of the methods the peer advertised in Discover Features and MUST satisfy the self-certifying, multi-key, inline-resolvable requirements.
* `ephemeral_did_document`: REQUIRED when the chosen method does not encode the full document in the DID itself (i.e., for `did:peer:4` long form, the document is encoded in the DID but SHOULD also be included here for ease of validation). MAY be omitted for `did:key`. When present, MUST canonicalize to a structure containing only `keyAgreement` (ML-KEM, optionally X25519) and, for signing modes, `assertionMethod` (ML-DSA, optionally Ed25519) entries.
* `binding`: OPTIONAL detached signature over the canonical `ephemeral_did_document` by the sender's long-lived `assertionMethod` key. The outer authcrypt envelope already authenticates the message, so `binding` is REQUIRED only when the receiver has advertised `binding_signature_supported: true` AND policy demands explicit long-lived-key endorsement of the ephemeral DID (e.g., Vaults custodial, Swarm pledger admission, Payments mandate flows). Receivers MUST verify it when present.

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
    "ephemeral_did": "did:peer:4zQn...",
    "ephemeral_did_document": { /* inline DID document */ },
    "binding": {
      "alg": "Ed25519",
      "kid": "did:example:bob#key-1",
      "value": "BASE64URL(detached signature)"
    },
    "rotation_overlap_seconds": 300,
    "transcript_hash": "BASE64URL(SHA-256(transcript))"
  }
}
```

* `ephemeral_did`, `ephemeral_did_document`, `binding`: Same semantics as in `propose-upgrade`. The responder's ephemeral DID MUST be a freshly generated, independent DID — NEVER reuse the initiator's, and NEVER reuse one from a prior session.
* `transcript_hash`: Responder computes the transcript hash (which now includes both ephemeral DIDs) and includes it for explicit confirmation. Initiator MUST verify equality before proceeding.

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
    "ephemeral_did": "did:peer:4zQm...",
    "kid": "did:peer:4zQm...#kem-1",
    "kid_thumbprint": "BASE64URL(SHA-256(public_key))",
    "public_key": "BASE64URL(ML-KEM-768 encapsulation key, 1184 bytes)",
    "classical_public_key": "BASE64URL(X25519 public key, 32 bytes)",
    "ciphertext": null,
    "classical_ciphertext": null,
    "peer_kid": null,
    "signature": {
      "alg": "ML-DSA-65",
      "kid": "did:peer:4zQm...#dsa-1",
      "value": "BASE64URL(3309 bytes)"
    },
    "transcript_hash": "BASE64URL(SHA-256(transcript))",
    "timestamp": "2026-04-21T10:00:00Z"
  }
}
```

* `ephemeral_did`: The sender's ephemeral DID for this session. MUST match the DID the sender announced in `propose-upgrade` or `accept-upgrade` for `generation = 0`, OR the new ephemeral DID announced via `rotate-key` for subsequent generations.
* `public_key` / `classical_public_key`: Present when this peer is contributing a fresh public key (typically the initiator's first message and the responder's first message). The public key MUST already appear inside `ephemeral_did_document` as a `keyAgreement` entry; this field is the binary form for direct use and length validation.
* `ciphertext` / `classical_ciphertext`: Present when this peer is encapsulating to the *peer's* public key (typically the responder echoing back, or any peer initiating rotation against an existing peer key).
* `peer_kid`: Present when `ciphertext` is present. MUST be the DID-relative `kid` (under the peer's ephemeral DID) of the key the sender encapsulated against. The receiver uses this to select the correct secret key when multiple generations are in the overlap window.
* `signature`: Present iff the negotiated mode includes signing (`hybrid-sign` or `hybrid-full`). The signing `kid` MUST resolve to an `assertionMethod` entry in the sender's ephemeral DID document (NOT the long-lived DID). Signature covers `{ suite, generation, ephemeral_did, kid, public_key|ciphertext, classical_public_key|classical_ciphertext, peer_kid, transcript_hash, timestamp }` canonicalized.
* `kid`: A DID-relative reference (e.g., `did:peer:4zQm...#kem-1`) into the sender's ephemeral DID document. MUST resolve to a `keyAgreement` entry whose public key matches `public_key`.
* `kid_thumbprint`: The byte-level digest `BASE64URL(SHA-256(public_key))`, retained alongside `kid` so byte-integrity checks remain trivial and so peers that cannot fully resolve the DID document (legacy implementations during transition) still have a stable identifier. MUST match the digest of `public_key` when `public_key` is present.

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
    "ephemeral_did": "did:peer:4zQn...",
    "confirm_mac": "BASE64URL(HMAC-SHA-256(auth_key, 'confirm' || transcript_hash || generation || ephemeral_did_sender || ephemeral_did_peer))"
  }
}
```

A peer MUST verify `confirm_mac` before sending application data over the PQ envelope. The MAC input now binds both ephemeral DIDs so an attacker cannot replay a `kem-confirm` from a different session even if it had access to the same transcript bytes. Mismatch indicates a man-in-the-middle, transcript divergence, or ephemeral-DID substitution; abort and emit `pq.kem_confirm_failed`.

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
    "current_ephemeral_did": "did:peer:4zQm...",
    "new_generation": 1,
    "new_ephemeral_did": "did:peer:4zQr...",
    "new_ephemeral_did_document": { /* inline DID document */ },
    "reason": "ttl_expiry",
    "overlap_seconds": 300
  }
}
```

* `reason`: `ttl_expiry`, `message_count_threshold`, `compromise_suspected`, `policy`, free text.
* `new_ephemeral_did`: A freshly generated ephemeral DID for `new_generation`. MUST be a different DID from `current_ephemeral_did` (rotation that reused the same ephemeral DID would defeat the unlinkability and forward-secrecy goals).
* `new_ephemeral_did_document`: Same semantics as in `propose-upgrade`. The rotating peer MAY include a `binding` field signed by their long-lived DID if local policy or the original `binding_signature_supported` advertisement requires it.
* After sending `rotate-key`, the peer MUST send `kem-exchange` referencing `new_ephemeral_did` and `new_generation`. Both peers run the full kex+confirm again. The old ephemeral DID's secret keys MUST be retained for exactly `overlap_seconds` then zeroized.

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
    "ephemeral_did": "did:peer:4zQm...",
    "kid": "did:peer:4zQm...#kem-1",
    "aad": "BASE64URL(canonical(inner_type || inner_thid || ephemeral_did))",
    "nonce": "BASE64URL(12 bytes)",
    "ciphertext": "BASE64URL(AES-256-GCM(kek, nonce, plaintext, aad))",
    "signature": {
      "alg": "ML-DSA-65",
      "kid": "did:peer:4zQm...#dsa-1",
      "value": "BASE64URL(3309 bytes)"
    }
  }
}
```

* `ephemeral_did`: The sender's ephemeral DID for the current generation. Receivers MUST reject envelopes whose `ephemeral_did` does not match a known peer ephemeral DID for the connection (within the rotation overlap window).
* `kid`: DID-relative reference into the sender's ephemeral DID document; identifies which `keyAgreement` key derived the AEAD key.
* `aad`: Additional authenticated data binding the envelope to the inner message's type, thread ID, **and the sender's ephemeral DID**. Including the ephemeral DID in the AAD prevents a ciphertext captured under one generation from being replayed under a different generation that happens to share the same `kek` (e.g., due to a buggy KDF implementation).
* `signature`: Present when mode is `hybrid-sign` or `hybrid-full`. Signing `kid` MUST resolve to the sender's ephemeral DID document. Covers `{ suite, generation, mode, ephemeral_did, kid, aad, nonce, ciphertext }`.
* `ciphertext`: AEAD-protected serialized inner DIDComm message (JWM bytes or canonical JSON of the body). Recipient decrypts, then dispatches the inner message to its normal handler.

A common attachment-level use case is wrapping a per-recipient file decryption key in a compact form (e.g., a `WrappedFileKey`-style structure containing `kem`, `ct`, `kid`, `algorithm`). Such structures fit as the inner plaintext of a `pq-envelope` and SHOULD reuse the same field names so cross-protocol composition does not require a translation layer.

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
    "ephemeral_did": "did:peer:4zQm...",
    "kid": "did:peer:4zQm...#dsa-1",
    "signature": "BASE64URL(3309 bytes)"
  }
}
```

* `covers.type`: `message-id`, `digest-only`, `attachment-id`, `external-uri`.
* `digest`: Required canonical digest of the covered object. The verifier hashes the referenced object and compares before verifying the signature.
* `kid`: MUST resolve to an `assertionMethod` entry in the sender's ephemeral DID document for the named `ephemeral_did`. For PQ signatures intended to outlive the PQ session (audit trail, long-term attestation), the verifier MUST be able to resolve the ephemeral DID document offline — `did:peer:4` long form satisfies this because the document is encoded in the DID itself, and so the signature remains verifiable indefinitely without the original session being live.


---

### problem-report

Type: `https://didcomm.org/pq-bridge/1.0/problem-report`

Standard DIDComm problem-report format. Codes defined below in **Error Codes**.

---

## Flows

### Flow 1: Hybrid Upgrade After DIDComm Connection

```
Alice                                              Bob
  |                                                  |
  | [DIDComm connection: completed]                  |
  |                                                  |
  |-- Discover Features (pq-bridge + did methods) -->|
  |<-- Discover Features (pq-bridge + did methods) --|
  |                                                  |
  | [Alice mints ephemeral did:peer:4zQm... with     |
  |  fresh ML-KEM + X25519 + ML-DSA + Ed25519 keys]  |
  |                                                  |
  |-- propose-upgrade ------------------------------>|
  |   (suites: [h1,p2,p1], modes: [full,enc],        |
  |    ephemeral_did: did:peer:4zQm...,              |
  |    ephemeral_did_document: {...})                |
  |                                                  |
  | [Bob authenticates ephemeral DID via outer       |
  |  authcrypt; mints his own did:peer:4zQn...]      |
  |                                                  |
  |<-- accept-upgrade -------------------------------|
  |   (suite: h1, mode: hybrid-full,                 |
  |    ephemeral_did: did:peer:4zQn...,              |
  |    transcript_hash: ...)                         |
  |                                                  |
  |-- kem-exchange (kid: did:peer:4zQm...#kem-1) --->|
  |                                                  |
  |<-- kem-exchange (kid: did:peer:4zQn...#kem-1,    |
  |    signed with did:peer:4zQn...#dsa-1) ---------|
  |                                                  |
  |-- kem-confirm ---------------------------------->|
  |<-- kem-confirm ---------------------------------|
  |                                                  |
  |   [KEM_BOUND - session keys derived,             |
  |    bound to (Alice-LL, Bob-LL,                   |
  |    Alice-EPH, Bob-EPH) tuple]                    |
  |                                                  |
  |-- pq-envelope { inner: any DIDComm msg } ------->|
  |<-- pq-envelope { inner: any DIDComm msg } -------|
```

### Flow 2: Key Rotation With New Ephemeral DID (TTL Driven)

```
Alice                                       Bob
  | [KEM_BOUND, gen=0,                       |
  |  Alice-EPH: did:peer:4zQm...]            |
  |                                          |
  | [TTL reached: 30 days]                   |
  |                                          |
  | [Alice mints NEW ephemeral did:peer:4zQr |
  |  with fresh keys for gen=1]              |
  |                                          |
  |-- rotate-key ----------------------------|
  |   (current_gen=0, current_eph=4zQm,      |
  |    new_gen=1, new_eph=4zQr,              |
  |    new_eph_doc: {...})                   |
  |                                          |
  |  [Bob mints HIS new ephemeral DID too    |
  |   if his policy is to rotate both sides] |
  |                                          |
  |-- kem-exchange (gen=1, eph=4zQr) ------->|
  |<-- kem-exchange (gen=1, eph=Bob-new) ----|
  |                                          |
  |-- kem-confirm (gen=1) ------------------>|
  |<-- kem-confirm (gen=1) ------------------|
  |                                          |
  | [Both ephemeral DIDs valid for 300s]     |
  | [At t+300s: zeroize did:peer:4zQm secret |
  |  keys AND its DID document]              |
  | [Only did:peer:4zQr remains]             |
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

If a peer has previously deployed a non-standard PQ key exchange (e.g., a body-typed `kem-key-exchange` over BasicMessage, or a flow that attached PQ keys directly to long-lived DID documents) and does not yet advertise `pq-bridge/1.0` in Discover Features:

```
Alice (pq-bridge)             Bob (legacy PQ impl)
  |                               |
  |-- Discover Features --------->|
  |<-- Discover Features (no pq-bridge) -|
  |                               |
  |  [Fallback: Alice may speak the legacy
  |   wire format if she still supports it.
  |   In legacy mode there is NO ephemeral DID;
  |   PQ keys are attached to the long-lived DID
  |   document the way the legacy impl expects.]
  |                               |
  |  [Bob processes via legacy handler]
```

A legacy `kem-key-exchange` body matches the cryptographic profile of `pq-suite-p1`/`pq-only` mode. Implementations supporting both MUST disambiguate by checking Discover Features and SHOULD log a deprecation warning when the legacy fallback is used. When both peers advertise `pq-bridge/1.0`, the ephemeral-DID-based flow is mandatory; legacy interop is purely a transition affordance.

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
* The ephemeral DID document inside `propose-upgrade` adds a one-time overhead at session establishment (a `did:peer:4` long form containing ML-KEM + Ed25519 + ML-DSA verification methods is several KB). Mesh deployments SHOULD use the `did:peer:4` SHORT form on the wire and resolve the document out-of-band on first use, or fall back to `did:key` for `hybrid-encrypt` sessions that only need a single key-agreement key.
* For mesh deployments, prefer to run PQ-Bridge once per session and use the derived AEAD key for many subsequent compact messages without re-running KEM. Rotate ephemeral DIDs on message-count thresholds rather than wall-clock TTL to amortize the establishment cost.

---

## Security Considerations

1. **Hybrid by default**: Pure PQ (`pq-only`) loses the well-studied classical security guarantee. Implementations SHOULD default to `hybrid-encrypt` or stronger and SHOULD warn when peers select `pq-only`.

2. **Transcript binding**: The transcript hash MUST be computed over canonical JSON of the proposed suites/modes **and** both ephemeral DIDs. Without binding, a downgrade attack could substitute weaker suites after the fact, or an ephemeral-DID-substitution attack could swap in an adversary's ephemeral DID after the fact.

3. **Replay protection**: The combination of `nonce`, `transcript_hash`, `ephemeral_did`, and `kid` MUST be unique. Implementations MUST persist a per-connection seen-set and reject duplicates within `nonce_window_seconds`.

4. **Key rotation**: After `rotation_overlap_seconds`, the entire previous ephemeral DID (document AND secret keys) MUST be securely erased (zeroize on drop). Retaining an old ephemeral DID defeats forward secrecy because that DID's secret key can decrypt every `pq-envelope` ever sent under it.

5. **Generation monotonicity**: `generation` MUST be strictly increasing per connection. Decapsulation requests for a generation lower than `current_generation - 1` MUST be rejected. The ephemeral DID's `kid` alone is not sufficient to disambiguate — the receiver MUST cross-check `(ephemeral_did, generation)` together.

6. **kid binding**: Each `kid` is a DID-relative reference into a specific ephemeral DID document. Receivers MUST verify that (a) `kid_thumbprint` equals `BASE64URL(SHA-256(public_key))` when the key is being announced, AND (b) resolving `kid` against the named `ephemeral_did_document` yields the same public key. A peer sending a `kid` not matching the public key it advertises is Byzantine; abort the session.

7. **Ephemeral DID validation**: When a peer's `ephemeral_did` and `ephemeral_did_document` are received, the implementation MUST verify the DID is self-certifying (the DID is derived from the document, not just claimed to be), the method is on its Discover-Features allowlist, and the document contains ONLY `keyAgreement` and `assertionMethod` entries for algorithms compatible with the negotiated suite. Documents containing unexpected verification methods (e.g., a `capabilityInvocation` granting access to other keys) MUST be rejected with `pq.ephemeral_did_invalid`.

8. **Ephemeral DID NEVER carries long-lived material**: Implementations MUST NOT embed any long-lived DID's public key inside an ephemeral DID document, and MUST NOT use long-lived DID secret keys to sign anything other than the OPTIONAL `binding` field. Mixing the two collapses the unlinkability and forward-secrecy guarantees back to pre-ephemeral-DID levels.

9. **Signature scope**: `pq-signature` MUST cover a digest computed over the canonical form of the referenced object. Non-canonical signing allows substitution attacks. Verifiers MUST resolve the signing `kid` against the ephemeral DID document the signer announced for the named `generation`; signatures whose `kid` resolves only against the long-lived DID MUST be rejected.

10. **Confirm-MAC**: The `kem-confirm` MAC catches transcript divergence early (e.g., a MITM that reordered suite preferences or substituted an ephemeral DID). MUST be verified before any application data flows.

11. **No PQ-only when peer is offline**: If a recovery flow requires later decryption by a separate device, the PQ secret key MUST be made available there. Use Vaults 1.0 + Swarm 1.0 to back up the ephemeral DID document AND the matching secret keys with appropriate access controls. Note that backing up an ephemeral DID's secret key partially undermines its forward-secrecy property — restrict this to flows that genuinely need it.

12. **Algorithm agility**: Implementations MUST be prepared to add new suites without code changes (e.g., via a suite registry table). When a new suite is added, both peers MUST advertise it in Discover Features before negotiation.

13. **HKDF context strings are normative**: Implementations MUST use `didcomm.org/pq-bridge/1.0/{purpose}` as the HKDF info string. Implementations migrating from a non-standard predecessor info string MUST support both derivations during the transition window and prefer the normative one.

14. **Side-channel defenses**: ML-KEM and ML-DSA implementations SHOULD use constant-time operations. Production deployments SHOULD use audited, hardened implementations (e.g., `pqcrypto`, `liboqs`, `mlkem-native`).

15. **Quantum threat model**: This protocol assumes a future quantum adversary recording today's traffic. It does NOT assume the adversary has present-day quantum decryption capability; classical authcrypt remains the primary defense for present-day attacks. The ephemeral-DID model further narrows the blast radius: a future quantum break of the long-lived DID's classical keys does NOT directly expose past PQ-Bridge sessions, because the session crypto was bound to ephemeral DIDs whose secrets have been zeroized.

---

## Privacy Considerations

1. **Suite advertisement leaks capability**: Discover Features disclosure reveals which PQ suites and ephemeral DID methods a peer supports. PQ capability itself is not sensitive, but the specific combination fingerprints the implementation — operators with anti-correlation requirements SHOULD advertise a canonical superset rather than the implementation's exact runtime support.

2. **Ephemeral DIDs are normative for unlinkability**: Implementations MUST mint a fresh ephemeral DID per PQ session. Reusing an ephemeral DID across sessions, or across connections, enables exactly the correlation this design exists to prevent. The ephemeral DID MUST NOT be derived deterministically from the long-lived DID (e.g., via HKDF over the long-lived DID's key) — that would reintroduce cross-session correlation under any party who can observe two of the derived DIDs.

3. **PQ key reuse is forbidden**: ML-KEM and ML-DSA keypairs MUST exist inside an ephemeral DID and MUST NOT outlive it. Reusing the same PQ secret key across connections or sessions enables correlation by adversaries who control multiple peers.

4. **Pairwise long-lived DIDs still matter**: The ephemeral DID hides session-scoped crypto, but the long-lived DID on the outer authcrypt envelope still appears to mediators and routers. Continue to use pairwise long-lived DIDs per peer.

5. **Rotation timing**: Predictable rotation cadence reveals usage patterns. Implementations SHOULD jitter `rotation_overlap_seconds` and prefer message-count or volume-based triggers over wall-clock TTL alone. Because rotation now mints a new ephemeral DID, a regular rotation cadence also produces a regular cadence of fresh DIDs an adversary can count — randomize.

6. **Ephemeral DID document size in headers**: A `did:peer:4` long form embeds the document into the DID itself, which makes `propose-upgrade` larger than the pre-ephemeral-DID version. For bandwidth-constrained transports (LoRa, satellite) implementations MAY use the short form of `did:peer:4` and resolve the document out-of-band on first use — but the short form's resolution MUST still be self-certifying (i.e., the short form's hash MUST match the document's canonical hash).

7. **Binding signature reveals long-lived signing capability**: When `binding` is included, the message reveals that the sender controls a classical signing key on the long-lived DID. This is unavoidable when binding is required by policy, but implementations SHOULD omit `binding` unless a downstream protocol genuinely needs it.

---

## Validation Rules (Normative)

1. `kid_thumbprint` MUST equal `BASE64URL(SHA-256(public_key))` when `public_key` is present. Mismatch -> reject with `pq.kid_mismatch`.

2. `kid` MUST be a DID-relative reference into a known ephemeral DID document (the sender's for keys being announced, the peer's for keys being encapsulated against), AND the resolved verification method's public key MUST byte-equal `public_key` when present. Mismatch -> reject with `pq.kid_mismatch`.

3. PQ `public_key` and `ciphertext` byte lengths MUST match the suite's algorithm sizes (see Suite Registry table).

4. `propose-upgrade.suites` MUST be non-empty.

5. `propose-upgrade.ephemeral_did` and `accept-upgrade.ephemeral_did` MUST use a method advertised by both peers in Discover Features. Otherwise -> reject with `pq.ephemeral_did_method_unsupported`.

6. `ephemeral_did` MUST be self-certifying — the receiver MUST verify the DID is derived from `ephemeral_did_document` (e.g., for `did:peer:4` long form, the DID encodes the hash of the document). Mismatch -> reject with `pq.ephemeral_did_invalid`.

7. `ephemeral_did_document` MUST contain ONLY `keyAgreement` and `assertionMethod` verification methods, with algorithms appropriate to the suite. Other relationships (`authentication`, `capabilityDelegation`, `capabilityInvocation`, `keyAgreement` mixing arbitrary algorithms) MUST be rejected with `pq.ephemeral_did_invalid`.

8. The same `ephemeral_did` MUST NOT appear in two different PQ sessions on the same implementation. Re-announcement after destruction -> reject with `pq.ephemeral_did_reused`.

9. `binding` (when present) MUST verify against the sender's long-lived DID document via a `verificationMethod` with `assertionMethod` relationship. Mismatch -> reject with `pq.binding_invalid`.

10. `accept-upgrade.selected_suite` MUST be one of the proposed suites.

11. `accept-upgrade.selected_mode` MUST be one of the proposed modes.

12. `accept-upgrade.transcript_hash` MUST equal the locally computed transcript hash (which incorporates both ephemeral DIDs). Mismatch -> abort with `pq.transcript_mismatch`.

13. `kem-exchange.timestamp` MUST be within ±300 seconds of receiver's clock.

14. `kem-exchange.ephemeral_did` MUST match the ephemeral DID the sender announced for the current `generation`. Mismatch -> reject with `pq.ephemeral_did_mismatch`.

15. `kem-confirm.confirm_mac` MUST verify against the locally derived `auth_key`, with both ephemeral DIDs included in the MAC input.

16. `pq-envelope.aad` MUST bind the inner message's type, `thid`, and the sender's `ephemeral_did`.

17. `pq-envelope.ephemeral_did` MUST match a known peer ephemeral DID for the connection in either the current or previous-generation slot (during the rotation overlap window). Otherwise -> reject with `pq.unknown_ephemeral_did`.

18. `generation` MUST be strictly monotonic per `(connection_id, peer_long_lived_did)` pair. Each `generation` MUST be paired with a distinct ephemeral DID.

19. `nonce` MUST be 32 bytes of fresh randomness.

20. `signature` (when present) MUST verify against a key resolved through the signer's ephemeral DID document (NOT the long-lived DID), with appropriate `assertionMethod` relationship.

---

## Error Codes (Problem Reports)

All errors use type `https://didcomm.org/pq-bridge/1.0/problem-report`.

| Code | Description |
|------|-------------|
| `pq.suite_unsupported` | Proposed suite is not supported by responder |
| `pq.mode_unsupported` | Proposed mode is not supported by responder |
| `pq.no_intersection` | No suite/mode intersection found |
| `pq.transcript_mismatch` | Computed transcript hash differs from received |
| `pq.kid_mismatch` | `kid` does not resolve in the ephemeral DID document or `kid_thumbprint` does not match `SHA-256(public_key)` |
| `pq.public_key_invalid_size` | Public key byte length does not match suite |
| `pq.ciphertext_invalid_size` | KEM ciphertext byte length does not match suite |
| `pq.signature_invalid` | ML-DSA signature verification failed |
| `pq.timestamp_window` | Message timestamp outside ±300s window |
| `pq.replay_detected` | Nonce, `kid`, or `ephemeral_did` previously seen for this connection |
| `pq.generation_stale` | `kem-exchange` carries generation older than current - 1 |
| `pq.kem_confirm_failed` | `kem-confirm` MAC did not verify |
| `pq.rotation_in_progress` | Cannot start a new rotation while one is in progress |
| `pq.envelope_decrypt_failed` | AEAD decryption of `pq-envelope` failed |
| `pq.unknown_kid` | Referenced `kid` does not match any known peer key |
| `pq.ephemeral_did_invalid` | Ephemeral DID is not self-certifying, has wrong document shape, or references disallowed verification methods |
| `pq.ephemeral_did_method_unsupported` | Receiver does not support the DID method used for the ephemeral DID |
| `pq.ephemeral_did_mismatch` | `ephemeral_did` on the wire does not match the DID the sender announced for this `generation` |
| `pq.ephemeral_did_reused` | An ephemeral DID was reused from a previous session |
| `pq.unknown_ephemeral_did` | `pq-envelope` references an ephemeral DID not known for this connection |
| `pq.binding_invalid` | Long-lived-DID binding signature failed verification |
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
function computeTranscript({ initiatorLongLivedDid, responderLongLivedDid,
                             initiatorEphemeralDid, responderEphemeralDid,
                             connectionId,
                             proposedSuites, selectedSuite, selectedMode,
                             initiatorNonce, responderNonce }) {
  const canon = JSON.stringify({
    label: "didcomm.org/pq-bridge/1.0/transcript",
    initiator_long_lived_did: initiatorLongLivedDid,
    responder_long_lived_did: responderLongLivedDid,
    initiator_ephemeral_did: initiatorEphemeralDid,
    responder_ephemeral_did: responderEphemeralDid,
    connection_id: connectionId,
    proposed_suites: proposedSuites.slice().sort(),
    selected_suite: selectedSuite,
    selected_mode: selectedMode,
    initiator_nonce: initiatorNonce,
    responder_nonce: responderNonce
  });
  return sha256(canon);
}
```

### Ephemeral DID Minting (did:peer:4 long form)

```javascript
async function mintEphemeralDid(suite, mode) {
  const keys = {};
  if (suite.kem === "ML-KEM-768" || suite.kem.startsWith("X25519")) {
    keys["kem-1"] = await mlkem768.generate();
    if (suite.kem.startsWith("X25519")) {
      keys["x25519-1"] = await x25519.generate();
    }
  }
  if (mode === "hybrid-sign" || mode === "hybrid-full") {
    keys["dsa-1"] = await mldsa65.generate();
    keys["ed25519-1"] = await ed25519.generate();
  }

  const verificationMethods = Object.entries(keys).map(([fragment, kp]) => ({
    id: `#${fragment}`,
    type: typeForAlgorithm(kp.algorithm),
    publicKeyMultibase: encodeMultibase(kp.publicKey)
  }));

  const document = {
    "@context": ["https://www.w3.org/ns/did/v1"],
    verificationMethod: verificationMethods,
    keyAgreement: kemFragments(keys).map(f => `#${f}`),
    assertionMethod: dsaFragments(keys).map(f => `#${f}`)
  };

  const ephemeralDid = encodeDidPeer4(document); // self-certifying

  return { ephemeralDid, document, secretKeys: keys };
}
```

### Confirm-MAC

The `kem-confirm` MAC binds both ephemeral DIDs as well as the transcript:

```javascript
function computeConfirmMac(authKey, transcript, generation,
                          senderEphemeralDid, peerEphemeralDid) {
  const input = concat(
    Buffer.from("confirm"),
    transcript,
    Buffer.from(String(generation)),
    Buffer.from(senderEphemeralDid),
    Buffer.from(peerEphemeralDid)
  );
  return hmacSha256(authKey, input);
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

### pq-envelope Wrapping

```javascript
async function wrapEnvelope({ kek, mode, suite, generation,
                              ephemeralDid, kid,
                              innerMessage, signingKey }) {
  const nonce = randomBytes(12);
  const aad = canonicalAad(innerMessage.type, innerMessage.thid, ephemeralDid);
  const plaintext = serialize(innerMessage);
  const ciphertext = aesGcm(kek, nonce, plaintext, aad);

  const env = { suite, generation, mode, ephemeral_did: ephemeralDid, kid,
                aad, nonce, ciphertext };

  if (mode === "hybrid-sign" || mode === "hybrid-full") {
    // signingKey MUST be the secret half of an assertionMethod entry
    // in the sender's CURRENT ephemeral DID document
    env.signature = await mldsaSign(signingKey, canonicalSignedFields(env));
  }
  return env;
}
```

### Concurrent Initiation Tie-Break

Tie-break uses the long-lived DID (the one on the outer authcrypt envelope), NOT the ephemeral DID — using the ephemeral DID would let either peer grind freshness to bias the outcome.

```javascript
function resolveConcurrentProposal(localProposal, peerProposal,
                                   localLongLivedDid, peerLongLivedDid) {
  if (localLongLivedDid < peerLongLivedDid) {
    // Local wins - peer should accept ours; the loser also discards
    // its just-minted ephemeral DID and zeroizes the keypair
    return { winner: "local", proposal: localProposal };
  }
  return { winner: "peer", proposal: peerProposal };
}
```

---

## Recommended Rollout Phases

Implementations adopting this spec — including those that previously shipped a non-standard PQ key exchange — SHOULD follow this phased rollout. Each phase is interoperable with peers stalled at any earlier phase, so coordinated upgrade across an ecosystem is not required:

1. **Phase 1 (additive, ephemeral DIDs from day one)**: Implement `propose-upgrade`/`accept-upgrade`/`kem-exchange`/`kem-confirm` with the normative type URIs and ephemeral-DID semantics. Advertise `pq-bridge/1.0` in Discover Features along with the ephemeral DID methods supported (`did:peer:4` minimum). Ephemeral DIDs are not deferrable to a later phase — a deployment that ships PQ-Bridge without them inherits the cross-connection-correlation and rotation-friction problems the spec exists to avoid. If the implementation also supports a non-standard predecessor wire format, accept both during this phase, but new sessions MUST use ephemeral DIDs.

2. **Phase 2 (default hybrid)**: Default to `hybrid-encrypt` mode with `pq-suite-h1`. Mark `pq-only` as discouraged in operator logs.

3. **Phase 3 (signatures live)**: Add `pq-signature` and signed `pq-envelope` modes. Begin attaching ML-DSA signatures alongside classical ones for high-value flows. All signing keys live inside ephemeral DIDs.

4. **Phase 4 (rotation live)**: Add `rotate-key` triggers (TTL, message count, manual) — each rotation mints a NEW ephemeral DID, never reuses the existing one. Begin actually rotating session keys.

5. **Phase 5 (binding-signature where required)**: Wire up the optional `binding` field for flows that explicitly require long-lived-key endorsement of the ephemeral DID (Vaults custodial, Swarm pledger admission, Payments mandate establishment).

6. **Phase 6 (legacy off)**: Once all interop partners advertise `pq-bridge/1.0`, refuse any non-standard predecessor wire format and require negotiation through this protocol.

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
* [did:peer Method Specification](https://identity.foundation/peer-did-method-spec/) — `did:peer:4` is the RECOMMENDED ephemeral DID method for PQ-Bridge sessions
* [did:key Method Specification](https://w3c-ccg.github.io/did-key-spec/) — acceptable for `pq-only` / `hybrid-encrypt` sessions that need only a single key-agreement key
