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

The high-level component architecture illustrated below follows a microservice architecture that can be plugged into existing systems. The core components deliver Data Agreement services, exposed as RESTFul APIs or DIDComm. The pluggable component can exist independently in any service provider where Data Agreement core services can be plugged into. 

![alt_text](https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/docs/images/ada-component-arch.png "Data Agreement Component Architecture")

### Implementation View

The current implementation that can be plugged into ACA-Py  is as illustrated below. Here, all services are exposed as a RESTful API or as DIDComm and can communicate with any agent with similar capabilities. In case any external agent is not ACA-Py, the assumption is that they support the Data Agreement protocols and support DIDComm.

The MyData DID Registry can either be locally instantiated or can be accessed via a standalone external service. 

![alt_text](https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/docs/images/ada-implementation-view.png "Data Agreement Component Implementation View")

### Protocols

The table below contains a list of protocols that are part of the data agreement specification.

| Protocol                            | Version | Description                                                                                                                                                                                                                                             | Specification URL                             |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Data Agreement Negotiation Protocol | 1.0     | This specification defines DIDComm protocol for a Data Controller (Data Source or Data Using Service) to send a Data Agreement offer to an Individual (Data Subject). Individuals receiving the Data Agreement Offer can decide to accept or reject it. | [Link](./data-agreement-negotiation.md)       |
| Data Agreement Termination Protocol | 1.0     | This specification describes a DIDComm protocol for a Data Subject to terminate a Data Agreement and notify the Organisation (Data Using Service or Data Source)                                                                                        | [Link](./data-agreement-termination.md)       |
| Data Agreement Proofs Protocol      | 1.0     | This specification describes a DIDComm protocol to verify and authenticate the proof chain associated with a Data Agreement instance (receipt).                                                                                                         | [Link](./data-agreement-proofs.md)            |
| Data Agreement Context Decorator    | 1.0     | The `~data-agreement-context decorator` describes the associated Data Agreement protocol or holds references to a signed/counter-signed Data Agreement document inline to a DIDComm message.                                                            | [Link](./data-agreement-context-decorator.md) |