---
title: Ledger
publisher: vinaysingh8866
license: MIT
piuri: https://didcomm.org/ledger/1.0
status: Proposed
summary: A DIDComm v2 protocol for peer-to-peer shared expense tracking and settlement between agents, with hash-chained entries, dual-signature confirmation, flexible split logic, balance computation, and settlement via the Payments 1.0 protocol.
tags: [ledger, expenses, settlement, splitwise, p2p, payments]
authors:
  - name: Vinay Singh
    email: vinay@ajna.inc

---

## Summary

The Ledger Protocol enables DIDComm agents to maintain shared, tamper-evident expense ledgers. Two or more agents can record expenses, split costs, track running balances, and settle debts — all peer-to-peer with no central server.

Key capabilities:
- Create bilateral or group shared ledgers with agreed-upon rules
- Record expenses with flexible split types (equal, exact, percentage, shares)
- Hash-chained, dual-signed entries for tamper evidence and non-repudiation
- Automatic net balance computation from confirmed entries
- Settlement via the Payments 1.0 protocol with cryptographic proof linking
- Offline-tolerant sync with sequence-based reconciliation
- Entry disputes, adjustments, and voiding with full audit trail

---

## Motivation

Agents need a way to track shared expenses and debts over time without a central intermediary. Existing payment protocols handle single transactions, but real-world relationships involve ongoing shared costs — rent, trips, meals, subscriptions — where the balance changes constantly and settlement happens periodically. The Ledger protocol fills this gap by providing a shared, append-only record that both parties agree on, with settlement delegated to the Payments 1.0 protocol when it is time to square up.

---

## Goals

- Maintain a shared, tamper-evident record of expenses between agents
- Support flexible cost-splitting across two or more participants
- Compute net balances and determine who owes whom
- Settle outstanding balances via the Payments 1.0 protocol with verifiable proof linking
- Tolerate offline operation with sequence-based sync and reconciliation
- Prevent tampering via hash chaining and dual-signature confirmation

## Non-Goals

- On-rail fund movement (delegated to Payments 1.0)
- Foreign exchange or currency conversion
- Tax computation (delegated to Payments 1.0 terms)
- Business invoicing (use Payments 1.0 directly)

---

## Roles

- `participant`: Any agent that is a member of a shared ledger. All participants are equal peers. Any participant can add entries, propose settlements, or request sync.

In practice, participants take on transient behavioral roles:
- **creator**: The agent that proposes a new ledger
- **payer**: The participant who paid an expense (per entry)
- **debtor**: The participant who owes money (derived from balance)
- **creditor**: The participant who is owed money (derived from balance)

---

## Composition

| Protocol | How Ledger Uses It |
|----------|-------------------|
| Payments 1.0 | Settlement of net balances. Ledger `settle` triggers a Payments `handshake-request` with `pthid` linking back to the ledger thread. Payment `confirm(settled)` is referenced in `settle-confirm`. |
| Signing 1.0 | Optional. Entry signatures and countersignatures for non-repudiation. Can use Signing suites for complex approval flows. |
| Vaults 1.0 | Optional. Store encrypted ledger snapshots or receipt attachments in shared vaults. `ContentRef` can point to ledger archives. |
| Workflow 1.0 | Optional. Model complex settlement flows (group optimization, recurring splits) as workflow templates. |
| Discover Features 2.0 | Advertise ledger support, split types, max participants, settlement methods. |
| BasicMessage 2.0 | Optional. Inline notes or discussions about specific entries via `pthid`. |

---

## Discoverability

Agents SHOULD advertise via Discover-Features 2.0:
- Protocol: `https://didcomm.org/ledger/1.0`
- Capabilities: supported split types (`split:equal`, `split:exact`, `split:percentage`, `split:shares`), max participants, settlement support (`settle:payments-1.0`)

---

## Data Conventions

### Amounts
- `quantity`: Atomic units as a string (canonical for computation). For fiat, use smallest denomination (e.g., cents for USD: `"1250"` = $12.50).
- `display`: UI-only object `{ "currency": "<code>", "value": "<decimal string>" }`.
- `decimals`: Number of decimal places for the currency (e.g., `2` for USD, `6` for USDC).

Agents MUST use `quantity` for all balance computation. The `display` field is informational only.

