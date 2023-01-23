---
title: Pickup
publisher: rodolfomiranda
license: MIT
piuri: https://didcomm.org/messagepickup/3.0
status: Production
summary: A protocol to facilitate an agent picking up messages held at a mediator.
tags: []
authors:
  - name: Sam Curren
    email: telegramsam@gmail.com
  - name: James Ebert
    email: james.ebert@indicio.tech

---

# Motivation
Messages can be picked up simply by sending a message to the _Mediator_ with a `return_route` header specified. This mechanism is implicit, and lacks some desired behavior made possible by more explicit messages.

This protocol is the explicit companion to the implicit method of picking up messages.

## Roles
There are two roles in this protocol: 

- `mediator`: The agent that has messages waiting for pickup by the `recipient`.
- `recipient`: The agent who is picking up messages from the `mediator`.

## Connectivity

This protocol consists of three different message requests from the `recipient` that should be replied to by the `mediator`:

1. Status Request -> Status
2. Delivery Request -> Message Delivery
3. Message Received -> Status
4. Live Mode  -> Status or Problem Report

## States

This protocol follows the request-response message exchange pattern, and only requires the simple state of waiting for a response or to produce a response. 

Additionally, the `return_route` header extension must be set to `all` in all request submitted by the `recipient`.

## Basic Walkthrough

The `status-request` message is sent by the `recipient` to the `mediator` to query how many messages are pending.

The `status` message is the response to `status-request` to communicate the state of the message queue.

The `delivery-request` message is sent by the `recipient` to request delivery of pending messages.

The `message-delivery` message is the response to the `delivery-request` to send queued messages back to the `recipient`.

The `message-received` message is sent by the `recipient` to confirm receipt of delivered messages, prompting the `mediator` to clear messages from the queue.

The `live-delivery-change` message is used to set the state of `live_delivery`.

When _Live Mode_ is enabled, messages that arrive when an existing connection exists are delivered over the connection immediately, rather than being pushed to the queue. See _Live Mode_ below for more details.

## Security

This protocol expects messages to be encrypted during transmission, and repudiable. 

## Message Reference

### Status Request
Sent by the `recipient` to the `mediator` to request a `status` message.

Message Type URI: `https://didcomm.org/messagepickup/3.0/status-request`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/messagepickup/3.0/status-request",
    "body" : {
        "recipient_did": "<did for messages>"
    },
    "return_route": "all"
}
```
`recipient_did` is optional. When specified, the `mediator` **MUST** only return status related to that recipient did. This allows the `recipient` to discover if any messages are in the queue that were sent to a specific did. 

### Status
Status details about waiting messages.

Message Type URI: `https://didcomm.org/messagepickup/3.0/status`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/messagepickup/3.0/status",
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

If a `recipient_did` was specified in the `status-request message`, the matching value **MUST** be specified in the `recipient_did` attribute of the status message.

`live_delivery` state is also indicated in the status message.

**Note**: due to the potential for confusing what the actual state of the message queue is, a status message **MUST NOT** be put on the pending message queue and **MUST** only be sent when the `recipient` is actively connected (HTTP request awaiting response, WebSocket, etc.).


### Delivery Request
A request from the `recipient` to the `mediator` to have pending messages delivered.

Message Type URI: `https://didcomm.org/messagepickup/3.0/delivery-request`

```json
{
    "id": "123456780",
    "type": "ttps://didcomm.org/messagepickup/3.0/delivery-request",
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

Delivered messages **MUST NOT** be deleted until delivery is acknowledged by a messages-received message.

### Message Delivery
Batch of messages delivered to the `recipient` as attachments.

Message Type URI: `https://didcomm.org/messagepickup/3.0/delivery`

```json
{
    "id": "123456780",
    "thid": "<message id of delivery-request message>",
    "type": "https://didcomm.org/messagepickup/3.0/delivery",
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
Messages delivered from the queue must be delivered in a batch delivery message as attachments, with a batch size specified by the `limit` provided in the `delivery-request` message. The `id` of each attachment is used to confirm receipt. The `id` is an opaque value, and the `recipient` should not infer anything from the value.

The ONLY valid type of attachment for this message is a DIDComm v2 Message in encrypted form.

The `recipient_did` attribute is only included when responding to a `delivery-request` message that indicates a `recipient_did`.

### Messages Received
After receiving messages, the `recipient` sends an acknowledge message indiciating which messages are safe to clear from the queue.

Message Type URI: `https://didcomm.org/messagepickup/3.0/messages-received`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/messagepickup/3.0/messages-received",
    "body": {
        "message_id_list": ["123","456"]
    }
}
```
`message_id_list` is a list of `ids` of each message received. The `id` of each message is present in the attachment descriptor of each attached message of a delivery message.

Upon receipt of this message, the `mediator` knows which messages have been received, and can remove them from the collection of queued messages with confidence. The `mediator` **SHOULD** send an updated `status` message reflecting the changes to the queue.

#### Multiple Recipients

If a message arrives at a `mediator` addressed to multiple `recipients`, the message **MUST** be queued for each `recipient` independently. If one of the addressed `recipients` retrieves a message and indicates it has been received, that message **MUST** still be held and then removed by the other addressed `recipients`.


### Live Mode
_Live Mode_ is the practice of delivering newly arriving messages directly to a connected `recipient`. It is disabled by default and only activated by the `recipient`. Messages that arrive when _Live Mode_ is off **MUST** be stored in the queue for retrieval as described above. If _Live Mode_ is active, and the connection is broken, a new inbound connection starts with _Live Mode_ disabled.

Messages already in the queue are not affected by _Live Mode_; they must still be requested with `delivery-request` messages.

_Live Mode_ **MUST** only be enabled when a persistent transport is used, such as WebSockets.

Recipients have three modes of possible operation for message delivery with various abilities and level of development complexity:

1. Never activate _Live Mode_. Poll for new messages with a `status_request` message, and retrieve them when available.
2. Retrieve all messages from queue, and then activate _Live Mode_. This simplifies message processing logic in the `recipient`.
3. Activate _Live Mode_ immediately upon connecting to the `mediator`. Retrieve messages from the queue as possible. When receiving a message delivered live, the queue may be queried for any waiting messages delivered to the same did for processing.
### Live Mode Change
_Live Mode_ is changed with a `live-delivery-change` message.

Message Type URI: `https://didcomm.org/messagepickup/3.0/live-delivery-change`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/messagepickup/3.0/live-delivery-change",
    "body": {
        "live_delivery": true
    }
}
```
Upon receiving the `live_delivery_change` message, the `mediator` **MUST* respond with a `status` message.

If sent with `live_delivery` set to true on a connection incapable of live delivery, a `problem_report` **SHOULD** be sent as follows:

```json
{
  "id": "123456780",
  "type": "https://didcomm.org/report-problem/2.0/problem-report",
  "pthid": "< the value is the thid of the thread in which the problem occurred>",
  "body": {
        "code": "e.m.live-mode-not-supported",
        "comment": "Connection does not support Live Delivery"
  }
}
```

## L10n

No localization is required.

## Implementations

## Endnotes