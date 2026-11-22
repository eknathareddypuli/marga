## Describe what happens when you run kubectl apply.
level: junior
The client authenticates and sends the request to the API server, which runs authorization, mutating admission, schema validation and validating admission, then writes the object to etcd. Controllers and the scheduler watch for the change and act on it, and the kubelet on the chosen node starts the pod.

## Why does etcd need an odd number of members?
level: junior
Raft needs a majority to commit a write. Three members tolerate one failure and five tolerate two. A fourth member adds cost without tolerating more failures, and an even split can stall during a partition.

## How do you free space when etcd raises a NOSPACE alarm?
level: mid
Check endpoint status, compact to the current revision, defragment members one at a time, then disarm the alarm. Afterwards find what was writing so much, such as a hot loop updating an object, and fix that.

## A pod is Pending with no events. What do you check?
level: mid
No events means the scheduler never evaluated the pod. I check that the scheduler pod is running and holding its lease, then its logs, and the pod spec for a schedulerName that does not exist.

## What is leader election for in controllers?
level: mid
It lets several copies of a controller run for availability while only one acts at a time, using a Lease object. Frequent leader changes usually mean slow API server or etcd responses, not a controller bug.

## The API server is unreachable. How do you keep working?
level: senior
Pods keep running, so I work from the node layer. I check the kubelet, the container runtime with crictl, the static pod manifests and the kubelet journal, and look at etcd health directly with etcdctl before touching anything else.
