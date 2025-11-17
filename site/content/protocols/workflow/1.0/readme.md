---
title: Workflow
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/workflow/1.0
status: Demonstrated
summary: A protocol for orchestrating stateful, multi-step interactions between agents using declarative workflow templates.
tags: [workflow, orchestration, state-machine]
authors:
  - name: Dave McKay
    email: dave@verid.id
  - name: Vinay Singh
    email: vinay@verid.id
  

---

## Summary
A DIDComm v2 protocol for orchestrating stateful, multi-step interactions between agents. The Workflow protocol enables:
- Publishing declarative workflow templates (versioned state machines)
- Starting and advancing workflow instances across connections
- Rendering dynamic UI based on state and participant roles
- Discovering and fetching templates on-demand
- Composing with other DIDComm protocols (Issue-Credential, Present-Proof, Payments, etc.)

## Motivation
Agents need a way to coordinate complex, multi-step interactions without hard-coding state machines or protocol logic into every agent. The Workflow protocol provides a declarative, portable format for defining:
- State machines with guards, transitions, and actions
- UI hints for rendering forms, menus, and status views
- Issuance and verification profiles that reference other DIDComm protocols
- Context management and artifact storage across steps

This enables reusable "workflow templates" that can be published once and executed by any conforming agent, supporting use cases like credential issuance flows, onboarding journeys, approval processes, and interactive service orchestration.

## Version Change Log

### 1.0
- Initial draft with template publishing, instance management, and discovery.
- Built-in Workflow UI 1.0 for standardized component rendering.

## Roles
- `Processor`: The agent that stores templates and instances, evaluates guards, executes actions (sends/receives DIDComm messages), and maintains state.
- `Coordinator`: The agent that orchestrates flows (publishes templates, starts/advances workflows, renders UI).
- `Observer` (optional): Subscribes to status/audit events (out of scope for wire protocol in this version).

## Requirements (normative)
- All messages SHOULD be encrypted (authcrypt) using standard DIDComm v2 encryption.
- Templates MUST be validated against the schema before storage.
- Processors MUST enforce instance multiplicity policies (singleton or multi per connection).
- Processors MUST implement idempotency for `advance` operations using `idempotency_key`.
- Processors MUST bind instances to connections based on the inbound DIDComm connection that delivered `start` (ignoring any `connection_id` in the message body).
- When a workflow enters a `final` state, the Processor MUST send a `complete` message.

## Discoverability
Agents SHOULD advertise support via Discover-Features v2:
- Protocol: `https://didcomm.org/workflow/1.0`
- Capabilities: `discover`, `fetch-template`, `ui:1.0`
- Optional: Supported protocol actions (e.g., `issue-credential:2.0`, `present-proof:2.0`, `payments:1.0`)

## Object Model

### Template (authoritative FSM and catalog)
A workflow template is a versioned, declarative state machine. Key components:
- `id`: Unique template identifier
- `version`: Semver version string
- `states`: Map of state names to state definitions (with `final` flag, `section` grouping)
- `transitions`: Map of event names to transition definitions (guard expressions, target states)
- `actions`: Map of action keys to action definitions (message types, profiles, inputs)
- `catalog`: Map of `profile_ref` IDs to issuance/verification profile definitions
- `display_hints`: UI rendering hints (component trees, filtering rules per role/state)

Templates include `display_hints` to define the UI returned in `status` responses. The UI is standardized by "Workflow UI 1.0" (built-in and required). If `display_hints.ui_version` is omitted, it defaults to "1.0".

### Instance (Processor storage)
A workflow instance is scoped to a DIDComm thread (`thid`). The Processor MUST persist:
```json
{
  "instance_id": "string",
  "template_id": "string",
  "template_version": "semver",
  "connection_id": "string-optional",
  "participants": { "holder": { "did": "did:..." } },
  "state": "stateName",
  "section": "string-optional",
  "context": {},
  "artifacts": {},
  "status": "active|paused|canceled|completed|error",
  "history": [
    {
      "ts": "iso",
      "event": "string",
      "from": "state",
      "to": "state",
      "actionKey": "string-optional",
      "msg_id": "string-optional"
    }
  ],
  "multiplicityKeyValue": "string-optional"
}
```

