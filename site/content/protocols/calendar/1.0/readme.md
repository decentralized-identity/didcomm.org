---
title: Calendar
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/calendar/1.0
status: Proposed
summary: A DIDComm v2 protocol for privacy-preserving, decentralized calendar coordination supporting event lifecycle management, free/busy availability queries, recurring events (RRULE), group scheduling with quorum-based confirmation, reminders, delegation, and deep integration with WebRTC (scheduled calls), Workflow (event triggers), Vaults (sensitive field storage), Payments (payment deadlines), Signing (confirmed attendance), and Mesh (offline-first sync).
tags: [calendar, scheduling, events, availability, recurrence, rrule, reminders, group-scheduling, delegation, timezone, iana-tz, webrtc, workflow, vaults, mesh, privacy]
authors:
  - name: Vinay Singh
    email: vinay@verid.id
---

## Summary

Calendar 1.0 is a DIDComm v2 protocol for **privacy-preserving, decentralized calendar coordination**. It enables agents to create events, invite participants, negotiate times via polls, handle recurring schedules, delegate attendance, and share free/busy availability—all without a central calendar server.

The protocol deeply integrates with the existing DIDComm ecosystem: events with `type: "call"` auto-trigger **WebRTC 1.0** sessions at event time; **Workflow 1.0** actions can create calendar events and calendar completion can advance workflows; sensitive fields (descriptions, locations, attachments) are stored in **Vaults 1.0** via `$ref` pointers; payment deadline events compose with **Payments 1.0**; signed RSVPs and delegation tokens use **Signing 1.0**; and messages are designed to fit **Mesh 1.0** frame budgets for offline-first environments.

---

## Goals / Non-Goals

**Goals**

* Schedule one-off and recurring events between DIDComm agents.
* Negotiate meeting times via poll-based group scheduling with quorum.
* Share free/busy availability without leaking event details.
* Trigger WebRTC calls, workflow transitions, and payment flows from calendar events.
* Store sensitive event data in encrypted vaults via `$ref` pointers.
* Support delegation of attendance with JWS-signed tokens.
* Work over constrained transports (Mesh/LoRa) with compact messages.

**Non-Goals**

* No calendar storage server—agents store their own events locally.
* No external calendar bridging (Google Calendar, Outlook, etc.)—defer to application-layer integrations.
* No resource booking (rooms, equipment)—may be added in a future version.

---

## Roles

* **organizer**: Creates events, sends invitations, manages event lifecycle (update, cancel). Owner of the event thread.
* **invitee**: Receives event invitations, responds (accept/decline/tentative), may propose changes or delegate.
* **delegate**: Receives delegated attendance from an invitee. Acts with the delegator's authority for that event.
* **scheduler**: Automated agent that performs availability queries, group scheduling optimization, and reminder dispatch. May be the organizer's own agent or a shared service.

### Role Requirements

**organizer** implementations MUST:

* Maintain authoritative event state and participant list
* Enforce sequence ordering on all outbound updates
* Validate delegation tokens before accepting delegates
* Dispatch reminders at configured offsets (or delegate to a scheduler agent)

**invitee** implementations MUST:

* Reject messages with `sequence` lower than last-seen value
* Support `accept`, `decline`, and `tentative` responses
* Verify event thread continuity via `thid`

**scheduler** implementations MAY:

* Aggregate availability across multiple invitees
* Auto-resolve poll results when quorum is met
* Pre-create WebRTC rooms for upcoming call events
* Queue reminders for offline delivery via Message Pickup

---

## Discovery

Clients MUST use Discover Features 2.0 to advertise Calendar 1.0 support:

**Query**

```json
{
  "type": "https://didcomm.org/discover-features/2.0/queries",
  "body": {
    "queries": [
      { "feature-type": "protocol", "match": "https://didcomm.org/calendar/1.*" }
    ]
  }
}
```

**Disclose**

```json
{
  "type": "https://didcomm.org/discover-features/2.0/disclose",
  "body": {
    "disclosures": [{
      "feature-type": "protocol",
      "id": "https://didcomm.org/calendar/1.0",
      "roles": ["organizer", "invitee", "scheduler"],
      "extensions": {
        "recurrence": true,
        "delegation": true,
        "group_scheduling": true,
        "max_participants": 50,
        "call_integration": true,
        "vault_storage": true,
        "signed_rsvp": true
      }
    }]
  }
}
```

---

## Data Model

### EventDescriptor

The canonical representation of an event stored by agents:

```json
{
  "event_id": "evt-7f1b8c5e",
  "title": "Q4 Planning Session",
  "type": "call",
  "start": "2026-04-10T15:00:00Z",
  "end": "2026-04-10T16:00:00Z",
  "timezone": "America/New_York",
  "description": {
    "$ref": {
      "vault_id": "urn:edv:...:vault-cal-01",
      "doc_id": "z19evt-desc-001",
      "digest": "sha256-BASE64URL(...)"
    }
  },
  "location": {
    "$ref": {
      "vault_id": "urn:edv:...:vault-cal-01",
      "doc_id": "z19evt-loc-001",
      "digest": "sha256-BASE64URL(...)"
    }
  },
  "organizer": "did:example:alice",
  "participants": [
    { "did": "did:example:alice", "role": "organizer", "status": "accepted" },
    { "did": "did:example:bob", "role": "invitee", "status": "accepted" },
    { "did": "did:example:carol", "role": "invitee", "status": "tentative" }
  ],
  "sequence": 1,
  "sensitivity": "confidential",
  "recurrence": {
    "rrule": "FREQ=WEEKLY;BYDAY=TH;COUNT=12",
    "exceptions": [
      {
        "recurrence_id": "2026-04-17T15:00:00Z",
        "action": "modify",
        "changes": { "start": "2026-04-17T16:00:00Z" }
      }
    ],
    "exdates": ["2026-05-01T15:00:00Z"]
  },
  "reminders": [
    { "offset_minutes": -15, "channel": "didcomm" },
    { "offset_minutes": -1440, "channel": "didcomm" }
  ],
  "call_config": {
    "topology": "mesh",
    "media": ["audio", "video"]
  },
  "allow_delegation": true,
  "require_signed_rsvp": false,
  "vault_ref": {
    "vault_id": "urn:edv:...:vault-cal-01",
    "base_url": "https://edv.example.com/edvs/vault-cal-01"
  },
  "tags": ["planning", "q4"],
  "created_at": "2026-04-04T10:00:00Z",
  "updated_at": "2026-04-05T12:30:00Z"
}
```

