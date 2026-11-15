---
title: The Kubernetes network model: pods, nodes and the CNI
minutes: 12
summary: State the four rules of the Kubernetes network model and trace how a pod gets an address and a route through the CNI.
---

Kubernetes does not implement networking itself. It defines rules that any network must satisfy and delegates the work to a plugin. Knowing the rules tells you what should be possible, which is what you need when something is not.

## What you will learn

- The rules every Kubernetes network must satisfy
- How the kubelet, the runtime and the CNI plugin create a pod network
- Pod CIDRs, node CIDRs and service CIDRs
- The three kinds of traffic: pod to pod, pod to service, outside to service

## The model

The network model has a few simple rules. Every pod gets its own IP address. Pods on any node can reach pods on any other node using those addresses, without network address translation. Agents on a node, such as the kubelet, can reach all pods on that node. Containers inside one pod share a network namespace and talk over localhost. Services add a stable virtual IP on top, and are a separate layer.

## How a pod gets its address

When the kubelet starts a pod, the container runtime creates a sandbox with a network namespace. The kubelet then calls the CNI plugin, a binary configured in `/etc/cni/net.d`, with the namespace and the pod identity. The plugin creates a virtual ethernet pair, puts one end in the pod and the other on the node, assigns an IP from the node pod range through IP address management, and sets up routes. When the pod is deleted, the plugin releases the address.

## Address ranges

Three ranges must not overlap with each other or with your real networks. The pod CIDR is where pod IPs come from, and each node usually receives a slice, a /24 by default with kubeadm. The service CIDR is where ClusterIPs come from and exists only as rules on nodes. The node network carries node addresses. Overlap with an office or cloud range is a common cause of unreachable destinations.

```bash
kubectl get nodes -o custom-columns=NAME:.metadata.name,PODCIDR:.spec.podCIDR
kubectl cluster-info dump | grep -m1 service-cluster-ip-range
ls /etc/cni/net.d
```

## Three kinds of traffic

Pod to pod traffic uses pod IPs directly and depends on the CNI. Pod to service traffic goes to a ClusterIP, which kube-proxy or an eBPF datapath rewrites to a pod IP. Traffic from outside enters through a NodePort, a load balancer or an ingress or gateway, and then reaches a service. Each kind has its own failure signature, so identify which one you are debugging first.

## A quick address check

```python
import ipaddress
pod = ipaddress.ip_network("10.244.0.0/16")
svc = ipaddress.ip_network("10.96.0.0/12")
node = ipaddress.ip_network("10.0.0.0/16")
print("pod/service overlap:", pod.overlaps(svc))
print("pod/node overlap:", pod.overlaps(node))
```

```diagram
title: The Kubernetes network model: pods, nodes and the CNI
node: kl | kubelet | 0 | 1 | Asks the runtime for a sandbox. | Runtime down. | service
node: rt | Runtime | 1 | 1 | Creates the namespace. | Sandbox error. | process
node: cni | CNI plugin | 2 | 1 | Wires and addresses. | No config file. | process
node: ipam | IPAM | 3 | 0 | Allocates the IP. | Range exhausted. | store
node: pod | Pod network | 3 | 2 | Veth, IP and routes. | Overlap. | service
edge: kl | rt
edge: rt | cni
edge: cni | ipam
edge: cni | pod
```

## Incident: A pod range that overlapped the office network

> **Incident:** Pods could not reach an internal database after the cluster was built.

```console
$ kubectl exec web-1 -- curl -s -m 3 10.244.5.20:5432
curl: (28) Connection timed out after 3001 milliseconds
$ ip route get 10.244.5.20
10.244.5.20 via 10.244.0.1 dev cni0
(this is a simulated illustration, not a real incident)
```

The database lived in an office network that used the same range as the pod CIDR, so the node routed traffic for it to a local bridge instead of the office gateway. Rebuilding with a non-overlapping pod range was the real fix. Choose address ranges before installing, because changing them later is painful.

## Common mistakes

- Choosing a pod CIDR that overlaps real networks
- Assuming Services have network interfaces
- Mixing up the service CIDR and the pod CIDR
- Installing two CNI plugins
- Forgetting that the CNI must exist before pods can start

```quiz
Q: Which rule belongs to the Kubernetes network model?
+ Pods can reach other pods on any node without NAT
- Pods share one IP :: Each pod has its own IP.
- Only pods in one namespace can talk :: No such restriction.
- Pods need a load balancer to talk :: They do not.
> Flat pod to pod reachability is a core rule.

Q: What does the CNI plugin do?
+ Configures a pod network interface, address and routes
- Schedules pods :: That is the scheduler.
- Pulls images :: That is the runtime.
- Issues certificates :: Not its job.
> The kubelet calls it when a pod starts.

Q: Where do ClusterIPs exist?
+ Only as rules on nodes, not on a network interface
- On the pod :: No.
- On a switch :: No.
- In etcd only :: They are programmed by kube-proxy.
> A ClusterIP is virtual.

Q: Why avoid overlapping ranges?
+ Routing becomes ambiguous and some destinations become unreachable
- It makes pods slower to start :: Not the issue.
- It uses more disk :: Not the issue.
- It blocks DNS only :: Not only DNS.
> Overlaps break routing.
```

```cards
CNI :: Container Network Interface, a standard for network plugins
Pod CIDR :: The address range pod IPs are taken from
Service CIDR :: The range ClusterIPs are taken from
IPAM :: IP address management that allocates pod addresses
Network namespace :: An isolated network stack used by a pod
```
