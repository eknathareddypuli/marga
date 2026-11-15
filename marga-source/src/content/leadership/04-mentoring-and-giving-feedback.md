---
title: Mentoring and giving feedback
minutes: 12
summary: Mentor engineers effectively, give feedback that is specific and kind, receive feedback well and delegate so people grow.
---

Senior engineers multiply their impact by growing others. That needs skills of its own: asking good questions, giving clear feedback and delegating with the right amount of support.

## What you will learn

- What mentoring is and is not
- The feedback structure: observation, impact, request
- Reviewing code as teaching
- Receiving feedback
- Delegating for growth

## Mentoring

A mentor helps someone reach their goals by asking questions, sharing experience and opening doors. It is not doing the work for them. Agree on goals, a regular time and what the mentee wants to practise. Let them find answers first and step in when they are stuck.

## Feedback

State what you observed, the effect it had and what you suggest. For example: in the review you interrupted twice, so the quieter engineers stopped giving input, so please wait until others finish. Give it soon after the event, in private for criticism and in public for praise, and focus on behaviour, not character.

## Code review as teaching

Explain the reason behind a comment and link to a guideline. Mark preferences as optional and separate them from blocking issues. Praise good solutions specifically, because people repeat what is noticed.

## Receiving feedback

Listen to the end, ask for an example and thank the person even if you disagree. Decide later what to change. Ask peers and your manager for feedback regularly instead of waiting for a review cycle.

## Delegating

Match the task to the person: stretching but possible. Explain the outcome you want and the limits, not each step. Agree when you will check in and let them make small mistakes. Credit them when it goes well.

```diagram
title: Mentoring and giving feedback
node: goal | Goals | 0 | 1 | Agree what to practise. | No goal. | external
node: obs | Observation and impact | 1 | 1 | Specific feedback. | Vague. | process
node: task | Stretch task | 2 | 1 | Right size. | Too big. | process
node: rev | Check in | 3 | 1 | Regular and light. | Absent. | observe
edge: goal | obs
edge: obs | task
edge: task | rev
```

## Incident: The review that stopped a junior from asking

> **Incident:** A harsh pull request review made a new engineer stop sharing work until it was finished.

```console
$ git log --author=maya --since=2.weeks --oneline | wc -l
1
$ git log --author=maya --since=6.weeks --until=2.weeks --oneline | wc -l
14
(this is a simulated illustration, not a real incident)
```

The activity drop followed a review with sarcastic comments. The reviewer apologised, rewrote the comments with reasons and suggestions, and agreed a weekly pairing session. Commit frequency recovered within a month.

## Common mistakes

- Giving feedback only at review time
- Criticising the person instead of the behaviour
- Taking over the task when the mentee is slow
- Delegating with no check in
- Never asking for feedback yourself

```quiz
Q: What does useful feedback include?
+ Observation, impact and a request
- A guess about motives :: Unfair.
- A comparison to others :: Unhelpful.
- A joke :: Unclear.
> Be specific and kind.

Q: What is mentoring not?
+ Doing the work for them
- Asking questions :: It is.
- Sharing experience :: It is.
- Setting goals :: It is.
> Help them learn.

Q: How should preferences in a review be marked?
+ As optional, separate from blocking issues
- As mandatory :: Unfair.
- Hidden :: Unclear.
- Left out :: Loses value.
> Be clear. Review the matching section of this lesson if it is unclear.

Q: What should delegation include?
+ The outcome, limits and check in times
- Every step :: Micromanagement.
- Nothing :: Abandonment.
- A deadline only :: Not enough.
> Give room to grow.
```

```cards
Mentoring :: Guiding someone toward their goals
Feedback :: Information about the effect of behaviour
Delegation :: Handing a task to someone else with support
Pairing :: Two people working on a task together
```