**Field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | string | Globally unique identifier (`evt-` prefix + UUID v4). Used as `thid` for all event messages. |
| `title` | string | Display name for the event. |
| `type` | enum | `"meeting"`, `"call"`, `"deadline"`, `"reminder"`, `"task"`, `"payment"`. |
| `start` / `end` | ISO 8601 | Event times in UTC. |
| `timezone` | string | IANA timezone identifier for display (e.g., `"America/New_York"`). |
| `description` | string or `$ref` | Plain text or vault-backed `$ref` pointer. |
| `location` | string or `$ref` | Physical address, URL, or vault-backed `$ref` pointer. |
| `participants` | array | List of `{ did, role, status }` objects. |
| `sequence` | integer | Monotonically increasing; incremented on every `update`. |
| `sensitivity` | enum | `"public"`, `"private"`, `"confidential"`. Controls availability visibility. |
| `recurrence` | object or null | RFC 5545 RRULE, exceptions, and exdates. |
| `reminders` | array | Reminder specs with offset and channel. |
| `call_config` | object or null | WebRTC pre-negotiation config. Present when `type: "call"`. |
| `allow_delegation` | boolean | Whether invitees may delegate their attendance. |
| `require_signed_rsvp` | boolean | Whether RSVPs must carry a JWS proof. |
| `vault_ref` | object or null | Reference to the event's encrypted data vault. |

### RecurrenceRule

Follows RFC 5545 RRULE syntax:

```json
{
  "rrule": "FREQ=WEEKLY;BYDAY=TH;UNTIL=20260701T000000Z",
  "exceptions": [],
  "exdates": ["2026-05-01T15:00:00Z"]
}
```

* `rrule`: String in iCalendar RRULE format (RFC 5545 Section 3.3.10). Supported subset: `FREQ`, `UNTIL`, `COUNT`, `INTERVAL`, `BYDAY`, `BYMONTHDAY`, `BYMONTH`, `WKST`.
* `exceptions`: Array of `recurrence-exception` records (modifications to specific instances).
* `exdates`: Array of ISO 8601 timestamps for cancelled occurrences.

Implementations MUST cap generated instances at **365** to prevent DoS.

### ReminderSpec

```json
{
  "offset_minutes": -15,
  "channel": "didcomm",
  "action": "join_call"
}
```

* `offset_minutes`: Negative = before event start; positive = after event start.
* `channel`: `"didcomm"` (a DIDComm `reminder` message). Extensible for future channels.
* `action` (optional): Suggested action: `"join_call"`, `"review_agenda"`, `"submit_payment"`, `"acknowledge"`.

### DelegationToken

```json
{
  "event_id": "evt-7f1b8c5e",
  "delegator": "did:example:bob",
  "delegate": "did:example:dave",
  "scope": "full",
  "issued_at": "2026-04-05T10:00:00Z",
  "expires_at": "2026-04-10T16:00:00Z",
  "jws": "<JWS signed by did:example:bob>"
}
```

* `scope`: `"full"` (delegate replaces invitee entirely) or `"observe"` (delegate attends alongside invitee).
* `jws`: JWS over `{ event_id, delegator, delegate, scope, issued_at, expires_at }` signed by the delegator's DID key.

---

## States / State Machine

### Organizer View

| State | Event | Next State | Notes |
|-------|-------|------------|-------|
| `IDLE` | `propose` sent | `PROPOSING` | Optional negotiation phase |
| `PROPOSING` | `poll-vote` received / quorum met | `PROPOSED` | Time selected from options |
| `PROPOSING` | `invite` sent (direct, no poll) | `INVITED` | Skip poll, go straight to invite |
| `PROPOSED` | `invite` sent | `INVITED` | Formal invitation sent |
| `INVITED` | `accept`/`decline`/`tentative` received | `INVITED` | Collecting RSVPs |
| `INVITED` | `quorum.min_accept` reached | `CONFIRMED` | Minimum participants confirmed |
| `INVITED` | `quorum.deadline` passed, min not met | `FAILED` | Insufficient responses |
| `CONFIRMED` | `update` sent | `CONFIRMED` | Event details modified (sequence++) |
| `CONFIRMED` | event start time reached | `ACTIVE` | Event is happening now |
| `ACTIVE` | event end time reached | `COMPLETED` | Event concluded |
| `CONFIRMED` | `cancel` sent | `CANCELLED` | Event called off |
| any non-terminal | `cancel` sent | `CANCELLED` | Cancel from any active state |

### Invitee View

| State | Event | Next State | Notes |
|-------|-------|------------|-------|
| `IDLE` | `invite` received | `PENDING` | Awaiting user decision |
| `IDLE` | `propose` received | `POLLING` | Evaluating time options |
| `POLLING` | `poll-vote` sent | `VOTED` | Vote cast |
| `VOTED` | `invite` received | `PENDING` | Poll resolved, formal invite |
| `PENDING` | `accept` sent | `ACCEPTED` | User confirmed |
| `PENDING` | `decline` sent | `DECLINED` | User declined |
| `PENDING` | `tentative` sent | `TENTATIVE` | User tentatively confirmed |
| `TENTATIVE` | `accept` sent | `ACCEPTED` | Upgraded to confirmed |
| `TENTATIVE` | `decline` sent | `DECLINED` | Downgraded to declined |
| `ACCEPTED` | `delegate` sent | `DELEGATED` | Attendance delegated |
| `ACCEPTED` | `update` received (`require_re_rsvp`) | `PENDING` | Must re-confirm |
| any | `cancel` received | `CANCELLED` | Event cancelled by organizer |

