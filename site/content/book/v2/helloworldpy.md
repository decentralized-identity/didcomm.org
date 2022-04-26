## "Hello World" in Python
This simple "Hello World" example shows how Alice can create an encrypted message to Bob. In that case, we are using [DIDComm Python](https://github.com/sicpa-dlab/didcomm-python) and [Peerdid Python](https://github.com/sicpa-dlab/peer-did-python) libraries from [SICPA](https://www.sicpa.com).
### Step 1: Install packages
Once you set up your python environment, you need to install the following packages:
```
pip install didcomm
pip install peerdid
pip install json
```
The code in the following sections can be executed in a single python file or executed interactively in a [Jupyter notebook](https://jupyter.org).

### Step 2: Imports
First, we need to import all required functions, clases and types from `didcomm` and `peerdid` libraries as follows:
```
from didcomm.common.types import DID, VerificationMethodType, VerificationMaterial, VerificationMaterialFormat
from didcomm.did_doc.did_doc import DIDDoc, VerificationMethod, DIDCommService
from didcomm.did_doc.did_resolver import DIDResolver
from didcomm.message import Message
from didcomm.secrets.secrets_resolver_demo import SecretsResolverDemo
from didcomm.unpack import unpack, UnpackResult
from didcomm.common.resolvers import ResolversConfig
from didcomm.pack_encrypted import pack_encrypted, PackEncryptedConfig, PackEncryptedResult
from didcomm.secrets.secrets_util import generate_x25519_keys_as_jwk_dict, generate_ed25519_keys_as_jwk_dict, jwk_to_secret
from peerdid import peer_did
from peerdid.did_doc import DIDDocPeerDID
from peerdid.types import VerificationMaterialAuthentication, VerificationMethodTypeAuthentication, VerificationMaterialAgreement, VerificationMethodTypeAgreement, VerificationMaterialFormatPeerDID
import json
```
### Step 3: Helpers
In this step we add three helper functionalities:
- **Secret resolver**
This sample code needs a storage to keep the generated key pair secrets. It will then be referenced by the library as a `secrets_resolver`. We can instantiate it as follows:
`secrets_resolver = SecretsResolverDemo()`
Note that the `SecretsResolverDemo` simply stores the keys in a text file named `secrets.json`. As you've just realized, this secret storage is anything but secure. Keep in mind that securing keys is of utmost importance for a self-sovereign identity; never use it in production.
- **DID Resolver**
The following class is needed by the library to resolve the DID Peer into a DID Document and put it in the format required by the library:
```
class DIDResolverPeerDID(DIDResolver):
    async def resolve(self, did: DID) -> DIDDoc:
        did_doc_json = peer_did.resolve_peer_did(did, format = VerificationMaterialFormatPeerDID.JWK)
        did_doc = DIDDocPeerDID.from_json(did_doc_json)

        return DIDDoc(
            did=did_doc.did,
            key_agreement_kids = did_doc.agreement_kids,
            authentication_kids = did_doc.auth_kids,
            verification_methods = [
                VerificationMethod(
                    id = m.id,
                    type = VerificationMethodType.JSON_WEB_KEY_2020,
                    controller = m.controller,
                    verification_material = VerificationMaterial(
                        format = VerificationMaterialFormat.JWK,
                        value = json.dumps(m.ver_material.value)
                    )
                )
                for m in did_doc.authentication + did_doc.key_agreement
            ],
            didcomm_services = [
                DIDCommService(
                    id = s.id,
                    service_endpoint = s.service_endpoint,
                    routing_keys = s.routing_keys,
                    accept = s.accept
                )
                for s in did_doc.service
                if isinstance(s, DIDCommServicePeerDID)
            ] if did_doc.service else []
        )
```
- **DID Peer creation**
We add the following function to simplify key generation, key storage, and the creation of a DID Peer:
```
async def create_simple_peer_did() -> str:
    agreem_keys = generate_x25519_keys_as_jwk_dict()
    auth_keys = generate_ed25519_keys_as_jwk_dict()
    did = peer_did.create_peer_did_numalgo_2(
        [VerificationMaterialAgreement(
                type = VerificationMethodTypeAgreement.JSON_WEB_KEY_2020,
                format = VerificationMaterialFormatPeerDID.JWK,
                value = agreem_keys[1])
        ],
        [VerificationMaterialAuthentication(
                type = VerificationMethodTypeAuthentication.JSON_WEB_KEY_2020,
                format = VerificationMaterialFormatPeerDID.JWK,
                value = auth_keys[1])
        ],
        None
    )
    did_doc = DIDDocPeerDID.from_json(peer_did.resolve_peer_did(did))
    pk = auth_keys[0]
    pk["kid"] = did_doc.auth_kids[0]
    await secrets_resolver.add_key(jwk_to_secret(pk))
    private_key = agreem_keys[0]
    private_key["kid"] = did_doc.agreement_kids[0]
    await secrets_resolver.add_key(jwk_to_secret(private_key))

    return did
```
This function creates a basic DID Peer with only one *Agreement* key, one *Authentication* key, and no *Service* part. You can find more options in the library documentation.

### Step 4: Create DIDs
Using our `create_simple_peer_did` helper function, Alice and Bob can create their DID Peer that they will share and use when communicating privately between each other:
```
alice_did = await create_simple_peer_did()
print("Alice's DID:", alice_did)
bob_did = await create_simple_peer_did()
print("Bob's DID:", bob_did)
```
You should get something similar to:
```
Alice's DID: did:peer:2.Ez6LSt4Jscr227NFyuzKHT85haVE4AFVXm1tDwYeZ5xenxMmW.Vz6MkfvwnoNS6Cto38MEMbqdnypVDN7gS4oAMaHFkjAUse5JE
Bob's DID: did:peer:2.Ez6LSetXDUvD8rBSei5TU5ew7VRdWyNBr5mAsxr6EoHFTxt9f.Vz6Mkty3Nu98rnrHfk1GBCurF7EFKY5Vb34FAJNJCMhwzduk3
```
Remember that while creating these simple DIDs, our helper function also stores the private keys in the `secrets_resolver`. In a real implementation, Alice will have her own secure store in her own wallet, and Bob will have a separated secure store in his own wallet.
Also, those Peer DIDs can be resolved into DID documents that contain the *Authentication* and *Agreement* public keys.

### Step 5: Encrypt and pack the message
Alice can create a simple "Hello World" message with:
```
message = Message(
    body = {"msg": "Hello World"},
    id = "unique-id-24160d23ed1d",
    type = "my-protocol/1.0",
    frm = alice_did,
    to = [bob_did]
)
```
Note that the message includes an `id` that is mandatory and has to be unique to Alice. Also includes a `type`, also mandatory, that points to the protocol identifier that we've just invented. The `body` contains the actual message in an structured way associated by our `my-protocol/1.0`. Attributes `frm` and `to` are optional.

[DIDComm](https://identity.foundation/didcomm-messaging/spec/#message-formats) defines three message formats: plain text, signed, and encryped. We are going to use the latter since it is the most common for most applications. In that case, the message will be encrypted so only Bob can see it.
The final packed message can be generated with this code:
```
packed_msg = await pack_encrypted(
    resolvers_config = ResolversConfig(
        secrets_resolver = secrets_resolver,
        did_resolver = DIDResolverPeerDID()
    ),
    message = message,
    frm = alice_did,
    to = bob_did,
    sign_frm = None,
    pack_config = PackEncryptedConfig(protect_sender_id=False)
)
```
This library also offers the option of anonymous encryption, encryption with no repudation, and message signing. Note also that we pass a resolver configuration pointing to our secrets store and the DID resolver.
If you take a look at the packed message, you'll see that the content was hiden in the encryption:
```
print(packed_msg.packed_msg[:200]+"...")
```
`{"protected":"eyJ0eXAiOiJhcHBsaWNhdGlvbi9kaWRjb21tLWVuY3J5cHRlZCtqc29uIiwiYWxnIjoiRUNESC0xUFUrQTI1NktXIiwiZW5jIjoiQTI1NkNCQy1IUzUxMiIsImFwdSI6IlpHbGtPbkJsWlhJNk1pNUZlalpNVTNJM1pWaFlObXBxYjI0MFpFVmFWaz...`

### Step 6: Receive and unpack the message
Alice will send the packed message to Bob using a [transport](transport). Once received, Bob can unpack it with the following code:
```
unpack_msg = await unpack(
    resolvers_config=ResolversConfig(
        secrets_resolver=secrets_resolver,
        did_resolver=DIDResolverPeerDID()
    ),
    packed_msg=packed_msg.packed_msg
)
```
Note that we also passed the resolver config as before.
Finally, Bob can see Alice's message by:
```
print(unpack_msg.message.body["msg"])
```
`Hello World`

