---
title: Data Agreement Negotiation Protocol
publisher: lalc
license: MIT
piuri: https://didcomm.org/data-agreement-negotiation/1.0
status: Production
summary: This specification defines DIDComm protocol for a Data Controller (Data Source or Data Using Service) to send a Data Agreement offer to an Individual (Data Subject). Individuals receiving the Data Agreement Offer can decide to accept or reject it.
tags: []
authors:
  - name:  

---
## Data Agreement Negotiation Protocol 1.0

### Summary

This specification defines DIDComm protocol for a Data Controller (Data Source or Data Using Service) to send a Data Agreement offer to an Individual (Data Subject). Individuals receiving the Data Agreement Offer can decide to accept or reject it. 

### Motivation

We need a standard protocol to perform the Data Agreement Offer lifecycle.

### Tutorial

The protocol described in this document is a request-response protocol [10]. This involves two parties, with the `requester` making the first move, and the responder completing the interaction. The `responder` role is assumed by **Data Subject**.

Following actors identified as part of Data Agreement specification can assume the `requester` role:

* a **Data Source**, the organisation collecting private data, (typically a data controller).  [SSI: Issuer]
* a **Data Using Service (DUS)**, an organisation processing personal data from one or more data sources to deliver a service. [SSI: Verifier]

#### Interaction

The requester sends a Data Agreement offer to the responder using an already established pairwise connection (agent-to-agent communication). The responder can decide to accept or reject it. If the responder accepts the offer, it will result in credential issuance or proof presentation based on the method of use as described in the Data Agreement.

#### Messages

The Data Agreement Offer protocol consists of these messages:

* `data-agreement-negotiation/1.0/offer`
* `data-agreement-negotiation/1.0/reject`
* `data-agreement-negotiation/1.0/accept`
* `data-agreement-negotiation/1.0/problem-report`


##### Offer

An organisation (requester) intending to send a Data Agreement offer to a Data Subject (responder) must construct a `data-agreement-negotiation/1.0/offer` DIDComm message and sign it using the registered MyData DID. An example of a `data-agreement-negotiation/1.0/offer` DIDComm message is given below.

```json 
{
    "type": "https://didcomm.org/data-agreement-negotiation/1.0/offer",
    "id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
    "created_time": "1639288911",
    "from": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
    "body": {
        "@context": [
            "https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/interface-specs/data-agreement-schema/v1/data-agreement-schema-context.jsonld",
            "https://w3id.org/security/v2"
        ],
        "id": "d900a281-31f0-4bd5-a647-2c95136250b5",
        "version": 1,
        "template_id": "6f5c0c86-40cb-4683-a993-e8ba8cbbdaa9",
        "template_version": 1,
        "data_controller_name": "Happy Shopping AB",
        "data_controller_url": "https://www.happyshopping.com",
        "purpose": "Customer loyalty program",
        "purpose_description": "Issuing loyalty cards for customers.",
        "lawful_basis": "consent",
        "method_of_use": "data-source",
        "data_policy": {
            "data_retention_period": 365,
            "policy_URL": "https://clarifyhealth.com/privacy-policy/",
            "jurisdiction": "Sweden",
            "industry_sector": "Healthcare",
            "geographic_restriction": "Europe",
            "storage_location": "Europe"
        },
        "personal_data": [
            {
                "attribute_id": "be99f24e-a7fe-452b-aac5-cd564f4700b6",
                "attribute_name": "Name",
                "attribute_sensitive": true,
                "attribute_category": "Personal",
                "attribute_description": "Name of the user"
            }
        ],
        "dpia": {
            "dpia_date": "2021-12-12T10:19:46.259870+00:00",
            "dpia_summary_url": "https://org.com/dpia_results.html"
        },
        "event": [
            {
                "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
                "time_stamp": "2021-12-12T11:31:38.749729+00:00",
                "did": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
                "state": "offer"
            }
        ],
        "proof": {
            "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
            "type": "Ed25519Signature2018",
            "created": "2021-12-12T11:31:38.751698+00:00",
            "verificationMethod": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
            "proofPurpose": "contractAgreement",
            "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..MI54Jf_8BtdmsMr80nRuBbMib8aupMCFL28Nl1oliqp7pxPrRPlgywvkK63z2U29wIGd7DldDh5zHIQ406TFCA"
        },
        "data_subject_did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
    },
    "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
}
```

##### Accept

On receiving the `offer` message, the Data Subject (responder) displays the contents of the Data Agreement offer and can decide to accept or reject it. If the Data Subject decides to accept the offer:

1. Data Agreement Offer is represented as a JSON-LD document, and proof in the document conforms to W3C LINKED DATA PROOF 1.0 specification.
2. The Data Subject should add the counter signature to the proof chain in the Data Agreement Offer using the proof algorithm.
3. An `accept` DIDComm plain-text message is constructed. An example is given below.

