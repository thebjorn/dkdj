# -*- coding: utf-8 -*-

"""CBV helper classes.
"""
import inspect
import sys

from django import http
from django.db import connection
from django.views.generic import View
from . import grid
from dkjason import jason


class CORSView(View):
    """CBV that understands CORS preflight rules.
    """
    # CORS parameters (override in your subclass)
    ALLOW_ORIGIN = '*'  # set to None to disallow CORS.
    ALLOW_METHODS = ['POST', 'GET', 'OPTIONS']
    MAX_AGE = None  # set to number of seconds
    ALLOW_HEADERS = [
        'origin', 'x-csrftoken', 'x-dkjs', 'x-dkdj', 'content-type', 'accept'
    ]

    def __init__(self, *args, **kwargs):
        self.origin = None  # local call
        super(CORSView, self).__init__(**kwargs)

    def _is_cors(self, request):
        return 'HTTP_ORIGIN' in request.META

    def _preflight_response(self):
        """Create an HttpResponse with preflight headers.
        """
        r = http.HttpResponse()
        r['Access-Control-Allow-Methods'] = ', '.join(self.ALLOW_METHODS)
        r['Access-Control-Allow-Headers'] = ', '.join(self.ALLOW_HEADERS)
        if self.MAX_AGE is not None:
            r['Access-Control-Max-Age'] = self.MAX_AGE
        return r

    def _cors_response(self, request, response):
        """Add required headers to cors responses.
        """
        if self._is_cors(request):
            response['Access-Control-Allow-Origin'] = request.META['HTTP_ORIGIN']
            # are cookies allowed?
            response['Access-Control-Allow-Credentials'] = 'true'
        return response

    def _is_valid_preflight(self, request):
        """Return true if this is a preflight request, assumes _is_cors()
           has been called.
        """
        if request.method == 'OPTIONS':
            if 'HTTP_ACCESS_CONTROL_REQUEST_METHOD' not in request.META:
                return False
            cors_method = request.META['HTTP_ACCESS_CONTROL_REQUEST_METHOD']
            if cors_method not in self.ALLOW_METHODS:
                # not valid (allowed) preflight request.
                return False
            if 'HTTP_ACCESS_CONTROL_REQUEST_HEADER' in request.META:
                cors_header = set(
                    t.strip() for t in
                    request.META['HTTP_ACCESS_CONTROL_REQUEST_HEADER'].split(',')
                )
                if cors_header - set(self.ALLOW_HEADERS):
                    # NOT VALID HEADERS => NOT VALID PREFLIGHT REQUEST
                    return False
            return True
        return False

    def _load_json(self, request):
        """Loads any received json data into `request.json`.
        """
        if request.META.get('CONTENT_TYPE', '').startswith('application/json'):
            body = request.body
            request.json = jason.loads(body.decode('u8'))
        else:
            request.json = {}
        params = {}
        params.update(request.GET)
        params.update(request.POST)
        for k, v in params.items():
            if isinstance(v, list) and len(v) == 1:
                params[k] = v[0]
        # print("dkdj.views:PARAMS:", params)
        request.dkargs = params

    def call_method(self, request, *args, **kwargs):
        """Try to dispatch to the right method; if a method doesn't exist,
           defer to the error handler. Also defer to the error handler if the
           request method isn't on the approved list.

           This algorithm is the same as Django's View CBV class.
           You need to override this if you need to find methods based on
           something other than http verbs (get/post/put/delete/etc.)
        """
        action = request.method.lower()
        if action in self.http_method_names:
            handler = getattr(self, action, self.http_method_not_allowed)
        else:
            handler = self.http_method_not_allowed
        return handler(request, *args, **kwargs)

    def dispatch(self, request, *args, **kwargs):
        """Issue preflight response if required, or proceed per normal.
        """
        if self._is_cors(request) and self._is_valid_preflight(request):
            return self._cors_response(request, self._preflight_response())

        self._load_json(request)

        # this can raise 404s etc. which we need to let through..
        response = self.call_method(request, *args, **kwargs)
        return self._cors_response(request, response)


