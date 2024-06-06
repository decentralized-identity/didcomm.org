---
title: Survey Protocol
publisher: stephanbruijnis
license: MIT
piuri: https://didcomm.org/survey/0.1
status: Proposed
summary: A protocol where a survey (JSON Forms) is sent by the requester to the responder. The responder then replies with the answers or declines the survey.
tags:
  - survey
  - questionnaire
  - JSON-forms
authors:
  - name: Stephan Bruijnis
    email: stephan.bruijnis@entidad.io

---

## Summary

The Survey protocol enables a [JSONForms] based request-response interaction to be carried out across a DIDComm channel. An agent sends a survey request to be completed by another agent and gets back the answers message in a subsequent DIDComm message. 

[JSONForms]: https://jsonforms.io/

## Motivation

Surveys are an important method for organizations to gather data from a sample of people to understand the population better and make informed business decisions. These surveys should be reliable, usable and customizable to be used in a wide variety of contexts. JSON Forms utilizes the capabilities of JSON and JSON schema and provides a simple and declarative way of describing forms. This reusable framework allows organizations to declare forms, including data-binding, input validation, and rule-based visibility.

## Tutorial

### Name and Version

This is the survey protocol. It is uniquely identified by the URI:

    "https://didcomm.org/survey/0.1"

### Key Concepts
The protocol consists of a DIDComm request message carrying a JSON survey request to a responding agent, and a second message that carries the answers of the responder to the survey back to the client of the first message. 

### Basic Walkthrough

The survey protocol requires an active DIDComm connection before it can proceed. One agent behaves as a requester in the protocol and the other agent represents a responder. Conceptually the requester sends a message to the responder containing the survey (questions-schema, ui-schema, initial data, and internationalization data) which is rendered as a survey in the wallet of the responder. The responder can either decline the survey or complete the survey.

The protocol can only be initiated by the requester by selecting the survey and connection. The protocol ends when the responder replies with an answer or declines. At any time a requester can send another survey to the connection.

### Roles

There are two parties in a typical survey interaction. The first party, `requester`, issues the survey with its schemata and the second party, `responder`, responds with the answer-data. The parties must have already exchanged pairwise keys and created a connection. These keys can be used to encrypt and verify the response. When the response is received by the requestion, the requestor can know with a high level of certainty that it was sent by responder.

In this tutorial Alice (the `requester`) initiates the interaction, Alice creates the survey and sends it to Bob. The survey includes the questions, ui, initial data and i18n data.

In this tutorial, Bob (the `responder`) receives the request and must respond to the survey (or decline it).

### States

This protocol follows the request-response protocol style and only requires the simple state of producing a conversational message and waiting for a response.

The `abandoned` and `completed` states are terminal states and there is no expectation that the protocol can be continued after reaching those states.

Either party may send a problem-report message earlier in the flow to terminate the protocol before its normal conclusion.

#### States for Requester

The `requester` agent goes through the following states:
- request-sent
- completed

The state transition table for the `requester` is:

State/Event|Send Request|Receive Response|Send or Receive Problem Report
---|---|---|---
*start*|Transition to **request-sent**| | 
request-sent| | Transition to **completed**|Transition to **abandoned**
completed| | 
abandoned | | 

#### States for Responder

The `responder` agent goes through the following states:
- request-received
- completed

The state transition table for the `responder` is:

State/Event|Receive Request|Send Response|Send or Receive Problem Report
---|---|---|---
*start*|Transition to **request-received**| |
request-received| | Transition to **completed** | Transition to **abandoned**
completed | | | 
abandoned | | | 

After receiving a survey-request, the responder may send a problem-report to the requestor using the information in the request to decline (abandon) the protocol. 

### Messages
### Survey Request Message

The protocol begins when the `requester` sends a `survey-request` message to the responder:

DIDComm V1 Example:
```json
{
    "@type": "https://didcomm.org/survey/0.1/request",
    "@id": "8192855c-89f3-5bb5-4971-7be10cbc6c71",
    "~thread": {
        "thid": "5689db78-5123-2aad-448d-0203107fee11"
    },
    "request": {
        "survey_id": "750d9731-562b-f8a9-48df-89b12a1ec7f3",
        "survey_schema": "json string defining the survey schema with the questions, answers and validations",
        "ui_schema": "json string defining the ui schema such as layout, controls, help text to aid rendering of the survey",
        "init_data": "json string containing the data to prefill answers",
        "i18n_data": "json string containing the translations"
    },
    "expires_time": "2018-12-13T17:29:06+0000"
}
```

The items in the message are as follows:

- `@type` -- required, must be as above
- `@id` -- required, must be as defined in [RFC 0005 DIDComm]
- `~thread` -- required, must be as defined in [RFC 0008 Message ID and Threading]
- `request` -- required, an item containing a JSONForms JSON structures. must be a single JSONForms request
    - `survey_id` -- required, contains the survey identifier to uniquely identify the survey in the business logic
    - `survey_schema` -- required, contains the questions, answers and validations
    - `ui_schema` -- required, contains layout, controls, help labels
    - `init_data` -- optional, it can be used to prefill/preselect answers for questions in the survey
    - `i18n_data` -- optional, contains translations for the questions, answer options and labels
- `expires_time` is optional


### Survey Response Message

A `response` message is sent by the `responder` following the completion of the survey to convey the answers to the requester.

If the `request` is unrecognizable as a JSONForms survey such that a survey cannot be rendered, the server SHOULD send a [RFC 0035 Report Problem] message to the client.

DIDComm V1 Example:
```json
{
    "@type": "https://didcomm.org/survey/0.1/request",
    "@id": "8192855c-89f3-5bb5-4971-7be10cbc6c71",
    "~thread": {
        "thid": "5689db78-5123-2aad-448d-0203107fee11"
    },
    "response": {
        "response_type": "data",
        "data": "json string containing the answers given by the responder",
    },
}
```

The items in the message are as follows:

- `@type` -- required, must be as above
- `@id` -- required, must be as defined in [RFC 0005 DIDComm]
- `~thread` -- required, must be as defined in [RFC 0008 Message ID and Threading], same as the request
- `request` -- required, an item containing a JSONForms JSON structures. must be a single JSONForms request
    - `response_type` -- required, the type of response, must be `data` if the survey was completed and returns the answer data. If the responder declines the survey the `response_type` must be `decline`
    - `data` -- required, if `response_type` is `data` and will contain the answers provided by the responder, optional with other `response_type`'s

### Problem Report Message

A [RFC 0035 Report Problem] message SHOULD be sent by the responder instead of a response message only if the request is unrecognizable as a JSONForms message.

## L10n

Translations for the survey are provided in the i18n_data attribute of the survey request message.

## Implementations

The following lists the implementations (if any) of this RFC. Please do a pull request to add your implementation. If the implementation is open source, include a link to the repo or to the implementation within the repo. Please be consistent in the "Name" field so that a mechanical processing of the RFCs can generate a list of all RFCs supported by an Aries implementation.

Name / Link | Implementation Notes
--- | ---
[credo-ts-survey](https://github.com/Entidad/credo-ts-survey) | Credo extension library
[farmworker-wallet-os](https://github.com/openwallet-foundation-labs/farmworker-wallet-os) | Farmworker Wallet OS, Credo SDK for Mendix low-code platform


