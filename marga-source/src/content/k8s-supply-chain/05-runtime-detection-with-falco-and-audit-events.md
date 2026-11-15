---
title: Runtime detection with Falco and audit events
minutes: 12
summary: Detect suspicious behaviour in running pods using Falco rules and Kubernetes audit events, tune noise and route alerts with context.
---

Prevention fails sometimes. Runtime detection watches what containers do and what is done through the API, so unusual behaviour such as a shell in a production pod raises an alert.

## What you will learn

- What Falco observes and how rules work
- Useful default detections
- Kubernetes audit events as a second source
- Tuning rules to reduce false alerts
- Alert routing and response

## How Falco works

Falco watches system calls through an eBPF probe or a kernel module and matches them against rules. A rule has a condition, an output message and a priority. Because it sees real behaviour, it catches what static scans cannot, such as a process opening a reverse shell.

## Useful detections

Start with rules for a shell started inside a container, a write below system directories, reading of service account tokens by unexpected processes, outbound connections to unusual ports and use of package managers in running containers. These are rare in healthy workloads.

## Audit events

The API server audit log records who did what through the API: secret reads, exec into pods, role changes. Rules or a log pipeline can alert on a spike of secret reads or on a binding to cluster admin. Together with Falco this covers both inside and outside the container.

## Tuning

Every cluster has legitimate shells and package managers, such as debug sessions or build jobs. Add exceptions by namespace, image or process name rather than disabling a rule. Track the share of alerts that were real and revisit the noisy ones weekly.

## Routing and response

Send alerts with the pod, namespace, image and rule name to a channel or ticket system. Define what to do for each priority: for example a shell in production triggers quarantine through a network policy label and a review of the audit log.

```diagram
title: Runtime detection with Falco and audit events
node: k | Kernel events | 0 | 1 | System calls. | Probe missing. | observe
node: f | Falco rules | 1 | 1 | Match behaviour. | Noisy rules. | security
node: a | Alert pipeline | 2 | 1 | Adds context, routes. | No owner. | process
node: r | Responder | 3 | 1 | Contains and investigates. | Late response. | external
edge: k | f
edge: f | a
edge: a | r
```

## Incident: A shell in the payments pod

> **Incident:** Falco reported a shell started in a production container at night.

```console
$ kubectl logs -n falco ds/falco | grep payments | head -2
{"priority":"Warning","rule":"Terminal shell in container","output":"A shell was spawned in a container (user=root pod=payments-7d9 image=registry.example.com/payments:2.4 command=sh -c id)"}
$ kubectl get events -n payments --field-selector involvedObject.name=payments-7d9 | tail -2
(this is a simulated illustration, not a real incident)
```

The shell ran from a vulnerable endpoint that accepted a command. The pod was quarantined with a deny network policy, evidence was copied, the image was patched and a rule for outbound connections from this namespace was added. The alert reached the responder within a minute because it carried the pod and image names.

## Common mistakes

- Disabling a noisy rule instead of adding a scoped exception
- Alerts with no context
- No plan for what a responder does
- Relying only on image scans
- Not enabling audit logging on the API server

```quiz
Q: What does Falco watch?
+ System calls made by containers
- DNS zones :: No.
- Image tags :: No.
- Prices :: No.
> Behaviour at runtime.

Q: What do audit events record?
+ Requests made to the API server
- Pod CPU :: No.
- Disk speed :: No.
- Image layers :: No.
> Who did what through the API.

Q: How should noise be handled?
+ Scoped exceptions and regular tuning
- Delete all rules :: Loses detection.
- Mute the channel :: Hides real alerts.
- Raise priority :: Does not reduce noise.
> Tune by context.

Q: What should an alert include?
+ Pod, namespace, image and rule
- Only the time :: Not enough.
- Only the node :: Not enough.
- Nothing :: No context.
> Context speeds response.
```

```cards
Falco :: A runtime security tool that matches system call events to rules
eBPF :: A kernel mechanism for safe programs that observe events
Audit log :: A record of API server requests
Quarantine :: Isolating a workload without deleting it
```
