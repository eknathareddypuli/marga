---
title: CKA and CKS exam
summary: Exam setup, imperative commands, etcd backup, kubeadm upgrade, RBAC checks, scheduling and a hardening checklist.
module: k8s-exam
---

## Setup in the first two minutes

| Step | Command |
|------|---------|
| Alias | `alias k=kubectl` |
| Completion | `source <(kubectl completion bash)` and `complete -F __start_kubectl k` |
| Dry run variable | `export do="--dry-run=client -o yaml"` |
| Context | Paste the command given in the task before every task |

## Imperative commands

| Job | Command |
|-----|---------|
| Pod | `k run web --image=nginx` |
| Deployment | `k create deploy web --image=nginx --replicas=3` |
| Expose | `k expose deploy web --port=80` |
| Role | `k create role r --verb=get,list --resource=pods` |
| Binding | `k create rolebinding rb --role=r --user=jane` |
| Field names | `k explain pod.spec.containers` |

## etcd backup and restore

| Step | Command |
|------|---------|
| Find paths | `grep -E "cert|key|listen-client" /etc/kubernetes/manifests/etcd.yaml` |
| Save | `ETCDCTL_API=3 etcdctl snapshot save FILE --endpoints=... --cacert=... --cert=... --key=...` |
| Verify | `etcdctl snapshot status FILE` |
| Restore | `etcdctl snapshot restore FILE --data-dir=/var/lib/etcd-new` |
| Switch | Edit the hostPath of the data volume in the etcd manifest |

## kubeadm upgrade order

| Where | Steps |
|-------|-------|
| Control plane | upgrade kubeadm, plan, apply, drain, upgrade kubelet, restart, uncordon |
| Each worker | drain, upgrade kubeadm, upgrade node, upgrade kubelet, restart, uncordon |

## Permission checks

| Question | Command |
|----------|---------|
| Can this user do it? | `k auth can-i get pods/log -n dev --as jane` |
| What can I do? | `k auth can-i --list` |
| Who is bound? | `k get rolebinding,clusterrolebinding -A -o wide` |

## Scheduling quick map

| Need | Use |
|------|-----|
| Pick a node by label | nodeSelector or node affinity |
| Keep pods off a node | Taint on the node |
| Allow a tainted node | Toleration on the pod |
| Spread replicas | Topology spread constraints |

## Hardening checklist

| Area | Control |
|------|---------|
| API and kubelet | Anonymous access off, Webhook authorization |
| Network | Default deny, allow DNS |
| Pods | Non-root, drop capabilities, no privilege escalation |
| Host | AppArmor, seccomp RuntimeDefault |
| Data | Encryption at rest, rotate after exposure |
| Images | Scan with Trivy, pin digests, allow only your registry |
| Detection | Audit policy and Falco rules |

## Handy commands

```bash
kubectl config use-context CONTEXT
```

```bash
kubectl explain pod.spec.containers --recursive | less
```

```bash
kubectl run test --image=nginx --dry-run=client -o yaml
```

```bash
kubectl get events --sort-by=.lastTimestamp
```

```bash
kubectl api-resources --namespaced=true
```

```bash
kubectl get pod POD -o yaml
```

```bash
kubectl rollout status deploy/NAME
```

## Watch out for

> **Warning:** Always check which context and namespace you are in before you change anything.

> **Warning:** Do not spend more than a few minutes on one question, because partial credit on the rest is worth more.

> **Warning:** Use kubectl explain and the official docs allowed in the exam instead of guessing field names.

> **Warning:** Generate YAML with dry-run, then edit, rather than writing manifests from memory.
