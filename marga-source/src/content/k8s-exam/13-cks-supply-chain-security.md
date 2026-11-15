---
title: CKS: supply chain security
minutes: 13
summary: Control what runs in your cluster: minimise and scan images, pin by digest, allow only trusted registries through admission control, analyse manifests statically, and verify signatures.
---

Supply chain security is another fifth of the CKS. The idea is that the cluster is only as safe as the images, charts and manifests it runs. The DevSecOps module covers the principles of provenance. This lesson is about the tools and tasks you will meet.

## What you will learn

- Smaller, safer images and Dockerfile habits
- Scanning images with Trivy and acting on results
- Restricting registries and tags through admission
- Static analysis of manifests, and signatures

## Minimise the image

Every package in an image is something to patch and something an attacker can use. Good habits:

- Use a small base image, such as a minimal or distroless one
- Use multi-stage builds so compilers and build tools do not ship
- Run as a non-root user
- Pin base images by version, ideally by digest
- Do not copy secrets into layers
- Remove shells and package managers from runtime images where practical

A Dockerfile reviewed in a task might use `latest`, run as root and install extra tools. Fix those lines.

```dockerfile
FROM golang:1.23 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app ./cmd/app

FROM gcr.io/distroless/static:nonroot
COPY --from=build /app /app
USER nonroot
ENTRYPOINT ["/app"]
```

## Scan images

Trivy is a common scanner for images, file systems and configuration. It lists known vulnerabilities by severity.

```bash
trivy image nginx:1.21
trivy image --severity HIGH,CRITICAL nginx:1.21
trivy image --ignore-unfixed --severity CRITICAL nginx:1.27
trivy image -f json -o result.json nginx:1.27
trivy config ./deploy
```

A typical task: scan several images used by pods in a namespace and delete the pods or deployments that use an image with a critical vulnerability, or choose the least vulnerable image. To list images in use:

```bash
kubectl get pods -n shop -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'
```

Remember that a scan is a snapshot. New vulnerabilities are published every day, so scan again on a schedule and in the pipeline.

## Pin by digest

A tag such as `1.27` can point to different content over time. A digest cannot.

```yaml
containers:
  - name: app
    image: nginx@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

Get the digest with the registry or with `crictl images --digests`. Pinning gives reproducible deployments and prevents a swapped image under the same tag.

## Allow only trusted registries

You can block images from unknown places at admission. Options in the curriculum include:

- **ImagePolicyWebhook**, an admission plugin that asks an external service whether an image is allowed
- **OPA Gatekeeper** with a constraint that allows only certain repository prefixes
- **Kyverno** policies that match image names and require digests or signatures

With Gatekeeper, you apply a ConstraintTemplate, then a Constraint naming the namespaces and allowed prefixes. After creating them, test by trying to run an image from another registry and confirm that the API rejects it with the policy message.

```bash
kubectl get constrainttemplates
kubectl get k8sallowedrepos
kubectl run bad --image=docker.io/library/busybox:1.36 -n shop
```

If you configure ImagePolicyWebhook, you edit the API server manifest to enable the plugin and provide an admission configuration file with a kubeconfig for the webhook. Keep a backup of the manifest, because a mistake here can stop pods from being admitted at all.

## Static analysis

Check manifests for risky settings before deploying. Tools such as kubesec score a manifest, and Trivy can scan configuration for misconfigurations, such as privileged containers, missing limits or host paths.

```bash
kubesec scan pod.yaml
trivy config ./manifests
```

A task may ask you to fix the findings, then re-scan to show improvement. Common fixes: set a security context, drop capabilities, add resource limits and avoid host namespaces.

## Signatures and provenance

Signing an image proves who built it and that it has not changed. The Sigstore project provides cosign for signing and verifying, and the SLSA framework describes levels of build integrity. For the exam, know what a signature and an SBOM, the software bill of materials, are for, and how an admission policy can require verified signatures. Also know that your CI system and registry credentials are part of the chain and need the same protection as the cluster.

```python
allowed = ("registry.example.com/", "gcr.io/distroless/")
images = ["registry.example.com/shop/web:1.4", "docker.io/library/nginx:latest", "gcr.io/distroless/static:nonroot"]
for img in images:
    ok = img.startswith(allowed) and not img.endswith(":latest")
    print(("ALLOW " if ok else "DENY  ") + img)
```

```diagram
title: From source to running image
node: src | Source and Dockerfile | 0 | 1 | Minimal, non-root, pinned base. | Latest tags and extra tools. | store
node: bld | Build | 1 | 1 | Multi-stage build, no secrets in layers. | Secrets baked into layers. | process
node: scan | Scan and sign | 2 | 1 | Vulnerability scan and a signature. | Scan results ignored. | security
node: reg | Registry | 3 | 0 | Trusted store with access control. | Public or shared credentials. | store
node: adm | Admission | 3 | 2 | Allowed registries, digests, signatures. | Policy not enforced for all namespaces. | security
node: run | Cluster | 4 | 1 | Only approved images start. | Unscanned images deployed by hand. | service
edge: src | bld
edge: bld | scan
edge: scan | reg
edge: reg | adm
edge: adm | run
```

## Incident: The image from a lookalike registry

> **Incident:** A pod started from an image with a name almost identical to an internal one, pulled from a public registry, and ran an unexpected process.

```console
$ kubectl get pod report -n shop -o jsonpath='{.spec.containers[0].image}'
docker.io/shop/report:2.3
$ kubectl get pod report -n shop -o jsonpath='{.metadata.labels}'
{"app":"report"}
(this is a simulated illustration, not a real incident)
```

The manifest had omitted the internal registry prefix, so the runtime pulled a similarly named public image. After this the team required fully qualified image names, added a policy that allowed only the internal registry prefix, and required digests for production namespaces. Testing a deliberately bad image proved that the policy denied it.

## Common mistakes

- Treating one scan as permanent
- Allowing the latest tag or short image names
- Enabling an admission plugin without a backup of the API server manifest
- Fixing the Dockerfile but not rebuilding and redeploying the image
- Ignoring the build system and registry as part of the attack surface

```quiz
Q: Why pin an image by digest?
+ A digest identifies exact content and cannot be silently swapped
- It makes the image smaller :: Not the reason.
- It speeds up pulls :: Not the reason.
- It removes vulnerabilities :: It does not patch anything.
> Tags are movable, digests are not.

Q: What does Trivy do?
+ Scans images and configuration for known vulnerabilities and misconfigurations
- Schedules pods :: Not its job.
- Stores secrets :: Not its job.
- Manages DNS :: Not its job.
> Results are listed by severity.

Q: How can a cluster allow images only from a trusted registry?
+ An admission policy such as Gatekeeper, Kyverno or ImagePolicyWebhook
- Network policy only :: That controls pod traffic.
- Larger nodes :: Unrelated.
- Renaming namespaces :: Unrelated.
> Admission is where requests can be checked and denied.

Q: What is an SBOM?
+ A list of the components inside software
- A type of load balancer :: No.
- A network policy :: No.
- A signing key :: No.
> It helps find where a vulnerable component is used.
```

```cards
Supply chain :: Everything that produces and delivers the software you run
Image digest :: A content hash that identifies an exact image
Trivy :: A scanner for vulnerabilities and misconfigurations
ImagePolicyWebhook :: An admission plugin that asks an external service to approve images
SBOM :: A software bill of materials listing the components of software
```
