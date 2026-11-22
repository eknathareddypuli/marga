## How do you manage the lifecycle of a secret?
level: mid
I keep an inventory with owner, purpose and location, rank secrets by blast radius, rotate on a schedule and on demand with two valid versions during the change, and practise the revoke and review steps of a leak plan.

## How do you stop secrets reaching Git?
level: mid
I use pre commit hooks, server side scanning and push protection, scan the full history once, mask secrets in build logs and use secret mounts for builds. If one leaks, I revoke it first and clean history afterwards.

## Which way do you deliver secrets to pods?
level: senior
It depends. External Secrets Operator syncs from a store, the CSI driver mounts files without keeping a Secret, and SOPS suits small teams. I enable etcd encryption, restrict RBAC and prefer files that the application re reads on rotation.

## How do you avoid certificate outages?
level: mid
I keep an inventory from several sources, probe live endpoints, alert at thirty, fourteen and seven days and on failed renewals, and automate issuance with ACME or an internal CA. Short lifetimes make automation mandatory.

## How do you debug cert-manager?
level: mid
I describe the Certificate and follow the chain to CertificateRequest, Order and Challenge, reading events at each level. Common causes are ingress that blocks the challenge path, DNS permissions and an unavailable webhook.

## Why prefer identity to stored secrets?
level: senior
A workload that proves who it is with a short lived token needs no stored password, which cannot leak. OIDC federation, SPIFFE identities and envelope encryption with a key service make access narrow, temporary and auditable.
