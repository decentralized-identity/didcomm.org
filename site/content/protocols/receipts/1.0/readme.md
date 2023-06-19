---
title: Receipts
publisher: genaris
license: MIT
piuri: https://didcomm.org/receipts/1.0
status: Demonstrated
summary: A protocol to allow a recipient to provide information about the processing of a message to the sender, letting it to keep track of its state.

tags: []
authors:
  - name: Ariel Gentile
    email: a@2060.io
---

## Summary

A protocol to allow a recipient to provide information about the processing of a message to the sender, letting it to keep track of its state.

This protocol is intended to be used as a complement of any existing DIDComm protocol where it could be relevant to know whether the final user has seen or taken an specific action for a given message.

## Motivation

Although not a feature required or even desired by some users, all modern chat applications that can be seen nowadays include some sort of read receipts, useful for users to get feedback about the other party to have received or seen messages they have sent to them. Therefore, by defining a standard procedure for agents to set up their requirements on receipts of a particular, a set or all messages sent to a party, it is possible to build rich chat applications on top of DIDComm.

The scope of this protocol is not limited to particular types of messages, so it is meant to be used as a complement to any other protocol where receipts are applicable or meaningful.

## Roles

There are two roles in this protocol:

- `requester` - The agent requesting receipts for messages it sends
- `responder` - The agent that receives messages and sends back receipts depending on user actions
 
## Basic Walkthrough

The protocol has two phases: setup and execution.

#### Setup phase

In order for an agent to receive receipts from another one, it must express their will. This can be simply achieved by sending the generic and explicit `Request Receipts` message, where it defines which kind of messages it wants to receive receipts for. 

It is enough to send this message only once through the lifecycle of a DIDComm connection, unless the _requester_ agent wants to change the paramaters.

Another way of expressing the desire of receiving receipts can be the usage of an specific decorator for each sent message that requires so. 

> **TODO**: Define decorator/DIDComm extension for receipts for individual messages

#### Execution phase

This phase is where agents usually spend most of the time. It consists on a single message where the _responder_ sends a single or multiple receipts, corresponding to messages previously sent by the _requester_.

There might be more than a receipt per message. Agent receiving them must order them by their timestamp.

![](receipts-flow.png)
<!--
```plantuml
@startuml
title Message Receipts flow example

participant "Requester" as SA
participant "Responder" as RA
actor "User" as User

SA -> RA: message_id = sendMessage(msg)
RA -> SA: sendReceipt(message_id, "Received")
RA -> User: Notify about \nmessage received
...
User -> RA: Read message
RA -> SA: sendReceipt(message_id, "Viewed")
...
User -> RA: Delete message
RA -> SA: sendReceipt(message_id, "Deleted")


@enduml
```
-->

## Message States

Based on modern chat applications, the following states are defined as a minimal set for this protocol to be meaningful:

- `received`: recipient agent has processed the message and made it available to see by the user
- `viewed`: user on recipient end has seen the message (or the outcomes from it). It must have necessarily passed by the `received` state
- `deleted`: user on recipient end has explicitly selected to delete the message. It must have necessarily passed by the `received` state

## Message Reference

This section explains the structure of the different messages defined for this protocol.

### Request Receipts

This message is used for a party to indicate to another one which message receipts they are insterested to receive, based on the message types.

Description of the fields:

- `requested_receipts`: Array containing all the relevant message types and supported states for each. Items are objects with the following fields:
  - `message_type`: Full URI for the message type. It's possible to use wildcards, i.e. for requesting receipts for every message of a particular protocol
  - `states`: Optional list of interested states for this type. If not set, recipient agent will send receipts for any state

If an agent wants to change its receipts preference, it must send this message again containing the new array. 

To entirely disable receipts, `requested_receipts` must be an empty array

**Note**: 
> Not every type of message is applicable for receipts. For instance, `Message Receipts` message, as doing so would result in an infinite loop of receipts.

DIDComm v1 example:

```json
{
    "@id": "8ba049e6-cc46-48fb-bfe0-463084d66324",
    "@type": "<baseuri>/request-receipts",
    "requested_receipts": [
        {
            "message_type": "https://baseUri/protocol/1.0/message",
            "states": ["Received", "Viewed"]
        },
        {
            "message_type": "https://baseUri/protocol/1.0/*",
            "states": ["Received", "Viewed", "Deleted"]
        },        
        ...
    ]
}
```

DIDComm v2 example:

```json
{
    "@id": "8ba049e6-cc46-48fb-bfe0-463084d66324",
    "@type": "<baseuri>/request-receipts",
    "body": {
        "requested_receipts": [
        {
            "message_type": "https://baseUri/protocol/1.0/message",
            "states": ["Received", "Viewed"]
        },
        {
            "message_type": "https://baseUri/protocol/1.0/*",
            "states": ["Received", "Viewed", "Deleted"]
        },        
        ...
    ]},
}
```


### Message Receipts

Through this message, an arbitrary number of Messsage Receipts can be transmitted. 

Description of the fields:

- `receipts`: Array containing receipt entries. Items are objects with the following fields:
  - `message_id`: originating message id
  - `state`: message state
  - `timestamp`: time when the message state has been changed. Expressed in UTC Epoch seconds

DIDComm v1 example: 

```json
{
    "@id": "8ba049e6-cc46-48fb-bfe0-463084d66324",
    "@type": "<baseuri>/message-receipts",
    "receipts": [ 
        {
            "message_id": "3c68cad6-00bd-496d-8cc6-4a188cb086b0",
            "state": "viewed",
            "timestamp": "1687215606",
        },
        {
            "message_id": "7f960bac-42f4-4a95-9997-752f2e0ed65d",
            "state": "received",
            "timestamp": "1687215606",
        },        
        ...
     ]
}
```

DIDComm v2 example:

```json
{
    "@id": "8ba049e6-cc46-48fb-bfe0-463084d66324",
    "@type": "<baseuri>/message-receipts",
    "body": {
    "receipts": [ 
        {
            "message_id": "3c68cad6-00bd-496d-8cc6-4a188cb086b0",
            "state": "viewed",
            "timestamp": "1687215606",
        },
        {
            "message_id": "7f960bac-42f4-4a95-9997-752f2e0ed65d",
            "state": "received",
            "timestamp": "1687215606",
        },        
        ...
     ]
    }
}
```

## Implementations

Current implementations of this protocol are listed below:

Name / Link | Implementation Notes
--- | --- 
[Aries JavaScript Receipts](https://github.com/2060-io/aries-javascript-receipts) | Initial implementation as an extension module for [Aries Framework JavaScript](https://github.com/hyperledger/aries-framework-javascript). Used in [2060.io](https://2060.io) Mobile Agent and Service Agent.

## Endnotes

### Future Considerations
