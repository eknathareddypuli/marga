---
title: cgroup v2: controllers, CPU throttling and memory limits
minutes: 13
summary: Read and reason about cgroup v2: the unified hierarchy, the cpu, memory and io controllers, why a container is throttled when the node looks idle, and how memory limits kill.
---

Containers do not have their own kernel. Their limits are cgroup settings, and most mysterious slowness or restarts in Kubernetes can be explained by reading a few files.

## What you will learn

- The unified hierarchy and delegation
- cpu.max, cpu.weight and CFS bandwidth throttling
- memory.max, memory.high and the cgroup OOM killer
- io controls and pids limits
- Reading the numbers: cpu.stat, memory.events and pressure files

## The hierarchy

In cgroup v2 there is one tree under /sys/fs/cgroup. A process belongs to one cgroup, and controllers such as cpu, memory, io and pids are enabled for a subtree. A parent limit bounds all its children. Systemd and container runtimes create the cgroups, and Kubernetes places each pod and container in the tree.

## CPU limits

cpu.weight is a relative share used when the CPU is busy, which maps to a CPU request. cpu.max sets a hard quota per period, for example 50000 out of 100000 microseconds for half a CPU, which maps to a limit. When a group uses its quota early in the period, all its threads stop until the next period, even if other cores are idle. That is throttling.

## Why throttling hurts latency

A multi threaded service with a limit of one CPU can burn its quota in a few milliseconds across many threads, and then freeze for the rest of the period. Latency spikes appear with low average CPU. The counters nr_throttled and throttled_usec in cpu.stat show it. Raise or remove the limit, or reduce threads, and keep requests for scheduling.

## Memory limits

memory.max is a hard limit. If the group cannot reclaim enough page cache and the usage reaches it, the kernel kills a process in that group and the container is reported as out of memory killed. memory.high is a soft limit that makes the group reclaim and slow down before the hard limit. Page cache counts toward usage but can usually be reclaimed.

## Reading the signals

memory.events counts how many times the group hit high, max and oom_kill. cpu.pressure and memory.pressure report pressure stall information, the share of time tasks wait for the resource. io.max limits bandwidth and operations per device, and pids.max stops fork bombs. Compare these files with the application metrics to explain a symptom.

```diagram
title: cgroup v2: controllers, CPU throttling and memory limits
node: app | Container process | 0 | 1 | Many threads. | Burst. | service
node: cpu | cpu controller | 1 | 1 | Quota per period. | Throttled. | process
node: mem | memory controller | 2 | 1 | Limit and reclaim. | OOM kill. | process
node: psi | Pressure files | 3 | 1 | Stall time. | Unread. | observe
edge: app | cpu
edge: cpu | mem
edge: mem | psi
```

## Incident: Slow responses with idle CPUs

> **Incident:** Latency doubled in one service while node CPU showed forty percent idle.

```console
$ cat /sys/fs/cgroup/kubepods.slice/kubepods-burstable.slice/cpu.stat
usage_usec 91823442
nr_periods 120344
nr_throttled 88211
throttled_usec 40123311
(this is a simulated illustration, not a real incident)
```

The service had a CPU limit of one core but ran sixteen threads, so it used its quota in the first few milliseconds of many periods and then stopped. More than seventy percent of periods were throttled. The team raised the limit, set the worker count to match the CPU request and added an alert on the throttled ratio. The latency returned to normal without adding nodes.

## Common mistakes

- Reading node CPU only and not cgroup throttling
- Setting tight CPU limits on multi threaded services
- Ignoring memory.events and oom_kill counts
- Treating page cache as leaked memory
- Setting memory limits equal to the average use

```quiz
Q: What does cpu.max control?
+ A hard CPU quota for each period
- Disk speed :: No.
- Network queues :: No.
- Boot order :: No.
> Using it all early causes throttling.

Q: Why can a container be slow with idle node CPUs?
+ Its own quota is used up and its threads are paused
- The node is broken :: Not necessarily.
- The kernel is old :: Not the cause.
- DNS is slow :: Unrelated.
> Throttling is per cgroup.

Q: What happens at memory.max?
+ Reclaim is tried and then a process may be killed
- Nothing :: Wrong.
- The node reboots :: No.
- Swap is added :: No.
> The cgroup out of memory killer acts.

Q: Which file shows how often limits were hit?
+ memory.events
- cpu.weight :: A setting.
- io.max :: A setting.
- pids.max :: A setting.
> It counts high, max and oom_kill events.
```

```cards
cgroup :: A kernel group of processes with shared limits
CFS quota :: A CPU time budget per scheduling period
Throttling :: Pausing a group that used its quota
PSI :: Pressure stall information about waiting time
```
