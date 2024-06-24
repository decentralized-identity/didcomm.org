---
title: Message Pickup
publisher: JamesKEbert
license: MIT
piuri: https://didcomm.org/message-pickup/4.0
status: Production
summary: A protocol to facilitate an agent picking up messages held at a mediator.
tags: []
authors:
  - name: Sam Curren
    email: telegramsam@gmail.com
  - name: James Ebert
    email: james@jamesebert.dev

---

## Summary
A protocol to facilitate a _Recipient_ agent picking up messages held at a _Mediator_. This protocol is likely to be used in tandem with the [cooridinate-mediation protocol](https://didcomm.org/coordinate-mediation/3.0/).

## Motivation
This protocol is needed to facilitate retrieval of messages from a mediator in an explicit manner. Additionally, this protocol provides behavior for initiating live delivery of messages, which is crucial for good user experience for agents operating on mobile devices.

Motivation for v4 of this protocol stems from ambiguity in the [pickup v2 protocol](https://github.com/hyperledger/aries-rfcs/tree/main/features/0685-pickup-v2) and [messagepickup v3 protocol](https://didcomm.org/messagepickup/3.0/) as to whether `delivery` and `messages-received` messages must be used while using live mode. 

## Roles
There are two roles in this protocol: 

- `mediator`: The agent that has messages waiting for pickup by the `recipient`.
- `recipient`: The agent who is picking up messages from the `mediator`.

## Requirements

### Return Route
The `return_route` extension must be supported by both agents (`recipient` and `mediator`).
The common use of this protocol is for the reply messages from the `mediator` to be synchronous, utilizing the same connection channel for the reply. In order to have this synchronous behavior the `recipient` should specify `return_route` header to `all`.
This header must be set each time the communication channel is established: once per established websocket, and every message for an HTTP POST.

### DIDComm V1 Requirements
When using this protocol with DIDComm V1, `recipient_did` **MUST** be a [`did:key` reference](https://github.com/hyperledger/aries-rfcs/tree/main/features/0360-use-did-key).

## Basic Walkthrough

This protocol consists of four different message requests from the `recipient` that should be replied to by the `mediator`:

1. Status Request -> Status
2. Delivery Request -> Message Delivery
3. Message Received -> Status
4. Live Mode -> Status or Problem Report

## States

This protocol follows the request-response message exchange pattern, and only requires the simple state of waiting for a response or to produce a response. 

Additionally, the `return_route` header extension must be set to `all` in all request submitted by the `recipient`.

## Basic Walkthrough

The `status-request` message is sent by the `recipient` to the `mediator` to query how many messages are pending.

The `status` message is the response to `status-request` to communicate the state of the message queue.

The `delivery-request` message is sent by the `recipient` to request delivery of pending messages.

The `delivery` message is the response to the `delivery-request` to send queued messages back to the `recipient`.

The `messages-received` message is sent by the `recipient` to confirm receipt of delivered messages, prompting the `mediator` to clear messages from the queue.

The `live-delivery-change` message is used to set the state of `live_delivery`.

When _Live Mode_ is enabled, messages that arrive when an existing connection exists are delivered over the connection immediately, via a `delivery` message, rather than being pushed to the queue. See _Live Mode_ below for more details. 

## Security

This protocol expects messages to be encrypted during transmission, and repudiable. 

## Message Reference

### Status Request
Sent by the `recipient` to the `mediator` to request a `status` message.

Message Type URI: `https://didcomm.org/message-pickup/4.0/status-request`

DIDComm v1 example:
```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/message-pickup/4.0/status-request",
    "recipient_did": "<did:key for messages>",
    "~transport": {
        "return_route": "all"
    }
}
```

DIDComm v2 example:
```json
{
    "id": "123456780",
    "type": "https://didcomm.org/message-pickup/4.0/status-request",
    "body" : {
        "recipient_did": "<did for messages>"
    },
    "return_route": "all"
}
```
`recipient_did` is optional. When specified, the `mediator` **MUST** only return status related to that recipient did. This allows the `recipient` to discover if any messages are in the queue that were sent to a specific DID. If using DIDComm v1, `recipient_did` **MUST** be a [`did:key` reference](https://github.com/hyperledger/aries-rfcs/tree/main/features/0360-use-did-key).

### Status
Status details about waiting messages.

Message Type URI: `https://didcomm.org/message-pickup/4.0/status`

DIDComm v1 example:
```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/message-pickup/4.0/status",
    "~thread": {
        "thid": "<message id of status-request message>"
    },
    "recipient_did": "<did:key for messages>",
    "message_count": 7,
    "longest_waited_seconds": 3600,
    "newest_received_time": 1658085169,
    "oldest_received_time": 1658084293,
    "total_bytes": 8096,
    "live_delivery": false
}
```

DIDComm v2 example:
```json
{
    "id": "123456780",
    "thid": "<message id of status-request message>",
    "type": "https://didcomm.org/message-pickup/4.0/status",
    "body": {
        "recipient_did": "<did for messages>",
        "message_count": 7,
        "longest_waited_seconds": 3600,
        "newest_received_time": 1658085169,
        "oldest_received_time": 1658084293,
        "total_bytes": 8096,
        "live_delivery": false
    }
}
```

`message_count` is the only **REQUIRED** attribute. The others **MAY** be present if offered by the `mediator`.

`longest_waited_seconds` is in seconds, and is the longest delay of any message in the queue.

`newest_received_time` and `oldest_received_time` are expressed in UTC Epoch Seconds (seconds since 1970-01-01T00:00:00Z) as an integer.

`total_bytes` represents the total size of all messages.

If a `recipient_did` was specified in the `status-request` message, the matching value **MUST** be specified in the `recipient_did` attribute of the status message.

`live_delivery` state is also indicated in the status message.

**Note**: due to the potential for confusing what the actual state of the message queue is, a `status` message **MUST NOT** be put on the pending message queue and **MUST** only be sent when the `recipient` is actively connected (HTTP request awaiting response, WebSocket, etc.).


### Delivery Request
A request from the `recipient` to the `mediator` to have pending messages delivered.

Message Type URI: `https://didcomm.org/message-pickup/4.0/delivery-request`

DIDComm v1 example:
```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/message-pickup/4.0/delivery-request",
    "limit": 10,
    "recipient_did": "<did:key for messages>",
    "~transport": {
        "return_route": "all"
    }
}
```

DIDComm v2 example:
```json
{
    "id": "123456780",
    "type": "https://didcomm.org/message-pickup/4.0/delivery-request",
    "body": {
        "limit": 10,
        "recipient_did": "<did for messages>"
    },
    "return_route": "all"
}
```

`limit` is a **REQUIRED** attribute, and after receipt of this message, the `mediator` **SHOULD** deliver up to the limit indicated.

`recipient_did` is optional. When specified, the `mediator` **MUST** only return messages sent to that recipient did.

If no messages are available to be sent, a `status` message **MUST** be sent immediately.

Delivered messages **MUST NOT** be deleted until delivery is acknowledged by a `messages-received` message.

### Message Delivery
Batch of messages delivered to the `recipient` as attachments.

Message Type URI: `https://didcomm.org/message-pickup/4.0/delivery`

DIDComm v1 example:
```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/message-pickup/4.0/delivery",
    "~thread": {
        "thid": "<message id of delivery-request message>"
    },
    "recipient_did": "<did:key for messages>",
    "~attach": [{
        "@id": "<id of message>",
        "data": {
            "base64": "<message>"
        }
    }]
}
```

DIDComm v2 example:
```json
{
    "id": "123456780",
    "thid": "<message id of delivery-request message>",
    "type": "https://didcomm.org/message-pickup/4.0/delivery",
    "body": {
        "recipient_did": "<did for messages>"
    },
    "attachments": [{
        "id": "<id of message>",
        "data": {
            "base64": "<message>"
        }
    }]
}
```

Messages delivered from the queue must be delivered in a batch delivery message as attachments, with a batch size specified by the `limit` provided in the `delivery-request` message.
The `id` of each attachment is used to confirm receipt.
The `id` is an opaque value, and the recipient should not deduce any information from it, except that it is unique to the mediator. The recipient can use the `id`s in the `message_id_list` field of `messages-received`.

The ONLY valid type of attachment for this message is a DIDComm v1 or v2 Message in encrypted form.

`thid` -- an optional field if the delivery message is in response to a singular `delivery-request` messsage.

The `recipient_did` attribute is only included when responding to a `delivery-request` message that indicates a `recipient_did`.

### Messages Received
After receiving messages, the `recipient` **MUST** send an acknowledge message indiciating which messages are safe to clear from the queue.

Message Type URI: `https://didcomm.org/message-pickup/4.0/messages-received`

DIDComm v1 example:
```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/message-pickup/4.0/messages-received",
    "message_id_list": ["123","456"]
}
```

DIDComm v2 example:
```json
{
    "id": "123456780",
    "type": "https://didcomm.org/message-pickup/4.0/messages-received",
    "body": {
        "message_id_list": ["123","456"]
    }
}
```

`message_id_list` is a list of `ids` of each message received. The `id` of each message is present in the attachment descriptor of each attached message of a delivery message.

Upon receipt of this message, the `mediator` knows which messages have been received, and can remove them from the collection of queued messages with confidence.

#### Multiple Recipients

If a message arrives at a `mediator` addressed to multiple `recipients`, the message **MUST** be queued for each `recipient` independently. If one of the addressed `recipients` retrieves a message and indicates it has been received, that message **MUST** still be held and then removed by the other addressed `recipients`.


### Live Mode
_Live Mode_ is the practice of delivering newly arriving messages directly to a connected `recipient`. It is disabled by default and only activated by the `recipient`. Messages that arrive when _Live Mode_ is off **MUST** be stored in the queue for retrieval as described above. If _Live Mode_ is active, and the connection is broken, a new inbound connection starts with _Live Mode_ disabled.

Messages already in the queue are not affected by _Live Mode_; they **MUST** still be requested with `delivery-request` messages.

_Live Mode_ **MUST** only be enabled when a persistent transport is used, such as WebSockets.

If _Live Mode_ is active, messages still **MUST** be delivered via a `delivery` message and the `recipient` **MUST** send an acknowledgement message `messages-received`. If a message is not acknowledged, the message **MUST** be added to the queue for later pickup.

Recipients have three modes of possible operation for message delivery with various abilities and level of development complexity:

1. Never activate _Live Mode_. Poll for new messages with a `status_request` message, and retrieve them when available.
2. Retrieve all messages from queue, and then activate _Live Mode_. This simplifies message processing logic in the `recipient`.
3. Activate _Live Mode_ immediately upon connecting to the `mediator`. Retrieve messages from the queue as possible. When receiving a message delivered live, the queue may be queried for any waiting messages delivered to the same did for processing.
### Live Mode Change
_Live Mode_ is changed with a `live-delivery-change` message.

Message Type URI: `https://didcomm.org/message-pickup/4.0/live-delivery-change`

DIDComm v1 example:
```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/message-pickup/4.0/live-delivery-change",
    "live_delivery": true
}
```

DIDComm v2 example:
```json
{
    "id": "123456780",
    "type": "https://didcomm.org/message-pickup/4.0/live-delivery-change",
    "body": {
        "live_delivery": true
    }
}
```

Upon receiving the `live_delivery_change` message, the `mediator` **MUST** respond with a `status` message.

If sent with `live_delivery` set to true on a connection incapable of live delivery, a `problem_report` **SHOULD** be sent as follows:

DIDComm v1 example:
```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/message-pickup/4.0/problem-report",
    "~thread": {
        "pthid": "<the value is the thid of the thread in which the problem occurred>"
    },
    "description": {
        "code": "e.m.live-mode-not-supported",
        "en": "Connection does not support Live Delivery"
    }
}
```

DIDComm v2 example:
```json
{
    "id": "123456780",
    "type": "https://didcomm.org/message-pickup/4.0/problem-report",
    "pthid": "<the value is the thid of the thread in which the problem occurred>",
    "body": {
        "code": "e.m.live-mode-not-supported",
        "comment": "Connection does not support Live Delivery"
    }
}
```

## L10n

No localization is required.

## Implementations

Name / Link | Implementation Notes
--- | --- 

## Endnotes

### Future Considerations
The style of wrapping messages in a `delivery` message incurs an additional roughly 33% increased message size due to wrapping of the message. This size bloating is outweighed by the benefit of having explicit and gauranteed delivery of messages. This issue may be resolved in future versions of DIDComm.

Should there be a strategy for a `mediator` to indicate support for _Live Mode_ via discover features?