### Assets
- For cryptocurrency settlements, use CAIP-19 asset identifiers (same convention as Payments 1.0).
- For fiat, use ISO 4217 currency codes in `display.currency`.

### Hashing
- `entry_hash`: SHA-256 over JCS-canonicalized entry body (excluding `ack_signatures`, `status`, and `entry_hash` itself), base64url encoded.
- `prev_hash`: SHA-256 hash of the previous entry in the ledger (regardless of status), base64url encoded. The first entry uses `prev_hash: null`. Voided entries remain in the chain; they simply do not count toward balance.

### Signatures
- Entry signatures use DID-JWS (compact serialization) over the `entry_hash`.
- Sign-then-encrypt is RECOMMENDED for `entry`, `settle`, and `settle-confirm` messages.

---

## Data Model

### LedgerDescriptor

Shared metadata agreed upon at creation.

```json
{
  "ledger_id": "ldg_7f9a2b...",
  "name": "Apartment Expenses",
  "participants": [
    { "did": "did:peer:alice", "alias": "Alice" },
    { "did": "did:peer:bob", "alias": "Bob" }
  ],
  "currency": {
    "code": "USD",
    "decimals": 2
  },
  "asset": null,
  "rules": {
    "default_split": "equal",
    "require_ack": true,
    "settle_threshold": null,
    "entry_ttl_days": 30,
    "auto_settle": false
  },
  "created_at": "2026-01-15T10:00:00Z",
  "created_by": "did:peer:alice"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger_id` | string | Yes | Unique ledger identifier |
| `name` | string | Yes | Human-readable label |
| `participants` | array | Yes | List of participant objects with `did` and optional `alias` |
| `currency` | object | Yes | Currency `code` (ISO 4217) and `decimals` |
| `asset` | object | No | CAIP-19 asset identifier for crypto-denominated ledgers |
| `rules` | object | Yes | Ledger behavior rules (see below) |
| `created_at` | string | Yes | ISO 8601 creation timestamp |
| `created_by` | string | Yes | DID of the creator |

**Rules:**

| Field | Default | Description |
|-------|---------|-------------|
| `default_split` | `"equal"` | Default split type for new entries |
| `require_ack` | `true` | Whether entries need countersignature to count toward balance |
| `settle_threshold` | `null` | Auto-prompt settlement when any balance exceeds this quantity (null = disabled) |
| `entry_ttl_days` | `30` | Days an entry can remain `pending` before auto-void |
| `auto_settle` | `false` | Automatically trigger settlement when threshold is reached |

### Entry

A single expense, settlement, or adjustment record.

```json
{
  "entry_id": "ent_3c68ca...",
  "ledger_id": "ldg_7f9a2b...",
  "seq": 5,
  "prev_hash": "base64url(SHA-256 of previous entry)",
  "type": "expense",
  "paid_by": "did:peer:alice",
  "amount": {
    "quantity": "3500",
    "display": { "currency": "USD", "value": "35.00" }
  },
  "split": {
    "type": "equal",
    "among": ["did:peer:alice", "did:peer:bob"]
  },
  "description": "Groceries",
  "category": "food",
  "occurred_at": "2026-01-20T18:30:00Z",
  "timestamp": 1737398400000,
  "attachments": [],
  "ref_entry_id": null,
  "signature": "<DID-JWS by creator>",
  "ack_signatures": {},
  "status": "pending",
  "entry_hash": "base64url(SHA-256 of JCS-canonicalized entry body)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entry_id` | string | Yes | Unique entry identifier |
| `ledger_id` | string | Yes | Parent ledger |
| `seq` | number | Yes | Monotonic sequence number within this ledger |
| `prev_hash` | string | Yes | SHA-256 of previous entry (`null` for first entry) |
| `type` | enum | Yes | `expense`, `settlement`, `adjustment` |
| `paid_by` | string | Yes | DID of who paid (for expense) or who sent payment (for settlement) |
| `amount` | object | Yes | Total amount with `quantity` and `display` |
| `split` | object | Yes | How the amount is divided (see Split Types) |
| `description` | string | Yes | Human-readable description of the expense |
| `category` | string | No | Optional category tag |
| `occurred_at` | string | No | When the expense occurred (ISO 8601) |
| `timestamp` | number | Yes | Entry creation time (ms since epoch) |
| `attachments` | array | No | Optional receipt references (ContentRef or base64 data) |
| `ref_entry_id` | string | No | References another entry (for adjustments and settlements) |
| `signature` | string | Yes | DID-JWS by entry creator over `entry_hash` |
| `ack_signatures` | object | No | Map of `did → DID-JWS` countersignatures |
| `status` | enum | Yes | `pending`, `confirmed`, `disputed`, `voided` |
| `entry_hash` | string | Yes | SHA-256 over JCS-canonicalized entry body |

