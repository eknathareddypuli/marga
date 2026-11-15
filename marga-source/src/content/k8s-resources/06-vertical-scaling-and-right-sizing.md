---
title: Vertical scaling and right-sizing
minutes: 12
summary: Use the Vertical Pod Autoscaler, in-place resize and usage data to right-size requests, and know why resizing and horizontal scaling interact.
---

Most clusters waste capacity because requests were set once and never revisited. Right-sizing recovers it, and the Vertical Pod Autoscaler helps by recommending or applying better numbers.

## What you will learn

- Why requests drift from reality
- VPA modes: Off, Initial, Recreate and Auto
- In-place pod resize
- Using recommendations safely
- Combining with the HPA

## Drift

Teams copy requests from examples or set them generously after an incident. Over time many pods request several times what they use, so nodes look full while actual utilisation is low. A cluster at 30 percent real utilisation can need twice the machines it should. The reverse also happens: requests too low give noisy neighbours and OOM kills.

## The Vertical Pod Autoscaler

VPA is an add-on that watches usage history and computes recommended requests for each container. Its updater and admission controller can apply them. In mode Off it only reports recommendations. Initial sets requests when pods are created. Recreate evicts and recreates pods with new values. Auto chooses an update method, and newer versions can use in-place resize where supported.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  updatePolicy:
    updateMode: "Off"
```

## In-place resize

Recent Kubernetes versions allow changing container CPU and memory requests and limits on a running pod without recreating it, subject to node capacity and the resize policy of each container. This reduces disruption for stateful and slow starting workloads. Check the feature status for your version.

## Using recommendations

Start with mode Off and read the recommendation, which includes lower bound, target and upper bound. Compare to real peaks, apply to a canary and watch. Treat the output as advice, especially for workloads with rare spikes the history did not include. Avoid Auto on single replica services unless an interruption is acceptable.

```bash
kubectl describe vpa api | sed -n '/Recommendation/,$p'
```

## With the HPA

Do not let both the HPA and VPA act on the same resource metric, such as CPU, for the same workload, because each reacts to the other. A common arrangement is HPA on CPU or a custom metric, and VPA only recommending for memory, or VPA in Off mode while you set values by hand.

```diagram
title: Vertical scaling and right-sizing
node: use | Usage history | 0 | 1 | Observed demand. | Short window. | observe
node: vpa | Recommender | 1 | 1 | Computes targets. | Missed peaks. | process
node: apply | Apply | 2 | 1 | Recreate or resize. | Disruption. | process
node: save | Capacity saved | 3 | 1 | Fewer nodes. | Under-sized. | observe
edge: use | vpa
edge: vpa | apply
edge: apply | save
```

## Incident: A recommendation that missed the monthly peak

> **Incident:** After accepting VPA targets, a service restarted on the first day of the month.

```console
$ kubectl describe vpa api | sed -n '/Recommendation/,$p'
  Recommendation:
    Container Recommendations:
      Container Name:  api
      Target:
        Cpu:     120m
        Memory:  300Mi
$ kubectl describe pod api-9d | grep -A2 "Last State"
    Last State:  Terminated  Reason: OOMKilled
(this is a simulated illustration, not a real incident)
```

The usage history covered two weeks, so the end of month report job was never seen and the recommended memory was too small for it. Adding headroom, a longer window and a separate workload for the monthly job fixed it. Recommendations only know the past they were shown, so apply judgement for rare peaks.

## Common mistakes

- Using Auto mode on single replica critical services
- Letting HPA and VPA fight over CPU
- Trusting a short history
- Setting requests once and never reviewing
- Right-sizing without a rollback plan

```quiz
Q: What does VPA mode Off do?
+ Only produces recommendations
- Deletes pods :: No.
- Disables the HPA :: No.
- Resizes pods :: That is Auto or Recreate.
> It is the safest start.

Q: Why do requests drift?
+ They are set once and rarely revisited
- Kubernetes changes them :: It does not.
- Nodes change them :: They do not.
- Images change them :: They do not.
> Reviews rarely happen.

Q: What does in-place resize allow?
+ Changing resources on a running pod without recreating it
- Moving pods between nodes :: No.
- Changing the image :: No.
- Changing labels only :: No.
> It reduces disruption.

Q: How should HPA and VPA be combined?
+ Avoid both acting on the same metric for one workload
- Always both on CPU :: They conflict.
- Never use either :: Not needed.
- Delete requests :: Bad.
> They react to each other.
```

```cards
VPA :: Vertical Pod Autoscaler, which recommends or applies resource requests
Right-sizing :: Matching requests to real usage
In-place resize :: Changing a running pod resources without a restart
Recommendation target :: The value the VPA suggests for a request
Headroom :: Extra capacity above observed peaks
```
