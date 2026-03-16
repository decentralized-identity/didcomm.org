---

title: WebRTC
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/webrtc/1.0
status: Proposed
summary: A DIDComm v2 protocol for WebRTC video and audio communication supporting both peer-to-peer mesh (2–8 participants) and SFU-mediated topology (10–100+ participants), with DID-bound certificate fingerprints, E2EE via SFrame, privacy-preserving features, and out-of-band (OOB) one-click invite links.
tags: [webrtc, video, audio, p2p, sfu, signaling, ice, stun, turn, dtls, srtp, media-sharing, real-time, multiparty, scalable, e2ee, sframe, oob, links, qr]
authors:
  - name: Vinay Singh
    email: vinay@verid.id

---

## Summary

The WebRTC 1.0 protocol enables secure video and audio communication using **DIDComm v2** as the signaling channel. It supports two topologies: **peer-to-peer mesh** for small calls (2–8 participants) and **SFU-mediated** for scalable calls (10–100+ participants). The protocol provides NAT traversal, **binds WebRTC DTLS certificates to DID keys** for MITM protection, supports **end-to-end encryption (E2EE) with SFrame** in SFU mode, and works seamlessly with DIDComm mediators and **Message Pickup** for offline scenarios.
This draft additionally defines **Out-of-Band (OOB) Join Links** so users can connect by clicking a link (or scanning a QR) delivered by any channel (email/SMS/DM) **without requiring a mediator for the first hop**—while keeping all subsequent signaling DID-authenticated and encrypted.

---

## Goals

* Enable both P2P mesh and SFU-mediated topologies in one protocol
* Support ~2–8 participants via mesh, ~10–100+ via SFU
* Use DIDComm v2 **authcrypt** for signaling
* Bind identity to media streams via DID-signed certificate fingerprints
* Maintain E2EE in SFU mode using **SFrame** (Insertable Streams)
* Support privacy controls (relay-only mode, pairwise DIDs)
* Handle glare resolution, renegotiation, and ICE restart
* Work with standard DIDComm mediators (mesh) or SFU-capable mediators (SFU)
* **Provide link-native, mediator-free onboarding** via OOB Join Links (QR/URL)

---

## Roles

* **caller**: Initiates peer-to-peer WebRTC sessions
* **callee**: Receives peer-to-peer session proposals
* **host**: Creates multi-party rooms and invites participants
* **participant**: Joins multi-party sessions
* **sfu-mediator**: DIDComm mediator with SFU media forwarding capabilities

### Role Requirements

**Standard DIDComm mediators** support mesh topology with no additional requirements beyond Message Pickup and Coordinate Mediation.

**sfu-mediator** implementations MUST:

* Support WebRTC media forwarding (receive from all, forward to all)
* Manage room lifecycle (create, join, leave, destroy)
* Forward **SFrame-encrypted** frames without decrypting
* Provide TURN infrastructure for NAT traversal
* Implement quality adaptation (simulcast/SVC layer selection)
* **Not** terminate E2EE; never access plaintext media
* Support **DIDComm-based** signaling for joins and control

**sfu-mediator** implementations MAY:

* Support recording to Encrypted Data Vaults (see Vaults 1.0)
* Provide bandwidth estimation and quality recommendations

---

## Topology Selection

Clients SHOULD select topology based on participant count and mediator capabilities:

### Mesh Topology (2–8 participants)

* Each participant connects directly to every other participant
* N participants = N×(N-1)/2 peer connections
* Uses messages: `propose`, `offer`, `answer`, `ice`, `end`
* Mediator role: **Passive** router (forwards DIDComm messages only)
* Works with any DIDComm mediator **or with OOB links and direct delivery**

### SFU Topology (10–100+ participants)

* Each participant connects to the mediator’s SFU
* N participants = N connections (all to SFU)
* Uses messages: `create-room`, `join-room`, `room-offer`, `room-answer`, `participant-joined`, etc.
* Mediator role: **Active** SFU (processes RTP, forwards media; never decrypts SFrame)
* Requires mediator with `sfu-mediator` role; **invites may be OOB links**

