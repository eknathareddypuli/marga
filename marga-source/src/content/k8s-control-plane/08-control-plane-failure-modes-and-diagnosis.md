---
title: Control plane failure modes and diagnosis
minutes: 13
summary: Work out what still works and what stops when each control plane component fails, and follow a fixed order to diagnose a sick control plane.
---

A control plane failure feels dramatic, but each component has a narrow job, so each failure has a narrow signature. Knowing what keeps working is the fastest route to the cause, and it also tells you how urgent the problem is.

## What you will learn

- What breaks and what survives for each component
- Symptoms that point to the API server, etcd, scheduler, controller manager or kubelet
- A fixed diagnosis order
- The tools you can use when kubectl is unavailable

## The failure matrix

Running pods keep running in nearly every control plane failure, because the kubelet and the container runtime work from what they already have. What stops is change. If etcd loses quorum, nothing can be written. If the API server is down, nobody can read or write and controllers cannot act, but pods and Services keep working. If the scheduler is down, existing pods run and new pods stay Pending with no events. If the controller manager is down, deployments do not scale, replacements are not created and nodes are never marked NotReady. If a kubelet is down, only that node is affected.

## Reading the symptoms

kubectl timeouts or connection refused point to the API server or the network path to it. A "server is currently unable to handle the request" or etcd errors point to etcd. Pending pods without events point to the scheduler. A Deployment that does not create ReplicaSets points to the controller manager. A single NotReady node points to its kubelet, runtime or network.

## Diagnosis order

Work from the bottom up. First the node: is the kubelet running, and is the container runtime running. Next the static pods: do the manifests exist, and does `crictl ps` show the containers. Then each component log, starting with etcd, then the API server, then the scheduler and controller manager. Make one change at a time, and re-check the symptom after each.

## When kubectl does not work

Use the tools on the control plane node itself. `crictl ps -a` lists containers, `crictl logs` reads their logs, `journalctl -u kubelet` shows why the kubelet could not start a static pod, and `ls /etc/kubernetes/manifests` shows the manifests. Health endpoints can be queried directly.

```bash
crictl ps -a | grep -E "etcd|apiserver|scheduler|controller"
curl -k https://127.0.0.1:6443/livez?verbose | tail -5
ls -l /etc/kubernetes/manifests
```

## A quick reference in code

```python
failure = {
    "etcd quorum lost": "no writes, pods keep running",
    "api server down": "no kubectl, pods and services keep running",
    "scheduler down": "new pods Pending with no events",
    "controller manager down": "no scaling, no replacement, no node eviction",
    "one kubelet down": "that node NotReady, others fine",
}
for k, v in failure.items():
    print(k, "->", v)
```

```diagram
title: Control plane failure modes and diagnosis
node: sym | Symptom | 0 | 1 | What the user sees. | Vague report. | observe
node: node | Node layer | 1 | 1 | kubelet and runtime. | Service disabled. | process
node: static | Static pods | 2 | 1 | Manifests and containers. | Bad edit. | process
node: logs | Component logs | 3 | 1 | etcd then API then rest. | Wrong order. | observe
node: fix | One change | 4 | 1 | Then re-check. | Many changes at once. | service
edge: sym | node
edge: node | static
edge: static | logs
edge: logs | fix
```

## Incident: Deployments that would not scale

> **Incident:** A team saw deployments ignore scale requests while all existing pods stayed healthy.

```console
$ kubectl scale deploy web --replicas=5
deployment.apps/web scaled
$ kubectl get deploy web
NAME   READY   UP-TO-DATE   AVAILABLE
web    2/2     2            2
$ kubectl get pods -n kube-system -l component=kube-controller-manager
NAME                          READY   STATUS             RESTARTS
kube-controller-manager-cp1   0/1     CrashLoopBackOff   9
(this is a simulated illustration, not a real incident)
```

The API accepted the new replica count, but the controller manager that would create the ReplicaSet change was crash looping because of an expired client certificate path in its manifest. Existing pods ran normally. The log showed the exact file it could not read, and correcting the manifest restored scaling. A request that the API accepts but nothing acts on points to a controller, not the API.

## Common mistakes

- Assuming an outage means pods have stopped
- Changing several things before re-checking
- Looking only at kubectl when it may be the failing component
- Skipping the node layer
- Not keeping copies of manifests before edits

```quiz
Q: If the controller manager is down, what happens?
+ Existing pods run, but scaling and replacement do not happen
- All pods stop :: Pods keep running.
- kubectl stops working :: The API server is separate.
- etcd loses data :: etcd is unaffected.
> Controllers do the acting, so no controller means no change.

Q: A new pod is Pending with no events. What is the likely cause?
+ The scheduler is down
- etcd is full :: Writes would fail.
- A node is NotReady :: That would show events.
- The image is missing :: Image errors come later.
> No events means the scheduler never looked.

Q: Which order should you diagnose in?
+ From the node layer upward
- From the application downward :: Lower layers are the likelier root.
- Randomly :: That wastes time.
- Only etcd :: Other layers can fail too.
> Check what the higher layers depend on first.

Q: How do you inspect control plane containers when kubectl fails?
+ With crictl and the kubelet journal on the node
- With kubectl logs :: It needs the API.
- With helm :: Not for this.
- With the portal :: Not available.
> The runtime tools work without the API server.
```

```cards
Livez endpoint :: An API server health endpoint such as /livez
crictl :: A CLI for inspecting containers through the CRI
Static pod manifest :: The file that defines a control plane component
Failure matrix :: A list of what breaks and what survives per component
Mirror pod :: The API server copy of a static pod
```
