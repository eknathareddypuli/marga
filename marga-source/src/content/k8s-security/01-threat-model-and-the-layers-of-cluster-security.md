---
title: Threat model and the layers of cluster security
minutes: 12
summary: Build a threat model for a cluster, map attacker paths from code to control plane, and see which controls break each path.
---

Security work is easier when it starts from how attacks actually proceed. A cluster has several layers, each with its own entry points, and the strongest control is usually the one that stops the attacker at the first step.

## What you will learn

- The layers: cloud, cluster, container and code
- Common attack paths in Kubernetes
- Assets and trust boundaries
- Mapping controls to attack steps
- Where the CKS domains fit

## The layers

The cloud native security model describes four layers, cloud or infrastructure, cluster, container and code. Each layer builds on the one below, so a weakness lower down undermines controls above it. A hardened container on a node whose kubelet accepts anonymous requests is still exposed.

## Attack paths

A typical path begins with a vulnerable application or a leaked credential. The attacker gets code execution in a pod, reads the mounted service account token, calls the API server, and tries to escalate through permissive RBAC, a privileged pod, a host mount or the cloud metadata service. From a node they can reach other pods, secrets and cloud credentials. Another path begins with an exposed dashboard, kubelet or etcd port.

## Assets and boundaries

List what is valuable: secrets, customer data, the ability to run code on nodes, cloud credentials, the CI pipeline and the images it produces. Mark trust boundaries: internet to ingress, pod to pod across namespaces, workload to API server, node to cloud, and build to runtime. Controls belong at those boundaries.

## Mapping controls

For each step in a path, name the control that stops or detects it. Image scanning and minimal images reduce the chance of the first foothold. Dropping unnecessary capabilities and running as non-root limits what code can do. Disabling token automount denies the API foothold. Least privilege RBAC limits escalation. Network policies and metadata blocking limit movement. Audit logs and runtime detection find what slipped through.

```python
path = [
    ("exploit app", "image scan, patching"),
    ("read service account token", "automount off, short lived tokens"),
    ("call API server", "least privilege RBAC"),
    ("escape to node", "pod security restricted, seccomp, AppArmor"),
    ("move sideways", "network policy, metadata block"),
    ("hide", "audit logs, runtime detection"),
]
for step, control in path:
    print(step, "->", control)
```

## How this maps to CKS

The CKS exam domains line up with the layers: cluster setup and hardening, system hardening, minimising microservice vulnerabilities, supply chain security and monitoring and runtime security. This module goes deep on the reasoning, and the exam practice module drills the tasks.

```diagram
title: Threat model and the layers of cluster security
node: code | Application code | 0 | 1 | Entry point. | Known vulnerability. | external
node: pod | Pod and container | 1 | 1 | Foothold. | Root, caps. | process
node: api | API server | 2 | 0 | Escalation target. | Broad RBAC. | security
node: node | Node and host | 2 | 2 | Escape target. | Privileged pod. | security
node: cloud | Cloud credentials | 3 | 1 | Wider impact. | Metadata reachable. | external
edge: code | pod
edge: pod | api
edge: pod | node
edge: node | cloud
```

## Incident: From one vulnerable pod to the cloud account

> **Incident:** A compromised web pod ended with access to a cloud storage bucket.

```console
$ kubectl exec web-1 -- cat /var/run/secrets/kubernetes.io/serviceaccount/namespace
shop
$ kubectl exec web-1 -- curl -s -m 2 http://169.254.169.254/latest/meta-data/iam/security-credentials/
node-role
(this is a simulated illustration, not a real incident)
```

The pod could read its service account token and also reach the cloud metadata endpoint, which returned the node role credentials. The attacker used those to read a storage bucket. Disabling token automount for pods that do not need it, blocking the metadata address with network policy and using workload identity instead of node roles would each have cut the path. Layers of controls matter because the first one often fails.

## Common mistakes

- Securing the cluster but not the cloud role
- Leaving default service account tokens mounted
- Treating the metadata endpoint as harmless
- Only scanning images
- Not writing down the attack paths you defend

```quiz
Q: Why model attack paths?
+ To place controls where they break the path
- To avoid patching :: No.
- To increase node count :: No.
- To remove RBAC :: No.
> Controls should match steps.

Q: Which is a typical first foothold?
+ A vulnerable application or leaked credential
- A scheduler restart :: No.
- A new Namespace :: No.
- A label :: No.
> Most attacks begin in an application.

Q: What does blocking the metadata address prevent?
+ Pods obtaining node cloud credentials
- DNS :: No.
- Image pulls :: No.
- Logging :: No.
> Use workload identity instead.

Q: Which layer sits below the cluster layer?
+ Cloud or infrastructure
- Code :: Above.
- Container :: Above.
- User interface :: Not a layer.
> Weak lower layers undermine upper ones.
```

```cards
Attack path :: A sequence of steps an attacker takes to reach a goal
Trust boundary :: A line between zones with different trust
Foothold :: Initial code execution or access
Lateral movement :: Moving from one system to another
Least privilege :: Granting only the access that is needed
```
