from starlette.applications import Starlette
from starlette.responses import JSONResponse, PlainTextResponse
from starlette.routing import Route, WebSocketRoute
from starlette.requests import Request
from starlette.websockets import WebSocket
import uvicorn
import importlib
import sys
import time
from typing import Tuple, Callable
import functools
import logging


async def homepage(request):
    return JSONResponse({"hello": "world"})


def fib2_helper(prev: int, cur: int) -> Tuple[int, int]:
    logging.info("fib2")
    return [cur, cur + prev]


def fib_helper(prev: int, cur: int) -> Tuple[int, int]:
    return [cur, cur + prev]


def fib(helper: Callable[[int, int], Tuple[int, int]]):
    async def fib_func(request: Request):
        n: int = request.path_params["n"]
        cur_time = time.time_ns()
        res = 1
        if n > 1:
            prev = 1
            cur = 1
            next = 2
            while next <= n:
                prev, cur = helper(prev, cur)
                next += 1
            res = cur
        return JSONResponse(
            {"n": n, "fib": res, "time": (time.time_ns() - cur_time) / 1e6}
        )

    return fib_func


async def reload(request):
    importlib.reload(sys.modules["__main__"])
    return PlainTextResponse(str(sys.modules))


async def ws(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Hello, world!")
    await websocket.close()


if __name__ == "__main__":
    app = Starlette(
        debug=True,
        routes=[
            Route("/", homepage),
            Route("/reload", reload),
            Route("/fib/{n:int}", fib(fib_helper)),
            Route("/fib2/{n:int}", fib(fib2_helper)),
            WebSocketRoute("/ws", ws),
        ],
    )
    uvicorn.run(app, host="127.0.0.1", port=3000, log_level="info")
