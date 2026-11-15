---
title: CKA: RBAC, kubeconfig and certificate tasks
minutes: 13
summary: Create roles and bindings, test permissions with auth can-i, build kubeconfig entries and issue a user certificate through the CSR API, the access tasks that appear throughout the CKA.
---

Access control questions are quick to solve when you know the commands, and slow when you build the YAML from scratch. This lesson gives you the imperative forms, the checks and the certificate flow for creating a user.

## What you will learn

- Roles, cluster roles and bindings from the command line
- Verifying access with auth can-i
- Service accounts and their tokens
- Creating a user certificate with the CSR API and kubeconfig

## Roles and bindings

A Role grants permissions inside one namespace. A ClusterRole grants cluster-wide permissions, or permissions on cluster-scoped resources. A RoleBinding grants a Role (or a ClusterRole, within one namespace) to subjects; a ClusterRoleBinding grants cluster-wide.

```bash
kubectl create role pod-reader --verb=get,list,watch --resource=pods -n dev
kubectl create rolebinding read-pods --role=pod-reader --user=jane -n dev
kubectl create clusterrole node-viewer --verb=get,list --resource=nodes
kubectl create clusterrolebinding view-nodes --clusterrole=node-viewer --user=jane
kubectl create rolebinding deployer --clusterrole=edit --serviceaccount=dev:deployer -n dev
```

Note the service account form, `namespace:name`. Reusing a built-in ClusterRole such as `view`, `edit` or `admin` through a RoleBinding limits it to one namespace and saves writing rules.

## Test before you trust

```bash
kubectl auth can-i list pods -n dev --as jane
kubectl auth can-i delete pods -n dev --as jane
kubectl auth can-i get nodes --as jane
kubectl auth can-i --list -n dev --as jane
kubectl auth can-i create deployments -n dev --as system:serviceaccount:dev:deployer
```

The `--as` option checks permissions for another identity, which needs your own account to be allowed to impersonate. Use `yes` and `no` outputs as your verification. If a task says "allow user X to do Y", confirm both the allowed action and one that should be denied.

## Aggregated rules and subresources

Rules can name subresources such as `pods/log` or `deployments/scale`, and specific resource names through `--resource-name`. When a task needs "read logs of pods" you need `pods/log`, not only `pods`. If you are unsure, use `kubectl api-resources` to see resource names and API groups, and note that group names matter for the `apiGroups` field in YAML: core resources use an empty group, deployments use `apps`.

## Service accounts

```bash
kubectl create serviceaccount deployer -n dev
kubectl create token deployer -n dev
kubectl run tool --image=busybox:1.36 --overrides='{"spec":{"serviceAccountName":"deployer"}}' -n dev --dry-run=client -o yaml
```

Since Kubernetes 1.24, service accounts no longer get long-lived token secrets automatically, and `kubectl create token` issues a short-lived token. In a pod, set `serviceAccountName` in the spec to use an account. To stop a pod from receiving a token it does not need, set `automountServiceAccountToken: false`.

## Create a user with the CSR API

Kubernetes has no user objects; users are identities proven by certificates or other authentication. To add a user with a client certificate:

```bash
openssl genrsa -out jane.key 2048
openssl req -new -key jane.key -subj "/CN=jane/O=dev-team" -out jane.csr
base64 -w0 jane.csr
```

Create a CertificateSigningRequest object with that content:

```yaml
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: jane
spec:
  request: LS0tLS1CRUdJTi...   # base64 of jane.csr
  signerName: kubernetes.io/kube-apiserver-client
  usages:
    - client auth
```

Then approve it and fetch the certificate:

```bash
kubectl certificate approve jane
kubectl get csr jane -o jsonpath='{.status.certificate}' | base64 -d > jane.crt
```

The CN becomes the user name and O becomes a group. Grant permissions with a binding to the user or group.

## Build a kubeconfig entry

```bash
kubectl config set-credentials jane --client-certificate=jane.crt --client-key=jane.key --embed-certs=true
kubectl config set-context jane@kubernetes --cluster=kubernetes --user=jane --namespace=dev
kubectl config use-context jane@kubernetes
kubectl config view --minify
```

