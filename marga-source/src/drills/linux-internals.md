## Slow with idle CPUs
level: mid
A container is slow although the node is mostly idle.

```text
$ grep -E "nr_throttled|throttled_usec" /sys/fs/cgroup/cpu.stat
nr_throttled 88211
throttled_usec 40123311
```
? What explains it?
+ The container used its CPU quota and was paused
- The disk is full
- The kernel is old
why: Throttling is per cgroup, not per node. The matching lesson explains the reasoning in more detail.

## One core at the limit
level: mid
Network throughput stops growing and one core is full.

```text
$ grep eth0 /proc/interrupts | head -2
 64: 91823442 0 0 0 IR-PCI-MSI eth0-TxRx-0
```
? What should change?
+ Spread interrupts over several queues and cores
- Add RAM
- Lower nice values
why: All interrupts land on one core. The matching lesson explains the reasoning in more detail.

## Periodic database stalls
level: senior
Query latency spikes every few minutes with free memory available.

```text
$ cat /sys/kernel/mm/transparent_hugepage/enabled
[always] madvise never
```
? What is a likely cause?
+ Transparent huge page compaction pauses
- A DNS failure
- A bad index only
why: Use madvise or never for latency critical databases.

## Slow commits on NVMe
level: senior
Disk utilisation is moderate but commits are slow.

```text
$ iostat -x 1 2 | tail -2
nvme0n1 120 950 38.20 36.40 64.00
```
? What does the data show?
+ Requests wait in a deep queue behind a heavy writer
- The disk is idle
- The CPU is the limit
why: High await and queue size show waiting. The matching lesson explains the reasoning in more detail.

## Operation not permitted as root
level: mid
A container running as root cannot read performance counters.

```text
$ grep -E "CapEff|Seccomp" /proc/self/status
CapEff: 00000000a80425fb
Seccomp: 2
```
? What do you check?
+ Missing capability and the seccomp profile
- The hostname
- The image name
why: Root in a container is limited by capabilities and filters.

## Random dropped connections
level: mid
About one in twenty new connections fails on a proxy.

```text
$ dmesg | grep -i conntrack | tail -1
nf_conntrack: table full, dropping packet
```
? What is the fix?
+ Reduce short connections and tune the table and timeouts with monitoring
- Reboot daily
- Disable TLS
why: A full table drops new flows. The matching lesson explains the reasoning in more detail.
