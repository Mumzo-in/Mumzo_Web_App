# Mumzo — Notification System Architecture

Production notification pipeline: Redis-backed queue, adapter-based channel
delivery (FCM + Web Push in v1, email/SMS scaffolded), code-defined templates.
This is a **design doc** — nothing here is implemented yet.

- **Queue** → BullMQ (Redis)
- **Package** → `packages/notifications` (`@mumzo/notifications`)
- **Worker** → in-process with `apps/server`, same Bun process as the API
- **Channels v1** → `fcm`, `web-push` (real adapters) · `email`, `sms` (interface stub only)
- **Audiences** → `customer` (`user_device`) and `staff` (`staff_device`) — see [realtime-architecture.md](./realtime-architecture.md) for how staff push relates to the WebSocket live feed

---

## 1. System architecture

```mermaid
flowchart TB
    subgraph Producers["Trigger sources"]
        Orders["orders module\n(status change)"]
        Coupons["coupons / marketing"]
        Admin["admin broadcast"]
    end

    subgraph API["apps/server (Hono, single Bun process)"]
        NotifyAPI["notify.send()\n@mumzo/notifications"]
        DevicesEP["/v1/devices\nregister / unregister token"]
        Worker["BullMQ Worker\n(in-process)"]
    end

    subgraph Redis["Redis"]
        Queue["BullMQ Queue\nnotifications"]
        DLQ["Dead-letter\n(failed, retries exhausted)"]
    end

    subgraph Core["@mumzo/notifications core"]
        Templates["Template registry\n(code-defined, Zod-validated)"]
        Dispatcher["Dispatcher\nresolve channel(s) -> adapter"]
    end

    subgraph Adapters["Channel adapters"]
        FCM["FCM adapter\n(firebase-admin)"]
        WebPush["Web Push adapter\n(web-push, VAPID)"]
        Email["Email adapter\n(stub, throws NotImplemented)"]
        SMS["SMS adapter\n(stub, throws NotImplemented)"]
    end

    subgraph DB["Postgres"]
        UserDevices[("user_devices")]
        NotifLog[("notification_log")]
    end

    subgraph External["External providers"]
        FCMSvc["Firebase Cloud Messaging"]
        PushSvc["Browser Push Service\n(Chrome/Mozilla/etc.)"]
    end

    Orders --> NotifyAPI
    Coupons --> NotifyAPI
    Admin --> NotifyAPI
    NotifyAPI -->|enqueue job| Queue
    Queue -->|consume| Worker
    Worker --> Dispatcher
    Dispatcher --> Templates
    Dispatcher -->|lookup active tokens| UserDevices
    Dispatcher --> FCM
    Dispatcher --> WebPush
    Dispatcher -.-> Email
    Dispatcher -.-> SMS
    FCM --> FCMSvc
    WebPush --> PushSvc
    FCM -->|log result| NotifLog
    WebPush -->|log result| NotifLog
    Worker -->|retries exhausted| DLQ

    DevicesEP -->|upsert / deactivate| UserDevices

    classDef stub stroke-dasharray: 5 5,opacity:0.6
    class Email,SMS stub
```

---

## 2. Send flow (happy path)

```mermaid
sequenceDiagram
    participant Mod as Server module<br/>(e.g. orders)
    participant Notify as notify.send()
    participant Q as BullMQ Queue (Redis)
    participant W as Worker (in-process)
    participant Tpl as Template registry
    participant DB as Postgres
    participant Adp as Channel adapter
    participant Ext as FCM / Push service

    Mod->>Notify: send({ userId, templateId, data })
    Notify->>Tpl: validate data against template schema
    Notify->>Q: enqueue job (non-blocking)
    Notify-->>Mod: returns immediately

    Q->>W: deliver job
    W->>Tpl: render(data) -> title, body, deeplink
    W->>DB: SELECT active devices for userId
    DB-->>W: [{channel: fcm, token}, {channel: web-push, token}]

    loop per active device
        W->>Adp: send(rendered, device)
        Adp->>Ext: provider API call
        Ext-->>Adp: message id / error
        Adp->>DB: INSERT notification_log (status, providerMessageId | error)
    end

    alt provider reports invalid/expired token
        Adp->>DB: UPDATE user_devices SET is_active = false
    end
```

