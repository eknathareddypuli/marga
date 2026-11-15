---
title: The software supply chain threat model and SLSA
minutes: 12
summary: Map where attackers can interfere between source code and a running pod, and use SLSA levels to decide which controls to add first.
---

Most cluster compromises start before the cluster: in a dependency, a build server or a registry. A supply chain threat model lists every step from commit to container and what can go wrong at each.

## What you will learn

- The stages from source to running pod
- Typical attacks at each stage
- What SLSA levels ask for
- Provenance and why it matters
- Choosing the first controls

## The stages

Code is written and reviewed, dependencies are pulled, a build runs, an image is pushed to a registry, a deployment tool pulls it and the cluster runs it. Each hand over is a place where something can be swapped, so each needs a check.

## Typical attacks

Examples include a malicious or hijacked dependency, a stolen CI token that pushes a poisoned image, a tag that is moved to a different image, a compromised build runner and an unreviewed change merged by a bot. Attackers prefer places with weak access control and little logging.

## SLSA levels

SLSA, the supply chain levels for software artifacts, describes how trustworthy a build is. Level one asks for provenance that records how an artifact was built. Higher levels ask for builds on a hosted service that signs provenance, with isolation so a user cannot forge it. The levels give a roadmap instead of a single yes or no.

## Provenance

Provenance is a signed statement: this image digest was built from this commit by this pipeline at this time. A cluster that checks provenance can refuse an image built by an unknown pipeline even if the registry contains it.

## First controls

Pin images by digest, scan dependencies, require reviews, protect the main branch and use short lived credentials in CI. Then sign images and verify at admission. Start with the steps that block the most likely attack for you.

```diagram
title: The software supply chain threat model and SLSA
node: src | Source and dependencies | 0 | 1 | Code and packages. | Hijacked package. | external
node: build | Build pipeline | 1 | 1 | Produces the image. | Stolen token. | process
node: reg | Registry | 2 | 1 | Stores images. | Moved tag. | store
node: cl | Cluster | 3 | 1 | Runs the image. | Unverified image. | security
edge: src | build
edge: build | reg
edge: reg | cl
```

## Incident: The tag that changed after review

> **Incident:** A deployment pulled a latest tag that pointed to an image nobody had reviewed.

```console
$ kubectl get pod web-1 -o jsonpath='{.status.containerStatuses[0].imageID}'
registry.example.com/web@sha256:9f2a77c1
$ crane digest registry.example.com/web:1.8
sha256:41be0d20
(this is a simulated illustration, not a real incident)
```

The tag 1.8 had been moved to a new image after the review, so the running digest did not match the reviewed one. The team pinned deployments by digest, made tags immutable in the registry and added a check that compares the deployed digest to the one in the release record.

## Common mistakes

- Deploying mutable tags such as latest
- Long lived registry credentials in CI
- Trusting any image in the registry
- No record of what built an image
- Starting with signing before basic access control

```quiz
Q: What does provenance state?
+ How an artifact was built and from what
- Its price :: No.
- Its license only :: Not only.
- Its size :: No.
> A signed build record.

Q: Why pin images by digest?
+ A digest identifies exact content, a tag can move
- Digests are shorter :: They are longer.
- Tags are encrypted :: No.
- Digests are faster :: Not the reason.
> Immutable reference.

Q: What is SLSA?
+ A framework of levels for build and artifact integrity
- A scanner :: It is a framework.
- A registry :: No.
- A CNI :: No.
> It gives a roadmap.

Q: Which is a supply chain attack?
+ A poisoned dependency pulled into the build
- A DNS typo :: Different class.
- A slow node :: Not an attack.
- A full disk :: Not an attack.
> Dependencies are targets.
```

```cards
Supply chain :: Everything between source code and a running workload
SLSA :: Levels describing build integrity
Provenance :: Signed record of how an artifact was built
Digest :: A hash that identifies exact image content
```
