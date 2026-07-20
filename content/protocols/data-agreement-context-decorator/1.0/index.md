---
title: Data Agreement Context Decorator
publisher: rodolfomiranda
license: MIT
piuri: https://didcomm.org/data-agreement-context-decorator/1.0
status: Production
summary: The `data-agreement-context decorator` describes the associated Data Agreement protocol or holds references to a signed/counter-signed Data Agreement document inline with a DIDComm message.
tags: []
authors:
  - name: Mr. Lal Chandran (iGrant.io, Sweden)

---
## Data Agreement Context Decorator

### Summary

The `data-agreement-context decorator` describes the associated Data Agreement protocol or holds references to a signed/counter-signed Data Agreement document inline with a DIDComm message.

### Motivation

A DIDComm message should be capable of carrying additional metadata about the data agreement associated with the transaction.

### Tutorial

Usage looks like this,

```json
{
  "~data-agreement-context": {
    "message_type": "protocol or non-protocol",
    "message": {
      
    }
  }
}
```

Core properties of a ~data-agreement-context decorator are:

1. `message_type `- Indicates the type of message embedded in the decorator. Possible types are: 
   1. protocol - Indicates that message embedded is a Data Agreement protocol, and it must be processed accordingly
   2. non-protocol - Indicates that message references a data agreement offer.
2. `message `- Hold the message body.

`~data-agreement-context` decorator could carry a Data Agreement protocol message inside it or a reference to the data agreement offer. 

When it carries a reference to a data agreement instance (or receipt), it is understood that the outlying DIDComm message is occurring in reference to a data agreement that was signed by both requester (Data Source or Data Using Service) and the responder (Data Subject). 

The context decorator could also carry a Data Agreement protocol message; for example, If Data Source wants to send Data Agreement Offer to a Data Subject when offering a credential preview, it could do so by embedding `https://didcomm.org/data-agreement-negotiation/1.0/offer` DIDComm message. The Data Subject can respond while requesting a presentation by embedding the response  `https://didcomm.org/data-agreement-negotiation/1.0/accept`  DIDComm message in the decorator.

### Examples of `~data-agreement-context` decorator used in DIDComm messages


#### Aries RFC 0036 Issue Credential protocol enhanced with Data Agreement Context Decorator

##### issue-credential/1.0/offer-credential