**Connection binding**:
- `connection_id` is a Processor-local identifier bound at Start from the inbound DIDComm connection that delivered the Start message.
- Coordinators SHOULD NOT send a `connection_id` over the wire; if present, Processors MUST ignore it. The value differs on each agent and is not used for interop.
- **Participants derivation**: When a Start is accepted, the Processor SHOULD populate `participants.issuer.did` from the local connection `myDid` and `participants.holder.did` from the local connection `theirDid` when these are not already provided. This ensures UI/profile derivation is consistent across tenants and does not require extra lookups later.

## Multiplicity Policy (per connection)
Templates declare an instance policy:
- `singleton_per_connection`: At most one active instance per connection
- `multi_per_connection`: Multiple instances allowed; optional `multiplicity_key` expression over `context` for deduplication

## Data Conventions (normative)

### Expressions & Guards
- Guards and multiplicity expressions MUST be deterministic and side-effect-free.
- Guards evaluate over `{ context, participants, artifacts }`.
- Attribute planning supports `context|static|compute` modes with required semantics.

### Action Resolution
- **Messaging actions**: `typeURI` is a DIDComm message type (e.g., `https://didcomm.org/issue-credential/2.0/offer-credential`), resolved via `profile_ref` into `catalog`. Messages are built solely from template + instance data.
- **Local actions**: Use the workflow namespace (e.g., `state:set@1`).

### Inbound DIDComm → Workflow Events (mapping)
Map inbound protocol messages to workflow events:
- `offer-credential` → `offer_received`
- `request-credential` → `request_received`
- `issue-credential` → `issued_ack`
- `presentation` → `presentation_received`
- (And similar mappings for other protocols)

## States
The workflow state machine is defined by the template. Common lifecycle:
```
idle → (start) → <initial_state>
<state> → (advance with event) → <next_state>
<state> → (advance with final event) → <final_state> → (complete) → terminal
```

Processors also track instance status: `active`, `paused`, `canceled`, `completed`, `error`.

## Basic Walkthrough

### 1) Publishing a Template
Coordinator → Processor: `publish-template` with full template definition
- Processor validates schema, computes template hash (SHA-256 over stable JSON), and stores/upserts.

### 2) Starting a Workflow
Coordinator → Processor: `start` with `template_id`, `template_version`, `participants`, `context`
- Processor enforces multiplicity policy.
- If template is unknown and `allow_discover=true`, Processor MAY fetch template via `discover`/`fetch-template`.
- Processor creates instance, binds to connection, and initializes state.

### 3) Advancing a Workflow
Coordinator → Processor: `advance` with `instance_id`, `event`, optional `input`
- Processor evaluates guard for the transition.
- If guard passes, executes optional action (e.g., sends DIDComm message) and updates state atomically.
- Idempotency via `idempotency_key`.

### 4) Querying Status
Coordinator → Processor: `status` with `instance_id`, `include_ui=true`, `ui_profile`
- Processor returns current state, allowed events, action menu, artifacts, and rendered UI (filtered by role/state).

### 5) Completion
- When instance enters a `final` state, Processor sends `complete` message.

### 6) Discovery (optional)
Coordinator → Processor: `discover` with optional filters
- Processor → Coordinator: `workflows` with list of available templates
Coordinator → Processor: `fetch-template` with `template_id`
- Processor → Coordinator: `template` with full template definition

## Security
- Use authcrypt for all messages.
- Minimize sensitive values in `context`; encrypt at rest.
- Implement idempotency checks to prevent replay attacks.
- Thread integrity: validate `thid` continuity.
- Capability checks via Discover-Features v2.
- Secure storage and protect against replay.

## Message Reference

All examples are DIDComm JSON bodies (outer envelope omitted for brevity).

### publish-template
Message Type URI: `https://didcomm.org/workflow/1.0/publish-template`

Body:
```json
{
  "template": {
    "id": "student-id-issuance",
    "version": "1.0.0",
    "name": "Student ID Issuance",
    "states": {
      "initial": { "final": false },
      "offered": { "final": false },
      "issued": { "final": true }
    },
    "transitions": {
      "offer": { "from": "initial", "to": "offered", "guard": null, "action": "send_offer" },
      "issue": { "from": "offered", "to": "issued", "guard": null, "action": "issue_credential" }
    },
    "actions": {
      "send_offer": { "typeURI": "https://didcomm.org/issue-credential/2.0/offer-credential", "profile_ref": "student_id_profile" },
      "issue_credential": { "typeURI": "https://didcomm.org/issue-credential/2.0/issue-credential", "profile_ref": "student_id_profile" }
    },
    "catalog": {
      "student_id_profile": {
        "credential_definition_id": "...",
        "schema_id": "...",
        "attributes": ["name", "studentId"]
      }
    },
    "display_hints": {}
  },
  "mode": "upsert"
}
```

