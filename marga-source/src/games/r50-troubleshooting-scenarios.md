## Twenty minutes of guessing
module: troubleshooting-scenarios
level: Intermediate
minutes: 7
lesson: troubleshooting-scenarios/a-symptom-first-method-narrow-the-layer-in-ten-minutes
summary: An error rate rose and everyone changed something. Bring order and find the cause.
intro: The error rate has doubled. Three engineers are changing different settings at once and nobody knows which change had which effect.

### s1
text: What do you do first? Choose the best next step.
- Stop the parallel changes and write the symptom precisely => s2 | 2 | One change at a time keeps results readable. Example: The symptom is written as who, what and since when.
- Join in with another change => s2 | 1 | More noise. Example: Effects are impossible to separate.
- Restart everything => end-fail | 0 | Loses evidence. Example: The cause stays unknown.

### s2
text: What is the next question? Choose the best next step.
- What changed shortly before the errors began => s3 | 2 | Most incidents follow a change. Example: A deployment is found six minutes before the alert.
- Who is to blame => s3 | 1 | Does not help find the cause. Example: People become defensive.
- How big is the team => end-fail | 0 | Irrelevant. Example: Time is lost.

### s3
text: How do you restore service? Choose the best next step.
- Roll back the deployment while keeping logs and metrics => s4 | 2 | Mitigate first and keep the evidence. Example: Errors stop after the rollback.
- Debug in production for an hour => s4 | 1 | Users stay affected. Example: The outage lasts longer.
- Scale to ten times the size => end-fail | 0 | Hides the cause and costs money. Example: Errors continue.

### s4
text: How do you find the root cause? Choose the best next step.
- Reproduce with the saved logs and compare configuration, then record each test => end-win | 2 | A calm review finds the real cause. Example: A wrong configuration value is found.
- Guess and move on => end-ok | 1 | A repeat is likely. Example: The same incident returns.
- Skip the review => end-fail | 0 | Nothing is learned. Example: Nothing changes.

### end-win
end: win
text: Order was restored, service recovered by rollback and the root cause was found and recorded.
takeaway: Write the symptom, ask what changed, mitigate and then find the cause calmly.

### end-ok
end: ok
text: Service recovered but the cause or the notes are missing.
takeaway: Record the tests and the cause. Review the lesson and try again.

### end-fail
end: fail
text: Uncoordinated changes made the incident longer.
takeaway: Stop parallel changes. Review the lesson and try again.
