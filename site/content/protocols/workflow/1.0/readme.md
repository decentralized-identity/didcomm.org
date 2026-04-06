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
- Protecting sensitive context fields via vault-backed references (Vaults 1.0 composition)

## Motivation
Agents need a way to coordinate complex, multi-step interactions without hard-coding state machines or protocol logic into every agent. The Workflow protocol provides a declarative, portable format for defining:
- State machines with guards, transitions, and actions
- UI hints for rendering forms, menus, and status views
- Issuance and verification profiles that reference other DIDComm protocols
- Context management and artifact storage across steps
- Sensitivity classification and vault-backed storage for secrets/PII that must never traverse the wire in plaintext

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
- Templates that declare `sensitivity` MUST classify every referenced `context` field as `secret`, `pii`, or `plain` (default `plain`).
- Fields classified as `secret` or `pii` with `storage: "vault"` MUST NOT appear as literal values in `start`, `advance`, or `status` message bodies; they MUST be represented as `$ref` vault references.
- Coordinators MUST provision a vault (via Vaults 1.0 `propose`/`offer`/`grant-access`) and populate sensitive values into the EDV BEFORE sending `start`.
- Multiplicity-key expressions MUST NOT reference fields whose sensitivity level is `secret`.
- `$transient` fields MUST be wiped from instance storage after the advance cycle in which they were supplied.
- When a workflow instance reaches status `completed`, the Processor SHOULD send a Vaults 1.0 `seal` message to the bound vault. When an instance reaches status `canceled`, the Processor SHOULD send a Vaults 1.0 `tombstone` message.

## Discoverability
Agents SHOULD advertise support via Discover-Features v2:
- Protocol: `https://didcomm.org/workflow/1.0`
- Capabilities: `discover`, `fetch-template`, `ui:1.0`
- Optional: Supported protocol actions (e.g., `issue-credential:2.0`, `present-proof:2.0`, `payments:1.0`)
- Optional: `vault-context` — indicates the agent supports vault-backed sensitive field resolution in workflows

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

### Sensitivity (optional)

Templates MAY declare a `sensitivity` map to classify context fields by data-protection level and storage mode. When present, Processors and Coordinators MUST respect the classification rules defined in the Requirements section.

```json
{
  "sensitivity": {
    "default": { "level": "plain", "storage": "plain" },
    "fields": {
      "ssn":        { "level": "secret", "storage": "vault" },
      "full_name":  { "level": "pii",    "storage": "vault" },
      "studentId":  { "level": "plain",  "storage": "plain" }
    }
  }
}
```

**Field definitions:**
- `level`: One of `secret` (cryptographic material, government IDs, passwords), `pii` (personally identifiable information), or `plain` (non-sensitive). Default: `plain`.
- `storage`: One of `vault` (store in a Vaults 1.0 EDV and reference via `$ref`), `encrypted` (encrypt inline using JWE — reserved for future use), or `plain` (store as-is in context). Default: `plain`.

When `storage` is `vault`, the Coordinator MUST provision a vault before `start` and replace literal values in `context` with `$ref` pointers (see Instance model below). Fields with `storage: "vault"` SHOULD be grouped into EDV documents by role-access pattern (e.g., all fields readable by the `holder` role in one document) rather than one EDV document per field.

If the `sensitivity` map is absent, all fields default to `plain`/`plain` and no vault integration is required.

### Display Hints: Sensitivity Behavior (optional)

Templates MAY include sensitivity-aware rendering hints inside `display_hints`:

```json
{
  "display_hints": {
    "sensitivity_behavior": {
      "secret": { "render": "masked", "mask_format": "***-**-{last4}" },
      "pii":    { "render": "masked_toggle", "mask_format": "{first1}***" },
      "plain":  { "render": "visible" }
    }
  }
}
```

- `render`: One of `masked` (always masked), `masked_toggle` (masked with user-reveal option), `visible` (shown as-is).
- `mask_format`: Optional format string. `{last4}`, `{first1}` are built-in tokens; literal characters pass through.

