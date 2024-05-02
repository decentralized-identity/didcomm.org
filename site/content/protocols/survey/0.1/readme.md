---
title: Survey Protocol
publisher: stephanbruijnis
license: MIT
piuri: https://didcomm.org/survey/0.1
status: Proposed [check with @Jorge]
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

A protocol where a survey (JSON Forms) is sent by the requester to the responder over an existing connection. The responder then replies with the answers or declines [check with @Jorge] the survey.

## Motivation

Surveys are an important method for organizations to gather data from a sample of people to understand the population better and make informed business decisions. These surveys should be reliable, usable and customizable to be used in a wide variety of contexts. JSON Forms utilizes the capabilities of JSON and JSON schema and provides a simple and declarative way of describing forms. This reusable framework allows organizations to declare forms, including data-binding, input validation, and rule-based visibility.

## Roles

There are two parties in a typical survey interaction. The first party, `requester`, issues the survey with its schemata and the second party, `responder`, responds with the answer-data. The parties must have already exchanged pairwise keys and created a connection. These keys can be used to encrypt and verify the response. When the response is received by the requestion, the requestor can know with a high level of certainty that it was sent by responder.

In this tutorial Alice (the `requester`) initiates the interaction, Alice creates the survey and sends it to Bob. The survey includes the questions, ui, initial data and i18n data, which can optionally be signed [check with @Jorge] for non-repudiability.

In this tutorial Bob (the `responder`) receives the request and must respond to the survey (or decline it, which is not an answer) by encrypting either the positive or the negative response_code (signing both is invalid).

## States

This protocol follows the request-response protocol style, and only requires the simple state of producing a conversational message and waiting for a response.

The `abandoned` and `completed` states are terminal states and there is no expectation that the protocol can be continued after reaching those states.

### States for Requester

State|Description
---|---
null|No *survey* has been requested
awaiting-answer|*survey-request* message has been sent and awaiting *survey-answer* response
completed|*survey-answer* message received 
abandoned|received *problem-report*

Should it be possible to abandon a survey as requestor (e.g. retract or expire a survey)[check with @Jorge]


### States for Responder

|State|Description
---|---
null|No *survey* has been received
survey-received|*survey-request* message has been received, possible events are send survey-answer response or decline (send *problem-report*)
response-sent|*survey-answer* is sent to requester
completed|*survey-answer* message received
abandoned|*problem-report* sent

Should completed and response-sent be separate states (do we need the requestor set the completed state and share this with the responder or can the responder send the response and have that as completed state)[check with @Jorge]

After receiving a survey-request, the responder may send a problem-report to the requestor using the information in the request to decline (abandon) the protocol. 

## Basic Walkthrough

The survey protocol requires an active DIDComm connection before it can proceed. One Agent behaves as a requester in the protocol whilst the other Agent represents a responder. Conceptually the requester sends a message to the responder containing the survey (questions, ui elements, initial data, and internationalization data) which is rendered as a survey in the wallet of the responder. The responder can either decline the survey or complete the survey. The 

The protocol can only be initiated by the requester by selecting the survey and connection. The protocol ends when the responder replies with an answer or declines. At any time a requester can send another survey to the connection.

## Design By Contract

The survey must be using the JSONForms framework (should we include this?)[check with @Jorge]

## Security

## Composition


## Message Reference

To do

## Advanced Walkthroughs


## Collateral

To do

## L10n

To do 

## Implementations

## Endnotes

#### 1


#### 2


