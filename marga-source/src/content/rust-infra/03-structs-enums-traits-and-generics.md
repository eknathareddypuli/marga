---
title: Structs, enums, traits and generics
minutes: 12
summary: Model data with structs and enums, share behaviour with traits and write generic code, so infrastructure tools express states clearly and safely.
---

Enums and traits are where Rust shines for infrastructure code. A state machine written as an enum cannot be in an impossible state, and traits let you swap implementations in tests.

## What you will learn

- Structs and methods
- Enums that carry data and match
- Traits as shared behaviour
- Generics and trait bounds
- Derive macros for common behaviour

## Structs

A struct groups named fields. Methods are written in an `impl` block, and they take `self`, `&self` or `&mut self` depending on whether they consume, read or change the value. Keep fields private and expose methods when you need to keep invariants.

## Enums

Each variant of an enum may carry data. A deployment state such as `Pending`, `Running { pid: u32 }` or `Failed(String)` makes it impossible to read a pid for a failed deployment. A `match` must handle every variant, so adding a variant forces you to update every place that needs it.

## Traits

A trait defines methods a type can implement, like an interface. A `Storage` trait with `put` and `get` can have a real implementation for S3 and an in-memory one for tests. Functions can take `&dyn Storage` for runtime choice or a generic parameter for compile time choice.

## Generics and bounds

Generic functions work for many types: `fn largest<T: PartialOrd>(items: &[T])`. The bound says what the type must support. Generics are resolved at compile time and cost nothing at run time, but they can make error messages long. Start concrete and generalise when you have two uses.

## Derive

`#[derive(Debug, Clone, PartialEq)]` generates common implementations. With serde, `#[derive(Serialize, Deserialize)]` turns a struct into JSON or YAML and back. This replaces a lot of parsing code and checks types at the boundary.

```diagram
title: Structs, enums, traits and generics
node: data | Structs and enums | 0 | 1 | Model state. | Impossible states. | service
node: trait | Traits | 1 | 1 | Shared behaviour. | Over abstraction. | process
node: gen | Generics | 2 | 1 | Reusable code. | Long errors. | process
node: test | Test doubles | 3 | 1 | Swap implementations. | No trait. | observe
edge: data | trait
edge: trait | gen
edge: trait | test
```

## Incident: A state that should not exist

> **Incident:** A deploy tool reported a running service with no process id, because states were booleans and strings.

```console
$ grep -n "is_running" src/*.rs | head -3
src/deploy.rs:14:    pub is_running: bool,
src/deploy.rs:15:    pub pid: Option<u32>,
src/deploy.rs:41:    if d.is_running { println!("pid {}", d.pid.unwrap()); }
(this is a simulated illustration, not a real incident)
```

The struct allowed is_running true with pid None, and unwrap panicked. Replacing both fields with an enum whose Running variant carries the pid made that state impossible, and the compiler pointed to every place that needed an update.

## Common mistakes

- Booleans and strings instead of enums
- Traits created before a second implementation exists
- Public fields that break invariants
- Deriving nothing and writing boilerplate
- Generic code that nobody can read

```quiz
Q: What can an enum variant carry?
+ Data
- Nothing only :: Variants may carry data.
- Only numbers :: Any type.
- Only strings :: Any type.
> Model states precisely.

Q: What does match require?
+ Handling every variant
- Only the first :: Must be exhaustive.
- A default always :: Not required.
- No cases :: Must be exhaustive.
> The compiler checks.

Q: What is a trait like?
+ An interface of shared behaviour
- A thread :: No.
- A file :: No.
- A loop :: No.
> Swap implementations.

Q: What does derive Serialize do?
+ Generates code to convert the type to formats such as JSON
- Encrypts it :: No.
- Deletes it :: No.
- Locks it :: No.
> With serde. Review the matching section of this lesson if it is unclear.
```

```cards
Enum :: A type with several named variants
Trait :: A set of methods a type can implement
Generic :: Code that works for many types
serde :: A library for serialising and deserialising data
```
