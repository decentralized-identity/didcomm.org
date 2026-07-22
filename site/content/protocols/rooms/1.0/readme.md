---
title: Rooms
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/rooms/1.0
status: Demonstrated
summary: End-to-end encrypted group messaging over DIDComm v2 using MLS for group keying, a Host for handshake ordering and fan-out, optional Routers for mesh relay, and Signing 1.0 artifacts for admin governance and replay-proof join tokens.
tags: [rooms, group-chat, mls, e2ee, signing, hpke, mesh]
authors:
  - name: Vinay Singh
    email: vinay@ajna.inc
---

## Summary

A DIDComm v2 application protocol for **end-to-end encrypted** group chat using **MLS** (RFC 9420) for group keying and confidentiality, a **Host** (MLS Delivery Service) for handshake ordering and fan-out, optional **Routers** for mesh relay, and **Signing 1.0** artifacts for admin governance, replay-proof join tokens, and router attestations.

MLS supplies group forward secrecy and post-compromise security via a tree-based design; DIDComm supplies addressing, routing, threading, and mediation/pickup.

## Motivation

Existing group messaging protocols are tightly coupled to specific transports and identity systems. This protocol combines the strongest available primitives — MLS for cryptographic group management, DIDComm for decentralized messaging, and DIDs for identity — into a composable specification that works across any transport (HTTP, WebSocket, BLE mesh) and supports offline-first mobile delivery via pickup.

## Roles

- **owner** — creates the room; controls the Room DID.
- **admin** — one or more; authorized to change membership and policy (Room DID controllers or delegated capability holders via Signing 1.0).
- **member** — MLS leaf participant. Multi-device users join with multiple leaves.
- **host** — **Delivery Service** (DS) named by the Room DID; orders MLS commits (one winner per epoch), fans out messages, stores for pickup.
- **router** — non-authoritative relay that forwards envelopes to a reach set; never decrypts MLS content.

## Room DID & Identity

- **Room DID:** Any DID method. The `service` block MUST include a `DIDCommMessaging` endpoint for the Host. The `controller` field MAY list multiple admin DIDs for multi-admin governance.
- **AS policy (MLS Authentication Service):** Deployments MUST define how MLS credentials bind to DIDs — either direct binding or via a credential registry.

Example Room DID Document:

```json
{
  "id": "did:peer:11-ROOM",
  "controller": ["did:ex:admin1", "did:ex:admin2"],
  "service": [{
    "id": "#didcomm",
    "type": "DIDCommMessaging",
    "serviceEndpoint": "https://host.example/rooms/11-ROOM",
    "accept": ["didcomm/v2"],
    "routingKeys": ["did:ex:mediator#rk1"]
  }]
}
```

## Transport & Routing

Resolve the Room DID to its `DIDCommMessaging` service endpoint. If the endpoint is itself a DID, resolve again for a concrete URI. DIDComm v2 `forward` is used for routing (the `to` header is encrypted). Use `return_route` when useful. Use Message Pickup for offline delivery.

## States

### Room Lifecycle

```
[Created] --> [Active] --> [Suspended] --> [Active]
                 |                            |
                 +--> [Archived] --> [Deleted]
                 |
                 +--> [Deleted]
```

### Member Lifecycle

```
[Pending] --> [Active] --> [Removed]
                 |
                 +--> [Banned]
```

## Basic Walkthrough

1. **Owner** sends `create` to Host with room policy and MLS ciphersuite. Host creates MLS group and returns `created` with `room_id` and `mls_group_id`.
2. **Admin** sends `invite` to Host with invitee DID and a Signing 1.0 authorization artifact. Host validates the authz signature, generates a replay-proof join token, and delivers it to the invitee.
3. **Invitee** sends `join` to Host with the join token and an MLS KeyPackage attachment. Host validates the token (signature, counter, expiry), adds the member to the MLS group, and returns a `welcome` message with the MLS Welcome.
4. Host fans out the MLS `commit` to existing members so they update their local group state.
5. **Members** exchange `msg` messages containing MLS application ciphertext (opaque to Host and Routers). Host fans out to all members.
6. **Members** send `leave` to self-remove from the room.
7. **Admins** send `moderate` to add, remove, ban, unban, promote, demote, or transfer ownership. Each action MUST carry a Signing 1.0 authz artifact.

## Delivery Semantics

