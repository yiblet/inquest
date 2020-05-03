import pandas as pd

from inquest.probe import TRACE_COLUMNS, diff_desired_set

from .probe_test import create_trace as create_trace_raw


def create_trace(key: str, loc=None):
    if loc is not None:
        return {
            "id": "%s" % key,
            "module": "module%s" % loc,
            "function": "function%s" % loc,
            "lineno": 2,
            "statement": "statement%s" % loc
        }

    return {
        "id": "%s" % key,
        "module": "mod%s" % key,
        "function": "function%s" % key,
        "lineno": 2,
        "statement": "statement%s" % key
    }


DEFAULT_SET = [
    create_trace("1"),
    create_trace('2'),
]


def create_trace_df(data):
    return pd.DataFrame(
        data,
        columns=TRACE_COLUMNS,
    )


def assert_diff(
    diff, desired_set_df, to_be_added, to_be_updated, to_be_removed
):
    assert all(
        diff.new_traces.set_index('id') == desired_set_df.set_index('id')
    )

    assert all(diff.to_be_added.set_index('id') == to_be_added.set_index('id'))
    assert all(
        diff.to_be_removed.set_index('id') == to_be_removed.set_index('id')
    )
    assert all(
        diff.to_be_updated.set_index('id') == to_be_updated.set_index('id')
    )


def test_diff_desired_set():
    trace_df = create_trace_df(DEFAULT_SET)
    desired_set_df = create_trace_df(
        [
            create_trace("2"),
            create_trace("3", loc="test"),
            create_trace("4", loc="test")
        ]
    )

    diff = diff_desired_set(trace_df, desired_set_df)
    to_be_added = create_trace_df(
        [
            create_trace("3", loc="test"),
            create_trace("4", loc="test"),
        ]
    )

    to_be_updated = create_trace_df([])

    to_be_removed = create_trace_df([
        create_trace("1"),
    ])
    assert_diff(
        diff,
        desired_set_df,
        to_be_added,
        to_be_updated,
        to_be_removed,
    )


def test_diff_desired_set_with_update():
    trace_df = create_trace_df(DEFAULT_SET)
    desired_set_df = create_trace_df([
        create_trace("2", loc="test"),
    ])

    diff = diff_desired_set(trace_df, desired_set_df)
    to_be_added = create_trace_df([])
    to_be_updated = create_trace_df([
        create_trace("2", loc="test"),
    ])

    to_be_removed = create_trace_df([
        create_trace("1"),
    ])
    assert_diff(
        diff,
        desired_set_df,
        to_be_added,
        to_be_updated,
        to_be_removed,
    )


def test_diff_desired_set_with_id_change():
    trace_df = create_trace_df([
        create_trace("3", loc="test"),
    ])
    desired_set_df = create_trace_df([
        create_trace("2", loc="test"),
    ])

    diff = diff_desired_set(trace_df, desired_set_df)
    to_be_added = create_trace_df([
        create_trace("2", loc="test"),
    ])
    to_be_updated = create_trace_df([])
    to_be_removed = create_trace_df([
        create_trace("3", loc="test"),
    ])
    assert_diff(
        diff,
        desired_set_df,
        to_be_added,
        to_be_updated,
        to_be_removed,
    )


def test_diff_desired_set_with_id_change_2():
    trace_df = create_trace_df(
        [
            create_trace_raw(
                '.probe_test_module.test_imported_module',
                'sample',
                '{arg2}',
                "3",
                2,
            )
        ]
    )

    desired_set_df = create_trace_df(
        [
            create_trace_raw(
                'inquest.test.probe_test_module.test_imported_module',
                'sample',
                '{arg2} haha',
                "3",
                2,
            )
        ]
    )

    diff = diff_desired_set(trace_df, desired_set_df)
    to_be_added = create_trace_df([])
    to_be_updated = create_trace_df(
        [
            create_trace_raw(
                'inquest.test.probe_test_module.test_imported_module',
                'sample',
                '{arg2} haha',
                "3",
                2,
            )
        ]
    )
    to_be_removed = create_trace_df([])
    assert_diff(
        diff,
        desired_set_df,
        to_be_added,
        to_be_updated,
        to_be_removed,
    )
