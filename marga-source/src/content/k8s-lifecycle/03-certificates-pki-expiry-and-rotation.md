---
title: Certificates: PKI, expiry and rotation
minutes: 12
summary: Map the certificates in a kubeadm cluster, check their expiry, renew them and recover when they have already expired.
---

A kubeadm cluster is held together by dozens of certificates. Most are valid for a year, and when they expire silently the API server and kubelets stop trusting each other. Knowing where they live and how to renew them prevents one of the most avoidable outages.

## What you will learn

- The certificate authorities and the leaf certificates they sign
- Where files live and what each is for
- Checking and renewing expiry with kubeadm
- Kubelet client and serving certificate rotation
- Recovering from expired certificates

## The certificate map

kubeadm creates three authorities under `/etc/kubernetes/pki`: the cluster CA, the etcd CA and the front proxy CA. From them it signs the API server serving certificate, the API server client certificates for the kubelet and etcd, the etcd server, peer and health check certificates, and the service account signing key pair. The admin, controller manager and scheduler kubeconfig files embed client certificates too.

## Lifetimes

Authority certificates are valid for ten years. Leaf certificates are valid for one year. A cluster created and never upgraded will hit expiry about a year after creation. Each `kubeadm upgrade` renews leaf certificates, which is one reason regular upgrades are healthy.

## Check and renew

```bash
kubeadm certs check-expiration
kubeadm certs renew all
sudo systemctl restart kubelet
```
Renewing writes new files, but the control plane static pods must restart to load them. Moving the manifests out of the directory and back, or restarting the kubelet, achieves that. Repeat on every control plane node, and update your copy of `admin.conf` because it embeds a renewed client certificate.

## Kubelet certificates

Each kubelet has a client certificate to talk to the API server. With `rotateCertificates` enabled it asks for a renewal through a CertificateSigningRequest before expiry, and the controller manager approves and signs it. Serving certificates can also be rotated with `serverTLSBootstrap`, but those requests need approval. Look for Pending CSRs.

```bash
kubectl get csr
kubectl certificate approve csr-abc12
```

## When they have already expired

kubectl will fail with certificate has expired errors. On a control plane node, use the local admin kubeconfig and run `kubeadm certs renew all`. If the API server itself will not start, use the files and `crictl` as in the failure diagnosis lesson. Rotate the CA only with great care, because every client of the old CA must be updated.

```diagram
title: Certificates: PKI, expiry and rotation
node: ca | Cluster CA | 0 | 1 | Signs leaf certs. | Key exposure. | security
node: api | API server cert | 1 | 0 | Serving identity. | Missing SAN. | security
node: kc | Kubelet client cert | 1 | 1 | Node identity. | Rotation off. | security
node: etcd | etcd certs | 1 | 2 | Peer and client. | Expired. | security
node: kcfg | Kubeconfig certs | 2 | 1 | Admin and components. | Stale copy. | store
edge: ca | api
edge: ca | kc
edge: ca | etcd
edge: kc | kcfg
```

## Incident: Expired on the anniversary

> **Incident:** On the first anniversary of the cluster, kubectl and the controller manager stopped working at the same hour.

```console
$ kubectl get nodes
Unable to connect to the server: x509: certificate has expired or is not yet valid: current time 2026-11-14T09:00:00Z is after 2026-11-14T08:41:12Z
$ sudo kubeadm certs check-expiration | head -4
CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY
admin.conf                 Nov 14, 2026 08:41 UTC   <invalid>
apiserver                  Nov 14, 2026 08:41 UTC   <invalid>
(this is a simulated illustration, not a real incident)
```

The cluster had never been upgraded, so no leaf certificate had been renewed in a year. Running kubeadm certs renew all on each control plane node, then restarting the control plane pods, restored access. A monitor on certificate expiry, with an alert at thirty days, would have turned an outage into a ticket.

## Common mistakes

- Never checking certificate expiry
- Renewing certificates but not restarting the static pods
- Forgetting to update the admin kubeconfig copy
- Leaving kubelet CSRs Pending
- Renewing on one control plane node and not the others

```quiz
Q: How long are kubeadm leaf certificates valid by default?
+ One year
- Ten years :: That is for the CAs.
- Ninety days :: That is for some other systems.
- Forever :: Certificates expire.
> Upgrades renew them.

Q: What is the command to see expiry dates?
+ kubeadm certs check-expiration
- kubectl get certs :: Not a built in resource.
- kubeadm get dates :: No such command.
- systemctl cert :: No such command.
> It lists every certificate and its residual time.

Q: After renewing, what must happen for the API server to use new files?
+ The static pods must be restarted
- Nothing, it reloads automatically :: It does not reload.
- The nodes must be rebuilt :: Not needed.
- The CA must be replaced :: Not needed.
> The processes read certificates at start.

Q: What does rotateCertificates do for the kubelet?
+ Requests a renewed client certificate before expiry
- Rotates the CA :: It does not.
- Rotates the service account key :: It does not.
- Restarts the node :: It does not.
> The renewal goes through a CSR.
```

```cards
Cluster CA :: The authority that signs most cluster certificates
CSR :: A CertificateSigningRequest object asking the cluster to sign a certificate
Residual time :: The time left before a certificate expires
rotateCertificates :: A kubelet option to renew its client certificate
SAN :: Subject alternative name, an address a certificate is valid for
```
