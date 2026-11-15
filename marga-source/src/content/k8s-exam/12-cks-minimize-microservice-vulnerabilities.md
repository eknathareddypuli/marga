---
title: CKS: minimize microservice vulnerabilities
minutes: 14
summary: Make each workload a hard target: enforce pod security standards, set security contexts, sandbox untrusted code with runtime classes, encrypt secrets at rest and protect traffic between services.
---

This is the largest CKS domain, about a fifth of the exam. The topic is the security of the workloads themselves and the data they handle. The common thread is defence in depth: assume one layer will fail and make sure the next one holds.

## What you will learn

- Enforcing Pod Security Standards with admission labels
- Security context settings that matter
- Sandboxed runtimes with RuntimeClass
- Encryption of Secrets at rest, and mutual TLS between services

## Pod Security Standards and admission

Kubernetes defines three profiles. **Privileged** is unrestricted. **Baseline** blocks known privilege escalations, such as host namespaces and privileged containers. **Restricted** follows current hardening practice, requiring non-root users, dropped capabilities and a seccomp profile. The built-in Pod Security admission controller enforces them per namespace through labels:

```bash
kubectl label namespace shop pod-security.kubernetes.io/enforce=restricted
kubectl label namespace shop pod-security.kubernetes.io/warn=restricted pod-security.kubernetes.io/audit=restricted
kubectl get namespace shop --show-labels
```

The modes are `enforce` (reject), `warn` (allow with a warning) and `audit` (log). Start with warn to see what would break. A task may ask you to label a namespace and then fix a deployment so its pods are admitted. The rejection message lists which fields violate the profile.

## Security context

A restricted-compliant pod looks like this:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hardened
  namespace: shop
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: nginx:1.27
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

A read-only root filesystem breaks programs that write to disk, so give them an `emptyDir` for the paths they need. Many stock images need changes to run as non-root, for example listening on a port above 1024.

## Sandboxed runtimes

Ordinary containers share the host kernel. For untrusted or multi-tenant code, a sandbox adds a second boundary, such as gVisor, which implements a user-space kernel, or Kata Containers, which uses a lightweight VM. In Kubernetes, you define a RuntimeClass and reference it from the pod.

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
```

```yaml
spec:
  runtimeClassName: gvisor
  containers:
    - name: untrusted
      image: nginx:1.27
```

The handler name must match one configured in the container runtime on the node. If it does not, the pod fails with an event about the missing handler. Sandboxing has a performance cost and does not support every feature, so use it where the risk justifies it.

## Secrets: handling and encryption at rest

Secrets are base64 encoded by default and stored unencrypted in etcd unless you enable encryption. Anyone with etcd access, or a backup, can read them. Enable encryption with an `EncryptionConfiguration` file and an API server flag.

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded 32 byte key>
      - identity: {}
```

Pass `--encryption-provider-config=/etc/kubernetes/enc/enc.yaml` to the API server, and mount the file into the static pod. The first provider is used for writing; `identity` last lets the server still read old unencrypted data. Existing secrets are only encrypted when rewritten, so replace them:

```bash
kubectl get secrets -A -o json | kubectl replace -f -
```

Verify by reading a secret directly from etcd; the stored value should start with `k8s:enc:aescbc:v1:` instead of plain text. Production setups usually use a key management service provider so the key never sits on disk.

Also reduce exposure in use: mount secrets as files rather than environment variables when possible, limit who can read them with RBAC, and do not put them in images or configuration maps.

## Traffic between services

Inside the cluster, traffic is plain unless you protect it. Mutual TLS gives each service an identity and encrypts the connection. A service mesh or a CNI with encryption features can provide it. For the exam, know the purpose and be able to read a policy that requires it, and know that network policies control who may connect while mTLS controls who is talking and hides the contents.

## Admission and policy engines

Policy engines such as Open Policy Agent Gatekeeper and Kyverno enforce custom rules on objects at admission: required labels, allowed registries, banned settings. Tasks may give you a constraint template and ask you to create a constraint that applies it to a namespace, then show a violating pod being denied.

