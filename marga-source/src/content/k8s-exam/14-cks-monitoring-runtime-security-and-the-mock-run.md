---
title: CKS: monitoring, runtime security and the mock run
minutes: 15
summary: Detect and contain attacks: enable audit logging, write Falco rules, keep containers immutable, investigate suspicious behaviour, then plan a full timed mock run of both exams.
---

The last CKS domain is about seeing attacks while they happen and after. It is also about 20 percent of the exam. This lesson covers audit logs, runtime detection with Falco, immutability and investigation, and ends with a method for running a full practice exam under time pressure.

## What you will learn

- Kubernetes audit logging and how to enable it
- Falco rules and reading alerts
- Immutable containers and spotting suspicious pods
- A plan for a timed mock exam

## Audit logging

The API server can record who did what and when. You choose how much to log with an audit policy, which lists rules matched in order. Levels are `None`, `Metadata` (who and what, not the body), `Request` (adds the request body) and `RequestResponse` (adds the response). A small policy:

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
omitStages:
  - RequestReceived
rules:
  - level: RequestResponse
    resources:
      - group: ""
        resources: ["secrets"]
  - level: Metadata
    resources:
      - group: ""
        resources: ["pods", "configmaps"]
  - level: None
    users: ["system:kube-proxy"]
  - level: Metadata
```

Rules are evaluated top to bottom and the first match wins, so order matters. Logging secret bodies is sensitive, so most real policies use `Metadata` for secrets. To enable the policy on a kubeadm cluster, edit the API server manifest:

```bash
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/kube-apiserver.yaml.bak
vim /etc/kubernetes/manifests/kube-apiserver.yaml
```

Add flags and the volumes that make the files reachable inside the pod:

```yaml
    - --audit-policy-file=/etc/kubernetes/audit/policy.yaml
    - --audit-log-path=/var/log/kubernetes/audit/audit.log
    - --audit-log-maxage=7
    - --audit-log-maxbackup=3
```

Then add `volumeMounts` and `volumes` entries for `/etc/kubernetes/audit` and `/var/log/kubernetes/audit`. Without them the API server cannot read the policy and will not start. After it restarts, search the log:

```bash
grep '"resource":"secrets"' /var/log/kubernetes/audit/audit.log | tail -n 3
jq 'select(.verb=="delete") | .user.username' /var/log/kubernetes/audit/audit.log | sort | uniq -c
```

## Falco

Falco watches system calls on a node and raises alerts when behaviour matches a rule, such as a shell starting inside a container or a sensitive file being read. It runs as a service on each node or as a daemon set. Default rules live in `/etc/falco/falco_rules.yaml`, and your own go in `/etc/falco/falco_rules.local.yaml`, which survives upgrades.

A rule has a name, a description, a condition, an output and a priority:

```yaml
- rule: Shell in container
  desc: A shell was started inside a container
  condition: evt.type = execve and container.id != host and proc.name in (bash, sh)
  output: "Shell started in container (user=%user.name container=%container.name image=%container.image.repository command=%proc.cmdline)"
  priority: WARNING
```

Read alerts with `journalctl -u falco -f` or from the configured output file. A task might say: find the pod that spawned a shell in the last few minutes, or change a rule's output format, then confirm that an alert shows the new format after triggering it with `kubectl exec`. After editing rules, restart the service and check for syntax errors in its log.

## Immutable containers

Attackers install tools and change files after getting in. If the root filesystem is read-only and containers do not run privileged, much of that fails. Review a namespace for containers that break the rule:

```bash
kubectl get pods -n shop -o json | jq -r '.items[] | select(.spec.containers[].securityContext.privileged==true) | .metadata.name'
kubectl get pods -n shop -o json | jq -r '.items[] | select(.spec.containers[].securityContext.readOnlyRootFilesystem != true) | .metadata.name'
```

Fix by setting `readOnlyRootFilesystem: true` and adding writable `emptyDir` mounts for specific paths. Do not use `hostPath`, host networking or host PID unless the task justifies it.

## Investigate a suspicious pod

A method that works: identify the pod and node, check what it runs and as whom, review recent audit events, check Falco alerts, inspect the image, and then contain it by isolating with a network policy, scaling down the owner and preserving evidence before deleting. Do not delete first; you lose the evidence.

```bash
kubectl get pod odd -n shop -o yaml | grep -E "image:|serviceAccount|hostPath|privileged"
kubectl logs odd -n shop
kubectl exec odd -n shop -- ps aux
```

## Plan a full mock run

Practise under real conditions, because the second half of the exam is where unpractised candidates slip.

1. **Set up.** Start a timer for the real duration. Use only the permitted docs.
2. **Triage first.** Spend three minutes listing the tasks with weights and rough effort.
3. **Quick points first.** Do short, high-weight tasks, then medium ones.
4. **Flag at the time cap.** If a task takes more than about twice its expected time, flag it.
5. **Verify each result.** Run the check command before moving on.
6. **Reserve the last ten minutes.** Return to flagged tasks and re-read their wording.
7. **Review afterwards.** For each missed task, write what you would do next time, and drill it.

Run at least two full mocks per exam, a week apart, and compare timings per domain.

```python
mock = [
    ("etcd backup", 7, 8, 7),
    ("fix kubelet", 8, 12, 15),
    ("network policy", 5, 7, 6),
    ("pod security", 6, 9, 9),
]
for name, weight, planned, actual in mock:
    flag = "over" if actual > planned * 1.5 else "ok"
    print(f"{name:16} weight {weight}  planned {planned}  actual {actual}  {flag}")