---

## 3. Failure & retry flow

```mermaid
flowchart LR
    Job["Job picked up\nby worker"] --> Send["adapter send"]
    Send -->|success| LogOK["notification_log:\nstatus = sent"]
    Send -->|"transient error - network, 5xx, rate limit"| Retry{"Attempts under max"}
    Retry -->|yes| Backoff["BullMQ exponential\nbackoff, re-queue"]
    Backoff --> Send
    Retry -->|no| DLQ["Dead-letter queue\nnotification_log: status = failed"]
    Send -->|"permanent error - invalid or unregistered token"| Deactivate["user_devices:\nis_active = false"]
    Deactivate --> LogFail["notification_log:\nstatus = failed"]
```

---

## 4. Device registration flow

```mermaid
sequenceDiagram
    participant Client as Platform app / web (PWA)
    participant API as POST /v1/devices
    participant DB as Postgres

    Client->>Client: request permission (FCM token / PushSubscription)
    Client->>API: { channel, token, platform }
    API->>DB: upsert user_devices\n(unique on userId+channel+token)
    DB-->>API: device row
    API-->>Client: 200 OK

    Note over Client,API: On logout
    Client->>API: DELETE /v1/devices/:id
    API->>DB: is_active = false
```

---

## 5. ER diagram

```mermaid
erDiagram
    USER ||--o{ USER_DEVICES : registers
    USER ||--o{ NOTIFICATION_LOG : receives

    USER_DEVICES {
        uuid id PK
        text user_id FK
        text channel "fcm | web-push"
        text token "FCM token or PushSubscription JSON"
        text platform "ios | android | web"
        boolean is_active
        timestamp last_seen_at
        timestamp created_at
    }

    NOTIFICATION_LOG {
        uuid id PK
        text user_id FK
        text template_id
        text channel
        text status "queued | sent | failed"
        text provider_message_id
        text error
        timestamp created_at
    }
```

`notification_templates` is **not** a table in v1 — templates are code-defined
in `packages/notifications/src/templates/*.ts` (type-safe, Zod-validated,
deployed with the app). Revisit as a DB table only if marketing needs
self-serve editing without a deploy.

---

## 6. Adapter interface

Every channel implements the same contract — adding a channel later means a
new folder under `channels/` plus a registration line, nothing else changes.

```mermaid
classDiagram
    class ChannelAdapter {
        <<interface>>
        +channel: "fcm" | "web-push" | "email" | "sms"
        +send(payload, target) Promise~SendResult~
    }
    class FcmAdapter
    class WebPushAdapter
    class EmailAdapter {
        <<stub - NotImplementedError>>
    }
    class SmsAdapter {
        <<stub - NotImplementedError>>
    }
    ChannelAdapter <|.. FcmAdapter
    ChannelAdapter <|.. WebPushAdapter
    ChannelAdapter <|.. EmailAdapter
    ChannelAdapter <|.. SmsAdapter
```

---

## 7. Infra additions

| Component | Change |
|---|---|
| `infra/docker-compose.yml` | new `redis` service (redis:7-alpine), same healthcheck pattern as `postgres` |
| `packages/env` | `REDIS_URL`, FCM service-account creds, `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` |
| `apps/server` deps | `bullmq`, `ioredis`, `firebase-admin`, `web-push` |
| `apps/server/src/index.ts` | starts BullMQ `Worker` alongside Hono on boot; graceful shutdown on SIGTERM alongside the DB pool |
| `packages/db/src/schema/notifications.ts` | `user_devices`, `notification_log` |
| `apps/server/src/modules/platform/v1/devices` | new module: register/unregister device tokens |

---

## 8. Open items for a later revision

- Web Push VAPID key generation + service worker wiring on `apps/platform`.
- Per-user notification preferences (opt-in/out per category) — not in v1.
- Bull Board (or similar) for queue observability.
- Broadcast/segment recipient resolver for admin marketing sends.