def _call_view_method(m, request, args, kwargs, argmap=None):
    if argmap is None:  # pragma: nocover
        argmap = {}
    if sys.version_info.major == 2:     # pragma: nocover
        argspec = inspect.getargspec(m)
    else:                               # pragma: nocover
        argspec = inspect.ArgSpec(*inspect.getfullargspec(m)[:4])
    # argspec.args      list of argument names (potentially nested)
    # argspec.varargs   name of * argument (or None)
    # argspec.keywords  name of ** argument (or None)
    # argspec.defaults  tuple of default argument values (or None)
    #                   corresponding to the n last elements of .args
    defaults = {}
    if argspec.defaults:
        defaults = dict(zip(argspec.args[-len(argspec.defaults):],
                            argspec.defaults))

    _args = []
    _kw = {}
    _argspec_args = argspec.args[2:]  # remove self and request

    if args:
        # pass positional parameters given to us through
        _args += list(args)
        # skip the parameters we've matched
        _argspec_args = _argspec_args[len(args):]

    for argname in _argspec_args:
        if argname in kwargs:
            _args.append(kwargs.pop(argname))
        elif argname in argmap and argmap[argname] in kwargs:
            _args.append(kwargs.pop(argmap[argname]))
        elif argname in defaults:
            _args.append(defaults[argname])
        else:
            raise TypeError("%s expected parameter %s" % (m.__name__, argname))

    if argspec.keywords is not None and kwargs:
        _kw.update(kwargs)

    # print "CMD:", m, m.__name__
    # print "ARGS:", args, _args
    # print "KWAS:", kwargs, _kw
    # print "MEMBERS:", inspect.getargspec(m)
    # print "calling: %s(request, %s, %s)" % (m.__name__, _args, _kw)

    return m(request, *_args, **_kw)


class SubcommandView(CORSView):
    """Parse and dispatch to !sub-commands.
    """
    #: map function parameters to captured url-parameters with different names.
    ARGMAP = {}

    def call_method(self, request, *args, **kwargs):
        """Look at the path to figure out which method to call or return 404.
        """
        try:
            cmd = request.path.split('!')[1].replace('-', '_')
        except IndexError:
            if hasattr(self, 'index'):
                m = self.index
                return _call_view_method(m, request, args, kwargs, self.ARGMAP)
            # no sub-command present
            raise http.Http404("No sub-command: %r" % request.path)
        else:
            if hasattr(self, cmd):
                m = getattr(self, cmd)
                return _call_view_method(m, request, args, kwargs, self.ARGMAP)
            else:
                raise http.Http404("I don't understand sub-command: %r" % cmd)


class GridView(SubcommandView):
    """Convenience class documenting the server interface of
       ``dk.data.AjaxDataSource``.
    """

    def __init__(self, *args, **kwargs):
        super(GridView, self).__init__(*args, **kwargs)
        self.fmt = 'json'  # default return formt is json.

    def get_filter_values(self, request, *args, **kwargs):
        """You should implement `get_foo_filter_values` methods for
           each filter you specify that needs dynamic values.
        """
        filter_name = request.json.get('name')
        if not filter_name:
            return jason.response(request, None)

        filter_getter = 'get_%s_filter_values' % filter_name
        val = getattr(self, filter_getter)(request, *args, **kwargs)
        return jason.response(request, dict(options=val))
        # return jason.response(request, val)

    def get_grid(self, request, *args, **kwargs):
        """Should return a filled out Grid object
        
           ::

               return dkdj.grid.Grid(
                    cols=cols,
                    rows=rows,
                    info=info
               )
               
        """
        return grid.Grid()  # you should override this one..!

    def get_json_format(self, request, gridval):
        """Return a json or jsonp response.
        """
        try:
            return jason.response(request, gridval)
        except ValueError as e:
            # to make debugging easier (gridval.__repr__ calls json.dumps, so 
            # we can't just print the value)
            rows = gridval.rows
            cols = gridval.cols
            info = gridval.info
            print("GRIDVAL:", gridval.rows, gridval.cols, gridval.info)
            raise

    def csv_grid(self, gridval):
        """Override this method and convert gridval to a new Grid object
           containing csv-useable data.
        """
        return gridval

    def get_csv_format(self, request, gridval):
        """Return a .csv file.
        """
        response = http.HttpResponse(content_type='text/csv')
        filename = request.dkargs.get('filename', 'download')
        if not filename.endswith('.csv'):
            filename += '.csv'
        contentdisp = 'attachment; filename=%s' % filename
        response['Content-Disposition'] = contentdisp
        # is there any way to check for which version of .csv the user's
        # Office package understand..?
        delimiter = request.dkargs.get('delimiter', ';')
        # delimiter = ',' if request.user.username == 'bjorn' else ';'
        csvgrid = self.csv_grid(gridval)
        binary_csv_data = csvgrid.csv_binary_data(delimiter)
        response.write(binary_csv_data)
        return response

    def get_records(self, request, *args, **kwargs):
        self.fmt = request.dkargs.get('fmt', 'json')
        records = _call_view_method(self.get_grid, request, args, kwargs)
        # records = self.get_grid(request, *args, **kwargs)
        return getattr(self, 'get_%s_format' % self.fmt)(request, records)


