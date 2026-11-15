---
title: Senior and staff scope and career growth
minutes: 12
summary: Understand how expectations change from senior to staff and beyond, choose work that grows scope, build visibility and plan your own growth.
---

Promotion is not only about doing more of the same. Expectations change from solving problems to choosing problems, and from your own output to the output of many.

## What you will learn

- The shape of senior and staff roles
- Scope: from tasks to problems to strategy
- Choosing high leverage work
- Visibility and sponsorship
- A personal growth plan

## Roles

A senior engineer delivers complex work independently and improves the team. A staff engineer is trusted with ambiguous, cross team problems and sets technical direction. Titles vary by company, so read your own ladder and ask your manager for examples of strong cases.

## Scope

Early in a career you are given tasks. Later you are given problems and decide the tasks. At staff level you may define the problem itself, such as reducing deployment time across the company. Each step needs more written communication and more work through others.

## High leverage work

Look for work that many people reuse or that removes a recurring pain: a tool, a standard, a clear document or a hard migration. Say no to work that fills your calendar but changes nothing. Measure impact by time saved, incidents avoided or risk removed.

## Visibility and sponsorship

Write short summaries of what you did and its effect, share them with your manager and peers, and speak at internal events. A sponsor is someone senior who speaks for you when you are not in the room. Earn it with reliable results and ask directly for stretch opportunities.

## Growth plan

Pick one or two skills for the next six months, such as writing design documents or leading incidents. Ask for the project that requires them, find a mentor who is good at it and review progress monthly. Keep a record of your results for performance reviews and for interviews.

```diagram
title: Senior and staff scope and career growth
node: task | Tasks | 0 | 1 | Given to you. | Staying here. | external
node: prob | Problems | 1 | 1 | You choose tasks. | Unclear goal. | process
node: strat | Direction | 2 | 1 | You define problems. | No buy in. | process
node: imp | Impact record | 3 | 1 | Written results. | No evidence. | store
edge: task | prob
edge: prob | strat
edge: strat | imp
```

## Incident: The engineer who worked hard and was not promoted

> **Incident:** A strong engineer delivered many tickets for two years and was told they were not ready for staff.

```console
$ git shortlog -sn --since=2.years | head -2
  612 devon
  118 priya
$ grep -c "cross-team" brag-doc.md
0
(this is a simulated illustration, not a real incident)
```

Devon was the top contributor, but all the work stayed inside one team and none of it was written up. After talking to their manager they picked a cross team reliability project, wrote a design document, kept an impact record and were promoted the following year.

## Common mistakes

- Waiting to be noticed
- Measuring by volume of tickets
- Work that no one else reuses
- No sponsor
- No written record of impact

```quiz
Q: What changes at staff level?
+ You choose and shape the problems
- You stop coding :: Not necessarily.
- You manage people :: Different path.
- You work less :: No.
> Scope grows. Review the matching section of this lesson if it is unclear.

Q: Which work has high leverage?
+ Tools and standards many teams reuse
- One off fixes :: Low leverage.
- Meetings :: Low leverage.
- Status reports :: Low leverage.
> Multiply your impact.

Q: What is a sponsor?
+ A senior person who advocates for you
- A manager only :: Not necessarily.
- A mentor only :: Different.
- A friend :: Different.
> Earn and ask. Review the matching section of this lesson if it is unclear.

Q: Why keep an impact record?
+ It supports reviews, promotion and interviews
- To impress :: Not the reason.
- For fun :: Not the reason.
- To avoid work :: No.
> Write results down.
```

```cards
Scope :: The size and ambiguity of problems you own
Leverage :: Impact beyond your own output
Sponsor :: A senior person who advocates for you
Impact record :: A running list of your results
```
