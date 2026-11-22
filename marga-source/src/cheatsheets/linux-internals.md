---
title: Linux internals in depth
summary: cgroup files, kernel checks and container restriction inspection.
module: linux-internals
---

## cgroup v2 files

| File | Meaning |
|------|---------|
| `cpu.max` | Quota and period |
| `cpu.stat` | Throttling counters |
| `memory.max` | Hard memory limit |
| `memory.events` | high, max and oom_kill counts |
| `memory.pressure` | Waiting time for memory |

## Quick checks

| Question | Command |
|----------|---------|
| Is a cgroup throttled? | `cat /sys/fs/cgroup/PATH/cpu.stat` |
| Is memory under pressure? | `cat /proc/pressure/memory` |
| Where do interrupts go? | `cat /proc/interrupts` |
| Which NUMA node holds memory? | `numastat -p PID` |
| Disk waiting? | `iostat -x 1` |
| Conntrack use | `cat /proc/sys/net/netfilter/nf_conntrack_count` |

## Container restrictions

| Layer | Inspect |
|-------|---------|
| Namespaces | `ls -l /proc/PID/ns` |
| Capabilities | `grep Cap /proc/PID/status` |
| seccomp | `grep Seccomp /proc/PID/status` |
| Root file system | `mount | grep overlay` |

## Handy commands

```bash
cat /sys/fs/cgroup/PATH/cpu.stat
```

```bash
cat /sys/fs/cgroup/PATH/memory.events
```

```bash
cat /proc/pressure/memory
```

```bash
iostat -x 1 3
```

```bash
cat /proc/sys/net/netfilter/nf_conntrack_count
```

```bash
numastat -p PID
```

```bash
cat /proc/interrupts
```

```bash
grep -E 'CapEff|Seccomp' /proc/PID/status
```

## Watch out for

> **Warning:** Raising a CPU limit hides throttling only if the thread count also fits the quota.

> **Warning:** Free memory is the wrong alert, because Linux uses spare memory as cache on purpose.

> **Warning:** Transparent huge pages can cause latency stalls in databases, so follow the vendor advice.

> **Warning:** Privileged containers receive nearly every capability, so add only the ones you need.
