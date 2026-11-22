---
title: The CPU scheduler, run queues, NUMA and pinning
minutes: 13
summary: Understand how Linux decides what runs where: run queues and load, scheduling classes, interrupts, NUMA memory placement and when CPU pinning helps or hurts.
---

A server with free CPU can still be slow because the work is on the wrong cores, the memory is on the wrong socket or interrupts are fighting the application. These are scheduler and topology problems.

## What you will learn

- Run queues, load average and what they count
- Scheduling classes, priorities and nice values
- Interrupts and softirq on the same cores
- NUMA: local and remote memory
- Pinning, isolation and when to avoid it

## Run queues and load

Each CPU has a queue of runnable tasks. The load average counts tasks that are runnable or in uninterruptible sleep, so a high load can mean CPU contention or blocked disk waits. Compare it with CPU use, the run queue length from vmstat and the pressure information to decide which one it is.

## Classes and priority

Normal tasks use the fair scheduler, which shares CPU by weight, and nice values change the weight. Real time classes run before normal tasks and can starve them, so use them with care. Container CPU requests become weights, so a busy node divides time in proportion to requests.

## Interrupts

Network cards and disks raise interrupts that are handled on some cores. If all network interrupts land on one core, that core can saturate while others idle, and softirq time shows high in the CPU breakdown. Receive side scaling and interrupt affinity spread the work across cores.

## NUMA

On a multi socket server, each socket has local memory, and access to the other socket is slower. A process that runs on one socket but has its memory on another pays that cost on every access. Tools such as numactl and numastat show placement. Databases and in memory caches are most sensitive to this.

## Pinning

Pinning a process to specific cores, or isolating cores from the general scheduler, reduces jitter for latency critical work such as packet processing. It also prevents the scheduler from using idle cores, so a pinned job can wait while others sit idle. Measure before and after, and avoid pinning general purpose services.

```diagram
title: The CPU scheduler, run queues, NUMA and pinning
node: task | Runnable tasks | 0 | 1 | Queue per core. | Pile up. | process
node: sched | Scheduler | 1 | 1 | Weights. | Starved. | process
node: irq | Interrupt handling | 2 | 1 | One core busy. | Skewed. | service
node: numa | NUMA memory | 3 | 1 | Local access. | Remote. | store
edge: task | sched
edge: sched | irq
edge: irq | numa
```

## Incident: One busy core, fifteen idle

> **Incident:** Network throughput stopped growing on a fast server although total CPU use was low.

```console
$ mpstat -P ALL 1 1 | sort -k12 -n | head -3
Average:   3    0.00    0.00    1.00    0.00    9.00   88.00    0.00    0.00    0.00    2.00
$ grep eth0 /proc/interrupts | head -2
 64:  91823442   0   0   0   IR-PCI-MSI eth0-TxRx-0
(this is a simulated illustration, not a real incident)
```

All interrupts for the network card were handled by core zero, which spent nearly all its time in softirq while other cores idled. The packet rate was limited by that single core. The team enabled multiple receive queues, spread their interrupt affinity across cores on the same NUMA node as the card and confirmed that throughput scaled with the number of queues.

## Common mistakes

- Reading load average as CPU use only
- Ignoring softirq time in the CPU breakdown
- Running memory heavy services across sockets without checking
- Pinning general services to cores
- Using real time priority to fix a slow service

```quiz
Q: What does load average include?
+ Runnable tasks and tasks in uninterruptible sleep
- Only network packets :: No.
- Only memory use :: No.
- Disk size :: No.
> High load can be a disk wait.

Q: Why does NUMA matter?
+ Memory on another socket is slower to access
- It encrypts memory :: No.
- It adds swap :: No.
- It changes the CPU model :: No.
> Keep memory and threads together.

Q: How do you spread network interrupts?
+ Use multiple queues and set interrupt affinity
- Add RAM :: Not the fix.
- Disable the NIC :: No.
- Raise nice values :: No.
> One core can limit the whole rate.

Q: What is a risk of pinning?
+ A job may wait while other cores are idle
- It speeds everything :: Not always.
- It removes interrupts :: No.
- It adds memory :: No.
> The scheduler cannot use idle cores for it.
```

```cards
Run queue :: The list of tasks waiting to run on a CPU
Softirq :: Deferred kernel work such as packet processing
NUMA :: Memory that is local to a CPU socket
CPU affinity :: A restriction on which cores a task may use
```
