## The merge that reached forty clusters
module: platform-tools
level: Advanced
minutes: 7
lesson: platform-tools/argo-cd-applicationsets-and-fleet-delivery
summary: One bad change synced to every cluster at once. Contain it and add safe rollout.
intro: A merge changed an ingress setting and an ApplicationSet with automated sync pushed it to forty production clusters within minutes. Traffic is failing in many regions.

### s1
text: What do you do first? Choose the best next step.
- Pause automated sync, revert the change and confirm health cluster by cluster => s2 | 2 | Stop the spread, then recover. Example: Sync is paused and the revert merges.
- Delete the clusters => s2 | 1 | Destroys healthy systems. Example: All services go down.
- Wait to see if it resolves => end-fail | 0 | Damage grows. Example: More clusters degrade.

### s2
text: How do you recover in order? Choose the best next step.
- Fix a canary cluster first, verify, then roll out the revert in rings => s3 | 2 | Confirm the fix before spreading it. Example: The canary is healthy after the revert.
- Revert everywhere at once => s3 | 1 | Same risk again. Example: A second bad sync is possible.
- Edit each cluster by hand => end-fail | 0 | Slow and error prone. Example: Drift is created.

### s3
text: How do you prevent it? Choose the best next step.
- Use rollout rings by cluster label, health gates and an automatic pause on degraded apps => s4 | 2 | Limits the blast radius. Example: Only the canary ring takes the next bad change.
- Tell people to review harder => s4 | 1 | Not a control. Example: The next miss repeats.
- Disable the tool => end-fail | 0 | Loses delivery. Example: Releases stop.

### s4
text: What else should change? Choose the best next step.
- Require review for the final ring and test changes in a staging fleet => end-win | 2 | Extra checks for the biggest step. Example: Production approval is manual.
- Remove staging => end-ok | 1 | Less safety. Example: Bugs reach production.
- Skip the review => end-fail | 0 | Unsafe. Example: A repeat is likely.

### end-win
end: win
text: The spread was stopped, the fleet recovered in rings and rollout gates now limit the damage.
takeaway: Pause, revert through a canary and roll out in rings with health gates.

### end-ok
end: ok
text: The incident ended but the rollout is still unsafe.
takeaway: Add rings and gates. Review the lesson and try again.

### end-fail
end: fail
text: The spread continued or healthy systems were destroyed.
takeaway: Stop the sync first. Review the lesson and try again.
