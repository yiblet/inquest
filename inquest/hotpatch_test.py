from .hotpatch import _make_trampoline, hotpatch

# hotpatch doesn't work on classmethod
# hotpatch doesn't work on inherited methods

def test_make_trampoline():
    def func(*args, **kwargs):
        return (args, kwargs)

    tramp = _make_trampoline(func)
    assert tramp(1, 2, a=1, b=2) == ((1, 2), {"a": 1, "b": 2})


def test_hotpatch_more_freevars():
    def f(a, b):
        return a + b

    c = 123

    def g(a, b):
        return a * b + c

    assert f(3, 3) != g(3, 3)
    restore = hotpatch(g, f)
    assert f(3, 3) == c + (3 * 3)
    assert f(3, 3) == g(3, 3)


def test_hotpatch_less_freevars():
    c = 123

    def f(a, b):
        return a + b + c

    def g(a, b):
        return a * b

    assert f(3, 3) != g(3, 3)
    restore = hotpatch(g, f)
    assert f(3, 3) == g(3, 3)


def test_hotpatch_different_defaults():
    def f(x=123):
        return x

    def g(x=456):
        return x

    assert f() == 123
    hotpatch(g, f)
    assert f() == 456
    assert f(789) == 789


def test_hotpatch_on_methods():
    class C:
        def test_method(self):
            return 2

    def test_method_2(self):
        return 1

    v = C()
    assert v.test_method() == 2
    hotpatch(test_method_2, C.test_method)
    assert v.test_method() == 1


def test_hotpatch_on_static_methods():
    class C:
        @staticmethod
        def test_method(self):
            return self

    def test_method_2(self):
        return self + 2

    v = C()
    assert v.test_method(0) == 0
    hotpatch(test_method_2, C.test_method)
    assert v.test_method(0) == 2


def test_hotpatch_on_class_methods():
    class C:
        @classmethod
        def test_method(cls):
            return cls

    def test_method_2(cls):
        return cls

    v = C()
    # assert v.test_method() == C
    # hotpatch(test_method_2, C.test_method)
    # assert v.test_method() == C


def test_hotpatch_on_class_inheritance():
    class Base(object):
        def test(self):
            return 2

    class A(Base):
        pass

    class B(Base):
        pass

    def return_1(self):
        return 1

    def return_3(self):
        return 3

    a = A()
    b = B()
    c = Base()

    hotpatch(return_1, Base.test)
    hotpatch(return_3, A.test)
    # assert c.test() == 1
    # assert b.test() == 1
    assert a.test() == 3
