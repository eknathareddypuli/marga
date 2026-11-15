---
title: CKA: workloads, scheduling and configuration tasks
minutes: 14
summary: Solve the workload tasks quickly: rollouts and rollbacks, config and secrets, resource limits, scaling, and placing pods with taints, tolerations, node selectors and affinity.
---

Workloads and scheduling is about fifteen percent of the CKA, but the same skills appear inside other tasks, so they pay off widely. Most of these tasks combine a short imperative command with one block of YAML that you copy from the docs. The goal here is to know which block you need and where to put it.

## What you will learn

- Rollouts, rollbacks and scaling
- ConfigMaps and Secrets used as environment variables and volumes
- Requests, limits and autoscaling
- Placement: node selectors, affinity, taints and tolerations

## Deployments, rollouts and rollbacks

```bash
kubectl create deployment web --image=nginx:1.26 --replicas=3
kubectl set image deployment/web nginx=nginx:1.27
kubectl rollout status deployment/web
kubectl rollout history deployment/web
kubectl rollout undo deployment/web
kubectl rollout undo deployment/web --to-revision=1
kubectl scale deployment/web --replicas=5
```

The container name for `set image` is the name inside the pod template, which for `kubectl create deployment` equals the image base name. If unsure, `kubectl get deployment web -o jsonpath='{.spec.template.spec.containers[*].name}'` tells you. The rolling update strategy, with `maxSurge` and `maxUnavailable`, is set under `spec.strategy`; know where it lives.

## ConfigMaps and Secrets

```bash
kubectl create configmap app --from-literal=LOG_LEVEL=debug
kubectl create secret generic db --from-literal=password=s3cret
```

Use them in a pod as environment variables or files:

```yaml
spec:
  containers:
    - name: app
      image: nginx:1.27
      env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app
              key: LOG_LEVEL
      envFrom:
        - secretRef:
            name: db
      volumeMounts:
        - name: cfg
          mountPath: /etc/app
  volumes:
    - name: cfg
      configMap:
        name: app
```

Secrets are base64 encoded, not encrypted; `kubectl get secret db -o jsonpath='{.data.password}' | base64 -d` decodes one. Mounting a ConfigMap as a volume creates a file per key, and mounted files update after a while when the ConfigMap changes, while environment variables do not.

## Resources and quotas

Requests are what the scheduler reserves; limits are the ceiling at runtime. A container that exceeds its memory limit is killed with an out-of-memory status, and one that exceeds its CPU limit is throttled.

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

A LimitRange sets default and maximum values per namespace, and a ResourceQuota caps the total. A task that says "pods in this namespace must not exceed X" usually means one of these. A pod that asks for more than any node can offer stays Pending, with an event that says insufficient CPU or memory.

## Autoscaling

A HorizontalPodAutoscaler needs metrics, normally from the metrics server, and CPU requests set on the target pods. A compact definition:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 6
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

Check with `kubectl get hpa`. If the target shows `<unknown>`, metrics are missing or the pods have no CPU request.

## Placing pods

Four tools, from simplest to most flexible:

- **nodeSelector**: match a label on the node. `kubectl label node w1 disk=ssd`, then `nodeSelector: {disk: ssd}` in the pod spec.
- **Node affinity**: required or preferred rules with operators; more expressive than a selector.
- **Taints and tolerations**: a taint repels pods from a node, and a toleration lets a pod ignore it.
- **Pod affinity and anti-affinity**: place pods near or away from other pods, using a topology key such as `kubernetes.io/hostname`.

```bash
kubectl taint nodes w1 dedicated=gpu:NoSchedule
kubectl taint nodes w1 dedicated=gpu:NoSchedule-
kubectl describe node w1 | grep -i taint
```

The trailing minus removes the taint. A toleration matching it looks like:

```yaml
tolerations:
  - key: dedicated
    operator: Equal
    value: gpu
    effect: NoSchedule
```

A toleration allows scheduling on a tainted node; it does not require it. To force pods onto those nodes, combine a toleration with a node selector or affinity.

## Probes, init containers and disruption

