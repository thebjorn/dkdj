# -*- coding: utf-8 -*-
"""Resource classes to marshal grid data.
"""
# pylint: disable=too-few-public-methods
import pprint
import datetime

from .csvdata import rows_to_csv_data
import bleach
       
from django.db.models.fields import FieldDoesNotExist
from dkjason import jason

try:
    unicode
except NameError:
    unicode = str  # pylint:disable=redefined-builtin


# 
# 
# def _get_all_field_names(model):
#     try:
#         return model._meta.get_all_field_names()
#     except AttributeError:
#         return [f.name for f in model._meta.get_fields()]


class ColumnGetter(object):

    def __get__(self, instance, owner):
        if instance is None:
            raise Exception("ColumnGetter is an instance descriptor.")
        self._instance = instance
        return self

    def all(self):
        return list(self)

    def __iter__(self):
        for fname in _get_all_field_names(self._instance.model):
            yield getattr(self, fname)

    def __getattr__(self, colname):
        if colname.startswith('_'):
            return object.__getattribute__(self, colname)

        def wrapper(**overrides):
            return _ModelFieldColumn(self._instance.model, colname, **overrides)
        wrapper.is_wrapper = True
        wrapper.__name__ = 'wrapper_ModelFieldColumn[%r, %r]' % (
            self._instance.model, colname
        )

        return wrapper


class Model(object):
    """Wrapper around a django model to extract e.g. column data.

       Usage::

            def get_columns(self, ...):
                column = grid.Model(MyModel).column
                return [
                    column.a,
                    column.b(label="BB"),
                    ...
                ]
    """
    column = ColumnGetter()

    def __init__(self, model):
        self.model = model


class Column(object):
    """A column in a `Grid`.
    """
    name = ''
    label = ''
    sortable = None
    sort_field = None
    widget = None           # dkdj widget type
    data = None             # data for the widget
    url = None              # url datasource for the widget
    datatype = None
    _pos = 0

    def __init__(self, *args, **kw):
        # need to assign to self.xx to get attributes into self.__dict__,
        # which we use for json conversion.
        if args:
            kw['name'] = args[0]
        self.name = self.name or kw.get('name') or self.__class__.__name__
        self.label = self.label or kw.get('label') or self.name.title()
        self.sortable = self.sortable
        if self.sortable is None:
            self.sortable = kw.get('sortable', True)
        if self.sortable:
            if self.sort_field is None:
                self.sort_field = kw.get('sort_field', self.name)
        self.datatype = self.datatype or kw.get('datatype') or 'text'
        self.widget = self.widget or kw.get('widget') or (
            self.datatype.title() + 'Widget')
        self.data = self.data or kw.get('data')
        self.url = self.url or kw.get('url')

    def __repr__(self):
        return 'Column(**%s)' % pprint.pformat(self.__json__())

    def _value(self, item):
        "Private interface to value()"
        return self.value(item)

    def value(self, item):
        """Should be overriden in sub-classes to provide the value for this
           column for the row based on `item`.  The default implementation
           gets the attribute from item based on our class name, ie. if the
           column sub-class is::

               class work(ColumnResource):
                   ...

           then the default `value()` implementation will return `item.work`.
        """
        return getattr(item, self.name)

    def __json__(self):
        res = {}
        res.update(self.__dict__)
        res['type'] = res['datatype']
        del res['datatype']
        return res


def _hasattrs(obj, *attrs):
    return all(hasattr(obj, attr) for attr in attrs)


class _ModelFieldColumn(Column):
    """Create a column resource from a field on a model. Use from Model above.
    """
    TYPES = {
        'varchar': 'Text',
        'positiveinteger': 'Int',

    }

    def __init__(self, model, field_name, **overrides):
        self.name = field_name
            
        try:
            field = self._get_field(model, field_name)
        except FieldDoesNotExist:
            self.label = field_name
            self.datatype = None
        else:
            has_verbose = hasattr(field, 'verbose_name') 
            self.label = field.verbose_name if has_verbose else field_name
            self.datatype = self._get_datatype(field)
            # self.widget = ???

            if _hasattrs(field, 'rel', 'get_choices') and field.rel:
                self.data = field.get_choices()
            for k, v in overrides.items():
                setattr(self, k, v)
        super(_ModelFieldColumn, self).__init__()
        
    def _get_field(self, model, name):
        return model._meta.get_field(name)
        # try:
        #     field, _model, _direct, _m2m = model._meta.get_field_by_name(name)
        #     return field
        # except AttributeError:
        #     return model._meta.get_field(name)

    def _get_datatype(self, django_field):
        try:
            ftype = django_field.get_internal_type()
        except AttributeError:
            return 'text'
        else:
            if ftype.endswith('Field'):
                ftype = ftype[:-len('Field')]
            if 'varchar' in ftype.lower():
                ftype = 'text'
            if 'integer' in ftype.lower():
                ftype = 'int'
            return {
                'ForeignKey': 'SelectWidget',
            }.get(ftype, ftype)


