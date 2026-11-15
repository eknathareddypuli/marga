---
title: Debugging Kubernetes networking
minutes: 13
summary: Use a fixed order to find network faults: identify the traffic type, test layer by layer, and use the right tools from inside the cluster.
---

Network faults are easy to chase in circles. A fixed method, working from the symptom to the layer, saves time and works in an exam as well as in production.

## What you will learn

- Name the traffic type and the exact failing hop
- A layered checklist: DNS, Service, endpoints, pod, policy, node
- Tools: ephemeral debug containers, nicolaka netshoot, tcpdump, conntrack
- Reading conntrack and kube-proxy rules
- A worked sequence

## Start with the question

Say precisely what fails: from which pod to which name and port, and what error you see. Connection refused means something answered with a reset, usually no listener. A timeout means packets are dropped or lost, so look at policy, routing or the endpoint being gone. Name resolution errors mean DNS. A TLS error is above the network.

## The layered order

Test in this order and stop at the first failure. One, can the client resolve the name. Two, does the Service exist with the right port and selector. Three, does it have ready endpoints. Four, can you reach a pod IP directly, which bypasses the Service. Five, does a policy block the flow. Six, is the node level path healthy: routes, kube-proxy rules, conntrack and MTU.

```bash
kubectl exec client -- nslookup web.shop
kubectl get svc,endpointslices -n shop
kubectl exec client -- curl -s -m 3 http://10.244.2.9:8080/healthz
kubectl get networkpolicy -n shop
```

## Tools in the cluster

A minimal image often has no tools. Use an ephemeral debug container to attach to a running pod, or run a toolbox pod such as netshoot with curl, dig, tcpdump and ss. Debug on the same node as the failing pod when node level behaviour matters.

```bash
kubectl debug -it web-1 --image=nicolaka/netshoot --target=app
kubectl run tools --image=nicolaka/netshoot --restart=Never -- sleep 3600
```

## Node level checks

On the node, `ip route` shows pod routes, `ss -tnp` shows listeners, `iptables-save | grep KUBE-SVC` shows Service chains, and `conntrack -S` shows table statistics. A full conntrack table or insert failures cause random connection errors under load. UDP DNS traffic is a common victim.

## A worked sequence

A pod times out calling `cart`. Name resolves, the Service has a ClusterIP, endpoints are empty, the selector says app=cart and the pods say app=cart-api. The fix is the selector. If endpoints had been present, the next test would have been a direct call to a pod IP, then policy, then the node. The method is the same each time.

```diagram
title: Debugging Kubernetes networking
node: sym | Symptom | 0 | 1 | Refused or timed out? | Vague. | observe
node: dns | DNS | 1 | 1 | Name resolves. | ndots, CoreDNS. | process
node: svc | Service and endpoints | 2 | 1 | Ports and backends. | Selector. | process
node: pol | Policy and routes | 3 | 1 | Allowed and routed. | Silent drops. | security
node: node | Node and conntrack | 4 | 1 | Rules and tables. | Table full. | process
edge: sym | dns
edge: dns | svc
edge: svc | pol
edge: pol | node
```

## Incident: Random resets under load

> **Incident:** A busy service had random connection failures that no policy or Service change explained.

```console
$ sudo conntrack -S | head -3
cpu=0 found=912 invalid=3 insert=4410 insert_failed=1873 drop=1873
$ sudo sysctl net.netfilter.nf_conntrack_max net.netfilter.nf_conntrack_count
net.netfilter.nf_conntrack_max = 131072
net.netfilter.nf_conntrack_count = 131060
(this is a simulated illustration, not a real incident)
```

The connection tracking table was full, so new connections were dropped at random. Raising nf_conntrack_max, reducing short lived connections with keepalives and moving DNS to a node local cache fixed the faults. When symptoms are random and load dependent, check node level tables before changing application settings.

## Common mistakes

- Skipping the Service and endpoint checks
- Testing only from a laptop
- Changing several things at once
- Assuming a timeout is the same as a refusal
- Ignoring node level limits such as conntrack

```quiz
Q: What does connection refused usually mean?
+ Something answered with a reset, often no listener on the port
- Packets were dropped :: That is a timeout.
- DNS failed :: That is a resolution error.
- TLS failed :: That is later.
> Refusals come from the destination or a reset.

Q: What is a fast way to bypass a Service in a test?
+ Call a pod IP directly
- Restart kube-proxy :: Not a test.
- Delete the Service :: Destructive.
- Change DNS :: Not a test.
> It splits Service faults from pod faults.

Q: How do you get tools into a pod with a minimal image?
+ Attach an ephemeral debug container
- Rebuild the image in production :: Slow and risky.
- SSH to the pod :: Not supported.
- Reboot the node :: Not needed.
> kubectl debug adds a container to the pod.

Q: What can cause random connection drops under load?
+ A full conntrack table
- A new Secret :: No.
- An unused ConfigMap :: No.
- A label :: No.
> Check conntrack statistics.
```

```cards
Ephemeral container :: A temporary container added to a running pod for debugging
netshoot :: A container image with many network tools
conntrack :: The kernel table that tracks connections
tcpdump :: A tool to capture packets
Connection refused :: A reset in answer to a connection attempt
```