### Split Types

#### Equal
Divide equally among specified participants (or all if `among` is omitted).

```json
{ "type": "equal", "among": ["did:peer:alice", "did:peer:bob"] }
```

#### Exact
Explicit amounts per participant. MUST sum to the entry `amount.quantity`.

```json
{
  "type": "exact",
  "amounts": {
    "did:peer:alice": "2000",
    "did:peer:bob": "1500"
  }
}
```

#### Percentage
Percentage per participant. MUST sum to `"100"`.

```json
{
  "type": "percentage",
  "percentages": {
    "did:peer:alice": "60",
    "did:peer:bob": "40"
  }
}
```

#### Shares
Ratio-based split. Each participant's share = `their_shares / total_shares * amount`.

```json
{
  "type": "shares",
  "shares": {
    "did:peer:alice": 2,
    "did:peer:bob": 1
  }
}
```

### Balance

Balance is **computed, not stored**. It is derived from all `confirmed` entries.

For each confirmed expense entry:
- The `paid_by` participant is **credited** the full `amount.quantity`
- Each participant in the `split` is **debited** their portion

For each confirmed settlement entry:
- The `paid_by` (debtor) is **credited** the settlement amount
- The recipient (creditor) is **debited** the settlement amount

Net balance per participant = total credits - total debits. Positive = owed money. Negative = owes money. The sum of all balances MUST always equal zero.

**Signed quantities**: Balance values and `balance_snapshot` fields use signed string quantities (e.g., `"1250"` for positive, `"-1250"` for negative). This is distinct from entry `amount.quantity` which is always a positive value.

---

## States

### Ledger States

```
PROPOSED -> ACTIVE <-> SETTLING
                    -> CLOSED
```

| State | Description |
|-------|-------------|
| `proposed` | `create` sent, waiting for all participants to `accept` |
| `active` | All participants accepted; entries can be added and settled |
| `settling` | A settlement is in progress via Payments 1.0 |
| `closed` | Ledger closed by mutual agreement; no further entries |

### Entry States

```
pending -> confirmed (ack received from all other participants)
        -> disputed  (reject received)
        -> voided    (adjustment nullifies, or TTL expired)
```

| State | Description |
|-------|-------------|
| `pending` | Created by one participant, awaiting ack from others |
| `confirmed` | All participants have countersigned; counts toward balance |
| `disputed` | A participant rejected the entry with a reason |
| `voided` | Entry nullified by an adjustment or TTL expiry |

---

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `default_split` | `equal` | Default split type when not specified in entry |
| `require_ack` | `true` | Whether entries need countersignatures to be confirmed |
| `settle_threshold` | `null` | Balance quantity that triggers settlement prompt |
| `entry_ttl_days` | `30` | Days before unacked entries are auto-voided |
| `auto_settle` | `false` | Auto-trigger Payments flow when threshold is reached |
| `max_participants` | `10` | Maximum number of participants per ledger |

---

## Basic Walkthrough

1. **Alice** sends `create` to **Bob** proposing a shared ledger for apartment expenses in USD.
2. **Bob** sends `accept` — the ledger is now `active`.
3. **Alice** pays for groceries ($35.00). She sends an `entry` message with `type: expense`, `paid_by: alice`, `amount: 3500`, `split: equal`. She signs the entry.
4. **Bob** receives the entry, verifies Alice's signature and the hash chain, and sends `ack` with his countersignature. The entry is now `confirmed`.
5. **Bob** pays for internet ($60.00) and sends an entry. Alice acks it.
6. After several entries, Alice checks the balance: she owes Bob $12.50 net.
7. **Alice** sends `settle` referencing the net balance of $12.50. This triggers a Payments 1.0 `handshake-request` with `pthid` linking to the ledger thread.
8. Alice pays via the Payments flow. On receiving `confirm(settled)`, Bob sends `settle-confirm` back to the ledger thread.
9. A settlement entry is appended to the ledger, zeroing out the balance.
10. Months later, they send `close` to archive the ledger.

