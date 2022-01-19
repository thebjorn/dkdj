
import dk from "../dk-obj";
import {DataPage} from "./dk-datapage";
import Class from "../lifecycle/coldboot/dk-class";
import {DataQuery} from "./dk-dataquery";
import {ArraySource} from "./source/dk-array-datasource";
import {is_ajax_url} from "../lifecycle/uri";
import {AjaxDataSource} from "./source/dk-ajax-datasource";
import {ValueRef} from "./source/dk-datasource-base";


/*
 *  A DataSet is an abstract paged collection of data items.
 *
 *  A DataSet can provide a conrete DataPage (i.e. a list of
 *  records to be displayed).
 *
 *  The purpose of a DataSet is to provide such
 *  a DataPage by querying the underlying data source.
 *
 *  DataSet -> DataPage -> (data) Record -> (data) Field) -> (data) FieldValue
 */
export class DataSet extends Class {
    constructor(props) {
        if (props == null) props = {};
        if (Array.isArray(props.datasource)) props.datasource = new ArraySource(props.datasource);
        if (is_ajax_url(props.datasource)) props.datasource = new AjaxDataSource({url: props.datasource});
        super(Object.assign({
            // type: 'dk.data.Data',
            datasource: null,
            pages: null,            // dict[query -> page]
            page: null,             // current page

            pagenum: 0,             // current page number
            totpages: 0,            // total number of pages

            pagesize: 25,
            orphans: 0,
            
            savestate: true,
            
        }, props));
        
        this.datasource.live_data = this;
        this._first_fetch = true;
        this.pages = {};
        this._filter_data = {};

        // catch-and-resend signals from the datasource
        // (we do this so the widgets don't have to reach into
        // the innards of dataset).
        /*
            The update field message has the following format:
        
                 {
                    'id': 233332
                    'fields': [
                        {
                            'fieldname': 'status',
                            'value': 'logged-in'
                        }*
                    ]
                }
         */
        dk.on(this.datasource, 'update-record', (pk, fields) => this.update_record(pk, fields));
        dk.on(this.datasource, 'reload-all', data => this.reload_all());
        dk.on(this.datasource, 'reload-record', (pk) => this.get_record(pk));
    }
    
    get_record(pk) {
        const record = this.page.get_record(pk);
        dk.trigger(record, 'updated', []);
        return record;
    }

    /*
    Implementation for update_/set_field_value.
     */
    change_field_value(pk, field_name, newval) {
        const record = this.get_record(pk);
        record[field_name] = newval;
        return record;
    }

    reload_all() {
        this.pages = {};
        this.get_page();
    }
    
    /*
    Update the field value, and signal that it was updated.
    Intended for datasources that automagically changes values.
     */
    update_record(pk, fields) {
        const record = this.get_record(pk);
        if(record) {
            fields.forEach(({fieldname, value}) => record[fieldname] = value);
            dk.trigger(record, 'updated', fields);
        }
    }
    delete_record(pk) {
        const record = this.get_record(pk);
        dk.trigger(record, 'deleted', pk);
    }
    
    /*
    Set a new field value based on user input. Adds the record/field to the dirty set.
     */
    set_field_value(pk, field_name, newval) {
        const record = this.change_field_value(pk, field_name, newval);
        dk.trigger(record, 'change', field_name, newval);
        const field = this.page.get_field(field_name);
        this.page.add_dirty(pk, field, newval);

        // NOTE: it is up to the application to call this.update() - most 
        //       likely after one or more rows have finished changing.
        // console.log("SET_FIELD_VALUE:PAGE>DIRTYSET:", this.page.dirtyset);
    }
    
    get_field_value(pk, field) {
        return this.get_record(pk)[field];
    }
    
    value_ref({pk, field}) { 
        const vref = new ValueRef(pk, field);
        const get_value = (page) => page ? page.get_record(pk)[field] : null;
        vref.value = get_value(this.page);
        dk.on(this, 'fetch-data', (self, page) => vref.value = get_value(page));
        dk.on(vref, 'value-changed', val => this.set_field_value(pk, field, val));
        return vref;
    }
    
    // synchronize dirty elements on page to datasource.
    update() {
        this.pages = {};  // clear cache
        // this.page.update(this.datasource, this.FN('_new_recordset'));
        this.page.update(this.datasource, (...args) => this._new_recordset(...args));
        // this.page.update(this.datasource, function (recordset) {
        //     self._new_recordset(self._get_records(null, recordset));
        // });
    }

    /**
     * Gets the current state
     * @param query  - a DataQuery instance
     * @returns {*}  - a DataQuery instance
     */
    get_state(query) {
        if (!this.datasource.url || !this.savestate) return query;
        return DataQuery.create(dk.hash.get(this.datasource.url, query.copy()), this);
    }

