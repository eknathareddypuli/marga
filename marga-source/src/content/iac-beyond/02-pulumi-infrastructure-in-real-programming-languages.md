---
title: Pulumi: infrastructure in real programming languages
minutes: 12
summary: Describe infrastructure with Python, TypeScript or Go in Pulumi, understand stacks, outputs and secrets, and know when code beats configuration.
---

Pulumi uses general purpose languages to declare resources. You get loops, functions, types and tests, and you also get more ways to write unreadable infrastructure.

## What you will learn

- The Pulumi model: programs, stacks and state
- Writing resources in Python
- Inputs, outputs and apply
- Secrets and configuration
- When code helps and when HCL is simpler

## Model

A Pulumi program declares resources and the engine compares them with the state of a stack, then creates, updates or deletes what differs. A stack is one instance of the program, such as dev or prod, with its own configuration and state. State can live in the Pulumi service or in your own object storage.

## Resources in code

A resource is an object created from a provider class. Because it is a normal program, you can use loops for many similar resources, functions for shared patterns and types to catch mistakes before a run.

## Inputs and outputs

Some values are known only after a resource exists, so Pulumi wraps them as outputs. Use `apply` to transform an output, and pass outputs directly as inputs of other resources so the engine sees the dependency. Printing an output as a string before it resolves shows a placeholder, not the value.

## Secrets and configuration

Mark values as secrets with `pulumi config set --secret` and the state stores them encrypted. Configuration is per stack, which keeps differences between environments in one place instead of copied files.

## Code or configuration

Code shines for repeated patterns, validation and tests with ordinary test frameworks. It is a poor fit when the team lacks the language skills, or when plain declarative files would be clearer. Keep programs small, avoid network calls in code and review them like application code.

```diagram
title: Pulumi: infrastructure in real programming languages
node: prog | Program | 0 | 1 | Declares resources. | Hidden logic. | external
node: eng | Pulumi engine | 1 | 1 | Diffs against state. | Wrong stack. | process
node: state | Stack state | 2 | 1 | Encrypted secrets. | Lost backend. | store
node: cloud | Cloud API | 3 | 1 | Creates resources. | Permissions. | service
edge: prog | eng
edge: eng | state
edge: eng | cloud
```

## Incident: An output used before it existed

> **Incident:** A script printed a bucket name that never worked in a connection string.

```console
$ pulumi stack output bucketUrl
s3://app-assets-1f3a9
$ pulumi preview --diff | head -4
~ aws:s3/bucket:Bucket: (update)
    [id=app-assets-1f3a9]
(this is a simulated illustration, not a real incident)
```

The program built the URL by joining plain strings with the output object, which produced an unresolved placeholder in the application. Using apply to build the string after the value existed fixed it, and a unit test now checks the final value.

## Common mistakes

- Treating outputs as plain strings
- One huge program for every environment
- Secrets in plain configuration
- Network calls and randomness inside programs
- No preview before an update

```quiz
Q: What is a Pulumi stack?
+ One instance of a program with its own config and state
- A server :: No.
- A provider :: No.
- A cloud region :: No.
> Dev and prod are stacks.

Q: Why are outputs special?
+ Their values are known only after creation
- They are encrypted always :: Not always.
- They are global :: No.
- They are faster :: No.
> Use apply or pass them along.

Q: How do you store a secret?
+ Set it as a secret config value
- In a plain file :: Unsafe.
- In the code :: Unsafe.
- In a tag :: Unsafe.
> It is encrypted in state.

Q: When is code a poor fit?
+ When plain declarative files are clearer for the team
- When you need loops :: Code is good for this.
- When you need tests :: Code is good for this.
- When you need types :: Code is good for this.
> Choose the simpler tool.
```

```cards
Stack :: An instance of a Pulumi program
Output :: A value known after a resource is created
apply :: A function to transform an output value
Preview :: A dry run showing planned changes
```
