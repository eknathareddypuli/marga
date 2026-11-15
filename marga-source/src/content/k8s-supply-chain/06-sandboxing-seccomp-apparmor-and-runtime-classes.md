---
title: Sandboxing: seccomp, AppArmor and runtime classes
minutes: 12
summary: Reduce what a compromised container can do with seccomp profiles, AppArmor, dropped capabilities and sandboxed runtimes such as gVisor.
---

Containers share the host kernel, so a flaw in the kernel can become an escape. Syscall filters and sandboxed runtimes shrink the exposed kernel surface for workloads that need it.

## What you will learn

- The shared kernel risk
- Seccomp profiles and RuntimeDefault
- AppArmor and SELinux
- Dropping capabilities and read only root
- RuntimeClass and sandboxed runtimes

## The shared kernel risk

A container is a process with namespaces and cgroups. A vulnerability in a system call can let a process escape to the host. Reducing the system calls and privileges available lowers that risk, and strong isolation helps for untrusted code.

## Seccomp

Seccomp filters system calls. Setting `seccompProfile: RuntimeDefault` applies the runtime default profile, which blocks several dangerous calls with little breakage. Custom profiles can be recorded from a test run and reviewed. Unconfined is the weakest setting and should not be used.

## AppArmor and SELinux

These mandatory access control systems restrict files and operations per process. Use the profiles provided by the runtime or write specific ones for sensitive workloads. Check that your nodes support them, as availability depends on the operating system.

## Capabilities and file system

Drop all Linux capabilities and add back only what is needed, run as non-root, disallow privilege escalation and set the root file system read only. Many exploits need a writable path or a capability that a normal service never uses.

## Sandboxed runtimes

A RuntimeClass selects a runtime for a pod, for example gVisor or Kata Containers. They add a user space kernel or a lightweight virtual machine, which costs some performance and compatibility but gives much stronger isolation. Use them for untrusted code, multi tenant workloads or build jobs.

```diagram
title: Sandboxing: seccomp, AppArmor and runtime classes
node: app | Container process | 0 | 1 | Makes syscalls. | Over privileged. | service
node: sc | Seccomp and MAC | 1 | 1 | Filters calls. | Unconfined. | security
node: rt | Runtime class | 2 | 1 | Selects sandbox. | Incompatible app. | process
node: k | Host kernel | 3 | 1 | Shared resource. | Kernel flaw. | security
edge: app | sc
edge: sc | rt
edge: rt | k
```

## Incident: A seccomp profile that broke a release

> **Incident:** A custom profile blocked a system call the new library used.

```console
$ kubectl logs api-5c8 | tail -2
Fatal: operation not permitted
$ kubectl get pod api-5c8 -o jsonpath='{.spec.securityContext.seccompProfile}'
{"localhostProfile":"profiles/api.json","type":"Localhost"}
(this is a simulated illustration, not a real incident)
```

The profile had been recorded before a library upgrade and missed a new call. The team switched to RuntimeDefault for the release, re-recorded the custom profile in a test environment and added a test that runs the app with the profile in CI.

## Common mistakes

- Leaving seccomp unconfined
- Running privileged containers for convenience
- Writable root file systems
- Adding all capabilities back
- Sandbox runtimes without testing compatibility

```quiz
Q: What does seccompProfile RuntimeDefault do?
+ Applies the runtime default syscall filter
- Disables the kernel :: No.
- Makes pods faster :: No.
- Allows all calls :: No.
> A good baseline.

Q: What does a RuntimeClass select?
+ The container runtime for a pod
- The node name :: No.
- The namespace :: No.
- The image tag :: No.
> For example gVisor.

Q: Which setting is risky?
+ privileged: true
- readOnlyRootFilesystem :: Safer.
- drop ALL capabilities :: Safer.
- runAsNonRoot :: Safer.
> It removes isolation.

Q: Why use a sandboxed runtime?
+ Stronger isolation for untrusted code
- Faster start :: Usually slower.
- More capabilities :: No.
- Less memory :: Usually more.
> Trade performance for isolation.
```

```cards
Seccomp :: A filter for system calls
AppArmor :: Linux access control for processes and files
Capability :: A fine grained Linux privilege
RuntimeClass :: A Kubernetes object that selects a container runtime
```