```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/offer-credential",
  "@id": "29e24a0d-c9e8-4e5a-b913-6c821dfb9e25",
  "~thread": {},
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/offer",
      "@id": "066aaf33-27f2-40b6-95ce-ec6ff261f693",
      "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "body": {
        "@context": [
          "https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/interface-specs/data-agreement-schema/v1/data-agreement-schema-context.jsonld",
          "https://w3id.org/security/v2"
        ],
        "id": "5d028f08-285b-4872-94c3-f309ad4b5a24",
        "version": 1,
        "template_id": "6f5c0c86-40cb-4683-a993-e8ba8cbbdaa9",
        "template_version": 1,
        "data_controller_name": "Happy Shopping AB",
        "data_controller_url": "https://www.happyshopping.com",
        "purpose": "Customer loyalty program",
        "purpose_description": "Issuing loyalty cards for customers.",
        "lawful_basis": "consent",
        "method_of_use": "data-source",
        "data_policy": {
          "data_retention_period": 365,
          "policy_URL": "https://clarifyhealth.com/privacy-policy/",
          "jurisdiction": "Sweden",
          "industry_sector": "Healthcare",
          "geographic_restriction": "Europe",
          "storage_location": "Europe"
        },
        "personal_data": [
          {
            "attribute_id": "be99f24e-a7fe-452b-aac5-cd564f4700b6",
            "attribute_name": "Name",
            "attribute_sensitive": true,
            "attribute_category": "Personal",
            "attribute_description": "Name of the user"
          }
        ],
        "dpia": {
          "dpia_date": "2021-12-12T10:19:46.259870+00:00",
          "dpia_summary_url": "https://org.com/dpia_results.html"
        },
        "event": [
          {
            "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
            "time_stamp": "2021-12-13T06:47:50.755274+00:00",
            "did": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
            "state": "offer"
          }
        ],
        "proof": {
          "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:47:50.757521+00:00",
          "verificationMethod": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..toOtCZKCjc-Mms76jJGKLVTier6CnbMDxuYw3KFgQKpPu-AO4xBmXL7vgAjhNYZ9VhKwakn_BWYigWHDtpLIBA"
        },
        "data_subject_did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
      },
      "from": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
      "created_time": "1639358283"
    }
  },
  "comment": "string",
  "offers~attach": [
    {
      "@id": "libindy-cred-offer-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJzY2hlbWFfaWQiOiAiQ2JERHN5QXBDNHpKb3V0dU5uVGlCWToyOkN1c3RvbWVyIGxveWFsdHkgcHJvZ3JhbToxLjAuMCIsICJjcmVkX2RlZl9pZCI6ICJDYkREc3lBcEM0ekpvdXR1Tm5UaUJZOjM6Q0w6ODE0OmRlZmF1bHQiLCAia2V5X2NvcnJlY3RuZXNzX3Byb29mIjogeyJjIjogIjE5MDI1NzExNjkwNzY4MjMyMDc0NjE5MzE5NjM0ODc2NjI3NDQxOTA3MjI4ODU1NTU3MzQyNzUyMjgyMjY0MzY2MzgzMDgzOTgzNjgiLCAieHpfY2FwIjogIjg0MzYwNzk3MTQ3NzU5ODcyNzQwNjk0NjcxNDQ4MzUwODcwMDExODA0OTU5OTgwNjgzMDI0OTUyMDkzNTU2OTA5MDUyODIwNTgzNjMyMDA4MDg4MjAyMDIwMDgxNzY5MTQ5MzA4MTYyMzEyMzgyNTc0OTU2MzQyMDMxODgyNjY0MTk2MzEwMjgzNzY3NDI3Mzk0NjgwODIyOTEwMzM3MTg5MjYxNDkyNjQzOTYzOTkxMTg1NzI0NzI5MjM4ODE1NjIzNjE0MjI1MTQyNTYwMjYwMDE3NjMyODY5MTc5MzE1NDEwNjI4MDYzNTQyMTk1NjY3OTc1NjIxMTI0NjkwMzE0MjAzNDEyNzU2OTk0ODYxMDQyOTA1MDQ2OTQ2NjE3OTA0MDA2NDY0MTI2NzY4NDM2ODUwMTMyNDQwNzU5Njk2MDkwMTY1MjA3NjM2OTYxMzk0MDE4MjcwMjA3NDU4MjgxNzk4ODIxMTYyNzgxNzUzMjYwNTcwODc1MjUzODc5NzUyNjYyNzIyMjQ4ODU3MTY0Mzk2MDM3Njk0MzA3ODIwMTU3NzM0NDQ2Mjk0NTQ1NzE5OTUwMTg1MjU2Njc2Njk4NDEyMTg1MzQ1NjU1MzQzMjYxMTI5NTQ0OTM1NTA4NjkyMDE2NjI3MDg0MjI0NDk2MTAzODc3MjYyMjU0NzU2ODU4MDc4NDY1NjAyNDQ3NzMyOTc0OTgzNjIwODgyNzgzMjQyMjk0MjAwOTczODMwNjA2Njg4OTg1Njk4MTQyODk4MTg3MDE2MTM3Nzc3Mjc0MjEzODI4MDE3Mzg2MjY0MzE3MDY1NjcxNjAzNjY2MDk3MTAwMjEwMTk1OTg3MTc0MDU4Njc2NDEzNTEyODY4MDY0NzgxMDEwNjg0OTAzOTg0MTIzNjU0MjUwNTEzMTUyODYiLCAieHJfY2FwIjogW1sibmFtZSIsICIxNzYyMzA4MjEwNzM2MDk1NDQ3MDM3NzgyODIwNjU4Mjc5NDcyNzU4OTU4NDQyNjQwNzQzMDg5NDI5NDc1NzEyMDYwMTg2NDQxMTMyMTAzNzkwMTI5NTg3NzM5NTExODc1Nzk0MDA0NDQwNTEzODA2NDMyNzQzMDI0MTQ1MjUyMTM2MDMzODM4MzA2NTQwMjA4OTkxODc5NDI5NTAxNDg2MzM3NDA5NjM2MzUwNjA5ODIwMjk0MDM2NTYxNTc5MTI5NDg3Mzg1NjYwNjcwMDMzOTgxODQyMDQzNDkyNzk4MDM4NjIyOTI1NDMxODg2NjY1OTE3MTQzOTMwNzIwMTE0MjUxNDk0NzAzODg0NTYzNDg4MDg2MjYwMDE4NDc5MTU2NTc5MDIxNjUwNTk4ODUwODM3OTA0MzkyNjU2MjY0NTA1Njc0NjE1OTU4MjI3MTY1MzQ4NTQ2OTk1Mzc4MTc3NDMxMzQ1NzQ0NjMxOTM3MTY4NDg3MjA4NDI3MTQ0ODE5OTEwODIyMzI2NzUyMzYyMzI5NjgzNTc2ODU0MjkxOTYyODcyOTYzODIwOTI4Mzc5NzkyNjUxMzEwMTEwODQwMTYxOTU1ODQ0NDM4MTM1MTUwNjI2NzcxNDc0MzIwNzYzNjI2MTQyMDEzNTAyMjQ1NDY5MTE0OTc1MjE2OTAwNDczMzc3NjcwOTk4Nzc2NTA3MDk0NjkzMjM3MTM3MDk1Mjk4MTIyODQ3MjE4MDc3MzQ4Njk0NjM0MjQ4NDMyNDA1MjExMjc1NTk0OTI0MTE1NDczMTI1MDgwMTk2Mzc3Nzg0MTA2MzAwNjgzMzA2NDA5MjkyNjkxNjM1NTM3NDI2NjQ4ODAyOTE2NzgxOTk0Njk3MDgxMjIyNTIxNTkxMzY1MTMzMjQ3OTc1Njc2MTkyOTI0Il0sIFsibWFzdGVyX3NlY3JldCIsICI2MTU0OTQwOTg5MzA2NDI5ODU0MTUxMTYxOTA4Njg2MTM4MzIzNzM3NTg4MjMxNTc5NTM5NTIxMTc5Nzc2NTEwNjUxOTA1MjU3ODczOTUyNDcyOTE1NTExMjYzODk2NzE2NDA3NDIyMzY1MTI2MjEwNTk0MjY1MTQ2NjU3NTgzMzQ3MjkxNjAwMDYwODE4ODI3NDExNDg4NTMxMjY4MzM1MTYyNzY3OTUxNzIzODkyODkwOTg1NjU4MjQwNDAzMzc5NTY1NDY4NzA5MTYyOTUwNzE0NDU5MjYxNjI1NzA1NDI5OTM0NzcyODQ2MTYxMDM5NjIyNzI0MDM1Njk0Mzc2MjQyNjkxNzI2OTA5NTk2ODMwMTE1NDE4NzE4Mzk0ODIyNDc5MDY3MzY0MzYzMTE0NDQwNTA3NjU4MjQ3ODk4NDg0MzQ5ODg4NDMwNjg2MTEzMDg3NTE4NDE0OTkxMzc4MDg3MjA1NzU2ODIyODg2MDA4Njg2NzM1MTgxNzU5NjIxMzQ5Mjc3Mzg5NDYzNzI5OTIzMzUxODgxNDc5ODkxOTE0NDA2NjU3OTExMDI5ODgxMTExODc2NTgyMTQ0MDkyMTk1Mzg2NTY0NTI4NDQ4ODg4OTY3MDAwOTIyMTgyNDkyNjA0OTM2MzcwMTU3MDI5MzUyMDM3ODg1Mzc5Mzk1MjUxNDcxMzc4NTEzNTYxOTMzMTg1MDY5OTY3ODgzMjI2OTA4NjA5OTEwNDE4MzA0OTg1MDEyNjIwMTEwNzU4NjU3OTAzODU0ODc2NTMyMjg1NDg5NjY2MDkzMTAyMjQ1NTg1NjUzNTg1NzU2MzUwOTE4MDgzMTYwODEzNTc1NjczMTAzMDE5MDQ3NDg1MTQzMjg4NjQzMDE3ODEwMTEwMDQwODA0NTU5NDcwNDUxNjI4MTg5Il1dfSwgIm5vbmNlIjogIjEwODA3ODMzNzg3NjQxMzg1NjgxNjg4MDMifQ=="
      }
    }
  ],
  "credential_preview": {
    "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview",
    "attributes": [
      {
        "name": "Name",
        "value": "John Doe"
      }
    ]
  }
}
```

