# Dealing with mobile agents

Mobile agents are a key component in many decentralized identity solutions. Individuals holding Identity Wallets on their mobile phones, and IoT devices transmitting secure information from remote locations are some common examples of mobile agents. The ability to roam from different networks and change connectivity seamlessly is a great feature. However it comes at the expense that agents are unable to declare a unique network address where to be reached. Also, that obstacle becomes more complex when agents are hidden inside network firewalls.

Additionally, [DIDComm Messaging](https://identity.foundation/didcomm-messaging/spec/) specifies that:
* [Transports](https://identity.foundation/didcomm-messaging/spec/#transports) are _simplex_, they only transfer messages from sender to receiver. No information about the effects or results from a message is transmitted over the same connection.
* Parties may declare a `serviceEndpoint` in their DID Document. However DID Documents are mainly static and updating them, if possible, is not an instant process.

Given the above mentioned situation, the question is **how a mobile agent can receive a DIDComm message**

The answer is based on two elements: **Routing Protocol** and **Return-Route** extension.

## Routing Protocol
The [Routing Protocol](https://identity.foundation/didcomm-messaging/spec/#routing-protocol-20) defines a partially trusted party called _Mediator_ to facilitate message delivery. Senders can pass messages to a mediator, so next, the mediator can forward them to the final destination. Of course, the final message to the receiver is encrypted and obscured to the intermediate mediator or mediators.

Message from the sender to the mediator is of type `forward` and contains the encrypted messages to the receiver as `attachments` . Also, by this means, recipients can declare a mediator's `serviceEndpoint` as its own `serviceEndpoint` to receive messages.


## Return Route
The Return-Route extension enables bi-directional communication on the same transport, even when one party has no public endpoint. Messages can flow back in response to inbound messages over the same connection.
That means that if the `return-route` header is present in a message with a value different to `none`, the receiver of a message can reply back in the same channel that was already established.

## Solution via Mediator
With those two elements a solution can be developed to cope with the mobile agent problem. The process can be described as follow:
1. The mobile agent sends a message to register to a Mediator following a predefined protocol called **Mediator Coordinator Protocol**. The message must contain the `return-route` header.
2. The Mediator responds back to the mobile agent in the same channel that was already opened in the first step. In the response, the mediator assigns a own `serviceEndpoint` to the mobile agent, that later can be used in when sending messages to other parties.
3. Those third parties, when receiving a message from the mobile agent, can respond using the Routing Protocol by sending a `forward` message to the Mediator that contains the encrypted response to the mobile agent as an attachment.
4. The Mediator should hold the message, since there is no way to pass it to the mobile agent directly.
5. Using a predefined protocol called **Pickup Protocol**, the mobile agent contacts the Mediator who can respond back in the same channel forwarding all held messages from third parties.



