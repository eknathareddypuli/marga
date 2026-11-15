---
title: RBAC design, least privilege and auditing
minutes: 13
summary: Design roles and bindings that grant least privilege, spot dangerous permissions, and audit who can do what.
---

RBAC is simple to write and easy to over-grant. A few permissions are effectively cluster admin even though they look harmless, and reviewing roles for them is one of the highest value security tasks.

## What you will learn

- The RBAC objects and how they combine
- Patterns: narrow roles, namespaced bindings, aggregated roles
- Dangerous permissions and privilege escalation paths
- Auditing with can-i, who-can tools and the audit log
- Process for requesting and reviewing access

## Objects

A Role grants permissions within a namespace, and a ClusterRole grants cluster wide or reusable permissions. A RoleBinding binds a role or cluster role to subjects within one namespace, and a ClusterRoleBinding does so for the whole cluster. Binding a ClusterRole with a RoleBinding is a good pattern: define the permission set once and grant it per namespace. Rules list API groups, resources, verbs and optionally resource names.

## Design

Start from what the job needs and grant the verbs and resources for it, not a wildcard. Prefer groups from your identity provider as subjects over individual names. Use one namespace per team and bind built-in roles such as view and edit there. Keep admin and cluster-admin for a small set of break-glass accounts, with the use audited.

```bash
kubectl create role pod-reader --verb=get,list,watch --resource=pods -n shop
kubectl create rolebinding jane-reads --role=pod-reader --user=jane -n shop
kubectl auth can-i delete pods -n shop --as jane
```

## Dangerous permissions

Some permissions allow escalation. The verbs escalate and bind on roles let someone grant themselves more. Creating pods in a namespace lets a user mount any secret there, run privileged containers if policy allows, or use any service account in the namespace. Reading secrets exposes credentials. Access to `pods/exec` gives a shell in workloads. Impersonation lets a subject act as another. Wildcards in verbs or resources, and any permission on `nodes/proxy`, deserve special review.

## Auditing

List who can do something with `kubectl auth can-i --list --as`, or a plugin such as kubectl-who-can or rbac-tool to answer "who can create pods" across the cluster. Review ClusterRoleBindings to cluster-admin and system:masters regularly. The audit log shows which identities actually used permissions, which helps remove unused ones.

```bash
kubectl get clusterrolebindings -o json | grep -B2 -A8 cluster-admin | head -40
```

## Process

Request access through a reviewed change in version control, grant it with an expiry where possible and remove it when the need ends. Review roles each quarter. Treat a new role that includes secrets, exec, escalate, bind or wildcards as needing a second reviewer.

```diagram
title: RBAC design, least privilege and auditing
node: role | Role or ClusterRole | 0 | 1 | Defines permissions. | Wildcards. | security
node: bind | Binding | 1 | 1 | Grants to subjects. | Cluster wide by mistake. | security
node: subj | Group or user | 2 | 1 | Receives access. | Individuals. | external
node: aud | Audit | 3 | 1 | Finds excess. | Never reviewed. | observe
edge: role | bind
edge: bind | subj
edge: subj | aud
```

## Incident: The read-only role that could escalate

> **Incident:** A role called viewer turned out to let its holders become administrators.

```console
$ kubectl get clusterrole viewer -o jsonpath='{.rules}'
[{"apiGroups":["*"],"resources":["pods","secrets"],"verbs":["get","list","create"]}]
$ kubectl auth can-i create pods -n kube-system --as viewer-user
yes
(this is a simulated illustration, not a real incident)
```

The role allowed create on pods and get on secrets across the cluster, so a holder could start a pod in any namespace, mount any secret or use any service account. The name hid the risk. Replacing it with a narrow role bound only in specific namespaces, and reviewing roles for create on pods, secrets access, exec, escalate and bind, removed the path.

## Common mistakes

- Wildcards in verbs or resources
- Granting create pods without considering what pods can mount
- Using ClusterRoleBindings where RoleBindings suffice
- Binding to individuals instead of groups
- No periodic review

```quiz
Q: What does a RoleBinding to a ClusterRole do?
+ Grants that permission set within one namespace
- Grants cluster-wide access :: That is ClusterRoleBinding.
- Deletes the role :: No.
- Creates a user :: No.
> A useful reuse pattern.

Q: Why is create on pods dangerous?
+ A pod can mount secrets and use service accounts in its namespace
- Pods are free :: Not the issue.
- It uses disk :: Not the issue.
- It changes DNS :: No.
> Pod creation is a powerful permission.

Q: Which verbs allow privilege escalation in RBAC?
+ escalate and bind
- get and list :: Read only.
- watch :: Read only.
- proxy only :: Different risk.
> They let a user grant more permissions.

Q: How do you check what a user can do?
+ kubectl auth can-i --list --as the user
- kubectl get users :: Users are not objects.
- kubectl describe cluster :: No.
- etcdctl get :: No.
> It reports effective permissions.
```

```cards
Role :: A set of namespaced permissions
ClusterRole :: A set of cluster-wide or reusable permissions
RoleBinding :: A grant of a role to subjects in a namespace
escalate :: A verb that lets a user grant permissions they do not have
Break-glass account :: A highly privileged account for emergencies only
```
