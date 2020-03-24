from .context import xray


def test_app(capsys, example_fixture):
    # pylint: disable=W0612,W0613
    xray.Blueprint.run()
    captured = capsys.readouterr()

    assert "Hello World..." in captured.out
