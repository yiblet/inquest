---
id: yellow_warning
title: I Have A Yellow Warning
---

The yellow warning in the dashboard signifies some issue along the steps towards installing the new 
log. Most commonly there are 3 issues that cause this: 


1. The log is throwing an exception
2. The file is not imported
3. You're using unwrapped python decorators.

## The log is throwing an exception

What's inside the `{bracket}` notation in your logs are full valid python expressions that can throw 
errors. Often these errors are something as benign as a misspelled variable, but it's possible to 
throw more complicated errors. 

To fix this look more carefully into what exactly you're logging.

## The file is not imported

If you're trying to add a log statement to a python function that is never imported, inquest will 
attempt to find that function, fail, and then report it as a yellow warning.

## You're using unwrapped decorators

When we're modifying a python function that's behind a decorator we use the decorator's metadate 
to find the original function. Specifically through the `__wrapped__` attribute. 

This error should only be a concern if you wrote the decorator yourself, most popular python libraries
implement decorators with wraps. 

The `__wrapped__` attribute doesn't get set automatically. Instead, to add the attribute you need
 to use a function from the python standard library.

[More on that in the python standard library docs](https://docs.python.org/3.8/library/functools.html#functools.wraps)

