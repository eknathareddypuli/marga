---
title: Ingress and the Gateway API
minutes: 12
summary: Expose HTTP services with Ingress and the Gateway API, understand controllers, classes, routes and TLS, and know when each fits.
---

A Service gets traffic to pods. Ingress and the Gateway API take HTTP and HTTPS from outside the cluster and route it to the right Service by host and path. They are objects in the API, but they do nothing without a controller that implements them.

## What you will learn

- Ingress objects, classes and controllers
- TLS termination and certificates
- Gateway, GatewayClass and routes
- Role separation and cross namespace routing
- Choosing between them and migration

## Ingress

An Ingress declares host and path rules that map to Services, plus TLS settings. An ingress controller, such as ingress-nginx, Traefik or a cloud controller, watches Ingress objects and configures a proxy or load balancer. Which controller handles an object is chosen with `ingressClassName`. Without a controller, the Ingress is just data. Controller specific behaviour is added through annotations, which makes manifests less portable.

## TLS

Ingress can terminate TLS using a certificate stored in a Secret of type kubernetes.io/tls, referenced in the `tls` section. Tools such as cert-manager request and renew certificates automatically. The proxy then forwards plain or re-encrypted traffic to the backends.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
spec:
  ingressClassName: nginx
  tls:
    - hosts: [shop.example.com]
      secretName: shop-tls
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

## Gateway API

The Gateway API splits responsibilities across objects. A GatewayClass names a controller implementation, managed by the platform provider. A Gateway describes listeners, such as ports, protocols and TLS, and is owned by the cluster operator. Routes such as HTTPRoute attach to a Gateway and describe how requests reach Services, owned by application teams. The model supports header matching, traffic splitting, redirects and other features in the spec instead of annotations.

## Sharing safely

Gateways can restrict which namespaces may attach routes, and cross namespace references need a ReferenceGrant. This lets a platform team run a shared Gateway while teams manage only their own routes, which Ingress could not express cleanly.

## Choosing

Ingress is mature, widely supported and enough for simple host and path routing. The Gateway API is the direction of the project, with richer features and a better ownership model, and is the choice for new designs when your controller supports it. Both need a controller you operate and monitor. Check events and the status of the objects when traffic does not arrive.

```bash
kubectl get ingressclass
kubectl describe ingress web
kubectl get gateway,httproute -A
```

```diagram
title: Ingress and the Gateway API
node: cl | Client | 0 | 1 | HTTPS request. | Wrong DNS. | external
node: lb | Load balancer | 1 | 1 | Entry point. | Health check fails. | service
node: ctl | Controller and proxy | 2 | 1 | Implements the rules. | Missing class. | process
node: route | Ingress or HTTPRoute | 3 | 0 | Host and path rules. | Wrong backend. | store
node: svc | Service and pods | 4 | 1 | Backends. | No endpoints. | service
edge: cl | lb
edge: lb | ctl
edge: ctl | route
edge: ctl | svc
```

## Incident: An Ingress that nothing served

> **Incident:** A new Ingress showed no address for days.

```console
$ kubectl get ingress web
NAME   CLASS    HOSTS              ADDRESS   PORTS
web    <none>   shop.example.com             80
$ kubectl get ingressclass
NAME    CONTROLLER                     PARAMETERS
nginx   k8s.io/ingress-nginx           <none>
(this is a simulated illustration, not a real incident)
```

The Ingress had no class and there was no default class, so no controller claimed it. Setting ingressClassName to nginx made the controller pick it up and the address appeared. An Ingress with an empty address often just needs the right class, so check the class before debugging the proxy.

## Common mistakes

- Creating an Ingress without a controller or class
- Relying on controller specific annotations for portability
- Forgetting that TLS Secrets must be in the same namespace
- Exposing a Service as NodePort instead of through a gateway
- Not checking the status of Gateway objects

```quiz
Q: What makes an Ingress object take effect?
+ A controller that implements it
- A NodePort :: Not required.
- A new Secret :: Not required.
- kube-proxy :: It does not implement Ingress.
> Ingress is configuration for a controller.

Q: What does ingressClassName select?
+ Which controller handles the Ingress
- The TLS version :: No.
- The namespace :: No.
- The node :: No.
> Classes map to controllers.

Q: Who owns HTTPRoute objects in the Gateway API model?
+ Application teams
- The scheduler :: No.
- The kubelet :: No.
- Nobody :: Someone owns them.
> Routes attach to a shared Gateway.

Q: What allows a route to reference a Service in another namespace?
+ A ReferenceGrant
- A NodePort :: No.
- A ConfigMap :: No.
- A taint :: No.
> It is explicit permission.
```

```cards
Ingress :: An object describing HTTP routing to Services
IngressClass :: A name that selects an ingress controller
Gateway :: A Gateway API object that defines listeners
HTTPRoute :: A Gateway API object that routes HTTP requests to Services
ReferenceGrant :: Permission to reference objects across namespaces
```
