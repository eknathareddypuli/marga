---
title: LLM observability, evaluation and guardrails
minutes: 12
summary: Trace LLM calls, evaluate quality with test sets and graders, add input and output guardrails and watch for drift in cost and quality.
---

A model that is up can still be wrong. Observability for LLM systems must cover quality, safety and cost, not only latency and errors.

## What you will learn

- What to log and trace for each call
- Offline evaluation with test sets
- Online signals and human feedback
- Guardrails: input, output and tools
- Drift: model, data and prompt changes

## Tracing

Record each step as a span: retrieval, prompt, model call and tool calls. Capture model name, token counts, latency, cost and a prompt version. A single trace should show which context was retrieved and what the model returned, so you can see why an answer was wrong.

## Offline evaluation

Build a test set of real questions with expected answers or checks. Score with exact checks where possible, and with a grader model plus periodic human review for open answers. Run the set on every change to prompt, model or retrieval and block releases that regress.

## Online signals

Track thumbs up and down, retries, answer abandonment and escalations to humans. Sample conversations for review. Combine these with cost and latency per request to find the changes that matter.

## Guardrails

Check inputs for prompt injection and sensitive data, and outputs for policy violations, personal data and format errors. Limit what tools a model can call and require confirmation for risky actions. Guardrails reduce risk but are not perfect, so design for the case where one fails.

## Drift

Providers update models, documents change and users ask new things. Pin model versions where possible, keep prompts in version control, rerun the test set on a schedule and alert on shifts in refusal rate, length or cost.

```diagram
title: LLM observability, evaluation and guardrails
node: call | LLM call | 0 | 1 | Traced with metadata. | No trace. | service
node: eval | Test set and graders | 1 | 1 | Block regressions. | Stale tests. | observe
node: guard | Guardrails | 2 | 1 | Filter input and output. | False negatives. | security
node: mon | Dashboards and alerts | 3 | 1 | Quality, cost, latency. | Only latency. | observe
edge: call | eval
edge: call | guard
edge: guard | mon
```

## Incident: A silent change after a model update

> **Incident:** The provider updated a model alias and answers became longer and costlier overnight.

```console
$ curl -s localhost:9090/api/v1/query --data-urlencode 'query=avg(llm_output_tokens)' | head -c 140
{"status":"success","data":{"result":[{"value":[1731700000,"412"]}]}}
$ curl -s localhost:9090/api/v1/query --data-urlencode 'query=avg(llm_output_tokens offset 1d)' | head -c 140
{"status":"success","data":{"result":[{"value":[1731613600,"236"]}]}}
(this is a simulated illustration, not a real incident)
```

The application used a moving alias, so behaviour changed without a deploy. The team pinned an explicit model version, added an alert on average output length and cost per request and scheduled a nightly run of the evaluation set.

## Common mistakes

- Watching only latency and errors
- No test set, relying on demos
- Moving model aliases in production
- Guardrails as the only defence
- Prompts edited in a dashboard with no history

```quiz
Q: What should a trace of an LLM call include?
+ Context, prompt version, model, tokens and cost
- Only the time :: Not enough.
- Only errors :: Not enough.
- Nothing :: Blind.
> See why an answer was wrong.

Q: When do you run the evaluation set?
+ On every change to prompt, model or retrieval
- Never :: Unsafe.
- Once a year :: Too late.
- Only on failure :: Too late.
> Block regressions.

Q: What causes drift?
+ Model updates, document changes and new user questions
- Only the network :: No.
- Only disks :: No.
- Only labels :: No.
> Pin and monitor.

Q: What is true of guardrails?
+ They reduce risk but can fail
- They are perfect :: No.
- They replace tests :: No.
- They remove cost :: No.
> Layer defences.
```

```cards
Evaluation set :: Questions with expected results used to test quality
Guardrail :: A check that limits unsafe inputs or outputs
Prompt injection :: Input that tries to override instructions
Drift :: Gradual change in behaviour or data
```