class Resultset(GridView):
    """A Resultset view superclass.
    """

    # parameter names
    SORT = 's'
    SEARCH = 'q'
    START = 'start'
    END = 'end'
    FILTER = 'ft'

    def _params(self, request):
        """Extract parameters from kw (request.GET or something similar).
        """
        kw = request.json

        if not kw:
            kw = jason.loads(request.GET.get('state', "{}"))

        sort_params = kw.get(Resultset.SORT, getattr(self, 'default_sort', ''))

        def direction(p):
            if p.startswith('-'):
                return 'desc'
            return 'asc'

        def field(p):
            if p.startswith('-'):
                return p[1:]
            return p

        sort_params = [(direction(p), field(p)) for p in sort_params.split(',')]

        res = dict(
            sort=sort_params,
            search=kw.get(Resultset.SEARCH, ''),
            filter=kw.get(Resultset.FILTER, {}),
            start=int(kw.get(Resultset.START, '0')),
            end=kw.get(Resultset.END),
        )
        if res['end']:
            res['end'] = int(res['end'])

        # print "PARAMS:", res
        return res

    def get_queryset(self, request, *args, **kwargs):  # pragma: nocover
        pass  # must override

    def get_columns(self, request, qs, object_list):
        """qs is the original query set (returned from get_queryset),
           object_list is the final result.

           (SHOULD override...?)
        """
        return []

    def _get_columns(self, request, qs, object_list):
        if not hasattr(self, '_columns') or object_list:
            self._column = {}
            res = []
            col_list = self.get_columns(request, qs, object_list)
            if col_list is None:  # pragma: nocover
                raise SyntaxError("you must return the columns from get_columns(...)")
            for c in col_list:
                if getattr(c, 'is_wrapper', inspect.isclass(c)):
                    col = c()
                else:
                    if inspect.isfunction(c):
                        raise SyntaxError(f"You have defined a column as a function, it needs to be a class! {c}")
                    col = c
                res.append(col)
                self._column[col.name] = col
            self._columns = res
        return self._columns

    def get_item_key(self, item):
        "Return the row's (ie. item's), key-field (aka primary key)."
        return item.pk

    # def get_object_list(self, request): pass

    def run_default(self, request, args):  # pragma: nocover
        # return http.HttpResponse("You must supply a command..")
        return jason.response(request, {
            'error': 'You must supply a command',
        })

    def run_query(self, qs, params):
        qs_orig = qs
        info = {
            'totcount': qs.count()
        }
        qs = self.do_filter(qs, params['filter'])
        qs = self.do_search(qs, params['search'])        
        info['filter_count'] = info['totcount'] if qs_orig == qs else qs.count()
        qs = self.do_sort(qs, params['sort'])
        qs = qs[params['start']:params['end']]
        object_list = list(qs)
        info['start_recnum'] = params['start'] + 1  # 1-based
        info['end_recnum'] = params['start'] + 1 + len(object_list)
        return object_list, info

    def get_grid(self, request, *args, **kwargs):
        qs = _call_view_method(self.get_queryset, request, args, kwargs, self.ARGMAP)
        # qs = self.get_queryset(request, *args, **kwargs)
        self._get_columns(request, qs, [])
        # get object list (run filters etc.)
        object_list, info = self.run_query(qs, self._params(request))
        # get column list
        cols = self._get_columns(request, qs, object_list)
        # extract columns from object list
        rows = []
        for item in object_list:
            row = grid.Row(
                self.get_item_key(item),
                [col.value(item) for col in cols]
            )
            rows.append(row)

        return grid.Grid(
            cols=cols,
            rows=rows,
            info=info
        )

    def do_filter(self, qs, terms):
        "Overridable in subclasses."
        return qs

    def do_search(self, qs, terms):
        "Overridable in subclasses."
        return qs

    def do_sort(self, qs, terms):
        "Overridable in subclasses."
        if not terms: return qs

        column = self._column

        def term(direction_field):
            direction, field = direction_field
            if not field: return None
            field = column[field].sort_field
            return field if direction == 'asc' else '-' + field

        terms = ','.join(filter(None, [term(t) for t in terms])) # pylint:disable=bad-builtin
        if not terms:
            return qs
        return qs.order_by(terms)


