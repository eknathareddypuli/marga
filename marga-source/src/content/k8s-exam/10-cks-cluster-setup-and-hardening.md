---
title: CKS: cluster setup and hardening
minutes: 14
summary: Secure the cluster itself: network policies as a default, CIS benchmark checks, API server and kubelet flags, RBAC and service account hygiene, protecting metadata and verifying the binaries you run.
---

The Certified Kubernetes Security Specialist exam assumes you can already administer a cluster, which is why it requires a current CKA. Cluster setup and cluster hardening together make about a quarter of it. The idea is to take a working cluster and remove the ways it can be abused. The DevSecOps module covers the principles; here are the tasks.

## What you will learn

- Default deny network policy and protecting node metadata
- Running and reading CIS benchmark results
- Hardening API server and kubelet settings
- RBAC, service accounts and verifying binaries

## Default deny and metadata

Start with a default deny policy in each namespace, then allow only what is needed. A deny-all for ingress and egress was shown in the networking lesson. Cloud nodes often expose a metadata service at a link-local address, which holds credentials for the node's cloud role. Pods should usually not reach it:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-metadata
  namespace: shop
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 169.254.169.254/32
```

This allows all egress except to the metadata address. Combine it with other policies as the task requires, remembering that policies add up.

## CIS benchmark with kube-bench

The CIS Kubernetes Benchmark is a long list of recommended settings, and kube-bench is a tool that checks a node against it.

```bash
kube-bench run --targets master
kube-bench run --targets node
kube-bench run --targets master --check 1.2.1
```

The output lists each check as PASS, FAIL or WARN, with remediation text. A task usually names a failing check and asks you to fix it. The fix is almost always a flag in a static pod manifest or a kubelet configuration file. Re-run the check afterwards to confirm.

## Harden the API server

Edit `/etc/kubernetes/manifests/kube-apiserver.yaml`; the kubelet restarts the pod when you save. Useful settings:

- `--anonymous-auth=false` rejects unauthenticated requests
- `--authorization-mode=Node,RBAC` enables node and role-based authorization, not `AlwaysAllow`
- `--enable-admission-plugins=NodeRestriction` limits what kubelets can change
- `--profiling=false` disables profiling endpoints
- `--audit-log-path` and related flags enable auditing (a later lesson)
- Avoid insecure ports and unneeded features

After a change, wait for the API server to return. If it does not, read `crictl logs` for the container; the cause is usually a typo. Keep a copy of the original manifest outside the manifests directory before editing, so that you can restore it quickly.

## Harden the kubelet

The kubelet configuration is a file, often `/var/lib/kubelet/config.yaml`. Important settings:

```yaml
authentication:
  anonymous:
    enabled: false
  webhook:
    enabled: true
authorization:
  mode: Webhook
readOnlyPort: 0
```

Anonymous access disabled, authorization delegated to the API server and the read-only port closed. Apply with `systemctl restart kubelet`. Etcd and the control plane should also use client certificate authentication, which kubeadm sets up by default.

## RBAC and service accounts

Least privilege applies to humans and to workloads.

- Avoid `cluster-admin` bindings and wildcard verbs or resources
- Look for risky bindings with `kubectl get clusterrolebinding -o wide`
- Remove permissions that are not needed, and bind roles to groups instead of many individuals
- Set `automountServiceAccountToken: false` on pods or service accounts that do not call the API
- Use dedicated service accounts per workload, not the `default` account

```bash
kubectl patch serviceaccount default -n shop -p '{"automountServiceAccountToken": false}'
kubectl auth can-i --list --as system:serviceaccount:shop:default -n shop
```

## Protect ingress and secrets in transit

Expose applications over TLS. Create a secret from a certificate and key, and reference it in the Ingress `tls` section:

```bash
kubectl create secret tls web-tls --cert=tls.crt --key=tls.key -n shop
```

## Verify the binaries

A tampered binary defeats every other control. Compare the checksum of a downloaded Kubernetes binary with the published value:

```bash
sha512sum kubelet
echo "<expected-sha512>  kubelet" | sha512sum --check
```

A task may give you a checksum file and ask you to confirm which binary matches, or to remove the one that does not.

## Keep up with versions

Running an old version leaves known vulnerabilities in place. Plan upgrades to supported versions, as practised in the earlier CKA lesson, and subscribe to security announcements.

```python
checks = {
    "anonymous-auth=false": True,
    "authorization-mode includes RBAC": True,
    "NodeRestriction enabled": False,
    "kubelet read-only port closed": True,
}
for name, passed in checks.items():
    print(("PASS  " if passed else "FAIL  ") + name)
