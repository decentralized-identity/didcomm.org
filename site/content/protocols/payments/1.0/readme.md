---
title: Payments
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/payments/1.0
status: Demonstrated
summary: A protocol for proposing, invoicing, and settling payments over DIDComm.
tags: [payments, commerce]
authors:
  - name: Vinay Singh
    email: vinay@verid.id

---

## Summary
A DIDComm v2 protocol for a secure payments handshake to propose, invoice, and settle off-rail payments. It enables:
- Introducing payment coordinates (e.g., bank or EVM) once with proof of control
- Negotiating how to pay and any tax/compliance preconditions
- Exchanging receipts without re-sending sensitive details
- Reusing stored methods per connection with sensible defaults

## Motivation
Agents need interoperable, privacy-preserving payment interactions without embedding rails, custody, or FX into the protocol itself. This protocol standardizes messages, validation rules, and error taxonomy to coordinate payment terms and confirmations while keeping actual fund movement out-of-band (bank rails, on-chain transfers, PSPs). Non-goals include on-rail settlement and FX execution.

## Version Change Log

### 1.0
- Initial draft.

## Roles
- `payer`: The party that sends funds to settle an obligation.
- `payee`: The party that receives funds.

## Requirements (normative)
- All messages use standard DIDComm v2 encryption.
- Sign-then-encrypt is RECOMMENDED for `handshake-request`, `receipt`, and `confirm` for non-repudiation and auditability.
- Use standard DIDComm v2 message fields: `id`, `type`, `from`, `to`, `thid`, optional `pthid`, `created_time`.
- Sensitive coordinates and tax details MUST appear only in `handshake-request`.
- If external attachments/links are used, include a content hash (multihash/multibase) and optionally a detached JWS; receivers MUST verify hashes before use.

## Discoverability
Agents SHOULD advertise via Discover-Features:
- Protocol: `https://didcomm.org/payments/1.0`
- Claims (capabilities): `method:evm`, `method:bank:iban`, `method:bank:upi`, …
- Optional: supported assets (CAIP-19), chains (CAIP-2), compliance features (e.g., `vc:legal-entity`, `ivms101`), quotes, refunds
- Subscriptions/profile claims: `subscriptions:autopay`, `subscriptions:notify`, `subscriptions:updates`, `subscriptions:retry`

## Data Conventions (normative)
### Assets & Amounts
- Identify assets with CAIP-19 (e.g., `eip155:137/erc20:0x…`).
- Amount carried as:
  - `quantity` — atomic units as a string, canonical for validation.
  - `display` — UI-only object `{ "currency": "<code>", "value": "<decimal string>" }`.
- `decimals` MUST be supplied when not reliably derivable or to avoid live lookups.

### Chains
- Identify networks with CAIP-2 (e.g., `eip155:1`, `eip155:137`).

### Canonical Hashing
- `terms_sha256` = SHA-256 over JCS-canonicalized `terms` JSON; base64url.
- `receipt.summary_hash` MUST match `terms_sha256`.

### Proofs of Control
- EVM: EIP-191 or EIP-712 signature over a challenge binding `{did, session.id, timestamp}`.
- Bank: pluggable proof (micro-deposit code, bank attestation, VC, Open-Banking consent ref).

### Cross-protocol correlation & extensions
- Optional correlation fields allowed in any message body: `mandate_id`, `cycle_id`, `quote_id`.
- Messages MAY include `ext` (object) for namespaced extensions. Keys SHOULD be reverse-DNS URIs and unknown keys MUST be ignored.

## States
State machine (base flow):
```
query-methods → methods (optional)
compliance-request → compliance-response (optional; REQUIRED if demanded)
handshake-request → requested
handshake-accept → accepted
receipt → receipted
confirm(received|pending|settled|failed) → terminal
cancel or problem-report at any time → abandoned
```
Sessions expire at `session.ttl`; late receipts MUST be ignored and MAY elicit a problem-report (`session-closed`).

