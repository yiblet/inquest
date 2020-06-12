# Inquest: Logging On Steriods

Inquest is a logging tool for python programs. It let's you add logs to your running python programs without restarting the program, redeploying the program, or modifying the code in any way. Inquest takes extremely low overhead: the part that's a python library is completely idle unless there is something to log. Inquest is specifically designed to enable you to quickly introspect into Python even in production environments.

# Installation

There are three ways to use Inquest:

1. A simple docker-compose (coming soon)
2. A helm chart (see `charts/` for more info)
3. The inquest managed service (https://inquest.dev)

# Usage

Usage is dead simple. It takes just two lines to get started on any python deployment. `pip install` inquest (make sure your inquest python library version matches the version of the inquest backend).

If you're using the cloud service, set up is as simple as this snippet below:

```python
import inquest
def main():
    inquest.enable(api_key='<YOUR API KEY>', glob=["examples/**/*.py"])
    ...
```

You simply need an api key, and if a glob matching to the files you want to send to the dashboard so you can
add log statements to them.

If you're self honsting you'll also have to pass in the `host` and `port` kwarg with the respective host
and ports of your inquest backend.

# Frequently Asked Questions

### How does Inquest work?

Inquest works by bytecode injection. The library sets up a connection with the backend. When you add a new
log statment on the dashboard, the backend relays that change the connected python instance. Inside python,
inquest finds the affected functions inside the VM and pointer-swaps code objects.

This has 3 obvious benefits:

1. your underlying code object is never modified
2. reverting a log statement is always possible and will always result in code identical to the original
3. it's very efficient

### Why can't I edit the code in the dashboard?

The dashboard right now cannot persist changes to the files. So modifications to the file on the dashboard
wouldn't have been reflected on the underlying file. This opens up an avenue for gotchas where you unintetionally change the IDE but never see those changes in your VCS. In order to avoid that, we made things, simple. The code viewer is read-only.
