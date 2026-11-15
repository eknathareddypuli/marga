---
title: CKS: system hardening with AppArmor, seccomp and the host
minutes: 13
summary: Reduce what a compromised container or node can do: shrink the host attack surface, confine processes with AppArmor and seccomp profiles, and limit access to the kernel and network.
---

Containers share the host kernel. If an attacker escapes a container, the host's configuration decides how much they can reach. System hardening is the set of controls on the host and on the kernel interface that limit that damage. It is about fifteen percent of the CKS.

## What you will learn

- Reducing the attack surface of the node
- Loading and applying AppArmor profiles
- Applying seccomp profiles to pods
- Other kernel and network controls

## Shrink the host

A node should run what it needs and nothing more. Habits and checks:

```bash
ss -ltnp
systemctl list-units --type=service --state=running
dpkg -l | wc -l
systemctl disable --now snapd
apt-get remove --purge -y PACKAGE
```

Look for listening ports you do not recognise, services that are not part of the node's job, and tools that help an attacker such as compilers or network scanners. Remove or disable them. Restrict SSH: key authentication only, no root login, and limit who can connect. Remove users you do not need, and keep the node patched. A task may give you a listing and ask which unused service to stop.

## AppArmor

AppArmor is a Linux security module that confines a program by a profile: which files it may read or write, which capabilities and network access it has. A profile must exist on the node where the pod runs.

```bash
aa-status
cat /etc/apparmor.d/k8s-deny-write
apparmor_parser -q /etc/apparmor.d/k8s-deny-write
```

A simple profile that denies writes everywhere:

```text
#include <tunables/global>
profile k8s-deny-write flags=(attach_disconnected) {
  #include <abstractions/base>
  file,
  deny /** w,
}
```

Load it on every node that may run the pod, with `apparmor_parser`. Then reference it. In Kubernetes 1.30 and later, the pod field is:

```yaml
spec:
  containers:
    - name: app
      image: nginx:1.27
      securityContext:
        appArmorProfile:
          type: Localhost
          localhostProfile: k8s-deny-write
```

Older clusters and many tutorials use an annotation instead, `container.apparmor.security.beta.kubernetes.io/app: localhost/k8s-deny-write`. Check which form the cluster version supports. If the profile is not loaded on the node, the pod fails to start, which is a useful signal. Verify with `kubectl exec` that the restriction holds, for example that writing a file fails.

## Seccomp

Seccomp filters which system calls a process may make. The default runtime profile blocks many dangerous calls while allowing normal behaviour.

```yaml
spec:
  securityContext:
    seccompProfile:
      type: RuntimeDefault
```

`RuntimeDefault` applies the container runtime's default profile, which is a good baseline for almost all workloads. `Unconfined` disables filtering and should be avoided. A custom profile is a JSON file placed under the kubelet's seccomp directory, commonly `/var/lib/kubelet/seccomp`, and referenced by a path relative to it:

```yaml
securityContext:
  seccompProfile:
    type: Localhost
    localhostProfile: profiles/audit.json
```

The profile file must exist on the node that runs the pod. A task might give you a profile and ask you to apply it to a pod, then show the pod running. If the pod stays in an error state, the events usually say the profile could not be found.

## Capabilities and privileges

Containers should drop what they do not need:

```yaml
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  capabilities:
    drop: ["ALL"]
```

Avoid `privileged: true`, host namespaces and host paths. Each one removes a layer of isolation. The pod security lesson shows how to enforce this across a namespace.

## Kernel and network controls

Disable kernel modules that are not needed by blacklisting them, and keep sysctl settings tight. Limit which nodes can talk to each other and to the control plane with firewall rules or cloud security groups, and give nodes the least cloud permissions needed. A node role that can read all storage buckets turns a container escape into a data breach.

## A host hardening checklist

```python
checklist = {
    "no unneeded listening ports": True,
    "ssh root login disabled": True,
    "unused services stopped": False,
    "apparmor profile loaded for sensitive pods": True,
    "seccomp RuntimeDefault on pods": False,
}
print("to do:", [k for k, ok in checklist.items() if not ok])
```

```diagram
title: Layers of confinement
node: host | Hardened host | 0 | 1 | Few services, patched, limited SSH. | Unused services left running. | security
node: kern | Kernel controls | 1 | 0 | Modules and sysctl limits. | Default permissive settings. | security
node: aa | AppArmor profile | 2 | 0 | File and capability limits. | Profile not loaded on the node. | security
node: sec | Seccomp profile | 2 | 2 | System call filtering. | Unconfined profile. | security
node: ctr | Container | 3 | 1 | Non-root, no privilege escalation. | Privileged mode. | process
node: chk | Verify | 4 | 1 | Exec and test the restriction. | Assuming the profile applies. | observe
edge: host | kern
edge: kern | aa
edge: kern | sec
edge: aa | ctr
edge: sec | ctr
edge: ctr | chk
```

## Incident: The profile that was not there

> **Incident:** A pod referencing an AppArmor profile would not start on one node, and the same manifest worked on another.

```console
$ kubectl get pod locked -o wide
NAME     READY   STATUS    RESTARTS   AGE   NODE
locked   0/1     Blocked   0          1m    w2
$ kubectl describe pod locked | grep -i apparmor
  Warning  Failed  kubelet  Cannot enforce AppArmor: profile "k8s-deny-write" is not loaded
(this is a simulated illustration, not a real incident)
```

The profile had been loaded on `w1` but not on `w2`. Loading it on every node that could schedule the pod, with a configuration management step to keep them in sync, fixed the problem. If a task has only one node, you only need to load it there; in a larger cluster, remember that the pod may land elsewhere.

## Common mistakes

- Referencing an AppArmor profile that is not loaded on the node
- Loading a profile on one node and scheduling elsewhere
- Using Unconfined seccomp when RuntimeDefault would do
- Not testing that the restriction actually works
- Leaving unused services and open ports on nodes

```quiz
Q: What does an AppArmor profile do?
+ Confines a program's file access, capabilities and network use
- Encrypts the network :: That is TLS.
- Scans images for vulnerabilities :: That is a scanner.
- Schedules pods :: That is the scheduler.
> Profiles restrict what a process may do even if compromised.

Q: What does the RuntimeDefault seccomp profile provide?
+ The container runtime's default filter of system calls
- Full access to all system calls :: That is Unconfined.
- A new network :: Unrelated.
- Image signing :: Unrelated.
> It is a sensible baseline for most workloads.

Q: Why must an AppArmor profile be loaded on the node?
+ The kubelet enforces it there, and a missing profile prevents the pod from starting
- Profiles live in etcd :: They live on the node.
- Profiles are optional metadata :: They are enforced.
- Only the API server needs it :: The node enforces.
> Node-local enforcement means every candidate node needs the profile.

Q: Which setting reduces what a compromised container can do?
+ Dropping all capabilities and disabling privilege escalation
- Running as root :: Increases risk.
- Mounting the host filesystem :: Increases risk.
- Disabling probes :: Unrelated.
> Least privilege at the container level limits damage.
```

```cards
Attack surface :: The set of things an attacker could reach or abuse
AppArmor :: A Linux module that confines programs using profiles
Seccomp :: A kernel feature that filters the system calls a process may make
Capability :: A fine-grained piece of root power a process can hold
Privileged container :: A container with nearly all host privileges, which should be avoided
```
