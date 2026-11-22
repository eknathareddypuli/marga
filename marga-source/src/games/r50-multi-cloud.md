## The failover nobody rehearsed
module: multi-cloud
level: Advanced
minutes: 7
lesson: multi-cloud/multi-cloud-reliability-cost-and-exit-plans
summary: The second cloud copy was a day old when the primary failed. Run the recovery and learn.
intro: A regional outage hits the primary cloud. The plan says to fail over to the second cloud, but the replica lag is one day and the runbook names resources that no longer exist.

### s1
text: What do you do first? Choose the best next step.
- Declare the incident, name a commander and check replica lag and runbook accuracy before switching => s2 | 2 | Know what you are failing over to. Example: Lag is found to be 23 hours.
- Switch traffic at once => s2 | 1 | Loses a day of data without a decision. Example: Customers see old data.
- Wait for the provider => end-fail | 0 | No control of recovery. Example: Hours pass.

### s2
text: How do you decide on data loss? Choose the best next step.
- Take the decision with the business owner using the recovery point objective => s3 | 2 | Data loss is a business decision. Example: The owner accepts a partial recovery.
- Decide alone => s3 | 1 | Lacks authority. Example: Blame follows.
- Hide it => end-fail | 0 | Dishonest. Example: Customers find out later.

### s3
text: How do you restore service? Choose the best next step.
- Rebuild from code, apply the baseline and update names, then shift traffic in steps with health checks => s4 | 2 | Code is the source of truth. Example: Traffic shifts in stages.
- Click through consoles => s4 | 1 | Slow and error prone. Example: Settings are missed.
- Copy old scripts => end-fail | 0 | Names are stale. Example: Scripts fail.

### s4
text: What do you change afterwards? Choose the best next step.
- Add lag alerts, fix the runbook from code and run game days each quarter => end-win | 2 | Rehearsal finds problems early. Example: The next game day takes two hours.
- Write a longer document => end-ok | 1 | Not tested. Example: It goes stale.
- Drop the second cloud without analysis => end-fail | 0 | Skips the lesson. Example: The same risk remains.

### end-win
end: win
text: Service was restored in stages, data loss was decided by the owner and rehearsals now find problems early.
takeaway: Know the lag, decide on data loss openly, rebuild from code and rehearse.

### end-ok
end: ok
text: Service returned but the plan is still untested.
takeaway: Add alerts and rehearsals. Review the lesson and try again.

### end-fail
end: fail
text: Switching blindly or hiding the loss made things worse.
takeaway: Check lag first and be open about data loss. Review the lesson and try again.
