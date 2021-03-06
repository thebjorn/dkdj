# -*- coding: utf-8 -*-
"""
Convenience functions to make csv writing code work on both Py2 and Py3.
"""

try:  # pragma: nocover
    from cStringIO import StringIO
    mkbuffer = lambda: StringIO()
    encode_csv = lambda x: x
    encode_rows = lambda rows: [[col.encode('latin-1', 'ignore') for col in row] for row in rows]
except ImportError:  # pragma: nocover
    from io import StringIO
    mkbuffer = lambda: StringIO(newline="")  # needed for cells with newlines
    encode_csv = lambda data: data.encode('latin-1', 'ignore')
    encode_rows = lambda x: x
import csv


def rows_to_csv_data(rows, delimiter=','):
    """Converts ``rows`` an array of arrays of Unicode strings
       to a latin-1 encoded byte string representing a csv file. 
    """
    buf = mkbuffer()
    writer = csv.writer(buf, delimiter=delimiter)
    rowdata = encode_rows(rows)
    writer.writerows(rowdata)
    return encode_csv(buf.getvalue())
