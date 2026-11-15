---
title: CNI plugins: overlays, routing and eBPF
minutes: 12
summary: Compare the main CNI designs, overlay encapsulation, native routing and eBPF dataplanes, and choose one with the trade-offs in mind.
---

Several CNI plugins satisfy the same network model in different ways. They differ in performance, in the features they add and in how you debug them. A choice made at cluster creation is hard to undo, so it is worth understanding the families.

## What you will learn

- Overlay and encapsulation
- Native routing with BGP or cloud routes
- eBPF dataplanes and what they replace
- Policy support and observability features
- How to choose

## Overlay networks

An overlay wraps pod packets inside packets between nodes, commonly with VXLAN or Geneve. It works over almost any underlying network, because the nodes only need to reach each other. The cost is a small overhead per packet, a lower effective MTU and an extra layer to debug. Flannel with VXLAN is a simple example.

## Native routing

A routed design gives pods addresses that the underlying network can route. Nodes advertise their pod ranges with BGP, as in Calico or Cilium in routing mode, or the cloud provider programs routes. There is no encapsulation, so performance is closer to the host network, and tools such as traceroute show the real path. It needs a network that cooperates, or cloud integration.

## eBPF dataplanes

eBPF lets a plugin attach small verified programs to kernel hooks. Cilium uses it to implement forwarding, service load balancing and policy without long iptables chains, and can replace kube-proxy. Benefits are scale and visibility, with identity based policy and flow observability. The costs are kernel version requirements and a new way to debug.

## Features to compare

Compare support for NetworkPolicy and any extensions, encryption between nodes, observability of flows, IPv6 and dual stack, multi-cluster connectivity, maximum cluster size and operational maturity. Check that the plugin supports your environment, for example a managed cloud with its own CNI.

```bash
kubectl get pods -n kube-system -o wide | grep -E "calico|cilium|flannel|weave"
ip -d link show | grep -E "vxlan|geneve" | head -3
ip route | head
```

## Choosing

Start with requirements: network policy, scale, encryption, the base platform. A small lab can use a simple overlay. A production cluster usually wants policy support and good observability, which points to Calico or Cilium. Run the choice through a test in your environment before you commit, and plan how you will upgrade the plugin, since it runs on every node.

```diagram
title: CNI plugins: overlays, routing and eBPF
node: ov | Overlay | 0 | 1 | VXLAN or Geneve. | MTU too large. | process
node: rt | Native routing | 1 | 1 | BGP or cloud routes. | Network refuses routes. | process
node: ebpf | eBPF dataplane | 2 | 1 | Kernel programs. | Old kernel. | process
node: pol | Policy | 3 | 1 | Enforced by the plugin. | Plugin without support. | security
node: obs | Observability | 4 | 1 | Flow visibility. | Not enabled. | observe
edge: ov | rt
edge: rt | ebpf
edge: ebpf | pol
edge: pol | obs
```

## Incident: Large responses that hung

> **Incident:** Small requests worked, but any response over a certain size stalled between pods on different nodes.

```console
$ kubectl exec web-1 -- ping -c1 -M do -s 1472 10.244.2.9
ping: local error: message too long, mtu=1450
$ ip link show vxlan.calico | grep mtu
mtu 1450
(this is a simulated illustration, not a real incident)
```

The overlay added headers, so the pod interface MTU was 1450, but the application tested paths with a larger size and relied on path MTU discovery that a firewall dropped. Small packets passed, and large ones stalled. Setting a consistent MTU across node and pod interfaces and allowing the relevant ICMP messages fixed it. Overlay overhead is a classic cause of "works for small requests" faults.

## Common mistakes

- Ignoring MTU with overlays
- Choosing a plugin without policy support when you need policy
- Replacing the CNI on a running cluster casually
- Running an eBPF plugin on an unsupported kernel
- Not planning plugin upgrades

```quiz
Q: What does an overlay network do?
+ Encapsulates pod packets inside node to node packets
- Removes the need for IPs :: Pods still have IPs.
- Encrypts everything by default :: Not by default.
- Replaces DNS :: No.
> It works over most underlying networks.

Q: What is a trade-off of VXLAN?
+ Packet overhead and a lower effective MTU
- It cannot carry TCP :: It can.
- It requires BGP :: It does not.
- It needs IPv6 only :: It does not.
> Headers reduce the payload size.

Q: What can an eBPF dataplane replace?
+ kube-proxy and long iptables chains
- The kubelet :: No.
- etcd :: No.
- The scheduler :: No.
> Cilium can handle service load balancing itself.

Q: Why test a CNI choice before committing?
+ It runs on every node and is hard to change later
- It is free :: Not the reason.
- It is always the same :: They differ.
- It has no config :: It has.
> Switching later is disruptive.
```

```cards
Overlay :: A virtual network built by encapsulating packets
VXLAN :: An encapsulation protocol common in overlays
BGP :: A routing protocol used to advertise pod ranges
eBPF :: Kernel level programs used for networking and observability
MTU :: The largest packet size an interface will send
```