print("score weight done:", sum(w for _, w, _, _ in mock))
```

```diagram
title: Seeing and containing an attack
node: aud | Audit log | 0 | 0 | Who did what through the API. | Policy logging nothing useful. | observe
node: fal | Falco alerts | 0 | 2 | Suspicious behaviour on nodes. | Rules never tested. | observe
node: inv | Investigate | 1 | 1 | Pod, node, process, image and account. | Deleting before preserving evidence. | process
node: con | Contain | 2 | 1 | Isolate with policy, scale down owner. | Slow or partial isolation. | security
node: imm | Immutable fix | 3 | 1 | Read-only root and no privilege. | The same weakness left in place. | security
node: mock | Mock run review | 4 | 1 | Timings, misses and drills. | Never practising under time. | external
edge: aud | inv
edge: fal | inv
edge: inv | con
edge: con | imm
edge: imm | mock
```

## Incident: The audit policy that broke the API server

> **Incident:** A candidate enabled audit logging, and the API server never came back.

```console
$ crictl ps -a | grep kube-apiserver
a91c3e  kube-apiserver  Exited  3 minutes ago
$ crictl logs a91c3e 2>&1 | tail -n 2
Error: failed to load audit policy file: open /etc/kubernetes/audit/policy.yaml: no such file or directory
(this is a simulated illustration, not a real incident)
```

The flags were added but the audit directory was not mounted into the API server pod, so the process could not read the policy file. Adding the `volumes` and `volumeMounts` entries, and restoring the backup first to get kubectl working again, fixed it. This is why you copy the manifest before editing and check the container log if the pod does not return.

## Common mistakes

- Adding audit flags without the volume mounts
- Logging secret bodies at RequestResponse level in real clusters
- Editing the default Falco rules file instead of the local one
- Deleting a suspicious pod before looking at it
- Doing only single tasks in practice and never a full timed run

```quiz
Q: Which audit level records the request body but not the response?
+ Request
- None :: Logs nothing.
- Metadata :: Logs who and what, no bodies.
- RequestResponse :: Includes the response too.
> Levels increase in detail from None to RequestResponse.

Q: Where should custom Falco rules go?
+ In the local rules file, which survives upgrades
- In the kernel :: Not how Falco works.
- In etcd :: Not where rules live.
- In a pod label :: Not where rules live.
> The local file keeps your changes separate from defaults.

Q: Why use a read-only root filesystem?
+ It stops attackers installing tools or changing files in the container
- It makes the container faster :: Not the aim.
- It deletes logs :: It does not.
- It removes the need for network policy :: It does not.
> Immutability limits what a compromise can do.

Q: What is the safest first move on a suspicious pod?
+ Investigate and preserve evidence, then contain
- Delete it immediately :: Destroys evidence.
- Ignore it :: Risky.
- Reboot all nodes :: Excessive.
> Understand and record before removing.
```

```cards
Audit policy :: Rules that decide which API events are recorded and in how much detail
Falco :: A runtime security tool that alerts on suspicious system call behaviour
Immutable container :: A container whose filesystem cannot be changed at runtime
Containment :: Limiting a compromise by isolating the affected workload
Mock exam :: A full timed practice run under realistic conditions
```