When a task says to write a kubeconfig to a given file, use `--kubeconfig=/path` consistently on each command, or set `KUBECONFIG`. Check the result with `kubectl --kubeconfig=/path config view`.

## Check bindings you did not write

Sometimes the task is to find who can do something dangerous or why a service account is denied. Use `kubectl get rolebinding,clusterrolebinding -A -o wide`, and `kubectl describe` a binding to see the role and subjects. Remember that permissions only add up: there are no deny rules.

```python
rules = {
    "pod-reader": {"pods": {"get", "list", "watch"}},
    "editor": {"pods": {"get", "list", "create", "delete"}, "deployments": {"get", "list", "create"}},
}
bindings = {"jane": ["pod-reader"], "deployer": ["editor"]}

def can(user, verb, resource):
    return any(verb in rules[r].get(resource, set()) for r in bindings.get(user, []))

print(can("jane", "list", "pods"), can("jane", "delete", "pods"), can("deployer", "create", "deployments"))
```

```diagram
title: Giving a user access
node: key | Key and CSR | 0 | 1 | openssl with CN and O. | Wrong common name. | process
node: csr | CertificateSigningRequest | 1 | 1 | Submitted to the API. | Wrong signer name. | service
node: apr | Approve and fetch | 2 | 1 | kubectl certificate approve. | Forgetting to approve. | security
node: cfg | kubeconfig entry | 3 | 1 | Credentials and context. | Wrong cluster name. | store
node: rbac | Role and binding | 4 | 1 | What the identity may do. | Binding to a different name. | security
node: test | auth can-i | 4 | 3 | Prove allowed and denied. | Testing only the allowed case. | observe
edge: key | csr
edge: csr | apr
edge: apr | cfg
edge: cfg | rbac
edge: rbac | test
```

## Incident: Allowed to list, not to read logs

> **Incident:** A user with a pod reader role could list pods but got an error when reading logs for a task.

```console
$ kubectl auth can-i get pods/log -n dev --as jane
no
$ kubectl logs web -n dev --as jane
Error from server (Forbidden): pods "web" is forbidden: User "jane" cannot get resource "pods/log" in API group "" in the namespace "dev"
(this is a simulated illustration, not a real incident)
```

The role named only `pods`, but logs are a separate subresource, `pods/log`. Adding it to the role's resources fixed the problem. The error message names the exact resource, verb and namespace, which is the quickest guide to what to add.

## Common mistakes

- Forgetting subresources such as pods/log or pods/exec
- Writing the service account subject without its namespace
- Creating a CSR with the wrong signer name
- Granting a ClusterRoleBinding when a RoleBinding was enough
- Testing only that access is allowed, not that other access is denied

```quiz
Q: Which command checks whether a user may list pods in a namespace?
+ kubectl auth can-i list pods -n dev --as jane
- kubectl get user jane :: Users are not objects.
- kubectl describe permissions :: Not a command.
- kubectl check pods :: Not a command.
> auth can-i answers yes or no for an identity and action.

Q: How does a RoleBinding differ from a ClusterRoleBinding?
+ A RoleBinding grants permissions in one namespace, a ClusterRoleBinding across the cluster
- They are identical :: Scope differs.
- A RoleBinding grants more access :: It grants less.
- ClusterRoleBinding applies to one pod :: Not how it works.
> Scope is the key difference.

Q: What does the CN field of a client certificate become?
+ The user name
- The namespace :: Not used that way.
- The node name :: Not used that way.
- The pod name :: Not used that way.
> The CN is the user and O entries are groups.

Q: Why can a user list pods but fail to read logs?
+ Logs are a separate subresource, pods/log
- Logs are disabled by default :: They are not.
- The user lacks a kubeconfig :: They connected fine.
- Pods have no logs :: They do.
> RBAC rules name subresources separately.
```

```cards
Role :: A set of permissions inside one namespace
ClusterRole :: A set of permissions that may cover the whole cluster or non-namespaced resources
RoleBinding :: Grants a role to users, groups or service accounts in one namespace
CertificateSigningRequest :: A Kubernetes object used to request a signed certificate
kubeconfig :: A file holding clusters, users and contexts that kubectl uses
```
