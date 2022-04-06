# DIDComm V2 Guidebook

If you're a developer who wants to learn the practicalities of DIDComm -- getting started, common recipes, libraries and tools, the theory behind [the spec](https://identity.foundation/didcomm-messaging/spec/), or how your peers are solving interesting problems -- this is the place.

This is a living doc, updated and expanded regularly by the [DIDComm User Group](https://github.com/decentralized-identity/didcomm-usergroup). If you have suggestions for the book, we welcome your [contributions](../maintainer-guide.md); reach out to us on [Discord](https://discord.gg/eNN4Wns6Jb) or [email](https://lists.identity.foundation/g/didcomm-usergroup) for help.

>This version of the book focuses on [DIDComm v2](https://identity.foundation/didcomm-messaging/spec/) (the one incubated by DIF, finalized in early 2022). For info about migration from [DIDComm v1](https://github.com/hyperledger/aries-rfcs/tree/main/concepts/0005-didcomm), see [Appendix: Migration from DIDComm v1](migration-v1.md). A new version of DIDComm, v3, is imagined. This would be an IETF standard that builds on v2 with a session construct, improved binary support, leaner messages for IoT, and so forth. When we have links for that work, we'll add them here. 

## Contents

1. [Why DIDComm?](why)
2. Hello World
    1. Choosing libraries and tools
    3. Putting a message in an encrypted envelope
    4. Using a transport
    5. Receiving a message
3. [Threading](threading)
4. Protocols
    1. Implementing a protocol
    2. Designing your own protocol
       1. When this makes sense
       2. Conventions
       3. Best practices
    3. Sharing your protocol
    4. Co-protocols
5. Recipes
    1. Debugging
    2. [Timeouts](timeouts)
    3. Retries
    4. Localization
    5. N-wise
    6. Bootstrapping
    7. Using DIDComm security outside DIDComm
6. Safety
    1. [Privacy](privacy)
    2. Security
        1. Authcrypt vs. Anoncrypt
        2. Choosing curves
        3. Choosing DID methods
    3. Message security contexts
    4. DID rotation
    5. [Perfect forward secrecy](pfs)
    6. [Man in the middle](mitm)
7. [Routing](routing)
8. Appendix: Migration from DIDComm v1
    1. [What's new](whatsnew)
    2. Migrator script

