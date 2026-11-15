---
title: CKA: troubleshooting method and scenarios
minutes: 15
summary: Troubleshooting is the largest CKA domain. Learn a fixed order of checks, then apply it to application failures, services, nodes that are NotReady, broken control plane components and certificate expiry.
---

Troubleshooting carries about thirty percent of the CKA, and in real life it is the skill that matters most. The exam gives you a broken thing and a time limit. The people who do well are not the ones who know the most obscure flag; they are the ones who look in the right order and read what the system tells them.

## What you will learn

- A repeatable top-to-bottom order of checks
- Application and service failures
- Node failures: kubelet, runtime and network
- Control plane failures and certificates

## The method

1. **Define the symptom.** What exactly fails, where, and since when?
2. **Look at the object.** `kubectl get` and `kubectl describe`, read the events.
3. **Look at the logs.** Container logs, previous logs, component logs.
4. **Go down a layer.** Pod, then node, then control plane, then infrastructure.
5. **Change one thing at a time** and verify.

Avoid guessing. Each command should answer a question you can state.

## Pod failures

```bash
kubectl get pods -A
kubectl describe pod web-1 -n shop
kubectl logs web-1 -n shop
kubectl logs web-1 -n shop --previous
kubectl get events -n shop --sort-by=.lastTimestamp
```

Map the status to the cause:

| Status | Usual cause | Where to look |
|---|---|---|
| Pending | No node fits, unbound claim | describe events |
| ImagePullBackOff | Wrong image name or tag, registry access | describe events |
| CrashLoopBackOff | Process exits, bad config or command | logs --previous |
| CreateContainerConfigError | Missing ConfigMap or Secret key | describe events |
| OOMKilled in last state | Memory limit too low | describe, limits |
| Running but not Ready | Failing readiness probe | describe, probe settings |

## Service failures

Work from the client to the pod: does the name resolve, does the service have endpoints, does the pod respond on the target port, and does a policy block it? The most common causes are a selector that does not match pod labels, a wrong `targetPort`, readiness probes that fail so pods are not in the endpoints, and network policies.

## Node failures

When `kubectl get nodes` shows `NotReady`, log in to the node and check the kubelet and the runtime:

```bash
systemctl status kubelet
journalctl -u kubelet -n 50 --no-pager
systemctl status containerd
crictl ps -a
cat /var/lib/kubelet/config.yaml
```

Typical findings: the kubelet service is stopped or disabled (start and enable it), a wrong path in its configuration or service drop-in, an expired or wrong certificate, a runtime socket that does not exist, swap enabled, or a full disk. After a fix, `systemctl daemon-reload` if you changed a unit file, then `systemctl restart kubelet`, and check again from the control plane.

## Control plane failures

On a kubeadm cluster the control plane components are static pods. If `kubectl` cannot connect at all, the API server is the first suspect. Look from the node:

```bash
crictl ps -a | grep -E "kube-apiserver|etcd|scheduler|controller"
crictl logs CONTAINER_ID
ls /etc/kubernetes/manifests
journalctl -u kubelet -n 50 --no-pager
```

Typical faults: a typo or wrong path in a manifest, a wrong certificate file name, a wrong etcd address, a port clash. The kubelet log often says that it cannot create the pod and why. When only a component such as the scheduler is down, pods stay Pending with no events from the scheduler, and `kubectl get pods -n kube-system` shows its pod failing. Fix the manifest and the kubelet recreates the pod.

If workloads start but never become Ready or deployments do not roll, look at the controller manager. If pods are created but never scheduled, look at the scheduler. Know the division.

## Certificates

```bash
kubeadm certs check-expiration
kubeadm certs renew all
```

Expired certificates cause confusing errors such as failing `kubectl` or kubelet connections. After renewal, restart the control plane static pods by moving their manifests away and back, or restart the kubelet, as the docs describe.

## Networking and DNS

Pods that cannot resolve names point to CoreDNS or a policy. Nodes that cannot reach each other point to the network plugin pods in `kube-system`. A plugin that is not running makes new pods stay in `ContainerCreating` with network errors in the events.

