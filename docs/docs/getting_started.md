---
id: getting_started
title: Get Started
---

Getting up inquest just takes 2 steps!
:::note
Inquest is only verified to work with python versions 3.7 and later
:::

## 1. Install It With `pip`

Just run

```python
pip install inquest
```

Make sure to add it to your requirements.txt.

## 2. Import It Into Your Code


initialize it once at the start of your python script.
For a normal python script that just means putting it before the
first line that's run.

```python

import inquest

def main():
    inquest.enable(api_key='<YOUR_API_KEY_HERE>', glob=["main.py", "some_subdirectory/**/*.py"])
    ...

if __name__ == '__main__':
    main()
```

Retrieve your `api_key` from the sidebar after you log into in the dashboard. Put the files you want
to have access to in dashboard into the `glob` parameter.

### More Info On Globbing Files

To upload all python files are in the directory `my_directory`, the glob `my_directory/**/*.py` will
verify and upload all these files. The files will be uploaded securely to backend so you can view
it in the dashboard. Once you've uploaded them, you can delete them any time.

Glob takes in any list of valid python globs. So for more complex use cases, read python's standard
library on [globs](https://docs.python.org/3/library/glob.html).

We check against the files' hashes so files are only uploaded if they've been modified between runs.

## What's Next?

You're set up! Now just run your python script like you usually do and go on [the dashboard](https://inquest.dev/dashboard) to get started.