Coordinators SHOULD respect `sensitivity_behavior` when rendering UI components that display context or artifact values.

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
  "context": {
    "studentId": "A-123",
    "ssn": { "$ref": { "vault_id": "urn:edv:...:vaultABC", "doc_id": "z19role-holder-secrets", "digest": "sha256-BASE64URL(...)" } },
    "full_name": { "$ref": { "vault_id": "urn:edv:...:vaultABC", "doc_id": "z19role-holder-pii", "digest": "sha256-BASE64URL(...)" } }
  },
  "artifacts": {},
  "vault_ref": {
    "vault_id": "urn:edv:...:vaultABC",
    "base_url": "https://edv.example.com/edvs/vaultABC",
    "lifecycle": "active"
  },
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

**Vault reference (`vault_ref`)**:
- `vault_ref` is set by the Processor when a `start` message includes a vault reference. It records the vault identity and lifecycle state (`active`, `sealed`, `retired`).
- `$ref` objects in `context` or `artifacts` are pointers to EDV documents. They follow a simplified form of the Vaults 1.0 `ContentRef`: `vault_id` + `doc_id` + `digest`. The `capability` (ZCAP) is not stored per-reference; instead the Processor uses the root capability from `vault_ref` or a role-scoped grant.
- When the Processor needs the actual value (e.g., for guard evaluation or action building), it MUST resolve the `$ref` by fetching the EDV document, decrypting the JWE, and verifying the digest. If resolution fails, the operation MUST fail with `vault_unavailable`.
- If no `vault_ref` is present, the instance operates in plain mode (backwards compatible — all context/artifact values are inline).

**Connection binding**:
- `connection_id` is a Processor-local identifier bound at Start from the inbound DIDComm connection that delivered the Start message.
- Coordinators SHOULD NOT send a `connection_id` over the wire; if present, Processors MUST ignore it. The value differs on each agent and is not used for interop.
- **Participants derivation**: When a Start is accepted, the Processor SHOULD populate `participants.issuer.did` from the local connection `myDid` and `participants.holder.did` from the local connection `theirDid` when these are not already provided. This ensures UI/profile derivation is consistent across tenants and does not require extra lookups later.

## Multiplicity Policy (per connection)
Templates declare an instance policy:
- `singleton_per_connection`: At most one active instance per connection
- `multi_per_connection`: Multiple instances allowed; optional `multiplicity_key` expression over `context` for deduplication

> **Restriction**: Multiplicity-key expressions MUST NOT reference fields whose template `sensitivity.level` is `secret`. This prevents sensitive data from appearing in deduplication indexes. Fields with `pii` level MAY be referenced only if the Processor stores multiplicity keys as HMAC digests (not plaintext).

## Data Conventions (normative)

### Expressions & Guards
- Guards and multiplicity expressions MUST be deterministic and side-effect-free.
- Guards evaluate over `{ context, participants, artifacts }`.
- Attribute planning supports `context|static|compute` modes with required semantics.
- When a guard expression references a vault-backed field (`$ref`), the Processor MUST resolve the reference before evaluation. If the vault is unreachable or the digest does not match, the guard evaluation MUST fail and the Processor MUST return `action_failed` (not `guard_failed`) to distinguish infrastructure failures from logical guard failures.

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

### 7) Vault-Aware Flow (when sensitivity is declared)
1. **Template declares sensitivity**: The template includes a `sensitivity` map classifying `ssn` as `secret/vault` and `full_name` as `pii/vault`.
2. **Coordinator provisions vault**: Before sending `start`, the Coordinator executes Vaults 1.0: `propose` → `offer` → `grant-access` (granting the Processor read+write). Sensitive values are encrypted and stored in the EDV, grouped by role-access (e.g., one document for holder-readable secrets, another for holder-readable PII).
3. **Coordinator sends `start`**: The `context` contains `$ref` pointers instead of literal values for vault-backed fields. A `vault_ref` object identifies the vault.
4. **Processor resolves on demand**: When an `advance` triggers a guard or action that needs a vault-backed value, the Processor fetches and decrypts from the EDV, verifies the digest, and uses the plaintext ephemerally (never persisted outside the vault).
5. **Transient fields**: If `advance` supplies `$transient: ["otp_code"]`, the Processor uses `otp_code` for the current cycle only and wipes it from instance storage after the advance completes.
6. **Completion**: When the workflow reaches a `final` state, the Processor sends Vaults 1.0 `seal` to freeze the vault. On `cancel`, the Processor sends `tombstone`.

