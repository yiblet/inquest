from inquest.injection.ast_injector import TestStatement, insert


def empty_statement(lineno: int):
    return TestStatement(lineno)


def test_modify():
    # def test():
    #   return 'balalbal'
    #
    input_statement = TestStatement(
        1,
        [[empty_statement(2)]],
    )
    output = insert(input_statement, 1, empty_statement(1))
    assert output
    assert input_statement == TestStatement(
        1, [[
            empty_statement(1),
            empty_statement(2),
        ]]
    )


def test_simple_untiered_result():
    for statement in range(2, 50):
        input_statement = TestStatement(
            1,
            [[empty_statement(idx) for idx in range(2, 50)]],
        )
        output = insert(input_statement, statement, empty_statement(statement))
        assert output
        statements = [empty_statement(idx) for idx in range(2, 50)]
        statements.insert(statement - 2, empty_statement(statement))
        assert input_statement == TestStatement(1, [statements])


def test_simple_untiered_result_with_line_splits():
    for statement in range(2, 50, 2):
        input_statement = TestStatement(
            1,
            [[empty_statement(idx) for idx in range(2, 50, 2)]],
        )
        output = insert(input_statement, statement, empty_statement(statement))
        assert output
        statements = [empty_statement(idx) for idx in range(2, 50, 2)]
        statements.insert(statement // 2 - 1, empty_statement(statement))
        assert input_statement == TestStatement(1, [statements])

    for statement in range(2, 10, 3):
        input_statement = TestStatement(
            1,
            [[empty_statement(idx) for idx in range(2, 10, 2)]],
        )
        output = insert(input_statement, statement, empty_statement(statement))
        assert output
        statements = [empty_statement(idx) for idx in range(2, 10, 2)]
        statements.insert(statement // 2, empty_statement(statement))
        assert input_statement == TestStatement(1, [statements])


def test_outside_result():
    input_statement = TestStatement(
        1,
        [[empty_statement(idx) for idx in range(2, 50)]],
    )
    assert not insert(input_statement, 0, empty_statement(0))

    input_statement = TestStatement(
        1,
        [[empty_statement(idx) for idx in range(2, 50)]],
    )
    assert not insert(input_statement, 50, empty_statement(50))


def test_simple_tiered_result():
    for statement in range(2, 50):
        input_statement = TestStatement(
            1,
            [
                [
                    empty_statement(2),
                    empty_statement(3),
                    TestStatement(
                        4,
                        [[empty_statement(idx) for idx in range(5, 50)]],
                    ),
                    empty_statement(50),
                ]
            ],
        )
        output = insert(input_statement, statement, empty_statement(statement))
        assert output

        if statement < 4:
            statements = [
                empty_statement(2),
                empty_statement(3),
                TestStatement(
                    4,
                    [[empty_statement(idx) for idx in range(5, 50)]],
                ),
                empty_statement(50),
            ]
            statements.insert(statement - 2, empty_statement(statement))
        elif statement < 50:
            interior = [empty_statement(idx) for idx in range(5, 50)]
            statements = [
                empty_statement(2),
                empty_statement(3),
                TestStatement(
                    4,
                    [interior],
                ),
                empty_statement(50),
            ]
            interior.insert(statement - 4, empty_statement(statement))
        else:
            statements = [
                empty_statement(2),
                empty_statement(3),
                TestStatement(
                    4,
                    [[empty_statement(idx) for idx in range(5, 50)]],
                ),
                empty_statement(50),
                empty_statement(50),
            ]

        assert input_statement == TestStatement(1, [statements])
