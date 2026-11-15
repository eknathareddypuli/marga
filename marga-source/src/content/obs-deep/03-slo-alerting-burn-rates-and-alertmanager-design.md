---
title: SLO alerting: burn rates and Alertmanager design
minutes: 13
summary: Turn an SLO into multi-window burn rate alerts, route them with Alertmanager so the right people hear about the right problems, and cut alert noise.
---

Alerts on raw thresholds either miss real trouble or wake people for nothing. Alerting on the speed at which an error budget is being spent fits what users feel and gives you something to decide on.

## What you will learn

- Error budgets and burn rate
- Multi-window, multi-burn-rate alerts
- Page versus ticket routing
- Alertmanager grouping, inhibition and silences
- Measuring alert quality

## Error budget and burn rate

A 99.9 percent monthly SLO leaves 0.1 percent of requests as budget. Burn rate is the speed of spending it: a burn rate of one uses exactly the whole budget in the month, and a burn rate of 14.4 uses it in about two days. Alerts on high burn rates catch real trouble early.

## Multiple windows

A fast alert uses a short window and a high burn rate, such as 14.4 over one hour and five minutes, and pages someone. A slow alert uses a lower burn rate such as 6 over six hours and also 3 over three days, and opens a ticket. Requiring both a long and a short window stops alerts that fire after an incident is over.

## Routing

Alertmanager routes by labels to receivers. Page only for symptoms users feel and that need action now. Send everything else to tickets or chat. Include a runbook link and the dashboard in every alert so the responder starts with context.

## Grouping, inhibition and silences

Group alerts by service so one outage creates one notification. Use inhibition so a cluster down alert suppresses node level alerts. Use silences with an expiry for planned work, and record who created them and why.

## Alert quality

Review each page: was it actionable, urgent and real? Track pages per week per on-call person and the share that needed no action. Delete or fix alerts that fail that review.

```diagram
title: SLO alerting: burn rates and Alertmanager design
node: sli | SLI query | 0 | 1 | Error ratio. | Wrong denominator. | observe
node: rule | Burn rate rules | 1 | 1 | Fast and slow windows. | Single window. | process
node: am | Alertmanager | 2 | 1 | Groups and routes. | Bad routing. | service
node: oc | On-call | 3 | 1 | Acts on pages. | Alert fatigue. | external
edge: sli | rule
edge: rule | am
edge: am | oc
```

## Incident: Two hundred pages from one outage

> **Incident:** A database failure triggered a separate page for every dependent service.

```console
$ amtool alert query --active | wc -l
214
$ amtool config routes show | head -4
Routing tree:
 receiver: pager
 group_by: [alertname instance]
(this is a simulated illustration, not a real incident)
```

Grouping by instance meant every pod produced its own notification. Grouping by service, adding an inhibition rule from the database alert to dependent alerts and moving most conditions to ticket routes reduced the next incident to three pages.

## Common mistakes

- Paging on causes such as CPU instead of user impact
- Using one short window that flaps
- No runbook link in the alert
- Grouping by instance so one outage floods people
- Silences with no expiry or owner

```quiz
Q: What does a burn rate of one mean?
+ The budget will be spent exactly at the end of the period
- The service is down :: It does not mean an outage.
- No errors :: Errors still occur.
- The SLO is 100 percent :: No such meaning.
> It is the speed of spending.

Q: Why combine a long and a short window?
+ To stop alerts firing after the problem has ended
- To save memory :: It does not affect memory.
- To hide alerts :: It reduces noise, not visibility.
- To change the SLO :: The SLO stays.
> Both must agree.

Q: What should a page require?
+ A user visible problem that needs action now
- Any CPU spike :: Often not actionable.
- A disk at 60 percent :: A ticket is enough.
- Every warning :: Too noisy.
> Pages are expensive.

Q: What does inhibition do?
+ Suppresses lower level alerts while a higher level one is firing
- Deletes alerts :: It only suppresses.
- Speeds up alerts :: No.
- Encrypts alerts :: No.
> It reduces noise.
```

```cards
Burn rate :: How fast the error budget is being consumed
Inhibition :: Suppressing alerts when a related alert is firing
Silence :: A temporary mute of alerts matching labels
Runbook :: Steps a responder follows for a given alert
```
