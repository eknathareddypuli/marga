---
title: The block layer: NVMe queues, schedulers and io_uring
minutes: 13
summary: Follow a write from the page cache to a device: writeback, the block layer, IO schedulers, NVMe queues, fsync cost and the asynchronous io_uring interface.
---

Disk latency is often the real cause of slow services, and the average hides it. Knowing the path from application write to durable storage explains most storage surprises.

## What you will learn

- Buffered writes, dirty pages and writeback
- fsync and what durability costs
- The block layer, schedulers and queue depth
- NVMe multi queue design
- io_uring and asynchronous IO

## Buffered writes

A normal write goes into the page cache and returns quickly. The page is marked dirty, and the kernel writes it out later in the background. If the application crashes the data is safe in the cache, but if the machine loses power it can be lost. Limits on dirty memory force writers to wait when the device cannot keep up.

## fsync

An fsync call asks for the data to reach stable storage and waits for the device to confirm. It is what databases use for durability, and its latency is what users feel at commit time. Many small fsync calls are slow on devices without a power protected cache. Group commits reduce the number of calls.

## Block layer and schedulers

The block layer turns file system requests into device requests, merges adjacent ones and orders them. For spinning disks a scheduler that sorts by position helps. For fast flash devices, the none or a light scheduler is usual, because the device handles ordering itself. Choose per device and measure.

## NVMe queues

NVMe devices have many hardware queues, and Linux maps them to CPUs so that submission does not take a shared lock. A deep queue gives high throughput, but also long waits for a request that arrives behind others. Latency under load, not peak throughput, matters for interactive services. Watch the queue depth and wait time with iostat.

## io_uring

io_uring gives applications a pair of shared ring buffers to submit many IO requests and collect results with few system calls. It supports files, sockets and more, and can cut overhead for fast devices. It also widens the kernel attack surface, so some environments restrict it. Check that your runtime and security policy agree.

```diagram
title: The block layer: NVMe queues, schedulers and io_uring
node: app | Application write | 0 | 1 | Buffered. | Lost on crash. | service
node: wb | Writeback | 1 | 1 | Dirty pages. | Throttle. | process
node: blk | Block layer | 2 | 1 | Queues. | Deep wait. | process
node: dev | NVMe device | 3 | 1 | Durable. | Slow fsync. | store
edge: app | wb
edge: wb | blk
edge: blk | dev
```

## Incident: Commits that took a second

> **Incident:** A database showed slow commits while the average disk utilisation looked low.

```console
$ iostat -x 1 2 | tail -4
Device  r/s   w/s  await  aqu-sz  %util
nvme0n1 120   950  38.20  36.40   64.00
(this is a simulated illustration, not a real incident)
```

The average utilisation looked acceptable, but the await value of thirty eight milliseconds and a queue of thirty six requests showed that writes waited behind a large background job that wrote at full speed. The team limited the job with the io controller, moved its output to another device and set an alert on await and queue depth. Commit latency fell to a few milliseconds.

## Common mistakes

- Judging a disk by utilisation alone
- Ignoring await and queue size
- Running heavy batch writes beside a database
- Assuming buffered write means durable
- Enabling io_uring without checking the security policy

```quiz
Q: What does fsync guarantee?
+ That data reached stable storage
- That the file is compressed :: No.
- That the CPU is idle :: No.
- That the network works :: No.
> It waits for device confirmation.

Q: Why look at await and queue size?
+ They show waiting that utilisation hides
- They show disk size :: No.
- They show file names :: No.
- They show users :: No.
> Latency matters more than average use.

Q: What is io_uring?
+ Shared ring buffers for submitting IO with few system calls
- A file system :: No.
- A network card :: No.
- A scheduler class :: No.
> It reduces overhead for fast devices.

Q: How can a background job hurt a database?
+ It fills device queues and delays commits
- It uses no disk :: Wrong.
- It lowers latency :: Wrong.
- It frees memory :: Not the point.
> Limit and separate heavy writers.
```

```cards
Writeback :: Background writing of dirty pages to disk
fsync :: A call that waits for data to reach stable storage
Queue depth :: The number of requests waiting at a device
io_uring :: An asynchronous IO interface using ring buffers
```
