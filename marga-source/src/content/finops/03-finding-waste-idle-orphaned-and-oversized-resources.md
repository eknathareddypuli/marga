---
title: Finding waste: idle, orphaned and oversized resources
minutes: 13
summary: Find and remove common waste safely: idle and orphaned resources, oversized instances, always on non production environments and unused storage, using data and a clear process.
---

Waste is the cheapest saving because it needs no change of design. It is also easy to cause an outage while removing it, so the process matters as much as the search.

## What you will learn

- The usual sources of waste
- Rightsizing with real utilisation data
- Scheduling non production environments
- Orphaned volumes, snapshots, addresses and load balancers
- A safe removal process with an undo path

## Common sources

Typical waste includes stopped instances that still have paid disks, detached volumes, old snapshots, unused public addresses, idle load balancers, test clusters that nobody uses and over provisioned databases. Each is small, but together they often reach ten to twenty percent of a bill.

## Rightsizing

Compare what a resource has with what it uses over a representative period, including peaks such as month end. Look at CPU, memory, disk and network, using percentiles and not only averages. Provider tools give recommendations, and you should confirm them against application behaviour, because memory is often invisible to default metrics. Change one step at a time.

## Scheduling

Development and test environments are needed during working hours and not at night or at weekends. Stopping them automatically on a schedule saves most of their cost. Make the schedule easy to override, so a team working late can start their environment without a ticket.

## Orphans

Resources lose their owner when projects end. Find them with queries such as volumes with no attachment for thirty days or load balancers with no healthy targets. Check the creation time and tags, and contact the owner or the team that owned the account before deleting anything.

## Safe removal

Use a staged process: tag as candidate for deletion with a date, notify the owner, stop or detach first, snapshot where it matters, wait a defined period and then delete. Record each action so that a mistake can be reversed. Never delete on the basis of cost alone without an owner decision.

```diagram
title: Finding waste: idle, orphaned and oversized resources
node: scan | Utilisation scan | 0 | 1 | Percentiles. | Short window. | observe
node: cand | Candidates | 1 | 1 | Tag and notify. | No owner. | process
node: stop | Stop or detach | 2 | 1 | Reversible step. | Skipped. | process
node: del | Delete | 3 | 1 | After the wait. | Too fast. | service
edge: scan | cand
edge: cand | stop
edge: stop | del
```

## Incident: The volume that was not orphaned

> **Incident:** A clean up script deleted unattached volumes and a monthly reporting job failed the next week.

```console
$ aws ec2 describe-volumes --filters Name=status,Values=available --query "Volumes[].[VolumeId,CreateTime]" --output text
vol-0a1b 2026-08-02
vol-0c2d 2026-09-14
(this is a simulated illustration, not a real incident)
```

The volumes were unattached because the reporting job attached them only for a few hours at the start of each month, so a thirty day check could not tell the difference. The team restored the volume from a snapshot taken before deletion. They changed the process to tag candidates and notify owners first, to stop before deleting and to require a snapshot and a waiting period.

## Common mistakes

- Deleting on a single average number
- Using a window that misses month end
- Removing resources without telling the owner
- Rightsizing memory without memory metrics
- Making schedules impossible to override

```quiz
Q: Why use percentiles for rightsizing?
+ Averages hide the peaks that need capacity
- They are cheaper to compute :: Not the reason.
- They reduce traffic :: No.
- They remove tags :: No.
> Peaks decide how small it can safely be.

Q: What is a safe first step before deleting?
+ Tag, notify and stop or detach with a snapshot
- Delete immediately :: Risky.
- Rename it :: Does nothing.
- Ignore it :: Cost remains.
> Keep an undo path.

Q: Which environments are good to schedule?
+ Development and test environments
- Production databases :: Needs availability.
- Payment gateways :: No.
- Audit logs :: No.
> Nobody uses them overnight.

Q: Why is memory tricky to rightsize?
+ Default instance metrics often do not show memory
- Memory is free :: No.
- It never changes :: No.
- It is encrypted :: No.
> Install an agent or use application metrics.
```

```cards
Rightsizing :: Matching resource size to real use
Orphaned resource :: A resource that no longer has an owner or purpose
Percentile :: A value below which a share of samples fall
Candidate for deletion :: A resource tagged for review before removal
```
