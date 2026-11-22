---
title: Data quality, contracts and lineage
minutes: 12
summary: Keep data trustworthy with tests on freshness, volume and schema, producer contracts, lineage to find the blast radius, and alerts that reach the right owner.
---

Pipelines that run are not the same as data that is right. Quality checks, contracts and lineage make bad data visible before an executive reads it.

## What you will learn

- What to test: freshness, volume, schema and values
- Data contracts between producers and consumers
- Lineage and the blast radius of a change
- Where to run checks and what to do on failure
- Ownership and alerts

## What to test

Freshness asks whether the table was updated on time. Volume asks whether the row count is within the normal range. Schema checks catch new, removed or retyped columns. Value checks cover nulls, duplicates, ranges and referential integrity. Start with a few high value checks on critical tables.

## Contracts

A data contract is an agreement between the team that produces a dataset and the teams that use it. It states the schema, meaning of fields, freshness promise and how breaking changes are announced. Checking the contract in the producer pipeline stops a renamed column from reaching consumers.

## Lineage

Lineage records which datasets and jobs feed which others, for example with OpenLineage. When a source breaks, lineage tells you which dashboards and models are affected. Before changing a column it tells you who to warn.

## Where checks run

Run checks at ingestion to reject or quarantine bad input, and after transformations to protect curated tables. On failure a pipeline can stop, quarantine the bad rows or publish with a warning, depending on how critical the table is. Decide this in advance for each table.

## Ownership and alerts

Every important dataset has an owner and a channel. An alert that says only that a test failed is not enough: include the table, the failing check, recent values and a link to the runbook. Track the time to detect and the time to fix bad data.

```diagram
title: Data quality, contracts and lineage
node: prod | Producer | 0 | 1 | Owns the contract. | Silent change. | external
node: chk | Quality checks | 1 | 1 | Freshness, volume, schema. | Too few checks. | observe
node: lin | Lineage | 2 | 1 | Finds consumers. | Missing. | store
node: own | Owner alert | 3 | 1 | Right person. | Nobody. | service
edge: prod | chk
edge: chk | lin
edge: lin | own
```

## Incident: A renamed column that broke the revenue report

> **Incident:** A producer renamed a column and the finance dashboard showed zeros.

```console
$ python -c "print('null share of revenue_usd: 100 percent')"
null share of revenue_usd: 100 percent
$ echo "owner of finance.daily_revenue: unknown"
(this is a simulated illustration, not a real incident)
```

A source team renamed amount to revenue_usd, the transformation selected the old name and filled it with nulls, and no check noticed. After the incident the team added a schema contract check in the producer pipeline, a null share test on the finance table and lineage so the producer could see which reports depended on the column.

## Common mistakes

- Testing nothing until a user complains
- Silent schema changes by producers
- No owner for important tables
- Alerts without context
- Treating every check as a hard stop

```quiz
Q: What does a freshness check ask?
+ Was the table updated on time?
- Is it large? :: That is volume.
- Is it encrypted? :: No.
- Is it cheap? :: No.
> Late data is wrong data.

Q: What is a data contract?
+ An agreement on schema and meaning between producer and consumers
- A legal NDA :: Not the meaning.
- A backup :: No.
- A cache :: No.
> It makes breaking changes visible.

Q: What does lineage give you?
+ The datasets and reports affected by a change
- Faster queries :: No.
- Smaller tables :: No.
- Encryption keys :: No.
> The blast radius.

Q: What should a quality alert include?
+ Table, failing check, recent values and a runbook link
- Only a red flag :: Not helpful.
- Only the job name :: Not helpful.
- Nothing :: Unhelpful.
> Context shortens the fix.
```

```cards
Data contract :: An agreed schema and promise between teams
Lineage :: The flow of data between datasets and jobs
Freshness :: How recently a dataset was updated
Quarantine :: Holding bad records aside
```
