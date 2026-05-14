# User Journeys: Notification Service

**Branch**: `014-notification-service`
**Date**: 2026-05-13
**Status**: Bootstrapped from [product-spec.md](./product-spec.md)

---

## Journey A — A producer publishes an in-app notification

**Actor**: Producer service
**Goal**: Notify one or more recipients without knowing the active client transport.

1. A producer detects a domain event that should be surfaced to users.
2. The producer calls the notification publish API with recipient descriptor, message type, payload, and idempotency key.
3. The notification service validates the contract and stores the message.
4. The service attempts live delivery for currently connected recipients.
5. Offline recipients can retrieve the message later through the replay/pull surface.
6. Delivery status and failures are observable by operations.

**Success evidence**: producers do not select transport details; idempotent retries do not duplicate messages; recipient authorization is enforced server-side.

---

## Journey B — A user receives a food backfill completion notification

**Persona**: P4 Sam / nutrition and food-data consumer
**Goal**: Know when a previously pending food lookup is ready.

1. Feature 003 completes a food backfill job.
2. Feature 003 publishes a `food.backfill.completed` message to affected requester recipients.
3. Sam's active client receives the message.
4. The client dispatches behavior based on `messageType`.
5. Sam opens the notification and lands on the relevant food or nutrition context.

**Success evidence**: multiple requesters can be notified; the message deep-links to the correct context; stale or unauthorized recipients do not receive data.

---

## Journey C — Operations sends a global broadcast

**Actor**: Operations engineer
**Goal**: Send maintenance or incident messaging without adding feature-specific code.

1. Operations authenticates through approved admin tooling.
2. Operations publishes a `global` recipient notification with a constrained message type.
3. The service validates authorization and records the broadcast.
4. Connected clients receive the message; disconnected clients retrieve it later if still relevant.
5. Operations monitors delivery volume and error rates.

**Success evidence**: global broadcast permissions are restricted; broadcasts are auditable; expired messages are not shown after their relevance window.
