---
title: What platform engineering is, and how it differs from DevOps and SRE
minutes: 12
summary: Platform engineering builds the shared tools and paved paths that other engineering teams use to ship and run software, treating those tools as a product with customers rather than a ticket queue.
---

Every product team needs the same things to ship software: a repository, a pipeline, somewhere to run, secrets, logs, alerts and a way to ask for a database. If each team builds these alone, the company pays for the same work many times and gets many slightly different, slightly broken results. Platform engineering is the answer to that waste: one team builds the common parts once, and makes them easy to use.

## What you will learn

- What a platform is and what it is not
- How platform engineering relates to DevOps and SRE
- The problems it solves and the ones it creates
- The signs that a company is ready for a platform team

## A platform, in plain words

The CNCF platforms white paper describes a platform as an integrated collection of capabilities, presented according to the needs of its users. The important words are "integrated" and "users". A pile of tools is not a platform. A platform is a set of tools, services and documentation that fit together, with a clear front door, built for internal customers: the developers who build and run the company's products.

A platform is not a rebrand of the operations team, a single product such as Kubernetes, or a mandate that everyone must use one stack. If developers must file tickets and wait, you have a service desk. If they can get what they need in minutes without knowing how it works underneath, you have a platform.

## How it relates to DevOps and SRE

DevOps is a culture and a set of practices: shared ownership of delivery and operation, automation, fast feedback. SRE applies software engineering to reliability, with service level objectives, error budgets and a focus on toil. Platform engineering is a way of organising the work so that these practices are easy to follow at scale.

| | Main question | Typical output |
|---|---|---|
| DevOps | How do we build and run software together? | Shared practices, pipelines, ownership |
| SRE | How reliable should this service be, and how do we keep it so? | SLOs, error budgets, incident process |
| Platform engineering | How do we make the right way the easy way for every team? | Self-service tools, golden paths, a portal |

The three overlap. A platform team often includes people with SRE skills, and a good platform bakes in SLO dashboards and safe delivery. The difference is the customer: an SRE team is usually attached to services, while a platform team serves other engineers.

## The problem it solves: cognitive load

When "you build it, you run it" meets a modern cloud stack, a product developer is asked to know Kubernetes, Terraform, IAM, networking, observability, security scanning and the pipeline, on top of their own domain. The mental effort is called cognitive load. Teams slow down, copy-paste configuration they do not understand and make unsafe choices. A platform removes the undifferentiated parts of that load so developers can spend attention on the product.

## The problems it creates

Platforms have failure modes of their own. A team that builds what it finds interesting, not what users need, ships a platform nobody adopts. A platform that is mandatory but poor becomes a bottleneck. A platform that hides everything leaves developers helpless during an incident. Later lessons deal with each: treating the platform as a product, golden paths that can be left, and measurable adoption.

## Signs you are ready

A platform team makes sense when several product teams repeat the same setup work, new engineers need weeks to deploy for the first time, security and compliance checks differ from team to team, or the operations team spends most of its time on repetitive requests. In a company with two teams and one service, a shared repository of templates is enough, and a dedicated platform team would be a cost without a customer.

## A small thinking tool

Before building anything, write down the customer, the job and the current cost. The snippet below turns a few observations into a rough yearly estimate of wasted effort, which is the kind of number a platform proposal needs.

```python
teams = 12
setups_per_team_per_year = 3
hours_per_setup = 16
hourly_cost = 70

hours = teams * setups_per_team_per_year * hours_per_setup
print("hours repeated each year:", hours)
print("rough cost:", hours * hourly_cost)
```

The numbers are invented; use your own. The point is to size the repeated work before proposing a team to remove it.

```diagram
title: Where a platform sits
node: dev | Product teams | 0 | 1 | Build and run their own services. | Overloaded with infrastructure detail. | external
node: front | Front door | 1 | 1 | Portal, CLI and templates. | Unclear or hidden entry points. | service
node: plat | Platform capabilities | 2 | 1 | Delivery, runtime, data, secrets and observability. | A pile of tools that do not fit together. | process
node: infra | Cloud and clusters | 3 | 1 | The infrastructure underneath. | Details leaking up to users. | store
node: team | Platform team | 2 | 3 | Builds, supports and measures the platform. | Behaves like a ticket queue. | observe
edge: dev | front | self-service
edge: front | plat
edge: plat | infra
edge: team | plat | owns
edge: dev | team | feedback
```

## Incident: The platform nobody used

> **Incident:** A company built an internal platform over a year. Six months after launch, only two of fourteen teams used it, and the rest kept their own pipelines.

```console
$ platformctl adoption --by team
team          uses-platform   last-deploy-via
payments      no              own-pipeline
search        no              own-pipeline
checkout      yes             platform
identity      no              own-pipeline
(this is a simulated illustration, not a real incident)
```

The team had designed the platform around its own preferences and had never interviewed the product teams. Most teams found the first deploy slower than their current pipeline. The platform team then spent a month with three product teams, found that the slowest step was getting a database, and rebuilt the front door around that. Adoption rose because the platform now removed a pain people already had.

## Common mistakes

- Renaming the operations team and changing nothing else
- Building tools because they are interesting, not because users need them
- Making the platform mandatory before it is good
- Hiding so much that developers cannot debug at 3am
- Starting a platform team when there is no repeated work to remove

```quiz
Q: What is the main customer of a platform team?
+ Internal engineering teams that build and run products
- The finance department :: They may care about cost, but they are not the daily users.
- External paying customers :: They use the products, not the platform.
- The security team only :: Security is a stakeholder, not the main user.
> A platform serves the developers who build and run the company's software.

Q: Which description best separates platform engineering from SRE?
+ Platform engineering builds self-service capabilities for other teams, while SRE focuses on service reliability
- They are the same job with different names :: They overlap but have different customers and outputs.
- Platform engineering only manages hardware :: It covers software delivery and runtime too.
- SRE only writes dashboards :: SRE covers SLOs, error budgets and incident process.
> The difference is the customer and the output, even though the skills overlap.

Q: What problem does a platform mainly reduce?
+ Cognitive load on product developers
- The number of products :: A platform does not change what the company sells.
- The need for any testing :: Testing remains necessary.
- The number of cloud regions :: Unrelated.
> Removing undifferentiated infrastructure work frees attention for the product.

Q: Which sign suggests a company is ready for a platform team?
+ Many teams repeat the same setup work and onboarding takes weeks
- One team with one service :: There is no repeated work to remove.
- No developers yet :: There are no users.
- A wish to use a particular tool :: A tool is not a customer need.
> Repeated work and slow onboarding are the signals worth acting on.
```

```cards
Platform :: An integrated set of capabilities presented to internal users through a clear front door
Platform engineering :: Building shared, self-service tools and paths for other engineering teams
Cognitive load :: The mental effort a developer spends on things other than their own product
Undifferentiated work :: Setup every team repeats that gives the company no advantage
Front door :: The portal, command line or template where users start
```
