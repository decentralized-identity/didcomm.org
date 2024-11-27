## DID Rotation

[DIDComm Messaging](https://identity.foundation/didcomm-messaging/spec/v2.0/) relies on the [DIDs](https://www.w3.org/TR/did-core/), and associated [DID Documents](https://www.w3.org/TR/did-core/#dfn-did-documents), of the two peers involved in the communication. Those parties are responsible to secure their keys by performing rutinely key rotations, even if they are not compromised, and to make other changes in the DID Documents as needed, such as service endpoints. DIDComm has no involvement in that procedure that is particular to each DID method; nevertheless and provided that the DID does not change, the communication can keep flowing normally.

However there are cases when the DID (not the DID Document) need to be rotated by one of the parties, such as in the following three cases:
1. At the beginning of a connection: its common that the initial message is in the form of an Out of Band message that it is unencrypted per definition, and may be observed by another party or transmitted in an unsecure channel such as a QR code or a URL posted in an email or webpage. The DID used in the OOB should be considered as a temporal DID just to start the conversation, but it is highly recommended that it is rotated afterwards to improve privacy.
2. When keys inside a DID Document need to be rotated and the DID method does not allow updating the DID Document with new rotated keys, as is the case for [did:key](https://w3c-ccg.github.io/did-method-key/).
3. If there is a need to move to a different DID method for whatever reason (security, flexibility, interoperability, etc)

[DIDComm](https://identity.foundation/didcomm-messaging/spec/v2.0/#did-rotation) defines a specific header to handle DID rotation. This header is called `from_prior` and can be used in any message sent to the other party. That message must include the `from_prior` header that is a standard JWT token conformed with:
- Header:
  - `typ`: `jwt`
  - `alg`: verification algorithm such as `EdDSA`
  - `crv`: curve name
  - `kid`: key id from previous DID that is used in the signature of this JWT
- Payload:
  - `sub`: the new DID
  - `iss`: the previous DID
  - `iat`: datetime in seconds
- Signature: from the previous DID and key defined in the `kid`

Once a DIDComm agent receives a message from an unknown DID, it must:
1. check if there’s a `from_prior` header
2. if exists, extract the DID from the `iss` and validate if it matches a known DID
3. validate JWT signatures using the key defined in `kid` and extracted from previous DID defined in `iss`
4. if all validations are successful, the new DID should be stored for future communications with the previously known agent

The sender, who's doing the rotation, should continue to send the rotation header until they receive a message from the other party using the new DID. This allows for continuity even if one party is offline or not processing messages for a while.

Example code showing a DID Rotation after an Out of Band message can be found in the section [Starting, using and ending a DIDComm connection](startConnection) from this Guidebook.

Since DIDComm is asynchronous in nature, messages can arrive in different order. Sender and receiver should take care to:
- Sender: avoid starting a DID rotation in the middle of multiple message conversations. If DID rotation arrives out of order, some messages may be discarded by the recipient.
- Receiver: messages received from the old DID but after the message that performs the DID rotation must be discarded to reduce the risk of potentially compromised keys.

Finally, DID rotation allows a special case when rotating to _nothing_ that denotes the **end of the relationship**. In this case the DID should be omitted from the `from` header and from the `sub` field of the `from_prior` header.