## Resource and capacity problems

`kubectl top nodes` and `kubectl top pods` need the metrics server. A node with `MemoryPressure` or `DiskPressure` conditions evicts pods; check `kubectl describe node`.

## Write down what you find

When a task asks you to record the cause, such as "write the reason the pod failed to a file", copy exact text from the events or logs rather than paraphrasing.

```python
symptoms = {
    "ImagePullBackOff": "check image name, tag and registry access",
    "CrashLoopBackOff": "kubectl logs --previous",
    "Pending": "kubectl describe pod, read scheduler events",
    "NotReady node": "systemctl status kubelet and journalctl",
}
for s, hint in symptoms.items():
    print(f"{s:18} {hint}")
```

```diagram
title: A top-to-bottom troubleshooting order
node: sym | Symptom | 0 | 1 | State what fails and where. | Fixing before understanding. | observe
node: obj | Object and events | 1 | 1 | get, describe and events. | Not reading the events. | observe
node: log | Logs | 2 | 1 | Container and previous logs. | Missing --previous. | observe
node: node | Node and kubelet | 3 | 0 | systemctl, journalctl and crictl. | Kubelet disabled after reboot. | process
node: cp | Control plane | 3 | 2 | Static pod manifests and certificates. | Typo in a manifest path. | security
node: fix | Fix and verify | 4 | 1 | One change, then check. | Changing many things at once. | service
edge: sym | obj
edge: obj | log
edge: log | node
edge: log | cp
edge: node | fix
edge: cp | fix
```

## Incident: The kubelet that was stopped, not broken

> **Incident:** A node was NotReady. The candidate spent ten minutes on pod networking before looking at the node itself.

```console
$ systemctl status kubelet
kubelet.service - kubelet: The Kubernetes Node Agent
     Loaded: loaded (/lib/systemd/system/kubelet.service; disabled)
     Active: inactive (dead)
(this is a simulated illustration, not a real incident)
```

The kubelet was inactive and disabled, so it had not started after a reboot. Starting and enabling it, then checking `kubectl get nodes`, fixed the task in under a minute. The lesson is to check the lowest layer a symptom could involve before digging into higher layers that depend on it.

## Common mistakes

- Looking at pods when the node is down
- Forgetting logs --previous for a crashed container
- Editing several things before testing the first
- Not checking the kubelet log when a static pod does not start
- Paraphrasing an error when the task asks for the exact reason

```quiz
Q: Which status points to a missing ConfigMap key?
+ CreateContainerConfigError
- ImagePullBackOff :: That is about images.
- Completed :: That is a normal end state.
- Evicted :: That is about node pressure.
> The describe events name the missing key.

Q: Where do you look first for a node that is NotReady?
+ The kubelet status and logs on the node
- The Ingress controller :: Unrelated.
- The application logs :: The node is the layer below.
- The DNS ConfigMap :: Unrelated.
> The kubelet reports node health to the API server.

Q: What does CrashLoopBackOff mean?
+ The container keeps exiting and Kubernetes keeps restarting it with a delay
- The image cannot be pulled :: That is ImagePullBackOff.
- The pod is scheduled to no node :: That is Pending.
- The pod is finished :: That is Completed.
> Check the logs of the previous run to see why it exited.

Q: Why change only one thing at a time?
+ So you know which change fixed the problem and avoid new faults
- It is a rule of the exam :: It is good practice.
- Kubernetes forbids many changes :: It does not.
- It is faster to type :: It is not about typing.
> One variable at a time keeps the diagnosis clear.
```

```cards
Troubleshooting order :: Checking object, events, logs, then deeper layers one at a time
CrashLoopBackOff :: A pod status for a container that repeatedly exits
NotReady :: A node status meaning the kubelet is not reporting healthy
crictl :: A command line client for container runtimes used on nodes
Certificate expiry :: Certificates passing their end date, breaking authentication between components
```
