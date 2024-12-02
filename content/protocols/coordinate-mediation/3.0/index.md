---
title: Coordinate Mediation
publisher: rodolfomiranda
license: MIT
piuri: https://didcomm.org/coordinate-mediation/3.0
status: Production
summary: A protocol to coordinate mediation configuration between a mediating agent and the recipient.
tags: []
authors:
  - name:
    email:


---

# Motivation
Use of the forward message in the Routing Protocol 3.0 requires an exchange of information. The _Recipient_ must know which endpoint and routing did(s) to share, and the _Mediator_ needs to know which did should be routed via this relationship.

## Roles
There are two roles in this protocol: 

- `mediator`: The agent that will be receiving `forward` messages on behalf of the _recipient_.
- `recipient`: The agent for whom the `forward` message payload is intended.

## Requirements

The `return_route` extension must be supported by both agents (`recipient` and `mediator`).
The common use of this protocol is for the reply messages from the `mediator` to be synchronous, utilizing the same connection channel for the reply. In order to have this synchronous behavior the `recipient` should specify `return_route` header to `all`.
This header must be set each time the communication channel is established: once per established websocket, and every message for an HTTP POST.

## Connectivity

This protocol consists of three different message requests from the `recipient` that should be replied by the `mediator`:

1. Mediate Request -> Mediate Grant or Mediate Deny
2. Recipient Update -> Recipient Update Response
3. Recipient Query -> Recipient

## States

This protocol follows the request-response message exchange pattern, and only requires the simple state of waiting for a response or to produce a response.

## Basic Walkthrough

A `recipient` may discover an agent capable of routing using the Discover Features Protocol 2.0. If protocol is supported with the `mediator`, a `recipient` may send a `mediate-request` to initiate a routing relationship.

First, the `recipient` sends a `mediate-request` message to the `mediator`. If the `mediator` is willing to route messages, it will respond with a `mediate-grant` message, otherwise with a `mediate-deny` message. The `recipient` will share the routing information in the grant message with other contacts.

When a new DID is used by the `recipient`, it must be registered with the `mediator` to enable route identification. This is done with a `recipient-update` message.

The `recipient-update` and `recipient-query` methods are used over time to identify and remove DIDs that are no longer in use by the `recipient`.

## Design By Contract

No protocol specific errors exist. Any errors related to headers or other core features are documented in the appropriate places.

## Security

This protocol expects messages to be encrypted during transmission, and repudiable. 

## Composition

Supported Goal Code | Notes
--- | ---

## Message Reference

### Mediate Request
This message serves as a request from the `recipient` to the `mediator`, asking for the permission (and routing information) to publish the endpoint as a mediator.

Message Type URI: `https://didcomm.org/coordinate-mediation/3.0/mediate-request`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/3.0/mediate-request",
}
```

### Mediate Deny
This message serves as notification of the `mediator` denying the `recipient`'s request for mediation.

Message Type URI: `https://didcomm.org/coordinate-mediation/3.0/mediate-deny`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/3.0/mediate-deny",
}
```

### Mediate Grant
A mediate grant message is a signal from the `mediator` to the `recipient` that permission is given to distribute the included information as an inbound route.

Message Type URI: `https://didcomm.org/coordinate-mediation/3.0/mediate-grant`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/3.0/mediate-grant",
    "body": 
            {
                "routing_did": ["did:peer:0z6Mkfriq1MqLBoPWecGoDLjguo1sB9brj6wT3qZ5BxkKpuP6"]
            }
}
```
where:

- `routing_did`: DID of the mediator where forwarded messages should be sent. The `recipient` may use this DID as an enpoint as explained in [Using a DID as an endpoint](https://identity.foundation/didcomm-messaging/spec/#using-a-did-as-an-endpoint) section of the specification.

**NOTE**: After receiving a `mediate-grant` message the `recipient` should update his `recipient_did` with a `recipient-update` message and add DIDs. In order for the `mediator` to start accepting Forward Message for those DIDs.

### Recipient Update
Used to notify the `mediator` of DIDs in use by the `recipient`.

Message Type URI: `https://didcomm.org/coordinate-mediation/3.0/recipient-update`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/3.0/recipient-update",
    "body": {
        "updates": [
            {
                "recipient_did": "did:peer:0z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
                "action": "add"
            }
        ]
    },
    "return_route": "all"
}
```
where:

- `recipient_did`: DID subject of the update.
- `action`: one of `add` or `remove`.

### Recipient Response
Confirmation of requested Recipient DID updates.

Message Type URI: `https://didcomm.org/coordinate-mediation/3.0/recipient-update-response`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/3.0/recipient-update-response",
    "body": {
        "updated": [
            {
                "recipient_did": "did:peer:0z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
                "action": "" // "add" or "remove"
                "result": "" // [client_error | server_error | no_change | success]
            }
        ]
    }
}
```
where:

- `recipient_did`: DID subject of the update.
- `action`: one of `add` or `remove`.
- `result`: one of `client_error`, `server_error`, `no_change`, `success`; describes the resulting state of the Recipient update.

### Recipient Query
Query `mediator` for a list of DIDs registered for this connection.

Message Type URI: `https://didcomm.org/coordinate-mediation/3.0/recipient-query`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/3.0/recipient-query",
    "body": {
        "paginate": {
            "limit": 30,
            "offset": 0
        }
    }
}
```
where:

- `paginate`: is optional, and if present must include `limit` and `offset`.

### Recipient 
Response to recipient query, containing retrieved recipient DIDs.

Message Type URI: `https://didcomm.org/coordinate-mediation/3.0/recipient`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/3.0/recipient",
    "body": {
        "dids": [
            {
                "recipient_did": "did:peer:0z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
            }
        ],
        "pagination": {
            "count": 30,
            "offset": 30,
            "remaining": 100
        }
    }
}
```
where:

- `pagination`: is optional, and if present must include `count`, `offset` and `remaining`.

## L10n

No localization is required.

## Implementations

## Endnotes

### Future Considerations
- Should we allow listing dids by date? You could query dids in use by date?
- We are missing a way to check a single did (or a few dids) without doing a full list.
- Mediation grant supports only one endpoint. What can be done to support multiple endpoint options i.e. http, ws, etc.
- Requiring proof of did ownership (with a signature) would prevent an edge case where a malicious party registers a did for another party at the same mediator, and before the other party.
- How do we express terms and conditions for mediation?
