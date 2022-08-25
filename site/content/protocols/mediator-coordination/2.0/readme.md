---
title: Mediator Coordinator
publisher: rodolfomiranda
license: MIT
piuri: https://didcomm.org/coordinate-mediation/2.0
status: Production
summary: A protocol to coordinate mediation configuration between a mediating agent and the recipient.
tags: []
authors:
  - name:
    email:


---

# Motivation
Use of the forward message in the Routing Protocol 2.0 requires an exchange of information. The _Recipient_ must know which endpoint and routing key(s) to share, and the _Mediator_ needs to know which keys should be routed via this relationship.

## Roles
There are two roles in this protocol: 

- `mediator`: The agent that will be receiving `forward` messages on behalf of the _recipient_.
- `recipient`: The agent for whom the `forward` message payload is intended.

## Connectivity

This protocol consists of three different message requests from the `recipient` that should be replied by the `mediator`:

1. Mediate Request -> Mediate Grant or Mediate Deny
2. Keylist Update -> Keylist Update Response
3. Keylist Query -> Keylist

## States

This protocol follows the request-response message exchange pattern, and only requerires the simple state of waiting for a response or to produce a response.

## Basic Walkthrough

A `recipient` may discover an agent capable of routing using the Discover Features Protocol 2.0. If protocol is supported with the `mediator`, a `recipient` may send a `mediate-request` to initiate a routing relationship.

First, the `recipient` sends a `mediate-request` message to the `mediator`. If the `mediator` is willing to route messages, it will respond with a `mediate-grant` message, otherwise with a `mediate-deny` message. The `recipient` will share the routing information in the grant message with other contacts.

When a new key is used by the `recipient`, it must be registered with the `mediator` to enable route identification. This is done with a `keylist-update` message.

The `keylist-update` and `keylist-query` methods are used over time to identify and remove keys that are no longer in use by the `recipient`.

## Design By Contract

No protocol specific errors exist. Any errors related to headers or other core features are documented in the appropriate places.

## Security

This protocol expects messages to be encrypted during transmission, and repudiable. 

## Composition

Supported Goal Code | Notes
--- | ---
                     |       
                     |       



## Message Reference

### Mediate Request
This message serves as a request from the `recipient` to the `mediator`, asking for the permission (and routing information) to publish the endpoint as a mediator.

Message Type URI: `https://didcomm.org/coordinate-mediation/2.0/mediate-request`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/2.0/mediate-request",
}
```

### Mediate Deny
This message serves as notification of the `mediator` denying the `recipient`'s request for mediation.

Message Type URI: `https://didcomm.org/coordinate-mediation/2.0/mediate-deny`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/2.0/mediate-deny",
    }
}
```

### Mediate Grant
A mediate grant message is a signal from the `mediator` to the `recipient` that permission is given to distribute the included information as an inbound route.

Message Type URI: `https://didcomm.org/coordinate-mediation/2.0/mediate-grant`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/2.0/mediate-grant",
    "body": 
            {
                "endpoint": "https://mediators-r-us.com",
                "routing_keys": ["did:peer:z6Mkfriq1MqLBoPWecGoDLjguo1sB9brj6wT3qZ5BxkKpuP6"]
            }
}
```
where:

- `endpoint`: the endpoint reported to mediation client connections.

- `routing_keys`: list of keys in intended routing order. Key used as recipient of forward messages.

### Keylist Update
Used to notify the `mediator` of keys in use by the `recipient`.

Message Type URI: `https://didcomm.org/coordinate-mediation/2.0/keylist-update`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/2.0/keylist-update",
    "body": 
            {
                "updates":  [
                                {
                                    "recipient_key": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
                                    "action": "add"
                                }
                            ]
            }
}
```
where:

- `recipient_key`: key subject of the update.
- `action`: one of `add` or `remove`.

### Keylist Response
Confirmation of requested keylist updates.

Message Type URI: `https://didcomm.org/coordinate-mediation/2.0/keylist-update-response`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/2.0/keylist-update-response",
    "body": 
            {
                "updated":  [
                                {
                                    "recipient_key": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
                                    "action": "" // "add" or "remove"
                                    "result": "" // [client_error | server_error | no_change | success]
                                }
                            ]
            }
}
```
where:

- `recipient_key`: key subject of the update.
- `action`: one of `add` or `remove`.
- `result`: one of `client_error`, `server_error`, `no_change`, `success`; describes the resulting state of the keylist update.

### Keylist Query
Query `mediator` for a list of keys registered for this connection.

Message Type URI: `https://didcomm.org/coordinate-mediation/2.0/keylist-query`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/2.0/keylist-query",
    "body": 
            {
                "paginate": {
                                "limit": 30,
                                "offset": 0
                            }
            }
}
```
where:

- `paginate`: is optional, and if present must include `limit` and `offset`.

### Keylist 
Response to key list query, containing retrieved keys.

Message Type URI: `https://didcomm.org/coordinate-mediation/2.0/keylist`

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/coordinate-mediation/2.0/keylist",
    "body": 
            {
                "keys": [
                            {
                                "recipient_key": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
                            }
                        ]
                "pagination":   {
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
- Should we allow listing keys by date? You could query keys in use by date?
- We are missing a way to check a single key (or a few keys) without doing a full list.
- Mediation grant supports only one endpoint. What can be done to support multiple endpoint options i.e. http, ws, etc.
- Requiring proof of key ownership (with a signature) would prevent an edge case where a malicious party registers a key for another party at the same mediator, and before the other party.
- How do we express terms and conditions for mediation?