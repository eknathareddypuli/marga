---
title: Pod Security Standards and admission policy
minutes: 13
summary: Apply Pod Security admission with the privileged, baseline and restricted standards, and add policy engines for rules the standards do not cover.
---

A pod spec contains settings that decide how much of the node a container can touch. Pod Security Standards describe safe settings, and admission enforces them, so risky pods are stopped before they run.

## What you will learn

- The three standards and what each forbids
- Pod Security admission modes: enforce, audit and warn
- Rolling out safely with labels per namespace
- Writing a compliant pod with a security context
- Policy engines: ValidatingAdmissionPolicy, Kyverno, Gatekeeper

## The standards

Privileged is unrestricted and meant for system components. Baseline blocks known escalations: privileged containers, host namespaces, host paths and unsafe capabilities. Restricted adds current hardening practice: run as non-root, no privilege escalation, drop all capabilities except a short list, a RuntimeDefault or Localhost seccomp profile and limited volume types.

## Admission modes

The Pod Security admission controller is built in and configured with namespace labels. Mode enforce rejects violating pods, audit records violations in the audit log and warn returns a warning to the user. Each mode has a level and a version label.

```bash
kubectl label ns shop pod-security.kubernetes.io/enforce=restricted pod-security.kubernetes.io/enforce-version=latest
kubectl label ns shop pod-security.kubernetes.io/warn=restricted pod-security.kubernetes.io/audit=restricted
kubectl get ns shop --show-labels
```

## Rolling out

Introduce it gradually. Label namespaces with warn and audit at the target level first and read the output, fix workloads, then switch on enforce. System namespaces such as kube-system usually need privileged. Because enforcement is per namespace, new namespaces need labels by default, which a platform can automate.

## A compliant pod

A restricted pod sets non-root, disables escalation, drops capabilities and uses the runtime default seccomp profile.

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault
```

## Beyond the standards

The standards are fixed. Organisation rules such as allowed registries, required labels or banned host ports need a policy engine. ValidatingAdmissionPolicy, built in and written in CEL, covers many rules without running a webhook. Kyverno and OPA Gatekeeper add richer policy languages, mutation and reporting. Keep policy as code in version control and test it before rollout.

```diagram
title: Pod Security Standards and admission policy
node: ns | Namespace labels | 0 | 1 | Select level and mode. | Missing labels. | store
node: psa | Pod Security admission | 1 | 1 | Checks each pod. | Warn only. | security
node: pol | Policy engine | 2 | 1 | Custom rules. | Webhook down. | security
node: pod | Pod spec | 3 | 1 | Security context. | Root and escalation. | process
edge: ns | psa
edge: psa | pol
edge: pol | pod
```

## Incident: A namespace nobody labelled

> **Incident:** A privileged pod ran in a new namespace because the standard was only applied to old ones.

```console
$ kubectl get ns dev-new --show-labels
NAME      STATUS   AGE   LABELS
dev-new   Active   2d    kubernetes.io/metadata.name=dev-new
$ kubectl get pod debug -n dev-new -o jsonpath='{.spec.containers[0].securityContext}'
{"privileged":true}
(this is a simulated illustration, not a real incident)
```

Pod Security applies per namespace through labels, and the new namespace had none, so nothing was enforced. The team added a namespace creation workflow that sets warn, audit and enforce labels, and a policy that rejects namespaces without them. A control that must be remembered per namespace will eventually be forgotten.

## Common mistakes

- Enforcing restricted without a warn phase
- Leaving new namespaces unlabelled
- Using the standards for organisation specific rules
- Running a policy webhook without exclusions
- Forgetting readOnlyRootFilesystem and capability drops

```quiz
Q: Which standard forbids running as root?
+ Restricted
- Privileged :: Allows everything.
- Baseline :: Allows root.
- None :: No.
> Restricted requires non-root.

Q: How is Pod Security admission configured?
+ By labels on namespaces
- By a ConfigMap in kube-system :: No.
- By a CNI plugin :: No.
- By a node flag :: No.
> Labels set mode and level.

Q: What does warn mode do?
+ Returns a warning to the user without rejecting
- Blocks pods :: That is enforce.
- Deletes pods :: No.
- Disables the standard :: No.
> Use it to prepare for enforcement.

Q: What can express custom rules without a webhook?
+ ValidatingAdmissionPolicy
- A Secret :: No.
- A DaemonSet :: No.
- A Service :: No.
> It uses CEL expressions in the API server.
```

```cards
Pod Security Standards :: Three levels of pod hardening: privileged, baseline and restricted
Security context :: Pod or container settings that control privileges
ValidatingAdmissionPolicy :: A built-in policy object that uses CEL
Kyverno :: A policy engine for Kubernetes
Gatekeeper :: An OPA based policy controller
```
