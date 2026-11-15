---
title: Network policies in depth
minutes: 13
summary: Write network policies that select pods, namespaces and CIDRs, understand the additive and default deny model, and avoid the common traps such as DNS and the or-versus-and selector rule.
---

By default every pod can talk to every other pod. Network policies are the mechanism to limit that, but only if the CNI enforces them, and their selector rules are easy to get subtly wrong.

## What you will learn

- The default allow behaviour and what changes when a pod is selected
- Ingress and egress rules and how they combine
- podSelector, namespaceSelector and ipBlock
- The classic mistake with two selectors in one rule
- Testing and patterns

## Selection and the model

A NetworkPolicy selects pods with a podSelector. Pods that no policy selects stay open. As soon as a pod is selected by a policy that lists a policy type, the pod becomes isolated for that direction, and only traffic allowed by some policy is permitted. Policies are additive, so there is no deny rule: the union of all allow rules applies. An empty podSelector selects all pods in the namespace, which is how you write default deny.

## Default deny and allow

Write a default deny for ingress, egress or both, then add allow policies for each flow. Remember DNS: with default deny egress, pods can no longer resolve names, so allow UDP and TCP port 53 to the DNS pods.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: shop
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: shop
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - {protocol: UDP, port: 53}
        - {protocol: TCP, port: 53}
```

## Peers

A rule can name peers with podSelector for pods in the policy namespace, namespaceSelector for pods in matching namespaces, both together for specific pods in specific namespaces, or ipBlock for CIDR ranges with optional exceptions. Namespaces carry the label `kubernetes.io/metadata.name`, which makes selecting one by name easy.

## One item or two

In a `from` list, two selectors in the same item must both match, an AND. Two separate list items are alternatives, an OR. A dash in the wrong place changes the meaning completely, often allowing far more than intended. Read the indentation of every rule.

```bash
kubectl get networkpolicy -n shop
kubectl describe networkpolicy allow-web -n shop
```

## Testing and patterns

Test from a throwaway pod with the labels of the client you are testing. Check both an allowed and a denied flow. Common patterns: default deny per namespace, allow from the ingress controller namespace, allow to the database only from the app tier, and egress allow lists for external APIs. Remember that policies are only enforced if the CNI supports them, and that some policies act on node or host traffic differently.

```diagram
title: Network policies in depth
node: pol | Policy | 0 | 1 | Selects pods. | Empty selector. | security
node: ing | Ingress rules | 1 | 0 | Who may connect in. | Too wide. | security
node: eg | Egress rules | 1 | 2 | Where pods may go. | DNS blocked. | security
node: cni | CNI enforcement | 2 | 1 | Applies the rules. | Not supported. | process
node: test | Test pods | 3 | 1 | Prove allow and deny. | Not tested. | observe
edge: pol | ing
edge: pol | eg
edge: ing | cni
edge: eg | cni
edge: cni | test
```

## Incident: One dash too many

> **Incident:** A policy intended to allow the frontend only ended up allowing every pod in the frontend namespace and every pod labelled web anywhere.

```console
$ kubectl get networkpolicy allow-web -n db -o yaml | grep -A8 "from:"
  - from:
    - namespaceSelector:
        matchLabels:
          team: frontend
    - podSelector:
        matchLabels:
          app: web
(this is a simulated illustration, not a real incident)
```

Two list items mean OR. The author wanted pods labelled app web in namespaces labelled team frontend, which needs both selectors in one item. The loose policy let any pod in the frontend namespace and any web pod in the database namespace connect. Correcting the indentation to a single item restored the intended AND. Review every from and to list for dashes.

## Common mistakes

- Forgetting DNS in a default deny egress policy
- Using two list items where one item with two selectors is meant
- Expecting deny rules
- Using a CNI that does not enforce policy
- Not testing both allowed and denied flows

```quiz
Q: What does an empty podSelector select?
+ All pods in the namespace
- No pods :: No.
- Pods in all namespaces :: Only the policy namespace.
- Only system pods :: No.
> It is used for default deny.

Q: How do policy rules combine?
+ As a union of allows
- The strictest wins :: No.
- Deny overrides allow :: No deny rules exist.
- The last one wins :: No.
> Policies are additive.

Q: How do you require both a namespace and a pod label?
+ Put both selectors in one list item
- Use two list items :: That is OR.
- Use ipBlock :: No.
- Use two policies :: That is OR.
> Same item means AND.

Q: What breaks after a default deny egress with no other rules?
+ DNS lookups
- Nothing :: Egress is blocked.
- Only ingress :: Egress is blocked.
- kubelet :: Node traffic is separate.
> Allow port 53 to the DNS pods.
```

```cards
NetworkPolicy :: An object that limits traffic to and from selected pods
Default deny :: A policy that selects all pods and allows nothing
namespaceSelector :: A selector for pods in namespaces with matching labels
ipBlock :: A CIDR range used as a policy peer
Policy type :: Whether a policy affects Ingress, Egress or both
```
