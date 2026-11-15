---
title: Designing a highly available control plane
minutes: 12
summary: Choose between stacked and external etcd topologies, place a load balancer in front of the API servers, and plan failure domains for a highly available cluster.
---

A single control plane node is a single point of failure for every change in the cluster. High availability means running several control plane nodes so that the loss of one does not stop operations. The design choices are few but each has consequences for cost, failure tolerance and recovery.

## What you will learn

- Stacked and external etcd topologies
- Why three control plane nodes is the common minimum
- The load balancer and the control plane endpoint
- Failure domains and zone placement
- What high availability does not protect

## Stacked or external etcd

In a stacked topology each control plane node runs etcd as a static pod next to the API server, scheduler and controller manager. It needs fewer machines and is simple to operate with kubeadm. The cost is coupling: losing a node loses an API server and an etcd member together. In an external topology etcd runs on its own nodes. It separates failure domains and lets you size and secure etcd independently, at the price of more machines to manage.

## Why three

Raft needs a majority, so one member gives no tolerance, two gives none either, and three tolerates one failure. Three control plane nodes is therefore the usual minimum for production. Five tolerates two failures and suits very large or critical clusters, but adds write latency because more members must acknowledge.

## The control plane endpoint

Nodes and users must reach any healthy API server through one stable address. A load balancer or a virtual IP in front of the API servers provides it, and it is given to kubeadm as the control plane endpoint. Health checks should test the API server port or its /readyz, and the load balancer itself must not become a single point of failure. Kubeconfig files and kubelets use this endpoint, so it is hard to change later.

## Failure domains

Spread control plane nodes across failure domains such as availability zones or racks, so that one zone failing leaves a majority. With three nodes put one in each of three zones. Two zones are worse than they look, because losing the zone that holds two members loses quorum. Keep network latency between members low, since etcd commits depend on it.

## What HA does not cover

Several control plane nodes do not protect against a bad upgrade applied to all of them, a mistaken delete, corrupted data replicated to every member, or loss of the whole site. Those need tested backups and a recovery plan, covered later in this module. Workers are separate: run enough of them in several zones.

```bash
kubeadm init --control-plane-endpoint "k8s-api.example.internal:6443" --upload-certs --pod-network-cidr=10.244.0.0/16
```

```diagram
title: Designing a highly available control plane
node: lb | Load balancer | 0 | 1 | One stable API endpoint. | Single instance. | service
node: c1 | Control plane A | 1 | 0 | API, etcd member. | Zone outage. | service
node: c2 | Control plane B | 1 | 1 | API, etcd member. | Zone outage. | service
node: c3 | Control plane C | 1 | 2 | API, etcd member. | Zone outage. | service
node: w | Workers | 2 | 1 | Run workloads. | Too few zones. | process
edge: lb | c1
edge: lb | c2
edge: lb | c3
edge: c2 | w
```

## Incident: Two zones, one of them lost

> **Incident:** A cluster with three control plane nodes in two zones lost the zone that held two of them.

```console
$ kubectl get nodes
Unable to connect to the server: net/http: TLS handshake timeout
$ etcdctl endpoint health --endpoints=https://10.0.1.5:2379
https://10.0.1.5:2379 is unhealthy: failed to commit proposal: context deadline exceeded
(this is a simulated illustration, not a real incident)
```

Two of three etcd members were in the zone that failed, so quorum was lost and the remaining API server could not serve requests. Placing one node in each of three zones would have left a majority. The team restored quorum by recovering a lost member, then moved a node to a third zone. Count members per failure domain, not only nodes in total.

## Common mistakes

- Using two control plane nodes and calling it highly available
- Putting two members in the same failure domain of three
- Using a single load balancer instance
- Choosing the control plane endpoint casually
- Treating HA as a replacement for backups

```quiz
Q: How many control plane nodes is a common production minimum?
+ Three
- One :: One tolerates no failure.
- Two :: Two has no failure tolerance in Raft.
- Four :: Even counts add cost without tolerance.
> Three members give a majority of two.

Q: What is a drawback of stacked etcd?
+ Losing a node loses an API server and an etcd member together
- It cannot use kubeadm :: kubeadm supports it.
- It needs no network :: It does.
- It is slower to start :: It is not.
> Failure domains are coupled.

Q: Why do kubelets use a load balancer endpoint?
+ So they reach any healthy API server through one stable address
- To encrypt traffic only :: TLS does that.
- To store pods :: It does not store.
- To run controllers :: It does not.
> The endpoint hides which node is up.

Q: What does HA not protect against?
+ A bad change replicated to all control plane nodes
- A single node failing :: HA protects against that.
- A zone losing one node :: A majority remains.
- A kubelet restart :: That is routine.
> You still need backups and careful rollout.
```

```cards
Stacked etcd :: etcd running on the control plane nodes
External etcd :: etcd running on dedicated nodes
Control plane endpoint :: The stable address clients use to reach the API servers
Failure domain :: A set of resources that fail together, such as a zone
Quorum :: A majority of etcd members
```
