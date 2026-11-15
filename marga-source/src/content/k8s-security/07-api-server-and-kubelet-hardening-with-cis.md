---
title: API server and kubelet hardening with the CIS benchmark
minutes: 13
summary: Run kube-bench, understand the most important API server, kubelet and etcd settings, and fix findings without breaking the control plane.
---

The CIS Kubernetes Benchmark is a long list of configuration checks. Tools run it for you, but you still have to understand a finding well enough to fix it safely, because the control plane settings live in static pod manifests where a typo stops the API server.

## What you will learn

- How to run kube-bench and read its output
- Important API server flags
- Kubelet settings that matter
- etcd and file permission checks
- A safe edit procedure

## Running the benchmark

kube-bench is an open source tool that runs the checks as a job or on the node and prints PASS, FAIL, WARN and INFO for each numbered recommendation, with a remediation text. Run it on control plane and worker nodes, because they have different checks.

```bash
kube-bench run --targets master,node,etcd,policies
kube-bench run --targets master --check 1.2.1
```

## API server settings

Key settings include anonymous authentication off, authorization mode Node and RBAC, never AlwaysAllow, the NodeRestriction admission plugin enabled, audit logging on with a policy, profiling off, TLS cipher and version settings, the service account issuer and key files set, and etcd client certificates used. Insecure ports must be closed. The manifest at `/etc/kubernetes/manifests/kube-apiserver.yaml` holds these as command flags.

## Kubelet settings

On each node the kubelet configuration should set `authentication.anonymous.enabled: false`, `authorization.mode: Webhook`, a client CA file for x509 authentication, `readOnlyPort: 0` to disable the unauthenticated read-only port, `protectKernelDefaults: true`, `rotateCertificates: true` and event rate limits. A kubelet that accepts anonymous requests with AlwaysAllow lets anyone who can reach port 10250 run commands in pods.

```bash
grep -E "anonymous|mode|readOnlyPort|protectKernelDefaults" /var/lib/kubelet/config.yaml
sudo systemctl restart kubelet
```

## etcd and files

etcd must use client certificate authentication, peer TLS, and a data directory owned by etcd with mode 700. Configuration files and certificates under `/etc/kubernetes` should be owned by root with restrictive permissions, and the kubeconfig files not world readable.

## A safe procedure

Copy the manifest before editing, change one flag at a time, then watch the static pod restart with `crictl ps` and check that `kubectl get nodes` still works. If the API server does not return, read its container logs and restore the copy. Re-run the single failed check afterward to confirm the fix, and keep a record of exceptions you accept with their reason.

```diagram
title: API server and kubelet hardening with the CIS benchmark
node: run | kube-bench | 0 | 1 | Reports findings. | Wrong target. | observe
node: api | API server flags | 1 | 0 | Auth, audit, admission. | Typo in manifest. | security
node: kl | Kubelet config | 1 | 1 | Anonymous off. | Not restarted. | security
node: etcd | etcd and files | 1 | 2 | TLS and permissions. | World readable. | security
node: re | Re-run check | 2 | 1 | Prove the fix. | Skipped. | observe
edge: run | api
edge: run | kl
edge: run | etcd
edge: api | re
edge: kl | re
```

## Incident: The audit flag that stopped the API server

> **Incident:** An engineer enabled audit logging and the API server did not return.

```console
$ sudo crictl ps -a | grep kube-apiserver
f3a1c9  Exited  kube-apiserver  4 minutes ago
$ sudo crictl logs f3a1c9 2>&1 | tail -2
Error: loading audit policy file: open /etc/kubernetes/audit-policy.yaml: no such file or directory
(this is a simulated illustration, not a real incident)
```

The flags were added, but the policy file was not mounted into the static pod, so the process exited at start and the kubelet kept restarting it. Restoring the backed up manifest recovered the API, and the engineer re-applied the change with the volume and mount for the policy and log paths. Always copy the manifest first, and remember that files used by the API server must be mounted into the pod.

## Common mistakes

- Editing a manifest without a backup
- Adding file flags without volume mounts
- Fixing many findings at once
- Running only the control plane checks
- Accepting findings without recording the reason

```quiz
Q: What does kube-bench do?
+ Checks cluster configuration against the CIS benchmark
- Scans images :: That is Trivy.
- Backs up etcd :: No.
- Schedules pods :: No.
> It reports PASS and FAIL per recommendation.

Q: Which kubelet setting turns off unauthenticated access?
+ authentication.anonymous.enabled set to false
- readOnlyPort 10255 :: That enables it.
- authorization AlwaysAllow :: Unsafe.
- rotateCertificates false :: Not related.
> Combine it with Webhook authorization.

Q: Where do API server flags live on a kubeadm cluster?
+ In the kube-apiserver static pod manifest
- In etcd :: No.
- In the kubeconfig :: No.
- In a Secret :: No.
> Edit it carefully.

Q: What must accompany a flag that points to a file?
+ A volume and mount that makes the file visible in the pod
- A new namespace :: No.
- A new label :: No.
- A restart of DNS :: No.
> Static pods only see mounted paths.
```

```cards
CIS Benchmark :: A security configuration guide for Kubernetes
kube-bench :: A tool that runs CIS checks on nodes
NodeRestriction :: An admission plugin limiting what kubelets can modify
readOnlyPort :: The kubelet unauthenticated read-only port
Anonymous auth :: Allowing requests without credentials
```
