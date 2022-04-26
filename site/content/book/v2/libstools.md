# Choosing libraries and tools

This is a list of libraries and tools available to DIDComm developers.

Much of this information comes from this [IIW presentation](https://cloud.dsr-corporation.com/index.php/s/EzED9i2dQcMXi6w) and [slides](https://cloud.dsr-corporation.com/index.php/s/kZEMQeMR5c2sxG5).

## Reference Implementations

These reference implementations provide a demonstration and examples in several programming languages.

* Python
    * [DIDComm Python](https://github.com/sicpa-dlab/didcomm-python)
        * [PyPi DIDComm Release](https://pypi.org/project/didcomm/)
    * [Peer DID Python](https://github.com/sicpa-dlab/peer-did-python)
        * [PyPi Peer DID Release](https://pypi.org/project/peerdid/)
* Java, Kotlin, Android 
    * [DIDComm Java, Kotlin, Android](https://github.com/sicpa-dlab/didcomm-jvm)
        * [Maven DIDComm Release](https://mvnrepository.com/artifact/org.didcommx/didcomm/0.1.0)
    * [Peer DID Java, Kotlin, Android](https://github.com/sicpa-dlab/peer-did-jvm)
        * [Maven Peer DID Release](https://mvnrepository.com/artifact/org.didcommx/peerdid/0.2.0)
* RUST
    * [DIDComm RUST](https://github.com/sicpa-dlab/didcomm-rust)
        * [JavaScript/TypeScript via WASM](https://github.com/sicpa-dlab/didcomm-rust/tree/main/wasm)
        * [iOS via wrapper](https://github.com/sicpa-dlab/didcomm-rust/tree/main/wrappers/swift) is WIP
            * other languages can be supported via wrappers
        * [Crate DIDComm Release](https://crates.io/crates/didcomm)

## Tools

DIDComm v2 developers are contributing to projects that provide important tools for DIDComm v2.

* ECDH-1PU
    * JVM
        * [Nimbus Jose JWT](https://bitbucket.org/connect2id/nimbus-jose-jwt/)
    * Python
        * [Authlib](https://github.com/lepture/authlib)
    * Rust
        * [Aries Askar](https://github.com/hyperledger/aries-askar/tree/main/askar-crypto)
* [DID rotation](https://identity.foundation/didcomm-messaging/spec/#did-rotation)
* Forward protocol - Used by default for [routing](https://identity.foundation/didcomm-messaging/spec/#routing) DIDComm messages.
   * [Python example](https://github.com/sicpa-dlab/didcomm-python/blob/ca962db30ac7c1492ed6e3654575cce2dd3a5e0e/didcomm/protocols/routing/forward.py)
   * [Kotlin example](https://github.com/sicpa-dlab/didcomm-jvm/blob/476fc3ed17d4dfe3b11ec891ae5bfa1f52ab7a4e/lib/src/main/kotlin/org/didcommx/didcomm/protocols/routing/ForwardMessage.kt)
   * [RUST example](https://github.com/sicpa-dlab/didcomm-rust/tree/9a24b3b60f07a11822666dda46e5616a138af056/src/protocols/routing) 
* Peer DID
    * Static layers of support only (similar to did:key method).  But more support for dynamic updates.
    
