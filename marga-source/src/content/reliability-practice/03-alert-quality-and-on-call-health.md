---
title: Alert quality and on call health
minutes: 12
summary: Measure the pages your team receives, remove noise, tie alerts to user impact and watch the health of the on call rotation as a reliability input.
---

People are part of the system. A rotation that is woken every night makes mistakes and leaves, and that is a reliability risk as real as a failing disk.

## What you will learn

- Measuring pages: volume, actionability and timing
- Classifying alerts: page, ticket or delete
- Burn rate alerts and symptom based paging
- On call load, fairness and recovery
- Handover and follow the sun options

## Measure pages

For each alert count how often it fired, how often it needed action, how long it took to resolve and when it fired. Pages at night weigh more than pages in the day. Review the numbers weekly with the rotation. An alert that fires often and needs no action is the first candidate to change.

## Page, ticket or delete

A page means a human must act now to protect users. A ticket means work is needed but can wait. Anything else is a dashboard or should be deleted. Apply the test to each alert: what will the responder do, is it urgent and does it relate to user impact. Many cause based alerts fail the test.

## Symptom based paging

Page on symptoms users feel, such as error budget burn, and keep cause alerts as supporting information for diagnosis. A high burn rate means users are hurt now. A disk at eighty percent is a ticket. Link every page to a runbook and a dashboard so that the responder starts with context.

## Load and fairness

Set a target such as at most two actionable pages per shift and track against it. Share the load fairly, pay or compensate for on call, and give time to recover after a night incident. Track the number of people who can take the rotation and the shadowing of new members, since a thin rotation is fragile.

## Handover

Write a short handover note with open issues, recent changes and risky times. Consider follow the sun coverage across time zones when the load requires it. Review the rotation health each quarter with the team and management, and treat a bad trend as a reliability problem that needs funding.

```diagram
title: Alert quality and on call health
node: data | Page statistics | 0 | 1 | Count and timing. | Unknown. | observe
node: cls | Classify alerts | 1 | 1 | Page, ticket, delete. | All pages. | process
node: sym | Symptom paging | 2 | 1 | Burn rate. | Cause noise. | process
node: health | On call health | 3 | 1 | Load and recovery. | Burnout. | service
edge: data | cls
edge: cls | sym
edge: sym | health
```

## Incident: Three pages a night for a month

> **Incident:** A small team lost two engineers after a month of frequent night pages.

```console
$ cat pages-last-30-days.csv | awk -F, 'NR>1 {c[$2]++} END {for (k in c) print c[k], k}' | sort -rn | head -3
61 DiskUsageHigh
44 PodRestartedOnce
29 CpuAbove80
(this is a simulated illustration, not a real incident)
```

The three noisiest alerts were cause based and needed no action most of the time. The team moved the disk and CPU alerts to tickets with trend based predictions, replaced the restart alert with a burn rate page and set a target of two actionable pages per shift. Night pages fell by eighty percent in six weeks, and the next quarterly survey showed better on call satisfaction.

## Common mistakes

- Paging on causes that need no action
- No measurement of pages
- Unfair rotation load
- No time to recover after night work
- Alerts with no runbook link

```quiz
Q: What should a page mean?
+ A human must act now to protect users
- A graph moved :: Not enough.
- A log line exists :: No.
- A server is old :: No.
> Other items are tickets or dashboards.

Q: Which alerts should you change first?
+ Those that fire often and need no action
- The rare critical ones :: Keep them.
- Alerts with runbooks :: They help.
- None :: Noise remains.
> They train people to ignore pages.

Q: Why track on call load?
+ Overloaded people make mistakes and leave
- To save money only :: Not the main point.
- To hide incidents :: No.
- To shorten code :: No.
> It is a reliability input.

Q: What helps a responder start fast?
+ A runbook and dashboard linked from the alert
- A longer message :: Not enough.
- A louder tone :: No.
- A new tool :: No.
> Context saves minutes.
```

```cards
Actionable alert :: An alert that requires a human action
Burn rate :: Speed of error budget consumption
Toil :: Repetitive manual work that scales with the service
Handover :: Passing open issues to the next on call
```
