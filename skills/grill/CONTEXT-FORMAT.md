# CONTEXT.md format

`CONTEXT.md` is the project's domain glossary — an opinionated dictionary of the terms this codebase commits to. It is *not* a spec, a scratchpad, or a home for decisions. One job: name things precisely and pick one word per concept. Grill maintains it inline (see `SKILL.md` → *Domain language*).

## Structure

```md
# {Context name}

{One or two sentences: what this context is and why it exists.}

## Language

**Order**:
A confirmed request from a Customer for one or more items.
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a Customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places Orders.
_Avoid_: Client, buyer, account
```

## Rules

- **Be opinionated.** When several words mean the same thing, pick the best one and list the rest under `_Avoid_`. The point of a glossary is to *eliminate* synonyms, not catalogue them.
- **Define what it IS, not what it does.** One or two sentences, max.
- **Only context-specific terms.** General programming concepts (timeout, retry, cache) don't belong, however heavily the project uses them. Ask: is this unique to *this* domain, or generic? Only the former.
- **Group under subheadings** when natural clusters emerge; a flat list is fine when the terms cohere.
- **No implementation detail.** No class names, table names, HTTP verbs, or field types. A stakeholder who can't code should be able to read it.

## Single vs. multi-context repos

**Single context (most repos):** one `CONTEXT.md` at the repo root.

**Multiple contexts:** a `CONTEXT-MAP.md` at the root lists the contexts, where each lives, and how they relate. Each context then keeps its own `CONTEXT.md` beside its code.

```md
# Context map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) — generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md) — manages warehouse picking and shipping

## Relationships

- **Ordering → Fulfillment**: Ordering emits `OrderPlaced`; Fulfillment consumes it to start picking.
- **Fulfillment → Billing**: Fulfillment emits `ShipmentDispatched`; Billing consumes it to invoice.
- **Ordering ↔ Billing**: share `CustomerId` and `Money`.
```

Infer which structure applies: if `CONTEXT-MAP.md` exists, read it to find the contexts; if only a root `CONTEXT.md` exists, it's a single context; if neither exists, create a root `CONTEXT.md` lazily when the first term resolves. When multiple contexts exist and it's unclear which the current topic belongs to, ask.

---

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills) grill-with-docs (`CONTEXT-FORMAT.md`).
