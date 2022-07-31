---
title: Discover Features
publisher: rodolfomiranda
license: MIT
piuri: https://didcomm.org/discover-features/2.0
status: Production
summary: This protocol, defined in the DIDComm Messaging Spec, helps agents query one another to discover which features they support, and to what extent.
tags: []
authors: []

---

## Details

The version 2.0 of this protocol was originally introduced in [Aries RFC 0557: Discover Features Protocol v2.x](https://github.com/hyperledger/aries-rfcs/tree/main/features/0557-discover-features-v2). A DIDComm v2 version was updated and included in the specification here: https://identity.foundation/didcomm-messaging/spec/#discover-features-protocol-20.

You can find the detail of the protocol in above-mentioned references. Semantics of both DIDComm v1 and v2 are similar, only differing in message decorators and headers as follows:

## Query Message

* ### DIDComm v1 example
```
{
  "@type": "https://didcomm.org/discover-features/2.0/queries",
  "@id": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",
  "queries": [
    { "feature-type": "protocol", "match": "https://didcomm.org/tictactoe/1.*" },
    { "feature-type": "goal-code", "match": "aries.*" }
  ]
}
```

* ### DIDComm v2 example
```
{
    "type": "https://didcomm.org/discover-features/2.0/queries",
    "id": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",
    "body": {
        "queries": [
            { "feature-type": "protocol", "match": "https://didcomm.org/tictactoe/1.*" },
            { "feature-type": "goal-code", "match": "org.didcomm.*" }
        ]
    }
}
```

## Disclose Message

* ### DIDComm v1 example
```
{
  "@type": "https://didcomm.org/discover-features/2.0/disclosures",
  "~thread": { "thid": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU" },
  "disclosures": [
    {
      "feature-type": "protocol",
      "id": "https://didcomm.org/tictactoe/1.0",
      "roles": ["player"]
    },
    {
      "feature-type": "goal-code",
      "id": "aries.sell.goods.consumer"
    }
  ]
}
```

* ### DIDComm v2 example
```
{
    "type": "https://didcomm.org/discover-features/2.0/disclose",
    "thid": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",
    "body":{
        "disclosures": [
            {
                "feature-type": "protocol",
                "id": "https://didcomm.org/tictactoe/1.0",
                "roles": ["player"]
            },
            {
                "feature-type": "goal-code",
                "id": "org.didcomm.sell.goods.consumer"
            }
        ]
    }
}
```
