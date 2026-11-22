---
title: Billing data, tags, allocation and the FOCUS format
minutes: 13
summary: Read the raw billing exports, design tags and account structure that allocate cost to owners, handle shared costs fairly and understand the FOCUS open cost format.
---

Good decisions need good data. The cloud invoice is a summary, and the detailed export is where cost becomes explainable. This lesson covers what is in that export and how to make every line belong to someone.

## What you will learn

- What the detailed billing exports contain
- Tag and label design that survives reality
- Allocating by account, project and namespace
- Splitting shared costs such as networking and support
- The FOCUS format for comparing clouds

## The exports

AWS provides the Cost and Usage Report, Azure provides cost exports from Cost Management and Google Cloud provides a billing export to BigQuery. Each row is a usage record with a time, a service, a usage amount, a price and the identifiers of the resource. Load them into a warehouse so that you can query them with SQL and keep history longer than the console does.

## Tags and labels

Pick a small required set: owner team, service name, environment and cost centre. Enforce them at creation time with policy or infrastructure code, because tags added later by hand are always incomplete. Keep values from a controlled list, since team names spelled three ways make three owners. Note that some costs cannot be tagged, such as parts of data transfer.

## Allocation structure

The most reliable allocation is structural. A separate account, subscription or project per team and environment makes the bill owner obvious without any tags. Inside Kubernetes, allocate by namespace and label, using the requests of each workload. Use tags to refine and structure to guarantee.

## Shared costs

Some costs belong to everyone: networking hubs, logging, security tools, support plans and the platform team itself. Choose a rule and publish it, such as splitting in proportion to each team direct spend or to usage of the shared service. A simple, stable rule that people understand beats a perfect one that nobody trusts.

## The FOCUS format

FOCUS is an open specification that defines common column names and meanings for billing data from different providers, such as BilledCost, EffectiveCost and ResourceId. Using it makes multi cloud reports and tooling easier, because a query does not have to be rewritten for each provider.

```diagram
title: Billing data, tags, allocation and the FOCUS format
node: exp | Billing export | 0 | 1 | Line items. | Missing fields. | store
node: wh | Warehouse | 1 | 1 | SQL and history. | Late data. | store
node: alloc | Allocation rules | 2 | 1 | Tags and accounts. | Untagged. | process
node: rep | Team reports | 3 | 1 | Cost by owner. | Distrusted. | observe
edge: exp | wh
edge: wh | alloc
edge: alloc | rep
```

## Incident: Forty percent of cost with no owner

> **Incident:** A finance review found that almost half of the monthly cost had no owner tag.

```console
$ aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY --metrics UnblendedCost --group-by Type=TAG,Key=owner
owner$              52000
owner$platform      21000
owner$search        14000
(this is a simulated illustration, not a real incident)
```

The first row is cost with an empty owner tag, and it was the largest line. Resources created by older scripts and by hand had no tags, and the tag policy only covered new resources of some types. The team added a policy that blocks creation without the required tags, a weekly report of untagged spend by account and a clean up sprint, and the unowned share fell to seven percent in two months.

## Common mistakes

- Optional tags that nobody enforces
- Free text tag values with many spellings
- Allocating shared cost with a rule nobody understands
- Only using the console and not the export
- Assuming every cost can be tagged

```quiz
Q: Where is the most reliable allocation?
+ In the account or project structure
- In free text notes :: Unreliable.
- In emails :: No.
- In screenshots :: No.
> Structure needs no tags.

Q: When should tags be enforced?
+ At resource creation by policy or code
- Once a year :: Too late.
- Never :: Leaves cost unowned.
- Only for databases :: Too narrow.
> Late manual tagging is incomplete.

Q: What does FOCUS provide?
+ A common schema for billing data across providers
- A discount :: No.
- A cloud region :: No.
- A security scanner :: No.
> It simplifies multi cloud reports.

Q: How should shared costs be split?
+ With a simple published rule such as proportional share
- Randomly :: Not fair.
- Hide them :: Distrust grows.
- Charge one team :: Unfair.
> Trust needs clear rules.
```

```cards
Cost and Usage Report :: The detailed AWS billing export
Tag policy :: A rule that requires tags on resources
Shared cost :: A cost that benefits many teams
FOCUS :: An open specification for billing data columns
```
