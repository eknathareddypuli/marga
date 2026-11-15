---
title: Capstone: design and ship a golden path
minutes: 20
summary: Bring the whole course together: define a golden path for a web service, build a scaffolder that validates a request and produces a catalog entry and policy-checked manifest, and plan its rollout and measures.
---

This lesson is a design and build exercise. You will specify one golden path end to end, write a small scaffolder that validates a request and generates the files, check the result against policy, and plan how you would roll the path out and know it works. The code is a toy, but each part is a miniature of something a real platform does.

## What you will learn

- How to turn a path specification into automation
- How to generate a catalog entry and a manifest from one request
- How to check the output against policy before it is created
- How to plan adoption and measures for the result

## Step 1: Write the path spec

Write one page that answers these questions for the path "web service":

- **Who is it for?** Product teams building stateless HTTP services
- **What do they get?** Repository, pipeline, deployment manifest, catalog entry, dashboard and alerts
- **What is fixed?** Base image, security checks, labels, resource limits
- **What can they change?** Name, team, tier, replicas within a range, extra environment variables
- **What does support look like on and off the path?**
- **What does success look like?** Time to first deploy under an hour and 90 percent of new services created through the path within two quarters

## Step 2: Build the scaffolder

The script below validates a request, produces a catalog entry and a deployment manifest as Python structures, and runs the policy checks from earlier lessons. Real systems would write files and call APIs. Here you can read the logic in a few lines.

```python
import json
import re

TEAMS = {"payments", "search", "platform"}
TIERS = {"critical": (3, 10), "standard": (2, 6), "experimental": (1, 2)}

def validate(req):
    errors = []
    if not re.fullmatch(r"[a-z][a-z0-9-]{2,29}", req.get("name", "")):
        errors.append("name must be 3-30 lowercase letters, digits or hyphens")
    if req.get("team") not in TEAMS:
        errors.append("unknown team")
    tier = req.get("tier")
    if tier not in TIERS:
        errors.append("tier must be one of " + ", ".join(sorted(TIERS)))
    else:
        lo, hi = TIERS[tier]
        if not lo <= req.get("replicas", lo) <= hi:
            errors.append(f"replicas for {tier} must be {lo}-{hi}")
    return errors

def render(req):
    catalog = {
        "kind": "Component", "name": req["name"], "owner": "team-" + req["team"],
        "lifecycle": "production" if req["tier"] != "experimental" else "experimental",
        "tier": req["tier"], "links": ["dashboard/" + req["name"], "runbook/" + req["name"]],
    }
    deploy = {
        "name": req["name"], "replicas": req.get("replicas", TIERS[req["tier"]][0]),
        "labels": {"owner": "team-" + req["team"], "tier": req["tier"]},
        "containers": [{"name": "app", "image": "registry.example/" + req["name"] + ":latest",
                         "resources": {"limits": {"memory": "512Mi", "cpu": "500m"}}, "run_as_root": False}],
    }
    return catalog, deploy

def policy(deploy):
    out = []
    for c in deploy["containers"]:
        if c["image"].endswith(":latest"):
            out.append("image tag latest is not allowed: pin a version")
        if "limits" not in c["resources"]:
            out.append("missing resource limits")
        if c["run_as_root"]:
            out.append("must not run as root")
    if "owner" not in deploy["labels"]:
        out.append("missing owner label")
    return out

req = {"name": "billing", "team": "payments", "tier": "standard", "replicas": 3}
errs = validate(req)
if errs:
    print("REJECTED:", errs)
else:
    catalog, deploy = render(req)
    problems = policy(deploy)
    print(json.dumps({"catalog": catalog["name"], "owner": catalog["owner"], "policy_problems": problems}, indent=2))
```

Run it. The generated manifest uses a `latest` tag, so the policy check reports a problem. This is deliberate: the template has a bug, and the policy check is what finds it before a service is created. Fix the template to use a pinned version, rerun and confirm the problem list is empty.

## Step 3: Extend it

Try these extensions, one at a time:

