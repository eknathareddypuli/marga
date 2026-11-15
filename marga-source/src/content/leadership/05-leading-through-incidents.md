---
title: Leading through incidents
minutes: 12
summary: Take the incident commander role, structure communication, make decisions under pressure and run a blameless review that produces action.
---

During an outage, technical skill matters less than clear roles and communication. A calm leader who structures the response shortens the incident and protects the team.

## What you will learn

- The incident commander role
- Communication cadence and the status update
- Decision making under uncertainty
- Handoffs and fatigue
- Blameless reviews with real actions

## The commander

The incident commander coordinates and does not debug. They assign roles: an operations lead who makes changes, a communications lead who updates stakeholders and a scribe who records the timeline. They decide when to escalate and when to roll back. If you are the best debugger, hand command to someone else.

## Communication

Post updates on a fixed cadence, such as every thirty minutes, even if nothing changed. A good update states the impact, what is known, what is being done and when the next update comes. Keep a single channel for the incident and move side discussions elsewhere.

## Decisions

You rarely have full information. Prefer reversible actions, such as a rollback or traffic shift, to risky fixes. State the hypothesis and the evidence that would disprove it, and time box each attempt. Ask the room for objections, then decide.

## Handoffs and fatigue

After a few hours people make mistakes. Rotate roles, send tired people to rest and hand off with a written summary. A short break often saves more time than another hour of effort.

## Reviews

A blameless review asks how the system allowed this to happen, not who caused it. Write the timeline, contributing factors and what went well. Produce a small number of actions with owners and dates and track them to completion.

```diagram
title: Leading through incidents
node: ic | Incident commander | 0 | 1 | Coordinates. | Debugging instead. | process
node: ops | Operations lead | 1 | 1 | Makes changes. | Unannounced changes. | service
node: comm | Communications lead | 2 | 1 | Updates stakeholders. | Silence. | external
node: rev | Blameless review | 3 | 1 | Actions and owners. | No follow up. | observe
edge: ic | ops
edge: ic | comm
edge: ops | rev
```

## Incident: An incident with three people debugging and nobody talking

> **Incident:** For two hours no update went to customers or to management.

```console
$ grep -c "STATUS UPDATE" incident-4821.log
0
$ grep -c "rolled back" incident-4821.log
1
(this is a simulated illustration, not a real incident)
```

Everyone was working on the fix and nobody had the communication role. A commander was named, updates went out every thirty minutes and a rollback that had been delayed was done within ten minutes of the decision.

## Common mistakes

- The commander debugging as well
- No fixed update cadence
- Risky fixes before a rollback
- No handoff when tired
- Review that blames a person

```quiz
Q: What does the incident commander do?
+ Coordinates the response and assigns roles
- Writes the fix :: Delegate it.
- Blames people :: No.
- Sleeps :: No.
> Command is a role.

Q: What should an update contain?
+ Impact, current state, actions and next update time
- Only good news :: Dishonest.
- A guess about blame :: No.
- Code :: No.
> Be regular. Review the matching section of this lesson if it is unclear.

Q: Which action is usually preferred first?
+ A reversible one such as rollback
- A risky patch :: Riskier.
- A restart of everything :: Risky.
- Waiting :: Delays recovery.
> Restore service first.

Q: What makes a review blameless?
+ It examines the system, not the person
- It has no actions :: Needs actions.
- It is secret :: No.
- It is short :: Not the point.
> Fix causes. Review the matching section of this lesson if it is unclear.
```

```cards
Incident commander :: The person coordinating an incident response
Cadence :: A fixed rhythm for updates
Blameless review :: A review focused on system causes
Timeline :: An ordered record of events during an incident
```
