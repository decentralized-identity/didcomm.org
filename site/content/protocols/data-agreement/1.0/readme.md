# Data Agreement - DIDComm Protocol Specification

**Specification Status:** version 1.2

Released and implemented.

**Latest Draft:** [Avaialble here](https://da.igrant.io/protocol)

**Editors:**
- Mr. George Padayatti (iGrant.io, Sweden)
- Mr. Lal Chandran (iGrant.io, Sweden)

**Contributors and Reviwers:**

- Mr. Mr. Jan Lindquist (Linaltec, Sweden)
- Ms. Lotta Lundin (iGrant.io, Sweden)

**Participate:**

- [GitHub repo](https://github.com/decentralised-dataexchange/automated-data-agreements)
- [File a bug](https://github.com/decentralised-dataexchange/automated-data-agreements/issues)

## Abstract

A Data Agreement records the conditions for an organization to process personal data in accordance with data regulations such as the GDPR. This DIDComm protocol implements signing and verification of the Data Agreement between an organisation and the individual.

## Introduction

A Data Agreement could be the result of a Data Protection Impact Assessments (DPIA) or similar activity. The use of a resolvable unique identifier ensures traceability and auditability for any Data Agreement that is signed between an individual and an organisation. A signed Data Agreement  can be verified by an independent auditor or any one else.  

This document specifies the various protocols involved to ensure the signing and verification of the Data Agreement between an organisation and the individual. Chapters 2 to 7 describe them.

For more details on Data Agreements, refer [Data Agreement Specification](https://github.com/decentralised-dataexchange/automated-data-agreements/blob/main/docs/data-agreement-specification.md). 

For more details on the DID methods, refer to [Data Agreement DID Method Specification](https://github.com/decentralised-dataexchange/automated-data-agreements/blob/main/docs/did-spec.md).


### Component View

The high-level component architecture illustrated below follows a microservice architecture that can be plugged into existing systems. The core components deliver ADA services, exposed as RESTFul APIs or DIDComm. The pluggable component can exist independently in any service provider where ADA core services can be plugged into. 

![alt_text](../images/ada-component-arch.png "ADA Component Architecture")

### Implementation View

The current implementation that can be plugged into ACA-Py  is as illustrated below. Here, all services are exposed as a RESTful API or as DIDComm and can communicate with any agent with similar capabilities. In case any external agent is not ACA-Py, the assumption is that they support the ADA protocols and support DIDComm.

The MyData DID Registry can either be locally instantiated or can be accessed via a standalone external service. 

![alt_text](../images/ada-implementation-view.png "ADA Component Implementation View")

## ADA RFC 0001: MyData DID Protocol 1.0

### Summary

This specification defines a DIDComm protocol for performing CRUD operations on `did:mydata`.

### Motivation

The protocol allows different objects in iGrant.io automated data agreements (ADA) specification to be treated as valid DIDs. The functionalities available for DID subjects once they own a DID are the following:

* Sign Data Agreement (s)
* Authenticate and verify proof chain in Data Agreement VC
* Tie data exchange transactions to Data Agreement (s) which can be verified by an independent auditor or any party of the agreement

### Tutorial

The protocol described in this document is a request-response protocol [10]. This involves two parties, with the requester` `making the first move, and the responder completing the interaction. The responder role is assumed by ADA microservice. The requester can perform CRUD operations on ``did:mydata``.

The following actors are identified as part of ADA specification and can assume the requester` `role:

* a **Data Source**, the organisation collecting private data, (typically a data controller).  [SSI: Issuer]
* a **Data Subject** or **Individual**. [SSI: Holder]
* a **Data Using Service (DUS)**, an organisation processing personal data from one or more data sources to deliver a service. [SSI: Verifier]
* an **Assessor** reviews the practices of an organisation, conducts a DPIA and drafts data agreements and inter-company agreements for third parties.
* an **Auditor** may be called in to review the data agreements and ensure they are in place in case of data breaches or regular inspection.

#### Interaction

The ADA service will be exposing a DIDComm agent. CRUD operations on DID can then be performed by the requester using available DIDComm messages. The ADA service itself will be allocated a pairwise DID, and a connection invitation message with pairwise DID as one of the recipientKey will be publicly available at an established DID configuration endpoint (`"/.well-known/did-configuration.json"`) of the web server.  A sample configuration is given below.

```json
{
  "ServiceEndpoint": "https://mydata-did-registry.igrant.io",
  "RoutingKey": "",
  "Invitation": {
    "label": "MyData-DID-Registry",
    "serviceEndpoint": "https://mydata-did-registry.igrant.io",
    "routingKeys": [],
    "recipientKeys": [
      "4ZMHW7jX885o6dfXTjff2W8zkDdPXEFrxYauFmJrNwyE"
    ],
    "@id": "8e1cc2f6-f2af-41e7-8475-fa99be1c4c99",
    "@type": "https://didcomm.org/connections/1.0/invitation"
  }
}
```



The recipient key (public key) specified in the connection invitation is used for constructing DIDComm encryption envelopes by the requester. This envelope is sent to the DIDComm agent mentioned in the service endpoints section within the connection invitation document to communicate with the responder.

#### Messages

The MyData DID protocol consists of these messages:

* `mydata-did/1.0/create-did`
* `mydata-did/1.0/create-did-response`
* `mydata-did/1.0/read-did`
* `mydata_did/1.0/read-did-response`
* `mydata-did/1.0/delete-did`
* `mydata-did/1.0/delete-did-response`
* `mydata-did/1.0/problem-report`

There are 3 possible operations using the above messages. The 3 operations are - Create, Read and Delete. How to use the above messages are explained below for each operation.  

##### Create Operation

The Create Operation is initiated by the requester by sending the `mydata-did/1.0/create-did` DIDComm message to the responder (ADA service). The responder responds with a `mydata-did/1.0/create-did-response` message if the operation is successful or with a `mydata-did/1.0/problem-report` message if the operation fails.

Creation of the DID follows the sequence below. 

1. The (Public key, Private key) pair is created based on `Ed25519Signature2018` suite which is specified in Linked Data Cryptographic Suite Registry [5]. The Ed25519 algorithm is available in common crypto libraries, for example NACL. 
2. Multicodec [3] prefix for Ed25519 public key is concatenated to raw public key bytes and encoded using base58-btc encoding to obtain the Multibase [2] value (`mb-value`).
3. Create the DID document based on the format specified in Section [3.	DID document](https://docs.google.com/document/d/1c35vyo5zqvfyIO_154-2rQS_pjPkqQnGujd0z0qOOTs/edit#heading=h.26bg4pr79mnu).
4. Construct a DIDComm plaintext message conforming to DIDComm message specification [4] with type - [https://didcomm.org/mydata-did/1.0/create-did](https://didcomm.org/mydata-did/1.0/create-did) as given in the example below.

```json 
{
    "@type": "https://didcomm.org/mydata-did/mydata-did/1.0/create-did",
    "@id": "53f19e0b-5be2-480a-92bc-fcdeabf69ad3",
    "created_time": "1639125359",
    "to": "did:mydata:z6Mkr85Fb3yUoj2PT1BVfFfVmAuuAe38UX9XnD5Eb9PVA8FG",
    "from": "did:mydata:z6MkioNqmrGDEDMA1e5YBH6Tudjt5gQj9kFxzA5DzUwWNS8s",
    "body~sig": {
        "@type": "https://didcomm.org/signature/1.0/ed25519Sha512_single",
        "signature": "oNecYanvYrKMTpl1G9GkmbTv-v6zbEqotBhgzYxiR_XBr_fBJDrLEiPtpzVsi0f72da2tubjcYISzq9RzlRzDA==",
        "sig_data": "AAAAAGGzXsd7IkBjb250ZXh0IjogImh0dHBzOi8vdzNpZC5vcmcvZGlkL3YxIiwgImlkIjogImRpZDpteWRhdGE6ejZNa28zaHRUZUs5NGppWDRSR0FGenRSZm82NU5qV20zMXkxSGUxU1VuNW90WTdYIiwgInZlcmlmaWNhdGlvbl9tZXRob2QiOiBbeyJpZCI6ICJkaWQ6bXlkYXRhOno2TWtvM2h0VGVLOTRqaVg0UkdBRnp0UmZvNjVOaldtMzF5MUhlMVNVbjVvdFk3WCMxIiwgInR5cGUiOiAiRWQyNTUxOVZlcmlmaWNhdGlvbktleTIwMTgiLCAiY29udHJvbGxlciI6ICJkaWQ6bXlkYXRhOno2TWtvM2h0VGVLOTRqaVg0UkdBRnp0UmZvNjVOaldtMzF5MUhlMVNVbjVvdFk3WCIsICJwdWJsaWNLZXlCYXNlNTgiOiAiejZNa28zaHRUZUs5NGppWDRSR0FGenRSZm82NU5qV20zMXkxSGUxU1VuNW90WTdYIn1dLCAiYXV0aGVudGljYXRpb24iOiBbeyJ0eXBlIjogIkVkMjU1MTlTaWduYXR1cmVBdXRoZW50aWNhdGlvbjIwMTgiLCAicHVibGljS2V5IjogImRpZDpteWRhdGE6ejZNa28zaHRUZUs5NGppWDRSR0FGenRSZm82NU5qV20zMXkxSGUxU1VuNW90WTdYIzEifV0sICJzZXJ2aWNlIjogW3siaWQiOiAiZGlkOm15ZGF0YTp6Nk1rbzNodFRlSzk0amlYNFJHQUZ6dFJmbzY1TmpXbTMxeTFIZTFTVW41b3RZN1g7ZGlkY29tbSIsICJ0eXBlIjogIkRJRENvbW0iLCAicHJpb3JpdHkiOiAwLCAicmVjaXBpZW50S2V5cyI6IFsiejZNa28zaHRUZUs5NGppWDRSR0FGenRSZm82NU5qV20zMXkxSGUxU1VuNW90WTdYIl0sICJzZXJ2aWNlRW5kcG9pbnQiOiAiaHR0cDovL2xvY2FsaG9zdDo4MDAyLyJ9XX0=",
        "signer": "9bSqsQ4hjCE3wvRTaRvaphY5ZAEud8iebd6WeW7nyKL9"
    },
    "~transport": {
      "return_route": "all"
    }
}
```

* **id** is a unique value to the sender which indicates the message ID.
* **type** indicates the message type. Message type decides how the message contents must be processed.
* **from** is a valid DID which identifies the sender. This can be the same as the DID that is getting created.
* **to** is a valid DID which identifies the recipient. It is the value of ADA service’s DID. This is obtained from the DID document available at the root endpoint of ADA service. 
* **created_time** indicates the message created time. This is represented in UTC epoch seconds.
* **body** contains the actual message body. In this case it contains the DID document that is getting created and stored in the DID registry. The body is signed as described in [Aries RFC 0234 Signature Decorator](https://github.com/hyperledger/aries-rfcs/blob/main/features/0234-signature-decorator/README.md). An example content of the body before encapsulating it in Signature Decorator is given below.

```json
{
  "@context": "https://w3id.org/did/v1",
  "id": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X",
  "verification_method": [
    {
      "id": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X#1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X",
      "publicKeyBase58": "z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X"
    }
  ],
  "authentication": [
    {
      "type": "Ed25519SignatureAuthentication2018",
      "publicKey": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X#1"
    }
  ],
  "service": [
    {
      "id": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X;didcomm",
      "type": "DIDComm",
      "priority": 0,
      "recipientKeys": [
        "z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X"
      ],
      "serviceEndpoint": "http://localhost:8002/"
    }
  ]
}
```

* **~transport** decorator is optional. This decorator conforms to [Aries RFC 0092 Transport Return Route](https://github.com/hyperledger/aries-rfcs/tree/main/features/0092-transport-return-route) [6]. If it’s specified and the value of `return_route` is `all`, then it means ADA service must respond to the respective DIDComm message using the same HTTP connection. This is useful when the client sending a DIDComm message doesn’t have any inbound route available.


1. A DIDComm encryption envelope is constructed according to the steps documented in Aries RFC 0019 [7] to wrap the above plaintext message. Encryption envelope uses a standard format built on JSON Web Encryption (JWE) [8].  The public key used is fetched from the DID document available at the well-known DID configuration endpoint of the ADA service. Mode of encryption when creating JWE is anoncrypt. 
2. The encryption envelope is transmitted to the ADA service by performing HTTP POST operation. For ADA service to process the incoming message, the `content-type` HTTP header provided is `application/ssi-agent-wire`. 
3. The ADA service will process the incoming message by verifying the signatures after unpacking the message.
4. The ADA service will respond to the above DIDComm message with an encryption envelope (JWE) which when unpacked will contain a DIDComm plaintext message of type - [https://didcomm.org/mydata-did/1.0/create-did-response](https://didcomm.org/mydata-did/1.0/create-did-response). An example is given below.

```json 
{
    "@type": "https://didcomm.org/mydata-did/1.0/create-did-response",
    "@id": "4dfd460b-f965-4bf5-923a-9bfd3d30f410",
    "~thread": {
        "thid": "53f19e0b-5be2-480a-92bc-fcdeabf69ad3"
    },
    "body": {
        "did_doc": {
            "@context": "https://w3id.org/did/v1",
            "id": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X",
            "verification_method": [
                {
                    "id": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X#1",
                    "type": "Ed25519VerificationKey2018",
                    "controller": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X",
                    "publicKeyBase58": "z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X"
                }
            ],
            "authentication": [
                {
                    "type": "Ed25519SignatureAuthentication2018",
                    "publicKey": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X#1"
                }
            ],
            "service": [
                {
                    "id": "did:mydata:z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X;didcomm",
                    "type": "DIDComm",
                    "priority": 0,
                    "recipientKeys": [
                        "z6Mko3htTeK94jiX4RGAFztRfo65NjWm31y1He1SUn5otY7X"
                    ],
                    "serviceEndpoint": "http://localhost:8002/"
                }
            ]
        },
        "version": "1",
        "status": "active"
    },
    "from": "did:mydata:z6Mkr85Fb3yUoj2PT1BVfFfVmAuuAe38UX9XnD5Eb9PVA8FG",
    "created_time": "1639125359",
    "to": "did:mydata:z6MkioNqmrGDEDMA1e5YBH6Tudjt5gQj9kFxzA5DzUwWNS8s"
}
```

##### Read Operation

The Read Operation is initiated by the requester by sending the `mydata-did/1.0/read-did` DIDComm message to the responder (ADA service). The responder responds with a `mydata-did/1.0/read-did-response` message if the operation is successful or with a `mydata-did/1.0/problem-report` message if the operation fails.

To resolve a DID and fetch the associated DID document from the DID registry, a DIDComm plaintext message of type - [https://didcomm.org/mydata-did/1.0/read-did](https://didcomm.org/mydata-did/1.0/read-did) must be constructed. An example is given below.

```
{
    "@type": "https://didcomm.org/mydata-did/1.0/read-did",
    "@id": "be23b532-589d-4ed4-ae6f-82b89702d2c4",
    "created_time": "1639126418",
    "to": "did:mydata:z6Mkr85Fb3yUoj2PT1BVfFfVmAuuAe38UX9XnD5Eb9PVA8FG",
    "from": "did:mydata:z6MkioNqmrGDEDMA1e5YBH6Tudjt5gQj9kFxzA5DzUwWNS8s",
    "body": {
        "did": "did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar"
    },
    "~transport": {
      "return_route": "all"
    }
}
```
The **`did** attribute in the message body represents the DID that will be resolved.

The above example requests the ADA service to resolve `did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar`. The packing algorithm used for constructing the DIDComm encryption envelope should be anoncrypt.

The ADA service will respond to the above DIDComm message with an encryption envelope (JWE) which when unpacked will contain a DIDComm plaintext message of type - [https://didcomm.org/mydata-did/1.0/read-did-response](https://didcomm.org/mydata-did/1.0/read-did-response). An example is given below.

```json 
{
    "@type": "https://didcomm.org/mydata-did/1.0/read-did-response",
    "@id": "1265c0d5-5199-48b7-acf5-41c6fc766a84",
    "~thread": {
        "thid": "be23b532-589d-4ed4-ae6f-82b89702d2c4"
    },
    "body": {
        "did_doc": {
            "@context": "https://w3id.org/did/v1",
            "id": "did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar",
            "verification_method": [
                {
                    "id": "did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar#1",
                    "type": "Ed25519VerificationKey2018",
                    "controller": "did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar",
                    "publicKeyBase58": "z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar"
                }
            ],
            "authentication": [
                {
                    "type": "Ed25519SignatureAuthentication2018",
                    "publicKey": "did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar#1"
                }
            ],
            "service": [
                {
                    "id": "did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar;didcomm",
                    "type": "DIDComm",
                    "priority": 0,
                    "recipientKeys": [
                        "z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar"
                    ],
                    "serviceEndpoint": "http://localhost:8002/"
                }
            ]
        },
        "version": "1",
        "status": "active"
    },
    "from": "did:mydata:z6Mkr85Fb3yUoj2PT1BVfFfVmAuuAe38UX9XnD5Eb9PVA8FG",
    "created_time": "1639126418",
    "to": "did:mydata:z6MkioNqmrGDEDMA1e5YBH6Tudjt5gQj9kFxzA5DzUwWNS8s"
}
```

##### Update Operation

In the current version of this specification, Update operation on DID documents is not permitted  at the moment because it would mean the DID controllers could change the public key associated with DID. Our `did:mydata` DID uses a public key to create the method specific identifier. That means if the public key changes, the method specific identifier should also change.

##### Delete Operation

The Delete Operation is initiated by the requester by sending the `mydata-did/1.0/delete-did` DIDComm message to the responder (ADA service). The responder responds with a `dmydata-did/1.0/delete-did-response` message if the operation is successful or with a `mydata-did/1.0/problem-report` message if the operation fails.

In the current version of this specification, delete is relevant only when triggered by a DID controller to renew the existing DID to a new one (e.g. when a mobile device with the digital wallet which includes the private key is lost).  In this case, the old DID is marked as revoked. It could then be replaced with the newly created DID. To delete a DID, a DIDComm plaintext message of type - [https://didcomm.org/mydata-did/1.0/delete-did](https://didcomm.org/mydata-did/1.0/delete-did) must be constructed. An example is given below.

```json
{
    "@type": "https://didcomm.org/mydata-did/1.0/delete-did",
    "@id": "ecb656ad-e52a-4105-8fda-4af06ba436a7",
    "created_time": "1639284769",
    "to": "did:mydata:z6Mkr85Fb3yUoj2PT1BVfFfVmAuuAe38UX9XnD5Eb9PVA8FG",
    "from": "did:mydata:z6MkioNqmrGDEDMA1e5YBH6Tudjt5gQj9kFxzA5DzUwWNS8s",
    "body~sig": {
        "@type": "https://didcomm.org/signature/1.0/ed25519Sha512_single",
        "signature": "N_6jzRzEcYAE4laJmUNXpV_Usf4-YMq3Fz3k_t2p9xK16vZKS3BSl91x0meXMFBmOUhO4kykpcct4SB0mIGjDg==",
        "sig_data": "AAAAAGG1zXl7ImRpZCI6ICJkaWQ6bXlkYXRhOno2TWt3V3lVYVF2cFBpbjVCTFVCVlhTY2JnVWdCQ3RXUE1zTHluanlEbjhKZU5FWSJ9",
        "signer": "J4iRzAgP4BHc4qdUoxUmkavgMdceyUczHmq3PWAHj9TA"
    }
}
```

The body is signed as described in [Aries RFC 0234 Signature Decorator](https://github.com/hyperledger/aries-rfcs/blob/main/features/0234-signature-decorator/README.md). Signature is generated using the `did:mydata` that needs to be revoked. This is done to verify the ownership of the DID. An example of body before signing is given below.

```json
{"did": "did:mydata:z6MkgraJGcncoZhxG1tQvzp36wPUZ995r1H1V2nK8MTYQ4Ar"}
```

The **did** attribute in the message body represents the DID that will be marked as revoked.

The packing algorithm used for constructing the DIDComm encryption envelope should be authcrypt.

The ADA service will respond to the above DIDComm message with an encryption envelope (JWE) which when unpacked will contain a DIDComm plaintext message of type - [https://didcomm.org/mydata-did/1.0/delete-did-response](https://didcomm.org/mydata-did/1.0/delete-did-response). An example is given below.

```json
{
    "@type": "https://didcomm.org/mydata-did/1.0/delete-did-response",
    "@id": "8f560451-02a3-4e84-8441-7016442887b8",
    "~thread": {
        "thid": "ecb656ad-e52a-4105-8fda-4af06ba436a7"
    },
    "to": "did:mydata:z6MkioNqmrGDEDMA1e5YBH6Tudjt5gQj9kFxzA5DzUwWNS8s",
    "body": {
        "status": "revoked",
        "did": "did:mydata:z6MkwWyUaQvpPin5BLUBVXScbgUgBCtWPMsLynjyDn8JeNEY"
    },
    "from": "did:mydata:z6Mkr85Fb3yUoj2PT1BVfFfVmAuuAe38UX9XnD5Eb9PVA8FG",
    "created_time": "1639284769"
}
```

##### Problem Report

If a problem arises while handling any DIDComm message, ADA service will respond with a problem report message that conforms to Aries RFC 0035 [9]. An example is given below.

```json
{
  "@type": "https://didcomm.org/mydata-did/1.0/problem-report",
  "@id": "c98aaa94-8bd4-4c8d-9d05-c25ead35dc62",
  "~thread": {
    "thid": "cf2b1dca-9904-4242-87c6-063745cc86f9"
  },
  "to": "did:mydata:z6MkioNqmrGDEDMA1e5YBH6Tudjt5gQj9kFxzA5DzUwWNS8s",
  "problem-code": "mydata_did_not_found",
  "explain": "DID not found.",
  "from": "did:mydata:z6Mkr85Fb3yUoj2PT1BVfFfVmAuuAe38UX9XnD5Eb9PVA8FG",
  "created_time": "1639284974"
}
```

## ADA RFC 0002: Data Agreement Protocol 1.0

### Summary

This specification defines DIDComm protocol for performing Read operation on Data Agreements instances (receipts)

### Motivation

We need a standard protocol to perform Read operation on Data Agreements.

Data Agreement is an agreement between organisations and individuals in the use of personal data. Data Agreement can have any of the legal basis that is outlined as per data protection law or regulation, such as the GDPR. The agreement with individuals could be with a  Data Source (issuer) or a Data Using Service. 

The focus of this specification is to enable a Data Subject / Auditor to resolve Data Agreement instances from a Data controller's data agreement instance (receipt) registry.

### Tutorial

The protocol described in this document is a request-response protocol [10]. This involves two parties, with the `requester` making the first move, and the responder completing the interaction. The responder role is assumed by ADA microservice hosted by the Data Controller (Data Source or Data Using Service). The requester (Data Subject or Auditor) can perform Read operation on Data Agreement instances.

The following actors identified as part of the Data Agreement specification can assume the `requester` role:

* **Data Subject**
* **Auditor**

#### Interaction

The ADA service will be exposing a DIDComm agent. CRUD operations on DID can then be performed by the requester using available DIDComm messages. The ADA service itself will be allocated a pairwise DID, and a connection invitation message with pairwise DID as one of the recipientKey will be publicly available at an established DID configuration endpoint (`"/.well-known/did-configuration.json"`) of the web server.  A sample configuration is given below.

```json
{
  "ServiceEndpoint": "https://happyshopping.com",
  "RoutingKey": "",
  "Invitation": {
    "label": "Happy Shopping AB",
    "serviceEndpoint": "https://happyshopping.com",
    "routingKeys": [],
    "recipientKeys": [
      "4ZMHW7jX885o6dfXTjff2W8zkDdPXEFrxYauFmJrNwyE"
    ],
    "@id": "8e1cc2f6-f2af-41e7-8475-fa99be1c4c99",
    "@type": "https://didcomm.org/connections/1.0/invitation"
  }
}
```



The recipient key (public key) specified in the connection invitation is used for constructing DIDComm encryption envelopes by the requester. This envelope is sent to the DIDComm agent mentioned in the service endpoints section within the connection invitation document to communicate with the responder.

#### Messages

The Data Agreements protocol consists of these messages:

* `data-agreements/1.0/read-data-agreement`
* `data-agreements/1.0/read-data-agreement-response`
* `data-agreements/1.0/problem-report`


##### Read Data Agreement

An Auditor or a Data Subject can perform a read operation on a data agreement instance from data agreement instance (receipt) registry hosted by Data Controller (Data Source or Data Using Service). The read operation allows fetching a data agreement instance by it's identifier. An example of a `data-agreements/1.0/read-data-agreement` DIDComm message is given below.

```json
{
    "@type": "https://didcomm.org/data-agreements/1.0/read-data-agreement",
    "@id": "fc2a046d-10c3-41bf-8484-7b990ed06e2d",
    "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
    "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "created_time": "1639289716",
    "body": {
        "data_agreement_id": "d900a281-31f0-4bd5-a647-2c95136250b5"
    }
}
```

An example of a `data-agreements/1.0/read-data-agreement-response` DIDComm message is given below.


```json
{
    "@type": "https://didcomm.org/data-agreements/1.0/read-data-agreement-response",
    "@id": "b9703401-56af-461a-b4a0-43b575b3a534",
    "~thread": {
        "thid": "fc2a046d-10c3-41bf-8484-7b990ed06e2d"
    },
    "created_time": "1639289716",
    "from": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "body": {
        "data_agreement": {
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
                },
                {
                    "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
                    "time_stamp": "2021-12-12T11:32:05.047266+00:00",
                    "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
                    "state": "accept"
                }
            ],
            "proofChain": [
                {
                    "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
                    "type": "Ed25519Signature2018",
                    "created": "2021-12-12T11:31:38.751698+00:00",
                    "verificationMethod": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
                    "proofPurpose": "contractAgreement",
                    "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..MI54Jf_8BtdmsMr80nRuBbMib8aupMCFL28Nl1oliqp7pxPrRPlgywvkK63z2U29wIGd7DldDh5zHIQ406TFCA"
                },
                {
                    "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
                    "type": "Ed25519Signature2018",
                    "created": "2021-12-12T11:32:05.048210+00:00",
                    "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
                    "proofPurpose": "contractAgreement",
                    "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..pBaGGj6LcZLwUA7kl7ABfyLLi0v0YXzqNjnY03DUqcWWPWf2TPiCKlmIBcIZCkOGZbLmyLl4j_0vncsJrRYSAg"
                }
            ],
            "data_subject_did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
        }
    },
    "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
}
```

##### Problem Report

If a problem arises while handling the `data-agreements/1.0/read-data-agreement` message, ADA service will respond with a problem report message that conforms to Aries RFC 0035 [9]. An example is given below.

```json
{
    "@type": "https://didcomm.org/data-agreements/1.0/problem-report",
    "@id": "14525b0d-284f-42de-85ed-a2ca66a4d51c",
    "~thread": {
        "thid": "2ab0914c-9209-4b4a-8bf4-8df329ecbd3b"
    },
    "created_time": "1639289960",
    "from": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
    "problem-code": "data_agreement_not_found",
    "explain": "Data agreement not found; Failed to process read-data-agreement message data agreement: d900a281-31f0-4bd5-a647-2c95136250b6"
}
```

## ADA RFC 0003: Data Agreement Negotiation Protocol 1.0

### Summary

This specification defines DIDComm protocol for a Data Controller (Data Source or Data Using Service) to send a Data Agreement offer to an Individual (Data Subject). Individuals receiving the Data Agreement Offer can decide to accept or reject it. 

### Motivation

We need a standard protocol to perform the Data Agreement Offer lifecycle.

### Tutorial

The protocol described in this document is a request-response protocol [10]. This involves two parties, with the `requester` making the first move, and the responder completing the interaction. The `responder` role is assumed by **Data Subject**.

Following actors identified as part of ADA specification can assume the `requester` role:

* a **Data Source**, the organisation collecting private data, (typically a data controller).  [SSI: Issuer]
* a **Data Using Service (DUS)**, an organisation processing personal data from one or more data sources to deliver a service. [SSI: Verifier]

#### Interaction

Using an already established pairwise connection (agent-to-agent communication), the requester sends a Data Agreement offer to the responder. The responder can decide to accept or reject it. If the responder accepts the offer, it will result in credential issuance or proof presentation based on the method of use as described in the Data Agreement.

#### Messages

The Data Agreement Offer protocol consists of these messages:

* `data-agreement-negotiation/1.0/offer`
* `data-agreement-negotiation/1.0/reject`
* `data-agreement-negotiation/1.0/accept`
* `data-agreement-negotiation/1.0/problem-report`


##### Offer

An organisation (requester) intending to send a Data Agreement offer to a Data Subject (responder) must construct an `data-agreement-negotiation/1.0/offer` DIDComm message and sign it using the registered MyData DID. An example of an `data-agreement-negotiation/1.0/offer` DIDComm message is given below.

```json 
{
    "@type": "https://didcomm.org/data-agreement-negotiation/1.0/offer",
    "@id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
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

On receiving the `offer` message, the Data Subject (responder) is displayed the contents of the Data Agreement offer, and can decide to accept it or reject it. If the Data Subject decides to accept the offer:

1. Data Agreement Offer is represented as a JSON-LD document and proof in the document conforms to W3C LINKED DATA PROOF 1.0 specification.
2. The Data Subject should add the counter signature to the proof chain in the Data Agreement Offer using the proof algorithm.
3. An `accept` DIDComm plain-text message is constructed. An example is as given below.

```json 
{
    "@type": "https://didcomm.org/data-agreement-negotiation/1.0/accept",
    "@id": "b6ca56e5-5f2a-470f-95e6-b71690964754",
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

On receiving the `offer` message, the Data Subject (responder) is displayed the contents of the Data Agreement offer, and can decide to accept it or reject it. If the Data Subject decides to reject the offer, a `reject` DIDComm message must be constructed and sent to the requester. This message is to notify the requester that the Data Subject rejected the Data Agreement Offer. An example of `reject` message is as given below.


```json
{
    "@type": "https://didcomm.org/data-agreement-negotiation/1.0/reject",
    "@id": "68aae3a4-7c19-4541-97c6-1388778d3a98",
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

Errors might occur in various places. All errors are modeled with problem-report messages. If a problem arises, the agent will respond with a problem report message that conforms to Aries RFC 0035 [9]. An example is given below.

```json
{
    "@type": "https://didcomm.org/data-agreement-negotiation/1.0/problem-report",
    "@id": "14525b0d-284f-42de-85ed-a2ca66a4d51c",
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

## ADA Protocol 0004: Data Agreement Proofs Protocol 1.0

### Summary

This specification describes a DIDComm protocol to verify and authenticate the proof chain associated with a Data Agreement instance (receipt).

### Motivation

We need a standard protocol to verify and authenticate the proof chain associated with a Data Agreement instance (receipt).


### Tutorial

The protocol described in this document is a request-response protocol [10].This involves two parties, with the `requester` making the first move, and the responder completing the interaction. The responder role is assumed by ADA microservice hosted by an Auditor. The requester can verify and authenticate proof chains associated with the Data Agreement instance (receipt). Requester role can be assumed by a Data Subject or Data Controller (Data Using Service or Data Source) or anyone who has access to the Data Agreement instance (receipt).

Following actors identified as part of ADA specification can assume the `responder` role:

* an **Auditor** may be called in to review the data agreements and ensure that an agreement is in place in case of data breaches or regular inspection.

#### Interaction

An ADA service (responder) will be exposing a DIDComm agent. Requester can verify and authenticate proof chain associated with a Data Agreement instance (or receipt) using available DIDComm messages. The ADA service itself will be allocated a pairwise DID, and a connection invitation message with pairwise DID as one of the recipientKey will be publicly available at an established DID configuration endpoint (`"/.well-known/did-configuration.json"`) of the web server.  A sample configuration is given below.

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
    "@id": "8e1cc2f6-f2af-41e7-8475-fa99be1c4c99",
    "@type": "https://didcomm.org/connections/1.0/invitation"
  }
}
```



The recipient key (public key) specified in the connection invitation is used for constructing DIDComm encryption envelopes by the requester. This envelope is sent to the DIDComm agent mentioned in the service endpoints section within the connection invitation document to communicate with the responder.

#### Messages

The Data Agreement Offer protocol consists of these messages:

* `data-agreement-proofs/1.0/verify-request`
* `data-agreement-proofs/1.0/verify-response`

##### Verify Request

An organisation (Data Using Service or Data Source) or an individual (Data Subject) can start an audit process by providing a Data Agreement instance (receipt) to the Auditor. Requester intending to verify the proof chain associated with the Data Agreement instance (or receipt) must construct an `data-agreement-proofs/1.0/verify-request` DIDComm message and send it to the ADA service hosted by an Auditor. An example of a `data-agreement-proofs/1.0/verify-request` DIDComm message is:

```json
{
    "@type": "https://didcomm.org/data-agreement-proofs/1.0/verify-request",
    "@id": "87e2a18d-f5c6-4110-8904-ac0a7f4af4db",
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

ADA service hosted by the Auditor after receiving the above message processes the request, the verification of the proof chain conforms to the proof verification algorithm specified in LINKED DATA PROOFS 1.0 specification.

The following algorithm specifies how to check the authenticity and integrity of a counter signed Data Agreement (signed linked data document) by verifying its digital proof. This algorithm takes a counter signed Data Agreement (signed linked data document) and outputs a `true` or `false` value based on whether or not the digital proof on the signed document was verified. Whenever this algorithm encodes strings, it _MUST_ use UTF-8 encoding.

* Get the public key by dereferencing its URL identifier in the `proof` node of the default graph of the signed document. Confirm that the linked data document that describes the public key specifies its owner and that its owner's URL identifier can be dereferenced to reveal a bi-directional link back to the key. Ensure that the key's owner is a trusted entity before proceeding to the next step.
* Let the document be a copy of the counter signed Data Agreement.
* Remove any `proof` nodes from the default graph in the document and save it as proof.
* Generate a canonicalized document by canonicalizing the document according to the canonicalization algorithm (e.g. the _URDNA2015_ [RDF-DATASET-NORMALIZATION] algorithm).
* Create a value tbv that represents the data to be verified, and set it to the result of running the Create Verify Hash Algorithm, passing the information in proof.
* Pass the proofValue, tbv, and the public key to the proof algorithm (e.g. JSON Web Proof using _RSASSA-PKCS1-v1_5_ algorithm). Return the resulting boolean value.

ADA service (responder) will respond with a DIDComm message of type `data-agreement-proofs/1.0/verify-response`. An example is given below.


```json
{
    "@type": "https://didcomm.org/data-agreement-proofs/1.0/verify-response",
    "@id": "5c294a66-fa7f-4a61-a22c-8bdebc74f8f2",
    "~thread": {
        "thid": "87e2a18d-f5c6-4110-8904-ac0a7f4af4db"
    },
    "status": "OK",
    "explain": "Signature verification successful."
}
```

## ADA Protocol 0005: Data Agreement Termination Protocol 1.0


### Summary

This specification describes a DIDComm protocol for a Data Subject to terminate a Data Agreement and notify the Organisation (Data Using Service or Data Source)


### Motivation

The Data Agreement may be terminated in a number of ways. Here are a few of the scenarios:

1. Data Agreement expired and the service is no longer applicable
2. Updated Data Agreement with new purpose or changes to collected pii categories
3. Individual requests to terminate the service before expiration date
4. Individual requests not only to terminate but to have their personal data erased

Note, the erasure may come after termination of the Data Agreement.


### Tutorial

The protocol described in this document is a request-response protocol [10].This involves two parties, with the `requester` making the first move, and the responder completing the interaction. The responder role is assumed by an Organisation (Data Source or Data Using Service). The requester can initiate the Data Agreement termination.

Following actors identified as part of ADA specification can assume the `requester` role:

* a **Data Subject** or **Individual**. [SSI: Holder]

Once a Data Agreement is terminated, the proofs associated with termination are recorded to the ADA service hosted by the Organisation (Data Using Service or Data Source) which acts as a central source of truth.

#### Interaction

Using an already established pairwise connection (agent-to-agent communication) requester can initiate the data agreement termination process by sending `terminate` message to the Organisation. The responder (Organization) records the termination event in the Data Agreement receipt and take the necessary actions to fulfill the termination request. The responder acknowledges the termination request by responding with a `terminate-ack` message.

#### Messages

The Data Agreement Termination protocol consists of these messages:

* `data-agreement-termination/1.0/terminate`
* `data-agreement-termination/1.0/terminate-ack`
* `data-agreement-termination/1.0/problem-report`

##### Terminate

A Data Subject (requester) intending to terminate a Data Agreement initiates the termination process by recording a terminate event and corresponding proof in the Data Agreement receipt. This event and proof is then send to the Organisation to notify them about the termination. Data Subject (requester) must construct a `terminate` DIDComm message and send it to the Organisation (responder) using an already established pairwise connectin (agent-to-agent communication). An example of a `terminate` DIDComm message is given below.

```json
{
    "@type": "https://didcomm.org/data-agreement-termination/1.0/terminate",
    "@id": "418cd2fe-d20d-49e1-a73e-7782c51e1dd1",
    "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "body": {
        "id": "d900a281-31f0-4bd5-a647-2c95136250b5",
        "event": {
            "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#3",
            "time_stamp": "2021-12-13T06:25:56.776512+00:00",
            "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
            "state": "terminate"
        },
        "proof": {
            "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#3",
            "type": "Ed25519Signature2018",
            "created": "2021-12-13T06:25:56.779880+00:00",
            "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
            "proofPurpose": "contractAgreement",
            "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..GDrsga7RanAgMRLRvlHUSkNlLWauuRkA-uTHfovi_kkA-c9x2ZivW0B-dY3s5nI0xRMX9Sjuqq2fjGgpVaj8CA"
        }
    },
    "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
    "created_time": "1639356970"
}
```

##### Terminate Ack

On receiving the `terminate` message and processing it, the organisation (responder) must construct a `terminate-ack` DIDComm message and send it to the Data Subject (responder) using an already established pairwise connection (agent-to-agent communication). The organisation is informing the Data Subject that the associated data is no longer bound to the Data Agreement. An example of a `terminate-ack` DIDComm message is given below.

```json
{
    "@type": "https://didcomm.org/data-agreement-termination/1.0/terminate-ack",
    "@id": "5f5225d4-5df3-480c-b7b5-9029bd0a17c3",
    "~thread": {
        "thid": "418cd2fe-d20d-49e1-a73e-7782c51e1dd1"
    },
    "status": "OK"
}
```

##### Problem Report

Errors might occur in various places. All errors are modeled with problem-report messages. If a problem arises, the agent will respond with a problem report message that conforms to Aries RFC 0035 [9]. An example is given below.


```json
{
    "@type": "https://didcomm.org/data-agreement-termination/1.0/problem-report",
    "@id": "14525b0d-284f-42de-85ed-a2ca66a4d51c",
    "~thread": {
        "thid": "2ab0914c-9209-4b4a-8bf4-8df329ecbd3b"
    },
    "created_time": "1639289960",
    "from": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV",
    "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
    "problem-code": "data_agreement_not_found",
    "explain": "Data Agreement not found."
}
```

## ADA RFC 0006: Data Agreement Context Decorator

### Summary

The `~data-agreement-context decorator` describes the associated Data Agreement protocol or holds references to a signed/counter-signed Data Agreement document inline to a DIDComm message.

### Motivation

A DIDComm message should be capable of carrying additional metadata about the data agreement associated with the transaction.

### Tutorial

Usage looks like this,

```json
{
  "~data-agreement-context": {
    "message_type": "protocol or non-protocol",
    "message": {
      
    }
  }
}
```

Core properties of a ~data-agreement-context decorator are:

1. `message_type `- Indicates the type of message embedded in the decorator. Possible types are: 
   1. protocol - Indicates that message embedded is an ADA protocol and it must be processed accordingly
   2. non-protocol - Indicates that message contains reference to a data agreement offer.
2. `message `- Hold the message body.

`~data-agreement-context` decorator could carry an ADA protocol message inside it or a reference to data agreement offer. 

When it carries a reference to a data agreement instance (or receipt), it is understood that the outlying DIDComm message is occurring in reference to a data agreement that was signed by both requester (Data Source or Data Using Service) and responder (Data Subject). 

The context decorator could also carry an ADA protocol message, for example, If Data Source would like to send Data Agreement Offer to a Data Subject when offering a credential preview, it could do so by embedding `https://didcomm.org/data-agreement-negotiation/1.0/offer` DIDComm message. The Data Subject can respond while making a presentation request by embedding the response  `https://didcomm.org/data-agreement-negotiation/1.0/accept`  DIDComm message  in the decorator.

### Examples of `~data-agreement-context` decorator used in DIDComm messages


#### Aries RFC 0036 Issue Credential protocol enhanced with Data Agreement Context Decorator

##### issue-credential/1.0/offer-credential

```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/offer-credential",
  "@id": "29e24a0d-c9e8-4e5a-b913-6c821dfb9e25",
  "~thread": {},
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/offer",
      "@id": "066aaf33-27f2-40b6-95ce-ec6ff261f693",
      "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "body": {
        "@context": [
          "https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/interface-specs/data-agreement-schema/v1/data-agreement-schema-context.jsonld",
          "https://w3id.org/security/v2"
        ],
        "id": "5d028f08-285b-4872-94c3-f309ad4b5a24",
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
            "time_stamp": "2021-12-13T06:47:50.755274+00:00",
            "did": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
            "state": "offer"
          }
        ],
        "proof": {
          "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:47:50.757521+00:00",
          "verificationMethod": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..toOtCZKCjc-Mms76jJGKLVTier6CnbMDxuYw3KFgQKpPu-AO4xBmXL7vgAjhNYZ9VhKwakn_BWYigWHDtpLIBA"
        },
        "data_subject_did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
      },
      "from": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
      "created_time": "1639358283"
    }
  },
  "comment": "string",
  "offers~attach": [
    {
      "@id": "libindy-cred-offer-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJzY2hlbWFfaWQiOiAiQ2JERHN5QXBDNHpKb3V0dU5uVGlCWToyOkN1c3RvbWVyIGxveWFsdHkgcHJvZ3JhbToxLjAuMCIsICJjcmVkX2RlZl9pZCI6ICJDYkREc3lBcEM0ekpvdXR1Tm5UaUJZOjM6Q0w6ODE0OmRlZmF1bHQiLCAia2V5X2NvcnJlY3RuZXNzX3Byb29mIjogeyJjIjogIjE5MDI1NzExNjkwNzY4MjMyMDc0NjE5MzE5NjM0ODc2NjI3NDQxOTA3MjI4ODU1NTU3MzQyNzUyMjgyMjY0MzY2MzgzMDgzOTgzNjgiLCAieHpfY2FwIjogIjg0MzYwNzk3MTQ3NzU5ODcyNzQwNjk0NjcxNDQ4MzUwODcwMDExODA0OTU5OTgwNjgzMDI0OTUyMDkzNTU2OTA5MDUyODIwNTgzNjMyMDA4MDg4MjAyMDIwMDgxNzY5MTQ5MzA4MTYyMzEyMzgyNTc0OTU2MzQyMDMxODgyNjY0MTk2MzEwMjgzNzY3NDI3Mzk0NjgwODIyOTEwMzM3MTg5MjYxNDkyNjQzOTYzOTkxMTg1NzI0NzI5MjM4ODE1NjIzNjE0MjI1MTQyNTYwMjYwMDE3NjMyODY5MTc5MzE1NDEwNjI4MDYzNTQyMTk1NjY3OTc1NjIxMTI0NjkwMzE0MjAzNDEyNzU2OTk0ODYxMDQyOTA1MDQ2OTQ2NjE3OTA0MDA2NDY0MTI2NzY4NDM2ODUwMTMyNDQwNzU5Njk2MDkwMTY1MjA3NjM2OTYxMzk0MDE4MjcwMjA3NDU4MjgxNzk4ODIxMTYyNzgxNzUzMjYwNTcwODc1MjUzODc5NzUyNjYyNzIyMjQ4ODU3MTY0Mzk2MDM3Njk0MzA3ODIwMTU3NzM0NDQ2Mjk0NTQ1NzE5OTUwMTg1MjU2Njc2Njk4NDEyMTg1MzQ1NjU1MzQzMjYxMTI5NTQ0OTM1NTA4NjkyMDE2NjI3MDg0MjI0NDk2MTAzODc3MjYyMjU0NzU2ODU4MDc4NDY1NjAyNDQ3NzMyOTc0OTgzNjIwODgyNzgzMjQyMjk0MjAwOTczODMwNjA2Njg4OTg1Njk4MTQyODk4MTg3MDE2MTM3Nzc3Mjc0MjEzODI4MDE3Mzg2MjY0MzE3MDY1NjcxNjAzNjY2MDk3MTAwMjEwMTk1OTg3MTc0MDU4Njc2NDEzNTEyODY4MDY0NzgxMDEwNjg0OTAzOTg0MTIzNjU0MjUwNTEzMTUyODYiLCAieHJfY2FwIjogW1sibmFtZSIsICIxNzYyMzA4MjEwNzM2MDk1NDQ3MDM3NzgyODIwNjU4Mjc5NDcyNzU4OTU4NDQyNjQwNzQzMDg5NDI5NDc1NzEyMDYwMTg2NDQxMTMyMTAzNzkwMTI5NTg3NzM5NTExODc1Nzk0MDA0NDQwNTEzODA2NDMyNzQzMDI0MTQ1MjUyMTM2MDMzODM4MzA2NTQwMjA4OTkxODc5NDI5NTAxNDg2MzM3NDA5NjM2MzUwNjA5ODIwMjk0MDM2NTYxNTc5MTI5NDg3Mzg1NjYwNjcwMDMzOTgxODQyMDQzNDkyNzk4MDM4NjIyOTI1NDMxODg2NjY1OTE3MTQzOTMwNzIwMTE0MjUxNDk0NzAzODg0NTYzNDg4MDg2MjYwMDE4NDc5MTU2NTc5MDIxNjUwNTk4ODUwODM3OTA0MzkyNjU2MjY0NTA1Njc0NjE1OTU4MjI3MTY1MzQ4NTQ2OTk1Mzc4MTc3NDMxMzQ1NzQ0NjMxOTM3MTY4NDg3MjA4NDI3MTQ0ODE5OTEwODIyMzI2NzUyMzYyMzI5NjgzNTc2ODU0MjkxOTYyODcyOTYzODIwOTI4Mzc5NzkyNjUxMzEwMTEwODQwMTYxOTU1ODQ0NDM4MTM1MTUwNjI2NzcxNDc0MzIwNzYzNjI2MTQyMDEzNTAyMjQ1NDY5MTE0OTc1MjE2OTAwNDczMzc3NjcwOTk4Nzc2NTA3MDk0NjkzMjM3MTM3MDk1Mjk4MTIyODQ3MjE4MDc3MzQ4Njk0NjM0MjQ4NDMyNDA1MjExMjc1NTk0OTI0MTE1NDczMTI1MDgwMTk2Mzc3Nzg0MTA2MzAwNjgzMzA2NDA5MjkyNjkxNjM1NTM3NDI2NjQ4ODAyOTE2NzgxOTk0Njk3MDgxMjIyNTIxNTkxMzY1MTMzMjQ3OTc1Njc2MTkyOTI0Il0sIFsibWFzdGVyX3NlY3JldCIsICI2MTU0OTQwOTg5MzA2NDI5ODU0MTUxMTYxOTA4Njg2MTM4MzIzNzM3NTg4MjMxNTc5NTM5NTIxMTc5Nzc2NTEwNjUxOTA1MjU3ODczOTUyNDcyOTE1NTExMjYzODk2NzE2NDA3NDIyMzY1MTI2MjEwNTk0MjY1MTQ2NjU3NTgzMzQ3MjkxNjAwMDYwODE4ODI3NDExNDg4NTMxMjY4MzM1MTYyNzY3OTUxNzIzODkyODkwOTg1NjU4MjQwNDAzMzc5NTY1NDY4NzA5MTYyOTUwNzE0NDU5MjYxNjI1NzA1NDI5OTM0NzcyODQ2MTYxMDM5NjIyNzI0MDM1Njk0Mzc2MjQyNjkxNzI2OTA5NTk2ODMwMTE1NDE4NzE4Mzk0ODIyNDc5MDY3MzY0MzYzMTE0NDQwNTA3NjU4MjQ3ODk4NDg0MzQ5ODg4NDMwNjg2MTEzMDg3NTE4NDE0OTkxMzc4MDg3MjA1NzU2ODIyODg2MDA4Njg2NzM1MTgxNzU5NjIxMzQ5Mjc3Mzg5NDYzNzI5OTIzMzUxODgxNDc5ODkxOTE0NDA2NjU3OTExMDI5ODgxMTExODc2NTgyMTQ0MDkyMTk1Mzg2NTY0NTI4NDQ4ODg4OTY3MDAwOTIyMTgyNDkyNjA0OTM2MzcwMTU3MDI5MzUyMDM3ODg1Mzc5Mzk1MjUxNDcxMzc4NTEzNTYxOTMzMTg1MDY5OTY3ODgzMjI2OTA4NjA5OTEwNDE4MzA0OTg1MDEyNjIwMTEwNzU4NjU3OTAzODU0ODc2NTMyMjg1NDg5NjY2MDkzMTAyMjQ1NTg1NjUzNTg1NzU2MzUwOTE4MDgzMTYwODEzNTc1NjczMTAzMDE5MDQ3NDg1MTQzMjg4NjQzMDE3ODEwMTEwMDQwODA0NTU5NDcwNDUxNjI4MTg5Il1dfSwgIm5vbmNlIjogIjEwODA3ODMzNzg3NjQxMzg1NjgxNjg4MDMifQ=="
      }
    }
  ],
  "credential_preview": {
    "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview",
    "attributes": [
      {
        "name": "Name",
        "value": "John Doe"
      }
    ]
  }
}
```

##### issue-credential/1.0/request-credential

```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/request-credential",
  "@id": "9f60db9f-b83f-4990-a06b-c64643388f9a",
  "~thread": {
    "thid": "29e24a0d-c9e8-4e5a-b913-6c821dfb9e25"
  },
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/accept",
      "@id": "0f9034db-3e58-498b-8119-59fa37f3e652",
      "body": {
        "id": "5d028f08-285b-4872-94c3-f309ad4b5a24",
        "event": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "time_stamp": "2021-12-13T06:50:07.180078+00:00",
          "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "state": "accept"
        },
        "proof": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:50:07.180946+00:00",
          "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..CvX_kzNTK9vBTb2J4p2cLsImgy1tPOi2_psmgxSipllR_iRxY8bf9kGyhEqy4Q7n7KAGFnd5oPKmgFhXKplDAQ"
        }
      },
      "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "created_time": "1639358418",
      "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV"
    }
  },
  "requests~attach": [
    {
      "@id": "libindy-cred-request-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJwcm92ZXJfZGlkIjogIjc3SGR2ZWM1WHhYb2NSSENybmVSUksiLCAiY3JlZF9kZWZfaWQiOiAiQ2JERHN5QXBDNHpKb3V0dU5uVGlCWTozOkNMOjgxNDpkZWZhdWx0IiwgImJsaW5kZWRfbXMiOiB7InUiOiAiNjg5MjExNTc0NDk5MTgxOTg5Nzk3NjExNDE5ODUyODIxNDEzNTQ3NzgyNzAwNTkzMDg3NTQ4MDM0NjY5NjEyMTY0Njc1NDExNjE0NzkzMDE0NTA3ODgyMzY5NzA2Njk5MDY2NTA1NzE5NDkwMTE3ODgzNjc2MjI4NTM3OTEwNjU1MjgwODgzMjkwNTg4NjcyNjk4MDYwNjAzODU3MTMyMjMyNDMzNTk5MjI5MTg3MzI1NjA3MjAxNjE0MTc2OTE4MTI3OTI3MTAxMjMzMjU1NDMxNDkwMTM3NzU3NDM0ODE1MjczNzY1NTY0NTQ1OTMxNTIyODU0MDQwMTI0NjI0Mzk3NjM0MjIzOTc5MDEzMDcxNDI2NDk0OTMyNzQxMjgzNzEzMjY5NDQxNDg3ODM3NDM0MjY4NDM5MTg1NDYyMTUzMTk4MjUyMjEyODU4NDkwNDY3MjMyMDUwODA2ODkwNzA1OTQ5ODY0Mzg5MjM2NjgwNTExOTE4NjI0ODc1OTE2NDA3MDM2MDgxOTYzMjUyODIwNDQ5MjQzNTgxODQyOTQ0NTkyNTQ1NjM5NjAxNDY2Mzk0MDk2NjA4NTk5MTQ4NjEwMzUxMTk1MTQxODY3OTExMjgxMTE1MDE3NDU2NzMwMjQzMzczMzY0ODY4NzM1Mzk0MTExOTMwMTE1NzU0MTE5MTI4MDAxMjEyMTc0NjY4MzI2OTgyOTk3OTI3MDI1MDczNTU2OTk5NjM5OTY2NTAyMTg1NjM2MDEwMDU2ODQzMjE2NzY0NTk4MjkxMzM5MjY0MzMzNjA5NTg5OTk1NDA3MzkyMTMzNDciLCAidXIiOiBudWxsLCAiaGlkZGVuX2F0dHJpYnV0ZXMiOiBbIm1hc3Rlcl9zZWNyZXQiXSwgImNvbW1pdHRlZF9hdHRyaWJ1dGVzIjoge319LCAiYmxpbmRlZF9tc19jb3JyZWN0bmVzc19wcm9vZiI6IHsiYyI6ICI4MzQ2MjUwMTQ4MzAzNDgyMDk5MzI3MDA2ODUwNzc3NTc3OTU5NjYyMzYzNzgyMTcxMDc2Mzc1OTMyMzEzMzQ1NDQwMDc1OTMzMDMwMyIsICJ2X2Rhc2hfY2FwIjogIjIxNzY3NDMyODE0Njk3OTk4MTg4MDAwOTg4MTYzNjUxMzY4ODc2NTMwNDM5MDk4NTA5NTQxNzMwNTUwOTUyMDY4MDcyODA0MTA2OTI5Mjc0ODgwNzM1NTkxNTkxNDQxNDA2ODM4NDk5MzkwNzE1NTM5OTU5MDYxMjA3NDgxMDc3Mzg5MjUxOTk5MjQzODcwODI4MTk0NTgzNTg4NjkyMDcyNTg2MTQxNzIyMTEwNzI2MTIyMTIwNDg0NDg1NTc0MzIwNTQxMzU2NDAxMzUyNzg3NzQyNTA1ODYxNjUwMjMxNzAyODY5MjI4Mjc2Mzg2NTI1MTY3NjQyMTE4MjY1MTcyNTYyMTI2ODkzMzY0MjA5OTYzNTk2ODkxMDY3MDA0OTIwMjA5NTM3MTQzNzQ2ODcxNDI4NDcxMTY5ODY2NDM3NjM1MzI4NDg5MTM1OTY5ODMwNjQ5MzI1ODYwNTk1OTU3MzkyMzc0Nzg2NTE2MjI4NDI5ODk2NDQ2Njk5MTUxNTYwNzU4ODc4MTg5NjI1MTU3NTQxMTc3OTc3OTc4NTM4OTU3NzA3MDkxNjk1NzMzMDYzODUwOTg0OTgzMzkxNDEzMDE2NTQ5OTM3NTU0OTk1ODIxMDU4NDU2MjU3NzgwNzg1NzIxMTQzOTM3NzA3NzQ4MDc0MDc1NTA4Mjg2MTgwMTIzMjc0MTk0ODU5NjQ3OTE1ODM5NTAzNTQyNDI2MzE5NjgyOTc2NzY5NTUyODEyNjk4MzIxOTMyNDgwNzg0MDAzNTY5NzA2NDc1MTk4NTI4ODQ4NzAwMDI5MTgzOTE0NTAzNzU2MzkwNjQzNTY1NzM1MzgyNjU3MjI0OTA5ODg4MjcwMTY4NzUwNDMzODU2NTU3Mzk2NDk2NTU4ODg5MjAyODk0OTcwNTQxMzY5NjY2NTgwMzI5MTMyODQ4OTIxOTM5NzgzNDYzMzEwOTAiLCAibV9jYXBzIjogeyJtYXN0ZXJfc2VjcmV0IjogIjE0OTI1OTM3NjE2MDgxNTgzOTU4NTY5MTQ5ODg3MTExNzU3NjIzOTczMzY1MTExMTM5ODczNTIxMjIxMjczNDI3OTYxNjcyMjM2NDk4MDM0MTI5NTY0NzYzNDEzOTkwNjE4NTc2NjU2OTgyMjMwODQ5MDIzODcwNTY2ODU2NDM3MjIwNzgyMTAyMzMyMTcyNDE3MDA0MDY0Mzc1MjQ5NjI3ODIxMzE2OTkxNzI5MDU4MjYxIn0sICJyX2NhcHMiOiB7fX0sICJub25jZSI6ICIzNzEyMjExNDg2NzQ5MjI4NDMyNzk0NjAifQ=="
      }
    }
  ]
}
```

#### Aries RFC 0037 Present Proof protocol enhanced with Data Agreement Context Decorator

##### present-proof/1.0/request-presentation

```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/present-proof/1.0/request-presentation",
  "@id": "dc99cca5-ea76-4b20-ab74-fe59e422ece1",
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/offer",
      "@id": "12bcc96d-88b6-4ee8-997a-4ce67b653d87",
      "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "body": {
        "@context": [
          "https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/interface-specs/data-agreement-schema/v1/data-agreement-schema-context.jsonld",
          "https://w3id.org/security/v2"
        ],
        "id": "d73043e6-4627-4e2f-a20a-2495604afd84",
        "version": 1,
        "template_id": "b59b56ad-6cba-46f5-a86b-e578a1e503ed",
        "template_version": 1,
        "data_controller_name": "Happy Shopping AB",
        "data_controller_url": "https://www.happyshopping.com",
        "purpose": "Customized shopping experience",
        "purpose_description": "Collecting user data for offering custom tailored shopping experience",
        "lawful_basis": "consent",
        "method_of_use": "data-using-service",
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
            "time_stamp": "2021-12-13T06:53:39.091120+00:00",
            "did": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
            "state": "offer"
          }
        ],
        "proof": {
          "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:53:39.094215+00:00",
          "verificationMethod": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..fmULdKkKpNi2haL7KtcZWOUkYnhtYkhlwGo3qa29lCMW7lKOaJM3iKY5SSDqPzPg7fQR_Yk4W1quj0M-TEbyDA"
        },
        "data_subject_did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
      },
      "from": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
      "created_time": "1639358631"
    }
  },
  "comment": "Collecting user data for offering custom tailored shopping experience",
  "request_presentations~attach": [
    {
      "@id": "libindy-request-presentation-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJuYW1lIjogIkN1c3RvbWl6ZWQgc2hvcHBpbmcgZXhwZXJpZW5jZSIsICJ2ZXJzaW9uIjogIjEuMC4wIiwgInJlcXVlc3RlZF9hdHRyaWJ1dGVzIjogeyJhZGRpdGlvbmFsUHJvcDEiOiB7Im5hbWUiOiAiTmFtZSIsICJyZXN0cmljdGlvbnMiOiBbXX19LCAicmVxdWVzdGVkX3ByZWRpY2F0ZXMiOiB7fSwgIm5vbmNlIjogIjQ2NjUwMTE1MTUxNzI1ODM4OTM4NjI5MyJ9"
      }
    }
  ]
}
```

##### present-proof/1.0/presentation


```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/present-proof/1.0/presentation",
  "@id": "3f62acb2-722c-4c3f-b361-0ec32a39bede",
  "~thread": {
    "thid": "dc99cca5-ea76-4b20-ab74-fe59e422ece1"
  },
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/accept",
      "@id": "4937ed2a-c2e2-4ebf-802f-9c9a4d7cca07",
      "body": {
        "id": "d73043e6-4627-4e2f-a20a-2495604afd84",
        "event": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "time_stamp": "2021-12-13T06:56:46.082679+00:00",
          "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "state": "accept"
        },
        "proof": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:56:46.083893+00:00",
          "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..5LMj7UN9lE3snlxHuG3y7BnxZ1HZhYnq3hNTVDUEQjFa0pguag0eI5BV_7mu01RAbCwcK_5_e6qE2mH-OKzGDQ"
        }
      },
      "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "created_time": "1639358817",
      "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV"
    }
  },
  "presentations~attach": [
    {
      "@id": "libindy-presentation-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJwcm9vZiI6IHsicHJvb2ZzIjogW3sicHJpbWFyeV9wcm9vZiI6IHsiZXFfcHJvb2YiOiB7InJldmVhbGVkX2F0dHJzIjogeyJuYW1lIjogIjQ5MjYzODM1NTY4NzkwODUyMjg1MTM2NzU1NTQwNTAxMTAxMDQ0OTUyNjI5MDQxMTcwMTAyNzcyNTc5OTYzNzI0NzE0ODI3MzE1NDY0In0sICJhX3ByaW1lIjogIjQyMTQzODMwNzc5NjcyMzI3MDI1ODAxNzA2MDcyNzU5ODQ5MzEzMDIxOTQ0Mjc3Mjc2NTA2MDg0Nzc1MTE2MTg0NjcwMzI4MTI2MTk4NDczMzU4NDM2NjY3MTI1ODExMTU0MzYxNDQ5NDkyMTU1ODk5NzY3MDA2NDU5Mzk2NTM5ODY2MTk1ODE1ODM2ODIxMTAzOTcwOTU3NTEyOTkxMzQwMzYzNzkxNDYwMDk1NzY0OTkxNTQzODMyNjIwOTAzMzYzMjc2NjU4NjMwNTE3ODgzNTE5NzMwNzQ1NTY4NTE4MzAzOTgwNzY4NjI5NTAwNzM0MzQ4NjU0OTE4NzU3OTEzNTA1OTQ1MTIyMjkwMTI2NTMyNTM1MDY4NTE4NzAzMDU3NTkzOTA5MTQ2OTMyNTYxNzgxNTA3NzUzNTE3NjYxMDQzNTU0MTMyMTI4OTQwODk5NjcxNDMzNzQ3NzQyMjkxMjI2NTIxOTM0NTg3NTkwOTMzMTgzNzQ4OTI0Njk5NzUxOTc5ODI1OTY1ODIzMzg0NjczNDY1MDAxMDYxMzYyODQ4OTAwMDU3NTIyNTA2OTU4ODY4MjM0NDUyNjUyMTgzMzU3NjY1NzczNDg2NDI3NDc0MjE0NjgyMjQzNjY2MTUzOTk0NjI5NDkwNzAzMDA4MDMwODAyMTUxNTYxNjc5ODk0MjI1NTkxMTcyNzQ1NzEzODQ0NTQzOTMyMzE4ODM2NzIwNjc2MjUyNDY0MTIzMDk5MjUzODE0NDIxMTY4NTU2OTI1MjMxNDM4MzAwNjE5ODcxOTY5ODM1NjI5NzA4MjAzMTY3MjExIiwgImUiOiAiNTI0Njc1NTY4MTI2NjMyMTk1NzkzMzUwMTM5NjcxNzMwNjgyMTExMjMzNjU0NDgwMDM2Nzc5NzEwMjg5ODgyMDA2MTE4NjQ5MzM1MTk1NDU0Nzc4MDEzODM5OTk4ODkyNzE2NDY0NTI3NjgwNDg0MDI3Nzg2OTk1NTA4ODg4NTI2MzY0MzMzOTciLCAidiI6ICI0ODA1NjMzOTA3MzgwNjI5NjMwNzQxODgxNzgzODY2ODY3NDQ0NTMxODIyMjY5NjEzNjcxOTcxNTc0NTUxMzA1OTk5NzUxMjc1NzI2MTMyNzkzMzQwNzA4MDAyOTY3NTQwNTUyODMxMTAwNzIxNTQzMDQzMzg1MzI2MjExMjIyNzkxOTM3NDIzNzU5NDcyNjE1NDQ3MzAzODY2MzI3MDIzMDA3ODAyMzY5NzU5MDA2MTM5MDk0MTA4OTIyNDg3OTc0Mzk4Mjk3NzM1MzQ1Nzg5NTQ0ODEzMDc2ODg1MjUxMjYwNTE3NTkxNTk1NTAwMDM1NTMzMzI2Mjg3MzQ5NzA0MTA2MjA5OTE5NDMxNTM4NjI3OTI5MTU2MzkxNDk4NTgzMDc0MTYyMjA2NTM5NjUwNzE0NjI1MzI2NzI0NTUzMjY0MTkxNDg5MjI3NDUxNjMxNzY2NTg1MTMyNzgyMTU5MzMxNTYwODcyODE1MzMzMDY4NDAyOTczMjg0NzIwMTAyMTA3MjExMDYzMTYxOTEyMjgwMTY3Mjg0MDA5ODI3NTY1MjYyNjI2MTMwNjU4MTU0MjU1MDM4MzY5NzA3OTUwNzQzNzM5ODI4NTM4NDAzNzg1NTc2NzUzMDMxNzQ2MzU1NjEzMzkxNzE5ODU1MTY0MDUwOTI4MDgyNjExNDQ4NjU2NDk2MTc3NTg3NzExNjg1MDU4Mzg4NjkzMTMxNTYzMTIzMDk4Mjk0NzAxODU1NzQ4MDAyNzEzMzg0NTk0MjM4MzU1MzExODI3Mzg5NzI1MzE4NDE0ODIwNTQwMjI5NzE5NzA5ODE3NTA0MDYwOTg3MDU2Mzk0MjM3MTg5NTE0ODk0NzY1MDQ0NTc2NjIzMjQ3NjAxNjQwNTU0NzMyNzM4Njk2Mjk5MDY5MTI4NjI5NDc1MjQ2NjkxNzI2NDkwNzAwNzM1MjAzOTU5MjQxMjc3ODk3NjY3MTE0MDI2NjQxMjQwMTE0MzE1MDE0NzkxMzk0MzQwMDIzODIyNjgwNDEwMDMyMzI5MjEyMzA0NDY2NjU3MDg2NzgyOTEzNDQ5Njc5NjE4NjI3MDc1NTc4MDMxNDg1MjczMjE1Mjc0MDU4MDYzNjkxNjk1MzYzNTcwODU3MjQxNTI0MTczNDM2MzUwNzkxMjU3MjIxNzM5MTEwMDM0NzA4NDUzNTY5MjI5MzU4MDgwNTEzNjg1Mjk3NDMwMDk0NTM3MjQiLCAibSI6IHsibWFzdGVyX3NlY3JldCI6ICIxNDAxODQ3MDA4Nzg4NTA5MDMwOTIzMjYzMjgxNzg3NjQ3ODQzMzQxMDA3NjM5MzQxNDI5MTMyMTcwMDMwNTExNDUxMDA3NjcwMjI5NDY4OTg4OTc3OTEzNjI1NTAzMDE5NjE3NDUyNDQwOTg0OTc2NjM2MTc1NDI3MzE0MTE5NTU4NzA4OTkxNzgyODExMTYzODk1NTQ1ODY3ODkzOTc4MjM0MjAxMjcwNjAwOTE2NjQzNyJ9LCAibTIiOiAiOTA5MDcyMTc4NjA4MzQ5MjY2ODYzNDk2NDM1OTExMjY1OTM4NjAwOTExNzI4MzI1MTI5NDk3OTc2NDE0MzQzNzMzNDY3Nzc1MTgwNjE1MjYyNDIyMzg2ODMyNTQyNzcyOTc0OTI1OTU5NTk0ODcyODE5NzQwMDIxMTQxMDg2ODk2MjEwMTU4NjkxNzc0MzE1NjY3OTcyNTk5ODY5NDU5ODE2NTYyMTQ1Njc2MDk0ODQzNCJ9LCAiZ2VfcHJvb2ZzIjogW119LCAibm9uX3Jldm9jX3Byb29mIjogbnVsbH1dLCAiYWdncmVnYXRlZF9wcm9vZiI6IHsiY19oYXNoIjogIjkxNjM1ODgwMzU2MjI5ODA5MDc2NTA4MjQ1NDcxNjM3NDc1NDc2MTQ3NDc0NzYwNDgzMTI5MzAwNDcxNjEyOTUwMjI5MjE4MzQzOTc5IiwgImNfbGlzdCI6IFtbMSwgNzcsIDIxNSwgMjM2LCAyNCwgMTUsIDU5LCA3OSwgOTIsIDIyMywgMTk1LCAxMzEsIDE3LCAxMDYsIDgsIDE3NywgMTAsIDkwLCAxMzAsIDEwMSwgNSwgMTY4LCAyNDMsIDIxLCAxOTAsIDE3MywgMTg1LCA4LCAxNjUsIDIwMCwgMjE5LCAxNjYsIDM1LCA1NywgMTAzLCA4MSwgMTcxLCA3LCAxMywgMTQ5LCAyMzYsIDE1LCA5NywgMjI5LCAyNTQsIDE3MCwgMTkxLCAyLCAxMDcsIDgsIDIxOCwgMjI2LCA4MywgOSwgOSwgODksIDIwMCwgNjAsIDI1NCwgMjIwLCAxMDksIDE3OCwgNTQsIDExNCwgMTc4LCA1NiwgNTksIDE2OSwgMTkxLCA2MiwgMTM3LCAxMDgsIDE5OSwgMjIwLCAxMTIsIDIwOSwgOTksIDE3NCwgNDMsIDI5LCA1NCwgMTksIDEzOSwgNjgsIDMwLCAxNjAsIDIyOSwgMTg4LCAyMzYsIDUzLCAyNiwgODYsIDcxLCAxNDEsIDE4MCwgODgsIDE3OCwgMTAyLCA0MSwgMTIzLCAxMzcsIDQ1LCAyMjksIDExNSwgNTksIDE2MiwgNDcsIDM3LCAxODgsIDg2LCAxMDcsIDIzMiwgMTQyLCAxNzMsIDE5LCAxOSwgMjAyLCAyMjUsIDEwOCwgMTg3LCAwLCA4NywgMjI0LCAxNywgMjM0LCAxODYsIDcwLCAyMDMsIDQxLCAyMDIsIDE3NywgNTksIDI0MSwgMjE4LCAxNDQsIDgyLCAyMTIsIDE2LCAyNDgsIDE4NiwgMjQ5LCAxMDYsIDI3LCAxNjAsIDE0NCwgMjM3LCA1MiwgMjIsIDEsIDIyNiwgNDEsIDE5OCwgMjQzLCA5OSwgMywgMjQsIDE3MCwgNzksIDcsIDIzOCwgMjA4LCAxNTEsIDExMCwgMjQ2LCAxMzAsIDEwMywgMTY2LCA2NCwgMTU3LCAxNCwgMTE2LCA2OSwgMjQzLCAxMjAsIDgwLCAxODgsIDIzMSwgMTQ3LCAxNTgsIDYyLCAxLCAxMywgOCwgNzUsIDIyLCAxNzAsIDIxNiwgMTY2LCAxNiwgMTk2LCA3MCwgNDIsIDE0NiwgMTY5LCAyMDEsIDIyOSwgMTU0LCA4MSwgMTU3LCA4NywgMTYzLCAyNywgMTYzLCA0NywgMjEzLCAyMDQsIDI1NCwgNTgsIDkzLCAxNTEsIDQ2LCAxOTMsIDIzOSwgMTE2LCAyMDYsIDEyOSwgNjQsIDIwMiwgMiwgMTU5LCAxNzMsIDE0MiwgMTAyLCAxMTcsIDEyMSwgMTIwLCAxNzcsIDQwLCA3LCAxNTcsIDI0NywgMjA4LCAxMzEsIDE4NCwgMjM2LCAxMzUsIDIyNSwgMjI4LCAyNTQsIDE1LCAxMDksIDgxLCAxNjUsIDEzNCwgMjM5LCAxNTMsIDY1LCA5MiwgMTQ1LCAzMSwgNjAsIDIyOCwgMTU1LCAxMzYsIDI2LCAxNDEsIDIzNV1dfX0sICJyZXF1ZXN0ZWRfcHJvb2YiOiB7InJldmVhbGVkX2F0dHJzIjogeyJhZGRpdGlvbmFsUHJvcDEiOiB7InN1Yl9wcm9vZl9pbmRleCI6IDAsICJyYXciOiAiSm9obiBEb2UiLCAiZW5jb2RlZCI6ICI0OTI2MzgzNTU2ODc5MDg1MjI4NTEzNjc1NTU0MDUwMTEwMTA0NDk1MjYyOTA0MTE3MDEwMjc3MjU3OTk2MzcyNDcxNDgyNzMxNTQ2NCJ9fSwgInNlbGZfYXR0ZXN0ZWRfYXR0cnMiOiB7fSwgInVucmV2ZWFsZWRfYXR0cnMiOiB7fSwgInByZWRpY2F0ZXMiOiB7fX0sICJpZGVudGlmaWVycyI6IFt7InNjaGVtYV9pZCI6ICJDYkREc3lBcEM0ekpvdXR1Tm5UaUJZOjI6Q3VzdG9tZXIgbG95YWx0eSBwcm9ncmFtOjEuMC4wIiwgImNyZWRfZGVmX2lkIjogIkNiRERzeUFwQzR6Sm91dHVOblRpQlk6MzpDTDo4MTQ6ZGVmYXVsdCIsICJyZXZfcmVnX2lkIjogbnVsbCwgInRpbWVzdGFtcCI6IG51bGx9XX0="
      }
    }
  ]
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
