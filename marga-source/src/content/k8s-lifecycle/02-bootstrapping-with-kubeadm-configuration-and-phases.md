---
title: Bootstrapping with kubeadm: configuration and phases
minutes: 12
summary: Use kubeadm configuration files and phases to create reproducible clusters, join nodes and troubleshoot a bootstrap that fails part way.
---

kubeadm sets up the pieces of a cluster in a defined order and leaves the nodes in a known state. Using a configuration file and understanding the phases means a cluster can be rebuilt the same way each time and a failed bootstrap can be repaired instead of restarted blindly.

## What you will learn

- Prerequisites on every node
- The main phases of kubeadm init
- A configuration file instead of flags
- Joining control plane and worker nodes
- Resetting and retrying safely

## Prerequisites

Every node needs a container runtime with the CRI enabled, the kubelet, kubeadm and kubectl packages at matching versions, swap disabled unless configured for it, required kernel modules and sysctls for bridging and IP forwarding, unique host names, and open ports between nodes. Most bootstrap failures are a missed prerequisite, and `kubeadm init` runs preflight checks that name them.

## Phases of init

`kubeadm init` runs phases in order: preflight, certificate generation, kubeconfig files, kubelet start, control plane static pod manifests, etcd static pod, wait for the control plane, upload configuration, mark the control plane node, bootstrap tokens and add-ons such as CoreDNS and kube-proxy. You can list and run a single phase with `kubeadm init phase`, which is useful for repairs, for example regenerating a certificate.

## A configuration file

Flags are fine for a lab. For anything repeatable, use a configuration file with the InitConfiguration and ClusterConfiguration kinds. It records the Kubernetes version, the control plane endpoint, the pod and service subnets, certificate SANs and component flags.

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
kubernetesVersion: v1.31.2
controlPlaneEndpoint: k8s-api.example.internal:6443
networking:
  podSubnet: 10.244.0.0/16
  serviceSubnet: 10.96.0.0/12
apiServer:
  certSANs:
    - k8s-api.example.internal
```

```bash
kubeadm init --config kubeadm.yaml --upload-certs
```

## Joining nodes

Workers join with a token and the CA hash printed by init. Tokens expire after 24 hours by default, so create a new one with `kubeadm token create --print-join-command`. Additional control plane nodes join with the control plane flag and a certificate key, which is valid for two hours. After joining, install a network plugin if you have not, then check that all nodes are Ready.

## Reset and retry

A failed init or join leaves files behind. `kubeadm reset` removes what kubeadm created on that node, but not CNI configuration, iptables rules or your kubeconfig. Clean those by hand before retrying. Read the preflight and phase output first, because the line that failed is usually clear.

```diagram
title: Bootstrapping with kubeadm: configuration and phases
node: pre | Preflight | 0 | 1 | Checks the node. | Swap or ports. | observe
node: pki | Certificates | 1 | 1 | Creates the CA and certs. | Wrong SANs. | security
node: cp | Control plane | 2 | 1 | Static pod manifests. | Bad flags. | service
node: add | Add-ons | 3 | 1 | CoreDNS and kube-proxy. | No CNI yet. | service
node: join | Join nodes | 4 | 1 | Token and CA hash. | Expired token. | process
edge: pre | pki
edge: pki | cp
edge: cp | add
edge: add | join
```

## Incident: The join token that expired

> **Incident:** A new worker could not join a cluster built the week before.

```console
$ sudo kubeadm join k8s-api.example.internal:6443 --token abcdef.0123456789abcdef --discovery-token-ca-cert-hash sha256:1f2e3d
error execution phase preflight: couldn't validate the identity of the API Server: could not find a JWS signature in the cluster-info ConfigMap for token ID "abcdef"
$ kubeadm token list
(no tokens)
(this is a simulated illustration, not a real incident)
```

Bootstrap tokens expire after 24 hours unless a TTL was set. The token in the old notes was gone, so discovery failed. The fix was to print a new join command on a control plane node. Do not paste old join commands into runbooks: generate a fresh one each time.

## Common mistakes

- Mismatched kubeadm, kubelet and kubectl versions
- Reusing an expired token or certificate key
- Forgetting the network plugin and wondering why nodes are NotReady
- Using kubeadm reset and expecting a clean network configuration
- Building clusters with long flag lists instead of a file

```quiz
Q: What does a kubeadm configuration file provide?
+ A repeatable record of cluster settings
- Faster pods :: It does not affect speed.
- Automatic backups :: It does not.
- A load balancer :: It only names the endpoint.
> It makes bootstraps reproducible.

Q: How do you get a fresh worker join command?
+ kubeadm token create --print-join-command
- kubectl join :: No such command.
- kubeadm reset :: That removes node state.
- kubectl get token :: No such command.
> Run it on a control plane node.

Q: What does kubeadm reset NOT clean up?
+ CNI configuration and iptables rules
- Static pod manifests it created :: It removes them.
- The kubelet configuration it wrote :: It removes it.
- The PKI directory it created :: It removes it.
> Clean network leftovers by hand.

Q: Which phase creates the control plane static pods?
+ The control plane phase after certificates and kubeconfigs
- The join phase :: Join is for adding nodes.
- The reset phase :: It removes things.
- The preflight phase :: It only checks.
> Phases run in a fixed order.
```

```cards
Preflight :: Checks kubeadm runs before changing a node
Bootstrap token :: A short lived credential for joining nodes
Certificate key :: A key used to share control plane certificates with a joining node
ClusterConfiguration :: The kubeadm file kind holding cluster wide settings
kubeadm phase :: A single step of init or join that can be run alone
```
