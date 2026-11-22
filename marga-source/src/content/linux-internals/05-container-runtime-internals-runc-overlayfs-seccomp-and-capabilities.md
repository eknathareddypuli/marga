---
title: Container runtime internals: runc, overlayfs, seccomp and capabilities
minutes: 13
summary: See what a container really is: namespaces and cgroups set up by runc, an overlay file system built from layers, capability sets and seccomp filters, and where each can fail.
---

A container is an ordinary process with a restricted view and restricted rights. When you can name each restriction, debugging permission errors and security questions becomes much easier.

## What you will learn

- What runc does when it starts a container
- overlayfs: layers, copy up and whiteouts
- Capabilities instead of a single root
- seccomp filters and the system call surface
- Debugging: why is this container allowed or denied

## The start sequence

A container runtime such as containerd prepares an image and a bundle, then runc creates new namespaces for the process: process IDs, mounts, network, hostname, inter process communication and sometimes users. It puts the process in cgroups, mounts the root file system, drops rights and executes the entry point. After that, runc exits and the process continues.

## overlayfs

An overlay mounts several read only image layers under one writable layer. A read goes down through the layers until it finds the file. A write to a file from a lower layer first copies the whole file up, which can be slow for large files. Deleting a file records a whiteout marker. Keep heavy writes on a volume, not in the container layer.

## Capabilities

Linux splits the powers of root into capabilities such as binding low ports, changing file ownership or loading modules. A container starts with a reduced default set. Drop all and add back only what is needed. A privileged container receives nearly everything and can reach the host, so avoid it.

## seccomp

A seccomp profile is a filter that allows, denies or logs system calls by number and arguments. The runtime default blocks dozens of dangerous calls, such as those that load modules or change the clock. A denied call usually returns an error such as operation not permitted, which looks like a permission problem but is a filter.

## Debugging access

When something is denied, check in order: file permissions and user, capabilities, seccomp, then mandatory access control such as AppArmor or SELinux, then mounts and read only settings. Use strace to see the failing call and its error code, and inspect the effective capabilities in the process status file.

```diagram
title: Container runtime internals: runc, overlayfs, seccomp and capabilities
node: rt | Runtime and runc | 0 | 1 | Sets up the process. | Bad config. | process
node: ns | Namespaces and cgroups | 1 | 1 | View and limits. | Leaks. | security
node: fs | overlayfs root | 2 | 1 | Layers. | Copy up cost. | store
node: sec | Capabilities and seccomp | 3 | 1 | Rights. | Too broad. | security
edge: rt | ns
edge: ns | fs
edge: fs | sec
```

## Incident: The write that was blocked by a filter

> **Incident:** A monitoring agent in a container failed with operation not permitted although it ran as root.

```console
$ grep -E "CapEff|Seccomp" /proc/self/status
CapEff: 00000000a80425fb
Seccomp:        2
$ capsh --decode=00000000a80425fb | head -c 120
0x00000000a80425fb=cap_chown,cap_dac_override,cap_fowner,cap_fsetid,cap_kill
(this is a simulated illustration, not a real incident)
```

The agent called a system call to read performance counters, which the default seccomp profile does not allow, and root in a container does not add the missing capability. The security team approved a narrow custom profile for that one system call and the capability it needed, applied only to that agent. They rejected the request to run it as a privileged container.

## Common mistakes

- Running containers as privileged
- Writing heavy data into the container layer
- Assuming root in a container has all rights
- Disabling seccomp to make an error go away
- Skipping the capability drop step

```quiz
Q: What does runc do?
+ Creates namespaces and cgroups and starts the process
- Builds images :: No.
- Routes traffic :: No.
- Stores secrets :: No.
> Then it hands over to the process.

Q: What is copy up in overlayfs?
+ Copying a file to the writable layer before changing it
- Copying to the cloud :: No.
- A backup job :: No.
- A network upload :: No.
> Large files can be slow to change.

Q: Why drop capabilities?
+ To limit what root in the container can do
- To speed up boot :: No.
- To save disk :: No.
- To hide logs :: No.
> Add back only what is required.

Q: How does a seccomp denial often look?
+ Operation not permitted for a system call
- A DNS failure :: No.
- A slow disk :: No.
- A full inode table :: No.
> Use strace to confirm the call.
```

```cards
runc :: The low level runtime that starts containers
overlayfs :: A file system that stacks layers
Capability :: One slice of the powers of root
seccomp :: A filter on allowed system calls
```