- **At-least-once** delivery with idempotent processing.
- Two IDs per message:
  - **DIDComm `id`** — network-level identifier.
  - **`mls_msg_id` in MLS AAD** — content-level identifier. Recipients MUST keep a seen-set keyed by `mls_msg_id`; duplicates trigger re-ack but no re-processing.
- **Receipts 1.0** for delivery acks (member to Host). Host is the authoritative ack log and streams ack updates to routers.
- **Loop prevention:** bounded `hop_count` (drop at 0); optional `via` trace for diagnostics.

## Signing 1.0 Integration

- **Admin authorization:** `invite`, `moderate`, and room policy updates MUST carry an authorization artifact produced via Signing 1.0 (single signature or threshold, e.g., FROST/MuSig2). Host MUST verify the artifact before sequencing any MLS change.
- **Replay-proof join token:** Signed ticket with device binding, monotonic counter, and expiry, plus an optional HPKE envelope whose AAD binds to the token digest. Client MUST verify counter monotonicity and expiry before processing.
- **Router attestation:** `route-advertise` MUST carry a signed attestation from the router's DID (optionally co-signed by admin).

## Design By Contract

Errors use Report-Problem 2.0. MUST NOT leak MLS plaintext in error bodies.

Common error codes:
- `authz.denied` — invalid or missing admin authorization
- `mls.conflict` — competing commit; retry later
- `mls.epoch-stale` — sender behind current epoch; resync required
- `join.token-expired` — join token past expiry
- `join.replay` — join token counter already seen (replay attempt)
- `router.attestation-invalid` — bad or expired router attestation

## Message Reference

### Create

Creates a room at the Host.

Message Type URI: `https://didcomm.org/rooms/1.0/create`

```json
{
  "id": "abc-123",
  "type": "https://didcomm.org/rooms/1.0/create",
  "body": {
    "label": "Engineering Chat",
    "room_did": "did:peer:11-ROOM",
    "ciphersuite": "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
    "policy": {
      "join": "invite-only",
      "max_members": 100
    }
  }
}
```

### Created

Acknowledgment from Host after room creation.

Message Type URI: `https://didcomm.org/rooms/1.0/created`

```json
{
  "id": "def-456",
  "type": "https://didcomm.org/rooms/1.0/created",
  "thid": "abc-123",
  "body": {
    "room_id": "r-550e8400",
    "room_did": "did:peer:11-ROOM",
    "mls_group_id": "0a1b2c3d...",
    "roster": ["did:key:z6Mk...owner"]
  }
}
```

### Invite

Admin invites a DID to join. MUST carry a Signing 1.0 authorization artifact.

Message Type URI: `https://didcomm.org/rooms/1.0/invite`

```json
{
  "id": "inv-789",
  "type": "https://didcomm.org/rooms/1.0/invite",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "invitee": "did:key:z6Mk...bob",
    "authz": {
      "type": "jws-ed25519@1",
      "session_id": "sess-001",
      "signatures": ["base64url-encoded-signature"]
    }
  }
}
```

The `authz` artifact MUST be verifiable against one of the Room DID's controllers (or a valid delegation chain). The Host generates a replay-proof join token and delivers it to the invitee.

### Join

Join a room. MUST include an MLS KeyPackage as an attachment. For invite-only rooms, MUST include a valid join token. For open rooms, the token is optional.

Message Type URI: `https://didcomm.org/rooms/1.0/join`

```json
{
  "id": "join-101",
  "type": "https://didcomm.org/rooms/1.0/join",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "token": {
      "token": {
        "typ": "signing-ticket",
        "session_id": "sess-001",
        "scope": "join",
        "device": "did:key:z6Mk...device1",
        "ctr": 42,
        "exp": "2026-05-01T00:00:00Z",
        "cap": 1
      },
      "sig": {
        "suite": "jws-ed25519@1",
        "kid": "did:key:z6Mk...admin#key-1",
        "value": "base64url-encoded-signature"
      },
      "envelope": {
        "suite": "envelope-hpke@1",
        "aad": { "ticket_digest": "sha256-hex" },
        "ciphertext": "base64-encrypted-welcome-secret",
        "enc": {
          "kem": "DHKEM(X25519, HKDF-SHA256)",
          "kdf": "HKDF-SHA256",
          "aead": "AES-256-GCM",
          "ek_pub": "base64-ephemeral-public-key"
        }
      }
    }
  },
  "attachments": [{
    "id": "kp-1",
    "media_type": "application/mls-keypackage",
    "data": { "base64": "...MLS KeyPackage bytes..." }
  }]
}
```

