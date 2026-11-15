---
title: Horizontal pod autoscaling
minutes: 13
summary: Configure the HorizontalPodAutoscaler for CPU, memory and custom metrics, understand its formula, stabilisation and behaviour settings, and avoid flapping.
---

The HorizontalPodAutoscaler changes the replica count of a workload in response to load. It is simple in concept and easy to misconfigure, because its decisions depend on requests, metrics and timing.

## What you will learn

- The HPA control loop and its formula
- Why CPU utilisation depends on requests
- Metrics sources: resource, custom and external
- Stabilisation windows and scaling behaviour
- Common misconfigurations

## The loop

Every fifteen seconds by default the HPA controller reads a metric for the target pods, compares it to the target value and computes the desired replicas as the current replicas multiplied by the ratio of current to target metric, rounded up. It then updates the scale subresource of the Deployment or StatefulSet. A tolerance of ten percent avoids small changes.

```python
import math
def desired(current, metric, target):
    return math.ceil(current * metric / target)
print(desired(4, 90, 60))
print(desired(10, 30, 60))
```

## Utilisation is relative to requests

For a CPU utilisation target such as 60 percent, utilisation means usage divided by the pod request. If a container has no CPU request, the HPA cannot compute it and reports unknown. A request set too low makes utilisation look high and causes over-scaling, and a request set too high hides load. Set requests first, then targets.

## Metrics sources

Resource metrics come from the metrics-server, which must be installed. Custom metrics, such as requests per second per pod, come through an adapter like the Prometheus adapter, and external metrics describe things outside the cluster, such as queue length. KEDA builds on the HPA to scale from event sources, including down to zero. Scaling on a metric that reflects the real bottleneck works better than CPU for many services.

## Behaviour

The `behavior` field controls speed. Scale up defaults to fast, doubling or adding four pods per period, while scale down waits for a five minute stabilisation window and removes pods more slowly. You can set policies, for example at most ten percent a minute down, to avoid flapping.

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
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
```

## Check it

```bash
kubectl get hpa web
kubectl describe hpa web
kubectl top pods -l app=web
```
The describe output shows current metrics, the conditions such as AbleToScale and ScalingActive and recent scaling events. A target of unknown usually means no requests or no metrics-server.

```diagram
title: Horizontal pod autoscaling
node: ms | metrics-server | 0 | 1 | Resource metrics. | Missing. | observe
node: hpa | HPA controller | 1 | 1 | Computes replicas. | No requests. | process
node: scale | Scale subresource | 2 | 1 | Updates replicas. | Fights manual scaling. | service
node: pods | Pods | 3 | 1 | Receive load. | Slow to start. | service
edge: ms | hpa
edge: hpa | scale
edge: scale | pods
```

## Incident: An autoscaler that showed unknown

> **Incident:** A new HPA never changed the replica count despite heavy load.

```console
$ kubectl get hpa web
NAME   REFERENCE        TARGETS         MINPODS   MAXPODS   REPLICAS
web    Deployment/web   <unknown>/60%   3         20        3
$ kubectl describe hpa web | grep -A2 Conditions
  ScalingActive  False  FailedGetResourceMetric  the HPA was unable to compute the replica count: failed to get cpu utilization: missing request for cpu
(this is a simulated illustration, not a real incident)
```

The container had no CPU request, so utilisation could not be computed and the HPA stayed idle. Adding a CPU request let it compute utilisation, and it scaled up within a minute. If TARGETS shows unknown, check requests and the metrics-server before touching the HPA.

## Common mistakes

- No CPU request on the target
- Scaling on CPU when the bottleneck is elsewhere
- Setting minReplicas to one for a critical service
- Editing replicas by hand while an HPA manages them
- Forgetting that new pods take time to become ready

```quiz
Q: What does the HPA formula use?
+ Current replicas times current metric over target metric, rounded up
- Memory only :: No.
- A fixed step :: No.
- Node count :: No.
> The ratio decides the replicas.

Q: Why does CPU utilisation need requests?
+ Utilisation is usage relative to the request
- To pick a node :: Not for HPA.
- To encrypt :: No.
- To set a port :: No.
> No request means no utilisation.

Q: What gives resource metrics to the HPA?
+ The metrics-server
- etcd :: No.
- kube-proxy :: No.
- CoreDNS :: No.
> It must be installed.

Q: What does the scale down stabilisation window do?
+ Delays removal of pods to avoid flapping
- Speeds scale up :: No.
- Deletes the HPA :: No.
- Sets limits :: No.
> Default is five minutes.
```

```cards
HPA :: HorizontalPodAutoscaler, which adjusts replica counts
metrics-server :: The source of CPU and memory metrics for HPA and top
Stabilisation window :: A period over which scale down decisions are smoothed
Custom metric :: An application metric exposed to the HPA through an adapter
KEDA :: An event driven autoscaler built on the HPA
```
