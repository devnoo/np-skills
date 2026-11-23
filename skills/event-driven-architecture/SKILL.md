---
name: event-driven-architecture
description: Design rules for systems whose parts talk through asynchronous events — event vs command, domain vs integration events, event contracts and versioning, idempotent consumers, ordering, sagas and compensation, broker choice, bounded eventual consistency. Use when designing or reviewing an event flow, choosing a broker, defining an event schema, or debugging duplicates, ordering or consumer lag; also when grill-technical lands a feature on an event boundary. Adapted from dhruvjainin/absolute event-driven-architecture.
---

# event-driven-architecture

Design-level guidance for event-driven systems: services communicate through events on a broker. It covers what an event is, what it promises, who owns it, and how consumers stay correct.

```
 Producer ──event──▶  Broker  ──▶ Consumer A  (idempotent, own read model)
 (owns the            (transport,   Consumer B  (idempotent, own read model)
  contract)            ordering,         │
                       retries, DLQ)     └─▶ DLQ ──▶ alert + manual replay
```

## Key principles

1. **Events are facts, commands are requests.** An event records what already happened — past tense, immutable (`OrderPlaced`). A command asks for something to happen — imperative, can be refused (`PlaceOrder`). Never conflate them; an "event" that tells one consumer what to do next is a command in disguise.
2. **Design for at-least-once delivery.** Every consumer is idempotent. No broker gives exactly-once across all failures.
3. **The producer owns the contract.** Consumers do not dictate event content. The producer publishes a versioned schema; consumers evolve independently against it.
4. **Publish atomically with the state change.** Writing the database and publishing the event as two separate steps loses events on a crash. Name the mechanism in the design (transactional outbox, change-data-capture, or the broker as source of truth) — not "we'll publish after commit".
5. **Bound eventual consistency.** "Eventually" needs a number: e.g. "read model reflects the write within 2 s, p99". Monitor consumer lag against it and alert when it is breached.

## Vocabulary

- **Domain event** — a business fact inside one bounded context. May carry internal detail.
- **Integration event** — crosses a context boundary. Carries only what consumers need, never the producer's full internal state; it is a public contract.
- **Event-carried state transfer** — the event holds enough data that consumers never call back to the producer. Use it selectively: it removes runtime coupling but widens the contract.
- **Saga** — a multi-service business transaction built from local steps, each with a compensating step.
- **Correlation ID / causation ID** — correlation traces the whole business flow; causation points at the event that caused this one.

## Design tasks

### Define an event contract

Every event uses one envelope; only `data` varies per type.

```json
{
  "event_id": "uuid",
  "event_type": "OrderPlaced",
  "schema_version": 1,
  "occurred_at": "2026-03-14T10:00:00Z",
  "subject_id": "uuid",
  "data": { "order_id": "uuid", "customer_id": "uuid", "total": 4999 },
  "metadata": { "correlation_id": "uuid", "causation_id": "uuid" }
}
```

Per event, decide and write down:

- **Name** — past tense, business language, no technical verbs (`OrderPlaced`, not `OrderRowInserted`).
- **Payload** — the minimum consumers need. List the known consumers and what each reads.
- **Subject / partition key** — the entity whose events must stay in order (e.g. the order ID).
- **Owner** — the one producing service.

### Version an event schema

- Additive changes only: new fields are optional with defaults.
- Never rename, retype or remove a field in place. A breaking change is a new `schema_version` or a new event type, published side by side until every consumer has moved.
- Enforce compatibility in CI (schema registry for Avro/Protobuf, or a JSON Schema check).
- Consumers ignore fields they do not know.

### Make consumers idempotent

Pick one per consumer and name it in the design:

- **Natural idempotency** — the operation gives the same result however often it runs. `SET status = 'shipped'` is idempotent; `counter += 1` is not. Prefer this.
- **Deduplication on `event_id`** — record processed IDs in the same transaction as the effect.
- **Version check** — apply only if the event's version is newer than the stored one.

### Decide on ordering

- Order is guaranteed only within one partition/queue, never globally.
- Key by the entity that needs order (e.g. the order ID). Two events for the same entity on different partitions can be processed out of order.
- Cross-entity order needs explicit coordination (a saga, or a version check). If the design assumes global order, it is wrong.

### Design a saga

1. List the steps and the service owning each.
2. **Write the compensating action for every step before the happy path.** A step that cannot be compensated (sending an email, charging a card without refund) goes last.
3. Choose coordination:
   - **Choreography** — services react to each other's events. Loose coupling; the flow is only visible across services. Default for 2–4 steps.
   - **Orchestration** — one coordinator sends commands and tracks state. The flow is readable in one place; the coordinator is a coupling point. Use when the flow branches or has many steps.
4. Draw it:

```
Order ──OrderPlaced──▶ Payment ──PaymentSucceeded──▶ Inventory ──StockReserved──▶ Shipping
  ▲                       │                              │
  └──── PaymentFailed ────┘                              │
        (cancel order)    ◀──── StockUnavailable ────────┘
                                (refund payment)
```

### Choose a broker

Choose the category first, the product second.

| Need | Category | Examples |
|---|---|---|
| Replay, ordering per key, many independent consumer groups | Log-based | Kafka, Redpanda, Pulsar |
| Task distribution, flexible routing, delete-after-ack | Queue-based | RabbitMQ, SQS |
| Fan-out on managed cloud | Managed pub/sub | SNS + SQS, EventBridge, Azure Service Bus |
| Low-latency fire-and-forget pub/sub | Lightweight pub/sub | NATS (JetStream for persistence) |

A broker choice is hard to reverse: record it with the `adr` skill.

### Plan for failure

- A dead-letter queue on every consumer from day one; alert on its depth; reprocessing is a defined, manual step.
- Bounded retries with backoff before dead-lettering. A poison message must never block a partition indefinitely.
- Decide the behaviour when a consumer is down for an hour: catch up from the log, or lose messages? Retention must cover the worst outage you accept.

## Anti-patterns

| Mistake | Why it fails | Instead |
|---|---|---|
| Events used as RPC | Producer now depends on consumer behaviour | Publish the fact; let consumers decide |
| Full internal state in every event | Every internal change breaks all consumers | Minimum payload per known consumer need |
| Publish after commit, separately | Crash between the two loses the event | Outbox or CDC |
| "The broker handles duplicates" | At-least-once is the real guarantee | Idempotent consumer, always |
| Assuming global order | Race conditions across partitions | Key by entity; coordinate across entities explicitly |
| No DLQ | One bad message halts the consumer | DLQ + alert + replay procedure |
| Unbounded "eventual" | No one notices a lag of hours | Written SLA + lag monitoring |

## Output

When this skill shapes a design, the spec or plan gets, per event flow:

- the event catalogue: name, owner, payload, partition key, known consumers
- the flow diagram (ASCII), including compensations
- the idempotency strategy per consumer
- the consistency bound and how lag is monitored
- ADRs for broker choice and choreography-vs-orchestration, via the `adr` skill

In the np-skills chain this runs inside `grill-technical`: the event catalogue is the contract section of the spec's How.
