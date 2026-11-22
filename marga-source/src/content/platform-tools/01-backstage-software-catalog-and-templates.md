---
title: Backstage: software catalog and templates
minutes: 13
summary: Use Backstage as a developer portal: model services in the software catalog, keep metadata accurate, scaffold new services from templates and plan the plugins you really need.
---

A portal is only as good as its data. Backstage gives a place to describe who owns what and a way to start new services the right way, but it needs care to stay accurate.

## What you will learn

- Entities: components, systems, APIs and owners
- catalog-info.yaml files and discovery
- Software templates and scaffolding
- Plugins, TechDocs and search
- Running Backstage as a product

## Entities

The catalog models components such as services and libraries, systems that group them, APIs they provide or consume, resources such as databases and the owners of each. Relationships give answers to common questions: who owns this, what depends on it, which API does it expose.

## Metadata files

Each repository holds a `catalog-info.yaml` that describes the component. The catalog discovers these files from the source control provider and refreshes them. Because the file lives with the code, owners can update it in the same pull request, and a validation check can fail the build when it is missing or invalid.

## Templates

A software template asks a few questions, then creates a repository, a pipeline, a deployment configuration and a catalog entry in one run. Templates encode the golden path. Keep them small, version them and track which services were created from which version so they can be updated.

## Plugins and docs

Plugins add views for CI results, Kubernetes status, cost or on call. TechDocs renders documentation from markdown in the repository. Add plugins when a real team asks for them, because each one is code to maintain and upgrade.

## Running as a product

Backstage is a framework you build and run, not a product you install. Assign a team, track adoption and catalog completeness, and fix stale ownership first. A portal full of unowned and outdated entries loses trust quickly.

```diagram
title: Backstage: software catalog and templates
node: repo | Repository | 0 | 1 | catalog-info.yaml. | Missing file. | external
node: cat | Software catalog | 1 | 1 | Entities and owners. | Stale. | store
node: tpl | Templates | 2 | 1 | Golden paths. | Old versions. | process
node: ui | Developer portal | 3 | 1 | One place. | Low trust. | service
edge: repo | cat
edge: cat | tpl
edge: tpl | ui
```

## Incident: A catalog full of unowned services

> **Incident:** During an outage nobody could find who owned the failing service in the portal.

```console
$ yq '.spec.owner' catalog-info.yaml
group:default/team-that-left
$ echo "owner group exists: no"
(this is a simulated illustration, not a real incident)
```

Teams had been reorganised and ownership in many files pointed to groups that no longer existed, so the page for the failing service listed nobody. The platform team added a check that every entity owner resolves to a real group, a weekly report of orphaned services and a rule that reorganisations update ownership files.

## Common mistakes

- Entities with no valid owner
- Metadata kept outside the repository
- Too many plugins too early
- Templates that are never updated
- No adoption or completeness metrics

```quiz
Q: What does catalog-info.yaml hold?
+ Metadata that describes a component and its owner
- Application code :: No.
- Passwords :: No.
- Database rows :: No.
> It lives with the code.

Q: What does a software template do?
+ Creates a repository, pipeline and catalog entry from a few answers
- Deletes services :: No.
- Monitors CPU :: No.
- Stores logs :: No.
> It encodes the golden path.

Q: How do you keep the catalog trusted?
+ Validate owners and report stale entries
- Add more plugins :: Does not help.
- Hide it :: No.
- Ignore it :: No.
> Accuracy first.

Q: Is Backstage a product to install?
+ No, it is a framework that a team builds and runs
- Yes, one click :: Not true.
- Only a theme :: No.
- A database :: No.
> Plan to run it as a product.
```

```cards
Backstage :: An open source developer portal framework
Entity :: An item in the software catalog
Software template :: A scaffold that creates a new service
TechDocs :: Docs rendered from markdown in repositories
```
