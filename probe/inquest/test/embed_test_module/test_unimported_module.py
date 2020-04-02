# pylint: disable-all
def sample(arg1, arg2):
    return arg1 + arg2


class SampleClass:

    def sample_method(self, arg1, arg2):
        return arg1 + arg2


class SampleChildClass(SampleClass):
    pass
