# DIDComm for Verifiable Credentials
DIDComm Protocols for Verifiable Credentials allow for the issuance, presentation, and management of Verifiable Credentials.



## Related Protocols
Note that DIDComm allows the use of various protocols between parties. Many applications of Verifiable Credentials are improved with the inclusion of 
other protocols. Sending a human readable message about credential actions may improve the user experience, for example.

### [Out of Band (OOB)](https://didcomm.org/out-of-band/2.0/)
Credentials are often Issued or Presented in association with the scan of a QR Code. The OOB Protocol contains the details of how those QR codes are created, and how they can facilitate an interaction flow directly into the desired protocol.

## [Issue Credential](https://didcomm.org/issue-credential/3.0/)
Issue Credential coordinates the issuance of a credential. The protocol supports simple flows and complex flows, and supports any credential type, including those that need some back and forth interaction before credential issuance. Credential issuance may be initiated by either party in the interaction.

## [Present Proof](https://didcomm.org/present-proof/3.0/)
Present Proof coordinates the presention of a Verifiable Credential Proof Presentation. It supports any credential type within the same protocol. Present proof may be initiated by either party in an interaction.

## [Revocation Notification](https://github.com/hyperledger/aries-rfcs/blob/main/features/0183-revocation-notification/)
Supports notification to the credential holder that a credential they were previously issued has been revoked. This is initiated from the issuer at some time after credential issuance. Receiving such a notification can improve the user experience for a user in a revocation experience, allowing them to know of the revocation prior to an attempt to present the credential.

## Additional Protocol Development
DIDComm supports the development of additional protocols. Creating a new protocol and promoting it can add useful funcationality into the ecosystem. Support for these protocols can be detected with the [Discover Features](https://didcomm.org/discover-features/2.0/) protocol when communicating with other software.