---

## Settlement Flow (Payments 1.0 Integration)

Settlement bridges the Ledger protocol to the Payments protocol:

```
Ledger: settle (debtor -> creditor)
  |
  +--> Payments: handshake-request (pthid = ledger thid)
       Payments: handshake-accept
       Payments: receipt (off-rail payment made)
       Payments: confirm(settled)
  |
Ledger: settle-confirm (creditor -> debtor, references payment session_id + tx_ref)
  |
Ledger: settlement entry appended to hash chain
```

**Correlation fields:**
- The Payments `handshake-request` MUST include `pthid` set to the ledger `thid` for thread correlation
- The Payments `terms.request_id` SHOULD reference the `settle` message `id`
- The `settle-confirm` MUST include the Payments `session_id` and `tx_ref` as proof

**Partial settlement:**
- A `settle` MAY specify an amount less than the full balance
- The remaining balance persists in the ledger

---

## Group Settlement Optimization

For ledgers with 3+ participants, direct pairwise settlement may be inefficient. The protocol supports **simplified debts**:

1. Compute net balance for each participant
2. Separate into creditors (positive balance) and debtors (negative balance)
3. Match largest debtor to largest creditor, settle the minimum of both amounts
4. Repeat until all balances are zero

This minimizes the number of Payments flows needed. The `settle` message includes a `settlement_plan` showing all transfers:

```json
{
  "settlement_plan": [
    { "from": "did:peer:charlie", "to": "did:peer:alice", "quantity": "5000" },
    { "from": "did:peer:charlie", "to": "did:peer:bob", "quantity": "2000" }
  ]
}
```

Each line in the plan triggers a separate Payments 1.0 flow.

---

## Sync Protocol

For offline tolerance, agents can request missing entries:

1. Agent A comes online and sends `sync-request` with their `last_seq` (last entry sequence they have).
2. Agent B responds with `sync-response` containing all entries with `seq > last_seq`.
3. Agent A verifies the hash chain continuity and processes the entries.
4. If there are conflicts (both agents created entries while offline), the conflict is resolved by treating all offline entries as `pending` proposals. On sync, both agents exchange their pending entries. The agent who was behind accepts or rejects each entry via the normal `ack`/`reject` flow. Sequence numbers and hashes are assigned only when entries are appended to the shared chain — pending entries from the offline period carry a provisional `seq` that is finalized during reconciliation. In practice, this means the agent with the longer chain keeps their sequence, and the other agent's pending entries are appended after, with new `seq` and `prev_hash` values computed by the receiving agent before signing the `ack`.

---

## Security

- **Hash chain integrity**: Each entry includes `prev_hash = SHA-256(previous_entry)`. Either party can detect any modification to historical entries by recomputing the chain.
- **Dual signatures**: Entries require the creator's signature and countersignatures from other participants. No single party can fabricate confirmed entries.
- **Settlement binding**: Settlement entries reference Payments `session_id` and `tx_ref`. A settlement cannot be faked without a corresponding payment proof.
- **Replay protection**: `seq` + `entry_id` + `timestamp` prevent duplicate processing. Agents MUST reject entries with duplicate `entry_id` values.
- **Non-repudiation**: Sign-then-encrypt RECOMMENDED for `entry`, `settle`, and `settle-confirm`. Both parties hold signed proof of what was agreed.
- **Confidentiality**: All messages are DIDComm v2 encrypted. Only ledger participants can see amounts, descriptions, and balances.
- **Entry TTL**: Unacknowledged entries auto-void after `entry_ttl_days` to prevent stale disputes.

---

## Privacy

- Ledger data (amounts, descriptions, categories) is visible only to participants via DIDComm encryption
- Settlement uses Payments 1.0 privacy guarantees (coordinates revealed only in `handshake-request`, receipts contain only references and hashes)
- Balances are computed locally by each agent — no balance data is broadcast
- Optional: store ledger snapshots in Vaults 1.0 for encrypted backup without exposing data to the vault host

---

## Message Reference

All messages use the namespace: `https://didcomm.org/ledger/1.0/<message-name>`

---

