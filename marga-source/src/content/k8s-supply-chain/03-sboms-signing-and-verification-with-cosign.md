---
title: SBOMs, signing and verification with cosign
minutes: 12
summary: Generate a software bill of materials, sign images and attestations with cosign and keyless identities, and verify them before use.
---

A signature says who vouched for an image. A software bill of materials says what is inside it. Together they let you answer which images contain a bad library and prove who built them.

## What you will learn

- What an SBOM contains and how to use it
- Signing images and attaching attestations
- Keyless signing with identity and a transparency log
- Verifying signatures in CI and in the cluster
- Key and identity management

## SBOMs

An SBOM lists the packages and versions in an image, in formats such as SPDX or CycloneDX. Generate it at build time, store it with the image and search it when a new vulnerability is announced. You can then list affected images in minutes instead of rescanning everything.

## Signing

Cosign signs the image digest and stores the signature next to the image in the registry. An attestation is a signed statement about the image, such as its SBOM or its provenance. Sign the digest, never the tag, since a tag can move.

## Keyless signing

Keyless signing uses a short lived certificate issued to the identity of the CI job, such as a workflow in a repository, through OpenID Connect. The signing event is recorded in a public transparency log. You do not store a long lived key, and a verifier checks the identity and the issuer instead of a key.

## Verifying

Verification checks that a signature exists for the digest and that the signer identity and issuer match what you expect. Do it in the pipeline before promotion and again in the cluster at admission. A signature from the wrong identity must fail.

## Managing identities

If you use keys, keep them in a KMS or hardware module and rotate them. With keyless signing, protect the CI workflow itself, because whoever can run it can sign. Restrict which branches and workflows are allowed to produce releases.

```diagram
title: SBOMs, signing and verification with cosign
node: b | Build job | 0 | 1 | Builds and generates SBOM. | Open to any branch. | process
node: s | cosign sign | 1 | 1 | Signs digest. | Wrong identity. | security
node: r | Registry | 2 | 1 | Image and signature. | Tag moved. | store
node: v | Verify step | 3 | 1 | Checks identity. | Not enforced. | security
edge: b | s
edge: s | r
edge: r | v
```

## Incident: A signed image from the wrong workflow

> **Incident:** An image signed by a test workflow was promoted to production.

```console
$ cosign verify registry.example.com/api@sha256:41be0d20 --certificate-identity-regexp 'https://github.com/example/.*' --certificate-oidc-issuer https://token.actions.githubusercontent.com | head -c 120
Verification for registry.example.com/api@sha256:41be0d20 --
The following checks were performed on each of these signatures:
(this is a simulated illustration, not a real incident)
```

The identity pattern accepted any workflow in the organisation, including a test workflow. The policy was tightened to the release workflow on the main branch, and the verification step now fails for any other identity.

## Common mistakes

- Signing tags instead of digests
- Accepting any identity from the right issuer
- No SBOM stored for later search
- Long lived signing keys in CI variables
- Verifying only in CI and never at admission

```quiz
Q: What does an SBOM list?
+ Packages and versions inside an image
- Users :: No.
- Costs :: No.
- Alerts :: No.
> It supports vulnerability search.

Q: What does cosign sign?
+ The image digest
- The tag only :: Tags can move.
- The node :: No.
- The namespace :: No.
> Digest gives exact content.

Q: What does keyless signing remove?
+ Long lived signing keys to store
- The need for identity :: It relies on identity.
- The registry :: Still needed.
- The pipeline :: Still needed.
> Identity replaces the key.

Q: What must verification check?
+ The signer identity and issuer
- The image size :: Not enough.
- The tag name :: Not enough.
- The OS :: Not relevant.
> A valid signature from the wrong signer is a failure.
```

```cards
SBOM :: A list of components inside software
Attestation :: A signed statement about an artifact
Keyless signing :: Signing with a short lived identity certificate
Transparency log :: A public append only record of signing events
```
