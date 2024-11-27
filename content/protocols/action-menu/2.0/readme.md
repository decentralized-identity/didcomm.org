---
title: Action Menu
publisher: rodolfomiranda
license: MIT
piuri: https://didcomm.org/action-menu/2.0
status: Production
summary: A protocol that allows one Agent to present a set of heirarchical menus and actions to another user-facing Agent in a human friendly way.
tags: []
authors:
  - name:
    email:

---
# Summary
The action-menu protocol allows one Agent to present a set of heirarchical menus and actions to another user-facing Agent in a human friendly way. The protocol allows limited service discovery as well as simple data entry. While less flexible than HTML forms or a chat bot, it should be relatively easy to implement and provides a user interface which can be adapted for various platforms, including mobile agents.

# Motivation
Discovery of a peer Agent's capabilities or service offerings is currently reliant on knowledge obtained out-of-band. There is no in-band DIDComm supported protocol for querying a peer to obtain a human freindly menu of their capabilities or service offerings. Whilst this protocol doesn't offer ledger wide discovery capabilities, it will allow one User Agent connected to another, to present a navigable menu and request offered services. The protocol also provides an interface definition language to define action menu display, selection and request submission.

## Roles
There are two roles in this protocol: 

- `requester`: The `requester` asks the `responder` for menu definitions, presents them to a user, and initiates subsequent action items from the menu through further requests to the `responder`.
- `responder`: The `responder` presents an initial menu definition containing actionable elements to a `requester` and then responds to subsequent action requests from the menu.

## Basic Walkthrough

The action-menu protocol requires an active DIDComm connection before it can proceed. One Agent behaves as a `requester` in the protocol whilst the other Agent represents a `responder`. Conceptually the `responder` presents a list of actions which can be initiated by the `requester`. Actions are contained within a menu structure. Individual Actions may result in traversal to another menu or initiation of other protocols such as a presentation request, an introduction proposal, a credential offer, an acknowledgement, or a problem report.

The protocol can be initiated by either the `requester` asking for the root menu or the `responder` sending an unsolicited root menu. The protocol ends when the `requester` issues a perform operation or an internal timeout on the `responder` causes it to discard menu context. At any time a `requester` can reset the protocol by requesting the root menu from a `responder`.

Whilst the protocol is defined here as uni-directional (i.e requester to responder), both Agents may support both requester and responder roles simultaneously. Such cases would result in two instances of the action-menu protocol operating in parrallel.

## States

