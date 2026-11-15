---
title: The exam environment, speed setup and the docs
minutes: 13
summary: Prepare for the hands-on CKA and CKS format: what the browser terminal gives you, the first two minutes of setup, switching contexts safely, and finding answers in the allowed documentation fast.
---

The CKA and CKS are performance-based: you work in a remote terminal on real clusters, solve tasks, and are scored on the end state. The earlier lesson on exam strategy in the Kubernetes module covers what each exam tests. This lesson is about the working environment itself, because many candidates lose minutes to habits that a short setup would remove.

## What you will learn

- What the exam environment is like and how scoring works
- A two-minute setup of aliases, completion and editor settings
- How to switch contexts and never work on the wrong cluster
- How to search the documentation quickly

## How the exam works

Check the current candidate handbook on the Linux Foundation site before you book, because duration, passing score, Kubernetes version and allowed resources change over time. At the time of writing, each exam is about two hours, made up of separate tasks with different weights, and you must reach a passing score of around two thirds. Tasks run on several clusters, and each task tells you which context to use. You may open one extra browser tab for the official documentation, and for the CKS the documentation of a few named tools. You may not use outside notes or your own search engine.

Because scoring checks the end state, partial work counts on many tasks. That is why order matters: take the quick, high-value tasks first and flag the slow ones.

## The domains and their weights

The curriculum is published by the CNCF and weights change from time to time. Use the current numbers from the official curriculum; the ones below are typical and give the shape.

| CKA domain | Typical weight |
|---|---|
| Troubleshooting | 30 percent |
| Cluster architecture, installation and configuration | 25 percent |
| Services and networking | 20 percent |
| Workloads and scheduling | 15 percent |
| Storage | 10 percent |

| CKS domain | Typical weight |
|---|---|
| Minimize microservice vulnerabilities | 20 percent |
| Supply chain security | 20 percent |
| Monitoring, logging and runtime security | 20 percent |
| Cluster hardening | 15 percent |
| System hardening | 15 percent |
| Cluster setup | 10 percent |

The practical lesson of the weights: troubleshooting alone is nearly a third of the CKA, so spend a corresponding share of your practice time on it.

## The two-minute setup

The terminal usually has `kubectl` completion and an alias already available, but do not assume. Check, and add what is missing. A typical setup:

```bash
alias k=kubectl
source <(kubectl completion bash)
complete -o default -F __start_kubectl k
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
```

Then set up the editor. For vim, a `~/.vimrc` with these lines saves a lot of YAML pain:

```bash
cat > ~/.vimrc <<'VIMRC'
set expandtab
set tabstop=2
set shiftwidth=2
set number
VIMRC
```

Spaces instead of tabs matters because YAML rejects tab indentation. Practise until typing `k run web --image=nginx $do > pod.yaml` is automatic.

## Contexts: the most expensive mistake

Every task starts with a command that selects the cluster, such as `kubectl config use-context k8s-c2`. Run it first, every time. Doing a correct task on the wrong cluster scores zero and may break another task. Check with `kubectl config current-context` before long edits. Notice also that some tasks tell you to connect to a node with `ssh`; work there only as long as the task needs, then exit back to the base terminal before starting the next task.

## Finding answers in the docs

The allowed documentation is the Kubernetes site, and its search works well if you give it the resource name. Habits that help:

- Search for the task keyword plus the object, for example "persistentvolume" or "network policy"
- Use the "Tasks" pages, which are written as copy-paste examples
- Copy YAML from the docs and edit it, rather than typing from memory
- Use `kubectl explain pod.spec.containers --recursive` offline in the terminal for field names; it is faster than searching

## Time budget

Set a rule such as: no task takes more than its share of the clock. If a task is worth 4 percent and you have spent six minutes, flag it and move on. Return at the end. Keep a short list of flagged tasks in a notes box if the interface provides one. Leave time at the end to re-read the question text of each flagged task, because a missed requirement such as a specific file path is easy to fix when you reread.

```python
tasks = [
    ("create pod with label", 2, 3),
    ("etcd backup", 7, 8),
    ("fix kubelet", 8, 12),
    ("network policy", 5, 7),
]
minutes_left = 120
for name, weight, est in sorted(tasks, key=lambda t: t[2] / t[1]):
    print(f"{name:24} weight {weight}  est {est} min  minutes per point {est / weight:.1f}")
```

Order by minutes per point and you will finish easy points first. This is a planning aid for practice, not something to run in the exam.

```diagram
title: First minutes of an exam task
node: ctx | Select context | 0 | 1 | Run the use-context command the task gives. | Working on the wrong cluster. | security
node: read | Read the whole task | 1 | 1 | Note names, paths and namespaces. | Missing a path or flag in the text. | observe
node: gen | Generate or copy YAML | 2 | 1 | Imperative commands and docs examples. | Typing long YAML from memory. | process
node: apply | Apply and verify | 3 | 1 | Check with get and describe. | Not verifying the end state. | process
node: flag | Flag if slow | 4 | 1 | Move on, come back later. | Sinking time into one task. | external
edge: ctx | read
edge: read | gen
edge: gen | apply
edge: apply | flag
```

## Incident: The right answer on the wrong cluster

> **Incident:** A candidate spent twelve minutes fixing a broken node, verified that the fix worked, and scored nothing for the task.

```console
$ kubectl config current-context
k8s-c1
$ kubectl get nodes
NAME       STATUS   ROLES           AGE   VERSION
c1-cp1     Ready    control-plane   40d   v1.31.0
(this is a simulated illustration, not a real incident)
```

The task had said to use context `k8s-c3`. The candidate had skipped the `use-context` line and worked on the cluster from the previous task. The fix was correct but applied to the wrong cluster, and the broken node on the right cluster stayed broken. The habit that prevents this is to paste the context command from the task text before doing anything else.

## Common mistakes

- Skipping the context command at the start of each task
- Typing long YAML from scratch instead of generating or copying it
- Using tabs in YAML
- Spending too long on one low-value task
- Forgetting to leave a node or ssh session after a task

```quiz
Q: What should you do at the start of every exam task?
+ Run the context command that the task gives
- Reboot the cluster :: Unnecessary and risky.
- Delete all pods :: Destructive.
- Open a new browser :: Not needed.
> The right context is the foundation of every task.

Q: Why does the end state matter in a performance-based exam?
+ Tasks are scored by checking what is actually configured in the cluster
- Only commands typed are scored :: The result is checked.
- A screenshot is graded :: The cluster state is checked.
- Speed is not scored at all :: Time is limited, so speed matters.
> Partial and complete end states earn points, so verify them.

Q: Which method is quickest for finding a field name offline?
+ kubectl explain with the resource path
- Memorising every field :: Impractical.
- Searching a personal blog :: Not allowed.
- Guessing :: Error prone.
> kubectl explain works in the terminal without leaving the task.

Q: What is a good approach to a task that is taking too long?
+ Flag it, move on and return if time remains
- Spend all remaining time on it :: Other points are lost.
- Delete it :: Not possible.
- Skip verifying others :: Hurts the score.
> Time per point decides the order in which to work.
```

```cards
Performance-based exam :: A test where you complete tasks on real systems and the end state is scored
Context :: A kubeconfig entry selecting a cluster, user and namespace
Dry run output :: YAML printed with dry-run so you can edit it before applying
kubectl explain :: A command that prints the documented fields of a resource
Flagging :: Marking a slow task to return to later
```
