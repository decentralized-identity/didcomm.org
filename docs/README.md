# DIDComm
![logo](didcomm-logo.png)

DIDComm lets people and software communicate securely and privately over many channels: the web, email, mobile push notifications, QR codes, Bluetooth, message queues, sneakernet, and more.

Many application-level decentralized protocols are built atop DIDComm. These support activities like secure chat, [verifiable credential](https://www.w3.org/TR/vc-data-model/) exchange, buying and selling, scheduling, escrow, bidding, ticketing, and so forth. Search the application-level DIDComm protocol registry to see what you might want to use in your own software:

<hr>
<form action="Javascript:search()">
  <label for="fname">Keywords</label><br>
  <input type="text" id="keywords" name="keywords" value="credentials">
  <input type="submit" value="Submit">
</form>
<hr>

To implement DIDComm, study [the spec](https://identity.foundation/didcomm-messaging/spec/).

To register or modify a protocol definition, submit a PR against the `/protocols` folder.