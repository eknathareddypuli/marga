---
title: Design: fleet provisioning and patching at scale
minutes: 13
summary: Design how thousands of servers are built, configured and patched: image pipelines, immutable and mutable models, rings, health gates and handling the hosts that fall behind.
---

A fleet that cannot be patched safely is a fleet that will be breached or broken. The design has to make the safe way the easy way.

## What you will learn

- Requirements: fleet size, change windows and compliance
- Image pipeline versus configuration management
- Rings and health gates for rollout
- Handling drift and stragglers
- Failure modes: bad image, stuck rollout and unpatchable hosts

## Requirements

Estimate the number of hosts, their roles and how fast a critical patch must be applied, for example ninety five percent within seven days. Note which hosts hold state and need care, which can be replaced freely and where network or bandwidth limits affect rollout speed. Compliance often sets the deadlines, so ask for them early.

## Images or configuration

An image pipeline builds a tested machine image on a schedule, and hosts are replaced with the new image. This gives repeatable hosts and simple rollback, and suits stateless roles. Configuration management changes hosts in place, which suits stateful servers and bare metal. Many fleets use both, with a clear rule for which role uses which.

## Rings and gates

Roll out in rings: a few test hosts, a canary group, then growing shares of the fleet with a pause between rings. Gate each step on health signals such as error rate, boot success and the number of hosts reporting. Stop automatically on failure and keep the previous image available. Avoid patching all replicas of a service in the same window.

## Drift and stragglers

Some hosts will be offline, locked or failing. Track the version of every host in an inventory and report the share on the current version by ring and by owner. Chase stragglers with clear owners and a deadline, and after the deadline isolate or replace them. A dashboard of patch age by team creates a healthy pressure.

## Failure modes

A bad image that fails to boot can stop a whole ring, so test boot and a service check before release and keep automatic rollback. A rollout can stall if a drain never completes, so set timeouts. Hosts that cannot be patched, such as old appliances, need a documented exception with compensating controls and an end date.

```diagram
title: Design: fleet provisioning and patching at scale
node: img | Image pipeline | 0 | 1 | Tested build. | Bad image. | process
node: ring | Rollout rings | 1 | 1 | Canary first. | Stalled. | process
node: gate | Health gates | 2 | 1 | Stop on failure. | Ignored. | observe
node: inv | Inventory and stragglers | 3 | 1 | Version per host. | Unknown. | store
edge: img | ring
edge: ring | gate
edge: gate | inv
```

## Incident: The kernel update that did not boot

> **Incident:** A patch rollout left fifty hosts down after a reboot because a network driver was missing.

```console
$ uname -r
5.14.0-427.el9.x86_64
$ journalctl -b -1 -p err --no-pager | tail -2
dracut: FATAL: no network interface found
(this is a simulated illustration, not a real incident)
```

The rollout had no canary ring and no boot check, so the first ring was fifty hosts of one hardware type and all of them failed to bring up the network. The team rolled back to the previous image from the boot menu on the management network. The redesign added a hardware diverse canary ring, a post boot health gate and an automatic stop, and the next kernel update stopped after two hosts.

## Common mistakes

- No canary ring
- Patching all replicas of a service together
- No health gate after reboot
- No inventory of versions
- Open ended exceptions for unpatched hosts

```quiz
Q: Why roll out in rings?
+ A bad change is found on a small group first
- To slow everything :: Not the aim.
- To save disk :: No.
- To hide results :: No.
> It limits blast radius.

Q: When is an image pipeline a good fit?
+ For stateless roles that can be replaced
- For every single host :: Not always.
- For printers :: No.
- For paper forms :: No.
> Replacement gives rollback.

Q: What tracks stragglers?
+ An inventory of the version on every host
- A hunch :: Unreliable.
- A chat message :: Not reliable.
- The invoice :: No.
> You manage what you measure.

Q: What should happen to unpatchable hosts?
+ A documented exception with controls and an end date
- Ignore :: Leaves risk.
- Delete all :: Too harsh.
- Wait for a year :: No.
> Exceptions need owners and deadlines.
```

```cards
Ring :: A group of hosts patched together
Immutable image :: A machine image replaced, not changed, on update
Drift :: Difference from the intended state
Straggler :: A host that falls behind the fleet version
```