### Discovery

Clients MUST use Discover Features 2.0 to check SFU support:

**Query**

```json
{
  "type": "https://didcomm.org/discover-features/2.0/queries",
  "body": {
    "queries": [
      {"feature-type": "protocol", "match": "https://didcomm.org/webrtc/1.*"}
    ]
  }
}
```

**Response indicating SFU support**

```json
{
  "type": "https://didcomm.org/discover-features/2.0/disclose",
  "body": {
    "disclosures": [{
      "feature-type": "protocol",
      "id": "https://didcomm.org/webrtc/1.0",
      "roles": ["sfu-mediator"],
      "extensions": {
        "max_participants": 100,
        "simulcast": true,
        "svc": ["VP9"],
        "e2ee": "sframe",
        "recording": true
      }
    }]
  }
}
```

If mediator responds without `sfu-mediator` role, client SHOULD use mesh topology or reject calls with >8 participants.

---

## States

| State           | Event                   | Next State      | Notes                                            |
| --------------- | ----------------------- | --------------- | ------------------------------------------------ |
| `IDLE`          | `propose` sent          | `PROPOSING`     | Caller initiates connection request (mesh)       |
| `IDLE`          | `create-room` sent      | `CREATING_ROOM` | Host creates SFU room                            |
| `PROPOSING`     | `offer` sent            | `OFFERING`      | Caller sends SDP offer with fingerprint proof    |
| `CREATING_ROOM` | `room-created` received | `ROOM_ACTIVE`   | SFU room ready, host can invite                  |
| `ROOM_ACTIVE`   | `join-room` sent        | `JOINING`       | Participant joining SFU room                     |
| `OFFERING`      | `answer` received       | `CONNECTING`    | SDP exchange complete, ICE gathering in progress |
| `JOINING`       | `room-offer` received   | `CONNECTING`    | SFU sends offer to participant                   |
| `CONNECTING`    | ICE connected           | `CONNECTED`     | Media flowing, connection established            |
| `CONNECTED`     | `renegotiate`/`update`  | `CONNECTED`     | Track changes, ICE restart, or parameter updates |
| `CONNECTED`     | `end`/`leave-room`      | `CLOSED`        | Session terminated                               |
| `*`             | `reject` received       | `CLOSED`        | Proposal or connection rejected                  |

---

## Out-of-Band (OOB) Join Links

This section enables **one-click joins** (QR/URL) **without** a mediator for message delivery. After the click, all signaling proceeds over **DIDComm v2 authcrypt** to endpoints specified in the link.

### Link formats

**Custom scheme (preferred)**

```
didcomm://?_oob=<base64url(webrtc-invitation)>
```

**HTTPS fallback (keep secret in fragment)**

```
https://join.example/webrtc#oob=<base64url(webrtc-invitation)>
```

### Invitation payload

The `_oob` value decodes to a compact JSON envelope (not sent over the wire directly after click):

**Type**: `https://didcomm.org/webrtc/1.0/invite-url`

```json
{
  "type": "https://didcomm.org/webrtc/1.0/invite-url",
  "from": "did:example:alice#key-1",
  "body": {
    "topology": "mesh",                           // or "sfu"
    "display": "Alice (Ajna)",                    // optional inviter display
    "thid": "7f1b8c5e-...",                       // thread to bind follow-ups
    "exp": 1731200000,                            // short TTL (seconds)
    "one_time": true,                             // single-use token
    "cap": { "media": ["audio","video"], "data": true },
    "policy": "relay-preferred",
    "service": [
      { "transport": "https", "endpoint": "https://agent.alice.example/didcomm", "return_route": "all" },
      { "transport": "ws", "endpoint": "wss://agent.alice.example/didcomm" }
    ],
    "ice_servers": [
      { "urls": ["stun:stun.verid.id:3478"] },
      { "urls": ["turns:turn.verid.id:5349"], "username": "u", "credential": "p" }
    ],
    "sfu": {
      "endpoint": "wss://sfu.verid.id/room-xyz",
      "room_id": "room-xyz",
      "features": { "simulcast": true, "e2ee": true }
    },
    "prekey": { "kty": "OKP", "crv": "X25519", "x": "<base64url>" }, // ephemeral ECDH prekey
    "constraints": {
      "aud": "optional:did:example:bob",
      "origin": "https://join.example",
      "use_limit": 1
    },
    "proof": {
      "alg": "EdDSA",
      "kid": "did:example:alice#key-1",
      "jws": "<compact JWS over deterministic payload>"
    }
  }
}
```