## Basic Walkthrough
1) Discovery and Compliance (optional): `query-methods` → `methods` → `compliance-request` → `compliance-response`
2) Secure Reveal and Acceptance: `handshake-request` (coordinates, terms, invoice, tax) → `handshake-accept`
3) Off-rail Payment and Confirmation: Payer pays off-band → `receipt` (tx ref, summary hash) → `confirm` (received|pending|settled|failed)

## Security
- **Confidentiality & Integrity**: Standard DIDComm v2 encryption provides message confidentiality and integrity; place sensitive data only in `handshake-request`.
- **Non-repudiation**: Sign-then-encrypt recommended for `handshake-request`, `receipt`, `confirm`.
- **Replay protection**: Bind proofs to `{did, session.id, timestamp/nonce}`; enforce reasonable clock skew.
- **Data minimization**: Receipts exclude coordinates and full terms; include only references and hashes.
- **DID/Key rotation**: Require `thid` continuity; if `from`/`to` rotate, re-auth on next hop.
- **DoS prevention**: Rate-limit concurrent sessions per connection; cap payload sizes; reject oversized attachments.
- **Privacy in logging**: Redact coordinates, VCs, and IVMS data; log only hashes/IDs.

## Message Reference

All examples are DIDComm JSON bodies (outer envelope omitted for brevity).

### query-methods
Message Type URI: `https://didcomm.org/payments/1.0/query-methods`
```json
{
  "type": "https://didcomm.org/payments/1.0/query-methods",
  "id": "q-93f...",
  "to": ["did:peer:payee"],
  "from": "did:peer:payer",
  "body": {
    "want": ["method:evm", "method:bank:*"],
    "meta": {
      "purpose": "invoice|deposit|refund",
      "amount": { "currency": "USD", "value": "120.00" }
    }
  }
}
```

### methods
Message Type URI: `https://didcomm.org/payments/1.0/methods`
```json
{
  "type": "https://didcomm.org/payments/1.0/methods",
  "id": "m-2b1...",
  "thid": "q-93f...",
  "to": ["did:peer:payer"],
  "from": "did:peer:payee",
  "body": {
    "supported": [
      { "code": "method:evm", "variants": [{ "chain": "eip155:1" }, { "chain": "eip155:137" }] },
      { "code": "method:bank:iban" },
      { "code": "method:bank:upi" }
    ],
    "assets": [ "eip155:137/erc20:0x2791...4174" ],
    "defaults": { "preferred": "method:evm", "variant": { "chain": "eip155:137" } },
    "reusable_supported": true,
    "subscriptions_supported": true
  }
}
```

### compliance-request (optional)
Message Type URI: `https://didcomm.org/payments/1.0/compliance-request`
```json
{
  "type": "https://didcomm.org/payments/1.0/compliance-request",
  "id": "crq-01...",
  "thid": "hs-77c...",
  "body": {
    "vc_presentation_definition": {},
    "ivms101_required": false
  }
}
```

### compliance-response
Message Type URI: `https://didcomm.org/payments/1.0/compliance-response`
```json
{
  "type": "https://didcomm.org/payments/1.0/compliance-response",
  "id": "crs-01...",
  "thid": "hs-77c...",
  "body": {
    "presentations~attach": [
      { "media_type": "application/vc+ld+json", "data": { "base64": "<verifiable presentation>" } }
    ],
    "ivms101": {}
  }
}
```

