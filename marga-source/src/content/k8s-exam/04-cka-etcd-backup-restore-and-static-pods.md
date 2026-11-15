---
title: CKA: etcd backup, restore and static pods
minutes: 13
summary: Take an etcd snapshot with the right certificates, restore it to a new data directory and repoint the static pod, and understand static pod manifests well enough to repair a control plane.
---

etcd holds the cluster's state, so a backup and restore task is a classic. It is mechanical and has several exact parameters, which is why it rewards practice. The Kubernetes operations module explains why etcd matters. Here is the working sequence.

## What you will learn

- Finding the etcd endpoint and certificate paths
- Taking and verifying a snapshot
- Restoring to a new directory and updating the manifest
- How static pods work and how to fix one

## Find the parameters

On a kubeadm cluster, etcd runs as a static pod. Its manifest is in the kubelet's static pod directory, usually `/etc/kubernetes/manifests/etcd.yaml`. Read it to find the flags you need:

```bash
grep -E "listen-client-urls|cert-file|key-file|trusted-ca-file|data-dir" /etc/kubernetes/manifests/etcd.yaml
```

You need the client endpoint, the CA certificate, the server certificate and its key, and the data directory. On a typical setup the certificates are under `/etc/kubernetes/pki/etcd/`.

## Take a snapshot

```bash
ETCDCTL_API=3 etcdctl snapshot save /opt/backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

Check it:

```bash
etcdutl snapshot status /opt/backup/etcd-snapshot.db --write-out=table
```

Newer etcd releases moved offline snapshot operations to `etcdutl`; older ones used `etcdctl snapshot status` and `restore`. Run `--help` to see which your environment provides. If `etcdctl` is not installed on the host, the task may expect you to run it from the etcd container or to install it. Read the task text for hints about where to store the file, and confirm the file exists afterwards.

## Restore to a new directory

Restoring does not overwrite the live data. It writes a new data directory, and you then point etcd at it.

```bash
etcdutl snapshot restore /opt/backup/etcd-snapshot.db --data-dir=/var/lib/etcd-restored
```

Edit the static pod manifest so the etcd data volume points to the new directory. In `/etc/kubernetes/manifests/etcd.yaml`, find the `hostPath` for the volume named `etcd-data` and change `path` to `/var/lib/etcd-restored`. When you save the manifest, the kubelet notices the change and recreates the etcd pod. Wait a minute, then check:

```bash
crictl ps | grep etcd
kubectl get pods -n kube-system
kubectl get nodes
```

While etcd restarts, `kubectl` will fail briefly because the API server cannot reach its store. That is normal. If it does not recover, look at the etcd container logs with `crictl logs`.

## Static pods

A static pod is managed directly by the kubelet from a manifest file, not through the API server. The kubelet watches a directory, set by `staticPodPath` in its configuration file, usually `/var/lib/kubelet/config.yaml`. Control plane components on a kubeadm cluster are static pods: etcd, kube-apiserver, kube-controller-manager and kube-scheduler.

Consequences worth knowing:

- Editing the file changes the pod; the kubelet restarts it
- Removing the file removes the pod
- The API server shows a read-only "mirror" copy of the pod, named with the node name suffix
- You cannot delete a static pod with `kubectl delete`; it comes back. Remove or move its manifest file instead

Tasks may ask you to create a static pod on a worker. Find that node's `staticPodPath` and write a pod manifest there, which you can generate with a dry run.

```bash
kubectl run static-web --image=nginx:1.27 --dry-run=client -o yaml > /etc/kubernetes/manifests/static-web.yaml
```

## Check what you changed

After a restore, verify that the cluster objects you expect are there, such as a namespace or deployment that existed at snapshot time. If the task asks you to restore a specific snapshot file, make sure you used that file and not a different one.

```python
# a simple pre-restore check of the values you will need
required = ["endpoints", "cacert", "cert", "key", "snapshot-path", "new-data-dir"]
given = {"endpoints": "https://127.0.0.1:2379", "cacert": "/etc/kubernetes/pki/etcd/ca.crt",
         "cert": "/etc/kubernetes/pki/etcd/server.crt", "key": "/etc/kubernetes/pki/etcd/server.key",
         "snapshot-path": "/opt/backup/etcd-snapshot.db"}
print("still needed:", [k for k in required if k not in given])
```

```diagram
title: Backup and restore of etcd
node: man | etcd manifest | 0 | 1 | Endpoint, certificates and data directory. | Reading the wrong certificate path. | store
node: snap | Snapshot save | 1 | 1 | etcdctl with endpoint and certificates. | Missing certificate flags. | process
node: file | Snapshot file | 2 | 1 | Verified with snapshot status. | Not checked, saved to wrong path. | store
node: rest | Restore | 3 | 1 | New data directory from the snapshot. | Overwriting live data. | process
node: edit | Edit manifest | 4 | 1 | Point etcd-data at the new directory. | Changing the wrong volume. | security
node: kub | kubelet recreates | 4 | 3 | Static pod restarts with restored data. | Typos stop the pod starting. | service
edge: man | snap
edge: snap | file
edge: file | rest
edge: rest | edit
edge: edit | kub
```

## Incident: The snapshot that was never saved

> **Incident:** A candidate ran the backup command, saw no error and moved on. Later the restore task failed because the snapshot file was empty.

```console
$ ETCDCTL_API=3 etcdctl snapshot save /opt/backup/etcd.db --endpoints=https://127.0.0.1:2379
Error: context deadline exceeded
$ ls -l /opt/backup/etcd.db
-rw------- 1 root root 0 Nov 14 08:40 /opt/backup/etcd.db
(this is a simulated illustration, not a real incident)
```

The command had been run without the certificate flags, so it hung and timed out, leaving an empty file. The error had scrolled by. Always check the exit status or the file size, and run `snapshot status` on the result. A snapshot you have not verified is not a backup.

## Common mistakes

- Omitting one of the four connection flags
- Not verifying the snapshot after saving it
- Restoring into the live data directory
- Editing the wrong volume in the etcd manifest
- Trying to delete a static pod with kubectl instead of removing its manifest

```quiz
Q: Where does a kubeadm cluster usually keep the control plane static pod manifests?
+ /etc/kubernetes/manifests
- /var/log :: That holds logs.
- /usr/bin :: That holds binaries.
- /home :: Not used for this.
> The kubelet watches that directory for static pod manifests.

Q: Which flags does an etcdctl snapshot save normally need on a secured cluster?
+ Endpoints, CA certificate, client certificate and key
- Only the file name :: The connection will fail.
- A kubeconfig file :: etcdctl does not use kubeconfig.
- The pod name :: Not a flag.
> etcd requires client certificate authentication.

Q: After restoring a snapshot to a new directory, what must you change?
+ The etcd static pod manifest so its data volume points to the new directory
- The node name :: Not needed.
- The kubeconfig :: Not related.
- The Docker version :: Not related.
> The running etcd must be told to use the restored data.

Q: How do you remove a static pod?
+ Remove or move its manifest file from the static pod directory
- kubectl delete pod :: The kubelet recreates it.
- Restart the API server :: It does not remove it.
- Drain the node :: It does not remove it.
> The manifest, not the API object, defines a static pod.
```

```cards
etcd snapshot :: A point-in-time copy of etcd data saved to a file
Restore :: Creating a new etcd data directory from a snapshot
Static pod :: A pod run by the kubelet from a manifest file in a watched directory
Mirror pod :: A read-only API representation of a static pod
staticPodPath :: The kubelet setting naming the directory of static pod manifests
```