---

## Message Reference

All messages use type URI `https://didcomm.org/calendar/1.0/<message-name>` with standard DIDComm v2 headers. All signaling uses **authcrypt**.

---

### propose

Type: `https://didcomm.org/calendar/1.0/propose`

**From**: `organizer` -> `invitee(s)` (or `invitee` -> `organizer` for counter-proposals)

Suggest an event with negotiable time options. Enables poll-based group scheduling.

```json
{
  "type": "https://didcomm.org/calendar/1.0/propose",
  "id": "prop-a1b2c3",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:carol"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "title": "Q4 Planning Session",
    "type": "call",
    "time_options": [
      {
        "option_id": "opt-1",
        "start": "2026-04-10T14:00:00Z",
        "end": "2026-04-10T15:00:00Z",
        "timezone": "America/New_York"
      },
      {
        "option_id": "opt-2",
        "start": "2026-04-11T10:00:00Z",
        "end": "2026-04-11T11:00:00Z",
        "timezone": "America/New_York"
      }
    ],
    "description": {
      "$ref": {
        "vault_id": "urn:edv:...:vault-cal-01",
        "doc_id": "z19evt-desc-001",
        "digest": "sha256-BASE64URL(...)"
      }
    },
    "location": {
      "$ref": {
        "vault_id": "urn:edv:...:vault-cal-01",
        "doc_id": "z19evt-loc-001",
        "digest": "sha256-BASE64URL(...)"
      }
    },
    "call_config": {
      "topology": "mesh",
      "media": ["audio", "video"],
      "policy": "relay-preferred"
    },
    "quorum": {
      "min_accept": 2,
      "deadline": "2026-04-08T23:59:59Z"
    },
    "reminders": [
      { "offset_minutes": -15, "channel": "didcomm" },
      { "offset_minutes": -1440, "channel": "didcomm" }
    ],
    "recurrence": null,
    "sensitivity": "confidential",
    "tags": ["planning", "q4"]
  }
}
```

**Field notes:**

* `time_options`: Array of proposed time slots. Each has a unique `option_id` for poll voting.
* `call_config`: Present when `type: "call"`. Carries WebRTC pre-negotiation parameters matching the WebRTC 1.0 `propose` body shape.
* `quorum.min_accept`: Minimum accept responses needed to confirm the event.
* `quorum.deadline`: ISO 8601 deadline for poll voting / RSVP collection.
* `description`, `location`: MAY be vault `$ref` pointers for sensitive data.

---

### invite

Type: `https://didcomm.org/calendar/1.0/invite`

**From**: `organizer` -> `invitee(s)`

Formal invitation to a confirmed event (time and details finalized).

```json
{
  "type": "https://didcomm.org/calendar/1.0/invite",
  "id": "inv-d4e5f6",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:carol"],
  "created_time": 1775318400,
  "body": {
    "event_id": "evt-7f1b8c5e",
    "title": "Q4 Planning Session",
    "type": "call",
    "start": "2026-04-10T15:00:00Z",
    "end": "2026-04-10T16:00:00Z",
    "timezone": "America/New_York",
    "description": {
      "$ref": {
        "vault_id": "urn:edv:...:vault-cal-01",
        "doc_id": "z19evt-desc-001",
        "digest": "sha256-BASE64URL(...)"
      }
    },
    "location": {
      "$ref": {
        "vault_id": "urn:edv:...:vault-cal-01",
        "doc_id": "z19evt-loc-001",
        "digest": "sha256-BASE64URL(...)"
      }
    },
    "call_config": {
      "topology": "mesh",
      "media": ["audio", "video"],
      "policy": "relay-preferred",
      "ice_servers": [
        { "urls": ["stun:stun.verid.id:3478"] },
        { "urls": ["turns:turn.verid.id:5349"], "username": "u", "credential": "p" }
      ]
    },
    "participants": [
      { "did": "did:example:alice", "role": "organizer", "status": "accepted" },
      { "did": "did:example:bob", "role": "invitee", "status": "pending" },
      { "did": "did:example:carol", "role": "invitee", "status": "pending" }
    ],
    "reminders": [
      { "offset_minutes": -15, "channel": "didcomm" },
      { "offset_minutes": -1440, "channel": "didcomm" }
    ],
    "recurrence": null,
    "sequence": 0,
    "sensitivity": "confidential",
    "allow_delegation": true,
    "require_signed_rsvp": false,
    "vault_ref": {
      "vault_id": "urn:edv:...:vault-cal-01",
      "base_url": "https://edv.example.com/edvs/vault-cal-01"
    },
    "attachments": [],
    "pthid": null
  }
}
```

**Field notes:**

* `sequence`: Monotonically increasing integer starting at 0. Incremented on every `update`. Invitees MUST reject messages with `sequence` less than their last-seen value.
* `allow_delegation`: Whether invitees may delegate their spot.
* `require_signed_rsvp`: If `true`, `accept`/`decline`/`tentative` MUST carry a `signed_rsvp` JWS proof (composed with Signing 1.0).
* `pthid`: If this event was spawned by another protocol (e.g., Workflow), the parent thread ID.
* `call_config.ice_servers`: TURN/STUN credentials for WebRTC. These SHOULD have short TTLs and be refreshed at event time via `reminder`.

---

### accept

Type: `https://didcomm.org/calendar/1.0/accept`

**From**: `invitee` -> `organizer`