### handshake-request (single secure reveal)
Message Type URI: `https://didcomm.org/payments/1.0/handshake-request`
```json
{
  "type": "https://didcomm.org/payments/1.0/handshake-request",
  "id": "hs-77c...",
  "thid": "hs-77c...",
  "pthid": "parent-protocol-id-if-any",
  "to": ["did:peer:payer"],
  "from": "did:peer:payee",
  "body": {
    "session": { "id": "ps_4a2c...", "ttl": "2025-12-31T23:59:59Z", "nonce": "n-0f..." },
    "mandate_id": "man_8f3a...",
    "cycle_id": "2025-10",
    "ext": {},
    "terms": {
      "request_id": "req_7f9a...",
      "asset": { "caip19": "eip155:137/erc20:0x2791...4174", "decimals": 6 },
      "quantity": "120000000",
      "display": { "currency": "USDC", "value": "120.00" },
      "invoice": {
        "invoice_number": "INV-2025-091",
        "issue_date": "2025-08-31",
        "due_date": "2025-09-07",
        "line_items": [{ "desc": "Pro subscription (Sept)", "qty": "1", "unit_price": "120.00", "hsn_sac": "9983" }],
        "discounts": []
      },
      "tax": {
        "jurisdiction": "",
        "scheme": "GST",
        "place_of_supply": "",
        "registration": { "payee": "", "payer": null },
        "lines": [{ "code": "GST-IGST", "rate": "18.00", "basis": "120.00", "amount": "21.60" }],
        "reverse_charge": false,
        "exempt_reason": null
      },
      "network": { "chain": "eip155:137", "confirmations_required": 20 },
      "fees": { "payer": "payer" },
      "partial_allowed": false,
      "tolerance": { "under": "0.00", "over": "0.00" }
    },
    "payee_coords": {
      "method": "method:evm",
      "evm": {
        "address": "0xABCD...",
        "chain": "eip155:137",
        "wallet_type": "EOA",
        "proof": { "type": "EIP-712", "challenge": "did:peer:payee|ps_4a2c...|2025-08-31T14:00Z", "signature": "0x..." }
      }
    },
    "method_ref": "pm_abc123",
    "compliance": {
      "policy_uri": "https://example.com/policy/aml-tax-v1",
      "vc_requirements": [{ "purpose": "legal-entity", "accepted_schemas": ["vlei:legal-entity", "org-reg:tax-id"] }],
      "ivms101": { "required": false }
    },
    "integrity": { "terms_sha256": "base64url(JCS(SHA-256(terms)))" }
  }
}
```

### handshake-accept
Message Type URI: `https://didcomm.org/payments/1.0/handshake-accept`
```json
{
  "type": "https://didcomm.org/payments/1.0/handshake-accept",
  "id": "ha-5d0...",
  "thid": "hs-77c...",
  "to": ["did:peer:payee"],
  "from": "did:peer:payer",
  "body": {
    "session": { "id": "ps_4a2c..." },
    "selected": { "method": "method:evm", "variant": { "chain": "eip155:137" } }
  }
}
```

### receipt
Message Type URI: `https://didcomm.org/payments/1.0/receipt`
```json
{
  "type": "https://didcomm.org/payments/1.0/receipt",
  "id": "rcpt-2a77...",
  "thid": "hs-77c...",
  "to": ["did:peer:payee"],
  "from": "did:peer:payer",
  "body": {
    "session_id": "ps_4a2c...",
    "request_id": "req_7f9a...",
    "mandate_id": "man_8f3a...",
    "cycle_id": "2025-10",
    "ext": {},
    "proofs": [
      {
        "network": { "chain": "eip155:137" },
        "tx_ref": "0xTRANSACTION_HASH",
        "summary_hash": "same-as-terms_sha256",
        "payer_hint": { "evm_from": "0x12..34", "masked_bank": "****1234" },
        "payer_proof": { "type": "EIP-191", "challenge": "did:peer:payer|ps_4a2c...|rcpt-2a77...", "signature": "0x..." }
      }
    ]
  }
}
```

Idempotency: A receipt is unique per `{session_id, tx_ref}`; duplicates MUST be accepted as no-ops.

### confirm
Message Type URI: `https://didcomm.org/payments/1.0/confirm`
```json
{
  "type": "https://didcomm.org/payments/1.0/confirm",
  "id": "ack-88de...",
  "thid": "hs-77c...",
  "to": ["did:peer:payer"],
  "from": "did:peer:payee",
  "body": {
    "session_id": "ps_4a2c...",
    "status": "received|pending|settled|failed",
    "reason": null,
    "mandate_id": "man_8f3a...",
    "cycle_id": "2025-10",
    "ext": {}
  }
}
```