**Receiver behavior**

1. Decode `_oob`, verify `proof.jws` (issuer DID, `kid`), check `exp`, `one_time` / `use_limit`, `origin`, and (if present) `aud`.
2. Start **authcrypt** DIDComm to one of the provided `service.endpoint`s using ECDH with the **ephemeral `prekey`**.
3. Send the first protocol message (`propose` for mesh or `join-room` for SFU) with header `oob_thid` (below).

### OOB acknowledgment header

First on-wire message following an OOB link MUST include:

```
headers.oob_thid = <the invitation thid>
```

This lets the inviter/SFU invalidate the token and enforce `use_limit`.

### P2P OOB flow (mesh)

1. Alice generates `invite-url` (short TTL, one-time) with `service` endpoints + TURN/STUN + `prekey`.
2. Bob clicks link → verifies → sends `propose` (with `oob_thid`) **directly** to Alice’s endpoint.
3. Proceed with normal `offer`/`answer` + `ice`.

### SFU OOB flow

1. Host creates room via `create-room`, then mints `invite-url` containing `sfu.endpoint`, `room_id`, `prekey`, TURN/STUN.
2. Participant clicks link → verifies → sends `join-room` (with `oob_thid`) **directly** to SFU/host’s endpoint.
3. Continue with `room-offer`/`room-answer` + `ice`.

**Security notes**

* Use fragments (`#oob=`) for HTTPS to keep secrets out of server logs.
* Treat `thid` as the link token and mark spent on first successful use.
* Rotate TURN REST credentials frequently; avoid long-lived secrets in links.

---

## Message Reference

All messages use DIDComm v2 with `type = https://didcomm.org/webrtc/1.0/<message-name>`, standard headers (`id`, `thid`, `from`, `to`, `expires_time`). Use **authcrypt**.

> When a session is bootstrapped from an OOB link, the first message MUST include `headers.oob_thid`.

#### invite-url

**Purpose**: Embed in links/QRs only; bootstraps direct DIDComm contact.

**Type**: `https://didcomm.org/webrtc/1.0/invite-url`
**Fields**: As specified in **Out-of-Band Join Links**.

---

### Mesh Topology Messages

#### propose

Caller initiates a WebRTC session request.

**From**: caller → callee
**Body**:

```json
{
  "media": ["audio","video"],
  "data": true,
  "topology": "mesh",
  "trickle": true,
  "policy": "relay-preferred",
  "ice_servers": [
    {"urls": ["stun:stun.l.example.net:3478"]},
    {"urls": ["turns:turn.l.example.net:5349"], "username": "u", "credential": "p"}
  ]
}
```

**Headers (if OOB)**: `{ "oob_thid": "<thid-from-invite>" }`

---

#### offer

**From**: caller → callee
**Body**:

```json
{
  "sdp": "<SDP offer string>",
  "fingerprint_proof": {
    "fingerprints": ["sha-256 12:34:...:ab"],
    "dtls_role": "actpass",
    "alg": "EdDSA",
    "kid": "did:example:alice#key-1",
    "created": 1731140000,
    "expires": 1731140300,
    "jws": "<JWS signature>"
  },
  "trickle": true,
  "policy": "relay-preferred",
  "ice_servers": [...],
  "tie_breaker": 823746120
}
```

---

#### answer

**From**: callee → caller
**Body**:

```json
{
  "sdp": "<SDP answer string>",
  "fingerprint_proof": {
    "fingerprints": ["sha-256 98:76:...:cd"],
    "dtls_role": "passive",
    "alg": "EdDSA",
    "kid": "did:example:bob#key-1",
    "created": 1731140005,
    "expires": 1731140305,
    "jws": "<JWS signature>"
  }
}
```