Processor MUST:
- Validate schema
- Check `profile_ref` references
- Compute/store SHA-256 template hash over stable JSON (keys sorted)
- Upsert template

### start
Message Type URI: `https://didcomm.org/workflow/1.0/start`

Body:
```json
{
  "template_id": "student-id-issuance",
  "template_version": "1.0.0",
  "instance_id": "4b6f...",
  "participants": { "holder": { "did": "did:example:alice" } },
  "context": { "name": "Alice", "studentId": "A-123" },
  "allow_discover": true,
  "template_hash": "hex-optional"
}
```

Semantics:
- `connection_id` MUST NOT be sent; Processor binds the instance to the inbound DIDComm connection that delivered `start` and ignores any provided value.
- `allow_discover` (default true) permits the Processor to obtain the template on demand if not installed locally.
- `template_hash` is an optional integrity hint.
- **Participant defaults**: If `participants` is omitted or incomplete, the Processor SHOULD set `participants.issuer.did` to the inbound connection `myDid` and `participants.holder.did` to the inbound connection `theirDid`.
- Processor MUST enforce `instance_policy` (singleton/multi + dedupe) and create or return the instance.
- `thid` SHOULD equal `instance_id`.

### advance
Message Type URI: `https://didcomm.org/workflow/1.0/advance`

Body:
```json
{
  "instance_id": "4b6f...",
  "event": "offer",
  "idempotency_key": "btn-offer-01",
  "input": { "optional": "values from UI forms" }
}
```

Atomic semantics:
- Guard evaluation
- Optional action execution (messaging or local)
- State persistence with idempotency
- Send `complete` when entering a `final` state

### status
Message Type URI: `https://didcomm.org/workflow/1.0/status`

Request body:
```json
{
  "instance_id": "4b6f...",
  "include_actions": true,
  "include_ui": true,
  "ui_profile": "sender|receiver|custom-optional",
  "viewer": {
    "role": "optional",
    "connection_id": "optional",
    "did": "optional",
    "participantKey": "optional"
  },
  "capabilities": ["ui:video", "ui:table"]
}
```

Response includes:
- `state`, `section`, `status`
- `allowed_events` (list of event names that can be used in `advance`)
- `action_menu` (map of actions available to the viewer)
- `artifacts` (stored outputs from prior actions)
- `ui` (when `include_ui=true`): rendered UI components filtered by role/state
- `ui_profile` (echo of requested profile)
- `assets` (shared media referenced by UI items)

### problem-report
Message Type URI: `https://didcomm.org/workflow/1.0/problem-report`

Body:
```json
{
  "code": "template_not_found",
  "comment": "Template 'student-id-issuance' version '1.0.0' not found",
  "args": {}
}
```

### pause / resume / cancel / complete
Message Type URIs:
- `https://didcomm.org/workflow/1.0/pause`
- `https://didcomm.org/workflow/1.0/resume`
- `https://didcomm.org/workflow/1.0/cancel`
- `https://didcomm.org/workflow/1.0/complete`

Body (for pause/cancel):
```json
{
  "instance_id": "4b6f...",
  "reason": "user-request"
}
```

`complete` is sent by the Processor when the instance enters a `final` state.

### discover
Message Type URI: `https://didcomm.org/workflow/1.0/discover`

Body:
```json
{
  "filters": {
    "template_id": "string-optional",
    "version": "string-optional",
    "tag": "string-optional",
    "text": "string-optional"
  },
  "paging": { "offset": 0, "limit": 50 },
  "include_hash": true
}
```

Semantics: Requests a listing of templates visible/authorized to the requester (reply on same `thid`).

### workflows (response)
Message Type URI: `https://didcomm.org/workflow/1.0/workflows`

Body:
```json
{
  "workflows": [
    {
      "template_id": "student-id-issuance",
      "versions": ["1.0.0"],
      "title": "Student ID Issuance",
      "hash": "hex-optional"
    }
  ],
  "paging": { "total": 1, "next_offset": 0 }
}
```

Semantics: Returns available template IDs and versions. If a single version is returned and `include_hash=true`, include `hash`.

### fetch-template
Message Type URI: `https://didcomm.org/workflow/1.0/fetch-template`

Body:
```json
{
  "template_id": "student-id-issuance",
  "template_version": "1.0.0",
  "prefer_hash": "hex-optional"
}
```