class SqlGrid(Resultset):
    """A 'primitive' resultset for values derived directly from a sql query.
    """
    def get_sql_query(self, request, *args, **kwargs):  # pragma: nocover
        """Override this.
        """
        raise NotImplementedError

    def do_filter(self, sql, terms):
        return sql

    def do_sort(self, sql, terms):
        return sql

    def get_grid(self, request, *args, **kwargs):
        sql = _call_view_method(self.get_sql_query, request, args, kwargs, self.ARGMAP)
        object_list, info = self.run_query(sql, self._params(request))
        cols = self._get_columns(request, sql, [])

        rows = []
        for i, rec in enumerate(object_list):
            row = grid.Row(i, rec)
            rows.append(row)

        return grid.Grid(
            cols=cols,
            rows=rows,
            info=info
        )

    def _get_columns(self, request, sql, object_list):
        if not hasattr(self, '_columns'):
            self._column = {}
            res = []
            for c in sql.columns:
                col = grid.Column(
                    name=c[0],
                    sortable=False,
                    datatype='varchar'
                )
                res.append(col)
                self._column[col.name] = col
            self._columns = res
        return self._columns

        # if not hasattr(self, '_columns') or object_list:
        #     self._column = {}
        #     res = []
        #     col_list = self.get_columns(request, sql, object_list)
        #     for c in col_list:
        #         if getattr(c, 'is_wrapper', inspect.isclass(c)):
        #             col = c()
        #         else:
        #             col = c
        #         res.append(col)
        #         self._column[col.name] = col
        #     self._columns = res
        # return self._columns

    def run_query(self, sql, params):
        sql = self.do_filter(sql, params['filter'])
        sql = self.do_search(sql, params['search'])
        sql = self.do_sort(sql, params['sort'])
        sql.set_range(params['start'], params['end'])
        with connection.cursor() as c:
            object_list = sql.execute(c)

        info = {'totcount': len(object_list)}
        info['filter_count'] = len(object_list)
        info['start_recnum'] = params['start'] + 1  # 1-based
        info['end_recnum'] = params['start'] + 1 + len(object_list)

        return object_list, info


class ModelGrid(Resultset):
    model = None
    columns = None

    def get_queryset(self, request, *args, **kwargs):
        """The default implementation loads all rows (should probably be
           overriden).
        """
        return self.model.objects.all()

    def get_columns(self, request, qs, object_list):
        """qs is the original query set (returned from get_queryset),
           object_list is the final result.
           SHOULD be overridden!
        """
        if self.model is None:
            raise ValueError("Modelgrid doesn't declare a model..")
        if self.columns is not None:
            if len(self.columns) != len(set(self.columns)):
                raise ValueError(f"Duplicated columns detected: {self.columns}")
            
            cols = grid.Model(self.model).column
            return [getattr(cols, col) for col in self.columns]
        return grid.Model(self.model).column.all()


class PusherModelGrid(ModelGrid):
    """A resultset that can get initial data from a model and have 
       fields/records updated by listening to a pusher-channel.
       
       **How to use**
       
       Create a pusher-channel and set the app-id, key and secret in dkpw.
       Identify what should cause the grid to update and add the following
       code to the place that triggers that action.
       Initialize a channel_client::

                import pusher
                channels_client = pusher.Pusher(
                    app_id=dkpw.get('PUSHER_PROCTOR_APP_ID'),
                    key=dkpw.get('PUSHER_PROCTOR_KEY'),
                    secret=dkpw.get('PUSHER_PROCTOR_SECRET'),
                    cluster='eu',
                    ssl=True
                )
                    
       Trigger a message to be sent on the channel::

                channels_client.trigger(<<name_of_the_channel>>, '<<message_name>>', {
                    << json_data >>,
                })
            
       **message_names that are supported**
       
       **change:** Change specified fields on a given record (by pk).
       
       example json::

                {
                    'id': 233332
                    'fields': [{
                        'fieldname': 'status',
                        'value': 'logged-in'
                    },
                    {
                        'fieldname': 'change_datetime',
                            'value': '2021-06-20 10:22:00'
                    }]
                }
                
       **new:** A new record is added and should be fetch from the db and
       put into the grid at the correct location according to the
       given sort.
       example json::

                {
                    'id': 233331
                } 

       **delete:** Remove a row from the grid.
       example json::

                {
                    'id': 233331
                }

       **reload:** Reload the whole datasource.
       example json::

                {}
       
       reload_record -> Reload only the record that matches the id.
       example json::

                {
                    'id': 233331
                } 

    """
