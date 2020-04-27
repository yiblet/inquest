import functools


def sample():
    pass


@functools.lru_cache()
def sample_with_decorator():
    pass


async def async_sample():
    pass


@functools.lru_cache()
async def async_sample_with_decorator():
    pass


class TestClass():

    def sample(self, x):
        pass

    @functools.lru_cache()
    def sample_with_decorator():
        pass

    async def async_sample():
        pass

    @functools.lru_cache()
    async def async_sample_with_decorator():
        pass


@functools.lru_cache()
class TestClassWithDecorator():

    def sample():
        pass

    @functools.lru_cache()
    def sample_with_decorator():
        pass

    async def async_sample():
        pass

    @functools.lru_cache()
    async def async_sample_with_decorator():
        pass
