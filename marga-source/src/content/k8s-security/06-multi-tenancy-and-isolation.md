---
title: Multi-tenancy and isolation
minutes: 12
summary: Compare namespace, node and cluster level isolation for tenants, and combine RBAC, quotas, policy, network and runtime isolation to match the trust level.
---

Sharing a cluster saves money and effort, but it shares the kernel, the control plane and the network. How much isolation you add depends on how much you trust the tenants, and the options form a ladder.

## What you will learn

- Soft and hard multi-tenancy
- Namespaces as the unit and what they do not isolate
- Node pools, sandboxed runtimes and virtual clusters
- Isolating network, secrets, resources and policy
- Choosing the level

## Soft and hard

Soft multi-tenancy assumes tenants are cooperating teams in one organisation who might make mistakes. Hard multi-tenancy assumes a tenant may be hostile, as in a service offered to outside customers. Kubernetes can give strong soft isolation easily. Hard isolation inside one cluster is difficult because containers share a kernel.

## Namespaces

A namespace scopes names, RBAC, quotas and policies. It does not by itself isolate the network, nodes or kernel. Pair each tenant namespace with a RoleBinding to the tenant group, a ResourceQuota and LimitRange, default deny network policies, Pod Security labels and no access to other tenants Secrets. Disable service account token automount and cross namespace service access where not needed.

## Stronger isolation

Dedicated node pools with taints and node selectors keep tenant pods off shared nodes and limit the effect of a container escape. Sandboxed runtimes such as gVisor or Kata Containers, selected with a RuntimeClass, add a stronger boundary between the container and the host kernel. Virtual clusters give each tenant its own API server and control plane objects on shared nodes, reducing control plane sharing. Separate clusters give the strongest isolation at the highest cost.

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: sandboxed
handler: runsc
```

## Shared components

Watch the things that are shared: cluster scoped resources such as CRDs and ClusterRoles, admission webhooks, the DNS and ingress controllers, logging and monitoring, and the API server itself, where a noisy tenant can use up request capacity. Use API Priority and Fairness settings, quotas on object counts and per-tenant observability.

## Choosing

For teams in one company, namespaces with the controls above are usually enough. For regulated or semi-trusted workloads, add node pools and a sandbox runtime. For untrusted code from outside parties, prefer separate clusters or hardware isolation. Document the model so that tenants know what they share.

```diagram
title: Multi-tenancy and isolation
node: ns | Namespace controls | 0 | 1 | RBAC, quota, policy. | Missing one. | security
node: net | Network isolation | 1 | 0 | Default deny. | Open by default. | security
node: node | Node pool | 1 | 2 | Dedicated nodes. | Shared nodes. | process
node: run | Sandbox runtime | 2 | 1 | Kernel boundary. | Not enabled. | security
node: cl | Separate cluster | 3 | 1 | Strongest isolation. | Cost. | service
edge: ns | net
edge: ns | node
edge: node | run
edge: run | cl
```

## Incident: A neighbour that starved the API server

> **Incident:** One tenant controller listing every pod in a tight loop made other tenants deployments slow.

```console
$ kubectl get --raw /metrics | grep apiserver_flowcontrol_current_inqueue_requests | head -3
apiserver_flowcontrol_current_inqueue_requests{priority_level="workload-low"} 164
$ kubectl get flowschemas | grep tenant
(no output)
(this is a simulated illustration, not a real incident)
```

The tenant tool shared a default flow with everyone else, and its heavy list calls queued other requests behind it. Adding a flow schema that placed the tenant in its own priority level, and fixing the tool to use a watch, restored fair service. Shared control plane capacity is a multi-tenancy concern, not only pods and networks.

## Common mistakes

- Treating namespaces as a security boundary on their own
- Missing default deny network policy per tenant
- Sharing nodes for untrusted workloads
- Ignoring noisy neighbours on the API server
- Not documenting what is shared

```quiz
Q: Which assumption defines hard multi-tenancy?
+ Tenants may be hostile
- Tenants are one team :: That is soft.
- No tenants :: No.
- One pod :: No.
> It needs stronger isolation.

Q: What does a namespace not isolate by itself?
+ The network, nodes and kernel
- Names :: It scopes names.
- RBAC :: It scopes RBAC.
- Quotas :: It scopes quotas.
> Add policies and node isolation.

Q: What adds a stronger boundary between containers and the host kernel?
+ A sandboxed runtime such as gVisor selected by RuntimeClass
- A bigger node :: No.
- A longer name :: No.
- More replicas :: No.
> It interposes a user space kernel or a VM.

Q: Which option gives the strongest isolation?
+ Separate clusters
- Labels :: No.
- Namespaces only :: Weaker.
- Quotas :: Not isolation.
> At the highest cost.
```

```cards
Multi-tenancy :: Sharing a cluster between separate users or teams
RuntimeClass :: An object that selects a container runtime handler
gVisor :: A sandboxed container runtime
Virtual cluster :: A tenant control plane running inside a host cluster
Noisy neighbour :: A tenant that uses shared capacity unfairly
```