### create

Propose a new shared ledger.

Message Type URI: `https://didcomm.org/ledger/1.0/create`

```json
{
  "type": "https://didcomm.org/ledger/1.0/create",
  "id": "create-a1b2c3",
  "to": ["did:peer:bob"],
  "from": "did:peer:alice",
  "body": {
    "ledger": {
      "ledger_id": "ldg_7f9a2b...",
      "name": "Apartment Expenses",
      "participants": [
        { "did": "did:peer:alice", "alias": "Alice" },
        { "did": "did:peer:bob", "alias": "Bob" }
      ],
      "currency": {
        "code": "USD",
        "decimals": 2
      },
      "asset": null,
      "rules": {
        "default_split": "equal",
        "require_ack": true,
        "settle_threshold": "10000",
        "entry_ttl_days": 30,
        "auto_settle": false
      }
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger` | LedgerDescriptor | Yes | Full ledger descriptor |

**Processing:**
1. Validate all participant DIDs are reachable connections
2. If accepted, store the LedgerDescriptor and transition to `active`
3. If rejected, respond with `problem-report`

---

### accept

Accept a ledger proposal.

Message Type URI: `https://didcomm.org/ledger/1.0/accept`

```json
{
  "type": "https://didcomm.org/ledger/1.0/accept",
  "id": "accept-d4e5f6",
  "thid": "create-a1b2c3",
  "to": ["did:peer:alice"],
  "from": "did:peer:bob",
  "body": {
    "ledger_id": "ldg_7f9a2b...",
    "accepted": true
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger_id` | string | Yes | The ledger being accepted |
| `accepted` | boolean | Yes | Acceptance confirmation |

**Processing:**
1. When all participants have accepted, transition ledger to `active`
2. For group ledgers (3+), the creator collects all `accept` messages before activation

---

### entry

Add a new expense to the ledger. Settlement entries are created via `settle-confirm` and adjustments via `adjust`.

Message Type URI: `https://didcomm.org/ledger/1.0/entry`

```json
{
  "type": "https://didcomm.org/ledger/1.0/entry",
  "id": "entry-g7h8i9",
  "thid": "create-a1b2c3",
  "to": ["did:peer:bob"],
  "from": "did:peer:alice",
  "body": {
    "entry": {
      "entry_id": "ent_3c68ca...",
      "ledger_id": "ldg_7f9a2b...",
      "seq": 1,
      "prev_hash": null,
      "type": "expense",
      "paid_by": "did:peer:alice",
      "amount": {
        "quantity": "3500",
        "display": { "currency": "USD", "value": "35.00" }
      },
      "split": {
        "type": "equal",
        "among": ["did:peer:alice", "did:peer:bob"]
      },
      "description": "Groceries",
      "category": "food",
      "occurred_at": "2026-01-20T18:30:00Z",
      "timestamp": 1737398400000,
      "attachments": [],
      "ref_entry_id": null,
      "signature": "<DID-JWS over entry_hash>",
      "entry_hash": "base64url(...)"
    }
  }
}
```

**Processing:**
1. Verify `signature` against `from` DID
2. Verify `entry_hash` matches JCS-canonicalized entry body
3. Verify `prev_hash` matches the `entry_hash` of the previous entry in the ledger (hash chain continuity)
4. Verify `seq` is the next expected sequence number
5. If `split.type` is `exact`, verify amounts sum to `amount.quantity`
6. If `split.type` is `percentage`, verify percentages sum to `100`
7. Store entry as `pending`
8. If `rules.require_ack` is `false`, immediately transition to `confirmed`

---

### ack

Acknowledge and countersign an entry.

Message Type URI: `https://didcomm.org/ledger/1.0/ack`

```json
{
  "type": "https://didcomm.org/ledger/1.0/ack",
  "id": "ack-j1k2l3",
  "thid": "create-a1b2c3",
  "to": ["did:peer:alice"],
  "from": "did:peer:bob",
  "body": {
    "entry_id": "ent_3c68ca...",
    "ledger_id": "ldg_7f9a2b...",
    "entry_hash": "base64url(...)",
    "signature": "<DID-JWS by Bob over entry_hash>"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entry_id` | string | Yes | The entry being acknowledged |
