## The scale up that could not pull images
module: infra-design
level: Advanced
minutes: 7
lesson: infra-design/design-a-registry-and-artifact-distribution-service
summary: Registry limits blocked a scale up during a peak. Design the front of the pipeline so it cannot happen again.
intro: During a traffic peak, new pods stay in ImagePullBackOff. The events show an upstream registry pull rate limit.

### s1
text: What do you do first? Choose the best next step.
- Point the workloads to an internal mirror or cache of the base images => s2 | 2 | Restores pulls from a source you control. Example: New pods start from the mirror.
- Wait until the limit resets => s2 | 1 | Users are affected meanwhile. Example: The peak is missed.
- Delete the failing pods => end-fail | 0 | Does not help. Example: More pods fail.

### s2
text: What is the lasting design? Choose the best next step.
- An authenticated pull through cache in each cluster and mirrored critical images => s3 | 2 | Removes the dependency on upstream limits. Example: Pulls are served locally.
- Larger nodes => s3 | 1 | Unrelated. Example: The limit remains.
- More replicas => end-fail | 0 | Increases pulls. Example: The limit is reached sooner.

### s3
text: How do you make deployments safe to roll back?
- Deploy by digest with immutable tags and a retention rule that keeps recent releases => s4 | 2 | Rollbacks need old images. Example: A rollback pulls an existing digest.
- Use the latest tag => s4 | 1 | Tags can move. Example: A rollback changes nothing.
- Delete old images weekly => end-fail | 0 | Removes rollback targets. Example: A rollback fails.

### s4
text: How do you detect problems early? Choose the best next step.
- Alert on pull failures and registry latency and pre pull big images before rollouts => end-win | 2 | Early warning and warm nodes. Example: An alert fires before the peak.
- Wait for user reports => end-ok | 1 | Too late. Example: The outage is longer.
- Disable the autoscaler => end-fail | 0 | Removes resilience. Example: Capacity falls short.

### end-win
end: win
text: Pulls were restored from a local cache and the design now avoids upstream limits and supports rollback.
takeaway: Mirror and cache images, deploy by digest and alert on pull failures.

### end-ok
end: ok
text: The incident ended but the dependency on upstream still exists.
takeaway: Add a pull through cache. Review the lesson and try again.

### end-fail
end: fail
text: Waiting or deleting pods made the outage longer.
takeaway: Move pulls to a source you control. Review the lesson and try again.
