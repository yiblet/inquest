import importlib
import logging
import sys
import time
from typing import Callable, Tuple

import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse
from starlette.routing import Route


async def homepage(_):
    return JSONResponse({"hello": "world"})


def fib2_helper(prev: int, cur: int) -> Tuple[int, int]:
    logging.info("fib2")
    return [cur, cur + prev]


def fib_helper(prev: int, cur: int) -> Tuple[int, int]:
    return [cur, cur + prev]


def fib(helper: Callable[[int, int], Tuple[int, int]]):

    async def fib_func(request: Request):
        idx: int = request.path_params["n"]
        cur_time = time.time_ns()
        res = 1
        if idx > 1:
            prev = 1
            cur = 1
            _next = 2
            while _next <= idx:
                prev, cur = helper(prev, cur)
                _next += 1
            res = cur
        return JSONResponse({
            "n": idx,
            "fib": res,
            "time": (time.time_ns() - cur_time) / 1e6
        })

    return fib_func


async def reload(_):
    importlib.reload(sys.modules["__main__"])
    return PlainTextResponse(str(sys.modules))


def main():
    app = Starlette(
        debug=True,
        routes=[
            Route("/", homepage),
            Route("/reload", reload),
            Route("/fib/{n:int}", fib(fib_helper)),
            Route("/fib2/{n:int}", fib(fib2_helper)),
        ],
    )
    uvicorn.run(app, host="127.0.0.1", port=3000, log_level="info")


if __name__ == "__main__":
    main()