Liveness probes restart stuck containers, readiness probes control service traffic, and startup probes protect slow starters. Init containers run to completion before app containers, which suits waiting for a dependency. A PodDisruptionBudget limits voluntary evictions, such as during a drain; a budget that requires all replicas to be available blocks the drain forever.

## Verify placement

After creating a pod, `kubectl get pod -o wide` shows its node. If it is Pending, `kubectl describe pod` lists the scheduler's reason, which names taints, selectors or resources.

```python
nodes = {"w1": {"taints": {"dedicated=gpu"}, "labels": {"disk": "ssd"}},
         "w2": {"taints": set(), "labels": {"disk": "hdd"}}}
pod = {"tolerations": set(), "selector": {"disk": "ssd"}}

def fits(node):
    if not node["taints"] <= pod["tolerations"]:
        return "tainted"
    if any(node["labels"].get(k) != v for k, v in pod["selector"].items()):
        return "selector mismatch"
    return "ok"

print({n: fits(v) for n, v in nodes.items()})
```

```diagram
title: How a pod finds a node
node: pend | Pending pod | 0 | 1 | Needs a node that fits. | No node qualifies. | external
node: res | Resource fit | 1 | 0 | Requests against free capacity. | Requests larger than any node. | process
node: tnt | Taints and tolerations | 2 | 1 | Tainted nodes repel unless tolerated. | Toleration missing. | security
node: sel | Selectors and affinity | 2 | 3 | Labels the pod asks for. | Label typo on the node. | process
node: sch | Scheduler decision | 3 | 1 | Chooses among the nodes left. | Events show why none fit. | service
node: run | Running pod | 4 | 1 | Bound to a node. | Verify with get -o wide. | observe
edge: pend | res
edge: res | tnt
edge: res | sel
edge: tnt | sch
edge: sel | sch
edge: sch | run
```

## Incident: Pending because of a taint

> **Incident:** A pod stayed Pending, and the candidate kept changing resource limits instead of reading the event.

```console
$ kubectl describe pod batch-1
Events:
  Warning  FailedScheduling  0/3 nodes are available: 1 node(s) had untolerated taint {dedicated: gpu}, 2 node(s) didn't match Pod's node affinity/selector.
(this is a simulated illustration, not a real incident)
```

The event names both causes: one node was tainted and the others did not match the node selector. Reading the events line showed that the selector pointed to a label that did not exist on any untainted node. The fix was to correct the label, not to adjust resources. The scheduler's message is nearly always the shortest route to the cause.

## Common mistakes

- Using the wrong container name in kubectl set image
- Expecting a toleration to force pods onto a node
- Setting CPU target in an HPA but no CPU request on the pods
- A PodDisruptionBudget that blocks draining
- Changing resources when the event points to a taint or selector

```quiz
Q: What does a toleration do?
+ It allows a pod to be scheduled on a node with a matching taint
- It forces the pod onto the tainted node :: It only allows it.
- It deletes the taint :: It does not change the node.
- It increases resources :: Unrelated.
> Taints repel and tolerations permit; they do not attract.

Q: How do you remove a taint with kubectl?
+ Repeat the taint with a trailing minus
- kubectl delete taint :: Not a command.
- Restart the kubelet :: Does not remove it.
- Edit etcd by hand :: Dangerous and unnecessary.
> The minus suffix removes it.

Q: Why would an HPA show unknown targets?
+ Metrics are unavailable or pods lack CPU requests
- The cluster has too many nodes :: Unrelated.
- The deployment has no labels :: Not the cause.
- The namespace is empty :: Not the cause.
> HPA needs metrics and a request to compute utilisation.

Q: What is the fastest way to learn why a pod is Pending?
+ kubectl describe pod and read the events
- Delete and recreate it :: May hide the cause.
- Reboot the node :: Unnecessary.
- Scale the deployment to zero :: Does not explain.
> The scheduler records the reason as an event.
```

```cards
Request :: The resources the scheduler reserves for a container
Limit :: The maximum a container may use at runtime
Taint :: A node property that repels pods without a matching toleration
Toleration :: A pod setting that allows scheduling onto a tainted node
Affinity :: Rules that attract pods to nodes or to other pods
```
