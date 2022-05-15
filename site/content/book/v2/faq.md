# Intro
This file will work as a lightweight frequently asked questions before it grows into something unmanagable and needs to have better structure on it. For now this will offer a simple content adressing list an link to each question.
We have sections of questions and questions underneath each section. They link directly to each question.

## Cryptography
1. [How kosher is it to do non encrypted messages?](#how-kosher-is-it-to-do-non-encrypted-messages) 

******

### How kosher is it to do non encrypted messages?
Since it is an option to not encrypt DID COMM messages, and we want to be clear on how you can reason about it

The answer to "how kosher" depends on two subquestions:

1. Are you uninterested in confidentiality because the message is intended to be public anyway (e.g., it's a message inviting anyone in the general public to send you a message)?

2. Will the message stay within trust domain boundaries? (That is, Alice sends an encrypted message to Bob; Bob decrypts and wants to send it as plaintext to 5 of his agents, but all of them are within his own sphere of control, and Bob trusts himself.)

If the answer to either of these questions is "Yes", then we think non encrypted messages are completely fine.

If the answer to both of these questions is "No", then we think messages should be encrypted, because it means confidentiality should matter. It might be tempting to say, "True. But I'm using https, which gives confidentiality anyway." This is a fallacy, because by design a sender in DIDComm doesn't actually know the full route to the target. A sender might be using HTTPS, but perhaps part of the route is not. Using channel-oriented encryption (e.g., TLS) on the part of the channel you can see is not actually secure, if someone somewhere has to take plaintext off that channel and put it somewhere else that you don't know about. The guarantee is supposed to be end-to-end. (In our question #2 above, "Bob" is the end; what he does after it gets to him is his business, not DIDComm's. That's why we are comfortable with him using plaintext in a context wholly under his own control.)
