# Inquest: Point, Click, and See

Inquest is a logging tool for python programs. It let's you add logs to your running python programs without restarting the program, redeploying the program, or modifying the code in any way. Inquest takes extremely low overhead: the part that's a python library is completely idle unless there is something to log. Inquest is specifically designed to enable you to quickly introspect into Python even in production environments.

# Installation

There are three ways to use Inquest:

1. A simple docker-compose (coming soon)
3. The Inquest Cloud (https://inquest.dev)


## 1. Setup Up The Inquest API Server & Frontend

First, clone our repo

```bash
git clone https://github.com/yiblet/inquest.git
```

Then, once inside the directory, you simply have to run

```bash
docker-compose up
```

to get services running. By default the frontend dashboard will be located at `localhost:3000` and
the api backend will be at `localhost:4000`.

If you haven't installed docker, [Here's a link](https://docs.docker.com/get-docker/) to get started, and
to install docker-compose simply run `pip install docker-compose`

## 2. Install It With `pip`

Just run

```python
pip install inquest
```

Make sure to add it to your requirements.txt.

## 3. Import It Into Your Code

initialize it once at the start of your python script.
For a normal python script that just means putting it before the
first line that's run.

```python

import inquest

def main():
    inquest.enable(api_key='<YOUR_API_KEY_HERE>', glob=["my_project/**/*.py"])
    ...

if __name__ == '__main__':
    main()
```

Retrieve your `api_key` from the sidebar after you log into in the dashboard. Put the files you want
to have access to in dashboard into the `glob` parameter.

# Frequently Asked Questions

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
