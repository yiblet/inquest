# The Inquest Probe

This subdirectory holds all the python code for inquest.
At it's core this is just a pip installable python library that you have to turn on
somewhere in your codebase to connect to the inquest dashboard.

## Installation

Inquest is verified to work with python3.7 and later. The python installation is just:

```shell
pip install inquest
```

If you want more information on how to get started with inquest [go here to get started](https://docs.inquest.dev/docs/overview)


## examples 

The example directory has examples for you to try out inquest. All examples follow the same 
command line format. 

Pass in your `api_key` through the `-id` flag, and if you're running inquest locally in docker 
(with the backend in http://localhost:4000) pass in the `-local` flag.

Here's a full example for `examples/fibonacci.py`

```
python -m examples.fibonacci -local -id 123fake-api-key  
```