### cancel
Message Type URI: `https://didcomm.org/payments/1.0/cancel`
```json
{
  "type": "https://didcomm.org/payments/1.0/cancel",
  "id": "cn-01...",
  "thid": "hs-77c...",
  "body": { "session_id": "ps_4a2c...", "reason": "user-cancelled" }
}
```

### method-update and method-revoke
Message Type URIs: `https://didcomm.org/payments/1.0/method-update`, `https://didcomm.org/payments/1.0/method-revoke`
```json
{
  "type": "https://didcomm.org/payments/1.0/method-update",
  "id": "mu-01...",
  "to": ["did:peer:counterparty"],
  "from": "did:peer:owner",
  "body": {
    "method_id": "pm_abc123",
    "code": "method:bank:iban",
    "variant": { "region": "EU" },
    "payee_coords": { "bank": { "scheme": "iban", "iban": "DE89...", "bic": "COBADE...", "name": "Acme", "proof": {} } },
    "reason": "rotation"
  }
}
```
```json
{
  "type": "https://didcomm.org/payments/1.0/method-revoke",
  "id": "mr-01...",
  "to": ["did:peer:counterparty"],
  "from": "did:peer:owner",
  "body": { "method_id": "pm_abc123", "reason": "account-closed" }
}
```

### Quotes & refunds
- `quote` — payee issues a firm quote with `quote_id`, `expires_at`; payer MUST echo `quote_id` in `receipt`.
- `refund-request` / `refund-receipt` — mirror receipt semantics, referencing original `session_id`.

## L10n
Localization applies to human-readable fields (e.g., invoice `memo`, error `comment`). Protocol validation uses canonical, language-agnostic fields.

## Validation Rules (normative)
- Replay/anti-phishing: Proofs MUST bind to `{did, session.id, timestamp/nonce}`; enforce reasonable clock skew.
- Tax math: Receiver MUST recompute tax from `terms.invoice` & `terms.tax` and verify `summary_hash`.
- Payer binding: If the rail reveals payer (e.g., EVM `from`), `payer_proof` is OPTIONAL; otherwise include `payer_proof` or rely on bank API identity.
- Amounts: Validate using `asset.caip19` + `quantity` only (never the UI `display` field).
- Confirmations: Respect `network.confirmations_required` when deciding settled vs received/pending.
- Compliance gating: If `vc_requirements`/`ivms101` present, no `handshake-accept` until a valid `compliance-response` is processed.
- Method reference integrity: If `method_ref` is present, the receiver MUST resolve it to a verified `PaymentMethodRecord` for the same `connectionId`; otherwise reject with `method-ref-invalid`.
- Correlation transparency: `mandate_id`/`cycle_id` MUST NOT alter financial validation; they only aid correlation/UX.

## Errors (Problem-Report codes)
Use standard DIDComm problem-report with these codes:
- `unsupported-method`, `invalid-proof`, `request-expired`, `session-closed`
- `amount-mismatch`, `asset-unsupported`, `summary-hash-mismatch`
- `tx-not-found`, `tx-underpaid`, `tx-overpaid`, `confirmations-insufficient`
- `bank-ref-mismatch`, `duplicate-receipt`
- `compliance-required`, `vc-invalid`, `ivms101-missing`
- `method-ref-invalid`, `mandate-required`, `cycle-over-cap`, `retry-exhausted`

## Storage & Reuse (connection-scoped)
### Suggested Records
- PaymentMethodRecord: `id`, `connectionId`, `code`, `variant`, `display`, `verified(bool)`, `default(bool)`, `status('unverified'|'verified'|'revoked'|'expired')`, `version`, `payload(ENCRYPTED JSON)`, `proof`, `tags`
- PaymentSessionRecord: `sessionId`, `connectionId`, `requestId`, `state('requested'|'accepted'|'receipted'|'confirmed'|'failed')`, `selectedMethodId`, `termsSha256`, `nonce`, `quoteId?`, `confirmationsRequired?`, `expiresAt`, `vcVerified(bool)`, `ivmsVerified(bool)`, `stateReason?`
- TaxProfileRecord (per connection): `connectionId`, `jurisdictions[]`, `defaultScheme`, `registrations{payee,payer}`, `lastValidatedAt`
- CompliancePolicyRecord: `policyUri`, `vcRequirements[]`, `ivmsRequired(bool)`, `updatedAt`

