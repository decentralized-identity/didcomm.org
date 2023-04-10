---
title: Shorten URL
publisher: TimoGlastra
license: MIT
piuri: https://didcomm.org/shorten-url/1.0
status: Proposed
summary: A protocol to request a shortened URL for a given URL. For example, an agent requesting a shortened out of band invitation url from a mediator.
tags: []
authors:
  - name: Timo Glastra
    email: timo@animo.id
---

# Summary

A protocol to request a shortened URL for a given URL. For example, an agent requesting a shortened out of band invitation url from a mediator.

# Motivation

URL shorteners are common technology used by a variety of services. There's a lot of free to use url shorteners available, but those bring in privacy concerns and don't always support invalidating the URL. When an agent can't host shortened url themselves (e.g. in the case of a mobile edge agent), having another agent host the shortened url provides a good solution to dynamically shorten the url. This would allow agents to create QR codes of invitations that are easy to scan in size, and also allows to share the shortened with other agents out of band

> Note: Some platforms such as iOS remove the query from an url when you click on it if the query is too long. This is problematic for out of band invitations that rely on the `oob` property to be present
> in the invitation url.
> E.g. in the case of the following url: `https://my-url.com?oob=1234` (example, real `oob=` param would need to be much longer), the url when clicked on will be interpreted as `https://my-url.com`.

## Roles

There are two roles in this protocol:

- `url-shortener`: The `url-shortener` is an agent who will provide the `long-url-provider` with a shortened url.
- `long-url-provider`: The `long-url-provider` can then share this shortened link. The `url-shortener` will return the long url when the short url is fetched.

## Basic Walkthrough

The Shorten URL protocol allows one agent to request a shortened variant of an url from another agent. One agent behaves as the `url-shortener` whilst the other agent represents the `long-url-provider`.

The protocol can be initiated by the `long-url-provider` sending a `request-shortened-url` message to the `url-shortener`. The `url-shortener` will then respond with a `shorten-url-response` message containing the shortened url. If the `long-url-provider` wants to invalidate the shortened url, it can send a `invalidate-shortened-url` message to the `url-shortener`.

## States

#### States for URL Shortener

| State&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; | Description                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| null                                                  | No url has bene requested                                                                                        |
| request-received                                      | `request-shortened-url` message has been received.                                                               |
| shortened-url-sent                                    | `shortened-url` message has been sent.                                                                           |
| invalidate-received                                   | `invalidate-shortened-url` message has been received.                                                            |
| invalidated                                           | The shortened url has been invalidated, either through expiry, or throug the `invalidate-shortened-url` message. |

#### States for Long URL Provider

| State&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; | Description                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| null                                                  | No url has has been requested                                                                                    |
| request-sent                                          | `request-shortened-url` message has been sent and awaiting a `shortened-url` message.                            |
| shortened-url-received                                | `shortened-url` message has been received.                                                                       |
| invalidate-sent                                       | `invalidate-shortened-url` message has been sent                                                                 |
| invalidated                                           | The shortened url has been invalidated, either through expiry, or throug the `invalidate-shortened-url` message. |

## Design By Contract