---

#### ice

Exchange trickle ICE candidates.

**From**: caller ↔ callee OR participant ↔ sfu-mediator
**Body**:

```json
{
  "candidate": "candidate:0 1 UDP 2122252543 192.168.1.5 60769 typ host ...",
  "sdpMid": "0",
  "sdpMLineIndex": 0,
  "endOfCandidates": false
}
```

---

#### renegotiate

**From**: caller ↔ callee
**Body**:

```json
{
  "reason": "add-screenshare",
  "ice_restart": false
}
```

---

#### update

**From**: caller ↔ callee OR participant → sfu-mediator
**Body**:

```json
{
  "action": "mute",
  "media_type": "audio",
  "value": true
}
```

---

#### reject

**From**: callee → caller
**Body**:

```json
{
  "reason": "incompatible-capabilities"
}
```

---

#### end

**From**: caller ↔ callee
**Body**:

```json
{
  "reason": "hangup",
  "scope": "peer"
}
```

---

### SFU Topology Messages

#### create-room

**From**: host → sfu-mediator
**Body**:

```json
{
  "room_id": "room-xyz",
  "max_participants": 100,
  "features": { "simulcast": true, "e2ee": true, "recording": false },
  "policy": { "ice_policy": "relay-preferred", "codec_preferences": ["VP9","VP8","H.264"] }
}
```

#### room-created

**From**: sfu-mediator → host
**Body**:

```json
{
  "room_id": "room-xyz",
  "sfu_endpoint": "wss://mediator.example/sfu/room-xyz",
  "ice_servers": [
    {"urls": ["turns:mediator.example:5349"], "username": "...", "credential": "..."}
  ],
  "e2ee_config": { "suite": "sframe-aes-gcm-256", "key_distribution": "didcomm" }
}
```

#### invite

**From**: host → participant (via mediator routing or **as OOB link**)
**Body**:

```json
{
  "room_id": "room-xyz",
  "media": ["audio","video"],
  "sfu_endpoint": "wss://mediator.example/sfu/room-xyz"
}
```

#### join-room

**From**: participant → sfu-mediator
**Headers (if OOB)**: `{ "oob_thid": "<thid-from-invite>" }`
**Body**:

```json
{
  "room_id": "room-xyz",
  "media": ["audio","video"],
  "capabilities": { "simulcast": true, "max_recv_bitrate": 5000000, "codecs": ["VP9","VP8"] }
}
```

#### room-offer

**From**: sfu-mediator → participant
**Body**:

```json
{
  "room_id": "room-xyz",
  "sdp": "<SDP with receive-only tracks>",
  "fingerprint_proof": {
    "fingerprints": ["sha-256 ..."],
    "dtls_role": "actpass",
    "alg": "EdDSA",
    "kid": "did:example:sfu#key-1",
    "created": 1731140010,
    "expires": 1731140310,
    "jws": "..."
  },
  "participants": [
    {
      "did": "did:example:alice",
      "stream_id": "stream-alice-1",
      "media": ["audio","video"],
      "e2ee_key_id": "kid-alice-123"
    }
  ]
}
```

#### room-answer

**From**: participant → sfu-mediator
**Body**:

```json
{
  "room_id": "room-xyz",
  "sdp": "<SDP answer with send-only tracks>",
  "fingerprint_proof": {
    "fingerprints": ["sha-256 ..."],
    "dtls_role": "passive",
    "alg": "EdDSA",
    "kid": "did:example:bob#key-1",
    "created": 1731140011,
    "expires": 1731140311,
    "jws": "..."
  }
}
```

#### participant-joined

**From**: sfu-mediator → all participants
**Body**:

```json
{
  "room_id": "room-xyz",
  "participant": { "did": "did:example:bob", "stream_id": "stream-bob-1", "media": ["audio","video"] }
}
```

#### leave-room

**From**: participant → sfu-mediator
**Body**:

