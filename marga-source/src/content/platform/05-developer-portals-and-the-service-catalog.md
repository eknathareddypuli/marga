---
title: Developer portals and the service catalog
minutes: 14
summary: A developer portal is the front door to the platform and the service catalog is its memory. Learn what goes in the catalog, how to keep it accurate, and how tools such as Backstage use it.
---

Ask a large engineering organisation "who owns this service?" and the honest answer is often "let me ask around". A service catalog fixes that by keeping a living record of services, their owners and their links. A developer portal puts the catalog, the templates, the docs and the status of your services in one place. Together they are the visible part of a platform.

## What you will learn

- What a catalog holds and why accuracy matters more than size
- How a portal such as Backstage is organised
- How catalog entries are defined and discovered
- How to keep entries from going stale

## What belongs in a catalog

The minimum useful entry answers four questions about a service: who owns it, what is it, how do I run or reach it, and what does it depend on. Practical fields are:

- Name, description and lifecycle (experimental, production, deprecated)
- Owning team and an on-call contact
- Tier or criticality, and the data classes it handles
- Links to the repository, pipeline, dashboard, runbook and documentation
- Dependencies on other services, databases and queues

Other kinds of things can live in the same catalog: APIs, libraries, infrastructure resources, teams and people. The relationships between them are what make it more than a spreadsheet.

## How Backstage models it

Backstage is an open source developer portal, started at Spotify and now a CNCF project. Its software catalog is built from descriptor files, typically named `catalog-info.yaml`, stored next to the code. Each describes an entity with a kind, such as Component, API, Resource, System, Domain, Group or User.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: checkout
  description: Handles cart and payment orchestration
  annotations:
    github.com/project-slug: example-org/checkout
spec:
  type: service
  lifecycle: production
  owner: team-payments
  system: shop
  dependsOn:
    - resource:default/orders-db
```

Because the descriptor lives with the code, the owner of the service updates it in the same pull request that changes the service. The portal discovers files from source control and keeps the catalog in sync. This is a more reliable approach than a central team editing a spreadsheet.

## More than a catalog

A portal usually adds more surfaces on top of the catalog. Software templates create new services from a form. Documentation systems such as TechDocs render Markdown from the repository. Plugins show pipeline status, deployments, alerts, cost and security findings against each service. The value is in seeing everything about a service on one page without opening six tools.

## Accuracy beats volume

A catalog with ten thousand entries of unknown quality is worse than one with a hundred accurate entries. Wrong owners send people to the wrong team at 3am. Design for accuracy:

- Make ownership required, and reject entries without a valid team
- Store descriptors with the code and review them
- Check links and owners automatically and report broken ones
- Mark entries not updated for a long time and ask the owner to confirm or retire them
- Remove or archive services that no longer exist

## Run a freshness check

The snippet below flags catalog entries whose owner does not exist or that have not been confirmed recently.

```python
teams = {"team-payments", "team-search", "team-platform"}
today = 400  # day number, for the example
entries = [
    {"name": "checkout", "owner": "team-payments", "confirmed": 390},
    {"name": "legacy-report", "owner": "team-old", "confirmed": 120},
    {"name": "search-api", "owner": "team-search", "confirmed": 250},
]

for e in entries:
    problems = []
    if e["owner"] not in teams:
        problems.append("owner not found")
    if today - e["confirmed"] > 180:
        problems.append("not confirmed in 180 days")
    print(f"{e['name']:14}", ", ".join(problems) or "ok")
```

## Make it useful before it is complete

Start with the services people ask about most, such as the critical tier. Show something people want in the portal early, for example a single page that links a service to its dashboard and runbook. When the catalog saves someone time during an incident, the owners will keep it accurate themselves.

## Do not build what you can adopt

Building a portal from scratch is a large, permanent commitment. Backstage is a framework, so adopting it still takes engineering work to deploy, extend and maintain. Compare it with commercial portals and with a simpler option, such as a generated documentation site backed by a catalog file. Choose the smallest tool that gives you the catalog and the front door.

```diagram
title: From code to portal
node: repo | Service repository | 0 | 1 | Holds code and its catalog descriptor. | Descriptor missing or outdated. | store
node: disc | Catalog discovery | 1 | 1 | Reads descriptors from source control. | Rate limits or stale sync. | process
node: cat | Software catalog | 2 | 1 | Entities, owners and relations. | Entries with no valid owner. | store
node: portal | Developer portal | 3 | 1 | Search, pages, templates and docs. | Too many plugins, slow pages. | service
node: user | Developers and on-call | 4 | 1 | Find owners, runbooks and status. | Data they cannot trust. | external
edge: repo | disc
edge: disc | cat
edge: cat | portal
edge: portal | user
```

## Incident: The page that went to the wrong team

> **Incident:** At 02:10 an alert on the reporting service paged a team that had not owned it for a year, and nobody realised for forty minutes.

```console
$ platformctl catalog show reporting-api
owner:      team-old   (team not found in directory)
lifecycle:  production
confirmed:  2025-02-03
(this is a simulated illustration, not a real incident)
```

The service had moved teams during a reorganisation, but the descriptor kept the old owner and nothing checked it against the team directory. After the incident the platform team added a nightly check that failed any entry whose owner is not a real team, and a monthly report of entries not confirmed in six months.

## Common mistakes

- Treating a catalog as a one-off data import
- Letting a central team edit entries instead of the service owners
- Allowing entries with no owner
- Installing many portal plugins before the catalog is trustworthy
- Building a portal from scratch when an existing one would do

```quiz
Q: Why store catalog descriptors next to the code?
+ The owners update them in the same change that alters the service
- It makes the portal faster :: Speed is not the main reason.
- It removes the need for owners :: Ownership is still required.
- It hides services from others :: The portal makes them visible.
> Descriptors that live with the code are more likely to stay accurate.

Q: What is the minimum a catalog entry should say?
+ Who owns it, what it is, how to reach or run it and what it depends on
- Only the service name :: That helps nobody at 3am.
- Only its cost :: Cost is one useful field, not the minimum.
- Only its programming language :: Not enough to act on.
> Ownership and links make the entry useful in practice.

Q: Which is better, a large catalog of unknown quality or a smaller accurate one?
+ A smaller accurate one
- The large one :: Wrong data sends people to the wrong place.
- Neither, use spreadsheets :: They go stale faster.
- Whichever has more plugins :: Plugins do not fix accuracy.
> Trust in the data is what makes a catalog valuable.

Q: How can you detect stale entries?
+ Automatic checks for missing owners and entries not confirmed for a long time
- Waiting for complaints :: That means someone was already misled.
- Deleting entries randomly :: That loses real data.
- Asking only the platform team :: They do not know every service.
> Automated freshness checks catch problems before an incident.
```

```cards
Developer portal :: A web front door that shows services, docs, templates and status in one place
Software catalog :: The record of services, owners and relationships behind a portal
Entity :: One item in a catalog, such as a Component, API, Resource or Group
Descriptor :: A file next to the code that declares an entity's metadata
Freshness check :: An automatic test that finds missing owners and stale entries
```