### Reuse
- Keep multiple `PaymentMethodRecord`s per connection; mark `default=true`.
- If a default exists, Payee MAY skip `query-methods` and send `handshake-request` directly.
- Payer may override in `handshake-accept`; Payee may reject via `problem-report`.
- When a default exists, the payee MAY use `method_ref` in `handshake-request` to avoid resending coordinates. The receiver MUST still enforce verification on the referenced record.

## Mandates & Recurring Payments (Optional Profile)
This profile specifies reusable payment authorizations (“mandates”) and recurring charges. Messages use the `https://didcomm.org/payments/1.0/*` prefix and compose with the base flow by referencing stored methods via `method_ref`, correlating with `mandate_id`/`cycle_id`, and invoking the standard `handshake-request → receipt → confirm` for each charge.

### Discoverability (profile)
Advertise via Discover-Features: `subscriptions:autopay`, `subscriptions:notify`, `subscriptions:updates`, `subscriptions:retry`.

### Mandate lifecycle messages
`mandate-offer` (Payee → Payer): Proposes subscription plan + constraints.
```json
{
  "type": "https://didcomm.org/payments/1.0/mandate-offer",
  "id": "mof-01...",
  "to": ["did:peer:payer"],
  "from": "did:peer:payee",
  "body": {
    "plan": { "name": "Pro Plan", "billing_period": "P1M", "anchor_day": 1, "start_at": "2025-09-15T00:00:00Z", "trial_until": null, "grace_period": "P7D", "retry_policy": { "attempts": 3, "interval": "P2D" } },
    "terms": { "asset": { "caip19":"eip155:137/erc20:0x2791...4174", "decimals": 6 }, "price_quantity": "120000000", "display": { "currency":"USDC", "value":"120.00" }, "tax_policy": "GST", "tax_hints": { "jurisdiction":"CA", "place_of_supply":"CA-ON" }, "variable_pricing": false },
    "constraints": { "cap_per_charge_quantity": "150000000", "cap_per_period_quantity": "600000000", "cap_total_quantity": null, "expires_at": "2027-09-15T00:00:00Z" },
    "methods_allowed": [ {"code":"method:evm","variant":{"chain":"eip155:137"}}, {"code":"method:bank:iban"} ],
    "autopay_requested": true,
    "notify_days_before": 3,
    "compliance_requirements": { "vc_requirements":[{"purpose":"legal-entity","accepted_schemas":["vlei:legal-entity"]}], "ivms101": { "required": false } },
    "mandate_terms_sha256": "base64url(JCS(SHA-256(offer.body)))"
  }
}
```

`mandate-accept` (Payer → Payee): Chooses stored method by reference and consents.
```json
{
  "type": "https://didcomm.org/payments/1.0/mandate-accept",
  "id": "mac-01...",
  "thid": "mof-01...",
  "to": ["did:peer:payee"],
  "from": "did:peer:payer",
  "body": {
    "mandate_id": "man_8f3a...",
    "method_ref": "pm_abc123",
    "autopay": true,
    "limits": { "cap_per_charge_quantity": "150000000" },
    "mandate_terms_sha256": "base64url(JCS(SHA-256(offer.body)))",
    "consent_proof": { "type": "did-jws", "signature": "eyJhbGciOiJFZERTQSIs..." }
  }
}
```

`mandate-activate` (Payee → Payer): Confirms activation and sets the first due date.
```json
{ "type": "https://didcomm.org/payments/1.0/mandate-activate", "id": "mact-01...", "thid": "mof-01...", "body": { "mandate_id":"man_8f3a...", "status":"active", "next_due_at":"2025-10-15T00:00:00Z" } }
```

