---
id: running_inquest
title: inquest.enable 
---

```python
inquest.enable(
    api_key,
    host= "inquest.dev",
    port= 443,
    glob= None,
    exclude = None,
    daemon = True,
)
```

### Examples

In general, you only need to pass inquest 2 arguments. However, if you're self-hosting
you'll have to pass in a two more.

for connecting to Inquest cloud:

```python
inquest.enable(
    api_key='random-key-231312',
    glob= "my-project/**/*.py",
)
```

For connecting your own self-hosted Inquest backend (which is at `localhost:3000` in this example):

```python
inquest.enable(
    api_key='random-key-231312',
    host='localhost',
    port=3000,
    glob= "my_project/**/*.py",
)
```

### Arguments For `inquest.enable`

| argument  | description                                                                                                                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api_key` | Your api key (you can get this by logging into the inquest dashboard).                                                                                                                                                                                                                    |
| `glob`    | a list of [recursive globs](https://docs.python.org/3/library/glob.html) pointing to files that will be uploaded to the dashboard, so you can add log statements to them. We check the files' hashes so files are only uploaded if they've been changed since last run or if they've never been uploaded before. |
| \*`host`  | pass in the url of your inquest backend.                                                                                                                                                                                                                                                  |
| \*`port`  | the port of your inquest backend.                                                                                                                                                                                                                                                         |
| \*`ssl`   | if the port is set to 443 this is automatically set to true. Otherwise it's set to false. Set to true only if your self-hosted backend is set up with ssl.                                                                                                                                |

\*only needed if you're self-hosting.
