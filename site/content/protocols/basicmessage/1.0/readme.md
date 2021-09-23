---
title: BasicMessage
publisher: Sam Curren
license: MIT
piuri: https://didcomm.org/basicmessage/1.0
status: Production
summary: The BasicMessage protocol describes a stateless, easy to support user message protocol. It has a single message type used to communicate.
tags:
  - faster-than-light-travel
  - star-wars
authors:
  - name: Sam Curren
    email: telegramsam@gmail.com

---

## Roles

There are two roles in this protocol: `sender` and `receiver`. It is anticipated that both roles are supported by agents that provide an interface for humans, but it is possible for an agent to only act as a sender (do not process received messages) or a receiver (will never send messages).

## Connectivity

TODO: Describe any assumptions about simplex vs. duplex, which parties need to talk to which parties, etc.

## States

There are not really states in this protocol, as sending a message leaves both parties in the same state they were before.

## Basic Walkthrough

Using this protocol, either party can send a message to the other at any time. There are no rules about taking turns or requiring a response.

Messages are assumed to be made visible to the recipient or evaluated by automated processes.

## Design By Contract

No protocol specific errors exist. Any errors related to headers or other core features are documented in the appropriate places.

## Security

TODO: What abuse could occur with malicious participants, eavesdroppers, denial-of-service, etc? What should be true about the [message trust contexts](https://github.com/hyperledger/aries-rfcs/blob/master/concepts/0029-message-trust-contexts/README.md)? What should be [repudiable or non-repudiable](https://github.com/hyperledger/aries-rfcs/blob/master/concepts/0049-repudiation/README.md)? What mechanisms does the protocol offer to cope with such issues?

## Composition

Supported Goal Code | Notes
--- | ---
                     |       
                     |       



## Message Reference

**message**

Message Type URI: `https://didcomm.org/basicmessage/1.0/message`

The `message` message is sent by the `sender` to the `recipient`. Note that the role is only specific to the creation of messages, and that both parties may play both roles.

Attributes:

`content` - content of the user intended message.

Supported decorators/headers:

- The message should indicate the language used in the message. DIDComm V1 and DIDComm V2 have different methods for this. See examples below.
- The time the message is sent must be included. DIDComm V2 uses the `created_time` header. DIDComm V1 must include a `sent_time` as a message attribute containing the timestamp in ISO 8601 UTC format.

DIDComm V1 Example:

```json
{
    "@id": "123456780",
    "@type": "https://didcomm.org/basicmessage/1.0/message",
    "~l10n": { "locale": "en" },
    "sent_time": "2019-01-15 18:42:01Z",
    "content": "Your hovercraft is full of eels."
}
```

DIDComm V2 Example:

```json
{
    "id": "123456780",
    "type": "https://didcomm.org/basicmessage/1.0/message",
    "lang": "en",
    "created_time": 1547577721,
    "body": {
        "content": "Your hovercraft is full of eels."
    }
}
```



## L10n

The language  SHOULD be specified according to the method used in the DIDComm base protocol version.

## Implementations

## Endnotes

#### 1 Out of Scope
There are many useful features of user messaging systems that we will not be adding to this protocol. We anticipate the development of more advanced and full-featured message protocols to fill these needs. Features that are considered out of scope for this protocol include:

- read receipts
- emojii responses
- typing indicators
- message replies (threading)
- multi-party (group) messages
- attachments
