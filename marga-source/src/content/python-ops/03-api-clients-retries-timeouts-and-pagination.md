---
title: API clients: retries, timeouts and pagination
minutes: 13
summary: Call HTTP APIs safely with timeouts, retries with backoff and jitter, idempotency, rate limit handling and complete pagination.
---

Most operations scripts are API clients. Without timeouts and sensible retries they hang, hammer a struggling service or silently miss pages of results.

## What you will learn

- Always set timeouts
- Retry with exponential backoff and jitter
- Idempotency and which calls are safe to retry
- Rate limits and the Retry-After header
- Pagination without losing items

## Timeouts

A request with no timeout can wait forever and hang a scheduled job. Set a connect timeout and a read timeout, for example `timeout=(3, 15)`. Pick values from the service behaviour, and treat a timeout as a failure to handle, not a surprise.

## Backoff and jitter

When a call fails with a transient error, wait and try again, doubling the wait each time up to a limit and adding random jitter so many clients do not retry in step. Cap the number of attempts and the total time, then fail with a clear error.

## Idempotency

A `GET` is safe to retry. A `POST` that creates something may create it twice. Use idempotency keys when the API supports them, or check for the result before retrying. Retry only errors that can be transient, such as connection errors, 429 and 5xx, not 400 or 404.

## Rate limits

APIs return 429 and often a `Retry-After` header. Obey it. Slow down proactively by limiting concurrency, and cache results that do not change. A script that ignores limits may get its credentials blocked.

## Pagination

Large lists arrive in pages. Follow the next page token or link until it is absent, rather than assuming one page is all. Watch for items changing during the walk and for page size limits. Write a generator that yields items so callers do not care about pages.

```diagram
title: API clients: retries, timeouts and pagination
node: call | API call | 0 | 1 | Has timeout. | No timeout. | external
node: retry | Retry policy | 1 | 1 | Backoff, jitter. | Retry storm. | process
node: page | Pagination loop | 2 | 1 | Follows next token. | Stops at page one. | process
node: res | Complete result | 3 | 1 | All items. | Missing items. | store
edge: call | retry
edge: retry | page
edge: page | res
```

## Incident: A report that missed most of the data

> **Incident:** A usage report counted only the first hundred resources because pagination was ignored.

```console
$ python report.py --count
resources: 100
$ python -c "print('next_page_token present: True')"
(this is a simulated illustration, not a real incident)
```

The client read one page and ignored the next page token, so the report looked plausible but was wrong. The team replaced it with a generator that follows tokens until none remain and added a test with a fake API that returns three pages.

## Common mistakes

- No timeout on requests
- Retrying non idempotent calls blindly
- Retrying immediately without backoff
- Ignoring Retry-After
- Reading only the first page

```quiz
Q: Why add jitter to backoff?
+ So clients do not retry at the same moment
- To slow everything :: Not the point.
- To hide errors :: No.
- To save memory :: No.
> Avoid retry storms.

Q: Which call is naturally safe to retry?
+ GET
- POST create :: May duplicate.
- DELETE with side effects :: Careful.
- None :: Wrong.
> Idempotent by definition.

Q: What should a 429 response trigger?
+ Waiting as the Retry-After header says
- Immediate retry :: Worse.
- Ignoring it :: Risky.
- Deleting data :: No.
> Respect the limit.

Q: How do you get all items?
+ Follow the next token until it is absent
- Read one page :: Incomplete.
- Guess the count :: No.
- Retry :: No.
> A generator hides pages.
```

```cards
Timeout :: Maximum time to wait for a response
Backoff :: Increasing delays between retries
Idempotent :: Safe to repeat with the same effect
Pagination :: Returning results in pages
```