class Row(object):
    """A row in a `Grid`.
    """

    def __init__(self, key=None, cells=None):
        self.key = key
        self.cells = cells or []

    def __repr__(self):
        return f'Row({self.cells})'

    def __getitem__(self, n):
        return self.cells[n].value

    def value(self, column):
        return self.cells[column._pos].value

    def sortvalue(self, column):
        """Return a sortable value (some Python types cannot be compared
           to None anymore).
        """
        val = self.value(column)

        if val is None:
            dtype = column.datatype
            if dtype == 'datetime':
                return datetime.datetime(1, 1, 1, 0, 0, 0)
            if dtype == 'date':
                return datetime.date(1, 1, 1)

        return val  # give up and hope for the best..?

    def __json__(self):
        return dict(k=self.key, c=self.cells)
    
    def unicode_cells(self):
        resrow = []
        for cell in self.cells:
            if hasattr(cell, 'fmt'):
                val = bleach.clean(cell.fmt, strip=True).strip()
            else:
                val = cell
            if isinstance(val, datetime.datetime):
                val = val.strftime("%Y.%m.%d %H:%M:%S")
            if val is None:
                val = ''
            if isinstance(val, object):
                try:
                    val = unicode(val)  # assume everything is kosher
                except:
                    # revert to something working but ugly..
                    # val = unicode(repr(val), 'utf-8')
                    val = u''
            resrow.append(val)
        return resrow


class Value(object):
    def __init__(self, val=None, fmt=None):
        self.value = val
        self.fmtval = fmt

    @property
    def sortval(self):
        """Value used for sorting on a column.
        """
        if self.value is not None:
            return self.value

    @property
    def fmt(self):
        if self.fmtval is not None:
            return self.fmtval
        else:
            return unicode(self.value or "")
        # return self.fmtval if self.fmtval is not None
        #                    else unicode(self.value or "")

    def __json__(self):
        res = dict(v=self.value)
        if self.fmtval is not None:
            res['f'] = self.fmtval
        return res


class Grid(object):
    """Grid is the server side version of a dk.data.DataSource.

       It is important to note that this is not a query set, or a result set,
       or a list of model instances -- although all of those can be the data
       source for the `GridDataResource`.  This has the advantage that it makes
       it much easier to provide grid data for joins, calculated columns, and
       data that doesn't come from a database.

    """

    def __init__(self, cols=None, rows=None, info=None):
        self.cols = cols or []
        self.rows = rows or []
        self.info = info
        self._colpos = {}
        for i, col in enumerate(self.cols):
            self._colpos[col.name] = i
            col._pos = i

    def sort(self, *keys):
        for key in reversed(keys):
            reverse = False
            if key.startswith('-'):
                key = key[1:]
                reverse = True
            pos = self._colpos[key]
            col = self.cols[pos]

            def rowkey(r):
                return r.sortvalue(col)

            self.rows.sort(key=rowkey, reverse=reverse)

    def __json__(self):
        return self.to_json()

    def to_json(self):
        return {
            'rows': self.rows,
            'cols': self.cols,
            'info': self.info
        }
    
    def csv_binary_data(self, delimiter=','):
        rows = []
        rows += [[col.label for col in self.cols]]  # header
        rows += [row.unicode_cells() for row in self.rows]
        return rows_to_csv_data(rows, delimiter)

    def write_csv(self, fp, delimiter=','):
        """Write comma separated values to the file-like object `fp`.
           `fp` must support the writing of binary data.
        """
        data = self.csv_binary_data(delimiter)
        fp.write(data)
        return fp

    def __repr__(self):
        return jason.dumps(self)
