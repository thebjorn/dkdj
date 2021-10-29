

import {JSONDataSource} from "./dk-json-datasource";
import is from "../../is";
import {dkconsole} from "../../lifecycle/dkboot/dk-console";
import jason from "../datacore/dk-json";
import {ajax, async_ajax, async_json, json} from "../../browser/dk-client";
import {DataQuery} from "../dk-dataquery";


export class AjaxDataSource extends JSONDataSource {
    constructor(props) {
        super();
        props = Object.assign({}, props || {});
        this.url = props.url || "";
        this._fields = null;
        this.default_pagesize = props.default_pagesize || 5;
    }

    _axdata(request) {
        // FIXME: duplicated in DataQuery._axdata
        if (request == null) request = new DataQuery();
        const sortcol = function (sitem) {
            if (sitem.field === undefined) return '';
            return (sitem.direction === 'desc' ? '-' : '') + sitem.field;
        };
        
        const data = {
            s: request.sort.map(sortcol).join(','),
            start: request.start,
            q: request.search,
            end: request.end,
            ft: request.filter
        };
        if (data.s === "") delete data.s;
        if (data.start === 0) delete data.start;
        if (data.q === "") delete data.q;
        if (is.isEqual(data.ft, {})) delete data.ft;
        return data;
    }
    
    _make_ajax_opts(cmd, data) {
        // for data to be sent as json, the type must be POST, dataType 'json', contentType
        // set as below, and data must be json (ie. a string).
        const self = this;
        dkconsole.debug("CMD:", cmd, "DATA:", data);
        const defaults = {
            cache: false,
            type: 'POST',
            dataType: 'json',
            url: self.url + '!' + cmd,
            contentType: "application/json; charset=utf-8",
            statusCode: {
                404: function () { dkconsole.debug("Page not found: " + self.url); },
                500: function () { window.open(self.url); }
            },
            error: function (req, status, err) {
                self.waiting = false;
                dkconsole.warn("ERROR", req, status, err);
                //dk.notify(self, 'fetch-data-error', req, status, err);
                throw {error: "fetch-error", message: status + ' ' + err};
            },
            converters: {
                "text json": jason.parse
            },
            success: function (data) {
                dkconsole.debug("dk-ajax-datasource-DATA:", data);
                if (data.error) {
                    dkconsole.warn(data);
                    throw data;
                } else {
                    //self.data = json.postparse(data);
                    self.data = data;
                    self.waiting = false;
                    this.do_success(self.data);
                }
            }
        };
        Object.assign(defaults, data);
        defaults.data = JSON.stringify(defaults.data);
        return defaults;
    }

    _ajax(cmd, data) {
        ajax(this._make_ajax_opts(cmd, data));
    }

    update(changes, fn) {
        // const keymap = this._keymap();
        // const fieldmap = this._field_order();
        const self = this;

        this._ajax('update', {
            data: {
                data: this.data,
                changes: changes
            },
            do_success(data) {
                fn(self._get_records(self.last_request, data), self.last_request);
            }
            // do_success(changes) {
            //     console.log("update-data", data);
            //     Object.keys(changes).forEach(function (pk) {
            //     const change = changes[pk];
            //     const datarec = keymap[pk];
            //     Object.keys(change).forEach(function (fieldname) {
            //         datarec.c[fieldmap[fieldname]] = change.newval;
            //     });
            // });
            // }
        });
    }

    async fetch_filter_data(filter_name) {
        return await async_json({
            data: {name: filter_name},
            url: `${this.url}!get-filter-values`
        });
    }
    
    get_filter_data(filter_name, returns) {
        json({
            data: {name: filter_name},
            // url: `${this.url}`,
            url: `${this.url}!get-filter-values`,
            success: function (data) {
                dkconsole.debug("get-filter-data:", filter_name, 'DATA:', data);
                if (data.error) {
                    dkconsole.warn(data);
                    throw data;
                } else {
                    self.data = data;
                    self.waiting = false;
                    returns(data);
                }
            }
        });
    }

    async fetch_records(request) {
        const self = this;
        //const p = this.get_defaults(request);
        this.last_request = request;
        const axdata = self._axdata(request);
        const data = await async_ajax(this._make_ajax_opts('get-records', {
            data: axdata,
        }));
        return this._get_records(request, data);
    }
    
    get_records(request, returns) {
        const self = this;
        //const p = this.get_defaults(request);
        this.last_request = request;
        const axdata = self._axdata(request);
        // debugger;
        this._ajax('get-records', {
            data: axdata,
            do_success(data) {
                returns(self._get_records(request, data));
            }
        });
    }
}
