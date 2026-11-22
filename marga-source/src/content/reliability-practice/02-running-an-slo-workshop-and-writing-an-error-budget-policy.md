---
title: Running an SLO workshop and writing an error budget policy
minutes: 13
summary: Facilitate a workshop that ends with agreed SLOs and a written policy for what happens when the error budget is low, so that reliability and feature work trade openly.
---

An SLO that nobody agreed to and no policy that says what to do about it is only a chart. The workshop and the policy turn numbers into decisions.

## What you will learn

- Who must be in the room
- Workshop steps from journeys to targets
- Choosing a target from history and need
- Writing the error budget policy
- Reviewing and changing SLOs

## Who is in the room

Include the product owner who knows what matters to users, engineers who know how the service fails, the on call lead and a stakeholder who can accept trade offs. Without the product owner the targets are technical, and without an engineer they are fantasy. Keep the group small and send the data in advance.

## Workshop steps

List the critical user journeys. For each, write what broken looks like. Propose indicators and check that data exists. Look at the last quarter of measurements to see what was achieved. Draft a target and a window, then discuss what a miss would cost the users and the business. End with owners and a date for the first review.

## Choosing a target

Start from what users need and what the service has achieved, and not from a round number. Ninety nine point nine percent allows about forty three minutes of failure in a month, while ninety nine point ninety nine allows about four. Each extra nine costs more and slows change. A dependency with a lower target limits what you can promise.

## The policy

Write down what happens when the budget is spent. For example: when more than half is used, review risky changes; when it is used up, pause non critical releases and work on reliability until it recovers; if one incident used most of it, require a post incident review with actions. Get product and engineering leaders to sign it, so that it is applied without a debate each time.

## Review

Review SLOs every quarter. Tighten if users are unhappy despite meeting the target, relax if the target is costly and users do not notice. Record the changes with the reason. Retire SLOs that nobody uses. The policy should have exceptions that are named, such as security fixes, so that it is not ignored in an emergency.

```diagram
title: Running an SLO workshop and writing an error budget policy
node: wk | Workshop | 0 | 1 | Journeys and data. | No product owner. | process
node: tgt | Targets | 1 | 1 | From history and need. | Round number. | process
node: pol | Budget policy | 2 | 1 | Signed rules. | Ignored. | security
node: rev | Quarterly review | 3 | 1 | Tighten or relax. | Skipped. | observe
edge: wk | tgt
edge: tgt | pol
edge: pol | rev
```

## Incident: The SLO that nobody could use

> **Incident:** A team met its SLO every month, but release pressure continued and reliability work never got time.

```console
$ cat slo-policy.md | head -3
# Error budget policy
Status: draft, not yet approved
Owner: unassigned
(this is a simulated illustration, not a real incident)
```

The SLO existed but the policy had never been approved, so a low budget changed nothing. When a major incident used most of the budget, the next release went ahead anyway. The team ran a workshop with the product owner, wrote a short policy with clear triggers, got it signed by the engineering and product directors, and applied it in the next quarter when the budget fell below half.

## Common mistakes

- No product owner in the workshop
- A target chosen as a round number
- A policy that is never approved
- Adding nines without cost analysis
- Never reviewing the SLOs

```quiz
Q: Why include the product owner?
+ They know which journeys matter to users
- They write code :: Not their role.
- They manage servers :: No.
- They audit logs :: No.
> Targets must reflect user needs.

Q: What does a policy add to an SLO?
+ Agreed actions when the budget is low
- More dashboards :: No.
- More servers :: No.
- Less logging :: No.
> It turns data into decisions.

Q: How much downtime does 99.9 percent allow per month?
+ About 43 minutes
- About 4 minutes :: That is 99.99.
- About 7 hours :: Too large.
- None :: Not allowed.
> Each extra nine cuts it tenfold.

Q: How often should SLOs be reviewed?
+ Regularly, for example every quarter
- Never :: They go stale.
- Only after outages :: Too late.
- Every minute :: Too often.
> Adjust with evidence.
```

```cards
Error budget :: The allowed amount of failure in a window
Error budget policy :: Agreed actions based on budget use
Window :: The period over which an SLO is measured
Nine :: A step of 99 percent in a target
```
