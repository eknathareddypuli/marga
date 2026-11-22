## A key in a public repository
level: junior
A scanner reports a cloud access key in a public repository.

```text
$ aws iam list-access-keys --user-name deploy-bot --query "AccessKeyMetadata[].[AccessKeyId,Status]" --output text
AKIAEXAMPLE0001 Active
```
? What do you do first?
+ Disable or rotate the key, then check the logs for use
- Delete the commit only
- Wait for a review
why: Assume any exposed secret is already copied.

## Password not rotated in pods
level: mid
After a rotation the application kept failing until restart.

```text
$ kubectl exec deploy/orders -n shop -- printenv DB_PASSWORD | wc -c
17
```
? Why did running pods fail?
+ The value was read from an environment variable at start
- The database is slow
- DNS is wrong
why: Environment variables do not change in a running process.

## Certificate expired at night
level: junior
A partner integration failed after an old gateway certificate expired.

```text
$ echo | openssl s_client -connect gw.example.com:443 -servername gw.example.com 2>/dev/null | openssl x509 -noout -enddate
notAfter=Nov 10 23:59:59 2026 GMT
```
? What prevents a repeat?
+ Inventory with owners, live endpoint probes and automatic renewal
- A calendar reminder only
- A longer lifetime
why: Automation and monitoring remove the manual step.

## Challenge stays pending
level: mid
A new certificate is not ready.

```text
$ kubectl describe challenge -n shop | grep Reason
Reason: Waiting for HTTP-01 challenge propagation: wrong status code 404
```
? What is wrong?
+ The ingress sends the challenge path to the application
- The CPU is full
- The image is old
why: The challenge path must reach the solver.

## Federation trust too wide
level: senior
A cloud role trusts every repository in the organisation.

```text
$ aws iam get-role --role-name deploy-prod --query "Role.AssumeRolePolicyDocument.Statement[0].Condition"
{"StringLike": {"sub": "repo:example-org/*"}}
```
? What is the risk and fix?
+ Any repository can assume the role, so limit the subject to one repository and environment
- No risk
- Remove the role
why: A wildcard subject widens who can get access.

## Secret in a build log
level: mid
A registry token appears in a public build log.

```text
$ grep -n "_authToken" build-4821.log | head -1
214: //registry.example.com/:_authToken=npm_AbCdEf123456
```
? What is the correct order of response?
+ Revoke the token, check the registry audit log, then fix the pipeline
- Edit the log and carry on
- Rename the registry
why: Revocation comes first. The matching lesson explains the reasoning in more detail.