##### issue-credential/1.0/request-credential

```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/request-credential",
  "@id": "9f60db9f-b83f-4990-a06b-c64643388f9a",
  "~thread": {
    "thid": "29e24a0d-c9e8-4e5a-b913-6c821dfb9e25"
  },
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/accept",
      "@id": "0f9034db-3e58-498b-8119-59fa37f3e652",
      "body": {
        "id": "5d028f08-285b-4872-94c3-f309ad4b5a24",
        "event": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "time_stamp": "2021-12-13T06:50:07.180078+00:00",
          "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "state": "accept"
        },
        "proof": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:50:07.180946+00:00",
          "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..CvX_kzNTK9vBTb2J4p2cLsImgy1tPOi2_psmgxSipllR_iRxY8bf9kGyhEqy4Q7n7KAGFnd5oPKmgFhXKplDAQ"
        }
      },
      "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "created_time": "1639358418",
      "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV"
    }
  },
  "requests~attach": [
    {
      "@id": "libindy-cred-request-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJwcm92ZXJfZGlkIjogIjc3SGR2ZWM1WHhYb2NSSENybmVSUksiLCAiY3JlZF9kZWZfaWQiOiAiQ2JERHN5QXBDNHpKb3V0dU5uVGlCWTozOkNMOjgxNDpkZWZhdWx0IiwgImJsaW5kZWRfbXMiOiB7InUiOiAiNjg5MjExNTc0NDk5MTgxOTg5Nzk3NjExNDE5ODUyODIxNDEzNTQ3NzgyNzAwNTkzMDg3NTQ4MDM0NjY5NjEyMTY0Njc1NDExNjE0NzkzMDE0NTA3ODgyMzY5NzA2Njk5MDY2NTA1NzE5NDkwMTE3ODgzNjc2MjI4NTM3OTEwNjU1MjgwODgzMjkwNTg4NjcyNjk4MDYwNjAzODU3MTMyMjMyNDMzNTk5MjI5MTg3MzI1NjA3MjAxNjE0MTc2OTE4MTI3OTI3MTAxMjMzMjU1NDMxNDkwMTM3NzU3NDM0ODE1MjczNzY1NTY0NTQ1OTMxNTIyODU0MDQwMTI0NjI0Mzk3NjM0MjIzOTc5MDEzMDcxNDI2NDk0OTMyNzQxMjgzNzEzMjY5NDQxNDg3ODM3NDM0MjY4NDM5MTg1NDYyMTUzMTk4MjUyMjEyODU4NDkwNDY3MjMyMDUwODA2ODkwNzA1OTQ5ODY0Mzg5MjM2NjgwNTExOTE4NjI0ODc1OTE2NDA3MDM2MDgxOTYzMjUyODIwNDQ5MjQzNTgxODQyOTQ0NTkyNTQ1NjM5NjAxNDY2Mzk0MDk2NjA4NTk5MTQ4NjEwMzUxMTk1MTQxODY3OTExMjgxMTE1MDE3NDU2NzMwMjQzMzczMzY0ODY4NzM1Mzk0MTExOTMwMTE1NzU0MTE5MTI4MDAxMjEyMTc0NjY4MzI2OTgyOTk3OTI3MDI1MDczNTU2OTk5NjM5OTY2NTAyMTg1NjM2MDEwMDU2ODQzMjE2NzY0NTk4MjkxMzM5MjY0MzMzNjA5NTg5OTk1NDA3MzkyMTMzNDciLCAidXIiOiBudWxsLCAiaGlkZGVuX2F0dHJpYnV0ZXMiOiBbIm1hc3Rlcl9zZWNyZXQiXSwgImNvbW1pdHRlZF9hdHRyaWJ1dGVzIjoge319LCAiYmxpbmRlZF9tc19jb3JyZWN0bmVzc19wcm9vZiI6IHsiYyI6ICI4MzQ2MjUwMTQ4MzAzNDgyMDk5MzI3MDA2ODUwNzc3NTc3OTU5NjYyMzYzNzgyMTcxMDc2Mzc1OTMyMzEzMzQ1NDQwMDc1OTMzMDMwMyIsICJ2X2Rhc2hfY2FwIjogIjIxNzY3NDMyODE0Njk3OTk4MTg4MDAwOTg4MTYzNjUxMzY4ODc2NTMwNDM5MDk4NTA5NTQxNzMwNTUwOTUyMDY4MDcyODA0MTA2OTI5Mjc0ODgwNzM1NTkxNTkxNDQxNDA2ODM4NDk5MzkwNzE1NTM5OTU5MDYxMjA3NDgxMDc3Mzg5MjUxOTk5MjQzODcwODI4MTk0NTgzNTg4NjkyMDcyNTg2MTQxNzIyMTEwNzI2MTIyMTIwNDg0NDg1NTc0MzIwNTQxMzU2NDAxMzUyNzg3NzQyNTA1ODYxNjUwMjMxNzAyODY5MjI4Mjc2Mzg2NTI1MTY3NjQyMTE4MjY1MTcyNTYyMTI2ODkzMzY0MjA5OTYzNTk2ODkxMDY3MDA0OTIwMjA5NTM3MTQzNzQ2ODcxNDI4NDcxMTY5ODY2NDM3NjM1MzI4NDg5MTM1OTY5ODMwNjQ5MzI1ODYwNTk1OTU3MzkyMzc0Nzg2NTE2MjI4NDI5ODk2NDQ2Njk5MTUxNTYwNzU4ODc4MTg5NjI1MTU3NTQxMTc3OTc3OTc4NTM4OTU3NzA3MDkxNjk1NzMzMDYzODUwOTg0OTgzMzkxNDEzMDE2NTQ5OTM3NTU0OTk1ODIxMDU4NDU2MjU3NzgwNzg1NzIxMTQzOTM3NzA3NzQ4MDc0MDc1NTA4Mjg2MTgwMTIzMjc0MTk0ODU5NjQ3OTE1ODM5NTAzNTQyNDI2MzE5NjgyOTc2NzY5NTUyODEyNjk4MzIxOTMyNDgwNzg0MDAzNTY5NzA2NDc1MTk4NTI4ODQ4NzAwMDI5MTgzOTE0NTAzNzU2MzkwNjQzNTY1NzM1MzgyNjU3MjI0OTA5ODg4MjcwMTY4NzUwNDMzODU2NTU3Mzk2NDk2NTU4ODg5MjAyODk0OTcwNTQxMzY5NjY2NTgwMzI5MTMyODQ4OTIxOTM5NzgzNDYzMzEwOTAiLCAibV9jYXBzIjogeyJtYXN0ZXJfc2VjcmV0IjogIjE0OTI1OTM3NjE2MDgxNTgzOTU4NTY5MTQ5ODg3MTExNzU3NjIzOTczMzY1MTExMTM5ODczNTIxMjIxMjczNDI3OTYxNjcyMjM2NDk4MDM0MTI5NTY0NzYzNDEzOTkwNjE4NTc2NjU2OTgyMjMwODQ5MDIzODcwNTY2ODU2NDM3MjIwNzgyMTAyMzMyMTcyNDE3MDA0MDY0Mzc1MjQ5NjI3ODIxMzE2OTkxNzI5MDU4MjYxIn0sICJyX2NhcHMiOiB7fX0sICJub25jZSI6ICIzNzEyMjExNDg2NzQ5MjI4NDMyNzk0NjAifQ=="
      }
    }
  ]
}
```