Host MUST validate: token signature against issuer DID, counter monotonicity, expiry, and HPKE AAD binding to token digest.

### Welcome

Delivered to a new member after a successful `join`. Contains the MLS Welcome message.

Message Type URI: `https://didcomm.org/rooms/1.0/welcome`

```json
{
  "id": "wel-201",
  "type": "https://didcomm.org/rooms/1.0/welcome",
  "thid": "join-101",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "room_id": "r-550e8400"
  },
  "attachments": [{
    "id": "welcome-1",
    "media_type": "application/mls-welcome",
    "data": { "base64": "...MLS Welcome bytes..." }
  }]
}
```

### Commit

Distributed to existing members after a membership change (join, remove, leave). Contains the MLS Commit message so members can update their local group state.

Message Type URI: `https://didcomm.org/rooms/1.0/commit`

```json
{
  "id": "cmt-301",
  "type": "https://didcomm.org/rooms/1.0/commit",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "epoch": 5
  },
  "attachments": [{
    "id": "commit-1",
    "media_type": "application/mls-commit",
    "data": { "base64": "...MLS Commit bytes..." }
  }]
}
```

### Leave

Member self-removal from a room. Host processes the MLS removal and fans out the Commit.

Message Type URI: `https://didcomm.org/rooms/1.0/leave`

```json
{
  "id": "leave-401",
  "type": "https://didcomm.org/rooms/1.0/leave",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "reason": "Leaving the project"
  }
}
```

### Roster Request / Roster

Fetch the current room roster and MLS epoch.

Message Type URI: `https://didcomm.org/rooms/1.0/roster-request`

```json
{
  "id": "rr-501",
  "type": "https://didcomm.org/rooms/1.0/roster-request",
  "body": {
    "room_did": "did:peer:11-ROOM"
  }
}
```

Message Type URI: `https://didcomm.org/rooms/1.0/roster`

```json
{
  "id": "ro-502",
  "type": "https://didcomm.org/rooms/1.0/roster",
  "thid": "rr-501",
  "body": {
    "members": [
      { "did": "did:key:z6Mk...alice", "role": "owner", "devices": 2 },
      { "did": "did:key:z6Mk...bob", "role": "member", "devices": 1 }
    ],
    "epoch": 5
  }
}
```

### Msg (Application Data)

Carries MLS application ciphertext. Opaque to Host and Routers.

Message Type URI: `https://didcomm.org/rooms/1.0/msg`

```json
{
  "id": "msg-601",
  "type": "https://didcomm.org/rooms/1.0/msg",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "epoch": 5
  },
  "attachments": [{
    "id": "mls-1",
    "media_type": "application/mls-message",
    "data": { "base64": "...MLS ciphertext..." }
  }]
}
```

MLS AAD MUST carry a stable `mls_msg_id` (UUID) for idempotent deduplication, along with `room_did`, `sender_did`, and `timestamp`.

### Moderate (Admin-Only)

Admin actions on membership. Triggers MLS handshake/Commit. MUST carry a Signing 1.0 authorization artifact.

Message Type URI: `https://didcomm.org/rooms/1.0/moderate`

Supported actions: `add`, `remove`, `ban`, `unban`, `promote`, `demote`, `transfer-ownership`.

```json
{
  "id": "mod-701",
  "type": "https://didcomm.org/rooms/1.0/moderate",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "action": "remove",
    "subject": "did:key:z6Mk...charlie",
    "reason": "Violated code of conduct",
    "authz": {
      "type": "jws-ed25519@1",
      "session_id": "sess-007",
      "signatures": ["base64url-encoded-admin-signature"]
    }
  }
}
```

Host MUST verify `authz` against the Room DID controllers (or a valid delegation) and only then sequence the MLS Commit. One Commit wins per epoch (MLS Architecture assigns commit ordering to the DS).

### Route Advertise / Route Ack

Routers register a reach set with the Host. MUST carry a signed router attestation.

Message Type URI: `https://didcomm.org/rooms/1.0/route-advertise`

