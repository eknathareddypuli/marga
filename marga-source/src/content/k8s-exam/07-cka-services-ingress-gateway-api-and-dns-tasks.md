---
title: CKA: services, Ingress, Gateway API and DNS tasks
minutes: 14
summary: Expose and secure applications: create services of each type, route HTTP with Ingress and the Gateway API, write network policies, and diagnose DNS with CoreDNS.
---

Services and networking is about a fifth of the CKA. The tasks are short, but the objects interact, so a missed label or port is easy to make. This lesson gives the shapes you need and a checking routine.

## What you will learn

- Service types and what each is for
- Ingress and Gateway API routing
- Network policies, including default deny
- DNS names and CoreDNS checks

## Services

```bash
kubectl expose deployment web --port=80 --target-port=8080
kubectl expose deployment web --name=web-np --port=80 --target-port=8080 --type=NodePort
kubectl get svc web
kubectl get endpoints web
kubectl get endpointslices -l kubernetes.io/service-name=web
```

A ClusterIP service gives a stable internal address. NodePort opens a port on every node. LoadBalancer asks the cloud provider for an external load balancer. A headless service, with `clusterIP: None`, returns pod addresses directly in DNS. The check that matters most is the endpoints list: if it is empty, the service selector does not match any ready pod. Compare `kubectl get svc web -o yaml` selector with pod labels.

## Ingress

An Ingress routes HTTP and HTTPS traffic to services, and it needs an Ingress controller running in the cluster. The Ingress resource alone does nothing.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

Notice `pathType`, which is required, and the backend structure. You can generate a starting point with `kubectl create ingress web --rule="shop.example.com/api*=api:80" --dry-run=client -o yaml`. TLS adds a `tls` section naming a secret created with `kubectl create secret tls`.

## Gateway API

The Gateway API is the newer, more expressive model, and appears in the current curriculum. It separates roles: a GatewayClass names a controller, a Gateway defines listeners, and routes such as HTTPRoute attach to a Gateway.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web
spec:
  parentRefs:
    - name: main-gateway
  hostnames:
    - shop.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api
          port: 80
```

Check status with `kubectl describe httproute web`: conditions say whether it was accepted by the gateway and whether backend references resolved. The Gateway API CRDs may need to be installed; the docs show how.

## Network policies

By default all pods can talk to all pods. A NetworkPolicy selects pods and allows only listed traffic once any policy selects them. Policies need a network plugin that enforces them.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: shop
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

Then allow what you need:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: shop
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: web
      ports:
        - protocol: TCP
          port: 8080
```

Two traps: egress default deny also blocks DNS, so allow port 53 to the DNS pods; and a `from` with both `namespaceSelector` and `podSelector` in the same list item means "both must match", while two separate items mean "either".

## DNS and CoreDNS

Services get names like `web.shop.svc.cluster.local`, and within the same namespace `web` is enough. CoreDNS runs as a deployment in `kube-system` with a ConfigMap named `coredns`.

```bash
kubectl run dns --rm -it --image=busybox:1.36 --restart=Never -- nslookup web.shop
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
kubectl -n kube-system get configmap coredns -o yaml
```

If DNS fails inside pods, check that the CoreDNS pods are running, the `kube-dns` service has endpoints, and no network policy blocks port 53 traffic.

## Debug from the client

When a service does not answer, test in order: does the name resolve, does the service have endpoints, does the pod answer on its own IP and port, and does a policy block the route? Use a temporary pod to curl each.

```python
svc_selector = {"app": "web"}
pods = [{"name": "web-1", "labels": {"app": "web"}, "ready": True},
        {"name": "web-2", "labels": {"app": "web"}, "ready": False},
        {"name": "api-1", "labels": {"app": "api"}, "ready": True}]
endpoints = [p["name"] for p in pods if p["ready"] and all(p["labels"].get(k) == v for k, v in svc_selector.items())]
print("endpoints:", endpoints)
```

```diagram
title: Reaching an application
node: cli | Client pod | 0 | 1 | Resolves a name and connects. | DNS egress blocked by policy. | external
node: dns | CoreDNS | 1 | 0 | Resolves service names. | CoreDNS pods not running. | service
node: svc | Service | 2 | 1 | Stable address and selector. | Selector matches no pods. | process
node: pol | Network policy | 2 | 3 | Allows or blocks the connection. | Default deny without an allow. | security
node: ing | Ingress or route | 1 | 2 | External HTTP entry. | No controller installed. | process
node: pod | Ready pods | 3 | 1 | Endpoints behind the service. | Failing readiness probes. | store
edge: cli | dns
edge: cli | svc
edge: ing | svc
edge: pol | pod
edge: svc | pod
```

## Incident: DNS blocked by default deny

> **Incident:** After adding a default deny egress policy, applications could not reach anything by name.

```console
$ kubectl exec web-1 -n shop -- nslookup api
;; connection timed out; no servers could be reached
$ kubectl get networkpolicy -n shop
NAME           POD-SELECTOR   AGE
default-deny   <none>         3m
(this is a simulated illustration, not a real incident)
```

The deny policy applied to all pods in the namespace, including their DNS lookups to CoreDNS. Adding an egress rule allowing UDP and TCP port 53 to pods in `kube-system` restored name resolution. Whenever you apply egress deny, add DNS in the same change.

## Common mistakes

- Creating an Ingress with no controller installed
- Omitting pathType in an Ingress
- A service selector that does not match any pod label
- Blocking DNS with an egress default deny
- Misreading namespaceSelector and podSelector in one entry as "or"

```quiz
Q: What shows that a service selector matches no ready pods?
+ An empty endpoints list
- A high NodePort number :: Unrelated.
- A long service name :: Unrelated.
- A missing namespace :: Unrelated.
> Endpoints list the pods that back the service.

Q: What must exist for an Ingress resource to work?
+ An Ingress controller running in the cluster
- A LoadBalancer service only :: A controller is needed.
- A second cluster :: Not required.
- A Gateway API CRD :: That is a different API.
> The resource describes rules; the controller implements them.

Q: What does a NetworkPolicy with an empty podSelector select?
+ All pods in its namespace
- No pods :: Empty selects all.
- Only the pods with no labels :: Empty selects all.
- Only system pods :: Not how it works.
> An empty selector matches every pod in the namespace.

Q: Why can egress default deny break applications?
+ It also blocks DNS lookups unless port 53 is allowed
- It deletes services :: It does not.
- It stops pods from starting :: It does not.
- It removes labels :: It does not.
> Name resolution needs egress to CoreDNS.
```

```cards
Service :: A stable address and load balancing over a set of pods chosen by a selector
Ingress :: A resource describing HTTP routing, implemented by an Ingress controller
Gateway API :: A newer routing model with GatewayClass, Gateway and route resources
NetworkPolicy :: A rule set that limits which pods may communicate
CoreDNS :: The cluster DNS server that resolves service and pod names
```
