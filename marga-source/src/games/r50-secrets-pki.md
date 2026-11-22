## The token in the public build log
module: secrets-pki
level: Intermediate
minutes: 7
lesson: secrets-pki/finding-and-stopping-leaks-in-code-ci-and-images
summary: A registry token appeared in a public build log. Respond in the right order.
intro: A developer turned on verbose output and the build log, which is public, now shows a package registry token in plain text.

### s1
text: What do you do first? Choose the best next step.
- Revoke the token at once => s2 | 2 | An exposed secret must be assumed copied. Example: The token stops working within a minute.
- Edit the log and carry on => s2 | 1 | Copies may exist and the token still works. Example: A bot has already stored it.
- Ask the developer to apologise => end-fail | 0 | Does nothing for the risk. Example: The token stays valid.

### s2
text: What do you check next? Choose the best next step.
- The registry audit log for downloads and publishes with that token => s3 | 2 | Find out whether it was misused. Example: One unknown download is found and reviewed.
- Nothing, revocation is enough => s3 | 1 | Misuse may already have happened. Example: A malicious publish goes unnoticed.
- Delete the registry => end-fail | 0 | Destroys the service. Example: All builds fail.

### s3
text: How do you restore the pipeline? Choose the best next step.
- Issue a scoped token stored as a masked variable => s4 | 2 | Least privilege and no exposure. Example: Only the publish step can use it.
- Reuse the same token value => s4 | 1 | It is exposed. Example: The old value works again.
- Put the token in the repository => end-fail | 0 | Repeats the mistake. Example: It leaks again.

### s4
text: How do you stop a repeat? Choose the best next step.
- Mask secrets in logs, scan logs and disable verbose mode on protected branches => end-win | 2 | Several layers of control. Example: The scanner blocks the next such log.
- Tell people not to debug => end-ok | 1 | Not a control. Example: Someone debugs next week.
- Remove logging => end-fail | 0 | Hides future problems. Example: Failures become hard to find.

### end-win
end: win
text: The token was revoked, the audit log checked and the pipeline hardened against the same leak.
takeaway: Revoke first, review use, issue a scoped replacement and add scanning and masking.

### end-ok
end: ok
text: The token was handled but the pipeline is still exposed.
takeaway: Add masking and scanning. Review the lesson and try again.

### end-fail
end: fail
text: The secret stayed valid or evidence was ignored.
takeaway: Never edit around a leak. Review the lesson and try again.