```json
{
  "id": "ra-801",
  "type": "https://didcomm.org/rooms/1.0/route-advertise",
  "body": {
    "room_did": "did:peer:11-ROOM",
    "reach": ["did:key:z6Mk...dave", "did:key:z6Mk...eve"],
    "attestation": {
      "signed": {
        "router": "did:key:z6Mk...router1",
        "room_did": "did:peer:11-ROOM",
        "reach": ["did:key:z6Mk...dave", "did:key:z6Mk...eve"],
        "exp": "2026-06-01T00:00:00Z",
        "policy_hash": "sha256-of-room-policy",
        "nonce": "random-nonce-value"
      },
      "sig": "base64url-encoded-router-signature"
    }
  }
}
```

Message Type URI: `https://didcomm.org/rooms/1.0/route-ack`

```json
{
  "id": "rack-802",
  "type": "https://didcomm.org/rooms/1.0/route-ack",
  "thid": "ra-801",
  "body": {
    "accepted_reach": ["did:key:z6Mk...dave", "did:key:z6Mk...eve"],
    "lease_exp": "2026-06-01T00:00:00Z"
  }
}
```

## Host & Router Behavior

- **Host (DS):** Accept messages to the room endpoint. Maintain roster and MLS group state. Order MLS handshakes — one Commit wins per epoch. Fan out MLS bytes (opaque). Store for Pickup. Maintain authoritative ack log (process delivery receipts).
- **Router:** Before sending, consult local + Host ack cache. Do not send to a member that already acked `(member, mls_msg_id)`. Retry with backoff until ack observed or TTL expiry. Decrement `hop_count`; drop at 0. Never decrypt MLS. Routing uses DIDComm `forward`.

## Security & Privacy

- **Confidentiality & integrity:** MLS provides E2EE for application and handshake messages. Host and Routers treat MLS bytes as opaque. MLS provides forward secrecy and post-compromise security via epoch ratcheting.
- **Replay-proof joins:** HPKE envelope AAD binds to the token digest. Client enforces monotonic counter and expiry before decrypt.
- **Admin authorization:** All admin actions (invite, moderate, policy changes) are cryptographically proven via Signing 1.0 artifacts. DIDComm authcrypt provides sender authentication; Signing 1.0 provides authorization proof.
- **Metadata:** Prefer Host fan-out over multi-recipient headers to minimize metadata leakage. Consider padding and batching.
- **AS/DS split:** Prefer non-colluding Authentication Service and Delivery Service roles per MLS Architecture guidance.

## Composition

This protocol composes with:

| Protocol | Usage |
|----------|-------|
| [Signing 1.0](https://didcomm.org/signing/1.0) | Admin authorization artifacts, join tokens, router attestations |
| [Receipts 1.0](https://didcomm.org/receipts/1.0) | Delivery acknowledgments (member to Host) |
| [Report Problem 2.0](https://didcomm.org/report-problem/2.0) | Error reporting |
| [Message Pickup](https://didcomm.org/messagepickup/2.0) | Offline message delivery |
| [Routing 2.0](https://didcomm.org/routing/2.0) | DIDComm forward for encrypted routing |

## Interop & Discovery

Use Discover-Features to advertise support:

```json
{
  "id": "disc-001",
  "type": "https://didcomm.org/discover-features/2.0/disclose",
  "body": {
    "disclosures": [{
      "feature-type": "protocol",
      "id": "https://didcomm.org/rooms/1.0",
      "roles": ["member", "admin", "host", "router"],
      "extensions": {
        "mls_ciphersuites": ["MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519"],
        "signing_suites": ["jws-ed25519@1", "frost-ed25519@1"],
        "envelopes": ["envelope-hpke@1"],
        "max_attachment_size": 10485760
      }
    }]
  }
}
```

## References

- [MLS Protocol (RFC 9420)](https://datatracker.ietf.org/doc/rfc9420/) — tree-based group keying with forward secrecy and post-compromise security.
- [MLS Architecture](https://messaginglayersecurity.rocks/mls-architecture/draft-ietf-mls-architecture.html) — defines Delivery Service, Authentication Service, commit ordering, and threat model.
- [HPKE (RFC 9180)](https://datatracker.ietf.org/doc/rfc9180/) — hybrid public-key encryption for sealed secrets and join tokens.
- [DID Core (W3C)](https://www.w3.org/TR/did-core/) — DIDs, DID Documents, `service`, `controller`.
- [DIDComm v2](https://identity.foundation/didcomm-messaging/spec/) — envelopes, routing, problem-report, receipts, pickup.
- [Signing 1.0](https://didcomm.org/signing/1.0) — signature orchestration, authorization tokens, HPKE envelopes.
