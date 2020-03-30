import random
import string

import graphene as gp
import pony.orm as pn
import uvicorn
from starlette.applications import Starlette
from starlette.graphql import GraphQLApp
from starlette.routing import Route

import model as m


class Probe(gp.ObjectType):
    id = gp.ID()
    module = gp.String()
    function = gp.String()
    emitting = gp.Boolean()


# pylint: disable=all
class Query(gp.ObjectType):
    # this defines a Field `hello` in our Schema with a single Argument `name`
    probes = gp.Field(gp.List(gp.NonNull(Probe)))

    # our Resolver method takes the GraphQL context (root, info) as well as
    # Argument (name) for the Field and returns data for the query Response
    def resolve_probes(self, info):
        res = []
        with pn.db_session:
            for probe in pn.select(p for p in m.Probe).order_by(
                    m.Probe.module):
                res.append(
                    Probe(
                        id=str(probe.id),
                        module=probe.module,
                        function=probe.function,
                        emitting=probe.emitting,
                    ))
        return res


ROUTES = [Route(
    "/",
    GraphQLApp(schema=gp.Schema(query=Query),),
)]


def randomword(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))


def main():
    dir = 'tmp'
    m.db.bind(provider='sqlite',
              filename=f'/{dir}/inquest_{randomword(10)}.sqlite3',
              create_db=True)
    m.db.generate_mapping(check_tables=True, create_tables=True)
    app = Starlette(routes=ROUTES)
    uvicorn.run(app, host="127.0.0.1", port=3000, log_level="info")


if __name__ == "__main__":
    main()