`mandate-update` / `mandate-cancel` (either direction): Propose changes or stop future cycles.
```json
{ "type": "https://didcomm.org/payments/1.0/mandate-update", "id": "mup-01...", "thid": "mof-01...", "body": { "mandate_id":"man_8f3a...", "changes": { "plan": { "billing_period":"P1Y" } } } }
```
```json
{ "type": "https://didcomm.org/payments/1.0/mandate-cancel", "id": "mcn-01...", "thid": "mof-01...", "body": { "mandate_id":"man_8f3a...", "when":"immediate|period_end", "reason":"user-request" } }
```

`subscription-status` (either direction): Synchronizes mandate status for UI/ops.
```json
{
  "type":"https://didcomm.org/payments/1.0/subscription-status",
  "id":"sst-01...",
  "thid":"mof-01...",
  "body":{ "mandate_id":"man_8f3a...", "status":"active|past_due|canceled|paused", "next_due_at":"2025-10-15T00:00:00Z", "last_paid_at":"2025-09-15T00:00:00Z", "past_due": false, "outstanding_cycles": 0 }
}
```

#### Charge messages
Two modes reuse the base handshake flow.

`charge-notice` (Payee → Payer): Nudge before due date.
```json
{
  "type": "https://didcomm.org/payments/1.0/charge-notice",
  "id": "chn-01...",
  "thid":"mof-01...",
  "body": { "mandate_id":"man_8f3a...", "cycle_id":"2025-10", "due_at":"2025-10-15T00:00:00Z", "preview": { "display": {"currency":"USDC","value":"120.00"}, "tax_estimate": {"amount":"21.60"} } }
}
```

`charge-request` (Payee → Payer): Compact wrapper that results in a base `handshake-request`.
```json
{
  "type": "https://didcomm.org/payments/1.0/charge-request",
  "id": "chr-01...",
  "thid":"mof-01...",
  "body": {
    "mandate_id":"man_8f3a...",
    "cycle_id":"2025-10",
    "method_ref":"pm_abc123",
    "terms": {
      "asset": { "caip19":"eip155:137/erc20:0x2791...4174","decimals":6 },
      "quantity":"120000000",
      "display": {"currency":"USDC","value":"120.00"},
      "invoice": { "invoice_number":"INV-2025-10-0001", "line_items":[{"desc":"Pro Plan Oct","qty":"1","unit_price":"120.00"}] },
      "tax": { "jurisdiction":"IN", "scheme":"GST", "lines":[{"code":"GST-IGST","rate":"18.00","basis":"120.00","amount":"21.60"}] },
      "network": { "chain":"eip155:137", "confirmations_required":20 }
    },
    "integrity": { "terms_sha256":"..." }
  }
}
```

### Profile Validation and Errors
- Consent digest integrity: `mandate-accept.body.mandate_terms_sha256` MUST match the offer digest (JCS+SHA-256). `consent_proof` MUST bind `{did, mandate_id (or thid), timestamp}`.
- Per-cycle integrity: Every cycle terms MUST produce a `terms_sha256` that equals the `receipt.summary_hash`.
- Caps: Reject a cycle if it exceeds `cap_per_charge_quantity`, `cap_per_period_quantity`, or `cap_total_quantity`.
- Compliance freshness: If compliance VCs/IVMS are expired or missing, a fresh `compliance-request` MUST precede the next charge.
- Errors (adds to base): `mandate-invalid`, `mandate-consent-required`, `mandate-canceled`, `mandate-expired`, `cycle-over-cap`, `cycle-past-due`, `retry-exhausted`, `autopay-disabled`, `notify-required`, `method-ref-invalid`.

## Implementations
Name / Link | Implementation Notes
--- | ---

## Endnotes
### Future Considerations
- Refund and chargeback patterns
- Multi-party or split payments
- Escrowed settlement and dispute mediation
