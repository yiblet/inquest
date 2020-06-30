# What's Inquest?

Inquest is a logging tool for python programs. It let's you add logs to your running python programs without restarting the program, redeploying the program, or modifying the code in any way. Inquest takes extremely low overhead: the part that's a python library is completely idle unless there is something to log. Inquest is specifically designed to enable you to quickly introspect into Python even in production environments.

Here's gif of the magic. I'm running a single python instance in the background and I use instead to dynamically add log statements to the running code.
<img src="https://raw.githubusercontent.com/yiblet/inquest/master/static/example.gif"/>

## Installation

There are two ways to use Inquest:

1. [A simple docker-compose](https://docs.inquest.dev/docs/getting_started_with_docker)
2. [The Inquest Cloud](https://inquest.dev)

## Resources

- [Documentation](https://docs.inquest.dev/docs/overview)
- [Troubleshooting](https://docs.inquest.dev/docs/logs_dont_appear)
- [Slack Group](https://join.slack.com/t/inquestcommunity/shared_invite/zt-fq7lra68-nems8~EkICvgf6xRW_J3eg)
- [Bug Tracker](https://github.com/yiblet/inquest/issues)

## Frequently Asked Questions

### How does Inquest work?

Inquest works by bytecode injection. The library sets up a connection with the backend. When you add a new
log statment on the dashboard, the backend relays that change the connected python instance. Inside python,
inquest finds the affected functions inside the VM.

Then it uses the python interpreter to recompile a newly generated piece of python bytecode with the new
log statements inserted. Then inquest pointer-swaps the new bytecode with the old bytecode.

This has 4 benefits:

1. your underlying code object is never modified
2. reverting a log statement is always possible and will always result in code behavior identical to the original
3. it generates extremely efficient python
4. it has not overhead

### Why can't I edit the code in the dashboard?

The dashboard right now cannot persist changes to the files. So modifications to the file on the dashboard
wouldn't have been reflected on the underlying file. This opens up an avenue for gotchas where you unintetionally change the IDE but never see those changes in your VCS. In order to avoid that, we made things, simple. The code viewer is read-only.