## Security
- Use authcrypt for all messages.
- Minimize sensitive values in `context`; encrypt at rest.
- Implement idempotency checks to prevent replay attacks.
- Thread integrity: validate `thid` continuity.
- Capability checks via Discover-Features v2.
- Secure storage and protect against replay.
- **Vault-backed fields**: Sensitive values classified as `secret` or `pii` with `storage: "vault"` MUST NOT appear in DIDComm message bodies. Only `$ref` pointers travel over the wire.
- **Digest verification**: Processors MUST verify the `digest` in every `$ref` after decrypting the EDV document. A mismatch MUST be treated as tampering and reported via `problem-report` with code `vault_ref_invalid`.
- **Vault lifecycle**: Coordinators SHOULD provision ephemeral vaults (short TTL) for workflow-scoped sensitive data. On workflow completion, vaults SHOULD be sealed; on cancellation, tombstoned.
- **History scrubbing**: Processors MUST NOT record resolved plaintext values in the `history` array. History entries MAY reference `$ref` pointers but MUST NOT contain the resolved content.
- **Transient field safety**: `$transient` values MUST be held only in volatile memory during the advance cycle and MUST NOT be written to persistent storage, logs, or history.

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
  "context": {
    "name": "Alice",
    "studentId": "A-123",
    "ssn": { "$ref": { "vault_id": "urn:edv:...:vaultABC", "doc_id": "z19role-holder-secrets", "digest": "sha256-BASE64URL(...)" } }
  },
  "vault_ref": {
    "vault_id": "urn:edv:...:vaultABC",
    "base_url": "https://edv.example.com/edvs/vaultABC"
  },
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
- `vault_ref` (optional): When present, identifies the pre-provisioned Vaults 1.0 vault for this workflow instance. The Coordinator MUST have already completed the Vaults 1.0 `propose`/`offer`/`grant-access` flow and stored sensitive context values in the vault BEFORE sending `start`.
- `$ref` objects in `context`: Any value that is a JSON object with a single `$ref` key is treated as a vault reference pointer. The inner object MUST contain `vault_id`, `doc_id`, and `digest`. The Processor MUST NOT attempt to resolve `$ref` pointers at `start` time unless required by multiplicity-key evaluation.
- `multiplicity_hint` (optional, string): A pre-computed HMAC hint for multiplicity deduplication when the multiplicity key references `pii`-level fields. Avoids a vault round-trip at start time.

### advance
Message Type URI: `https://didcomm.org/workflow/1.0/advance`

Body:
```json
{
  "instance_id": "4b6f...",
  "event": "offer",
  "idempotency_key": "btn-offer-01",
  "input": { "optional": "values from UI forms", "otp_code": "123456" },
  "$transient": ["otp_code"]
}
```

Atomic semantics:
- Guard evaluation
- Optional action execution (messaging or local)
- State persistence with idempotency
- Send `complete` when entering a `final` state

**Transient fields (`$transient`)**:
- `$transient` is an optional array of field names from `input` that MUST NOT be persisted beyond the current advance cycle.
- The Processor MUST use transient fields only for guard evaluation and action execution within this single advance, then wipe them from all storage (instance, logs, history).
- Transient fields MUST NOT be vault-backed (they exist only for a single cycle and are never stored). If a transient field name collides with a vault-backed `context` field, the transient value takes precedence for the current cycle only and the vault reference is restored afterward.

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
  "capabilities": ["ui:video", "ui:table"],
  "resolve_vault_refs": false
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

**Vault reference resolution in `status` responses:**
- `resolve_vault_refs` (default `false`): When `true`, the Processor SHOULD resolve `$ref` pointers in `context` and `artifacts` before returning the response, replacing them with decrypted plaintext values. The Processor MUST verify digests and MUST redact fields whose sensitivity level exceeds the `viewer.role`'s access (e.g., a viewer with `holder` role sees PII but not `secret`-level fields intended for `issuer` only).
- When `resolve_vault_refs` is `false` (default), the response returns `$ref` pointers as-is and the Coordinator resolves them client-side using its own vault capability.
- If resolution is requested but the vault is unreachable, the Processor MUST return the `$ref` pointer unchanged and include a `~warning` header attachment with code `vault_unavailable`.

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
- Vault reference integrity: Every `$ref` in `context` or `artifacts` MUST contain `vault_id`, `doc_id`, and `digest`. If `vault_ref` is present on the instance, all `$ref.vault_id` values MUST match `vault_ref.vault_id`.
- Sensitivity consistency: If the template declares `sensitivity.fields.X.storage = "vault"`, then field `X` in `start.context` MUST be a `$ref` object (not a literal value). Processors MUST reject a `start` message that passes literal values for vault-required fields.
- Transient exclusion: Fields listed in `$transient` MUST NOT appear in `sensitivity.fields` with `storage: "vault"`.

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
- `vault_unavailable` — Vault EDV is unreachable or returned an error during `$ref` resolution
- `vault_ref_invalid` — A `$ref` pointer is malformed, references a non-existent document, or the digest does not match the decrypted content
- `sensitivity_violation` — A `start` or `advance` message passed a literal value for a field that the template requires to be vault-backed