| Error Code                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validity_too_long`       | Sent by the **url-shortener** in response to a `request-shortened-url` message. The `requested_validity_seconds` is too long for the **url-shortener**. The **long-url-provider** should again with a lower `requested_validity_seconds` value. If the `requested_validity_seconds` in the `shorten-url-request` message was `0`, it means the **url-shortener** does not allow urls to be valid indefinitely. The **url-shortener** SHOULD add a `problem_items` entry to the problem report indicating the maximum validity a **long-url-provider** can request for a shortened url: `[{ "max_validity_seconds": <INTEGER> }]` |
| `invalid_url`             | Sent by the **url-shortener** in response to a `request-shortened-url` message. The provided url is not a valid url. The **long-url-provider** should retry with a valid url.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `invalid_protocol_scheme` | Sent by the **url-shortener** in response to a `request-shortened-url` message. The provided url uses an invalid protocol scheme (e.g. `wss`). This can either mean the **url-shortener** does not support shortening this specific scheme, or that the scheme does not support url shortening.                                                                                                                                                                                                                                                                                                                                  |
| `invalid_goal_code`       | Sent by the **url-shortener** in response to a `request-shortened-url` message. The goal code is not a valid goal code as defined by this RFC, or the goal code is not supported by the **url-shortener**. Either way, the **long-url-provider** should use another goal code, or abort the request for a shortened url.                                                                                                                                                                                                                                                                                                         |
| `slugs_not_supported`     | Sent by the **url-shortener** in response to a `request-shortened-url` message. The **url-shortener** does not support the `short_url_slug` property.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `invalid_slug`            | Sent by the **url-shortener** in response to a `request-shortened-url` message. The provided `short_url_slug` is invalid. The **url-shortener** SHOULD include the reason why the slug is invalida in the problem report.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `short_url_invalid`       | Sent by the **url-shortener** in response to an `invalidate-shortened-url` message. The `shortened_url` is invalid. This could be for a number of reasons, but most probably (a) the url is already expired, (b) the url is already invalidated, or (c) the url does not exist. The exact reason doesn't matter, as the end result is the same.                                                                                                                                                                                                                                                                                  |
| `rejected_invalidation`   | Sent by the **url-shortener** in response to an `invalidate-shortened-url` message. The **url-shortener** refuses to invalidate the shortened url. A reason for this could be that the **long-url-provider** is not authorized to invalidate the shortened url. The associated description should be very clear and hint towards what the **long-url-provider** can do to resolve the issue. This prlblem report should not be used if `short_url_invalid` can be used instead.                                                                                                                                                  |

## Security

This protocol expects messages to be encrypted during transmission, and repudiable.

## Composition

| Supported Goal Code | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shorten`           | Shorten an URL according to the [Standard URL Shortening](#standard-url-shortening) as described in this RFC. This is meant to be used as a generic url shortener. If you want to shorten out of band invitations, the `shortend.oobv1` and `shorten.oobv2` goal codes should be used. See [Standard URL Shortening](#standard-url-shortening) for shortening algorithm.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `shorten.oobv1`     | Shorten an URL according to the URL shortening rules as defined in the [Out of Band V1 Protocol](../0434-outofband/README.md#url-shortening). This means the URL shortener MUST adhere to the url shortener rules as defined in this protocol. When this goal code is used, the `url` property in the message **MUST** include the `oob` property. If shortening an out of band invitation is desired, but doesn't need to follow the shortening rules as defined in the out of band v1 protocol the more generic `shorten` goal code can be used. See [RFC 0434: Out-of-Band Protocol 1.x](../0434-outofband/README.md#url-shortening) for shortening algorithm.                                                                                                                                                                                                       |
| `shorten.oobv2`     | Shorten an URL according to the URL shortening rules as defined in the [Out of Band V2 Protocol](https://identity.foundation/didcomm-messaging/spec/#short-url-message-retrieval) from the DIDComm V2 specification. This means the URL shortener MUST adhere to the url shortener rules as defined in this protocol. When this goal code is used, the `url` property in the request message **MUST** include the `_oob` property and the `shortened_url` property in the response message MUST include the `_oobid` property. If shortening an out of band invitation is desired, but doesn't need to follow the shortening rules as defined in the out of band v2 protocol the more generic `shorten` goal code can be used. See [Out of Band V2 Protocol](https://identity.foundation/didcomm-messaging/spec/#short-url-message-retrieval) for shortening algorithm. |

## Message Reference

### Request Shortened URL

Message sent by the **long-url-provider** to the **url-shortener** to request a shortened version of an url.

DIDComm v1 Example:

```json
{
  "@type": "https://didcomm.org/shorten-url/1.0/request-shortened-url",
  "@id": "<UUID>",
  "url": "<URL>",
  "requested_validity_seconds": <INTEGER>,
  "goal_code": "<GOAL_CODE>",
  "short_url_slug": "<short-link-ending>"
}
```

DIDComm v2 Example:

```json
{
  "type": "https://didcomm.org/shorten-url/1.0/request-shortened-url",
  "id": "<UUID>",
  "body": {
    "url": "<URL>",
    "requested_validity_seconds": <INTEGER>,
    "goal_code": "<GOAL_CODE>",
    "short_url_slug": ""
  }
}
```

Description of the fields:

- `url` -- (required) The url that should be shortened
- `requested_validity_seconds` -- (required) The time in seconds that the shortened url should be valid. If not provided, the **url-shortener** determines the validity time. The value can be set to `0` to request the shortened url to be valid indefinitely (or until the url is invalidated using the `invalidate-shortened-url` message).
- `goal_code` -- (required) A goal code that can be used to identify the purpose of the shortened url. See [Composition](#Composition) for supported goal codes.
- `short_url_slug`: (optional) A string that can be used to specify the slug of the shortened url. For example if the **url-shortener** uses the domain `https://short-url.aries` and the `short_url_slug` value is `oob-invite-28` then the shortened url could result in `https://short-url.aries/oob-invite-28`. The **url-shortener** can use custom paths or link formats, this protocol doesn't describe how the `short_url_slug` should be integrated into the url. If the **url-shortener** can't or won't include the slug into the shortened url, it should notify the **long-url-provider** of this with an error code (Described in [Design By Contract](#design-by-contract)). As the slug will be encoded into an url, rules for url apply.

When a problem occurs during the request, the **url-shortener** can send a problem report message. This RFC defines a set of problem codes that can be used to identify the problem, see [Problem Reports](#problem-codes) below.

#### Shortened URL

Message sent by the **url-shortener** to the **long-url-provider** to share the shortened url.

DIDComm V1 Example:

```json
{
  "@type": "https://didcomm.org/shorten-url/1.0/shortened-url",
  "@id": "<UUID>",
  "shortened_url": "<SHORTENED-URL>",
  "expires_time": <INTEGER>,
  "~thread": {
    "thid": "<@id of request-shortened-url>"
  }
}
```

DIDComm V2 Example:

```json
{
  "type": "https://didcomm.org/shorten-url/1.0/shortened-url",
  "id": "<UUID>",
  "thid": "<id of request-shortened-url>",
  "body": {
    "shortened_url": "<SHORTENED-URL>",
    "expires_time": <INTEGER>
  }
}
```

Description of the fields:

- `shortened_url` -- (required) The shortend version of the url
- `expires_time` -- (optional) Timestamp after which the shortened url is no longer valid. For privacy reasons, the **url-shortener** MUST invalidate the shortend url after the specified timestamp. Follows the semantics of the `_time` property as defined in [RFC 0074: DIDComm Best Practices](../../concepts/0074-didcomm-best-practices/README.md#time). If not defined it means the shortened url will be valid indefinitely (or until the url is invalidated using the `invalidate-shortened-url` message).

The message MUST inclue the `thid` header (in DIDComm v2) or the `~thread.thid` decorator (in DIDComm v1) with the `@id` value of the [Request Shortened URL](#request-shortened-url) message.

#### Invalidate Shortened URL

Message sent by the **long-url-provider** to the **url-shortener** to invalidate a shortened url. This is useful if the short url is no longer needed and reduces the chance of unwanted exposure. If the **long-url-provider** is authorized to invalidate the shortened url, the **url-shortener** SHOULD invalidate the url due to privacy concerns.

DIDComm V1 Example:

```json
{
  "@type": "https://didcomm.org/shorten-url/1.0/invalidate-shortened-url",
  "@id": "<UUID>",
  "shortened_url": "<SHORTENED-URL>"
}
```

DIDComm V2 Example:

```json
{
  "type": "https://didcomm.org/shorten-url/1.0/invalidate-shortened-url",
  "id": "<UUID>",
  "body": {
    "shortened_url": "<SHORTENED-URL>"
  }
}
```

Description of the fields:

- `shortened_url` -- (required) The shortened url that should be invalidated.

It is important to note the **url-shortener** MUST only invalidate the short url if the request was made by a connection authorized to do so. This doesn't necesarily have to be the same connection as the one that requested the short url, but there should be caution in who can invalidate which short url.

If the **url-shortener** has invalidated the short url, it MUST send an [Ack message](https://github.com/hyperledger/aries-rfcs/blob/main/features/0015-acks/README.md) (DIDComm v1) with `status` value of `OK` OR an [empty message](https://identity.foundation/didcomm-messaging/spec/#the-empty-message) with the [`ack` header](https://identity.foundation/didcomm-messaging/spec/#acks) including the `id` of the `invalidate-shortened-url` message (DIDComm v2).

## Standard URL Shortening

The standards process for shortening an URL follows the process as used by most commercial URL shorteners.

When the shortened URL is requested, the **url-shortener** MUST respond with a status code of `301` or `302` and include a `Location` header specifcing header specifying the long url.

## Collateral

Drawbacks:

- Using another agent as url shortener leaks some information about the connections an agent makes to the other agent. However in the case of a mediator, where this protocol will probably be most often used, as mobile edge agents can't create shortened urls themeslves, and the mediator already keeps a list of all the registered keys from RFC 0211, this doesn't leak a lot of extra information.
- Using the mediator as a url shortener adds extra dependency on the mediator to be avaiable and act in your favor. However, as the mediator already plays a crucial role in routing messages, it doesn't add a lot of extra trust in the mediator.

Prior Art:

- en.wikipedia.org/wiki/URL_shortening
- https://github.com/hyperledger/aries-rfcs/tree/main/features/0434-outofband#url-shortening
- https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0268-unified-didcomm-agent-deeplinking/README.md#invitation-page
- https://identity.foundation/didcomm-messaging/spec/#short-url-message-retrieval

## L10n

Localization may be implemented by means of [L10n](https://github.com/decentralized-identity/didcomm-messaging/blob/main/extensions/l10n/main.md) extension

## Implementations

## Endnotes

### Future Considerations
