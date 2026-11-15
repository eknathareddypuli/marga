---
title: CKA: storage tasks
minutes: 12
summary: Handle persistent storage tasks: create volumes and claims that bind, use storage classes and dynamic provisioning, choose access modes and reclaim policies, mount volumes in pods and expand claims.
---

Storage is the smallest CKA domain by weight, about a tenth, yet the tasks are specific and a single wrong field stops a claim from binding. The Kubernetes module explains the model. Here you practise the objects and the failure patterns.

## What you will learn

- PersistentVolumes, claims and how binding works
- StorageClasses and dynamic provisioning
- Access modes, volume modes and reclaim policies
- Mounting, expanding and debugging claims

## The objects

A **PersistentVolume** (PV) is a piece of storage in the cluster. A **PersistentVolumeClaim** (PVC) is a request for storage by a user. A pod mounts a claim, not the volume directly. A **StorageClass** describes a kind of storage and how to provision it dynamically.

A static volume, backed by a directory on a node, as used in exercises:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/data
```

A claim that can bind to it:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
  namespace: shop
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: manual
```

Binding requires the claim's class, access modes and capacity request to be satisfied by a volume: the volume must be at least as large, include the requested access mode and match the storage class name. A claim without a storage class name uses the cluster's default class if one exists; set `storageClassName: ""` to request a volume with no class.

## Use the claim in a pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
  namespace: shop
spec:
  containers:
    - name: app
      image: nginx:1.27
      volumeMounts:
        - name: data
          mountPath: /usr/share/nginx/html
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: data
```

The claim must be in the same namespace as the pod. Volumes themselves are cluster-scoped.

## Access modes

- `ReadWriteOnce` (RWO): mounted read-write by one node
- `ReadOnlyMany` (ROX): mounted read-only by many nodes
- `ReadWriteMany` (RWX): mounted read-write by many nodes
- `ReadWriteOncePod` (RWOP): mounted read-write by one pod only

Not every storage type supports every mode, so a request for RWX on a block disk will not bind. RWO is per node, so several pods on the same node can share it.

## StorageClasses and dynamic provisioning

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
provisioner: example.com/provisioner
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

With dynamic provisioning, creating a claim that names the class makes the provisioner create a volume. `WaitForFirstConsumer` delays binding until a pod is scheduled, so the volume is created where the pod can use it; that is why a claim can stay `Pending` until a pod uses it, and that is not an error. A default class is marked with the annotation `storageclass.kubernetes.io/is-default-class: "true"`.

## Reclaim policy

What happens to the volume when its claim is deleted:

- `Retain`: the volume stays with its data and must be cleaned manually; it shows `Released` and will not bind again until the old claim reference is cleared
- `Delete`: the volume and the backing storage are deleted
- `Recycle` is deprecated

You can change the policy on an existing PV with `kubectl patch pv pv-data -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'`.

## Expanding a claim

If the class allows expansion, edit the claim and increase `spec.resources.requests.storage`. The size can only grow. Some drivers need the pod to restart before the filesystem resize completes, and the claim shows conditions describing progress.

## Other volume types

Know the short list: `emptyDir` (scratch space that lives as long as the pod), `hostPath` (a path on the node, risky), `configMap` and `secret` (configuration), `projected`, and `persistentVolumeClaim`. Tasks may ask for two containers sharing an `emptyDir`.

## Debug a claim

```bash
kubectl get pv,pvc -A
kubectl describe pvc data -n shop
kubectl get storageclass
kubectl describe pod app -n shop
```

The events on the claim and pod show what is missing: no matching volume, no class, a provisioner that is not running or a node that cannot mount.

```python
pvs = [{"name": "pv-data", "size": 5, "modes": {"RWO"}, "cls": "manual", "free": True}]
claim = {"size": 2, "modes": {"RWO"}, "cls": "manual"}
match = [p["name"] for p in pvs if p["free"] and p["size"] >= claim["size"] and claim["modes"] <= p["modes"] and p["cls"] == claim["cls"]]
print("binds to:", match)
```

```diagram
title: From claim to mounted storage
node: sc | StorageClass | 0 | 0 | Type of storage and provisioner. | No default class set. | store
node: pvc | PersistentVolumeClaim | 1 | 1 | Size, mode and class requested. | Class name typo. | service
node: pv | PersistentVolume | 2 | 1 | Static or dynamically created. | Too small or wrong mode. | store
node: pod | Pod | 3 | 1 | Mounts the claim by name. | Claim in another namespace. | process
node: ctr | Container path | 4 | 1 | Data visible at the mount path. | Wrong mountPath. | observe
node: rec | Reclaim policy | 2 | 3 | Retain or delete on claim removal. | Data lost on Delete. | security
edge: sc | pvc
edge: pvc | pv
edge: pv | pod
edge: pod | ctr
edge: pv | rec
```

## Incident: The claim that stayed Pending

> **Incident:** A claim stayed Pending, and the candidate suspected the provisioner. A pod using it had never been created.

```console
$ kubectl get pvc data -n shop
NAME   STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
data   Pending                                      fast           6m
$ kubectl describe pvc data -n shop
Events:
  Normal  WaitForFirstConsumer  6m  persistentvolume-controller  waiting for first consumer to be created before binding
(this is a simulated illustration, not a real incident)
```

The storage class used `WaitForFirstConsumer`, so nothing bound until a pod referenced the claim. The event said so plainly. Creating the pod made the volume appear and the claim bind. Reading the events before changing anything saved time.

## Common mistakes

- Requesting a size or mode no volume can satisfy
- A storage class name mismatch between PV and PVC
- Creating the claim in a different namespace from the pod
- Expecting a Pending claim to bind before any pod uses it, with WaitForFirstConsumer
- Forgetting that Retain leaves volumes Released and not reusable until cleaned

```quiz
Q: What must be true for a claim to bind to a static volume?
+ Class matches, access modes are included and capacity is large enough
- The names match :: Names do not matter.
- The volume is in the same namespace :: Volumes are cluster-scoped.
- The pod already exists :: Not required for static binding.
> Class, access modes and size decide binding.

Q: Why might a claim stay Pending with WaitForFirstConsumer?
+ Binding waits until a pod using the claim is scheduled
- The provisioner is broken :: Not necessarily.
- The claim is too large :: Not shown by that event.
- Pending is always an error :: It can be normal.
> The volume is created where the pod will run.

Q: What does the Retain reclaim policy do after the claim is deleted?
+ Keeps the volume and its data until an administrator cleans it
- Deletes everything :: That is Delete.
- Copies it to another cluster :: Not a feature.
- Resizes it :: Not related.
> Retain protects data from automatic deletion.

Q: When can a claim be expanded?
+ When its storage class allows volume expansion, and only to a larger size
- Never :: Expansion is supported.
- Only to a smaller size :: Shrinking is not supported.
- Only on hostPath :: Not related.
> Expansion needs allowVolumeExpansion and a driver that supports it.
```

```cards
PersistentVolume :: A cluster-level piece of storage that can be bound by a claim
PersistentVolumeClaim :: A namespaced request for storage that a pod mounts
StorageClass :: A definition of a type of storage and how to provision it
Reclaim policy :: What happens to a volume after its claim is deleted
Access mode :: How many nodes or pods may mount a volume and with what rights
```
