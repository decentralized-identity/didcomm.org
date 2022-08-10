# V1 --> v2 migrator script

## Header and decorator mappings

v1 | v2 | Notes
--- | --- | ---
@id|id|
@type|type|
~thread.thid|thid
~thread.pthid|pthid
~thread.sender_order|sender_order| see [Advanced Sequencing Extension](https://github.com/decentralized-identity/didcomm-messaging/blob/main/extensions/advanced_sequencing/main.md)
~thread.received_orders|received_order|see [Advanced Sequencing Extension](https://github.com/decentralized-identity/didcomm-messaging/blob/main/extensions/advanced_sequencing/main.md)
~thread.goal_code|body.goal_code
goal_code|body.goal_code
goal|body.goal
~l10n| l10n| see [L10n Extension](https://github.com/decentralized-identity/didcomm-messaging/blob/main/extensions/l10n/main.md)
~transport.return_route|return_route| see [Return-Route Extension](https://github.com/decentralized-identity/didcomm-messaging/blob/main/extensions/return_route/main.md)
~timing.expires_time|expires_time| v1 use timestamp format as "2019-01-25 18:25Z", v2 use unixtime seconds since 1970-01-01T00:00:00Z
sent_time|created_time|v1 use timestamp format as "2019-01-25 18:25Z", v2 use unixtime seconds since 1970-01-01T00:00:00Z
handler|handler
traced_type|traced_type
~attach|attachments| an array of attachments
~attach[n].@id|attachments[n].id
~attach[n].mime_type|attachments[n].media_type
~attach[n].filename|attachments[n].filename
~attach[n].description|attachments[n].description
~attach[n].lastmod_time|attachments[n].lastmod_time
~attach[n].byte_count|attachments[n].byte_count
~attach[n].filename|attachments[n].filename
~attach[n].data|attachments[n].data
~attach[n].data.jws|attachments[n].data.jws
~attach[n].data.sha256|attachments[n].data.hash
~attach[n].data.links|attachments[n].data.links
~attach[n].data.base64|attachments[n].data.base64
~attach[n].data.json|attachments[n].data.json
problem_code|body.code| in Problem Report Protocol
comment|body.comment| in Problem Report Protocol