#### Aries RFC 0037 Present Proof protocol enhanced with Data Agreement Context Decorator

##### present-proof/1.0/request-presentation

```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/present-proof/1.0/request-presentation",
  "@id": "dc99cca5-ea76-4b20-ab74-fe59e422ece1",
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/offer",
      "id": "12bcc96d-88b6-4ee8-997a-4ce67b653d87",
      "to": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "body": {
        "@context": [
          "https://raw.githubusercontent.com/decentralised-dataexchange/automated-data-agreements/main/interface-specs/data-agreement-schema/v1/data-agreement-schema-context.jsonld",
          "https://w3id.org/security/v2"
        ],
        "id": "d73043e6-4627-4e2f-a20a-2495604afd84",
        "version": 1,
        "template_id": "b59b56ad-6cba-46f5-a86b-e578a1e503ed",
        "template_version": 1,
        "data_controller_name": "Happy Shopping AB",
        "data_controller_url": "https://www.happyshopping.com",
        "purpose": "Customized shopping experience",
        "purpose_description": "Collecting user data for offering custom tailored shopping experience",
        "lawful_basis": "consent",
        "method_of_use": "data-using-service",
        "data_policy": {
          "data_retention_period": 365,
          "policy_URL": "https://clarifyhealth.com/privacy-policy/",
          "jurisdiction": "Sweden",
          "industry_sector": "Healthcare",
          "geographic_restriction": "Europe",
          "storage_location": "Europe"
        },
        "personal_data": [
          {
            "attribute_id": "be99f24e-a7fe-452b-aac5-cd564f4700b6",
            "attribute_name": "Name",
            "attribute_sensitive": true,
            "attribute_category": "Personal",
            "attribute_description": "Name of the user"
          }
        ],
        "dpia": {
          "dpia_date": "2021-12-12T10:19:46.259870+00:00",
          "dpia_summary_url": "https://org.com/dpia_results.html"
        },
        "event": [
          {
            "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
            "time_stamp": "2021-12-13T06:53:39.091120+00:00",
            "did": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
            "state": "offer"
          }
        ],
        "proof": {
          "id": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX#1",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:53:39.094215+00:00",
          "verificationMethod": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..fmULdKkKpNi2haL7KtcZWOUkYnhtYkhlwGo3qa29lCMW7lKOaJM3iKY5SSDqPzPg7fQR_Yk4W1quj0M-TEbyDA"
        },
        "data_subject_did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND"
      },
      "from": "did:mydata:z6Mkkmdx9iNHeKGYyV4Wi4uZLLpcmCKmh8uw369a6xGrY4iX",
      "created_time": "1639358631"
    }
  },
  "comment": "Collecting user data for offering custom tailored shopping experience",
  "request_presentations~attach": [
    {
      "@id": "libindy-request-presentation-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJuYW1lIjogIkN1c3RvbWl6ZWQgc2hvcHBpbmcgZXhwZXJpZW5jZSIsICJ2ZXJzaW9uIjogIjEuMC4wIiwgInJlcXVlc3RlZF9hdHRyaWJ1dGVzIjogeyJhZGRpdGlvbmFsUHJvcDEiOiB7Im5hbWUiOiAiTmFtZSIsICJyZXN0cmljdGlvbnMiOiBbXX19LCAicmVxdWVzdGVkX3ByZWRpY2F0ZXMiOiB7fSwgIm5vbmNlIjogIjQ2NjUwMTE1MTUxNzI1ODM4OTM4NjI5MyJ9"
      }
    }
  ]
}
```

