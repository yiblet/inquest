import pony.orm as pn

# pylint:disable=all

db = pn.Database()


class Probe(db.Entity):
    id = pn.PrimaryKey(int, auto=True)
    module = pn.Required(str)
    function = pn.Required(str)
    emitting = pn.Required(bool)
    pn.composite_index(module, function)
