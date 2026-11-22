---
title: Virtual memory: page tables, huge pages, swap and pressure
minutes: 13
summary: Follow memory from a virtual address to a physical page: page faults, the page cache, transparent huge pages, swap behaviour and how to read memory pressure honestly.
---

Free memory is the wrong number to watch. Linux uses spare memory as cache on purpose, so the useful questions are how much can be reclaimed and how long tasks wait for it.

## What you will learn

- Virtual addresses, page tables and page faults
- The page cache and reclaim
- Transparent huge pages and explicit huge pages
- Swap, swappiness and zswap
- Memory pressure and what to alert on

## Addresses and faults

Each process sees its own virtual address space. The kernel maps pages to physical memory through page tables and fills them on demand. A minor page fault maps a page that is already in memory, and a major fault must read from disk. A rising rate of major faults means the working set no longer fits in memory.

## Cache and reclaim

Spare memory is used for the page cache, which holds file data. Clean cache can be dropped at once, so it counts as available. When memory is low, the kernel reclaims cache first and then anonymous pages by swapping them out. The MemAvailable value estimates how much can be used without swapping.

## Huge pages

Normal pages are 4 kilobytes. Huge pages of 2 megabytes reduce page table overhead and translation misses, which helps large heaps in databases and the Java virtual machine. Transparent huge pages try to do this automatically, but the background compaction can cause latency spikes, so some databases advise turning them off. Explicit huge pages are reserved ahead of time.

## Swap

Swap lets the kernel move rarely used anonymous pages out, which frees memory for cache. A little swap in use is normal. Heavy swapping while the system waits is the problem, shown by high swap in and out rates. The swappiness setting changes the balance between reclaiming cache and swapping. Compressed memory swap can reduce disk use.

## Pressure

Pressure stall information reports the share of time tasks stalled waiting for memory. Alert on sustained memory pressure, major fault rates and out of memory kills, not on low free memory. In Kubernetes, remember that page cache counts in the container memory figure but can be reclaimed.

```diagram
title: Virtual memory: page tables, huge pages, swap and pressure
node: proc | Process | 0 | 1 | Virtual pages. | Fault storm. | service
node: cache | Page cache | 1 | 1 | Reclaimable. | Dropped. | store
node: swap | Swap | 2 | 1 | Anonymous pages. | Thrash. | store
node: psi | Pressure signal | 3 | 1 | Stall time. | Ignored. | observe
edge: proc | cache
edge: cache | swap
edge: swap | psi
```

## Incident: The database that stalled every few minutes

> **Incident:** Query latency spiked for a few seconds at regular intervals on a database host with plenty of free memory.

```console
$ cat /sys/kernel/mm/transparent_hugepage/enabled
[always] madvise never
$ grep -E "thp_collapse_alloc|compact_stall" /proc/vmstat
thp_collapse_alloc 18211
compact_stall 4410
(this is a simulated illustration, not a real incident)
```

Transparent huge pages were set to always, and the kernel stalled the database while it compacted memory to build huge pages. The stall counters matched the latency spikes. The team set the mode to madvise as the database vendor recommends, reserved explicit huge pages for the shared buffer and watched the compaction stall counter. The spikes disappeared.

## Common mistakes

- Alerting on free memory instead of pressure
- Disabling swap with no plan for memory pressure
- Leaving transparent huge pages on for latency critical databases
- Confusing page cache with a leak
- Ignoring major page fault rates

```quiz
Q: What is a major page fault?
+ A fault that needs a read from disk
- A fault in the network :: No.
- A kernel panic :: No.
- A cache hit :: No.
> A rising rate means the working set does not fit.

Q: Why is low free memory often fine?
+ Linux uses spare memory for reclaimable cache
- Memory is broken :: No.
- Swap is full :: Not implied.
- The CPU is slow :: No.
> Look at MemAvailable and pressure.

Q: What risk do transparent huge pages bring?
+ Latency spikes from background compaction
- They disable swap :: No.
- They use no memory :: No.
- They encrypt pages :: No.
> Some databases advise madvise or never.

Q: What should you alert on for memory?
+ Sustained pressure, major faults and OOM kills
- Free memory only :: Misleading.
- Disk size :: Unrelated.
- Hostname :: Unrelated.
> They show real waiting.
```

```cards
Page table :: A map from virtual to physical memory
Page cache :: File data kept in spare memory
Huge page :: A larger memory page of two megabytes
Swap :: Disk space used to hold evicted memory pages
```