| `ledger_id` | string | Yes | The parent ledger |
| `entry_hash` | string | Yes | Must match the entry's hash (confirms Bob saw the same data) |
| `signature` | string | Yes | DID-JWS countersignature over `entry_hash` |

**Processing:**
1. Verify `entry_hash` matches the stored entry
2. Verify `signature` against `from` DID
3. Add to entry's `ack_signatures`
4. If all participants (except creator) have acked, transition entry to `confirmed`
5. Recompute balance

---

### reject

Dispute an entry.

Message Type URI: `https://didcomm.org/ledger/1.0/reject`

```json
{
  "type": "https://didcomm.org/ledger/1.0/reject",
  "id": "reject-m4n5o6",
  "thid": "create-a1b2c3",
  "to": ["did:peer:alice"],
  "from": "did:peer:bob",
  "body": {
    "entry_id": "ent_3c68ca...",
    "ledger_id": "ldg_7f9a2b...",
    "reason": "amount-incorrect",
    "comment": "The groceries were $25, not $35"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entry_id` | string | Yes | The entry being disputed |
| `ledger_id` | string | Yes | The parent ledger |
| `reason` | string | Yes | Machine-readable reason code |
| `comment` | string | No | Human-readable explanation |

**Reason codes:**
- `amount-incorrect` — The amount is wrong
- `split-incorrect` — The split allocation is wrong
- `not-involved` — The participant was not part of this expense
- `duplicate` — This expense was already recorded
- `fraudulent` — The entry is fabricated

**Processing:**
1. Transition entry to `disputed`
2. Creator MAY send an `adjust` to correct, or a new `entry` to replace

---

### adjust

Propose a correction to a previous entry.

Message Type URI: `https://didcomm.org/ledger/1.0/adjust`

```json
{
  "type": "https://didcomm.org/ledger/1.0/adjust",
  "id": "adjust-p7q8r9",
  "thid": "create-a1b2c3",
  "to": ["did:peer:bob"],
  "from": "did:peer:alice",
  "body": {
    "entry": {
      "entry_id": "ent_adj_9d7e...",
      "ledger_id": "ldg_7f9a2b...",
      "seq": 6,
      "prev_hash": "base64url(...)",
      "type": "adjustment",
      "paid_by": "did:peer:alice",
      "amount": {
        "quantity": "2500",
        "display": { "currency": "USD", "value": "25.00" }
      },
      "split": {
        "type": "equal",
        "among": ["did:peer:alice", "did:peer:bob"]
      },
      "description": "Groceries (corrected)",
      "category": "food",
      "occurred_at": "2026-01-20T18:30:00Z",
      "timestamp": 1737484800000,
      "ref_entry_id": "ent_3c68ca...",
      "signature": "<DID-JWS>",
      "entry_hash": "base64url(...)"
    }
  }
}
```

**Processing:**
1. Verify `ref_entry_id` points to an existing entry in this ledger
2. Void the referenced entry (transition to `voided`)
3. Process the adjustment as a new entry (follows normal `entry` validation)
4. Requires `ack` from other participants like any entry

---

### settle

Propose settling the outstanding balance.

Message Type URI: `https://didcomm.org/ledger/1.0/settle`

```json
{
  "type": "https://didcomm.org/ledger/1.0/settle",
  "id": "settle-s1t2u3",
  "thid": "create-a1b2c3",
  "to": ["did:peer:alice"],
  "from": "did:peer:bob",
  "body": {
    "ledger_id": "ldg_7f9a2b...",
    "balance_snapshot": {
      "did:peer:alice": "1250",
      "did:peer:bob": "-1250"
    },
    "settlement_plan": [
      {
        "from": "did:peer:bob",
        "to": "did:peer:alice",
        "quantity": "1250",
        "display": { "currency": "USD", "value": "12.50" }
      }
    ],
    "partial": false,
    "as_of_seq": 12,
    "as_of_hash": "base64url(...)"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger_id` | string | Yes | The ledger being settled |
| `balance_snapshot` | object | Yes | Net balance per participant at time of settlement |
| `settlement_plan` | array | Yes | List of transfers needed |
| `partial` | boolean | Yes | Whether this settles only part of the balance |
| `as_of_seq` | number | Yes | Sequence number the balance was computed from |
| `as_of_hash` | string | Yes | Hash of the entry at `as_of_seq` (integrity check) |

