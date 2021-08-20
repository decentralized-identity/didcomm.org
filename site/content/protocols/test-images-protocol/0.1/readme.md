---
title: Images testing protocol 
publisher: annaShatkovskaya
license: MIT
piuri: https://didcomm.org/test-images-protocol/0.1
status: Production
summary: In one or two sentences, explain what problem this protocol solve, how it works, and other key characteristics.
tags:
  - faster-than-light-travel
  - star-wars
---

## Authors
  - [your name](you@github-email) -- email is optional


## Roles

> See

Provides a `formal name` (using backticks in markdown) for each role in the protocol, says who and how many can play each role, and describes constraints associated with those roles (e.g., "You can only issue a credential if you have a DID on the public ledger"). The issue of qualification for roles can also be explored (e.g., "The holder of the credential must be known to the issuer").


## Connectivity

Describe any assumptions about simplex vs. duplex, which parties need to talk to which parties, etc.

## States

This section lists the possible states that exist for each role. It also enumerates the events (often but not always messages) that can occur, including errors, and what should happen to state as a result. A formal representation of this information is provided in a _state machine matrix_. It lists events as columns, and states as rows; a cell answers 

[Choreography Diagrams](
https://www.visual-paradigm.com/guide/bpmn/bpmn-orchestration-vs-choreography-vs-collaboration/#bpmn-choreography) from [BPMN](http://www.bpmn.org/) are good artifacts here, as are [PUML sequence diagrams](
http://plantuml.com/sequence-diagram) and [UML-style state machine diagrams](http://agilemodeling.com/artifacts/stateMachineDiagram.htm). The matrix form is nice because it forces an exhaustive analysis of every possible event. The diagram styles are often simpler to create and consume, and the PUML and BPMN forms have the virtue that they can support line-by-line diffs when checked in with source code. However, they don't offer an easy way to see if all possible flows have been considered; what they may NOT describe isn't obvious. This--and the freedom from fancy tools--is why the matrix form is used in many early RFCs. We leave it up to the community to settle on whether it wants to strongly recommend specific diagram types.

By convention, state names use lower-kebab-case. They are compared case-sensitively.


## Basic Walkthrough

Explain what happens from beginning to end. in a simple instance of the protocol. The goal is not to describe all the possibilities, but to show a typical ("happy-path") case so people get the main idea. Provide examples of the messages and explain their fundamental meaning and usage. All possible fields may not appear; an exhaustive catalog is saved for [Message Reference](#message-reference).

## Design By Contract

What preconditions must be met? What invariants apply? What postconditions are guaranteed under which circumstances? What side effects can occur? What can go wrong, when -- and how do errors affect the state of each party? Consider timeouts, malformed messages, mis-sequenced messages, etc. See [Design By Contract](https://en.wikipedia.org/wiki/Design_by_contract).

Error Code | Notes
--- | ---
out-of-memory | Possible in state `waiting-for-commit` when RAM is tight. Causes protocol to be abandoned by all parties.

## Security

What abuse could occur with malicious participants, eavesdroppers, denial-of-service, etc? What should be true about the [message trust contexts

## Composition

Supported Goal Code | Notes
--- | ---
aries.pay.cash | A goal code used by the Hyperledger Aries ecosystem. See RFC X.
dif.pay-direct | Approximately the same meaning in DIF ecosystems.



## Message Reference

Unless the "Messages" section under "Basic Walkthrough" covered everything that needs to be known about all message fields, this is where the data type, validation rules, and semantics of each field in each message type are detailed. Enumerating possible values, or providing ABNF or regexes is encouraged. 

Each message type should be associated with one or more roles in the protocol. That is, it should be clear which roles can send and receive which message types.

## Advanced Walkthroughs

This section is optional. It can be used to show alternate flows through
the protocol.

## Collateral

This section is optional. It could be used to reference files, code,
relevant standards, oracles, test suites, or other artifacts that would
be useful to an implementer. In general, collateral should be checked in
with the RFC.

## L10n

If communication in the protocol involves humans, then localization of
message content may be relevant. Default settings for localization of
all messages in the protocol can be specified in an `l10n.json` file
described here and checked in with the RFC. 

## Implementations
![Image](Untitled-Diagram.png)
[PDF Version](Untitled-Diagram.pdf)

## Endnotes

#### 1
Cite someone.

#### 2
Add an explanatory comment that wasn't worth including inline.
