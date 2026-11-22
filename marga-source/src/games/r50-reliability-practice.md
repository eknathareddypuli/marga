## The runbook that named a deleted host
module: reliability-practice
level: Intermediate
minutes: 7
lesson: reliability-practice/tabletops-and-game-days-how-to-facilitate
summary: A game day exposed a stale runbook. Run the exercise and make the lesson stick.
intro: You facilitate a database failover game day. Responders follow the runbook, and the failover step names a host that no longer exists.

### s1
text: What do you do when responders get stuck?
- Let them work and have the scribe record the delay => s2 | 2 | The gap is the learning. Example: Eight minutes are recorded.
- Tell them the right host => s2 | 1 | Hides the real gap. Example: The exercise proves nothing.
- Stop the exercise at once => end-fail | 0 | Loses the chance to see recovery. Example: No data is gained.

### s2
text: What do you do in the review? Choose the best next step.
- Review the timeline without blame and list the system causes => s3 | 2 | People share more when it is safe. Example: Stale runbooks and missing checks are named.
- Blame the person who wrote the runbook => s3 | 1 | Creates fear. Example: Problems are hidden.
- Skip the review => end-fail | 0 | Nothing changes. Example: The same gap remains.

### s3
text: How do you turn findings into change? Choose the best next step.
- Create actions with owners and dates and track them => s4 | 2 | Findings need follow through. Example: The runbook is fixed in a week.
- Send an email thanking everyone => s4 | 1 | No change. Example: The runbook stays wrong.
- Wait for the next incident => end-fail | 0 | Too late. Example: Real users are hurt.

### s4
text: How do you prevent stale runbooks? Choose the best next step.
- Add an automated check that hosts in runbooks resolve and repeat the exercise next quarter => end-win | 2 | Detection plus practice. Example: The check fails when a host is deleted.
- Ask for more documentation => end-ok | 1 | Documents still go stale. Example: Quality does not improve.
- Ban changes => end-fail | 0 | Not realistic. Example: Teams work around it.

### end-win
end: win
text: The gap was found safely, the runbook fixed and the next exercise was much faster.
takeaway: Observe without rescuing, review without blame and track actions with owners.

### end-ok
end: ok
text: The finding was noted but not tracked, so the gap may return.
takeaway: Assign owners and dates. Review the lesson and try again.

### end-fail
end: fail
text: The facilitator rescued the team or blamed people, so the learning was lost.
takeaway: Let the team work and keep reviews safe. Review the lesson and try again.
