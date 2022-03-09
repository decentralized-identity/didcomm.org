# DIDComm Guidebook

If you're a developer who wants to learn the practicalities of DIDComm -- common recipes, libraries and tools, the theory behind [the spec](https://identity.foundation/didcomm-messaging/spec/), or how your peers are solving interesting problems -- this is the place.

This is a living doc, updated and expanded regularly by the [DIDComm User Group](https://github.com/decentralized-identity/didcomm-usergroup). If you have suggestions for the book, we welcome your [contributions](../maintainer-guide.md); reach out to us on [Discord](https://discord.gg/eNN4Wns6Jb) or [email](https://lists.identity.foundation/g/didcomm-usergroup) for help.

>This version of the book focuses on DIDComm v2 (the one incubated by DIF, finalized in early 2022). Documentation about DIDComm v1 (which went to production in 2018) is scattered across a number of Hyperledger Aries RFCs; for info about that generation of the technology, start [here](https://github.com/hyperledger/aries-rfcs/tree/main/concepts/0005-didcomm). A new version of DIDComm, v3, is imagined. This would be an IETF standard; it would build off v2 but add a session construct, improved binary support, leaner messages for IoT, and so forth. When we have links for that work, we'll add them here. 

## Contents

1. [Why DIDComm?](why.md)
2. Hello World
    1. Choosing libraries and tools
    2. Choosing DID methods
    3. Putting a message in an encrypted envelope
    4. Using a transport
    5. Receiving a message
3. [Threading](threading.md)
4. Protocols
    1. Implementing a protocol
    2. Designing your own protocol
    3. Sharing your protocol
    4. Co-protocols
5. Recipes
    1. Localization
    2. Timeouts
    3. Retries
    4. N-wise
    5. Introduction
6. Safety
    1. [Privacy](privacy.md)
    2. Security
    3. Message security contexts
    4. DID rotation
    5. [Perfect forward secrecy](pfs.md)
    6. [Man in the middle](mitm.md)
7. [Routing](routing.md)
8. Appendix: Migration from DIDComm v1
    1. [What's new](whatsnew.md)
    2. Migrator script

