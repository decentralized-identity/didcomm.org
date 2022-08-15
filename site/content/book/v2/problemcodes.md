# Problem Codes

Problems are reported by a specific message defined in the [Problem Report 2.0](https://identity.foundation/didcomm-messaging/spec/#problem-reports) protocol. That message looks like this:
```
{
  "type": "https://didcomm.org/report-problem/2.0/problem-report",
  "id": "7c9de639-c51c-4d60-ab95-103fa613c805",
  "pthid": "1e513ad4-48c9-444e-9e7e-5b8b45c5e325",
  "ack": ["1e513ad4-48c9-444e-9e7e-5b8b45c5e325"],
  "body": {
    "code": "e.p.xfer.cant-use-endpoint",
    "comment": "Unable to use the {1} endpoint for {2}.",
    "args": [
      "https://agents.r.us/inbox",
      "did:sov:C805sNYhMrjHiqZDTUASHg"
    ],
    "escalate_to": "mailto:admin@foo.org"
  }
}
```
One of the most importan headers of that message is the `code` header that categorizes, in a machine readable format, what went wrong.
`code` follows a structured format defined in [Problem Codes](https://identity.foundation/didcomm-messaging/spec/#problem-codes) on the specification.

In short, the code is contructed as a sequence like:
`{sorter}.{scope}.{general_descriptor}.{specific_descriptor}.{more_specific_descriptor}..`

- `{sorter}` can be either `e` it is an error, or `w` id it is a warning.
- `{scope}` can be either `p` if belongs to a protocol, or `m` if it was triggered by a previous message.
- `{descriptors}` is a kebab-case sequence of descriptors separated by `.` where the semantics get progressively more detailed reading left to right.

In this section we are listing a list of predefined codes that can be used by themselves, or as prefixes to more specific descriptors:

Token | Value of `comment` string | Notes
--- | --- | ---
`trust` | Failed to achieve required trust. | Typically this code indicates incorrect or suboptimal behavior by the sender of a previous message in a protocol. For example, a protocol required a known sender but a message arrived anoncrypted instead &mdash; or the encryption is well formed and usable, but is considered weak. Problems with this descriptor are similar to those reported by HTTP's `401`, `403`, or `407` status codes.
`trust.crypto` | Cryptographic operation failed. | A cryptographic operation cannot be performed, or it gives results that indicate tampering or incorrectness. For example, a key is invalid &mdash; or the key types used by another party are not supported &mdash; or a signature doesn't verify &mdash; or a message won't decrypt with the specified key.
`xfer` | Unable to transport data. | The problem is with the mechanics of moving messages or associated data over a transport. For example, the sender failed to download an external attachment &mdash; or attempted to contact an endpoint, but found nobody listening on the specified port.
`did` | DID is unusable. | A DID is unusable because its method is unsupported &mdash; or because its DID doc cannot be parsed &mdash; or because its DID doc lacks required data.
`msg` | Bad message. | Something is wrong with content as seen by application-level protocols (i.e., in a plaintext message). For example, the message might lack a required field, use an unsupported version, or hold data with logical contradictions. Problems in this category resemble HTTP's `400` status code.
`me` | Internal error. | The problem is with conditions inside the problem sender's system. For example, the sender is too busy to do the work entailed by the next step in the active protocol. Problems in this category resemble HTTP's `5xx` status codes.
`me.res` | A required resource is inadequate or unavailable. | The following subdescriptors are also defined: `me.res.net`, `me.res.memory`, `me.res.storage`, `me.res.compute`, `me.res.money`
`req` | Circumstances don't satisfy requirements. | A behavior occurred out of order or without satisfying certain preconditions &mdash; or circumstances changed in a way that violates constraints. For example, a protocol that books plane tickets fails because, halfway through, it is discovered that all tickets on the flight have been sold.
`req.time` | Failed to satisfy timing constraints. | A message has expired &mdash; or a protocol has timed out &mdash; or it is the wrong time of day/day of week.
`legal` | Failed for legal reasons. | An injunction or a regulatory requirement prevents progress on the workflow. Compare HTTP status code `451`. 