**Processing:**
1. Creditor verifies `balance_snapshot` by recomputing from confirmed entries up to `as_of_seq`
2. Creditor verifies `as_of_hash` matches their entry at that sequence
3. If agreed, each line in `settlement_plan` triggers a Payments 1.0 `handshake-request` with `pthid` set to the ledger `thid`
4. Transition ledger to `settling` state

---

### settle-confirm

Confirm that a settlement payment has been received.

Message Type URI: `https://didcomm.org/ledger/1.0/settle-confirm`

```json
{
  "type": "https://didcomm.org/ledger/1.0/settle-confirm",
  "id": "sconf-v4w5x6",
  "thid": "create-a1b2c3",
  "to": ["did:peer:bob"],
  "from": "did:peer:alice",
  "body": {
    "ledger_id": "ldg_7f9a2b...",
    "settle_id": "settle-s1t2u3",
    "payment_proof": {
      "session_id": "ps_4a2c...",
      "tx_ref": "0xTRANSACTION_HASH",
      "status": "settled"
    },
    "settlement_entry": {
      "entry_id": "ent_stl_5e6f...",
      "seq": 13,
      "prev_hash": "base64url(...)",
      "type": "settlement",
      "paid_by": "did:peer:bob",
      "amount": {
        "quantity": "1250",
        "display": { "currency": "USD", "value": "12.50" }
      },
      "split": {
        "type": "exact",
        "amounts": {
          "did:peer:alice": "1250"
        }
      },
      "description": "Settlement",
      "timestamp": 1737571200000,
      "ref_entry_id": null,
      "signature": "<DID-JWS>",
      "entry_hash": "base64url(...)"
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger_id` | string | Yes | The ledger |
| `settle_id` | string | Yes | References the `settle` message `id` |
| `payment_proof` | object | Yes | Payments session ID, transaction reference, and status |
| `settlement_entry` | Entry | Yes | Settlement entry to append to the ledger hash chain |

**Processing:**
1. Verify `payment_proof.session_id` corresponds to a completed Payments 1.0 flow
2. Verify the settlement entry amount matches the Payments receipt
3. Append settlement entry to the ledger
4. Both participants ack the settlement entry (follows normal ack flow)
5. Transition ledger back to `active`
6. Recompute balances

---

### sync-request

Request missing entries for reconciliation.

Message Type URI: `https://didcomm.org/ledger/1.0/sync-request`

```json
{
  "type": "https://didcomm.org/ledger/1.0/sync-request",
  "id": "sync-y7z8a9",
  "thid": "create-a1b2c3",
  "to": ["did:peer:bob"],
  "from": "did:peer:alice",
  "body": {
    "ledger_id": "ldg_7f9a2b...",
    "last_seq": 8,
    "last_hash": "base64url(...)"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger_id` | string | Yes | The ledger to sync |
| `last_seq` | number | Yes | Last sequence number the requester has |
| `last_hash` | string | Yes | Hash of the entry at `last_seq` (integrity check) |

---

### sync-response

Return missing entries.

Message Type URI: `https://didcomm.org/ledger/1.0/sync-response`

```json
{
  "type": "https://didcomm.org/ledger/1.0/sync-response",
  "id": "syncr-b1c2d3",
  "thid": "create-a1b2c3",
  "to": ["did:peer:alice"],
  "from": "did:peer:bob",
  "body": {
    "ledger_id": "ldg_7f9a2b...",
    "from_seq": 9,
    "entries": [
      { "...": "entry at seq 9" },
      { "...": "entry at seq 10" }
    ],
    "current_seq": 10,
    "current_hash": "base64url(...)"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger_id` | string | Yes | The ledger |
| `from_seq` | number | Yes | First sequence in the response |
| `entries` | array | Yes | Ordered list of entries with signatures and ack_signatures |
| `current_seq` | number | Yes | Responder's latest sequence |
| `current_hash` | string | Yes | Hash at `current_seq` |

**Processing:**
1. Verify `last_hash` matches to confirm shared history up to `last_seq`
2. If hashes diverge, respond with `problem-report(chain-diverged)` — manual reconciliation needed
3. Requester validates hash chain continuity of received entries
4. Requester processes and stores each entry, preserving existing ack signatures

---

### close

Propose closing the ledger.

