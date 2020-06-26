---
id: getting_started_with_docker
title: Self-Hosting With Docker
---

If you want to run Inquest on your own computer, it takes just three
steps.

:::note
Inquest is only verified to work with python versions 3.7 and later

If you just want to try it out quickly with less installation
[follow this guide](getting_started.md) on how to set it up with Inquest Cloud. It's also free, but it takes less work to set up.
:::

## 1. Setup Up The Inquest API Server & Frontend

First, clone our repo

```bash
git clone https://github.com/yiblet/inquest.git
```

Then, once inside the directory, you simply have to run

```bash
docker-compose up
```

to get services running.

(If you haven't installed docker, [Here's a link](https://docs.docker.com/get-docker/) to get started, and
to install docker-compose simply run `pip install docker-compose`)

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

### More Info On Globbing Files

To upload python files are in the directory `my_project`, the glob `my_project/**/*.py` will
verify and upload all these. These files will be uploaded securely to backend so you can view
it in the dashboard. Once you've uploaded them, you can delete them any time.

glob takes in any list of valid python globs. So for more complex use cases, read python's standard
library on [globs](https://docs.python.org/3/library/glob.html).

We check against the files' hashes so files are only uploaded if they've been modified between runs.

## What's Next?

You're set up! Now just run your python script like you usually do, and go to `localhost:3000` on your
browser to get access to your own personal copy of Inquest.
