import pytest

from inquest.hotpatch import embed_fstring


def test_embed_fstring(capsys):

    def sample_2(x, y):
        return x + y

    def sample(x, y):
        return x + y

    # modifying sample_2 to add a print statement at the start of the code
    sample_2.__code__ = embed_fstring(sample.__code__, "{x},{y}")
    assert sample_2(2, 1) == sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "2,1\n"


def test_embed_fstring_simple(capsys):

    def sample_2(x, y):
        return x + y

    def sample(x, y):
        return x + y

    sample_2.__code__ = embed_fstring(sample.__code__, "{x}")
    assert sample_2(2, 1) == sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "2\n"


def test_embed_fstring_escape_string(capsys):

    def sample_2(x, y):
        return x + y

    def sample(x, y):
        return x + y

    sample_2.__code__ = embed_fstring(sample.__code__, r"\{testing\}")
    assert sample_2(2, 1) == sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "{testing}\n"


def test_embed_fstring_generator(capsys):

    def sample_2(x, y):
        yield x + y

    def sample(x, y):
        yield x + y

    sample_2.__code__ = embed_fstring(sample.__code__, r"{x} {y}")
    assert tuple(sample_2(2, 1)) == tuple(sample(2, 1))
    captured = capsys.readouterr()
    assert captured.out == "2 1\n"


@pytest.mark.asyncio
async def test_embed_fstring_asyncio(capsys):

    async def sample_2(x, y):
        return x + y

    async def sample(x, y):
        return x + y

    sample_2.__code__ = embed_fstring(sample.__code__, r"{x} {y}")
    assert (await sample_2(2, 1)) == (await sample(2, 1))
    captured = capsys.readouterr()
    assert captured.out == "2 1\n"


@pytest.mark.asyncio
async def test_embed_fstring_asyncio_generator(capsys):

    async def sample_2(x, y):
        yield x
        yield y

    async def sample(x, y):
        yield x
        yield y

    async def collect(gen):
        res = []
        async for val in gen:
            res.append(val)
        return tuple(res)

    sample_2.__code__ = embed_fstring(sample.__code__, r"{x} {y}")
    assert (await collect(sample_2(2, 1))) == (await collect(sample(2, 1)))
    captured = capsys.readouterr()
    assert captured.out == "2 1\n"


# class methods
def test_embed_fstring_method(capsys):

    class Test1:

        @staticmethod
        def sample(x, y):
            return x + y

    class Test2:

        @staticmethod
        def sample(x, y):
            return x + y

    Test1.sample.__code__ = embed_fstring(Test1.sample.__code__, "{x}{y}")
    assert Test1.sample(2, 1) == Test2.sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "21\n"


def test_embed_fstring_method_inheritance(capsys):

    class Parent:

        @staticmethod
        def sample(x, y):
            return x + y

    class Test1(Parent):
        pass

    class Test2:

        @staticmethod
        def sample(x, y):
            return x + y

    Parent.sample.__code__ = embed_fstring(Parent.sample.__code__, "{x}{y}")
    assert Test1.sample(2, 1) == Test2.sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "21\n"


def test_embed_fstring_method_inheritance_bug_1(capsys):
    # this is a known bug with the code injection on methods that
    # are shared through inheritance. Fix this and delete this test case.

    class Parent:

        @staticmethod
        def sample(x, y):
            return x + y

    class Test1(Parent):
        pass

    class Test2:

        @staticmethod
        def sample(x, y):
            return x + y

    # FIXME when the child is code-injected the code change affects the parent
    Test1.sample.__code__ = embed_fstring(Test1.sample.__code__, "{x}{y}")
    assert Parent.sample(2, 1) == Test2.sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "21\n"


def test_embed_fstring_method_inheritance_bug_2(capsys):
    # this is a known bug with the code injection on methods that
    # are shared through inheritance. Fix this and delete this test case.

    class Parent:

        @staticmethod
        def sample(x, y):
            return x + y

    class Test1(Parent):
        pass

    class Test2:

        @staticmethod
        def sample(x, y):
            return x + y

    class Test3(Parent):
        pass

    # FIXME when the child is code-injected the code change affects the  sibling
    Test1.sample.__code__ = embed_fstring(Test1.sample.__code__, "{x}{y}")
    assert Test3.sample(2, 1) == Test2.sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "21\n"