    set_state(query) {
        if (this.datasource.url && this.savestate) {
            dk.hash[this.datasource.url] = query.copy();
        }
    }
    
    /**
     * _new_recordset is the callback handler for this.datasource.get_records().
     * 
     * @param recordset
     * @param query
     * @private
     */
    _new_recordset(recordset, query) {
        // console.log("_NEW_RECORDSET:QUERY:", query.toCacheKey());
        const page = DataPage.create({
            query: query,
            recordset: recordset
        });
        if (recordset.meta) {
            const m = recordset.meta;
            //dk.dir('query', query);
            if (m.totcount === undefined && m.filter_count === undefined) {
                m.totcount = 0;
                m.filter_count = 0;
            }
            if (m.totcount && m.filter_count === undefined) m.filter_count = m.totcount;
            if (m.pagecount === undefined && m.filter_count === 0) {
                m.pagecount = 0;
            } else if (m.filter_count !== undefined && !m.pagecount) {
                m.pagecount = Math.max(1, Math.floor(m.filter_count / query.pagesize));
                if (m.filter_count > query.pagesize && m.filter_count % query.pagesize > query.orphans) {
                    ++m.pagecount;
                }
            }
        }
        dk.on(page, 'dirty', (...args) => this.update(...args));
        // console.log("_NEW_RECORDSET:setting page")
        this.page = this.pages[query.toCacheKey()] = page;
        dk.trigger(this, 'fetch-info', page.recordset.meta, query);
        dk.trigger(this, 'fetch-data', this, page);
    }

    get_page(query) {
        query = DataQuery.create(query, this);
        // console.info("DATASET:GET:PAGE:QUERY:", this._first_fetch, query);
        if (this._first_fetch) {
            query = this.get_state(query);
            this._first_fetch = false;
        } else {
            this.set_state(query);
        }
        // console.info("DATASET:GET:PAGE:QUERY:2", this._first_fetch, query);
        
        // dk.dir("GET-PAGE:", query.copy());
        dk.trigger(this, 'fetch-data-start');

        // console.log("GET:PAGE:QUERY:", query);
        // console.log("GET:PAGE:QUERY:TOSTRING:JSON:", query.toString());
        // console.log("GET:PAGE:QUERY:TOGETPARAMS", query.toGetParams());
        // console.log("GET:PAGE:QUERY:axdata", query._axdata());
        // console.log("GET:PAGE:QUERY:TOCACHEKEY", query.toCacheKey());
        const key = query.toCacheKey();
        if (!this.pages[key]) {
            // dk.info("GET-PAGE... NOT cached!");
            this.datasource.get_records(query, recordset => {
                // _new_recordset sets this.page
                this._new_recordset(recordset, query);
            });
        } else {
            // dk.info("GET-PAGE... cached!");
            // console.log("GET_PAGE:setting page")
            this.page = this.pages[key];
            dk.trigger(this, 'fetch-info', this.page.recordset.meta, query);
            dk.trigger(this, 'fetch-data', this, this.page);
        }
    }

    _current_query() {
        if (this.page) return this.page.query.copy();
        return {};
    }

    /*
     *  Fetch page number `n` (zero-based).
     */
    get_pagenum(n) {
        const query = this._current_query();
        query.pagenum = n;
        this.get_page(query);
    }

    set_search(terms) {
        const query = this._current_query();
        query.search = terms;
        query.pagenum = 0;
        this.get_page(query);
    }

    set_sort(fieldname, direction) {
        const query = this._current_query();
        const newsort = {field: fieldname, direction: direction};
        query.sort = [newsort];
        query.pagenum = 0;
        this.get_page(query);
    }

    get_filter_data(filter_name, returns) {
        // get data needed to display filter with name `filter_name`
        if (this._filter_data[filter_name]) {
            returns(this._filter_data[filter_name]);
        } else {
            this.datasource.get_filter_data(filter_name, opts => {
                returns(opts);
            });
        }
    }

    set_filter(vals) {
        const query = this._current_query();
        query.filter = vals;
        query.pagenum = 0;
        this.get_page(query);
    }

    fetch_csv(filename) {
        let query = this._current_query();
        query.pagesize = 50000;
        query = DataQuery.create(query, this);
        if (dk.$('#downloadFile').length) {
            dk.$('#downloadFile').remove();
        }
        const url = this.datasource.url+"!get-records?fmt=csv&filename="+ filename + '&' + query.toGetParams();
        dk.$('<a/>')
            .attr('id','downloadFile')
            .attr('href',url)
            .attr('target', '_blank')
            .appendTo('body');
        dk.$('#downloadFile').ready(function() {
            dk.$('#downloadFile').get(0).click();
        });
    }
}