Message Type URI: `https://didcomm.org/ledger/1.0/close`

```json
{
  "type": "https://didcomm.org/ledger/1.0/close",
  "id": "close-e4f5g6",
  "thid": "create-a1b2c3",
  "to": ["did:peer:bob"],
  "from": "did:peer:alice",
  "body": {
    "ledger_id": "ldg_7f9a2b...",
    "reason": "no-longer-needed",
    "final_balance": {
      "did:peer:alice": "0",
      "did:peer:bob": "0"
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ledger_id` | string | Yes | The ledger to close |
| `reason` | string | Yes | Reason for closing |
| `final_balance` | object | Yes | Balance at time of close request |

**Processing:**
1. If all balances are zero, any participant can close unilaterally
2. If balances are non-zero, ALL other participants must respond with an `ack` referencing the `close` message `id` in the `entry_id` field (repurposing the ack message as a general confirmation). This signals agreement to waive the outstanding balance or settle outside the protocol.
3. Transition ledger to `closed`
4. No further entries are accepted
5. If any participant sends a `reject` referencing the `close` message `id`, the close is denied and the ledger remains `active`

---

## Validation Rules

- **Hash chain**: Agents MUST verify `prev_hash` on every entry. Reject entries that break the chain.
- **Signature verification**: Agents MUST verify `signature` against the `from` DID before processing any entry.
- **Split math**: For `exact` splits, amounts MUST sum to `amount.quantity`. For `percentage`, values MUST sum to `100`. For `shares`, all values MUST be positive integers.
- **Sequence monotonicity**: `seq` MUST be strictly increasing. Reject entries with `seq <= last_known_seq`.
- **Balance integrity**: On `settle`, the creditor MUST independently recompute the balance from confirmed entries and verify it matches `balance_snapshot`.
- **Settlement proof**: `settle-confirm` MUST reference a valid Payments 1.0 `session_id`. Agents SHOULD verify the payment amount matches.
- **Participant membership**: Only ledger participants can send entries. Reject messages from non-participants.
- **Idempotency**: Duplicate `entry_id` values MUST be rejected.
- **TTL enforcement**: Entries in `pending` state longer than `entry_ttl_days` SHOULD be auto-voided.

---

## Errors (Problem-Report codes)

Use standard DIDComm problem-report with these codes:
- `ledger-not-found` — Referenced ledger does not exist
- `entry-not-found` — Referenced entry does not exist
- `chain-broken` — `prev_hash` does not match expected value
- `chain-diverged` — Sync detected incompatible history
- `signature-invalid` — Entry or ack signature verification failed
- `split-invalid` — Split amounts/percentages do not sum correctly
- `sequence-invalid` — Entry `seq` is not the expected next value
- `balance-mismatch` — Settlement `balance_snapshot` does not match computed balance
- `not-participant` — Sender is not a member of this ledger
- `duplicate-entry` — Entry with this `entry_id` already exists
- `ledger-closed` — Ledger is closed; no further entries accepted
- `settlement-in-progress` — Cannot modify ledger while settling
- `entry-expired` — Entry TTL has elapsed

---

## Storage (Suggested Records)

- **LedgerRecord**: `ledger_id`, `name`, `participants[]`, `currency`, `rules`, `status`, `created_at`, `current_seq`, `current_hash`
- **EntryRecord**: `entry_id`, `ledger_id`, `seq`, `prev_hash`, `type`, `paid_by`, `amount`, `split`, `description`, `category`, `timestamp`, `signature`, `ack_signatures{}`, `status`, `entry_hash`
- **BalanceCache**: `ledger_id`, `participant_did`, `net_balance_quantity`, `last_computed_seq` (optimization; MUST be recomputable from entries)

---

## Implementations

Name / Link | Implementation Notes
--- | ---
Ajna Browser | Reference implementation

---

## Endnotes

### Future Considerations

- Recurring expense templates (e.g., monthly rent auto-entries)
- Multi-currency ledgers with FX rate snapshots per entry
- Ledger merging (combine two bilateral ledgers into a group ledger)
- Export to standard accounting formats (CSV, OFX)
- Integration with Vaults 1.0 for encrypted ledger archival
- Mediator-assisted sync for always-offline agents
- Verifiable credential receipts for settled amounts
- AI-assisted categorization and split suggestions
