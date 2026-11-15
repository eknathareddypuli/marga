---
title: Testing with pytest and mocking infrastructure
minutes: 13
summary: Test operations code with pytest, fixtures, parametrisation and fakes for APIs and clouds, so tests are fast and never touch production.
---

Operations code changes real systems, so it deserves tests more than most. Good tests run in seconds, use fakes and make it safe to change the tool.

## What you will learn

- pytest basics and fixtures
- Parametrised tests for edge cases
- Fakes and mocks for external systems
- Testing time, files and the environment
- What to test and what not to

## pytest basics

A test is a function whose name starts with `test_` and uses plain `assert`. pytest shows a clear diff when it fails. A fixture is a function that prepares something a test needs, such as a temporary directory, and is passed in by name.

## Parametrisation

`@pytest.mark.parametrize` runs one test with many inputs. It suits parsers, validators and size or duration conversions, where edge cases such as empty values, units and negative numbers matter. Name cases so failures read well.

## Fakes and mocks

Separate logic from I/O. Pass a client into functions so a test can give a fake one that returns canned responses. `unittest.mock` and the `monkeypatch` fixture replace calls when needed. Over mocking tests the mock instead of the code, so prefer simple fakes with real behaviour.

## Time, files and environment

Use `tmp_path` for files, `monkeypatch.setenv` for environment variables and pass the current time in as an argument or use a clock function you can replace. Tests that depend on the real clock or on a developer machine become flaky.

## What to test

Test decisions: which resources are selected for deletion, how retries behave, how errors are reported. Add a few integration tests against a disposable environment. Make sure no test can reach production, for example by clearing credentials in the test environment.

```diagram
title: Testing with pytest and mocking infrastructure
node: code | Logic functions | 0 | 1 | Pure where possible. | Mixed with I/O. | process
node: fake | Fake client | 1 | 1 | Canned responses. | Too many mocks. | process
node: test | pytest | 2 | 1 | Fast tests. | Slow or flaky. | observe
node: ci | CI gate | 3 | 1 | Runs on each change. | Skipped. | service
edge: code | fake
edge: fake | test
edge: test | ci
```

## Incident: A cleanup that deleted the wrong resources

> **Incident:** A change to a selection rule removed resources that were still in use, and no test covered it.

```console
$ pytest -q
.....
5 passed
$ python -c "print('no test covers resources tagged keep=true')"
(this is a simulated illustration, not a real incident)
```

The rule for tagged resources had no test, so the change passed. The team wrote parametrised cases for tags, ages and missing fields, ran them with a fake client in CI and required them to pass before any change to the selection logic could be merged.

## Common mistakes

- Logic mixed into I/O code
- Mocks that copy the implementation
- Tests that read the real clock
- Tests that can reach production
- No tests for deletion logic

```quiz
Q: What is a fixture?
+ Setup that a test receives by name
- A bug :: No.
- A server :: No.
- A log :: No.
> Reusable preparation.

Q: What does parametrize do?
+ Runs one test with many inputs
- Skips tests :: No.
- Deletes tests :: No.
- Speeds CPU :: No.
> Edge cases. Review the matching section of this lesson if it is unclear.

Q: How do you make code testable?
+ Pass dependencies in and separate logic from I/O
- Use globals :: Harder.
- Hide errors :: No.
- Avoid functions :: No.
> Fakes become easy.

Q: What must tests never do?
+ Reach production systems
- Use tmp files :: Fine.
- Use fakes :: Fine.
- Run in CI :: Good.
> Clear credentials in tests.
```

```cards
pytest :: A Python test framework
Fixture :: Reusable test setup
Mock :: A stand in object that records calls
Parametrize :: Running a test over many inputs
```
