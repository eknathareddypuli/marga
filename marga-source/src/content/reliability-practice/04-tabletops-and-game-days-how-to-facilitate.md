---
title: Tabletops and game days: how to facilitate
minutes: 13
summary: Plan and run a tabletop exercise and a live game day: pick a scenario, set safety rules, give injects, observe without rescuing and turn findings into tracked actions.
---

Teams learn the weak points of their response before a real incident only if they practise. A good exercise is safe, focused and ends with changes.

## What you will learn

- Tabletop versus live game day
- Writing a scenario and the injects
- Roles: facilitator, scribe, observers and responders
- Safety: scope, abort rules and communication
- After the exercise: findings with owners and dates

## Two formats

A tabletop is a discussion of a scenario with no systems touched, and it tests decisions, roles and communication. A game day injects a real failure, such as stopping a dependency in a controlled environment or in production with a small blast radius, and tests the system and the people together. Start with tabletops and move to live exercises as confidence grows.

## Scenario and injects

Pick a realistic and specific failure, such as the primary database loses its leader during a sale. Write a timeline of injects, which are new facts given to the team at set times, such as an alert, a customer message or a failed fix. Include a complication, for example the runbook step is out of date, because that is where learning happens.

## Roles

The facilitator runs the clock and gives injects. A scribe records the timeline, decisions and questions. Observers watch the response, communication and tools. Responders act as they would in a real incident, with their normal on call roles. The facilitator must not help the responders solve the scenario, or the exercise shows nothing.

## Safety

Agree the scope, the systems that may be touched and an abort word that anyone can use. For live exercises, have a rollback ready, tell stakeholders and support teams, and avoid periods of high risk. Monitor customer impact during the exercise and stop if it exceeds the limit. Never run a surprise exercise in production without leadership approval.

## Follow up

Hold a short review straight after, then write findings as actions with an owner and a date, such as update the runbook, add an alert or practise the failover again. Track them like other work and check progress at the next exercise. Share a summary with the wider organisation to spread what was learned.

```diagram
title: Tabletops and game days: how to facilitate
node: plan | Scenario and injects | 0 | 1 | Realistic and specific. | Vague. | process
node: run | Exercise | 1 | 1 | Facilitator and scribe. | Rescued. | service
node: safe | Safety rules | 2 | 1 | Abort and scope. | None. | security
node: act | Findings and actions | 3 | 1 | Owners and dates. | Lost. | process
edge: plan | run
edge: run | safe
edge: safe | act
```

## Incident: The runbook that pointed to a deleted server

> **Incident:** A game day showed that the failover step named a host that no longer existed.

```console
$ grep -n "failover" runbooks/db-primary.md | head -2
17: ssh db-old-03.example.internal and run promote.sh
$ getent hosts db-old-03.example.internal
$ echo $?
2
(this is a simulated illustration, not a real incident)
```

The scribe recorded that responders lost eight minutes before they found the current procedure. The facilitator did not rescue them. In the review the team updated the runbook, added a test that checks that every host in a runbook resolves, and booked a repeat exercise for the next quarter. The second run took two minutes for the same step.

## Common mistakes

- A facilitator who solves the problem for the team
- No abort rule
- Surprise exercises with no approval
- No scribe so nothing is recorded
- Findings without owners

```quiz
Q: What does a tabletop test?
+ Decisions, roles and communication without touching systems
- Disk speed :: No.
- Network cables :: No.
- CPU limits :: No.
> It is the lowest risk format.

Q: What is an inject?
+ A new fact given to the team at a set time
- A drug :: No.
- A bug fix :: No.
- A log filter :: No.
> It drives the scenario.

Q: Why must the facilitator not rescue?
+ It hides the real gaps
- To save time :: No.
- To pass the test :: No.
- To cut cost :: No.
> The aim is learning.

Q: What ends a good exercise?
+ Actions with owners and dates
- A party :: Not enough.
- Nothing :: Learning lost.
- A new tool :: Not the point.
> Track them like other work.
```

```cards
Tabletop :: A discussion based exercise
Game day :: A live failure exercise
Inject :: A planned event during an exercise
Blast radius :: The scope of possible impact
```
