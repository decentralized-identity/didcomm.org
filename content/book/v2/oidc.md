## OID4VC

DIDComm is often compared with OpenID for Verifiable Credentials (OID4VC). 

These protocols do have overlapping concerns as related to Verifiable Credentials, but approach the exchange of them differently. In addition to the similarities, the each have some unique and useful properties.

### Password Friendly Security Model

The flow of OID4VC allows for an iframe to be used for the verification of a password or other secrets. This allows the user to authenticate to the Identity Provider (IdP) without the Relying Party (RP) being able to observe the exchange. This is really the sweet spot for OpenID, and has been carried to the VC exchange protocols as well. DIDComm does not currently have a direct replacement for this flow.

### Different Connection Model

The OpenID based flow doesn't allow for very effective communication without the user in the loop. This is sometimes desirable, but limits it's applicability for more automated flows.

DIDComm has the ability to transfer messages without involvement of the user, when applicable. 

### Message Types

DIDComm has the built-in ability to transfer protocol messages of any type, not only those concerned with the issuance or verification of Verifiable Credentials. This allows for richer interaction beyond the uses focused on Verifable Credentials.

## Combined Use

The different properties of the protocols make them very useful to each other.

When exchanging a credential with OID4VC, a DID is often passed. If that DID resolves to a DID Document with a DIDComm Service Endpoint, then future, rich interactions can be continued via DIDComm.

If the parties in a DIDComm relationship need to verify identity via secret checking with an RP, they can lean on OID4VC (or OpenID, if a credential is not involved) for that interaction.