```python
pod = {"runAsNonRoot": True, "allowPrivilegeEscalation": False, "readOnlyRootFilesystem": True,
       "capabilities_drop": ["ALL"], "seccomp": "RuntimeDefault", "privileged": False}
problems = []
if not pod["runAsNonRoot"]: problems.append("runs as root")
if pod["allowPrivilegeEscalation"]: problems.append("privilege escalation allowed")
if pod["capabilities_drop"] != ["ALL"]: problems.append("capabilities not dropped")
if pod["privileged"]: problems.append("privileged container")
print(problems or "meets the restricted profile")
```

```diagram
title: Layers around one workload
node: adm | Admission | 0 | 1 | Pod Security labels and policy engine. | Namespace without labels. | security
node: ctx | Security context | 1 | 1 | Non-root, no escalation, dropped capabilities. | Defaults left permissive. | security
node: run | Runtime class | 2 | 0 | Sandbox for untrusted code. | Handler not installed on the node. | process
node: sec | Encrypted secrets | 2 | 2 | Encryption at rest and tight RBAC. | Keys stored with the data. | store
node: net | Network and mTLS | 3 | 1 | Allowed paths and encrypted connections. | Plain traffic between pods. | security
node: wl | Workload | 4 | 1 | The hardened service. | Trusting one layer only. | service
edge: adm | ctx
edge: ctx | run
edge: ctx | sec
edge: run | net
edge: sec | net
edge: net | wl
```

## Incident: Secrets in the clear

> **Incident:** An engineer assumed secrets were safe in the cluster. A backup of etcd was copied to a shared disk, and a quick search revealed a database password in plain text.

```console
$ ETCDCTL_API=3 etcdctl get /registry/secrets/shop/db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key | strings | head -3
/registry/secrets/shop/db
password
s3cret
(this is a simulated illustration, not a real incident)
```

The secret was stored unencrypted. The team enabled encryption at rest, rewrote all secrets, rotated the exposed password and restricted who could read etcd backups. Reading the value back with etcdctl and seeing the `k8s:enc:` prefix confirmed the fix.

## Common mistakes

- Enabling encryption but not rewriting existing secrets
- Enforcing a Pod Security profile without checking what would break first
- Setting a read-only root filesystem without writable paths for temp files
- Referencing a RuntimeClass whose handler is not installed
- Treating base64 as protection

```quiz
Q: What do the Pod Security Standards offer?
+ Three profiles, Privileged, Baseline and Restricted, enforced by namespace labels
- A firewall for pods :: That is network policy.
- An image scanner :: Different tool.
- A logging service :: Different tool.
> Labels choose the profile and the mode of enforcement.

Q: How are existing secrets encrypted after enabling encryption at rest?
+ By rewriting them, for example with kubectl replace
- Automatically at once :: They are only encrypted when written again.
- By restarting pods :: Does not rewrite them.
- By deleting etcd :: Destroys the cluster.
> Only new writes use the provider until old objects are rewritten.

Q: What is the purpose of a RuntimeClass such as gVisor?
+ To run untrusted workloads behind an extra isolation layer
- To speed up pods :: It adds overhead.
- To store secrets :: Unrelated.
- To schedule pods :: Unrelated.
> Sandboxes limit the effect of a container escape.

Q: Why give a read-only root filesystem container an emptyDir?
+ Programs often need a writable place for temporary files
- To make it larger :: Not the reason.
- To enable root access :: Opposite.
- To remove labels :: Unrelated.
> Immutability is kept for the image while specific paths stay writable.
```

```cards
Pod Security Standards :: Three profiles that describe how restricted pods should be
Security context :: Pod and container settings for users, capabilities and privileges
RuntimeClass :: An object selecting a container runtime handler, such as a sandbox
Encryption at rest :: Storing data in encrypted form so that raw storage does not reveal it
Mutual TLS :: Both sides of a connection prove their identity and encrypt traffic
```
