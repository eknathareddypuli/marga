---
title: Imperative kubectl and fast YAML
minutes: 13
summary: Create and change resources in seconds with imperative commands, dry-run output you edit, JSONPath and custom columns, so the terminal does the typing during exam tasks and daily work.
---

Declarative YAML is the right way to manage clusters over time. In an exam, and in many incident situations, speed matters more. kubectl can create most common objects imperatively and print the YAML for you to adjust. Learning this set of commands is the best time investment for a hands-on test.

## What you will learn

- Imperative commands for the common objects
- The dry-run pattern for generating YAML
- Quick edits, patches and set commands
- Output formats that answer questions fast

## Creating objects imperatively

```bash
kubectl run web --image=nginx:1.27 --port=80 --labels=app=web
kubectl create deployment api --image=nginx:1.27 --replicas=3
kubectl expose deployment api --port=80 --target-port=8080 --type=ClusterIP
kubectl create configmap app-config --from-literal=mode=prod --from-file=settings.ini
kubectl create secret generic db-pass --from-literal=password=changeme
kubectl create job once --image=busybox:1.36 -- echo hello
kubectl create cronjob tick --image=busybox:1.36 --schedule="*/5 * * * *" -- date
kubectl create namespace dev
kubectl create serviceaccount deployer -n dev
```

Anything after `--` is the container command. Pin image tags, as in real life.

## The dry-run pattern

When you need a field that no flag provides, generate YAML and edit it:

```bash
kubectl create deployment api --image=nginx:1.27 --replicas=3 --dry-run=client -o yaml > api.yaml
vim api.yaml
kubectl apply -f api.yaml
```

`--dry-run=client` prints the object without sending it to the server. With `-o yaml` you get a valid starting file. Add what you need, such as a volume or a security context, and apply. Use `--dry-run=server` when you want the API server's validation without creating anything.

## Changing what exists

```bash
kubectl set image deployment/api nginx=nginx:1.27.1
kubectl set resources deployment/api --limits=cpu=500m,memory=256Mi --requests=cpu=100m,memory=128Mi
kubectl scale deployment/api --replicas=5
kubectl label pod web tier=frontend
kubectl annotate pod web owner=team-a
kubectl rollout status deployment/api
kubectl rollout undo deployment/api
kubectl edit deployment api
kubectl patch deployment api -p '{"spec":{"replicas":2}}'
```

`kubectl edit` opens the live object in your editor; saving applies it. For fields that are immutable, such as most pod spec fields, you must delete and recreate, or use `kubectl replace --force -f file.yaml`.

## Reading output quickly

```bash
kubectl get pods -o wide
kubectl get pods --show-labels
kubectl get pods -l app=web
kubectl get pods -A --field-selector=status.phase!=Running
kubectl get pods --sort-by=.metadata.creationTimestamp
kubectl get pod web -o jsonpath='{.status.podIP}'
kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu
kubectl get events --sort-by=.lastTimestamp
kubectl describe pod web
kubectl logs web --previous
kubectl explain pod.spec.containers.securityContext
```

JSONPath and custom columns answer tasks such as "write the names of all nodes to a file" without manual copying. Redirect to a file with `>` and check it with `cat` afterwards.

## Working inside pods

```bash
kubectl exec -it web -- sh
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- wget -qO- http://api
kubectl cp web:/etc/nginx/nginx.conf ./nginx.conf
kubectl port-forward svc/api 8080:80
```

The temporary pod pattern with `--rm -it --restart=Never` is the quickest way to test service names and network policies from inside the cluster.

## Know your limits

Imperative commands cover the common cases. Pod volumes, init containers, probes, affinity, tolerations and most security settings need YAML. Know the dry-run pattern well enough that adding a block to generated YAML takes seconds. Keep a mental library of the three or four YAML snippets you use most, and copy the rest from the docs.

## A quick sanity check

Before applying a generated file, read it once. Check the namespace, the name, labels matching selectors, and that no leftover fields such as `status: {}` or `creationTimestamp: null` cause problems. Those two are harmless, but a wrong namespace is not.

```python
import json

# check that a generated deployment's selector matches its pod template labels
d = json.loads("""{
 "spec": {"selector": {"matchLabels": {"app": "api"}},
          "template": {"metadata": {"labels": {"app": "api", "tier": "back"}}}}
}""")
sel = d["spec"]["selector"]["matchLabels"]
labels = d["spec"]["template"]["metadata"]["labels"]
print("selector matches template:", all(labels.get(k) == v for k, v in sel.items()))
```

```diagram
title: From command to resource
node: cmd | kubectl create | 0 | 1 | Imperative command with flags. | Missing flags for the field you need. | service
node: dry | Dry run output | 1 | 1 | YAML printed, nothing created. | Applying without reading. | process
node: edit | Edit the file | 2 | 1 | Add volumes, probes or security settings. | Tabs or wrong indentation. | process
node: api | API server | 3 | 1 | Validates and stores the object. | Immutable field changes rejected. | security
node: chk | Verify | 4 | 1 | get, describe and logs. | Assuming success. | observe
edge: cmd | dry
edge: dry | edit
edge: edit | api
edge: api | chk
```

## Incident: The selector that did not match

> **Incident:** A candidate hand-edited generated YAML and applied it; the deployment never created pods.

```console
$ kubectl get deployment api
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
api    0/3     0            0           2m
$ kubectl describe deployment api
Selector:  app=api
Pod Template Labels:  app=backend
(this is a simulated illustration, not a real incident)
```

The pod template labels had been changed to `app=backend` while the selector still said `app=api`, so the deployment could not claim its pods. Reading the describe output revealed the mismatch within seconds. Generating YAML and changing labels in only one place is a classic slip; check both.

## Common mistakes

- Typing full YAML when an imperative command and dry run would do
- Forgetting `--dry-run=client -o yaml` and creating the object directly
- Mismatching selector and pod template labels
- Applying without reading generated YAML
- Using latest tags in examples that then differ from the task's requirements

```quiz
Q: What does kubectl create deployment api --image=nginx --dry-run=client -o yaml do?
+ Prints the deployment YAML without creating it
- Creates the deployment :: Dry run prevents creation.
- Deletes the deployment :: It does not.
- Scales it to zero :: It does not.
> It is the standard way to generate a starting file.

Q: Which command shows a pod's IP using JSONPath?
+ kubectl get pod web -o jsonpath='{.status.podIP}'
- kubectl describe web ip :: Not valid.
- kubectl ip pod web :: Not a command.
- kubectl get ip :: Not a resource.
> JSONPath extracts a single field.

Q: How do you test a service from inside the cluster quickly?
+ Run a temporary pod with kubectl run --rm -it --restart=Never
- Reinstall the cluster :: Excessive.
- Open the browser on your laptop :: Not inside the cluster.
- Delete the service :: Does not test it.
> A throwaway pod gives you a shell in the cluster network.

Q: Why must a deployment's selector match its pod template labels?
+ Otherwise the deployment cannot claim or manage its pods
- Labels are decorative :: They drive selection.
- Selectors are ignored :: They are required.
- It speeds up scheduling :: Not the reason.
> The selector is how the controller finds its pods.
```

```cards
Imperative command :: A command that creates or changes an object directly, without a file
Dry run :: A request processed without making any change
JSONPath :: A query syntax for extracting fields from kubectl output
Custom columns :: A kubectl output format that shows chosen fields
Selector :: A label query a controller uses to find the pods it manages
```