## Processor Conformance
A conforming Processor MUST:
1. Validate & store templates on `publish-template`.
2. Enforce multiplicity on `start`.
3. Process `advance` atomically and implement idempotency.
4. Resolve actions from template + instance + vault references. When an action or guard requires a vault-backed field, the Processor MUST resolve the `$ref`, verify the digest, and use the decrypted value.
5. Map inbound DIDComm protocol messages to workflow events.
6. Provide `status` with `allowed_events`, `action_menu`, and optional `ui`.
7. Send `workflow/1.0/complete` on entering a `final` state.
8. Maintain audit via `history` and `artifacts`.
9. Secure storage and protect against replay.
10. Bind `connection_id` from the inbound DIDComm connection; ignore any `connection_id` in `start`.
11. MAY attempt `discover` + `fetch-template` when `start` references an unknown template and `allow_discover != false`; MUST validate/store then continue.
12. SHOULD use the same `thid` across `start` → `discover`/`workflows` → `fetch-template`/`template` → `status`.
13. When `vault_ref` is present, the Processor MUST track vault lifecycle state (`active`, `sealed`, `retired`) on the instance.
14. On workflow `complete`, the Processor MUST send a Vaults 1.0 `seal` message to the bound vault. On workflow `cancel`, the Processor MUST send a Vaults 1.0 `tombstone` message.
15. The Processor MUST NOT record resolved plaintext from vault-backed fields in `history`, logs, or any persistent store other than the vault itself.
16. The Processor MUST wipe `$transient` fields from all storage immediately after the advance cycle completes.
17. The Processor MUST reject `start` messages that pass literal values for fields declared as `storage: "vault"` in the template `sensitivity` map (return `sensitivity_violation`).

## Coordinator Conformance (recommended)
A conforming Coordinator SHOULD:
- Use `publish-template`, `start`, `advance`, `status`.
- Render `display_hints` when present (non-normative).
- Fire `advance(event)` on button clicks with `idempotency_key`.
- Avoid sending credential/schema IDs in messages—use profile IDs.
- Implement `discover` and `fetch-template` with authorization controls; include `hash` in `workflows` when `include_hash=true`.
- When a template declares `sensitivity` with `storage: "vault"` fields, provision a Vaults 1.0 vault, store sensitive values in the EDV grouped by role-access, and send only `$ref` pointers in `start.context`.
- Respect `sensitivity_behavior` in `display_hints` when rendering UI (masking, toggle-reveal).
- On workflow completion or cancellation, confirm the vault has been sealed or tombstoned (the Processor handles this, but Coordinators SHOULD verify via vault `notify` or `status`).

## Composition
The Workflow protocol composes with other DIDComm protocols by referencing their message types in action definitions. Supported protocols:
- Issue-Credential 2.0
- Present-Proof 2.0
- Payments 1.0
- Vaults 1.0 (vault-backed sensitive field storage, lifecycle binding)
- (Any DIDComm protocol with defined message types)

New protocols (e.g., payments) require no change to Workflow 1.0: add an action whose `typeURI` equals the new DIDComm message type and a matching profile in `catalog`. Vaults 1.0 integration is activated by the presence of a `sensitivity` map in the template and a `vault_ref` in the instance; agents without vault support degrade gracefully to plaintext context fields.

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
- Per-field ZCAP capabilities for fine-grained vault access control (currently role-grouped)
- `encrypted` storage mode (inline JWE without vault) for moderate-sensitivity fields
- Cross-workflow vault sharing (multiple workflow instances referencing the same vault)
