---
title: Communicating technical decisions and design reviews
minutes: 12
summary: Write short decision records, run effective design reviews and explain trade-offs to technical and non technical readers.
---

A decision nobody can find or understand will be remade every year. Clear short writing and well run reviews save more time than any tool.

## What you will learn

- The decision record: context, options, decision, consequences
- Writing a design document that gets read
- Running a design review
- Explaining to non technical stakeholders
- Disagreeing and committing

## Decision records

An architecture decision record is one page: the context and constraints, the options considered, the decision, and the consequences including costs. Store it next to the code. When a new person asks why, you can answer with a link.

## Design documents

Start with the problem and goals, then non goals, then the proposal, alternatives and risks. Put a summary first, because many readers stop after a paragraph. Include a diagram and the rollout and rollback plan. Ask for specific feedback, such as risks you may have missed.

## Running a review

Send the document in advance and ask people to comment in writing. Use the meeting to resolve open questions, not to read the document aloud. Separate blocking concerns from preferences, record decisions and name an owner for each action.

## Non technical readers

Lead with the business effect: cost, risk, time and customer impact. Use one analogy at most, give a range with the assumption behind it and state what you need from them, such as approval or budget.

## Disagree and commit

When the decision is made, support it even if you argued against it. Write down your concern and the signal that would show the decision was wrong, so the team can revisit it with evidence instead of feelings.

```diagram
title: Communicating technical decisions and design reviews
node: ctx | Context and goals | 0 | 1 | Problem and limits. | Solution first. | external
node: opt | Options | 1 | 1 | Real alternatives. | Straw men. | process
node: dec | Decision record | 2 | 1 | Chosen path and costs. | Not stored. | store
node: rev | Review | 3 | 1 | Written feedback. | Meeting only. | process
edge: ctx | opt
edge: opt | dec
edge: dec | rev
```

## Incident: A decision made three times

> **Incident:** Two years after a database choice, a new team proposed the same change and the debate restarted.

```console
$ git log --oneline --diff-filter=A -- docs/adr | wc -l
0
$ grep -ril "why we chose" docs | wc -l
0
(this is a simulated illustration, not a real incident)
```

No decision record existed, so the context was lost when the authors moved on. The team introduced a short record template, wrote the missing record from memory and linked it from the repository README so the next debate started from facts.

## Common mistakes

- Starting with the solution and no problem statement
- Straw man alternatives
- Reviews that read the document aloud
- Technical detail for an executive reader
- No record of the decision

```quiz
Q: What does a decision record contain?
+ Context, options, decision and consequences
- Only the code :: Not enough.
- Meeting notes only :: Not enough.
- A budget :: Not enough.
> One short page.

Q: How should review time be used?
+ To resolve open questions after written comments
- To read the document :: Waste.
- To avoid decisions :: No.
- To vote on style :: Low value.
> Prepare in advance.

Q: What leads for an executive reader?
+ Business effect, risk and the ask
- Protocol details :: Too deep.
- A long history :: Too long.
- Code :: Too deep.
> Be brief. Review the matching section of this lesson if it is unclear.

Q: What does disagree and commit need?
+ A recorded concern and a signal to revisit
- Silence :: Loses information.
- A veto :: Not committing.
- A new meeting :: Not necessary.
> Support the decision.
```

```cards
ADR :: Architecture decision record
Non goal :: Something the design deliberately does not cover
Consequence :: A result of a decision including its costs
Disagree and commit :: Support a decision after voicing concerns
```
