Notification System — Step-by-Step Build Order

Part A — Make the DB safe first (no external setup needed)
Raise DATABASE_POOL_MAX in packages/env/src/server.ts and lower worker concurrency — right now 10 connections are shared by the API and the worker, so a notification burst starves checkout.
Batch the notification_log INSERTs in dispatcher.ts — one multi-row insert per job instead of one per device.
Bulk-insert in sendToAllStaff (notify.ts) — replace the N sequential enqueues with a single call.
Add LIMIT + chunked draining to the referrals and reviews sweeps so a backlog can't become an unbounded serial crawl.

Part B — Replace BullMQ with a Postgres queue (kills the ~$30/mo Redis)
Add the notification_job table to packages/db/src/schema/notifications.ts with a partial index on (status, run_after) WHERE status='pending'.
Add a pg_notify trigger that fires on job insert.
Generate and run the Drizzle migration.
Write the atomic claim query using FOR UPDATE SKIP LOCKED so two workers never grab the same job.
Write complete() and fail() with exponential backoff — keeping your current 5-attempt / 5s policy, flipping to dead at max attempts.
Rewrite queue.ts to INSERT a row instead of queue.add() — notify.send()'s signature stays identical, so no call sites change.
Rewrite worker.ts: LISTEN on a dedicated pg client (outside the pool), plus a poll fallback every ~5s — NOTIFY silently drops when nothing is listening, and can't handle delayed retries.
Add graceful shutdown so in-flight jobs finish.
Write a throwaway test script: race two workers, assert no double-processing, correct backoff, correct DLQ transition.
Delete redis.ts and drop bullmq + ioredis from package.json.

Part C — DLQ and retry tooling
Add retryJob(id) and retryDeadJobs(templateId?).
Add a retention sweep — delete completed jobs >7d, dead >30d.
Replace the bare console.error in the worker with structured failure logging.

Part D — Get FCM actually delivering (⚠️ needs you)
You: create the Firebase project, generate VAPID keys, give me the FCM_* credentials. I can't do this one — everything below is blocked on it.
Add the client-side Firebase env schema to packages/env/src/web.ts (currently has no VITE_ vars).
Install the firebase client SDK in apps/admin.
Add firebase-messaging-sw.js to apps/admin/public/ (FCM requires that exact filename at the origin root).
Build the token-acquisition module and wire it into the existing NotificationPermissionCard — it already asks permission but never gets a token.
Call POST /devices on token acquire. This is the moment the system delivers its first real notification.
Handle onTokenRefresh re-registration.
Handle onMessage for foreground notifications — and dedupe against the existing realtime toast, since both fire for order.created.
Deactivate the device on logout.

Part E — Harden the FCM server side
Expand FCM error classification — today only 2 codes are treated as permanent; add the rest and make 429/unavailable explicitly retryable.
Add sendEach() multicast (500 tokens/call). Not for quota — FCM allows 600k/min vs your 0.116/sec. This is purely to cut HTTP overhead on broadcasts.
Map per-token multicast results back to the right device rows for deactivation.
Add platform options — android.priority=high, APNs headers, webpush.fcmOptions.link for deeplinks.
Add collapse keys so rapid order-status hops don't stack 5 notifications.

Part F — Support address-based channels (unblocks all WhatsApp)
Split ChannelAdapter into device-targeted and address-targeted — this also removes the as "fcm" | "web-push" cast currently lying to the type system.
Make the dispatcher resolve recipients per channel: device rows for FCM/web-push, user.phoneNumber for WhatsApp/SMS.
Widen TemplateDefinition so WhatsApp can return {templateName, languageCode, components} instead of {title, body}.

Part G — WhatsApp via Kapso
You: author and submit the Meta templates (order confirmation, order status, OTP) for approval. Start this early — external approval lead time. Use utility category for order updates; it's cheaper than marketing.
Install @kapso/whatsapp-cloud-api, add KAPSO_API_KEY and WHATSAPP_PHONE_NUMBER_ID env vars.
Build the shared Kapso client singleton (used by both the queue and the OTP path).
Build the WhatsApp channel adapter.
Add error classification — invalid number is permanent; 429, 409 in-flight, and 5xx retry.
Map your existing templates to their approved WhatsApp renders.

Part H — WhatsApp delivery status
Index notification_log.providerMessageId (currently unindexed).
Add the POST /webhooks/whatsapp endpoint.
Add signature verification using Kapso's verifySignature().
Process status callbacks into the log via normalizeWebhook() — without this, you record "sent" for messages Meta actually rejected.

Part I — WhatsApp OTP (deliberately not queued)
Build the synchronous OTP send path — direct call, no queue, errors propagate to the caller. It's user-blocking, sub-3-second, and non-retryable, so the queue model doesn't fit.
Wire it to Better Auth's phone-number plugin. Note: the better-auth MCP server failed to connect this session, so I'll verify its current API first.
Add Postgres-backed OTP rate limiting (avoids reintroducing Redis just for this).

Part J — Storefront push
Fix apps/platform/src/main.tsx:12-18, which unregisters every service worker on boot — web push is impossible on the storefront until this changes.
Decide FCM-web vs raw web-push for the PWA (raw avoids shipping the Firebase client bundle).
Add the service worker with push and notificationclick handlers.
Subscribe and call POST /devices from the platform app.
Route deeplinks on notification tap — adapters already send deeplink, nothing consumes it yet.
Replace the mock notification feed (notifications.tsx renders seedNotifications) with a real in-app feed endpoint.
Add notification preferences — there's a settings page but no opt-out column and no dispatcher check, so everyone currently gets everything.

Part K — Broadcasts and scale
Build the fan-out parent job — paginates recipients and bulk-inserts children in ~1k chunks, never 100k inserts from a request handler.
Add priority lanes so marketing blasts never delay order notifications.
You: confirm your WhatsApp number's messaging tier. Meta caps unverified numbers at 1,000 unique recipients/24h — if you're at that tier, 10k/day is unreachable on WhatsApp no matter what we build.
Enforce a WhatsApp daily-recipient cap that degrades gracefully instead of burning retries against a hard limit.
Build POST /admin/notifications/broadcast and replace the ComingSoon placeholder in the admin UI.

Four steps need you, not me: 18 (Firebase credentials), 35 (Meta template approval), 57 (messaging tier). Steps 18 and 35 have lead time — kick both off now, since steps 1–17 don't depend on them.

Milestone to watch: step 23. That's when the system stops delivering to zero recipients. Everything before it is groundwork; everything after is coverage.

Want me to start at step 1?



<-- GET /api/v1/reviews/pending
--> GET /api/v1/reviews/pending 200 3s
<-- GET /api/v1/reviews/pending
--> GET /api/v1/reviews/pending 200 2s

there is this review, it shall be triggered via fcm


