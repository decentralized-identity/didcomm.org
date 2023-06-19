---
title: Data Disclosure Agreement Protocol Specification
publisher: lalc
license: MIT
piuri: https://didcomm.org/dda-marketplace/1.0
status: Production
summary: A Data Disclosure Agreement (DDA) enables automated agreement handling for data exchange between a Data Source (DS) and Data Using Service (DUS).
tags: []
authors:
  - name: Mr. George Padayatti (iGrant.io, Sweden)  
  - name: Mr. Lal Chandran (iGrant.io, Sweden)

---
# Data Disclosure Agreement Protocol Specification

**Specification Status:** version 1.0.0 (Ready for impplementation)
This is reviewed and implementation has started. This spec is live and is being iterated as part of the PS-SDA project in NGI-ONTOCHAIN. The project has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No 957338.

**Latest Draft:** [Avaialble here](https://dda.igrant.io)

**Editors:**
Mr. George Padayatti (iGrant.io, Sweden)  
Mr. Lal Chandran (iGrant.io, Sweden)

**Contributors and Reviwers:**
Ms. Lotta Lundin (iGrant.io, Sweden)
Dr. David Goodman (iGrant.io, Sweden)  
Mr. Jan Linquist (Linaltec, Sweden) 

**Participate**
- [GitHub repo](https://github.com/decentralised-dataexchange/data-exchange-agreements)
- [File a bug](https://github.com/decentralised-dataexchange/data-exchange-agreements/issues)
- [Commit history](https://github.com/decentralised-dataexchange/data-exchange-agreements/commits/main)

------------------------------------
## Abstract
A Data Disclosure Agreement (DDA) enables automated agreement handling for data exchange between a Data Source (DS) and Data Using Service (DUS). It helps organisations to continue leveraging their data assets while being transparent and legitimate in their data usage. Automated agreement handling is a requisite for a scalable and regulatory-compliant data marketplace.. It also provides individuals control over how their data is used and exchanged.

## Protocol flow
### Actors

1. Data Using Service (DUS)
2. Data Source (DS)
3. Individual
4. Data Intermediary
### Pre-requisite

The prerequisites are:

1. All the actors involved in the protocol flow are DIDComm agents. Each interaction between the actors requires a DIDComm message.
   
2. Prior to the PS-SDA protocol flow, actors must establish connections [1] between each other and identify themselves by presenting the necessary proofs [2].
   
3. All the actors will have a wallet (mobile or cloud-based, individual and potentially for an enterprise) address and an associated public / private key pair.
   
4. A wallet address is an externally owned account (EOA) address. Ethereum addresses are composed of the prefix "0x" (hexadecimal) concatenated with the rightmost 20 bytes of the Keccak-256 hash of the ECDSA public key with the curve secp256k1.

### Out of scope

The administrative and governance frameworks of the “marketplace” or “data space” is out of scope. The marketplace has performed the proof of business and onboarded DS and DUS. 

### Publish DDA offer to Marketplace (DS)

![](../images/publish-dda-to-marketplace.png)
#### Messages

The `/dda-marketplace/1.0` protocol consists of these messages:

1. `/dda-marketplace/1.0/publish-request`
2. `/dda-marketplace/1.0/publish-response`

#### Sign the DDA offer

The DS signs the DDA offer using the secp256k1 private key. The signature is prepared by performing the proof algorithm described by W3C Data Integrity 1.0 specification [3].
#### Send signed DDA offer to Data Intermediary

The DS construct a DIDComm message of type `/dda-marketplace/1.0/publish-request` and sends it to the Data Intermediary DIDComm agent. An example is provided below.

```json
{
  "type": "https://didcomm.org/dda/1.0/publish-request",
  "id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>",
  "body": {
    "data_disclosure_agreement": {}
  }
}
```
#### Data Intermediary stores the signed DDA offer to CAS

Once the DDA is received from the DS, the Data Intermediary stores the offer in Content Addressable Storage (CAS) for e.g. IPFS and obtains the Content Identifier (CID). 
#### Data Intermediary anchors CID to Ethereum

The Content Identifier (CID) pointing to a specific DDA offer is anchored to Ethereum by executing the `publishDDACID` smart contract function.

The Data Intermediary create a /dda-marketplace/1.0/publish-response DIDComm message and sends it to the DS. This message contains Ethereum transaction hash for the DS to verify the transaction. An example is provided below:

```json
{
  "type": "https://didcomm.org/dda/1.0/publish-response",
  "id": "53f19e0b-5be2-480a-92bc-fcdeabf69ad3",
  "~thread": {
        "thid": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4"
    },
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>",
  "body": {
    "txn_hash": "0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e"
  }
}
```

#### Data intermediary publishes the DDA offer to a data marketplace

The data marketplace will subscribe to the smart contract events specific to `publishDDACID` function and list the DDA in the marketplace. [4]

### Negotiate DDA

The DIDComm protocol is used to facilitate interaction between DS and DUS to negotiate terms for the DDA.

![](../images/negotiate-dda.png)

#### Messages

The `/dda-negotiation/1.0` protocol consists of these messages:

1. `/dda-negotiation/1.0/propose-terms`
2. `/dda-negotiation/1.0/accept-terms`
3. `/dda-negotiation/1.0/reject-terms`
4. `/dda-negotiation/1.0/accept-dda`

#### DUS proposes terms for DDA (Counter offer)
Resolve CID to obtain a DDA offer from IPFS and then construct a counter proposal if the "terms" are not satisfactory. An example is as provided below:

```json
{
  "type": "https://didcomm.org/dda-negotiation/1.0/propose-terms",
  "id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>",
  "body": {
    "data_disclosure_agreement": {}
  }
}
```
#### DS accepts the proposed terms

The DS updates the DDA to include the proposed terms and signs it. A copy of the same is sent to the DUS for counter-signing. An example is as provided below:

```json
{
  "type": "https://didcomm.org/dda-negotiation/dda-negotiation/1.0/accept-terms",
  "id": "53f19e0b-5be2-480a-92bc-fcdeabf69ad3",
  "~thread": {
        "thid": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4"
    },
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>",
  "body": {
    "data_disclosure_agreement": {}
  }
}
```

#### DS rejects the proposed terms

An example is provided below.

```json
{
  "type": "https://didcomm.org/dda-negotiation/dda-negotiation/1.0/reject-terms",
  "id": "53f19e0b-5be2-480a-92bc-fcdeabf69ad3",
  "~thread": {
        "thid": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4"
    },
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>"
}
```

#### DUS accepts the DDA

The DUS counter signs the DDA and sends a copy to the DS. An example is as provided below:

```json
{
  "type": "https://didcomm.org/dda-negotiation/dda-negotiation/1.0/accept-dda",
  "id": "1b8381a8-5b7a-44b0-a6b6-037a4aac5609",
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>"
  "body": {
    "data_disclosure_agreement": {}
  }
}
```
### Exchange personal data between DS and DS with unknown individual identity (E.g. Anonymised data exchange)
In this mode of personal data exchange, DS and DUS do not need individual identity proof before the data is exchanged e.g. in the case of a DUS using anonymous or pseudonymous data sharing to offer personalised services,

![](../images/exchange-without-identification.png)

#### DA Negotiation

DS and Individual agree on the terms of data usage in conformance to [ADA RFC 0003](https://github.com/decentralised-dataexchange/automated-data-agreements/blob/main/docs/didcomm-protocol-spec.md#40ada-rfc-0003-data-agreement-negotiation-protocol-10).

#### Release personal data
##### Messages

The `/data-exchange/1.0` protocol consists of these messages:

1. `/data-exchange/1.0/request-access`
2. `/data-exchange/1.0/grant-access`

##### DUS request access to personal data

The DUS requests access to personal data by presenting the hash of a signed DDA document to the DS. An example is provided below:

```json
{
  "type": "https://didcomm.org/dda-negotiation/data-exchange/1.0/request-access",
  "id": "1b8381a8-5b7a-44b0-a6b6-037a4aac5609",
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>"
  "body": {
    "dda_hash": ""
    "nonce": ""
  }
}
```
##### DS grant access to personal data

The DS validates (checks for e.g. expiry, revocation list etc.), authenticates the DDA and releases an "access_token" to the protected resources.

The Access Token is constructed according to [JWT IETF 7519](https://datatracker.ietf.org/doc/html/rfc7519). The Access Token claim set contains necessary claims for access to the protected resource. Following are the mandatory claims.

* dda: Hash of the signed DDA.
* resource_endpoints: Array of protected resource endpoints which accept the Access Token.
* iss (issuer): Issuer of the JWT
* sub (subject): Subject of the JWT (the user)
* aud (audience): Recipient for which the JWT is intended
* exp (expiration time): Time after which the JWT expires
* nbf (not before time): Time before which the JWT must not be accepted for processing
* iat (issued at the time): Time at which the JWT was issued; can be used to determine the age of the JWT
* jti (JWT ID): Unique identifier; can be used to prevent the JWT from being replayed (allows a token to be used only once)

To ensure secure Access Token issuance, we implement an Authenticated Key Exchange (AKE) cryptographic protocol. The AKE provides additional security against potential attacks (MITM, replay attacks, etc.).

The AKE1 variant, as described in chapters 21.1-21.2 ([https://toc.cryptobook.us/book.pdf](https://toc.cryptobook.us/book.pdf)) is implemented.

The AKE is a non-interactive protocol. The steps are provided below.

1. Encrypt the Access Token using the secp256k1 public key associated with the DUS to obtain the cipher text. (AES-CBC ECIES)

2. Generate a signature for the cipher text.

The DS publishes the access token to Ethereum by executing the `publishAccessToken` smart contract function. This function accepts three parameters:


* cipher_text
* sig
* nonce

The DS constructs a /data-exchange/1.0/grant-access DIDComm message with an Ethereum transaction hash in the body and responds to the DUS. An example is provided below:

```json
{
  "type": "https://didcomm.org/dda-negotiation/data-exchange/1.0/grant-access",
  "id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
  "~thread": {
        "thid": "1b8381a8-5b7a-44b0-a6b6-037a4aac5609"
    },
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>"
  "body": {
    "txn_hash": "0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e"
  }
}
```

##### DUS obtains the access token

The DUS resolves the transaction to obtain the cipher_text, sig and nonce, then proceeds to perform the following steps:

1. Decrypts the cipher_text using a private key (AES-CBC ECIES)
2. Verifies the signature
3. Decodes the payload in the Access Token JWT to obtain claims and identify the endpoints accessible for the access token

Note: Cipher text format - &lt;iv>&lt;raw ephemeral public key>&lt;encrypted data>.

### Exchange personal data between DS and DS with known individual identity

The DS and DUS require individual identity proof before the data is exchanged. This is the case, for e.g. during a registration process, check-ins, covid-credential exchange etc.

![](../images/exchange-with-identification.png)

The Individual in the above flow diagram maintains two identities. They are:

1. Identity_DS - Identity of Individual at DS
2. Identity_DUS - Identity of Individual at DUS

#### DA Negotiation between DS and Individual

The DS and Individual agree on the terms of data usage in conformance to [ADA RFC 0003](https://github.com/decentralised-dataexchange/automated-data-agreements/blob/main/docs/didcomm-protocol-spec.md#40ada-rfc-0003-data-agreement-negotiation-protocol-10).

#### DDelegated DA Negotiation between DUS and Individual

##### Messages

The `/delegated-da-negotiation/1.0` protocol consists of these messages:

1. `/delegated-da-negotiation/1.0/initiate`
2. `/delegated-da-negotiation/1.0/connection-invitation`
3. `/delegated-da-negotiation/1.0/offer`
4. `/delegated-da-negotiation/1.0/accept`
5. `/delegated-da-negotiation/1.0/reject`
6. `/delegated-da-negotiation/1.0/forward`

##### DUS requests DS to collect sign-off for DA (DUS) from Identity_DS 

An example is as provided below:

```json
{
  "type": "https://didcomm.org/delegated-da-negotiation/1.0/initiate",
  "id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>",
  "body": {
    "da": {}
  }
}
```

##### DS responds with connection-invitation for the individual. 

An example is provided below.

```json
{
  "type": "https://didcomm.org/delegated-da-negotiation/1.0/initiate",
  "id": "1b8381a8-5b7a-44b0-a6b6-037a4aac5609",
  "~thread": {
    "thid": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4"
  },
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>",
  "body": {
    "invitation": {
      "serviceEndpoint": "https://didcomm.data-source.com/",
      "routingKeys": [],
      "recipientKeys": [
        "kHJvUaokuKfz4sELM6qCSELiHxBNikjcMnvjo3Kjq8L"
      ],
      "@id": "cf4bbbab-a60a-472c-9d9f-66852b20f6cb",
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation"
    }
  }
}
```

##### Individual establishes connection with DS

The DUS presents the connection-invitation received from DS to Individual as QR code (or other means). The Individual establishes a connection with the DS. [1]

##### DS identifies Individual as Identity_DS

The DS identifies the Individual by requesting proof presentation for Verifiable Credential [2] that was issued when Individual onboarded to DS.

##### DS offers DA to Individual on behalf of  DUS

The DS checks if a DA (purpose: 3rd party disclosure) exists between the DS and Individual. If such exists, the DS adds the offer_endorsed event to the DA and signs it. The signed DUS DA is offered to the Individual. An example is as provided below:

```json
{
  "type": "delegated-da-negotiation/1.0/offer",
  "id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>",
  "body": {
    "da": {}
  }
}
```
##### Individual accepts the DA

Individual constructs the DIDComm message in accordance to [ADA RFC 0003](https://github.com/decentralised-dataexchange/automated-data-agreements/blob/main/docs/didcomm-protocol-spec.md#4222accept).

##### Individual rejects the DA

Individual constructs the DIDComm message in accordance to [ADA RFC 0003](https://github.com/decentralised-dataexchange/automated-data-agreements/blob/main/docs/didcomm-protocol-spec.md#4223reject). The individual constructs a forward message with the DUS as the recipient and sends it to the DS. The DS will forward the same to the DUS.

##### DS forwards the response from Individual to DUS

DUS process the `/forward` message from received DS in accordance to [Aries RFC 0094](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0094-cross-domain-messaging/README.md)

#### Release personal data

##### Messages

The `/data-exchange/1.0` protocol consists of these messages:

1. `/data-exchange/1.0/request-access`
2. `/data-exchange/1.0/grant-access`

##### DUS requests access to personal data

The DUS requests access to personal data by presenting the hash of a signed DUS DA document to the DS. An example is provided below:

```json
{
  "type": "https://didcomm.org/dda-negotiation/data-exchange/1.0/request-access",
  "id": "1b8381a8-5b7a-44b0-a6b6-037a4aac5609",
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>"
  "body": {
    "da_hash": ""
    "nonce": ""
  }
}
```

##### DS grant access to personal data

The DS validates (for e.g., check expiry, check revocation list) and authenticates the DUS DA and releases an "access_token" to the protected resources.

An Access Token is constructed according to [JWT IETF 7519](https://datatracker.ietf.org/doc/html/rfc7519). The Access Token claim set contains necessary claims for access to the protected resource. The following are mandatory claims.

* dda: Hash of the signed dda.
* da: Hash of the signed da
* resource_endpoints: Array of protected resource endpoints which accepts the Access Token.
* iss (issuer): Issuer of the JWT
* sub (subject): Subject of the JWT (the user)
* aud (audience): Recipient for which the JWT is intended
* exp (expiration time): Time after which the JWT expires
* nbf (not before time): Time before which the JWT must not be accepted for processing
* iat (issued at time): Time at which the JWT was issued; can be used to determine age of the JWT
* jti (JWT ID): Unique identifier; can be used to prevent the JWT from being replayed (allows a token to be used only once)

To ensure secure Access Token issuance, we implement an Authenticated Key Exchange (AKE) cryptographic protocol. The AKE provides additional security against potential attacks (MITM, replay attacks, etc.).

An AKE1 variant, as described in chapters 21.1-21.2 ([https://toc.cryptobook.us/book.pdf](https://toc.cryptobook.us/book.pdf)) is implemented.

The AKE is a non-interactive protocol. The steps are provided below.

1. Encrypt the Access Token using the secp256k1 public key associated with DUS to obtain the cipher text. (AES-CBC ECIES)
2. Generate a signature for the cipher text.

The DS publishes the access token to Ethereum by executing the `publishAccessToken` smart contract function. This function accepts three parameters:


* cipher_text
* sig
* nonce

The DS constructs `/data-exchange/1.0/grant-access` a DIDComm message with the Ethereum transaction hash in the body and responds to the DUS. An example is provided below: 

```json
{
  "type": "https://didcomm.org/dda-negotiation/data-exchange/1.0/grant-access",
  "id": "999f6c2b-b0e5-4123-aab0-b5f7bfc780c4",
  "~thread": {
        "thid": "1b8381a8-5b7a-44b0-a6b6-037a4aac5609"
    },
  "created_time": "1639288911",
  "from": "<sender did>",
  "to": "<receipient did>"
  "body": {
    "txn_hash": "0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e"
  }
}
```

##### DUS obtains the access token

The DUS resolves the transaction to obtain the cipher_text, sig and nonce, then proceeds to perform the following steps.

1. Decrypts the cipher_text using a private key. (AES-CBC ECIES)
2. Verifies the signature.
3. Decodes the payload in Access Token JWT to obtain claims and identify the endpoints accessible for the access token.

Note: Cipher text format - `&lt;iv>&lt;raw ephemeral public key>&lt;encrypted data>`

### Smart Contracts

Following are the smart contracts that will be used in the protocol:



* [Ethereum DID Registry smart contract for did:ethr identifiers](https://github.com/uport-project/ethr-did-registry/blob/develop/contracts/EthereumDIDRegistry.sol)
* DDA Marketplace smart contract
    * `publishDDACID(CID)`
    * `publishAccessToken(cipher_text, sig, nonce)`
## Implementation Considerations

Successful execution of protocols described in this document might involve invoking sub-protocols; a coroutine approach can simplify this, where it is possible to compose multiple protocols to achieve a complex goal. For e.g. during the exchange of personal data with the identification of individuals, it is necessary for the DS to invoke a "Connections'' protocol and then a "Verifications" protocol, e.t.c, after which the DS gets back to the DUS with a positive or negative response. All this while the DUS can check the status of an active protocol with the DS. This approach is being discussed in detail at [Aries RFC 0478](https://github.com/hyperledger/aries-rfcs/tree/main/concepts/0478-coprotocols).

## References

1. Aries RFC 0160 Connection protocol - [https://github.com/hyperledger/aries-rfcs/tree/main/features/0160-connection-protocol](https://github.com/hyperledger/aries-rfcs/tree/main/features/0160-connection-protocol)
2. Aries RFC 0037 Present Proof protocol - [https://github.com/hyperledger/aries-rfcs/tree/main/features/0037-present-proof](https://github.com/hyperledger/aries-rfcs/tree/main/features/0037-present-proof)
3. W3C Data Integrity 1.0 specification - [https://w3c-ccg.github.io/data-integrity-spec](https://w3c-ccg.github.io/data-integrity-spec)
4. [https://ethereum.org/en/developers/docs/smart-contracts/anatomy/#events-and-logs](https://ethereum.org/en/developers/docs/smart-contracts/anatomy/#events-and-logs) 


## Appendix A
### A.1	Abbreviations

<table>
  <tr>
   <td><strong>Abbr.</strong>
   </td>
   <td><strong>Description</strong>
   </td>
  </tr>
  <tr>
   <td>ADA
   </td>
   <td>Automated Data Agreements
   </td>
  </tr>
  <tr>
   <td>CRUD
   </td>
   <td>Create / Read / Update / Delete
   </td>
  </tr>
  <tr>
   <td>DA
   </td>
   <td>Data Agreement 
   </td>
  </tr>
  <tr>
   <td>DAO
   </td>
   <td>Decentralized Autonomous Organizations
   </td>
  </tr>
  <tr>
   <td>DDA
   </td>
   <td>Data Disclosure Agreement (Introduced first in this specification)
   </td>
  </tr>
  <tr>
   <td>DEXA
   </td>
   <td>Data Exchange Agreements
   </td>
  </tr>
  <tr>
   <td>DID
   </td>
   <td>Decentralised Identifier (according to W3C)
   </td>
  </tr>
  <tr>
   <td>DPA
   </td>
   <td>Data Processing Agreement
   </td>
  </tr>
  <tr>
   <td>DPIA
   </td>
   <td>Data Protection Impact Assessment
   </td>
  </tr>
  <tr>
   <td>DS
   </td>
   <td>Data Source
   </td>
  </tr>
  <tr>
   <td>DUS
   </td>
   <td>Data Using Service
   </td>
  </tr>
  <tr>
   <td>EEA
   </td>
   <td>European Economic Area
   </td>
  </tr>
  <tr>
   <td>EU
   </td>
   <td>European Union
   </td>
  </tr>
  <tr>
   <td>GDPR
   </td>
   <td>General Data Protection Regulation
   </td>
  </tr>
  <tr>
   <td>IPFS
   </td>
   <td>Inter Planetary File System
   </td>
  </tr>
  <tr>
   <td>ISO
   </td>
   <td>International Organization for Standardization
   </td>
  </tr>
  <tr>
   <td>JSON
   </td>
   <td>JavaScript Object Notation
   </td>
  </tr>
  <tr>
   <td>SDK
   </td>
   <td>Software Development Kit
   </td>
  </tr>
  <tr>
   <td>SSI
   </td>
   <td>Self Sovereign Identity
   </td>
  </tr>
  <tr>
   <td>ToIP
   </td>
   <td>Trust over Internet Protocol
   </td>
  </tr>
  <tr>
   <td>VC
   </td>
   <td>Verifiable credentials
   </td>
  </tr>
  <tr>
   <td>W3C
   </td>
   <td>World wide web consortium
   </td>
  </tr>
</table>

### A.2	Terminology

<table>
  <tr>
   <td><strong>Term</strong>
   </td>
   <td><strong>Description</strong>
   </td>
  </tr>
  <tr>
   <td>Data Agreement (DA)
   </td>
   <td>A data agreement exists between organisations and individuals in the use of personal data. This agreement can have any legal basis outlined according to any data protection regulation, such as the GDPR.
   </td>
  </tr>
  <tr>
   <td>Data Disclosure Agreement (DDA)
   </td>
   <td>Data disclosure agreements are formal contracts that detail what data is being shared and the appropriate use for the data between a DS and a DUS. It records conditions on which a DUS will consume data from a DS. A DDA could contain both personal and non-personal data.
   </td>
  </tr>
  <tr>
   <td>Decentralised IDentifier (DID)
   </td>
   <td>A DID is a new type of identifier that is globally unique, resolvable with high availability, and cryptographically verifiable. DIDs are typically associated with cryptographic material, such as public keys and service endpoints, for establishing secure communication channels.
   </td>
  </tr>
  <tr>
   <td>Data Processing Agreement
   </td>
   <td>A Data Processing Agreement is a legally binding contract, either in written or electronic form, entered between a data processor and a data controller that states the rights and obligations of each party concerning the protection of personal data. The agreement will be legally binding in any data protection regulation, such as the GDPR.
   </td>
  </tr>
  <tr>
   <td>Data Source (DS)
   </td>
   <td>The role responsible for collecting, storing, and controlling personal data that persons, operators, and DUSs may wish to access and use; is defined as per MyData.
   </td>
  </tr>
  <tr>
   <td>Data Using Service (DUS)
   </td>
   <td>The role responsible for processing personal data from one or more data sources to deliver a service; is defined as per MyData
   </td>
  </tr>
  <tr>
   <td>Data Protection Impact Assessment (DPIA).
   </td>
   <td>A Data Protection Impact Assessment is a process designed to help systematically analyse, identify and minimise the data protection risks of a project or plan.
   </td>
  </tr>
  <tr>
   <td>Individual
   </td>
   <td>A natural, living human being, in the GDPR, also referred to as a data subject
   </td>
  </tr>
  <tr>
   <td>Inter Planetary File System (IPFS
   </td>
   <td>The InterPlanetary File System (IPFS) is a protocol and peer-to-peer network for storing and sharing data in a distributed file system. IPFS uses content-addressing to uniquely identify each file in a global namespace connecting all computing devices
   </td>
  </tr>
  <tr>
   <td>Self Sovereign Identity
   </td>
   <td>A model for managing digital identities where individual identity holders can create and control their verifiable credentials without being forced to request permission from an intermediary or centralised authority and give control over how their data is shared and used
   </td>
  </tr>
</table>

