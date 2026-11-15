---
title: The scheduler: filtering, scoring and binding
minutes: 12
summary: See how the scheduler picks a node: the queue, filter and score plugins, preemption and binding, and how to read why a pod stays Pending.
---

The scheduler has one job: assign each unscheduled pod to a node. It does this in a predictable cycle, and every decision leaves evidence in pod events. Once you know the stages, a Pending pod stops being mysterious.

## What you will learn

- The scheduling queue and the cycle of filter, score and bind
- What the main filter and score plugins check
- Preemption and priority
- Scheduler profiles and extension points
- Reading FailedScheduling events

## The cycle

Pods without a node name enter a queue ordered by priority. For each pod the scheduler runs a scheduling cycle. First, filtering removes nodes that cannot run the pod. Second, scoring ranks the remaining nodes. The best node is chosen, with ties broken at random. Finally, a binding cycle writes the node name into the pod through the API server, and the kubelet on that node takes over.

## Filtering

Filter plugins check hard constraints. NodeResourcesFit checks that requests fit the free capacity, NodeAffinity and NodeSelector check labels, TaintToleration checks taints, VolumeBinding checks that claims can be satisfied and PodTopologySpread checks skew limits. A node that fails any filter is out. If every node is filtered out the pod stays Pending and the scheduler records an event that counts the reasons.

## Scoring

Score plugins rank nodes by preference, for example spreading pods across nodes, favouring nodes that already have the image, or balancing resource use. Scores are weighted and summed. Scoring cannot rescue a pod that failed filtering, it only chooses between valid nodes.

## Preemption

If no node fits and the pod has a higher priority than some running pods, the scheduler can choose a node where evicting lower priority pods would make room. It marks the victims for deletion and records a nominated node for the new pod. Priority classes control this, and critical system pods use very high priorities.

## Profiles and extension

The scheduling framework exposes extension points such as filter, score and bind. A scheduler configuration file can enable or disable plugins and set weights, and several profiles can run in one scheduler, selected by `schedulerName` in the pod. Running a second scheduler is possible but rarely needed.

```bash
kubectl describe pod web-1 | sed -n '/Events/,$p'
kubectl get pods -n kube-system -l component=kube-scheduler
kubectl logs -n kube-system -l component=kube-scheduler --tail=20
```

```diagram
title: The scheduler: filtering, scoring and binding
node: q | Queue | 0 | 1 | Ordered by priority. | Starved low priority. | store
node: f | Filter | 1 | 1 | Removes unfit nodes. | Taints and selectors. | process
node: s | Score | 2 | 1 | Ranks the rest. | Skewed weights. | process
node: b | Bind | 3 | 1 | Writes the node name. | API conflict. | service
node: k | kubelet | 4 | 1 | Starts the pod. | Image pull errors. | service
edge: q | f
edge: f | s
edge: s | b
edge: b | k
```

## Incident: A scheduler that stopped scheduling

> **Incident:** A typo in a scheduler configuration file left every new pod Pending while existing pods ran normally.

```console
$ kubectl get pods -n kube-system -l component=kube-scheduler
NAME                              READY   STATUS             RESTARTS   AGE
kube-scheduler-cp1                0/1     CrashLoopBackOff   14         32m
$ kubectl get pods
NAME    READY   STATUS    RESTARTS   AGE
web-1   0/1     Pending   0          9m
(this is a simulated illustration, not a real incident)
```

The scheduler is a static pod, and an edit to its configuration file had an unknown field, so the process exited at start. Pods without a node stayed Pending because nothing was binding them, with no scheduling events at all, which is the clue. Restoring the backed-up manifest brought it back. An empty events list on a Pending pod means the scheduler did not see it, not that it rejected it.

## Common mistakes

- Changing resource limits when the event names a taint
- Assuming scoring can override a failed filter
- Editing a scheduler manifest without keeping a backup
- Reading Pending as a node problem when the scheduler is down
- Forgetting that priority only matters when capacity is short

```quiz
Q: What does filtering do?
+ Removes nodes that cannot run the pod
- Ranks nodes :: That is scoring.
- Starts the container :: That is the kubelet.
- Pulls the image :: That is the kubelet.
> Filtering applies hard constraints.

Q: A Pending pod has no events at all. What is likely?
+ The scheduler is not running or not seeing the pod
- Every node has a taint :: That would produce a FailedScheduling event.
- The image is missing :: Image errors appear later.
- The namespace is quota limited :: Quota rejects creation instead.
> The scheduler writes an event when it rejects a pod.

Q: What decides between several valid nodes?
+ Scoring
- Filtering :: Filtering only removes nodes.
- Binding :: Binding writes the choice.
- Admission :: Admission is earlier.
> Score plugins rank valid nodes.

Q: When can preemption happen?
+ When a higher priority pod cannot fit and lower priority pods could be evicted
- When a node is rebooted :: That is a drain.
- When the image changes :: That is a rollout.
- When a quota is created :: That is unrelated.
> Preemption frees room by evicting lower priority pods.
```

```cards
Filter :: A scheduler step that removes nodes that cannot run the pod
Score :: A scheduler step that ranks the remaining nodes
Binding :: Writing the chosen node name into the pod
Preemption :: Evicting lower priority pods to make room
Scheduling profile :: A named set of plugins and weights, chosen with schedulerName
```
