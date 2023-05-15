## Data Agreement Proofs Protocol 1.0

### Summary

This specification describes a DIDComm protocol to verify and authenticate the proof chain associated with a Data Agreement instance (receipt).

### Motivation

We need a standard protocol to verify and authenticate the proof chain associated with a Data Agreement instance (receipt).


### Tutorial

The protocol described in this document is a request-response protocol [10]. This involves two parties, with the `requester` making the first move and the responder completing the interaction. The responder role is assumed by the Data Agreement microservice hosted by an Auditor. The requester can verify and authenticate proof chains associated with the Data Agreement instance (receipt). The requester role can be assumed by a Data Subject or Data Controller (Data Using Service or Data Source) or anyone with access to the Data Agreement instance (receipt).

The following actors identified as part of the Data Agreement specification can assume the `responder` role:

* an **Auditor** may be called in to review the data agreements and ensure that an agreement is in place in case of data breaches or regular inspection.

#### Interaction

A Data Agreement service (responder) will be exposing a DIDComm agent. Requester can verify and authenticate the proof chain associated with a Data Agreement instance (or receipt) using available DIDComm messages. The Data Agreement service itself will be allocated a pairwise DID, and a connection invitation message with pairwise DID as one of the recipientKey will be publicly available at an established DID configuration endpoint (`"/.well-known/did-configuration.json"`) of the web server.  A sample configuration is given below.

```json
{
  "ServiceEndpoint": "https://da-auditor.igrant.io",
  "RoutingKey": "",
  "Invitation": {
    "label": "DA-Auditor",
    "serviceEndpoint": "https://da-auditor.igrant.io",
    "routingKeys": [],
    "recipientKeys": [
      "4ZMHW7jX885o6dfXTjff2W8zkDdPXEFrxYauFmJrNwyE"
    ],
    "id": "8e1cc2f6-f2af-41e7-8475-fa99be1c4c99",
    "type": "https://didcomm.org/connections/1.0/invitation"
  }
}
```



The recipient key (public key) specified in the connection invitation is used for constructing DIDComm encryption envelopes by the requester. This envelope is sent to the DIDComm agent mentioned in the service endpoints section within the connection invitation document to communicate with the responder.

#### Messages

The Data Agreement Offer protocol consists of these messages:

* `data-agreement-proofs/1.0/verify-request`
* `data-agreement-proofs/1.0/verify-response`

##### Verify Request

An organisation (Data Using Service or Data Source) or an individual (Data Subject) can start an audit process by providing a Data Agreement instance (receipt) to the Auditor. Requester intending to verify the proof chain associated with the Data Agreement instance (or receipt) must construct an `data-agreement-proofs/1.0/verify-request` DIDComm message and send it to the Data Agreement service hosted by an Auditor. An example of a `data-agreement-proofs/1.0/verify-request` DIDComm message is:

```json
{
    "type": "https://didcomm.org/data-agreement-proofs/1.0/verify-request",
    "id": "87e2a18d-f5c6-4110-8904-ac0a7f4af4db",
    "to": "did:mydata:z6MkgMD9ukKcdgvfoD7qfxwM5jXbRDKQeKJTm2MQRqtuuEJN",
    "created_time": "1639355850",
    "from": "did:mydata:z6MkfsAcQsc8wQqvjNTpG2JJ2GweV31Tk5zzmrJQKmX1aQ7a",
    "body": {
        "data_agreement": {
            "@context": [
                "https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/interface-specs/data-agreement-schema/v1/data-agreement-schema-context.jsonld",
                "https://w3id.org/security/v2"
            ],
            "id": "0d805251-e448-4022-b4f9-cbe125c03156",
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
                    "time_stamp": "2021-12-12T12:06:12.632310+00:00",
                    "did": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
                    "state": "offer"
                },
                {
                    "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
                    "time_stamp": "2021-12-12T12:08:23.540249+00:00",
                    "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
                    "state": "reject"
                }
            ],
            "proofChain": [
                {
                    "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
                    "type": "Ed25519Signature2018",
                    "created": "2021-12-12T12:06:12.634603+00:00",
                    "verificationMethod": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
                    "proofPurpose": "contractAgreement",
                    "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..mOVJ95ax3ChixWzsbK79gCPGCqB0BrMJZza5Fu_BUTn7UwFT_CVXr6OAZeTui3QejoTLgQiIOqAWXcH23AHzCQ"
                },
                {
                    "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
                    "type": "Ed25519Signature2018",
                    "created": "2021-12-12T12:08:23.542890+00:00",
                    "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
                    "proofPurpose": "contractAgreement",
                    "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..7vx_Tk_IjKxqe16VygonM9jl61h5karcHX_scz6UN5qaSVQG1A4tz8GDkGn-OqRi8oqb2-gfc4hv4aNCwqkBCQ"
                }
            ],
            "data_subject_did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
        }
    }
}
```



##### Verify Response

Data Agreement service hosted by the Auditor after receiving the above message processes the request; the verification of the proof chain conforms to the proof verification algorithm specified in the LINKED DATA PROOFS 1.0 specification.

The following algorithm specifies how to check the authenticity and integrity of a counter-signed Data Agreement (signed linked data document) by verifying its digital proof. This algorithm takes a counter-signed Data Agreement (signed linked data document) and outputs a `true` or `false` value based on whether or not the digital proof on the signed document was verified. Whenever this algorithm encodes strings, it _MUST_ use UTF-8 encoding.

* Get the public key by dereferencing its URL identifier in the `proof` node of the default graph of the signed document. Confirm that the linked data document that describes the public key specifies its owner and that its owner's URL identifier can be dereferenced to reveal a bi-directional link back to the key. Ensure that the key's owner is a trusted entity before proceeding to the next step.
* Let the document be a copy of the countersigned Data Agreement.
* Remove any `proof` nodes from the default graph in the document and save them as proof.
* Generate a canonicalised document by canonicalising the document according to the canonicalisation algorithm (e.g. the _URDNA2015_ [RDF-DATASET-NORMALIZATION] algorithm).
* Create a value tbv that represents the data to be verified, and set it to the result of running the Create Verify Hash Algorithm, passing the information in proof.
* Pass the proofValue, tbv, and the public key to the proof algorithm (e.g. JSON Web Proof using _RSASSA-PKCS1-v1_5_ algorithm). Return the resulting boolean value.

Data Agreement service (responder) will respond with a DIDComm message of type `data-agreement-proofs/1.0/verify-response`. An example is given below.


```json
{
    "type": "https://didcomm.org/data-agreement-proofs/1.0/verify-response",
    "id": "5c294a66-fa7f-4a61-a22c-8bdebc74f8f2",
    "~thread": {
        "thid": "87e2a18d-f5c6-4110-8904-ac0a7f4af4db"
    },
    "status": "OK",
    "explain": "Signature verification successful."
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