##### present-proof/1.0/presentation


```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/present-proof/1.0/presentation",
  "@id": "3f62acb2-722c-4c3f-b361-0ec32a39bede",
  "~thread": {
    "thid": "dc99cca5-ea76-4b20-ab74-fe59e422ece1"
  },
  "~data-agreement-context": {
    "message_type": "protocol",
    "message": {
      "type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/data-agreement-negotiation/1.0/accept",
      "id": "4937ed2a-c2e2-4ebf-802f-9c9a4d7cca07",
      "body": {
        "id": "d73043e6-4627-4e2f-a20a-2495604afd84",
        "event": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "time_stamp": "2021-12-13T06:56:46.082679+00:00",
          "did": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "state": "accept"
        },
        "proof": {
          "id": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND#2",
          "type": "Ed25519Signature2018",
          "created": "2021-12-13T06:56:46.083893+00:00",
          "verificationMethod": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
          "proofPurpose": "contractAgreement",
          "proofValue": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..5LMj7UN9lE3snlxHuG3y7BnxZ1HZhYnq3hNTVDUEQjFa0pguag0eI5BV_7mu01RAbCwcK_5_e6qE2mH-OKzGDQ"
        }
      },
      "from": "did:mydata:z6MkhnMkWDytfVEL88BRmWGeLN9vGhpdJ612QTgVMt1agqND",
      "created_time": "1639358817",
      "to": "did:mydata:z6MkpzHAuPc4N2jgXg23ikZjp2tQSTEHqnzzr9683AQ2EvCV"
    }
  },
  "presentations~attach": [
    {
      "@id": "libindy-presentation-0",
      "mime-type": "application/json",
      "data": {
        "base64": "eyJwcm9vZiI6IHsicHJvb2ZzIjogW3sicHJpbWFyeV9wcm9vZiI6IHsiZXFfcHJvb2YiOiB7InJldmVhbGVkX2F0dHJzIjogeyJuYW1lIjogIjQ5MjYzODM1NTY4NzkwODUyMjg1MTM2NzU1NTQwNTAxMTAxMDQ0OTUyNjI5MDQxMTcwMTAyNzcyNTc5OTYzNzI0NzE0ODI3MzE1NDY0In0sICJhX3ByaW1lIjogIjQyMTQzODMwNzc5NjcyMzI3MDI1ODAxNzA2MDcyNzU5ODQ5MzEzMDIxOTQ0Mjc3Mjc2NTA2MDg0Nzc1MTE2MTg0NjcwMzI4MTI2MTk4NDczMzU4NDM2NjY3MTI1ODExMTU0MzYxNDQ5NDkyMTU1ODk5NzY3MDA2NDU5Mzk2NTM5ODY2MTk1ODE1ODM2ODIxMTAzOTcwOTU3NTEyOTkxMzQwMzYzNzkxNDYwMDk1NzY0OTkxNTQzODMyNjIwOTAzMzYzMjc2NjU4NjMwNTE3ODgzNTE5NzMwNzQ1NTY4NTE4MzAzOTgwNzY4NjI5NTAwNzM0MzQ4NjU0OTE4NzU3OTEzNTA1OTQ1MTIyMjkwMTI2NTMyNTM1MDY4NTE4NzAzMDU3NTkzOTA5MTQ2OTMyNTYxNzgxNTA3NzUzNTE3NjYxMDQzNTU0MTMyMTI4OTQwODk5NjcxNDMzNzQ3NzQyMjkxMjI2NTIxOTM0NTg3NTkwOTMzMTgzNzQ4OTI0Njk5NzUxOTc5ODI1OTY1ODIzMzg0NjczNDY1MDAxMDYxMzYyODQ4OTAwMDU3NTIyNTA2OTU4ODY4MjM0NDUyNjUyMTgzMzU3NjY1NzczNDg2NDI3NDc0MjE0NjgyMjQzNjY2MTUzOTk0NjI5NDkwNzAzMDA4MDMwODAyMTUxNTYxNjc5ODk0MjI1NTkxMTcyNzQ1NzEzODQ0NTQzOTMyMzE4ODM2NzIwNjc2MjUyNDY0MTIzMDk5MjUzODE0NDIxMTY4NTU2OTI1MjMxNDM4MzAwNjE5ODcxOTY5ODM1NjI5NzA4MjAzMTY3MjExIiwgImUiOiAiNTI0Njc1NTY4MTI2NjMyMTk1NzkzMzUwMTM5NjcxNzMwNjgyMTExMjMzNjU0NDgwMDM2Nzc5NzEwMjg5ODgyMDA2MTE4NjQ5MzM1MTk1NDU0Nzc4MDEzODM5OTk4ODkyNzE2NDY0NTI3NjgwNDg0MDI3Nzg2OTk1NTA4ODg4NTI2MzY0MzMzOTciLCAidiI6ICI0ODA1NjMzOTA3MzgwNjI5NjMwNzQxODgxNzgzODY2ODY3NDQ0NTMxODIyMjY5NjEzNjcxOTcxNTc0NTUxMzA1OTk5NzUxMjc1NzI2MTMyNzkzMzQwNzA4MDAyOTY3NTQwNTUyODMxMTAwNzIxNTQzMDQzMzg1MzI2MjExMjIyNzkxOTM3NDIzNzU5NDcyNjE1NDQ3MzAzODY2MzI3MDIzMDA3ODAyMzY5NzU5MDA2MTM5MDk0MTA4OTIyNDg3OTc0Mzk4Mjk3NzM1MzQ1Nzg5NTQ0ODEzMDc2ODg1MjUxMjYwNTE3NTkxNTk1NTAwMDM1NTMzMzI2Mjg3MzQ5NzA0MTA2MjA5OTE5NDMxNTM4NjI3OTI5MTU2MzkxNDk4NTgzMDc0MTYyMjA2NTM5NjUwNzE0NjI1MzI2NzI0NTUzMjY0MTkxNDg5MjI3NDUxNjMxNzY2NTg1MTMyNzgyMTU5MzMxNTYwODcyODE1MzMzMDY4NDAyOTczMjg0NzIwMTAyMTA3MjExMDYzMTYxOTEyMjgwMTY3Mjg0MDA5ODI3NTY1MjYyNjI2MTMwNjU4MTU0MjU1MDM4MzY5NzA3OTUwNzQzNzM5ODI4NTM4NDAzNzg1NTc2NzUzMDMxNzQ2MzU1NjEzMzkxNzE5ODU1MTY0MDUwOTI4MDgyNjExNDQ4NjU2NDk2MTc3NTg3NzExNjg1MDU4Mzg4NjkzMTMxNTYzMTIzMDk4Mjk0NzAxODU1NzQ4MDAyNzEzMzg0NTk0MjM4MzU1MzExODI3Mzg5NzI1MzE4NDE0ODIwNTQwMjI5NzE5NzA5ODE3NTA0MDYwOTg3MDU2Mzk0MjM3MTg5NTE0ODk0NzY1MDQ0NTc2NjIzMjQ3NjAxNjQwNTU0NzMyNzM4Njk2Mjk5MDY5MTI4NjI5NDc1MjQ2NjkxNzI2NDkwNzAwNzM1MjAzOTU5MjQxMjc3ODk3NjY3MTE0MDI2NjQxMjQwMTE0MzE1MDE0NzkxMzk0MzQwMDIzODIyNjgwNDEwMDMyMzI5MjEyMzA0NDY2NjU3MDg2NzgyOTEzNDQ5Njc5NjE4NjI3MDc1NTc4MDMxNDg1MjczMjE1Mjc0MDU4MDYzNjkxNjk1MzYzNTcwODU3MjQxNTI0MTczNDM2MzUwNzkxMjU3MjIxNzM5MTEwMDM0NzA4NDUzNTY5MjI5MzU4MDgwNTEzNjg1Mjk3NDMwMDk0NTM3MjQiLCAibSI6IHsibWFzdGVyX3NlY3JldCI6ICIxNDAxODQ3MDA4Nzg4NTA5MDMwOTIzMjYzMjgxNzg3NjQ3ODQzMzQxMDA3NjM5MzQxNDI5MTMyMTcwMDMwNTExNDUxMDA3NjcwMjI5NDY4OTg4OTc3OTEzNjI1NTAzMDE5NjE3NDUyNDQwOTg0OTc2NjM2MTc1NDI3MzE0MTE5NTU4NzA4OTkxNzgyODExMTYzODk1NTQ1ODY3ODkzOTc4MjM0MjAxMjcwNjAwOTE2NjQzNyJ9LCAibTIiOiAiOTA5MDcyMTc4NjA4MzQ5MjY2ODYzNDk2NDM1OTExMjY1OTM4NjAwOTExNzI4MzI1MTI5NDk3OTc2NDE0MzQzNzMzNDY3Nzc1MTgwNjE1MjYyNDIyMzg2ODMyNTQyNzcyOTc0OTI1OTU5NTk0ODcyODE5NzQwMDIxMTQxMDg2ODk2MjEwMTU4NjkxNzc0MzE1NjY3OTcyNTk5ODY5NDU5ODE2NTYyMTQ1Njc2MDk0ODQzNCJ9LCAiZ2VfcHJvb2ZzIjogW119LCAibm9uX3Jldm9jX3Byb29mIjogbnVsbH1dLCAiYWdncmVnYXRlZF9wcm9vZiI6IHsiY19oYXNoIjogIjkxNjM1ODgwMzU2MjI5ODA5MDc2NTA4MjQ1NDcxNjM3NDc1NDc2MTQ3NDc0NzYwNDgzMTI5MzAwNDcxNjEyOTUwMjI5MjE4MzQzOTc5IiwgImNfbGlzdCI6IFtbMSwgNzcsIDIxNSwgMjM2LCAyNCwgMTUsIDU5LCA3OSwgOTIsIDIyMywgMTk1LCAxMzEsIDE3LCAxMDYsIDgsIDE3NywgMTAsIDkwLCAxMzAsIDEwMSwgNSwgMTY4LCAyNDMsIDIxLCAxOTAsIDE3MywgMTg1LCA4LCAxNjUsIDIwMCwgMjE5LCAxNjYsIDM1LCA1NywgMTAzLCA4MSwgMTcxLCA3LCAxMywgMTQ5LCAyMzYsIDE1LCA5NywgMjI5LCAyNTQsIDE3MCwgMTkxLCAyLCAxMDcsIDgsIDIxOCwgMjI2LCA4MywgOSwgOSwgODksIDIwMCwgNjAsIDI1NCwgMjIwLCAxMDksIDE3OCwgNTQsIDExNCwgMTc4LCA1NiwgNTksIDE2OSwgMTkxLCA2MiwgMTM3LCAxMDgsIDE5OSwgMjIwLCAxMTIsIDIwOSwgOTksIDE3NCwgNDMsIDI5LCA1NCwgMTksIDEzOSwgNjgsIDMwLCAxNjAsIDIyOSwgMTg4LCAyMzYsIDUzLCAyNiwgODYsIDcxLCAxNDEsIDE4MCwgODgsIDE3OCwgMTAyLCA0MSwgMTIzLCAxMzcsIDQ1LCAyMjksIDExNSwgNTksIDE2MiwgNDcsIDM3LCAxODgsIDg2LCAxMDcsIDIzMiwgMTQyLCAxNzMsIDE5LCAxOSwgMjAyLCAyMjUsIDEwOCwgMTg3LCAwLCA4NywgMjI0LCAxNywgMjM0LCAxODYsIDcwLCAyMDMsIDQxLCAyMDIsIDE3NywgNTksIDI0MSwgMjE4LCAxNDQsIDgyLCAyMTIsIDE2LCAyNDgsIDE4NiwgMjQ5LCAxMDYsIDI3LCAxNjAsIDE0NCwgMjM3LCA1MiwgMjIsIDEsIDIyNiwgNDEsIDE5OCwgMjQzLCA5OSwgMywgMjQsIDE3MCwgNzksIDcsIDIzOCwgMjA4LCAxNTEsIDExMCwgMjQ2LCAxMzAsIDEwMywgMTY2LCA2NCwgMTU3LCAxNCwgMTE2LCA2OSwgMjQzLCAxMjAsIDgwLCAxODgsIDIzMSwgMTQ3LCAxNTgsIDYyLCAxLCAxMywgOCwgNzUsIDIyLCAxNzAsIDIxNiwgMTY2LCAxNiwgMTk2LCA3MCwgNDIsIDE0NiwgMTY5LCAyMDEsIDIyOSwgMTU0LCA4MSwgMTU3LCA4NywgMTYzLCAyNywgMTYzLCA0NywgMjEzLCAyMDQsIDI1NCwgNTgsIDkzLCAxNTEsIDQ2LCAxOTMsIDIzOSwgMTE2LCAyMDYsIDEyOSwgNjQsIDIwMiwgMiwgMTU5LCAxNzMsIDE0MiwgMTAyLCAxMTcsIDEyMSwgMTIwLCAxNzcsIDQwLCA3LCAxNTcsIDI0NywgMjA4LCAxMzEsIDE4NCwgMjM2LCAxMzUsIDIyNSwgMjI4LCAyNTQsIDE1LCAxMDksIDgxLCAxNjUsIDEzNCwgMjM5LCAxNTMsIDY1LCA5MiwgMTQ1LCAzMSwgNjAsIDIyOCwgMTU1LCAxMzYsIDI2LCAxNDEsIDIzNV1dfX0sICJyZXF1ZXN0ZWRfcHJvb2YiOiB7InJldmVhbGVkX2F0dHJzIjogeyJhZGRpdGlvbmFsUHJvcDEiOiB7InN1Yl9wcm9vZl9pbmRleCI6IDAsICJyYXciOiAiSm9obiBEb2UiLCAiZW5jb2RlZCI6ICI0OTI2MzgzNTU2ODc5MDg1MjI4NTEzNjc1NTU0MDUwMTEwMTA0NDk1MjYyOTA0MTE3MDEwMjc3MjU3OTk2MzcyNDcxNDgyNzMxNTQ2NCJ9fSwgInNlbGZfYXR0ZXN0ZWRfYXR0cnMiOiB7fSwgInVucmV2ZWFsZWRfYXR0cnMiOiB7fSwgInByZWRpY2F0ZXMiOiB7fX0sICJpZGVudGlmaWVycyI6IFt7InNjaGVtYV9pZCI6ICJDYkREc3lBcEM0ekpvdXR1Tm5UaUJZOjI6Q3VzdG9tZXIgbG95YWx0eSBwcm9ncmFtOjEuMC4wIiwgImNyZWRfZGVmX2lkIjogIkNiRERzeUFwQzR6Sm91dHVOblRpQlk6MzpDTDo4MTQ6ZGVmYXVsdCIsICJyZXZfcmVnX2lkIjogbnVsbCwgInRpbWVzdGFtcCI6IG51bGx9XX0="
      }
    }
  ]
}
```