1. Reject a request whose replica count falls outside the tier's range, and test it.
2. Add a check that rejects names already in an existing-services list.
3. Add a `deprecation` field to the catalog entry that the path can set when a path version is retired.
4. Add a function that takes a list of existing services and reports which are missing owner, dashboard or runbook entries.
5. Write three tests: a good request, a bad name and an out-of-range replica count.

## Step 4: Plan the rollout

Write down a short plan:

- **Pilot:** which two teams, with what success criteria
- **Waves:** how you will group the remaining services
- **Migration kit:** what you will offer so moving is cheap
- **Measures:** time to first deploy, share of new services on the path, change failure rate and a developer satisfaction question
- **Support:** who answers questions during the first month
- **Deprecation:** what old route you will retire and by when

## What to check

A good capstone has a one-page spec, a scaffolder that refuses bad input with clear messages, a policy check that catches an unsafe default, tests, and a rollout plan with dates and measures. Ask a colleague to try your path as a new user and time how long it takes them.

```diagram
title: The capstone end to end
node: spec | Path specification | 0 | 1 | Who, what, fixed and flexible, success. | A spec nobody reads. | store
node: req | Request | 1 | 0 | Name, team, tier and replicas. | Too many questions. | service
node: val | Validate | 2 | 0 | Naming, team, tier and range checks. | Checks after creation. | security
node: gen | Generate | 3 | 1 | Catalog entry and manifest. | Template with unsafe defaults. | process
node: pol | Policy check | 4 | 1 | Image tag, limits, root and owner. | Policy not run in the template. | security
node: roll | Rollout plan | 2 | 2 | Pilot, waves, kit and measures. | No dates or owners. | observe
edge: spec | req
edge: req | val
edge: val | gen
edge: gen | pol
edge: spec | roll
edge: pol | roll | feedback
```

## Incident: The template that shipped latest

> **Incident:** A golden path template used an unpinned image tag. For a month, new services deployed whatever the newest image happened to be, and one release broke three services at once.

```console
$ platformctl lint template web-service
FAIL image tag is latest in deploy/manifest.yaml
FAIL no policy check in template pipeline
(this is a simulated illustration, not a real incident)
```

The template had never been tested in CI, and its pipeline did not run the same policy as the cluster. The team added a CI job that generated a sample service and ran the full policy check, pinned the image tag in the template, and added an automatic pull request to update existing services.

## Common mistakes

- Writing the template before the spec
- Skipping tests of the template itself
- Running policy only in the cluster, not at creation time
- Giving no plan for existing services
- Measuring only how many services use the template, not whether they are better off

```quiz
Q: Why write the path specification before the code?
+ It states who the path is for, what is fixed and what success looks like
- Code needs no design :: Design guides what to build.
- Specs make code run faster :: Not the reason.
- Specs are required by Python :: They are not.
> A spec keeps the automation aimed at a real need.

Q: What should the scaffolder do with an invalid request?
+ Reject it early with clear messages and create nothing
- Create what it can and report later :: That leaves partial resources.
- Silently fix it :: Users will not learn.
- Crash :: Not helpful.
> Early, clear rejection avoids half-created services.

Q: Why run a policy check at generation time as well as in the cluster?
+ Developers see problems in their own change, before deployment
- The cluster cannot check policy :: It can.
- It replaces the cluster check :: Both layers are useful.
- It makes templates slower to read :: Unrelated.
> Earlier feedback is cheaper and teaches the rule.

Q: How do you know the golden path works?
+ Time to first deploy, share of new services on it, stability measures and developer feedback
- The template has many files :: Size is not value.
- A mandate exists :: Compliance is not proof.
- The platform team likes it :: Users decide.
> Evidence from users and delivery measures show real benefit.
```

```cards
Capstone :: A project that combines the skills of a course
Path specification :: A short document stating the users, contents, limits and success measures of a path
Scaffolder :: A tool that creates a new project from a template and a request
Template test :: A CI job that generates a sample project and checks that it builds and passes policy
Rollout plan :: A schedule of pilot, waves, support and measures for adopting a path
```