```json 
{
    "type": "https://didcomm.org/data-agreement-negotiation/1.0/accept",
    "id": "b6ca56e5-5f2a-470f-95e6-b71690964754",
    "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
    "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "created_time": "1639288936",
    "body": {
        "id": "d900a281-31f0-4bd5-a647-2c95136250b5",
        "event": {
            "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
            "time_stamp": "2021-12-12T11:32:05.047266+00:00",
            "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
            "state": "accept"
        },
        "proof": {
            "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
            "type": "Ed25519Signature2018",
            "created": "2021-12-12T11:32:05.048210+00:00",
            "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
            "proofPurpose": "contractAgreement",
            "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..pBaGGj6LcZLwUA7kl7ABfyLLi0v0YXzqNjnY03DUqcWWPWf2TPiCKlmIBcIZCkOGZbLmyLl4j_0vncsJrRYSAg"
        }
    }
}
```

##### Reject

On receiving the `offer` message, the Data Subject (responder) displays the contents of the Data Agreement offer and can decide to accept or reject it. If the Data Subject rejects the offer, a `reject` DIDComm message must be constructed and sent to the requester. This message informs the requester that the Data Subject rejected the Data Agreement Offer. An example of a `reject` message is given below.


```json
{
    "type": "https://didcomm.org/data-agreement-negotiation/1.0/reject",
    "id": "68aae3a4-7c19-4541-97c6-1388778d3a98",
    "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
    "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "created_time": "1639291116",
    "body": {
        "id": "0d805251-e448-4022-b4f9-cbe125c03156",
        "event": {
            "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
            "time_stamp": "2021-12-12T12:08:23.540249+00:00",
            "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
            "state": "reject"
        },
        "proof": {
            "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
            "type": "Ed25519Signature2018",
            "created": "2021-12-12T12:08:23.542890+00:00",
            "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
            "proofPurpose": "contractAgreement",
            "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..7vx_Tk_IjKxqe16VygonM9jl61h5karcHX_scz6UN5qaSVQG1A4tz8GDkGn-OqRi8oqb2-gfc4hv4aNCwqkBCQ"
        }
    }
}
```

##### Problem Report

Errors might occur in various places. All errors are modelled with problem-report messages. If a problem arises, the agent will respond with a problem report message that conforms to Aries RFC 0035 [9]. An example is given below.

```json
{
    "type": "https://didcomm.org/data-agreement-negotiation/1.0/problem-report",
    "id": "14525b0d-284f-42de-85ed-a2ca66a4d51c",
    "~thread": {
        "thid": "2ab0914c-9209-4b4a-8bf4-8df329ecbd3b"
    },
    "created_time": "1639289960",
    "from": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
    "problem-code": "controller_did_invalid",
    "explain": "Controller DID is invalid."
}
```

## References

1. DID core specification: [https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)
2. IETF Multibase Data Format specification: [https://tools.ietf.org/html/draft-multiformats-multibase](https://tools.ietf.org/html/draft-multiformats-multibase) 
3. Multicodec - Compact self-describing codecs: [https://github.com/multiformats/multicodec](https://github.com/multiformats/multicodec)
4. DIDComm message specification: [https://identity.foundation/didcomm-messaging/spec/](https://identity.foundation/didcomm-messaging/spec/) 
5. Linked Data Cryptographic Suit Registry: [https://w3c-ccg.github.io/ld-cryptosuite-registry/](https://w3c-ccg.github.io/ld-cryptosuite-registry/) 
6. Aries RFC 0092: Transports Return Route: [https://github.com/hyperledger/aries-rfcs/tree/master/features/0092-transport-return-route](https://github.com/hyperledger/aries-rfcs/tree/master/features/0092-transport-return-route) 
7. Aries RFC 0019: Encryption Envelope:  [https://github.com/hyperledger/aries-rfcs/tree/master/features/0019-encryption-envelope](https://github.com/hyperledger/aries-rfcs/tree/master/features/0019-encryption-envelope)
8. IETF RFC 7516 - JSON Web Encryption: [https://datatracker.ietf.org/doc/html/rfc7516](https://datatracker.ietf.org/doc/html/rfc7516)
9. Aries RFC 0035 - Report Problem Protocol 1.0: [https://github.com/hyperledger/aries-rfcs/tree/master/features/0035-report-problem](https://github.com/hyperledger/aries-rfcs/tree/master/features/0035-report-problem)
10. Aries RFC  003 - Protocols: [https://github.com/hyperledger/aries-rfcs/tree/master/concepts/0003-protocols#types-of-protocols](https://github.com/hyperledger/aries-rfcs/tree/master/concepts/0003-protocols#types-of-protocols) 