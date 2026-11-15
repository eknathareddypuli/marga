---
title: Scaffolding, templates and self-service workflows
minutes: 14
summary: Turn the golden path into something a developer can start in minutes: parameterised templates that create repositories, pipelines and catalog entries, with validation, approvals and an audit trail.
---

A path on paper is not much help. People follow the path that is one click away. Scaffolding is the mechanism that turns a request such as "new Go service called billing, owned by team payments" into a repository, a working pipeline, a catalog entry and a first deployment, without anyone filing a ticket.

## What you will learn

- What a good template asks for and generates
- How to validate input and apply policy before creating anything
- How self-service differs from "self-serve with approval"
- How to keep generated repositories updatable

## Ask few questions

A template form should ask only what it cannot infer: a name, an owning team, a short description, maybe the language and a tier. Fewer fields mean faster use and fewer mistakes. Derive everything else: repository name from service name, namespace from team, alert routing from owner. Offer safe defaults and hide advanced options behind an extra step.

## Validate before you create

Check input early and give clear errors. Names should follow the naming convention and be unique. The team must exist. The tier must be one of the allowed values. A template that fails halfway, leaving a half-created repository, is worse than one that refuses at the start.

```python
import re

TEAMS = {"payments", "search", "platform"}
TIERS = {"critical", "standard", "experimental"}

def validate(req):
    errors = []
    if not re.fullmatch(r"[a-z][a-z0-9-]{2,29}", req.get("name", "")):
        errors.append("name must be 3-30 lowercase letters, digits or hyphens, starting with a letter")
    if req.get("team") not in TEAMS:
        errors.append("team is not known")
    if req.get("tier") not in TIERS:
        errors.append("tier must be one of " + ", ".join(sorted(TIERS)))
    return errors

print(validate({"name": "billing", "team": "payments", "tier": "standard"}))
print(validate({"name": "Billing!", "team": "ghost", "tier": "gold"}))
```

## What a template generates

A template can create several things in one flow: a repository from a skeleton, with the service name substituted; a pipeline definition; deployment manifests; a catalog descriptor; a documentation stub; monitoring dashboards and alert rules; and access for the owning team. Order the steps so that if one fails, earlier work can be undone or the flow can be resumed. Make each step idempotent, so running it twice does not create duplicates.

## Self-service and approval

Self-service does not mean no control. Divide requests by risk. Low-risk, reversible requests such as a development namespace or a small database should be instant. Higher-risk requests, such as production access or large resources, can require approval, but the approval should be a step in the workflow with context shown to the approver, not a manual hand-off by email. Record who asked, who approved and what was created.

## Templates must stay updatable

Generating a repository once and walking away leaves hundreds of copies that drift. Plan for updates:

- Keep shared pipeline logic in a versioned, reusable component that repositories reference instead of copy
- Record which template version created each repository
- Offer an automatic pull request that applies template changes to existing repositories
- Test the template itself in CI by generating a sample and building it

## Test the template

A template is code, so test it. Generate a service from the template in CI, build it, run its tests and deploy it to a scratch environment. A broken template breaks every new service, which makes it one of the most valuable things to test.

## Keep the experience consistent

Whether a developer uses the portal form, a command line or an API, the same workflow should run. Do not build separate logic for each front end. Define the workflow once and give it several entrances.

## An audit trail from the start

Every run records its inputs, the identity of the requester, the policy decisions and the resources created. When something goes wrong, you can answer "what created this, and who asked for it?" in a minute.

```diagram
title: A self-service workflow
node: form | Request form | 0 | 1 | Name, team, language and tier. | Too many fields. | service
node: check | Validation and policy | 1 | 1 | Input checks and rules before anything is created. | Checks that run after creation. | security
node: appr | Approval if needed | 2 | 0 | Context-rich review for higher-risk requests. | Approval by email with no context. | process
node: make | Create resources | 3 | 1 | Repository, pipeline, catalog entry and access. | Steps that cannot be repeated safely. | process
node: log | Audit record | 4 | 1 | Inputs, approver and results. | Missing records. | store
node: dev | Developer | 2 | 2 | Gets a working service quickly. | Waits on hidden manual steps. | external
edge: form | check
edge: check | appr
edge: check | make
edge: appr | make
edge: make | log
edge: make | dev
```

## Incident: Half a service

> **Incident:** A template failed after creating the repository but before registering the owner. For two weeks a production-bound service existed with no catalog entry and no owner.

```console
$ platformctl workflow show run-7714
step 1 create-repo     ok
step 2 add-pipeline    ok
step 3 register-owner  error: team directory timeout
step 4 first-deploy    skipped
(this is a simulated illustration, not a real incident)
```

The workflow stopped on step three and nobody was told. The platform team made each step idempotent, added automatic retry, and made failures notify the requester and the platform channel. They also added a nightly check that found any repository without a catalog entry.

## Common mistakes

- Asking developers for fields the platform can derive
- Validating after creating resources
- Treating approval as an email, not a workflow step with context
- Copying pipelines into every repository instead of referencing shared ones
- Never testing the template itself

```quiz
Q: Why should a template validate input before creating anything?
+ A failure halfway leaves partial resources that are hard to clean up
- Validation makes forms longer :: Good validation keeps them short.
- Resources are free to create :: They have a cost and clutter.
- Users prefer errors later :: They prefer early, clear errors.
> Early checks avoid half-created services and wasted effort.

Q: Which requests should be instant self-service?
+ Low-risk, reversible ones such as a small development environment
- Every production change :: Those usually need review.
- Only those from the platform team :: That is not self-service.
- None, all need tickets :: That defeats the purpose.
> Risk-based tiers keep speed where it is safe.

Q: How do you stop generated repositories drifting from the template?
+ Reference shared versioned pipeline components and offer automatic update pull requests
- Copy everything into each repository once :: That causes drift.
- Forbid any change :: Teams need to customise.
- Delete old repositories :: That removes real work.
> Updatable templates avoid hundreds of divergent copies.

Q: Why should each workflow step be idempotent?
+ So a retry does not create duplicates or fail
- To make steps slower :: It does not.
- To hide errors :: It does not.
- To avoid logging :: Logging is still needed.
> Safe repetition makes retries and resumes reliable.
```

```cards
Scaffolding :: Generating a new project with the right structure and tooling from a template
Self-service :: Letting users get what they need through an automated workflow without a ticket
Idempotent step :: A step that can run repeatedly with the same end result
Template version :: A numbered release of a template recorded in each repository it creates
Audit record :: A log of who asked for what, who approved it and what was created
```
