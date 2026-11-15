---
title: Secrets: encryption at rest and external stores
minutes: 12
summary: Protect Secret objects with encryption at rest and tight access, and decide when to move to an external secret manager.
---

Kubernetes Secrets are base64 encoded, not encrypted. Out of the box anyone who can read etcd, a backup or the Secret object itself can read the value. Several layers fix that, and each addresses a different threat.

## What you will learn

- What a Secret protects and what it does not
- Encryption at rest with an EncryptionConfiguration and KMS
- Access control and avoiding exposure through pods
- External secret stores and the CSI driver or operators
- Rotation after exposure

## What base64 gives you

A Secret stores values as base64 so that binary data fits in YAML. Decoding takes one command. The protection comes from RBAC on the API, from encryption of the stored bytes and from keeping Secrets out of places where they leak, such as logs, environment dumps, images and version control.

## Encryption at rest

The API server can encrypt chosen resources before writing them to etcd, using an EncryptionConfiguration file passed with `--encryption-provider-config`. Providers include aescbc and secretbox with a local key, and kms, which wraps a data key with a key in an external key management service, so the key never sits next to the data. The first provider in the list is used to write, and the others are for reading. After enabling it, rewrite existing Secrets so they are encrypted.

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources: [secrets]
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: BASE64_32_BYTE_KEY
      - identity: {}
```

```bash
kubectl get secrets -A -o json | kubectl replace -f -
```

## Verify

Read a Secret directly from etcd and check for the encryption prefix instead of readable text. An encrypted value starts with `k8s:enc:` and the provider name.

```bash
ETCDCTL_API=3 etcdctl get /registry/secrets/shop/db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key | head -c 80
```

## Reducing exposure

Restrict get, list and watch on Secrets, since list returns every value. Mount Secrets as files instead of environment variables when possible, because environment variables appear in process listings and crash dumps. Limit who can create pods in a namespace, because a pod can mount any Secret there. Never put Secrets in images or manifests in version control unencrypted.

## External stores

Tools such as the External Secrets Operator and the Secrets Store CSI driver fetch values from a manager such as Vault or a cloud secrets service and present them to pods, with central rotation, audit and access policy. They reduce the amount of long lived material in etcd. The trade is dependency on the external service and its availability. After any exposure, rotate the secret itself and everything that used it, since removing access does not undo a copy.

```diagram
title: Secrets: encryption at rest and external stores
node: app | Pod | 0 | 1 | Mounts the secret. | Env var leak. | process
node: api | API server | 1 | 1 | Encrypts on write. | No config. | service
node: etcd | etcd | 2 | 1 | Stores ciphertext. | Plain text. | store
node: kms | KMS or external store | 3 | 1 | Holds the key. | Unavailable. | external
edge: app | api
edge: api | etcd
edge: api | kms
```

## Incident: Plain text in a backup

> **Incident:** A routine review found a database password readable in an etcd snapshot.

```console
$ strings /backup/etcd-snapshot.db | grep -m1 -i password
password: Sup3rS3cret
$ grep -c encryption-provider-config /etc/kubernetes/manifests/kube-apiserver.yaml
0
(this is a simulated illustration, not a real incident)
```

Without an encryption configuration, Secrets were stored in readable form, and snapshots, stored on a shared disk, exposed them. The team enabled encryption at rest, rewrote all Secrets, rotated the exposed credentials and encrypted and restricted backups. Enabling encryption protects new writes only until existing objects are rewritten.

## Common mistakes

- Believing base64 is encryption
- Enabling encryption and not rewriting existing Secrets
- Granting list on Secrets broadly
- Passing secrets as environment variables everywhere
- Not rotating after exposure

```quiz
Q: Is a Kubernetes Secret encrypted by default?
+ No, it is base64 encoded
- Yes with AES :: Not by default.
- Yes with TLS only :: That is in transit.
- Only in namespaces :: No.
> Base64 is not protection.

Q: What must you do after enabling encryption at rest?
+ Rewrite existing Secrets
- Nothing :: Old ones remain plain.
- Reboot nodes :: No.
- Delete the CA :: No.
> Only new writes are encrypted otherwise.

Q: What does a KMS provider improve?
+ The key is kept outside the cluster storage
- Speed :: No.
- DNS :: No.
- Scheduling :: No.
> A wrapped data key reduces exposure.

Q: Why can list on Secrets be dangerous?
+ It returns the values of all Secrets in scope
- It deletes them :: No.
- It rotates them :: No.
- It hides them :: No.
> list is effectively read.
```

```cards
EncryptionConfiguration :: The API server file that defines encryption at rest
KMS provider :: An encryption provider that uses an external key service
aescbc :: A local key encryption provider
External Secrets Operator :: A controller that syncs secrets from external stores
Rotation :: Replacing a credential with a new one
```