```json
{
  "room_id": "room-xyz",
  "reason": "user-left"
}
```

#### participant-left

**From**: sfu-mediator → all participants
**Body**:

```json
{
  "room_id": "room-xyz",
  "participant": "did:example:bob",
  "reason": "user-left"
}
```

#### quality-update

**From**: sfu-mediator → participant
**Body**:

```json
{
  "room_id": "room-xyz",
  "updates": [{ "stream_id": "stream-alice-1", "spatial_layer": "medium", "temporal_layer": 2, "max_bitrate": 1500000 }]
}
```

#### simulcast-control

**From**: participant → sfu-mediator
**Body**:

```json
{
  "room_id": "room-xyz",
  "preferences": { "stream-alice-1": "high", "stream-charlie-1": "low" }
}
```

#### destroy-room

**From**: host → sfu-mediator
**Body**:

```json
{
  "room_id": "room-xyz",
  "reason": "host-ended"
}
```

#### ping / pong

**From**: any ↔ any
**Body**:

```json
{ "timestamp": 1698765432000 }
```

---

## End-to-End Encryption (SFU Mode)

### Model

In SFU topology, media traverses the mediator. E2EE is achieved with **SFrame**, which encrypts encoded frames at the application layer using a **symmetric “sender key” per sender**.

**Key properties**

* Each sender maintains a symmetric SFrame key identified by `kid`.
* Frames are encrypted before leaving the client and decrypted after reception.
* The SFU forwards opaque ciphertext; it never sees plaintext.

### Key Distribution (strictly end-to-end)

1. **Sender creates** a new random symmetric SFrame key (`kid`), e.g., on join or rotation.
2. **Sender wraps** that key **for each recipient** using recipients’ DID public keys (HPKE/ECDH-ES → AEAD).
3. **Sender distributes** wrapped keys via DIDComm:

   * `key-announce` (new sender key)
   * `key-rotate` (periodic or on membership change)
   * `key-revoke` (e.g., when removing a participant)
4. **Recipients unwrap** and install the key mapped to `sender DID + kid`.

> **The SFU MUST NOT generate, unwrap, or rewrap sender keys.** It may relay the DIDComm key messages but never handle key plaintext.

### Key management messages

#### key-announce

**From**: sender → room (via SFU routing is OK; remains E2E)
**Type**: `https://didcomm.org/webrtc/1.0/key-announce`
**Body**:

```json
{
  "room_id": "room-xyz",
  "sender": "did:example:alice",
  "suite": "sframe-aes-gcm-256",
  "kid": "kid-alice-123",
  "wrapped_keys": [
    { "recipient": "did:example:bob#key-1", "jwe": "<HPKE/JWE>" },
    { "recipient": "did:example:charlie#key-1", "jwe": "<HPKE/JWE>" }
  ],
  "created": 1731140020
}
```

#### key-rotate

**From**: sender → room
**Type**: `https://didcomm.org/webrtc/1.0/key-rotate`
**Body**:

```json
{
  "room_id": "room-xyz",
  "sender": "did:example:alice",
  "old_kid": "kid-alice-123",
  "new_kid": "kid-alice-124",
  "wrapped_keys": [ /* as above for new_kid */ ],
  "reason": "membership-change"
}
```

#### key-revoke

**From**: host/sender → room
**Type**: `https://didcomm.org/webrtc/1.0/key-revoke`
**Body**:

```json
{
  "room_id": "room-xyz",
  "sender": "did:example:alice",
  "kid": "kid-alice-123",
  "reason": "participant-removed"
}
```

### Insertable Streams (illustrative)

```javascript
// Encrypt outgoing frames with current sender key
const tx = new TransformStream({
  transform: (encoded, ctl) => ctl.enqueue(sframeEncrypt(encoded, senderKey))
});
sender.transform = tx;

// Decrypt incoming frames using sender DID + kid
const rx = new TransformStream({
  transform: (encoded, ctl) => {
    const key = keyStore.get(encoded.meta.senderDid, encoded.meta.kid);
    ctl.enqueue(sframeDecrypt(encoded, key));
  }
});
receiver.transform = rx;
```

