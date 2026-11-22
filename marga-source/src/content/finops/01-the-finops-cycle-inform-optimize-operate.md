---
title: The FinOps cycle: inform, optimize, operate
minutes: 12
summary: Learn how FinOps turns cloud spend into a shared engineering topic: the three phases, who does what, and why unit costs matter more than the total bill.
---

Cloud makes spending a daily engineering decision. Every instance type, replica count and retention setting is a small purchase. FinOps is the habit of making those purchases visible, deliberate and shared between engineering, finance and product.

## What you will learn

- The three phases: inform, optimize and operate
- The people involved and what each owns
- Unit economics: cost per request, per customer, per build
- Maturity: crawl, walk and run
- Why cost is a reliability and design topic too

## The three phases

Inform means everyone can see what is being spent and by whom. Optimize means acting on that data by removing waste, choosing better prices and improving the design. Operate means turning the work into routines, budgets and reviews. The cycle repeats, because new services and new price lists keep arriving.

## Who does what

Engineers decide how much is used, because they choose sizes, counts and architecture. Finance forecasts and reports. A central FinOps or platform group supplies data, tooling and training. Product owners decide what is worth paying for. Nobody can fix cost alone, so the first job is agreeing who can act on each line of the bill.

## Unit economics

A bill that grows by twenty percent is good news if traffic grew by fifty percent and bad news if traffic was flat. Divide cost by something the business understands, such as cost per thousand requests, per active customer or per pipeline run. Track the unit cost over time, and a team can see whether it is becoming more efficient.

## Maturity

At crawl, teams have tags on some resources and a monthly report. At walk, allocation is mostly complete, budgets exist and teams receive their own numbers weekly. At run, cost is part of design reviews, anomalies are alerted on within a day and unit cost targets are set per service. Do not try to jump to run in one quarter.

## Cost as a design property

Cost, latency and reliability trade against each other. A multi region database costs more and fails less often. A larger cache costs more and saves compute. Write the cost next to the other design numbers in the review, so the trade is made on purpose and not discovered on an invoice.

```diagram
title: The FinOps cycle: inform, optimize, operate
node: use | Engineering decisions | 0 | 1 | Sizes, counts, retention. | Made blind. | process
node: data | Billing data | 1 | 1 | Cost by owner. | Unallocated. | store
node: act | Optimize and operate | 2 | 1 | Savings and budgets. | No follow up. | process
node: unit | Unit cost | 3 | 1 | Cost per unit of value. | Ignored. | observe
edge: use | data
edge: data | act
edge: act | unit
```

## Incident: A bill that nobody could explain

> **Incident:** The monthly cloud bill rose by thirty percent and finance asked engineering for the reason.

```console
$ aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
EC2 - Other        41000
Amazon S3          18500
Data Transfer       9200
(this is a simulated illustration, not a real incident)
```

The increase was real, but no one owned the largest lines and nothing linked cost to traffic, so the discussion lasted two weeks. Once the team reported cost per thousand requests next to the bill, they saw that traffic had grown faster than cost, and the real problem was one test environment that had been left running. They then agreed owners for each service line and a weekly review.

## Common mistakes

- Looking only at the total bill
- Treating FinOps as a finance project only
- Cutting cost without checking reliability
- Starting with tools before agreeing owners
- Reporting once a quarter instead of weekly

```quiz
Q: What does the inform phase provide?
+ Visible and allocated cost data for everyone
- Automatic savings :: That comes later.
- A new contract :: Not the aim.
- Fewer engineers :: No.
> You cannot act on data you cannot see.

Q: Why track cost per unit?
+ It shows whether the service is becoming more or less efficient
- It lowers the bill by itself :: It only measures.
- It replaces budgets :: They work together.
- It hides growth :: The opposite.
> Unit cost separates growth from waste.

Q: Who decides how much is used?
+ Engineering teams that choose sizes and design
- Only finance :: They do not choose sizes.
- Only the cloud vendor :: No.
- The auditor :: No.
> The people who can change usage must see the cost.

Q: What is a sensible first goal at crawl maturity?
+ Allocate most cost to an owner and report it weekly
- Reach run maturity in a month :: Unrealistic.
- Buy every commitment :: Too early.
- Delete untagged items :: Risky.
> Start with visibility and ownership.
```

```cards
FinOps :: Making cloud spend visible, owned and optimised together
Unit cost :: Cost divided by a business measure such as requests
Allocation :: Assigning each cost to an owner
Maturity :: How routine and complete cost practices are
```