## References

1. DID core specification: [https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)
2. IETF Multibase Data Format specification: [https://tools.ietf.org/html/draft-multiformats-multibase](https://tools.ietf.org/html/draft-multiformats-multibase) 
3. Multicodec - Compact self-describing codecs: [https://github.com/multiformats/multicodec](https://github.com/multiformats/multicodec)
4. DIDComm message specification: https://identity.foundation/didcomm-messaging/spec/v2.1/
5. Linked Data Cryptographic Suit Registry: [https://w3c-ccg.github.io/ld-cryptosuite-registry/](https://w3c-ccg.github.io/ld-cryptosuite-registry/) 
6. Aries RFC 0092: Transports Return Route: [https://github.com/hyperledger/aries-rfcs/tree/master/features/0092-transport-return-route](https://github.com/hyperledger/aries-rfcs/tree/master/features/0092-transport-return-route) 
7. Aries RFC 0019: Encryption Envelope:  [https://github.com/hyperledger/aries-rfcs/tree/master/features/0019-encryption-envelope](https://github.com/hyperledger/aries-rfcs/tree/master/features/0019-encryption-envelope)
8. IETF RFC 7516 - JSON Web Encryption: [https://datatracker.ietf.org/doc/html/rfc7516](https://datatracker.ietf.org/doc/html/rfc7516)
9. Aries RFC 0035 - Report Problem Protocol 1.0: [https://github.com/hyperledger/aries-rfcs/tree/master/features/0035-report-problem](https://github.com/hyperledger/aries-rfcs/tree/master/features/0035-report-problem)
10. Aries RFC  003 - Protocols: [https://github.com/hyperledger/aries-rfcs/tree/master/concepts/0003-protocols#types-of-protocols](https://github.com/hyperledger/aries-rfcs/tree/master/concepts/0003-protocols#types-of-protocols) 
