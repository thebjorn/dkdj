"""
A simple wrapper around an SQL select statement.
"""
from django.core.cache import cache

import ttcal


class SelectStmt(object):
    def __init__(self, select, from_, where="",
                 group_by="", order_by="", limit="", offset="", 
                 cached=False, cache_duration_hours=2, cache_duration_minutes=0):
        self.select = select
        self.from_ = from_
        self.where = where
        self.group_by = group_by
        self.order_by = order_by
        self.limit = limit
        self.offset = offset

        self.args = []
        self.columns = None
        self.cached = cached
        self.cache_duration_hours = cache_duration_hours
        self.cache_duration_minutes = cache_duration_minutes

    def __repr__(self):
        return "%s (%s)" % (self.get_sql(), self.args)

    def get_sql(self):
        sql = """
            select {me.select}
            from {me.from_}
        """.format(me=self)
        if self.where:
            sql += "\nwhere " + self.where
        if self.group_by:
            sql += "\ngroup by " + self.group_by
        if self.order_by:
            sql += "\norder by " + self.order_by
        if self.limit:
            sql += "\nlimit %s" % self.limit
        if self.offset:
            sql += "\noffset %s" % self.offset
        return sql
    
    def _execute(self, cursor, sql):
        cursor.execute(sql, self.args)
        self.columns = [d[:] for d in cursor.description]
        self.rowcount = cursor.rowcount
        return cursor.fetchall()

    def execute(self, cursor):
        sql = self.get_sql()
        if self.cached:
            key = "CachedSelectStmt_{}_{}".format(sql, self.args)
            res = cache.get(key)
            if res:
                object_list, self.columns, self.rowcount = res
            else:                
                object_list = self._execute(cursor, sql)   
                cache.set(
                    key,
                    (object_list, 
                        [d[:] for d in cursor.description], 
                        cursor.rowcount),
                    int(ttcal.Duration(
                        hours=self.cache_duration_hours, 
                        minutes=self.cache_duration_minutes).total_seconds()))
        else:            
            object_list = self._execute(cursor, sql)
        return object_list

    def add_from(self, from_):
        self.from_ += "\n" + from_

    def add_where(self, where, args=()):
        self.where += where
        self.args += args

    def set_range(self, start=None, end=None):
        if start is not None and start > 0:
            self.offset = start
        if end is not None:
            self.limit = end - start