Semantics: Requests the full template. If `template_version` is omitted, return latest; if `prefer_hash` mismatches, Coordinator MAY return `problem-report: not_found_remote_template`.

### template (response)
Message Type URI: `https://didcomm.org/workflow/1.0/template`

Body:
```json
{
  "template": {
    "id": "student-id-issuance",
    "version": "1.0.0",
    "name": "Student ID Issuance",
    "states": {},
    "transitions": {},
    "actions": {},
    "catalog": {},
    "display_hints": {}
  }
}
```

Semantics: Contains the authoritative template. Processor MUST validate and store/upsert before proceeding with the pending `start`.

## L10n
Localization applies to human-readable fields (e.g., UI labels, error messages). Protocol validation uses canonical, language-agnostic fields.

## Validation Rules (normative)
- Templates MUST be validated against schema before storage.
- Guards MUST be deterministic and side-effect-free.
- `connection_id` binding: Processor MUST bind instances to the inbound connection; ignore any `connection_id` in `start`.
- Idempotency: Duplicate `advance` with same `idempotency_key` MUST be no-ops.
- Thread integrity: Validate `thid` continuity across messages.
- Participant derivation: If not provided, SHOULD populate from connection's `myDid`/`theirDid`.

## Errors (Problem-Report codes)
Use standard DIDComm problem-report with these codes:
- `template_not_found` — Referenced template/version does not exist
- `template_invalid` — Template failed schema validation
- `instance_not_found` — Referenced instance does not exist
- `guard_failed` — Transition guard evaluated to false
- `action_failed` — Action execution failed
- `discovery_failed` — Remote did not respond in time or returned an error preventing discovery/fetch
- `not_authorized` — Requester is not permitted to view or fetch the template
- `not_found_remote_template` — Remote does not have the referenced template/version (or hash mismatch)
- `multiplicity_violation` — Start violated singleton policy

## Processor Conformance
A conforming Processor MUST:
1. Validate & store templates on `publish-template`.
2. Enforce multiplicity on `start`.
3. Process `advance` atomically and implement idempotency.
4. Resolve actions from template + instance only.
5. Map inbound DIDComm protocol messages to workflow events.
6. Provide `status` with `allowed_events`, `action_menu`, and optional `ui`.
7. Send `workflow/1.0/complete` on entering a `final` state.
8. Maintain audit via `history` and `artifacts`.
9. Secure storage and protect against replay.
10. Bind `connection_id` from the inbound DIDComm connection; ignore any `connection_id` in `start`.
11. MAY attempt `discover` + `fetch-template` when `start` references an unknown template and `allow_discover != false`; MUST validate/store then continue.
12. SHOULD use the same `thid` across `start` → `discover`/`workflows` → `fetch-template`/`template` → `status`.

## Coordinator Conformance (recommended)
A conforming Coordinator SHOULD:
- Use `publish-template`, `start`, `advance`, `status`.
- Render `display_hints` when present (non-normative).
- Fire `advance(event)` on button clicks with `idempotency_key`.
- Avoid sending credential/schema IDs in messages—use profile IDs.
- Implement `discover` and `fetch-template` with authorization controls; include `hash` in `workflows` when `include_hash=true`.

## Composition
The Workflow protocol composes with other DIDComm protocols by referencing their message types in action definitions. Supported protocols:
- Issue-Credential 2.0
- Present-Proof 2.0
- Payments 1.0
- (Any DIDComm protocol with defined message types)

New protocols (e.g., payments) require no change to Workflow 1.0: add an action whose `typeURI` equals the new DIDComm message type and a matching profile in `catalog`.

## Versioning & Capabilities
- Template `version` uses semver.
- Agents SHOULD advertise support for Issue-Credential 2.0 / Present-Proof 2.0 and for discovery messages (`discover`, `workflows`, `fetch-template`, `template`) using Discover-Features v2.
- Workflow UI 1.0 is built-in and does not require capability advertisement.

## Interop & Extensibility
- Local actions can be extended under vendor namespaces without impacting wire compatibility.
- Discovery/fetch is adopted here as part of this spec revision. Agents that do not implement discovery/fetch maintain compatibility with the base `publish-template` + `start` flows.

## Implementations
Name / Link | Implementation Notes
--- | ---

## Endnotes
### Future Considerations
- Multi-party workflows (more than two participants)
- Workflow composition (sub-workflows, reusable fragments)
- Advanced UI components (video, file upload, signature capture)
- Workflow monitoring and analytics
- Workflow versioning and migration strategies
