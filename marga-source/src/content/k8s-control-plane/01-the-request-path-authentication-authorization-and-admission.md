---
title: The request path: authentication, authorization and admission
minutes: 12
summary: Follow one API request through authentication, authorization, mutating and validating admission and storage, and learn where each stage can reject or slow it.
---

Every change to a Kubernetes cluster is an HTTPS request to the API server. The server does not simply write what it receives. It passes each request through a fixed series of stages, and knowing the order explains most permission errors, webhook outages and surprising defaults.

## What you will learn

- The order of stages: authentication, authorization, mutating admission, schema validation, validating admission, storage
- How each stage can say no, and what the error looks like
- Why admission webhooks are powerful and risky
- How to read the stage from an error message

## Authentication: who is asking

The API server first works out the identity. It tries each configured authenticator until one succeeds: client certificates, bearer tokens (service account tokens), OpenID Connect tokens, or a webhook. If none succeeds, the request is rejected with 401 Unauthorized. A successful authenticator produces a user name, groups and extra attributes. Nothing about permissions is decided yet. A request with no credentials can still become the user `system:anonymous` if anonymous access is enabled, which is why hardening guides turn it off.

## Authorization: may they do this

Next the server asks the authorizers whether this identity may perform this verb on this resource in this namespace. A kubeadm cluster uses Node authorization and RBAC. The first authorizer that allows the request wins, and if none allows it the answer is 403 Forbidden. The message names the user, the verb, the resource and the namespace, which is usually enough to write the missing rule. You can test any identity with `kubectl auth can-i`.

## Admission: may the object be changed or accepted

Only an authorized request reaches admission. Mutating admission plugins and webhooks run first and may change the object, for example by adding a sidecar or a default value. The server then validates the object against its schema. Validating admission runs last and can only accept or reject. Built-in plugins include LimitRanger, ResourceQuota, ServiceAccount and Pod Security. Admission webhooks let your own service make the decision, and ValidatingAdmissionPolicy lets you write rules in CEL without running a service.

## Storage and the response

If every stage passes, the API server writes the object to etcd and returns the stored version with its new resourceVersion. Controllers then see the change through watches. Reads skip the admission stages, but still go through authentication and authorization.

## Reading errors by stage

A 401 is authentication, a 403 is authorization, and a message that starts with "admission webhook ... denied the request" or "admission plugin ... denied" is admission. A 422 usually means the object failed schema validation. A timeout on every create is a classic sign of a webhook that is slow or unreachable and configured with failurePolicy Fail.

```bash
kubectl auth can-i create pods -n dev --as jane
kubectl get validatingwebhookconfigurations
kubectl get mutatingwebhookconfigurations
```

```diagram
title: The request path: authentication, authorization and admission
node: client | Client | 0 | 1 | Sends the request. | Wrong credentials. | external
node: authn | Authentication | 1 | 1 | Identifies the user. | Anonymous allowed. | security
node: authz | Authorization | 2 | 1 | RBAC and Node rules. | Too broad roles. | security
node: mut | Mutating admission | 3 | 1 | May change the object. | Webhook slow or down. | process
node: val | Validating admission | 4 | 1 | Accepts or rejects. | Policy blocks valid change. | process
node: etcd | etcd | 5 | 1 | Stores the object. | No quorum. | store
edge: client | authn
edge: authn | authz
edge: authz | mut
edge: mut | val
edge: val | etcd
```

## Incident: The webhook that blocked every pod

> **Incident:** A security webhook went down and nobody could create pods anywhere in the cluster.

```console
$ kubectl run test --image=nginx
Error from server (InternalError): Internal error occurred: failed calling webhook "policy.example.com": Post "https://policy.svc:443/validate": dial tcp 10.0.4.12:443: connect: connection refused
$ kubectl get validatingwebhookconfigurations policy -o jsonpath='{.webhooks[0].failurePolicy}'
Fail
(this is a simulated illustration, not a real incident)
```

The webhook had failurePolicy Fail, so while its pods were down the API server refused every matching request, including the pods needed to bring the webhook back. The recovery was to delete or edit the webhook configuration so it ignored failures. Scope webhooks with namespace selectors, exclude the namespace that runs the webhook itself, and prefer failurePolicy Ignore for non-critical checks.

## Common mistakes

- Reading a 403 as an admission problem, or the reverse
- Giving a webhook failurePolicy Fail without excluding its own namespace
- Assuming reads go through admission
- Forgetting that mutating changes happen before validation
- Granting broad RBAC to fix a webhook error

```quiz
Q: Which stage runs immediately after authentication?
+ Authorization
- Admission :: Admission comes after authorization.
- Storage :: Storage is last.
- Scheduling :: Scheduling happens later, after the pod exists.
> Identity first, then permission, then admission.

Q: A request returns 403 Forbidden naming a user, verb and resource. What stage rejected it?
+ Authorization
- Authentication :: That would be 401.
- Validating admission :: Admission errors name the plugin or webhook.
- etcd :: Storage errors look different.
> 403 means the identity is known but not allowed.

Q: What runs first, mutating or validating admission?
+ Mutating admission
- Validating admission :: Validation sees the final object, so it runs after mutation.
- They run in parallel :: They run in a fixed order.
- Neither, they are optional steps after storage :: Both run before storage.
> Mutation can change the object, so validation must see the result.

Q: Why is failurePolicy Fail risky for a webhook?
+ If the webhook is unreachable, matching requests are rejected
- It makes the webhook faster :: It has no effect on speed.
- It disables RBAC :: It has no relation to RBAC.
- It deletes the webhook :: It only decides what happens on failure.
> An outage of the webhook can then block the cluster.
```

```cards
Authentication :: Establishing the identity behind a request
Authorization :: Deciding whether an identity may do an action
Mutating admission :: A stage that may change an object before it is stored
Validating admission :: A stage that accepts or rejects the final object
failurePolicy :: What the API server does when a webhook cannot be reached
```
