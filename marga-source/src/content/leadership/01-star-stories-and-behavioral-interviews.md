---
title: STAR stories and behavioral interviews
minutes: 12
summary: Build a bank of specific stories using the STAR structure, answer follow up questions with numbers and trade-offs, and avoid the usual weak answers.
---

Behavioral interviews ask what you did, not what you know. Interviewers want evidence of judgement under pressure, and a small set of well prepared stories covers most questions.

## What you will learn

- What interviewers look for
- The STAR structure and its common failure
- Building a story bank
- Adding numbers, decisions and trade-offs
- Handling follow up questions and failure stories

## What they look for

Interviewers test for ownership, judgement, collaboration, learning from mistakes and impact. They listen for what you personally decided and did. A team result with no clear role for you tells them little.

## STAR

Situation and Task set the scene in two or three sentences. Action is the longest part: what you chose, why and how. Result states the outcome with a number and what you learned. The common failure is to spend most of the time on the situation and then rush the action.

## The story bank

Prepare six to eight stories that each fit several questions: a hard outage, a disagreement, a project you led, a mistake, a time you influenced without authority, a time you mentored and a time you made a trade-off with incomplete data. Write each as five bullet points, not a script.

## Numbers and trade-offs

Say how many users were affected, how long it lasted, what it cost and what improved. Explain the options you rejected and why. Senior interviewers value the reasoning more than the success.

## Follow ups and failures

Expect questions such as what would you do differently and what did others think. Choose a real failure with a real lesson, and describe the change you made afterwards. Avoid disguised bragging such as caring too much.

```diagram
title: STAR stories and behavioral interviews
node: q | Question | 0 | 1 | Asks for an example. | Vague. | external
node: s | Story bank | 1 | 1 | Matching story. | Too generic. | store
node: a | STAR answer | 2 | 1 | Action focused. | Long setup. | process
node: f | Follow ups | 3 | 1 | Probe your role. | We not I. | external
edge: q | s
edge: s | a
edge: a | f
```

## Incident: The answer that said we thirty times

> **Incident:** A candidate described a large migration and could not say what they personally did.

```console
$ grep -o -i -w "we" answer.txt | wc -l
31
$ grep -o -i -w "I" answer.txt | wc -l
2
(this is a simulated illustration, not a real incident)
```

The interviewer asked what the candidate decided and got a vague reply. The candidate rewrote the story with decisions in the first person: the cutover plan, the rollback criteria and the call to delay a week. The next answer was clearer and led to an offer.

## Common mistakes

- Describing the team and not your own actions
- Long background and a short action
- No numbers in the result
- Stories that never show a mistake
- Memorised scripts that fall apart under follow ups

```quiz
Q: Which part of STAR should be longest?
+ Action
- Situation :: Keep short.
- Task :: Keep short.
- Result :: Short and specific.
> Show what you did.

Q: How many stories should you prepare?
+ Six to eight reusable ones
- One :: Not enough.
- Fifty :: Cannot recall.
- None :: Unprepared.
> Each fits several questions.

Q: What strengthens a result?
+ A number and what you learned
- A longer setup :: Does not help.
- More jargon :: Does not help.
- A joke :: Does not help.
> Be specific. Review the matching section of this lesson if it is unclear.

Q: How should you describe a failure?
+ Real cause, real lesson and what you changed
- Blame others :: Weak.
- Say you have none :: Not credible.
- Disguised strength :: Weak.
> Show growth. Review the matching section of this lesson if it is unclear.
```

```cards
STAR :: Situation, task, action, result
Story bank :: A set of prepared examples to reuse
Ownership :: Taking responsibility for an outcome
Trade-off :: Choosing one benefit at the cost of another
```
