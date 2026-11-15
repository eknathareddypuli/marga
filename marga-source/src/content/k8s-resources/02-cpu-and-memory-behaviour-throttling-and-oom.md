---
title: CPU and memory behaviour: throttling and out-of-memory kills
minutes: 12
summary: Understand CFS quota throttling, cpu shares, memory working sets and OOM scoring, so performance symptoms can be tied to resource settings.
---

Resource settings turn into kernel settings, and the kernel reacts in specific ways. Learning those reactions lets you tell throttling from a slow dependency and an OOM kill from an application crash.

## What you will learn

- How CPU requests become shares and limits become quota
- What throttling looks like and how to measure it
- Working set memory and what counts toward the limit
- The OOM killer, oom_score_adj and exit code 137
- Practical tuning

## CPU shares and quota

A CPU request sets cgroup cpu shares, a relative weight used when the node is busy. A CPU limit sets a CFS quota, for example 50 ms of CPU time in each 100 ms period for a limit of 0.5 cores. A multi-threaded application can use its whole quota in a few milliseconds and then be paused for the rest of the period, which shows up as latency spikes even when average CPU looks low.

## Measuring throttling

The metric `container_cpu_cfs_throttled_periods_total` against `container_cpu_cfs_periods_total` gives the throttled share. A pod that is throttled in a large share of periods needs a higher limit, or no limit, or fewer threads. Many teams drop CPU limits for latency sensitive workloads and rely on requests for fairness, while keeping namespace level quotas.

```bash
kubectl top pod -n shop
kubectl exec api-1 -- cat /sys/fs/cgroup/cpu.stat
```

## Memory

The limit counts the working set: anonymous memory, page cache that cannot be dropped cheaply and kernel memory attributed to the container. Page cache that can be reclaimed does not cause a kill by itself. `kubectl top` shows the working set, which is what the kubelet uses for eviction decisions. Languages with managed heaps need explicit limits that respect the container, such as a Java heap percentage or Go memory limit.

## The OOM killer

When a cgroup hits its limit and reclaim fails, the kernel kills a process in it. Kubernetes sets oom_score_adj so that BestEffort processes are chosen first on node pressure and Guaranteed last. A kill shows as exit code 137 and reason OOMKilled. If the main process is killed, the container restarts with backoff. A killed child process may not be visible at all.

## Tuning in practice

Watch usage and throttling over a week that includes peaks. Increase memory limits to cover the peak with margin and fix leaks rather than raising them endlessly. Choose CPU limits deliberately: leave them off for latency critical services or set them well above the request. Tune the runtime too, for example worker counts, to match the CPU you actually get.

```diagram
title: CPU and memory behaviour: throttling and out-of-memory kills
node: req | CPU request | 0 | 0 | Relative share. | Too low. | store
node: lim | CPU limit | 0 | 2 | Quota per period. | Throttled. | store
node: cg | cgroup | 1 | 1 | Applies both. | Misread. | process
node: thr | Throttling | 2 | 0 | Paused time. | Latency spikes. | observe
node: oom | OOM kill | 2 | 2 | Exit 137. | Restart loop. | observe
edge: req | cg
edge: lim | cg
edge: cg | thr
edge: cg | oom
```

## Incident: Latency spikes with low average CPU

> **Incident:** A service with a CPU limit of one core had periodic latency spikes while dashboards showed 30 percent CPU use.

```console
$ kubectl exec api-1 -- cat /sys/fs/cgroup/cpu.stat
usage_usec 91240000
nr_periods 18200
nr_throttled 6100
throttled_usec 41200000
(this is a simulated illustration, not a real incident)
```

A third of all periods were throttled. The application ran eight worker threads that burned the quota early in each period and then waited. Raising the limit and reducing the worker count to match removed the spikes. Average CPU hides throttling, so look at the throttled share directly.

## Common mistakes

- Reading average CPU as proof there is no throttling
- Setting tiny CPU limits on multi-threaded services
- Raising memory limits to hide leaks
- Ignoring runtime tuning inside the container
- Treating page cache as application memory

```quiz
Q: What does a CPU limit become in the kernel?
+ A CFS quota per period
- A memory cap :: No.
- A priority :: That is the shares.
- A taint :: No.
> It caps CPU time per period.

Q: Why can latency spike at low average CPU?
+ The container is throttled in bursts
- DNS is broken :: Not necessarily.
- etcd is full :: Not related.
- Memory is free :: Not related.
> Quota exhaustion pauses threads.

Q: What does exit code 137 with OOMKilled mean?
+ The container was killed for exceeding memory
- Normal exit :: Normal exit is 0.
- Image error :: No.
- Probe failure :: No.
> 137 is SIGKILL.

Q: Which metric ratio shows throttling?
+ Throttled periods to total periods
- CPU requests to limits :: No.
- Pods to nodes :: No.
- Disk to memory :: No.
> It shows the share of periods that were throttled.
```

```cards
CFS quota :: A kernel limit on CPU time per period
Throttling :: Pausing a container that used its CPU quota
Working set :: Memory in active use that counts toward limits
oom_score_adj :: A kernel setting that influences which process is killed
cgroup :: A kernel feature that limits and accounts for resources
```
