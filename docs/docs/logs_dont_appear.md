---
id: logs_dont_appear
title: My Logs Don't Appear
---

There are two main cases for why this is happening:

1. The Inquest Probe (your python instance) is disconnected from the backend
2. You're running your code in an infinite loop
3. You Have A An Existing Yellow Warning

## You're disconnected

Check the dashboard's sidebar to see if you're disconnected. If you see "0 instances connected" that means
that your python instance was disconnected. Inquest by default outputs some kind of error message to stdout
when it unexpectedly stops working so take a look at that.

## You're running your code an infinite loop

When you add a new log to some function, for safety reasons, Inquest doesn't modify the function but modifies the pointer to the function to point to the the updated version of the function. This means that the function has to be called from a different function for it to run the modified version. In an infinite loop, the function is never called from a different function.

To avoid this issue, we reccomend breaking up the part you want to log with inquest into a different function. So that the infinite loop part of the code calls into the part of the code that houses the lines you want to log.


## You have an existing yellow warning

Inquest tries to be as safe as possible when modifying running code, and that means stopping early when it 
sees a yellow warning. You must address all yellow warnings before adding new logs. Even the warnings 
in different files. Or else your new changes won't take affect on the python side.

[More on yellow warnings here](./yellow_warning.md)