```json
{
  "type": "https://didcomm.org/calendar/1.0/accept",
  "id": "acc-g7h8i9",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:bob",
  "to": ["did:example:alice"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "sequence": 0,
    "comment": "Confirmed, see you there.",
    "signed_rsvp": null
  }
}
```

* `signed_rsvp` (optional): When `require_signed_rsvp` is `true`, a JWS over `{ event_id, sequence, response: "accept", from_did, timestamp }` signed with the invitee's DID key. Composes with Signing 1.0.

---

### decline

Type: `https://didcomm.org/calendar/1.0/decline`

**From**: `invitee` -> `organizer`

```json
{
  "type": "https://didcomm.org/calendar/1.0/decline",
  "id": "dec-j1k2l3",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:carol",
  "to": ["did:example:alice"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "sequence": 0,
    "reason": "scheduling-conflict",
    "counter_propose": {
      "start": "2026-04-11T10:00:00Z",
      "end": "2026-04-11T11:00:00Z",
      "timezone": "America/New_York"
    }
  }
}
```

* `reason` (optional): One of `"scheduling-conflict"`, `"unavailable"`, `"not-interested"`, or free text.
* `counter_propose` (optional): Suggests an alternative time inline with the decline.

---

### tentative

Type: `https://didcomm.org/calendar/1.0/tentative`

**From**: `invitee` -> `organizer`

```json
{
  "type": "https://didcomm.org/calendar/1.0/tentative",
  "id": "tent-m4n5o6",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:bob",
  "to": ["did:example:alice"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "sequence": 0,
    "confirm_by": "2026-04-09T17:00:00Z",
    "comment": "Likely but need to confirm."
  }
}
```

* `confirm_by` (optional): The invitee's self-imposed deadline to upgrade to `accept` or downgrade to `decline`.

---

### update

Type: `https://didcomm.org/calendar/1.0/update`

**From**: `organizer` -> all participants

Modify a confirmed event. The `sequence` field MUST be incremented.

```json
{
  "type": "https://didcomm.org/calendar/1.0/update",
  "id": "upd-p7q8r9",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:carol"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "sequence": 1,
    "changes": {
      "start": "2026-04-10T15:00:00Z",
      "end": "2026-04-10T16:00:00Z",
      "title": "Q4 Planning Session (Rescheduled)"
    },
    "reason": "rescheduled-by-organizer",
    "require_re_rsvp": true
  }
}
```

* `changes`: Partial object containing only modified fields. Valid fields: `title`, `start`, `end`, `timezone`, `description`, `location`, `call_config`, `reminders`, `participants`, `sensitivity`.
* `require_re_rsvp`: If `true`, all participants must re-confirm after this update. Their status resets to `"pending"`.

---

### cancel

Type: `https://didcomm.org/calendar/1.0/cancel`

**From**: `organizer` -> all participants

```json
{
  "type": "https://didcomm.org/calendar/1.0/cancel",
  "id": "can-s1t2u3",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:carol"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "sequence": 2,
    "reason": "organizer-cancelled",
    "cancel_scope": "this",
    "recurrence_id": null
  }
}
```

* `cancel_scope`: For recurring events: `"this"` (single instance), `"this_and_future"` (this and all subsequent), `"all"` (entire series). For non-recurring events, always `"this"`.
* `recurrence_id`: The `DTSTART` of the specific occurrence being cancelled (for recurring events).

---

### query-availability

Type: `https://didcomm.org/calendar/1.0/query-availability`

**From**: `scheduler`/`organizer` -> `invitee`

Request free/busy information without revealing event details.

```json
{
  "type": "https://didcomm.org/calendar/1.0/query-availability",
  "id": "qa-v4w5x6",
  "from": "did:example:alice",
  "to": ["did:example:bob"],
  "body": {
    "range": {
      "start": "2026-04-07T00:00:00Z",
      "end": "2026-04-12T00:00:00Z"
    },
    "timezone": "America/New_York",
    "granularity_minutes": 30,
    "purpose": "Schedule team sync"
  }
}
```

* `granularity_minutes`: Desired time-slot resolution (15, 30, or 60 recommended).
* `purpose` (optional): Human-readable context for the request.

---

### availability

Type: `https://didcomm.org/calendar/1.0/availability`

**From**: `invitee` -> `scheduler`/`organizer`

```json
{
  "type": "https://didcomm.org/calendar/1.0/availability",
  "id": "avail-y7z8a9",
  "thid": "qa-v4w5x6",
  "from": "did:example:bob",
  "to": ["did:example:alice"],
  "body": {
    "timezone": "America/New_York",
    "slots": [
      { "start": "2026-04-07T09:00:00Z", "end": "2026-04-07T12:00:00Z", "status": "free" },
      { "start": "2026-04-07T12:00:00Z", "end": "2026-04-07T13:00:00Z", "status": "busy" },
      { "start": "2026-04-07T13:00:00Z", "end": "2026-04-07T17:00:00Z", "status": "free" },
      { "start": "2026-04-08T09:00:00Z", "end": "2026-04-08T17:00:00Z", "status": "free" }
    ],
    "expires": "2026-04-06T23:59:59Z",
    "privacy_level": "free_busy_only"
  }
}
```

* `status`: One of `"free"`, `"busy"`, `"tentative"`, `"out_of_office"`.
* `privacy_level`: `"free_busy_only"` (no event details — **default**), `"titles_visible"` (show titles), `"full_details"` (share everything).
* `expires`: Availability is time-sensitive; after this time, the requester should re-query.

---

### delegate

Type: `https://didcomm.org/calendar/1.0/delegate`

**From**: `invitee` -> `organizer` + `delegate`

