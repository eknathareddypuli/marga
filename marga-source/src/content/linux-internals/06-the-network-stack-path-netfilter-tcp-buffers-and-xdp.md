---
title: The network stack path: netfilter, TCP buffers and XDP
minutes: 13
summary: Follow a packet through the kernel: the driver, netfilter hooks and nftables rules, conntrack, TCP buffers and congestion control, and early processing with XDP.
---

Packet loss and slow connections often hide in a table that filled up or a buffer that was too small. Knowing the path tells you which counter to read.

## What you will learn

- The path from the card to the socket
- netfilter hooks, nftables and conntrack
- TCP buffers, windows and congestion control
- Drops: where they happen and which counter shows them
- XDP and eBPF for early packet handling

## The path

A packet arrives at the network card, which writes it to a receive ring in memory and raises an interrupt. The driver and the network stack process it in softirq, passing it through routing and filtering to a socket buffer, where the application reads it. On the way out the steps reverse. A drop can occur at the ring, in a filter, in the connection table or at the socket.

## netfilter and conntrack

Netfilter provides hooks where rules can accept, drop or change packets, and nftables is the current rule language. Connection tracking records the state of each flow so that rules and address translation work. The table has a maximum size, and when it is full new connections are dropped with a log message. Services doing many short connections fill it quickly.

## TCP buffers

Each socket has send and receive buffers. The receive window tells the sender how much it may send, and a small buffer limits throughput on a path with high latency. The bandwidth delay product gives the buffer size needed. Auto tuning usually handles it, but limits set too low in sysctl can hold speed down.

## Congestion control

The congestion algorithm decides how fast a sender grows and shrinks its rate. Cubic is the common default, and BBR estimates bandwidth and delay and can do better on lossy or long paths. Retransmissions and a growing send queue visible in ss show problems. Change the algorithm only with measurements and for a clear path.

## XDP and eBPF

XDP runs a small verified program at the earliest point in the driver, before the full stack allocates buffers. It can drop, redirect or count packets at very high rates, which suits denial of service filtering and load balancing. It needs driver support and careful testing, and its programs are managed like code.

```diagram
title: The network stack path: netfilter, TCP buffers and XDP
node: nic | Card and driver | 0 | 1 | Ring buffer. | Ring full. | external
node: nf | netfilter and conntrack | 1 | 1 | Rules and state. | Table full. | security
node: tcp | TCP socket | 2 | 1 | Buffers and window. | Small buffer. | service
node: xdp | XDP program | 3 | 1 | Early drop. | Bad filter. | process
edge: nic | nf
edge: nf | tcp
edge: tcp | xdp
```

## Incident: New connections dropped at random

> **Incident:** A proxy host dropped about one in twenty new connections during peak traffic.

```console
$ dmesg | grep -i conntrack | tail -2
nf_conntrack: table full, dropping packet
$ cat /proc/sys/net/netfilter/nf_conntrack_count /proc/sys/net/netfilter/nf_conntrack_max
262113
262144
(this is a simulated illustration, not a real incident)
```

The connection tracking table was full, because the proxy opened many short outbound connections and kept entries for a long timeout. The kernel dropped packets for new flows. The team raised the maximum with a matching memory check, shortened the timeouts for closed connections, reused upstream connections and added an alert when the table passed eighty percent.

## Common mistakes

- Ignoring conntrack table usage
- Changing congestion control without measuring
- Buffers too small for high latency paths
- Many short connections with no reuse
- Using XDP without a rollback plan

```quiz
Q: What happens when conntrack is full?
+ New flows are dropped
- Nothing :: Wrong.
- Disk fills :: No.
- CPU speeds up :: No.
> The log says table full.

Q: What decides the buffer size needed?
+ The bandwidth delay product of the path
- The hostname :: No.
- The file system :: No.
- The CPU model :: No.
> Long paths need larger windows.

Q: What does XDP allow?
+ Very early packet handling in the driver
- Disk encryption :: No.
- Process scheduling :: No.
- DNS caching :: No.
> It can drop packets before the stack.

Q: How can short connections be reduced?
+ Reuse connections with keep alive or pooling
- Open more :: Worse.
- Disable TCP :: No.
- Lower the MTU :: No.
> Fewer flows mean fewer conntrack entries.
```

```cards
conntrack :: The kernel table of connection states
nftables :: The current Linux packet filtering framework
Receive window :: How much data a receiver accepts
XDP :: A fast packet hook in the network driver
```