[![state machines](state-machines.png)](https://docs.google.com/spreadsheets/d/1KZ78KDxmXdck068aJpn-7BbDNfeaTcUyDgk6b2efCxc/edit?usp=sharing)

#### States for Requester

State&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;| Description
------ | -----------
null | No _menu_ has been requested or received
awaiting-root-menu | _menu-request_ message has been sent and awaiting root _menu_ response
preparing-selection | _menu_ message has been received and a user selection is pending
done | _perform_ message has been sent and protocol has finished. Perform actions can include requesting a new menu which will re-enter the state machine with the receive-menu event from the null state.

#### States for Responder

State&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;| Description
------ | -----------
null | No _menu_ has been requested or sent
preparing-root-menu | _menu-request_ message has been received and preparing _menu_ response for root menu
awaiting-selection | _menu_ message has been sent and are awaiting a _perform_ request
done | _perform_ message has been received and protocol has finished. Perform actions can include requesting a new menu which will re-enter the state machine with the send-menu event from the null state.


## Design By Contract

No protocol specific errors exist. Any errors related to headers or other core features are documented in the appropriate places.

## Security

This protocol expects messages to be encrypted during transmission, and repudiable. 

## Composition

Supported Goal Code | Notes
--- | ---

## Message Reference

### Menu
A `requester` is expected to display only one active menu per connection when action menus are employed by the `responder`. A newly received menu is not expected to interrupt a user, but rather be made available for the user to inspect possible actions related to the `responder`.

Message Type URI: `https://didcomm.org/action-menu/2.0/menu`

```json
{
  "type": "https://didcomm.org/action-menu/2.0/menu",
  "id": "5678876542344",
  "body": {
    "title": "Welcome to IIWBook",
    "description": "IIWBook facilitates connections between attendees by verifying attendance and distributing connection invitations.",
    "errormsg": "No IIWBook names were found.",
    "options": [
        {
        "name": "obtain-email-cred",
        "title": "Obtain a verified email credential",
        "description": "Connect with the BC email verification service to obtain a verified email credential"
        },
        {
        "name": "verify-email-cred",
        "title": "Verify your participation",
        "description": "Present a verified email credential to identify yourself"
        },
        {
        "name": "search-introductions",
        "title": "Search introductions",
        "description": "Your email address must be verified to perform a search",
        "disabled": true
        }
    ]
  }
}
```
where:

- `title`: plain text string, should be displayed at the top of the menu
description -- plain text string, should be shown in smaller text below the title bar
- `errormsg`: optional plain text string sent to indicate that the last perform request did not work as expected. The text should be presented to the user in the title section
- `options`: one or more available actions which the `responder` supports and may be `requested` in a perform message.
- `disabled`: optional indication that an option is unavailable due to certain requirements not yet being met

#### Quick forms
Menu options may define a form property, which would direct the `requester` user to a client-generated form when the menu option is selected. The menu title should be shown at the top of the form, followed by the form description text if defined, followed by the list of form `params` in sequence. The form should also include a Cancel button to return to the menu, a Submit button (with an optional custom label defined by `submit-label`), and optionally a Clear button to reset the parameters to their default values.

```json
{
  "type": "https://didcomm.org/action-menu/2.0/menu",
  "id": "5678876542347",
  "thid": "5678876542344",
  "title": "Attendance Verified",
  "body": {
    "description": "",
    "options": [
        {
        "name": "submit-invitation",
        "title": "Submit an invitation",
        "description": "Send an invitation for IIWBook to share with another participant"
        },
        {
        "name": "search-introductions",
        "title": "Search introductions",
        "form": {
            "description": "Enter a participant name below to perform a search.",
            "params": [
            {
                "name": "query",
                "title": "Participant name",
                "default": "",
                "description": "",
                "required": true,
                "type": "text"
            }
            ],
            "submit-label": "Search"
        }
        }
    ]
  }
}
```

When the form is submitted, a _perform_ message is generated containing values entered in the form. The `form` block may have an empty or missing `params` property in which case it acts as a simple confirmation dialog.

Each entry in the `params` list must define a `name` and `title`. The `description` is optional (should be displayed as help text below the field) and the `type` defaults to ‘text’ if not provided (only the ‘text’ type is supported at this time). Parameters should default to `required` true, if not specified. Parameters may also define a `default` value (used when rendering or clearing the form).

### Menu Request
In addition to menus being pushed by the `responder`, the root menu can be re-requested at any time by the `requester` sending a menu-request.

Message Type URI: `https://didcomm.org/action-menu/2.0/menu-request`

```json
{
  "type": "https://didcomm.org/action-menu/2.0/menu-request",
  "id": "5678876542347",
}
```

### Perform
When the `requester` user actions a menu option, a _perform_ message is generated. It should be attached to the same thread as the menu. The active menu should close when an option is selected.

The response to a _perform_ message can be any type of agent message, including another menu message, a presentation request, an introduction proposal, a credential offer, an acknowledgement, or a problem report. Whatever the message type, it should normally reference the same message thread as the perform message.

Message Type URI: `https://didcomm.org/action-menu/2.0/perform`

```json
{
  "type": "https://didcomm.org/action-menu/2.0/perform",
  "id": "5678876542346",
  "thid": "5678876542344"
  "body":{
    "name": "obtain-email-cred",
    "params": {}
  }
}
```
where:

- `name`: the menu option being requested. This is taken from the `name` attribute of the `options` array elements in the menu
- `params`: optional dictionary containing any input parameters requested in a menu option `form` section. The dictionary key values are taken from the `name` attributes of `params` array elements in the _menu_ option `form`.

## L10n

Localization may be implemented by means of [L10n](https://github.com/decentralized-identity/didcomm-messaging/blob/main/extensions/l10n/main.md) extension

## Implementations

## Endnotes

### Future Considerations
- There needs to be some consideration around how the protocol may terminate due to responder side timeouts since maintaining menu context for connections consumes resources. Adoption of [Report Problem Protocol 2.0](https://identity.foundation/didcomm-messaging/spec/#problem-reports) is a viable solution
