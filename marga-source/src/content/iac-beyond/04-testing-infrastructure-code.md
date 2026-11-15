---
title: Testing infrastructure code
minutes: 12
summary: Test infrastructure with formatting, validation, static checks, native tests and short lived real deployments, matched to the cost and risk of each layer.
---

Infrastructure changes are expensive to get wrong, yet often untested. A layered approach catches simple mistakes in seconds and reserves slow real deployments for what only they can prove.

## What you will learn

- The testing pyramid for infrastructure
- Format, validate and lint
- Static security checks and policy
- Native tests and plan assertions
- Integration tests with real resources

## The pyramid

Cheap fast checks run on every commit, medium checks run on every pull request and expensive tests run on a schedule or before a release. Spend most effort at the cheap end and add expensive tests for modules that many teams use.

## Format, validate, lint

Use `fmt -check`, `validate` and a linter such as tflint to catch syntax errors, unused variables and invalid instance types. They need no credentials and finish in seconds.

## Static security checks

Scan plans or code with tools such as Checkov, Trivy or a policy engine to find open security groups, unencrypted storage and public buckets before anything is created. Treat findings as review comments with clear fixes.

## Native tests

Terraform and OpenTofu support test files with run blocks and assertions. A test can use a plan only to check expected values, or apply into a temporary environment and destroy afterward. Test module inputs and outputs, and the validation rules you wrote.

## Integration tests

Tools such as Terratest deploy real resources, check them and destroy them. They give strong confidence but take minutes and cost money. Run them for shared modules, use a separate account with budget limits and make sure cleanup runs even when a test fails.

```diagram
title: Testing infrastructure code
node: fast | Format and validate | 0 | 1 | Seconds. | Skipped locally. | process
node: sec | Static checks | 1 | 1 | Security rules. | Ignored findings. | security
node: nat | Plan and native tests | 2 | 1 | Assertions. | Weak assertions. | process
node: int | Real deployment tests | 3 | 1 | Real resources. | Orphaned resources. | service
edge: fast | sec
edge: sec | nat
edge: nat | int
```

## Incident: A test environment left running for a month

> **Incident:** An integration test failed midway and left a database and a load balancer running.

```console
$ aws resourcegroupstaggingapi get-resources --tag-filters Key=env,Values=test --query 'ResourceTagMappingList[].ResourceARN' --output text | wc -w
14
$ aws ce get-cost-and-usage --help | head -1
GET-COST-AND-USAGE()
(this is a simulated illustration, not a real incident)
```

The test destroyed resources only on success. Cleanup now runs in a final step that always executes, tests tag everything with an owner and expiry, and a nightly job deletes anything past its expiry in the test account.

## Common mistakes

- Running only manual plans
- Integration tests with no cleanup guarantee
- Tests that assert nothing
- Findings from scanners ignored for months
- Testing in the production account

```quiz
Q: Which checks need no credentials?
+ Format, validate and lint
- Integration tests :: They deploy.
- Applies :: They deploy.
- Drift detection :: Needs access.
> Run them everywhere.

Q: What do native tests assert?
+ Expected values in a plan or created resources
- Prices :: No.
- Colours :: No.
- Names of users :: No.
> They check behaviour.

Q: What must integration tests do?
+ Always clean up, even on failure
- Run in production :: Unsafe.
- Skip tags :: Orphans resources.
- Run forever :: Costly.
> Use tags and expiry.

Q: What should static security checks find?
+ Open ports, unencrypted storage and public buckets before creation
- Typos in comments :: Not the aim.
- Slow queries :: Not the aim.
- Network speed :: Not the aim.
> Shift security left.
```

```cards
tflint :: A linter for Terraform code
Checkov :: A static analysis tool for infrastructure code
Terratest :: A library for tests that deploy real resources
Assertion :: A check that a value equals what you expect
```
