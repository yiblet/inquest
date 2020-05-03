import ast

import astor

from inquest.injection.ast_injector import ASTInjector, TestStatement, insert


def empty_statement(lineno: int):
    return TestStatement(lineno)


def test_modify():
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
    assert not insert(input_statement, 0, empty_statement(0))[0]

    input_statement = TestStatement(
        1,
        [[empty_statement(idx) for idx in range(2, 50)]],
    )
    assert not insert(input_statement, 50, empty_statement(50))[0]


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


def test_ast_injector():
    node = ast.parse(
        '''\
def test():
    return "hello"
                     '''
    )

    stmt = ast.parse('''\
print('hello')
    ''')

    injector = ASTInjector(node.body[0])
    injector.insert(1, stmt.body[0])
    node = injector.result()
    assert (
        astor.to_source(node)
    ) == '''\
def test():
    print('hello')
    return \'hello\'
'''


def test_ast_injector_for_loop():

    def assert_node(lineno, expected):
        node = ast.parse(
            '''\
def test():
    for x in range(20):
        print(x)
    return "hello"
'''
        )

        stmt = ast.parse('''\
print('hello')
''')

        injector = ASTInjector(node.body[0])
        injector.insert(lineno, stmt.body[0])
        node = injector.result()
        assert (astor.to_source(node)) == expected

    assert_node(
        2, '''\
def test():
    for x in range(20):
        print('hello')
        print(x)
    return \'hello\'
'''
    )

    assert_node(
        1, '''\
def test():
    print('hello')
    for x in range(20):
        print(x)
    return \'hello\'
'''
    )

    assert_node(
        3, '''\
def test():
    for x in range(20):
        print(x)
        print('hello')
    return \'hello\'
'''
    )

    assert_node(
        4, '''\
def test():
    for x in range(20):
        print(x)
    return \'hello\'
    print('hello')
'''
    )
