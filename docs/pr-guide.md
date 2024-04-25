# Protocol Publishing Guide
>Note: The [Maintainer Guide](maintainer-guide.md) discusses general PR best practices, including issues that are unrelated to protocols.

## Publish a new protocol definition

1. Fork the repo.
2. Choose protocol name and version. Example: `my-cool-protocol`, `0.1`.
3. Create a folder `site/content/protocols/<protocol-name>/<protocol-version>`.
4. Create a protocol definition document in that folder as a markdown file named`readme.md`. Use the following example as a [reference](./protocol-example.md).
5. Send a pull request to the `main` branch.
6. Wait until all CI checks are complete, and fix the errors if there are any. 
7. Check for warnings in validation details, and consider fixing them. 
    - Example of warnings: `tag: star-war is similar to existing tags: star-wars. Make sure you can't use existing one.`
    - Where to find the warning details: go to Details - Test meta - Validate tags similarity (see [example](https://github.com/Merciful12/didcomm.org/runs/3320669302?check_suite_focus=true#step:6:7))

## Update an existing protocol definition

1. Fork the repo.
2. Decide if the update is
    - a fix
    - compatible change
    - non-compatible or breaking change

3. If update is a `fix`
    * the version must be the same
    * make changes in existing `site/content/protocols/<protocol-name>/<protocol-version>/readme.md`
    * send a pull request to the `main` branch
    * add `[fix]` postfix to the PR title
4. If update is a `compatible change`
    - define a new version where minor part must be incremented (for example, from 0.1 to 0.2)
    - copy the previous readme.md to the new folder `site/content/protocols/<protocol-name>/<new-protocol-version>`
    - make changes in the `readme.md`
    - send a pull request to the `main` branch
    - add `[compatible]` postfix to the PR title
5. If update is a `non-compatible change`
    - define a new version where major part must be incremented (for example, from 0.1 to 1.0)
    - copy the previous `readme.md` to the new folder `site/content/protocols/<protocol-name>/<new-protocol-version>`
    - make changes in the `readme.md`
    - send a pull request to the `main` branch
    - add `[non-compatible]` postfix to the PR title
6. Wait until all CI checks are complete, and fix the errors if there are any.
7. Check for warnings in validation details, and consider fixing them. 
    - Example of warnings: `tag: star-war is similar to existing tags: star-wars. Make sure you can't use existing one.`
    - Where to find the warning details: go to Details - Test meta - Validate tags similarity (see [example](https://github.com/Merciful12/didcomm.org/runs/3320669302?check_suite_focus=true#step:6:7))


## Details
#### Protocol Name
`<protocol-name>` folder — the name of your protocol. 
* It follows SLUG pattern and may consist of only lower cased latin letters, digits and `-` as separator, e.g `my-cool-protocol`.
* It must be unique. For example, `my-protocol` and `myprotocol` are the same.


#### Protocol Version
`<protocol-version>` folder — follows [semver](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0003-protocols/README.md#semver-rules-for-protocols) without patch version. It must consist of two digits (major and minor versions) separated by `.`, e.g `1.0`.


#### Metadata
Placed at the top of the protocol definition between `---`.
Uses [yaml](https://docs.ansible.com/ansible/latest/reference_appendices/YAMLSyntax.html) syntax.
The following fields must be specified:
  - `title` — the official name of the protocol. Should be the same as `<protocol-name>` folder but user friendy. Will be displayed in search results and at protocol details page. 
  - `piuri` — DIDComm protocols are uniquely identified by a special URI called a PIURI `https://didcomm.org/<protocol-name>/<version>`, e.g `https://didcomm.org/my-cool-protocol/1.0`.
  - `publisher` — the GitHub username of the person who publishes the protocol.
  - `authors` — list of authors. Author object has next fields:
    - name
    - email (optional)
  - `license` — protocol license.
  - `tags` — some hashtags that might be used to associate the protocol with topics. It's recommended to re-use existing tags before creating new similar ones (for example, consider re-using existing `finance` tag instead of creating a new one called `financial`).
  - `summary` — in one or two sentences, explain what problem this protocol solve, how it works, and other key characteristics.
  - `status` — one of the `Production`, `Demonstrated` or `Proposed`.

#### Body
 Body of the protocol should tell a programmer why a protocol is interesting, and how to use it at a high level. It should answer questions like these:
  1. What are the formal codes for the [goal(s)](https://github.com/hyperledger/aries-rfcs/tree/master/concepts/0519-goal-codes) that the protocol achieves?
  2. What are the formal names of the [roles](https://github.com/hyperledger/aries-rfcs/tree/master/concepts/0003-protocols#roles-participants-parties-and-controllers) in the protocol?
  3. What is the [MTURI](https://github.com/hyperledger/aries-rfcs/blob/master/concepts/0003-protocols/README.md#mturi), format, and sequence of messages exchanged in the protocol?
  4. What is the state machine that embodies progression through the protocol for each role?
  5. How does the protocol function as a [co-protocol](https://github.com/hyperledger/aries-rfcs/blob/master/concepts/0478-coprotocols/README.md)?
  6. Who are the protocol's authors?
  7. What implementations exist, and where can they be found?
  8. Where can a developer learn more?