---

## Flows

### Basic Two-Party Call (Mesh)

1. **Alice → Bob**: `propose` (media types, ICE policy)
2. **Alice**: Create `RTCPeerConnection`, generate SDP offer, sign fingerprint proof
3. **Alice → Bob**: `offer` (SDP + `fingerprint_proof`)
4. **Bob**: Verify proof (DID doc); set remote; create answer; sign fingerprint
5. **Bob → Alice**: `answer` (SDP + `fingerprint_proof`)
6. **Both**: Exchange `ice` (trickle); DTLS handshake; media flows P2P
7. **Either**: `end` to terminate

### Multi-Party Call with SFU (50 participants)

1. **Host → SFU**: `create-room` (E2EE enabled)
2. **SFU → Host**: `room-created` (room_id, sfu_endpoint)
3. **Host → invitees**: `invite` **or OOB links**
4. **Participant → SFU**: `join-room` (capabilities)
5. **SFU → Participant**: `room-offer`
6. **Participant → SFU**: `room-answer`
7. **Sender(s)**: `key-announce` (SFrame sender keys) via DIDComm
8. **Everyone**: trickle `ice`; media flows via SFU (still E2EE)

### OOB Link (P2P)

1. **Alice** creates `invite-url` (short TTL, one-time, `prekey`).
2. **Bob** clicks, verifies, and sends `propose` **directly** to Alice (`oob_thid` set).
3. Continue with `offer`/`answer`/`ice`.

### OOB Link (SFU)

1. **Host** creates room, mints `invite-url` (includes `sfu.endpoint`, `room_id`, `prekey`).
2. **Participant** clicks, verifies, and sends `join-room` to SFU (`oob_thid` set).
3. Continue with `room-offer`/`room-answer`/`ice`, then E2EE key announcements.

### Glare Resolution (Mesh)

If both sides send `offer` simultaneously:

1. Compare `tie_breaker`; the lower value **retracts** and answers the other.
2. DTLS `setup` roles SHOULD follow JSEP perfect-negotiation norms.

### Dynamic Quality Adaptation (SFU)

1. SFU detects congestion.
2. **SFU → Participant**: `quality-update` (layer caps).
3. Client adjusts simulcast/SVC subscriptions and encodings.

### Using with Message Pickup

When callee is offline:

1. Caller’s `propose`/`offer` queued at mediator (mesh), or `invite` queued.
2. Callee polls via Message Pickup 4.0.
3. Callee processes and continues as usual.

---

## Security Considerations

### Authentication & Integrity

* **DIDComm authcrypt** for all signaling messages.
* **Fingerprint binding**: `fingerprint_proof` JWS binds WebRTC DTLS certificate(s) to a DID key.

  * Use `alg: "EdDSA"` with `kid` referencing a DID URL.
  * Sign a canonical payload containing: `thid`, **all** `a=fingerprint` values, `dtls_role`, `created`, `expires`.
  * Verifier checks freshness, DID key validity, and exact SDP fingerprint match.

### OOB Link Security

* **Short TTLs** and **single-use** (`one_time` or `use_limit`) to mitigate link leaks.
* **Audience binding** (`constraints.aud`) if the invitee DID is known.
* **Origin binding** (`constraints.origin`) for web joins; keep `_oob` in the URL **fragment**.
* **Ephemeral prekeys** per link; never reuse; do not expose long-term keys.

### Privacy

* Pairwise DIDs to prevent correlation across sessions.
* `relay-only` ICE policy to hide IPs (at higher cost/latency).
* Prefer mDNS candidates over private IP exposure.
* Minimize metadata in headers and `reason` fields.

### Media Encryption

* Mesh: DTLS-SRTP provides E2EE by default.
* SFU: **SFrame** provides application-layer E2EE; keys are **symmetric** and distributed **end-to-end** by clients.

### Problem Reports (Report Problem 2.0 codes)

* `incompatible-capabilities`, `ice-gathering-timeout`, `turn-auth-failed`,
  `unverified-fingerprint`, `glare-timeout`, `policy-required`,
  `topology-unsupported`, `room-full`, `sfu-unavailable`.