```

```diagram
title: Hardening a cluster
node: bench | Benchmark | 0 | 1 | kube-bench against the CIS checks. | Treating warnings as passes. | observe
node: api | API server flags | 1 | 0 | Anonymous off, RBAC on, NodeRestriction. | A typo takes the API down. | security
node: kub | Kubelet config | 1 | 2 | Webhook auth, no read-only port. | Config not reloaded. | security
node: rb | RBAC and accounts | 2 | 1 | Least privilege and no default token. | Wildcard cluster-admin. | security
node: net | Network policy | 3 | 1 | Default deny, block metadata. | Policies on a plugin that ignores them. | process
node: ver | Verify and re-test | 4 | 1 | Checksums and benchmark re-run. | Trusting a binary unchecked. | observe
edge: bench | api
edge: bench | kub
edge: api | rb
edge: kub | rb
edge: rb | net
edge: net | ver
```

## Incident: Anonymous access left on

> **Incident:** A benchmark flagged that the kubelet accepted anonymous requests, and a quick probe from another node listed pods without credentials.

```console
$ kube-bench run --targets node --check 4.2.1
[FAIL] 4.2.1 Ensure that the --anonymous-auth argument is set to false
$ curl -sk https://10.0.0.12:10250/pods | head -c 80
{"kind":"PodList","apiVersion":"v1","metadata":{},"items":[{"metadata":{"name":"web-1"
(this is a simulated illustration, not a real incident)
```

The kubelet's configuration allowed anonymous requests and used `AlwaysAllow` authorization. Setting anonymous to false, authorization mode to Webhook and restarting the kubelet made the same request return 401. The benchmark check turned from FAIL to PASS, which is the verification the task wanted.

## Common mistakes

- Editing the API server manifest without a backup copy
- Forgetting to restart the kubelet after changing its config
- Granting cluster-admin for convenience
- Leaving the default service account token mounted in pods that do not need it
- Fixing a benchmark check and not re-running it

```quiz
Q: What does kube-bench check?
+ Node and control plane settings against the CIS Kubernetes Benchmark
- Container image vulnerabilities :: That is an image scanner.
- Network latency :: Not its purpose.
- Application logs :: Not its purpose.
> It reports PASS, FAIL or WARN per benchmark check.

Q: Which API server flag stops unauthenticated requests?
+ --anonymous-auth=false
- --profiling=true :: Unrelated and enabling profiling is less secure.
- --v=5 :: That sets log verbosity.
- --allow-privileged=true :: That makes things less secure.
> Anonymous access should be disabled.

Q: Why disable automountServiceAccountToken for workloads that do not call the API?
+ A stolen token is useless if none is mounted
- It speeds up pods :: Not the reason.
- It deletes the service account :: It does not.
- It blocks DNS :: Unrelated.
> Fewer credentials in pods reduce what an attacker can gain.

Q: How do you check that a downloaded binary is genuine?
+ Compare its checksum with the published value
- Check its file name :: Names can be faked.
- Check its size only :: Easy to match.
- Run it and see :: Unsafe.
> A matching cryptographic hash confirms integrity.
```

```cards
CIS Benchmark :: A published list of recommended security settings for a platform
kube-bench :: A tool that checks Kubernetes nodes against the CIS Benchmark
NodeRestriction :: An admission plugin limiting what a kubelet may modify
Anonymous auth :: Allowing requests without credentials, normally disabled
Instance metadata :: A link-local service on cloud nodes that may expose node credentials
```
