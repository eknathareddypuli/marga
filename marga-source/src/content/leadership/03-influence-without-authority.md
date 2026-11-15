---
title: Influence without authority
minutes: 12
summary: Get cross team work done without managing anyone, by building trust, aligning on goals, using data and making the right thing the easy thing.
---

Platform and SRE engineers ask other teams to change things they do not control. Influence comes from trust, shared goals and lowering the cost of saying yes.

## What you will learn

- Start with their goals
- Trust through small kept promises
- Evidence and a clear ask
- Making the right thing the easy thing
- Escalating without damaging relationships

## Start with their goals

A team that is behind on a deadline will not welcome a request to upgrade a library. Learn their priorities and show how your request helps them, for example fewer pages at night or a faster release. If it does not help them, say so and agree on timing.

## Trust

Do small things you said you would do, answer promptly and share credit. Trust is built over months and lost in one broken promise. Be the person who brings a draft pull request, not only a request.

## Evidence and ask

Use data from their own systems: error rates, cost, incident counts. Make a specific ask with an owner and a date, and state the cost of doing nothing. A vague complaint produces a vague reply.

## Easy defaults

Provide templates, libraries, pipelines and automation so the secure or reliable path takes less effort than any other. Offer to do the first migration with them. Adoption follows convenience more than mandates.

## Escalation

Escalate only after a direct conversation, and tell the other person first. Present the problem and options to the shared manager, not the person. Accept that sometimes the answer is not now and plan for it.

```diagram
title: Influence without authority
node: goal | Their goals | 0 | 1 | Learn priorities. | Ignoring them. | external
node: trust | Trust | 1 | 1 | Kept promises. | Broken promise. | process
node: ask | Clear ask with data | 2 | 1 | Owner and date. | Vague complaint. | process
node: easy | Easy default | 3 | 1 | Template or tool. | Mandate only. | service
edge: goal | trust
edge: trust | ask
edge: ask | easy
```

## Incident: The mandate that nobody followed

> **Incident:** A platform team announced that all services must adopt a new logging library by quarter end.

```console
$ grep -rl "legacy-logger" services | wc -l
87
$ grep -rl "new-logger" services | wc -l
4
(this is a simulated illustration, not a real incident)
```

Teams had no time and no help, so most ignored the mandate. The platform team then offered pull requests that did the migration for ten services, a codemod for the rest and a dashboard that showed adoption by team. Within two months eighty percent had moved.

## Common mistakes

- Mandates with no help
- Complaining without data
- Escalating before talking
- Breaking small promises
- Ignoring the other team priorities

```quiz
Q: What should you learn first?
+ The other team goals
- Their salary :: Irrelevant.
- Their code style :: Not first.
- Their holiday :: Irrelevant.
> Align your ask.

Q: What makes adoption likely?
+ Making the right path the easy path
- A louder email :: Does not help.
- A deadline only :: Weak.
- A new meeting :: Weak.
> Offer tools and help.

Q: What should an ask include?
+ Owner, date and the cost of doing nothing
- Blame :: Harms trust.
- A long story :: Unclear.
- Jargon :: Unclear.
> Be specific. Review the matching section of this lesson if it is unclear.

Q: When do you escalate?
+ After a direct conversation, with options
- Immediately :: Harms trust.
- Never :: May stall.
- Publicly :: Harms trust.
> Tell the person first.
```

```cards
Influence :: The ability to change what others do without authority
Default :: The option people get when they do nothing
Codemod :: A script that changes code automatically
Escalation :: Raising a problem to a higher level
```
