---
title: Requests, limits and QoS classes
minutes: 12
summary: Know what requests and limits mean to the scheduler and the kernel, and how they define the Guaranteed, Burstable and BestEffort QoS classes.
---

Every container can declare how much CPU and memory it needs and how much it may use. Those two numbers are read by different components for different purposes, and getting them wrong is the most common cause of both wasted money and unexpected restarts.

## What you will learn

- The difference between a request and a limit
- How the scheduler uses requests and the kernel uses limits
- CPU units and memory units
- QoS classes and their eviction order
- How to set sensible values

## Request and limit

A request is the amount the container is guaranteed and what the scheduler reserves when it places the pod. A limit is the most it may use. CPU is measured in cores, with `500m` meaning half a core. Memory is in bytes, written as `256Mi` or `1Gi`. Requests above what any node can offer make the pod unschedulable.

## Who enforces what

The scheduler sums requests of pods on a node and compares them to the node allocatable resources. It never looks at actual usage. At runtime the kernel enforces limits through cgroups. CPU is compressible: a container at its CPU limit is throttled, not killed. Memory is not: a container that exceeds its memory limit is killed by the out-of-memory killer and restarted.

## QoS classes

The kubelet assigns every pod a quality of service class from its requests and limits. Guaranteed means every container has both CPU and memory, with requests equal to limits. Burstable means at least one request or limit is set but the pod is not Guaranteed. BestEffort means nothing is set. Under node memory pressure, the kubelet evicts BestEffort pods first, then Burstable pods using more than their requests, and Guaranteed pods last.

```bash
kubectl get pod web-1 -o jsonpath='{.status.qosClass}{"\n"}'
kubectl describe node worker-1 | sed -n '/Allocated resources/,/Events/p'
```

## Setting values

Start from measurement. Look at real usage over a representative period, and set the request near typical or percentile usage and the memory limit with headroom above the peak. Many teams set memory request equal to limit for predictability and leave CPU limits unset or generous to avoid throttling. Latency sensitive and critical pods suit Guaranteed.

```yaml
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    memory: 512Mi
```

## A quick calculation

```python
node_alloc_cpu = 3.8
req = {"web": 0.25, "api": 0.5, "cache": 1.0}
replicas = {"web": 4, "api": 3, "cache": 1}
used = sum(req[k] * replicas[k] for k in req)
print("requested:", used, "of", node_alloc_cpu, "free:", round(node_alloc_cpu - used, 2))
```

```diagram
title: Requests, limits and QoS classes
node: spec | Container spec | 0 | 1 | Requests and limits. | Missing values. | store
node: sch | Scheduler | 1 | 0 | Reserves requests. | Overcommitted. | process
node: cg | cgroups | 1 | 2 | Enforce limits. | Throttle or OOM. | process
node: qos | QoS class | 2 | 1 | Sets eviction order. | BestEffort. | observe
edge: spec | sch
edge: spec | cg
edge: cg | qos
```

## Incident: OOMKilled with plenty of node memory

> **Incident:** A pod restarted every few hours while the node showed large free memory.

```console
$ kubectl describe pod api-5c7d | grep -A4 "Last State"
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
$ kubectl get pod api-5c7d -o jsonpath='{.spec.containers[0].resources.limits.memory}'
256Mi
(this is a simulated illustration, not a real incident)
```

The memory limit applies per container, not per node. The application grew beyond 256 MiB during a batch job and the kernel killed it at its cgroup limit, regardless of free node memory. Raising the limit to match measured peaks plus headroom stopped the restarts, and a graph of container memory against its limit was added. Exit code 137 with OOMKilled is the signature.

## Common mistakes

- Setting no requests at all
- Setting limits far above requests everywhere
- Setting memory limits below real peak usage
- Expecting CPU limits to kill containers
- Ignoring QoS when a node is under pressure

```quiz
Q: What does the scheduler use to place a pod?
+ Requests
- Limits :: Limits are enforced at runtime.
- Actual usage :: It does not look at usage.
- Pod age :: No.
> It reserves requested resources on a node.

Q: What happens when a container exceeds its CPU limit?
+ It is throttled
- It is killed :: That is memory.
- It is deleted :: No.
- The node reboots :: No.
> CPU is compressible.

Q: What happens when it exceeds its memory limit?
+ It is OOM killed and restarted
- It is throttled :: That is CPU.
- Nothing :: It is killed.
- It moves nodes :: No.
> Exit code 137 and OOMKilled.

Q: Which pods are evicted first under memory pressure?
+ BestEffort
- Guaranteed :: Last.
- System pods :: They are protected.
- Burstable below request :: Later than BestEffort.
> Eviction follows QoS and usage over request.
```

```cards
Request :: The amount of a resource reserved for a container
Limit :: The maximum a container may use
OOMKilled :: A container killed for exceeding its memory limit
QoS class :: Guaranteed, Burstable or BestEffort, derived from requests and limits
Millicore :: One thousandth of a CPU core
```
