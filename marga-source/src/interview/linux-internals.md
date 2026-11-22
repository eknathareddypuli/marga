## Why can a container be throttled when the node is idle?
level: mid
The CPU limit is a quota per period for the cgroup. If many threads use it up in a few milliseconds, all of them pause until the next period. The cpu.stat counters show it, and raising the limit or reducing threads fixes it.

## How do you read memory honestly?
level: mid
I do not look at free memory. I read MemAvailable, major fault rates, swap in and out and the pressure stall information, because Linux uses spare memory as cache and the real signal is time spent waiting.

## What are NUMA effects?
level: senior
On multi socket servers memory attached to the other socket is slower. A process whose threads and memory are on different sockets pays on every access, so I check numastat and keep latency sensitive services together with their memory.

## How does a write become durable?
level: mid
A normal write lands in the page cache as a dirty page, the kernel writes it back later and fsync waits until the device confirms. Databases use fsync for commits, so its latency and queue depth matter.

## What makes a container different from a process?
level: mid
A container is an ordinary process in new namespaces and cgroups with an overlay root file system, a reduced capability set and a seccomp filter. Each restriction can be inspected and explains a class of permission errors.

## How do you debug dropped packets?
level: senior
I follow the path: ring buffer, softirq, netfilter and conntrack, socket buffers. I read the counters at each step, such as the conntrack count against its maximum, interface drops and socket queue sizes, instead of guessing.
