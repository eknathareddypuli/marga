---
title: Admission enforcement of provenance with policy
minutes: 12
summary: Enforce signed and approved images at admission with Kyverno or similar tools, roll out in audit mode first and design for the unreachable policy engine case.
---

Verification in CI is advisory until the cluster refuses anything that skipped it. Admission policy turns your supply chain rules into a gate that every workload must pass.

## What you will learn

- What an image policy checks
- Kyverno and similar engines
- Audit mode before enforce
- Exceptions and break glass access
- Availability of the policy engine itself

## What to check

Useful rules include: images must come from approved registries, must be referenced by digest, must have a valid signature from the release identity and must have an SBOM or provenance attestation. Keep rules small and clear so teams can understand a rejection.

## Engines

Kyverno expresses policies as Kubernetes resources and has built in image verification. Other options are OPA Gatekeeper, the built in ValidatingAdmissionPolicy for simple rules and the Sigstore policy controller. Choose by the team skills and by which checks you need, such as signature verification.

## Audit first

Start in audit mode, which records violations without blocking. Review the report, fix or exempt each case, then switch namespaces to enforce one by one. A sudden global enforce is the quickest way to stop deployments across the company.

## Exceptions

Some system namespaces and vendor images need exceptions. Write them as explicit, reviewed rules with an owner and expiry. Provide a break glass path, such as an annotated exemption with an audit trail, for real emergencies.

## Engine availability

A policy webhook with failure policy fail blocks changes when it is down, and with ignore it lets everything through. Run several replicas, spread them across zones, exclude the policy namespace and alert on webhook latency and errors. Decide the failure mode on purpose.

```diagram
title: Admission enforcement of provenance with policy
node: dev | Deploy request | 0 | 1 | Applies a pod. | Unsigned image. | external
node: api | API server | 1 | 1 | Calls the webhook. | Webhook timeout. | service
node: pol | Policy engine | 2 | 1 | Verifies signature. | Down or slow. | security
node: res | Allow or deny | 3 | 1 | Returns the decision. | Wrong failure mode. | process
edge: dev | api
edge: api | pol
edge: pol | res
```

## Incident: Enforce mode that blocked a security patch

> **Incident:** A fix could not be deployed because its new image was not signed yet.

```console
$ kubectl apply -f deploy.yaml
Error from server: admission webhook "verify-images.kyverno.svc" denied the request: image registry.example.com/api@sha256:77aa verification failed: no signatures found
$ kubectl get cpol verify-images -o jsonpath='{.spec.validationFailureAction}'
Enforce
(this is a simulated illustration, not a real incident)
```

The build pipeline had signed images only on the main branch, but the patch came from a release branch. The pipeline was fixed to sign release branches, and the team used a time limited exception to ship the urgent patch while the fix was in review.

## Common mistakes

- Switching to enforce without an audit period
- Rules nobody can read or explain
- No exception process for emergencies
- Running one policy engine replica
- Not excluding the policy engine own namespace

```quiz
Q: Why start in audit mode?
+ To see violations without blocking deployments
- To speed up pods :: No.
- To hide issues :: It shows them.
- To disable policies :: No.
> Then enforce gradually.

Q: What should policy require about references?
+ Images by digest
- Latest tags :: They move.
- Any tag :: They move.
- No registry :: Unsafe.
> Pin exact content.

Q: What is a risk of failure policy fail?
+ Deployments stop if the engine is down
- Faster pods :: No.
- Less logging :: No.
- Lower cost :: No.
> Plan availability.

Q: What belongs in an exception?
+ Owner, reason and expiry
- A secret :: No.
- A node name only :: Not enough.
- Nothing :: Needs accountability.
> Time limit it. Review the matching section of this lesson if it is unclear.
```

```cards
Admission policy :: Rules enforced when objects are created
Kyverno :: A policy engine using Kubernetes resources
Audit mode :: Reporting violations without blocking
Break glass :: A controlled emergency exception
```
