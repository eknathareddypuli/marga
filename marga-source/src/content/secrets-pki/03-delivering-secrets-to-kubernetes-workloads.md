---
title: Delivering secrets to Kubernetes workloads
minutes: 13
summary: Compare the ways to get secrets into pods: native Secrets, External Secrets Operator, the Secrets Store CSI driver and SOPS encrypted files, with their trade offs and failure modes.
---

A Kubernetes Secret is encoded, not encrypted by default, and anyone with read access to it or to etcd can see it. The question is where the real secret lives and how it reaches the pod.

## What you will learn

- What a native Secret does and does not protect
- External Secrets Operator: sync from a store
- Secrets Store CSI driver: mount at start
- Encrypted files in a repository with SOPS
- Environment variables versus files and refresh

## Native Secrets

A Secret is base64 encoded data stored in etcd. Enable encryption at rest for etcd, restrict who can get and list Secrets with RBAC, and avoid mounting them where not needed. Treat access to a namespace Secret as access to the secret, because pods in the namespace can read it.

## External Secrets Operator

The operator reads values from an external store such as a cloud secret manager or Vault and creates native Secrets in the cluster. You describe the mapping in a custom resource, and the operator refreshes it on an interval. This keeps the source of truth outside the cluster and supports rotation, at the cost that the values still exist as Secrets inside.

## Secrets Store CSI driver

The driver mounts secrets from an external store as files in the pod when it starts, and can optionally create a Secret too. Values need not be stored in etcd if you only use the mount. The pod depends on the store being reachable at start, so plan for outages and caching.

## Encrypted files with SOPS

SOPS encrypts the values in a file with a key from a cloud key service or an age key, so the file can be committed safely and decrypted by the deployment tool. It suits small teams and bootstrap secrets. Access control moves to who can use the key, and rotation needs a re encryption step.

## Environment variables or files

Environment variables are simple but appear in process listings, crash dumps and child processes, and do not change without a restart. Files can be updated in place and read on demand. Prefer files for long lived pods that must pick up rotated values, and verify that the application re reads them.

```diagram
title: Delivering secrets to Kubernetes workloads
node: store | Secret store | 0 | 1 | Source of truth. | Unreachable. | store
node: sync | Operator or driver | 1 | 1 | Sync or mount. | Stale. | process
node: pod | Pod | 2 | 1 | Reads file. | Old value. | service
node: rot | Rotation | 3 | 1 | New version. | No reload. | process
edge: store | sync
edge: sync | pod
edge: pod | rot
```

## Incident: The rotation that the pods never saw

> **Incident:** A database password was rotated and the application kept failing until every pod was restarted.

```console
$ kubectl get externalsecret db-creds -n shop -o jsonpath="{.status.refreshTime}"
2026-11-10T08:00:12Z
$ kubectl exec deploy/orders -n shop -- printenv DB_PASSWORD | wc -c
17
(this is a simulated illustration, not a real incident)
```

The operator refreshed the Secret on time, but the application read the password from an environment variable at start, so running pods kept the old value and failed after the old password was revoked. The team mounted the value as a file, made the application re read it on failure and added a rolling restart trigger when the Secret changed.

## Common mistakes

- Believing base64 means encrypted
- No encryption at rest for etcd
- Broad RBAC that lets everyone list Secrets
- Assuming running pods see rotated values
- Depending on the store with no plan for outage

```quiz
Q: Is a Kubernetes Secret encrypted by default?
+ No, it is only encoded unless encryption at rest is enabled
- Yes always :: Not true.
- Only on weekends :: No.
- Only with Helm :: No.
> Enable etcd encryption and use RBAC.

Q: What does External Secrets Operator do?
+ Syncs values from an external store into Secrets
- Builds images :: No.
- Schedules pods :: No.
- Routes traffic :: No.
> The source of truth stays outside.

Q: Why might files beat environment variables?
+ Files can be updated in place and re read
- They are always faster :: Not the point.
- They hide the pod :: No.
- They need no RBAC :: No.
> Environment variables change only on restart.

Q: What is a trade off of the CSI driver?
+ The pod start depends on the store being reachable
- It needs no store :: Wrong.
- It disables RBAC :: No.
- It encrypts the network :: Not the issue.
> Plan for store outages.
```

```cards
External Secrets Operator :: A controller that syncs external secrets into Kubernetes
Secrets Store CSI driver :: A driver that mounts secrets from a store as files
SOPS :: A tool for encrypting values inside files
Encryption at rest :: Encrypting stored data on disk
```