```json
{
  "type": "https://didcomm.org/calendar/1.0/delegate",
  "id": "del-b1c2d3",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:bob",
  "to": ["did:example:alice", "did:example:dave"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "delegator": "did:example:bob",
    "delegate_to": "did:example:dave",
    "scope": "full",
    "reason": "Out of office",
    "delegation_token": {
      "event_id": "evt-7f1b8c5e",
      "delegator": "did:example:bob",
      "delegate": "did:example:dave",
      "scope": "full",
      "issued_at": "2026-04-05T10:00:00Z",
      "expires_at": "2026-04-10T16:00:00Z",
      "jws": "<JWS signed by did:example:bob>"
    }
  }
}
```

* `scope`: `"full"` (the delegate takes the invitee's place entirely) or `"observe"` (delegate may attend but original invitee also remains).
* `delegation_token.jws`: JWS over `{ event_id, delegator, delegate, scope, issued_at, expires_at }` signed by the delegator's DID key. Verifiable by the organizer against the delegator's DID document.

---

### delegate-accept

Type: `https://didcomm.org/calendar/1.0/delegate-accept`

**From**: `organizer` -> `delegator` + `delegate`

```json
{
  "type": "https://didcomm.org/calendar/1.0/delegate-accept",
  "id": "da-e4f5g6",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:dave"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "delegator": "did:example:bob",
    "delegate": "did:example:dave",
    "status": "approved"
  }
}
```

After approval, the delegate receives all subsequent `update`, `reminder`, and `cancel` messages for this event.

---

### delegate-decline

Type: `https://didcomm.org/calendar/1.0/delegate-decline`

**From**: `organizer` -> `delegator` + `delegate`

```json
{
  "type": "https://didcomm.org/calendar/1.0/delegate-decline",
  "id": "dd-h7i8j9",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:dave"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "delegator": "did:example:bob",
    "delegate": "did:example:dave",
    "reason": "delegate-not-authorized"
  }
}
```

---

### reminder

Type: `https://didcomm.org/calendar/1.0/reminder`

**From**: `scheduler`/`organizer` -> participant(s)

Automated reminder sent at configured offsets before event start.

```json
{
  "type": "https://didcomm.org/calendar/1.0/reminder",
  "id": "rem-k1l2m3",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:carol"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "title": "Q4 Planning Session",
    "start": "2026-04-10T15:00:00Z",
    "timezone": "America/New_York",
    "offset_minutes": -15,
    "action": "join_call",
    "call_trigger": {
      "type": "https://didcomm.org/webrtc/1.0/propose",
      "preconfig": {
        "topology": "mesh",
        "media": ["audio", "video"],
        "ice_servers": [
          { "urls": ["stun:stun.verid.id:3478"] },
          { "urls": ["turns:turn.verid.id:5349"], "username": "fresh-u", "credential": "fresh-p" }
        ]
      }
    }
  }
}
```

* `action`: Suggested action: `"join_call"`, `"review_agenda"`, `"submit_payment"`, `"acknowledge"`.
* `call_trigger` (optional): When `type: "call"` and `action: "join_call"`, contains WebRTC pre-negotiation config with **fresh** ICE credentials (replacing any stale ones from the original invite). The recipient agent SHOULD auto-initiate a WebRTC `propose` at event start time.

---

### recurrence-exception

Type: `https://didcomm.org/calendar/1.0/recurrence-exception`

**From**: `organizer` -> all participants

Modify or cancel a single instance of a recurring event.

```json
{
  "type": "https://didcomm.org/calendar/1.0/recurrence-exception",
  "id": "rexc-n4o5p6",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:carol"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "recurrence_id": "2026-04-17T15:00:00Z",
    "action": "modify",
    "changes": {
      "start": "2026-04-17T16:00:00Z",
      "end": "2026-04-17T17:00:00Z"
    },
    "sequence": 3,
    "reason": "Moved by one hour this week."
  }
}
```

* `recurrence_id`: The `DTSTART` of the specific occurrence being modified, following iCalendar RECURRENCE-ID conventions.
* `action`: `"modify"` or `"cancel"`.
* `changes`: Partial object (only for `"modify"` action).

---

### poll-vote

Type: `https://didcomm.org/calendar/1.0/poll-vote`

**From**: `invitee` -> `organizer`

Cast preference votes on proposed time options from a `propose` message.

```json
{
  "type": "https://didcomm.org/calendar/1.0/poll-vote",
  "id": "vote-q7r8s9",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:bob",
  "to": ["did:example:alice"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "votes": [
      { "option_id": "opt-1", "preference": "yes" },
      { "option_id": "opt-2", "preference": "if_needed" }
    ]
  }
}
```

* `preference`: `"yes"`, `"if_needed"`, `"no"`.
* `votes` MUST reference `option_id` values present in the corresponding `propose.time_options`.

---

### poll-result

Type: `https://didcomm.org/calendar/1.0/poll-result`

**From**: `organizer` -> all invitees

Announce the selected time after poll closes or quorum is reached.

```json
{
  "type": "https://didcomm.org/calendar/1.0/poll-result",
  "id": "pr-t1u2v3",
  "thid": "evt-7f1b8c5e",
  "from": "did:example:alice",
  "to": ["did:example:bob", "did:example:carol"],
  "body": {
    "event_id": "evt-7f1b8c5e",
    "selected_option": "opt-1",
    "tallies": [
      { "option_id": "opt-1", "yes": 2, "if_needed": 0, "no": 0 },
      { "option_id": "opt-2", "yes": 1, "if_needed": 1, "no": 0 }
    ],
    "quorum_met": true,
    "proceed": true
  }
}
```

* `proceed`: If `true`, the organizer will follow up with a formal `invite` for the selected time. If `false`, the event is abandoned (transitions to `FAILED`).

---

## Flows

### Flow 1: Basic Two-Party Meeting

```
Alice (organizer)                     Bob (invitee)
       |                                     |
       |--- invite (type: "meeting") ------->|
       |                                     |
       |<---------- accept -----------------|
       |                                     |
  [T-15min]                                  |
       |--- reminder (action: "acknowledge")->|
       |                                     |
  [T: event starts]                          |
  [T+end: event concludes]                   |
       |         COMPLETED                   |
```

### Flow 2: Group Call with Poll-Based Scheduling

```
Alice (organizer)              Bob           Carol          Dave
       |                        |              |              |
       |--- propose ----------->|------------->|------------->|
       |   (time_options,       |              |              |
       |    type: "call",       |              |              |
       |    quorum: min=2)      |              |              |
       |                        |              |              |
       |<-- poll-vote ---------|              |              |
       |   (opt-1: yes)        |              |              |
       |<-- poll-vote -------------------------|              |
       |   (opt-1: yes)                       |              |
       |<-- poll-vote -----------------------------------------|
       |   (opt-1: if_needed)                                |
       |                                                      |
       |--- poll-result ------->|------------->|------------->|
       |   (selected: opt-1)   |              |              |
       |                        |              |              |
       |--- invite ------------>|------------->|------------->|
       |   (confirmed time,    |              |              |
       |    call_config)       |              |              |
       |                        |              |              |
       |<-- accept ------------|              |              |
       |<-- accept -----------------------------|              |
       |   [quorum met: 2]                    |              |
       |<-- tentative ----------------------------------------|
       |                                                      |
  [T-15min]                                                   |
       |--- reminder ---------->|------------->|------------->|
       |   (action: join_call,  |              |              |
       |    call_trigger: webrtc preconfig)    |              |
       |                                                      |
  [T: event starts]                                           |
       |--- WebRTC propose ---->|------------->|------------->|
       |   (pthid: evt-7f1b8c5e)              |              |
       |   [normal WebRTC offer/answer/ice flow]              |
       |                                                      |
  [T+end]                                                     |
       |--- WebRTC end -------->|------------->|------------->|
       |         COMPLETED                                    |
```

### Flow 3: Recurring Event with Exception

```
Alice (organizer)                     Bob (invitee)
       |                                     |
       |--- invite ------------------------------>|
       |   (recurrence: FREQ=WEEKLY;COUNT=12)|
       |                                     |
       |<---------- accept ------------------|
       |                                     |
  [Week 1-2: reminders fire, events occur]   |
       |                                     |
  [Week 3: reschedule]                       |
       |--- recurrence-exception ----------->|
       |   (recurrence_id: 2026-04-24,       |
       |    action: "modify",                |
       |    changes: start +1h)              |
       |                                     |
  [Week 5: cancel one instance]              |
       |--- recurrence-exception ----------->|
       |   (recurrence_id: 2026-05-08,       |
       |    action: "cancel")                |
       |                                     |
  [Remaining weeks proceed normally]         |
```

### Flow 4: Delegation

```
Alice (organizer)       Bob (invitee)         Dave (delegate)
       |                     |                      |
       |--- invite --------->|                      |
       |<---- accept --------|                      |
       |                     |                      |
       |   [Bob needs to delegate]                  |
       |<---- delegate ------|--------------------->|
       |   (delegation_token |  with JWS)           |
       |                     |                      |
       |--- delegate-accept ->|--------------------->|
       |                     |                      |
       |   [Dave receives all future updates/reminders]
       |--- reminder -------------------------------->|
       |                     |                      |
```

### Flow 5: Payment Deadline Event

```
Payee (organizer)                     Payer (invitee)
       |                                     |
       |--- invite --------------------------->|
       |   (type: "deadline",                |
       |    payment_ref: {session_id,        |
       |     mandate_id, amount})            |
       |                                     |
       |<---------- accept ------------------|
       |                                     |
  [T-3 days]                                 |
       |--- reminder ----------------------->|
       |   (action: "submit_payment")        |
       |                                     |
       |   [Payer's agent initiates          |
       |    Payments 1.0 handshake-request   |
       |    with pthid = evt-xxxx]           |
       |                                     |
       |   [Normal Payments flow proceeds]   |
       |         COMPLETED                   |
```

### Flow 6: Workflow-Triggered Event

```
Workflow Processor              Alice (coordinator)        Bob (invitee)
       |                              |                         |
  [Workflow advance triggers          |                         |
   "schedule_review" action]          |                         |
       |                              |                         |
       |--- calendar/invite --------->|                         |
       |   (pthid = workflow-thid)    |                         |
       |                              |--- invite ------------->|
       |                              |<---- accept ------------|
       |                              |                         |
       |   [Event occurs and completes]                         |
       |                              |                         |
       |<-- workflow/advance ---------|                         |
       |   (event: "event_completed", |                         |
       |    thid = workflow-thid)     |                         |
```

---

## Composition with Other Protocols

### WebRTC 1.0 — Scheduled Calls

Events with `type: "call"` trigger WebRTC sessions:

1. **Pre-negotiation**: The `call_config` field in `invite` carries the same structure as WebRTC `propose.body`: `topology`, `media`, `policy`, `ice_servers`. This avoids a cold start at call time.

2. **Reminder-triggered initiation**: When a `reminder` fires with `action: "join_call"`, the organizer's agent sends a WebRTC `propose` to all accepted participants, with `pthid` set to the calendar event's `thid` (`event_id`). This binds the WebRTC session thread to the calendar event thread.

3. **SFU room pre-creation**: For events with many participants (>8), the organizer's agent MAY send a WebRTC `create-room` to the SFU mediator before event time, embedding the `room_id` in an `update` message's `call_config` field.

4. **OOB join links**: The organizer MAY generate a WebRTC `invite-url` and embed it in the calendar `invite` body as `call_config.oob_join_url` for one-click joining.

5. **ICE credential freshness**: TURN credentials in the original `invite` may expire before event time. The `reminder` message carries **fresh** credentials in `call_trigger.preconfig.ice_servers`, replacing stale ones.

### Workflow 1.0 — Event Triggers

1. **Workflow creates calendar events**: A workflow template can declare an action with `typeURI: "https://didcomm.org/calendar/1.0/invite"`. When the workflow reaches a state that fires this action, the Processor sends a calendar invite using data from the workflow context.

2. **Calendar completion advances workflow**: When a calendar event reaches `COMPLETED`, the organizer's agent MAY send a Workflow `advance` message to progress the parent workflow. The calendar event's `pthid` links to the workflow instance `thid`.

3. **Inbound DIDComm mappings** (for Workflow event triggers):
    * `calendar/1.0/accept` -> `event_accepted`
    * `calendar/1.0/decline` -> `event_declined`
    * `calendar/1.0/cancel` -> `event_cancelled`
    * Event COMPLETED -> `event_completed`

### Vaults 1.0 — Sensitive Event Data

1. **`$ref` pointers**: The `description`, `location`, `attachments`, and post-event `meeting_notes` fields MAY use the standard Vaults 1.0 `$ref` pattern.

2. **Vault provisioning**: For events with `sensitivity: "confidential"` or `"private"`, the organizer SHOULD provision a vault before sending `invite` and grant read access to accepted participants via Vaults `grant-access`.

3. **Vault lifecycle**: When an event is cancelled, the organizer MAY send Vaults `tombstone`. When an event completes and meeting notes are stored, the organizer MAY send Vaults `seal` to make the vault read-only.

### Payments 1.0 — Payment Deadlines

1. **Payment deadline events**: Events with `type: "deadline"` MAY carry a `payment_ref` field with `session_id`, `mandate_id`, `cycle_id`, and `amount_display`.

2. **Reminder-triggered payments**: When a reminder fires for a payment event, the scheduler agent MAY initiate a Payments `handshake-request` with `pthid` set to the calendar event `thid`.

3. **Recurring payments**: Calendar recurrence rules can drive Payments mandate cycle timing. The `cycle_id` in Payments maps to a specific occurrence of the recurring calendar event.

### Signing 1.0 — Signed Confirmations

1. **Signed RSVP**: When `require_signed_rsvp: true`, RSVP messages carry a `signed_rsvp` field containing a JWS over `{ event_id, sequence, response, from_did, timestamp }`.

2. **Delegation tokens**: The `delegation_token` in `delegate` messages is a JWS signed by the delegator, verifiable against their DID document.

3. **Event attestation**: Post-event, the organizer MAY use Signing 1.0 to create a signed attestation that the event occurred (participant list, duration). Useful for compliance/audit trails.

### Mesh 1.0 — Offline-First Sync

1. **Compact messages**: Calendar messages SHOULD be designed to fit within Mesh's compact envelope budget. For LoRa (~185 bytes compressed payload), a minimal `accept` or `reminder` message (~100-200 bytes JSON, compressing to ~50-70 bytes with Zstd) fits in a single LoRa frame.

2. **Offline sync**: When a participant is offline, calendar messages are queued via Message Pickup. Upon reconnection, the agent processes queued invites/updates in `sequence` order, resolving conflicts by highest sequence number.

3. **Compact availability encoding**: For mesh-constrained environments, the `availability` response MAY use a compact binary encoding: each 30-minute slot as a 2-bit value (`00`=free, `01`=busy, `10`=tentative, `11`=out_of_office). A full week at 30-minute granularity = 336 slots = 84 bytes.

---

## Security Considerations

1. **DIDComm authcrypt**: All calendar messages MUST use DIDComm v2 authcrypt. Signed RSVP events require additional JWS proofs per the Signing 1.0 composition.

2. **Sequence enforcement**: Recipients MUST reject messages with a `sequence` value lower than their last-seen value for that event. This prevents replay of stale updates.

3. **Availability privacy**: The `query-availability` / `availability` exchange MUST NOT leak event titles, descriptions, locations, or participant lists. Only slot status is shared by default. Agents SHOULD use pairwise DIDs for availability queries to prevent correlation across organizers.

4. **Vault-backed sensitive fields**: Fields `description`, `location`, `attachments`, and `meeting_notes` SHOULD use `$ref` vault pointers when `sensitivity` is `"confidential"` or `"private"`. Literal values MUST NOT travel over the wire for confidential events.

5. **Delegation verification**: Organizers MUST verify the JWS in `delegation_token` before accepting a delegate. The token MUST bind `event_id`, `delegator`, `delegate`, and `expires_at`. Expired tokens MUST be rejected.

6. **Recurrence DoS protection**: Implementations MUST cap the number of instances generated from an RRULE (recommended: 365 maximum). RRULE values that generate unbounded instance counts SHOULD be rejected.

7. **Reminder timing attacks**: Reminder dispatch times reveal event timing. Agents SHOULD implement jitter (up to 60 seconds) on reminder delivery to prevent precise timing inference by mediators.

8. **Group scheduling quorum integrity**: The organizer computes the final poll result. Invitees SHOULD verify that the `poll-result` tallies match their own votes. If discrepancies are found, a `problem-report` with code `tally_mismatch` SHOULD be sent.

9. **ICE credential security**: `call_config` contains TURN credentials. These SHOULD have short TTLs (< 24 hours) and be rotated at event time. TURN credentials embedded in `invite` messages sent days before the event MUST be replaced with fresh credentials in the `reminder` message.

---

## Privacy Considerations

1. **Pairwise DIDs**: Use pairwise DIDs per organizer-invitee pair to prevent cross-event correlation.

2. **Free/busy only**: Default `privacy_level` for availability responses MUST be `"free_busy_only"`. Agents MUST NOT upgrade privacy level without explicit user consent.

3. **Title redaction**: When `sensitivity: "confidential"`, event titles in any logging or intermediary-visible context SHOULD be replaced with a generic placeholder (e.g., "Busy").

4. **Vault field indexing**: When calendar event data is stored in vaults, avoid indexing field names that could leak event purpose. Use opaque `doc_id` values.

5. **Participant list protection**: The full participant list SHOULD only be visible to the organizer and to each participant individually. Implementations SHOULD NOT broadcast the complete list unless all participants consent.

---

## Validation Rules (Normative)

1. Timestamps MUST be ISO 8601 UTC. `timezone` fields MUST use IANA timezone identifiers (e.g., `"America/New_York"`, `"Asia/Kolkata"`).

2. `event_id` MUST be globally unique (UUID v4 recommended with `evt-` prefix).

3. `sequence` MUST be a non-negative integer, starting at 0, incremented on every `update` or `recurrence-exception`.

4. RRULE strings MUST conform to RFC 5545 Section 3.3.10. Implementations MUST cap generated instances at 365.

5. `$ref` pointers MUST contain `vault_id`, `doc_id`, and `digest`. Implementations MUST verify digest after EDV decryption.

6. `delegation_token.jws` MUST be verifiable against the delegator's DID document verification methods.

7. `quorum.min_accept` MUST be >= 1 and <= participant count.

8. `poll-vote.votes` MUST reference `option_id` values present in the corresponding `propose.time_options`.

9. All `thid` values in event lifecycle messages MUST equal the `event_id` for thread continuity.

10. Agents MUST respect `expires_time` on all messages; expired messages MUST be silently discarded.

---

## Error Codes (Problem Reports)

All errors use the standard DIDComm `problem-report` format with type `https://didcomm.org/calendar/1.0/problem-report`.

| Code | Description |
|------|-------------|
| `event_not_found` | Referenced `event_id` does not exist |
| `sequence_stale` | Message `sequence` is lower than current |
| `quorum_not_met` | Insufficient accepts by deadline |
| `delegation_not_allowed` | Event does not permit delegation (`allow_delegation: false`) |
| `delegation_expired` | Delegation token has expired |
| `delegation_invalid` | Delegation token JWS verification failed |
| `rrule_invalid` | Recurrence rule is malformed or exceeds instance limit |
| `time_conflict` | Proposed time conflicts with existing commitments |
| `availability_unavailable` | Cannot provide free/busy data |
| `vault_unavailable` | Calendar vault is unreachable |
| `vault_ref_invalid` | A `$ref` pointer is malformed or digest mismatch |
| `signed_rsvp_required` | RSVP was missing required JWS signature |
| `signed_rsvp_invalid` | RSVP JWS verification failed |
| `tally_mismatch` | Poll result tallies do not match local vote records |
| `call_config_expired` | ICE/TURN credentials in `call_config` have expired |
| `participant_limit_exceeded` | Event exceeds maximum participant count |

---

## Implementation Hints

### Reminder Scheduling

```javascript
function scheduleReminders(event) {
  for (const rem of event.reminders) {
    const fireAt = new Date(
      new Date(event.start).getTime() + rem.offset_minutes * 60000
    );
    scheduleJob(fireAt, async () => {
      const body = buildReminderMessage(event, rem);
      if (event.type === "call" && rem.action === "join_call") {
        body.call_trigger = {
          type: "https://didcomm.org/webrtc/1.0/propose",
          preconfig: await refreshCallConfig(event.call_config)
        };
      }
      const accepted = event.participants.filter(p => p.status === "accepted");
      await sendDIDComm(body, accepted);
    });
  }
}
```

### RRULE Expansion

```javascript
function expandRecurrence(event, windowStart, windowEnd) {
  const rule = rrulestr(event.recurrence.rrule, { dtstart: new Date(event.start) });
  const instances = rule.between(windowStart, windowEnd);

  if (instances.length > 365) {
    throw new CalendarError("rrule_invalid", "Exceeds 365-instance cap");
  }

  return instances
    .filter(dt => !event.recurrence.exdates.includes(dt.toISOString()))
    .map(dt => {
      const exc = event.recurrence.exceptions
        .find(e => e.recurrence_id === dt.toISOString());
      if (exc?.action === "cancel") return null;
      if (exc?.action === "modify") return applyChanges(event, dt, exc.changes);
      return { ...event, start: dt.toISOString() };
    })
    .filter(Boolean);
}
```

### Sequence Validation

```javascript
function validateSequence(incomingMsg, storedEvent) {
  if (incomingMsg.body.sequence < storedEvent.sequence) {
    throw new CalendarError(
      "sequence_stale",
      `Expected sequence >= ${storedEvent.sequence}, got ${incomingMsg.body.sequence}`
    );
  }
}
```

---

## References

* [RFC 5545 — Internet Calendaring and Scheduling (iCalendar)](https://datatracker.ietf.org/doc/html/rfc5545)
* [RFC 7953 — Calendar Availability (VAVAILABILITY)](https://datatracker.ietf.org/doc/html/rfc7953)
* [IANA Time Zone Database](https://www.iana.org/time-zones)
* [DIDComm Messaging v2.0](https://identity.foundation/didcomm-messaging/spec/v2.0/)
* [Discover Features Protocol 2.0](https://didcomm.org/discover-features/2.0/)
* [WebRTC 1.0 Protocol](https://didcomm.org/webrtc/1.0/)
* [Vaults 1.0 Protocol](https://didcomm.org/vaults/1.0/)
* [Workflow 1.0 Protocol](https://didcomm.org/workflow/1.0/)
* [Payments 1.0 Protocol](https://didcomm.org/payments/1.0/)
* [Signing 1.0 Protocol](https://didcomm.org/signing/1.0/)
* [Mesh 1.0 Protocol](https://didcomm.org/mesh/1.0/)
* [Report Problem 2.0](https://didcomm.org/report-problem/2.0/)
