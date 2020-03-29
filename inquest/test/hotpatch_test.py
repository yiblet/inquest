from ..hotpatch import embed_fstring


def test_embed_fstring_0(capsys):

    def sample_2(x, y):
        return x + y

    def sample(x, y):
        return x + y

    # modifying sample_2 to add a print statement at the start of the code
    sample_2.__code__ = embed_fstring(sample.__code__, "{x},{y}")
    assert sample_2(2, 1) == sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "2,1\n"


def test_embed_fstring_1(capsys):

    def sample_2(x, y):
        return x + y

    def sample(x, y):
        return x + y

    # modifying sample_2 to add a print statement at the start of the code
    sample_2.__code__ = embed_fstring(sample.__code__, "{x}")
    assert sample_2(2, 1) == sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "2\n"


def test_embed_fstring_2(capsys):

    def sample_2(x, y):
        return x + y

    def sample(x, y):
        return x + y

    # modifying sample_2 to add a print statement at the start of the code
    sample_2.__code__ = embed_fstring(sample.__code__, "\{testing\}")
    assert sample_2(2, 1) == sample(2, 1)
    captured = capsys.readouterr()
    assert captured.out == "{testing}\n"
