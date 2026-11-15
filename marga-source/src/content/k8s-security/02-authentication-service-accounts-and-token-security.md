---
title: Authentication, service accounts and token security
minutes: 12
summary: Understand how users and workloads authenticate, how projected service account tokens work, and how to reduce the damage of a stolen token.
---

Kubernetes has no built-in user database. Humans arrive with certificates or tokens from an identity provider, and workloads arrive as service accounts. Most real incidents involve a credential that was too powerful, too long lived or in the wrong place.

## What you will learn

- How users are authenticated: certificates, OIDC and webhooks
- Service accounts and the tokens pods receive
- Bound, audience scoped, short lived tokens
- Turning off automount and avoiding default accounts
- Anonymous access and kubeconfig hygiene

## Users

Users are not objects in the API. A client certificate signed by the cluster CA gives a user name from its common name and groups from its organisation. This is simple, but certificates cannot be revoked individually, so avoid them for people. OpenID Connect integrates with an identity provider, giving short lived tokens and central offboarding, and is the usual choice. Static token files and basic auth are legacy and should be off.

## Service accounts

A ServiceAccount is the identity of a workload. Each namespace has a default one. Pods use it unless told otherwise. Current clusters issue projected tokens: they are bound to the pod, expire in about an hour by default, are refreshed by the kubelet and carry an audience. Older long lived secret based tokens exist only if created deliberately, and should be avoided.

## Reducing exposure

Most pods never call the API server, so they should not carry a token. Set `automountServiceAccountToken: false` on the service account or the pod. Create dedicated service accounts per workload with only the roles they need, never rely on the default account, and never bind powerful roles to it. Where a token is needed for another system, request an audience scoped projected token.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: reporter
  namespace: shop
automountServiceAccountToken: false
```

## Check what is exposed

```bash
kubectl get sa -A
kubectl auth can-i --list --as=system:serviceaccount:shop:default -n shop
kubectl get secrets -A --field-selector type=kubernetes.io/service-account-token
kubectl create token reporter -n shop --duration=10m
```
The last command creates a short lived token for testing.

## Anonymous access and kubeconfigs

Set `--anonymous-auth=false` on the API server unless a health check needs it, and on the kubelet. Treat kubeconfig files as credentials: keep them out of repositories, give each person their own, prefer short lived exec plugins from the cloud or OIDC, and rotate admin credentials after staff changes.

```diagram
title: Authentication, service accounts and token security
node: user | Human user | 0 | 0 | OIDC or certificate. | Shared admin config. | external
node: sa | ServiceAccount | 0 | 2 | Workload identity. | Default account. | security
node: tok | Projected token | 1 | 2 | Bound and short lived. | Long lived secret. | security
node: api | API server | 2 | 1 | Authenticates. | Anonymous on. | service
edge: user | api
edge: sa | tok
edge: tok | api
```

## Incident: A token in a public repository

> **Incident:** A developer committed a kubeconfig with a long lived admin credential.

```console
$ kubectl auth whoami
ATTRIBUTE   VALUE
Username    kubernetes-admin
Groups      [system:masters system:authenticated]
$ kubectl get secrets -A --field-selector type=kubernetes.io/service-account-token | wc -l
14
(this is a simulated illustration, not a real incident)
```

The committed file held a client certificate in the system:masters group, which cannot be revoked without replacing the CA. Anyone who copied it had permanent cluster admin. The team rotated the cluster credentials, moved people to OIDC with short lived tokens, deleted legacy token secrets and added secret scanning to the repository. Prefer identities that can be revoked and that expire.

## Common mistakes

- Using client certificates for people
- Leaving automountServiceAccountToken on by default
- Binding roles to the default service account
- Keeping legacy long lived token secrets
- Committing kubeconfig files

```quiz
Q: What is a projected service account token?
+ A short lived token bound to a pod and an audience
- A permanent key :: No.
- A password :: No.
- A DNS record :: No.
> The kubelet refreshes it.

Q: How do you stop a pod receiving an API token?
+ Set automountServiceAccountToken to false
- Delete the node :: No.
- Change the image :: No.
- Add a label :: No.
> It can be set on the service account or the pod.

Q: Why avoid client certificates for people?
+ They cannot be revoked individually
- They are too short :: No.
- They are slower :: No.
- They need DNS :: No.
> Revocation needs replacing the CA.

Q: What should the default service account have?
+ No extra permissions
- Cluster admin :: No.
- Secret read everywhere :: No.
- Node access :: No.
> Use dedicated accounts per workload.
```

```cards
ServiceAccount :: An identity for workloads in the cluster
Projected token :: A short lived token mounted into a pod
OIDC :: OpenID Connect, a way to authenticate users through an identity provider
Audience :: The intended recipient of a token
system:masters :: A group with unrestricted cluster access
```
