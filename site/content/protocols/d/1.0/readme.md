---
title: My D protocol
publisher: Merciful12
license: MIT
piuri: https://didcomm.org/d/1.0
status: Production
summary: My D protocol summary
tags:
  - star-wars
  - tag4
  - tag5
---

## Roles

Provides a formal name (using backticks in markdown) for each role in the protocol, says who and how many can play each role, and describes constraints associated with those roles (e.g., “You can only issue a credential if you have a DID on the public ledger”). The issue of qualification for roles can also be explored (e.g., “The holder of the credential must be known to the issuer”).

The formal names for each role are important because they are used when agents discover one another’s capabilities. An agent doesn’t just claim that it supports a protocol; it makes a claim about which roles in the protocol it supports. An agent that supports credential issuance and an agent that supports credential holding may have very different features, but they both use the credential-issuance protocol. By convention, role names use lower-kebab-case and are compared case-sensitively.

## Connectivity

Describe any assumptions about simplex vs. duplex, which parties need to talk to which parties, etc.

## Code

```bash
cd ~/bin
curl -L https://github.com/trentm/json/raw/master/lib/json.js > json
chmod 755 json
You should now have "json" on your PATH:

$ json --version
json 9.0.0
```

## Html

```
<h1>Title</h1>
```