---

## Interop Notes

### DID Document Service Endpoints (Optional)

Agents MAY publish WebRTC ICE server configuration:

```json
{
  "id": "#webrtc-ice",
  "type": "webrtc-ice-servers",
  "serviceEndpoint": "https://agent.alice.example/ice",
  "accept": ["webrtc/ice-servers/1.0"]
}
```

SFU mediators MAY publish SFU capabilities:

```json
{
  "id": "#webrtc-sfu",
  "type": "webrtc-sfu",
  "serviceEndpoint": "wss://mediator.example/sfu",
  "capabilities": {
    "max_participants": 100,
    "simulcast": true,
    "codecs": ["VP9","VP8","H.264"],
    "e2ee": ["sframe"]
  }
}
```

### Composition with Other Protocols

* **Discover Features 2.0**: Capability negotiation
* **Message Pickup 4.0**: Async signaling when offline
* **Coordinate Mediation 3.0**: DID registration with mediators
* **Report Problem 2.0**: Error reporting
* **Vaults 1.0**: Recording storage (encrypted)

### Platform Considerations

* **Browser**: `RTCPeerConnection` + Insertable Streams for SFrame
* **Mobile**: Native WebRTC libs (iOS WebRTC.framework, Android libwebrtc)
* **Rust**: `webrtc-rs` (or equivalents)
* **Node.js**: `wrtc` / `node-webrtc`

---

## Implementation Hints

### Fingerprint Extraction & Proof

```javascript
function extractFingerprints(sdp) {
  return [...sdp.matchAll(/^a=fingerprint:(\S+)\s+(.+)$/gm)]
         .map(m => `${m[1]} ${m[2]}`);
}

function createFingerprintProof({ thid, fingerprints, dtls_role, didKey }) {
  const payload = { thid, fingerprints, dtls_role, created: Date.now(), expires: Date.now()+300000 };
  return signJWS(payload, didKey, { alg: "EdDSA", kid: didKey.kid });
}
```

### Trickle ICE

```javascript
pc.onicecandidate = (e) => {
  sendDIDComm({
    type: "https://didcomm.org/webrtc/1.0/ice",
    thid: sessionId,
    body: e.candidate ? {
      candidate: e.candidate.candidate,
      sdpMid: e.candidate.sdpMid,
      sdpMLineIndex: e.candidate.sdpMLineIndex,
      endOfCandidates: false
    } : { endOfCandidates: true }
  });
};
```

### OOB Link Validation (Receiver)

```javascript
async function handleOOB(oob) {
  const { body } = oob;
  assert(Date.now()/1000 < body.exp);
  await verifyJWS(body.proof.jws, body.proof.kid); // EdDSA over canonical body
  // Start DIDComm to body.service[0].endpoint using ECDH with body.prekey
}
```

### SFU Implementation Hints

* ICE-Lite recommended; forward RTP with header extensions preserved for SFrame.
* Respect client `simulcast-control` requests and issue `quality-update` as needed.
* Never unwrap or generate SFrame keys; only relay key messages.

---

## References

* WebRTC 1.0: Real-Time Communication Between Browsers — https://www.w3.org/TR/webrtc/
* RFC 8829 — JavaScript Session Establishment Protocol (JSEP)
* RFC 8445 — Interactive Connectivity Establishment (ICE)
* SFrame — IETF draft: draft-ietf-sframe-enc
* Insertable Streams for MediaStreamTrack — https://w3c.github.io/webrtc-encoded-transform/
* DIDComm Messaging Specification v2.0 — https://identity.foundation/didcomm-messaging/spec/v2.0/
* Discover Features Protocol 2.0 — https://didcomm.org/discover-features/2.0/
* Message Pickup Protocol 4.0 — https://didcomm.org/messagepickup/4.0/
* Coordinate Mediation Protocol 3.0 — https://didcomm.org/coordinate-mediation/3.0/
* Vaults Protocol 1.0 — https://didcomm.org/vaults/1.0/

---
