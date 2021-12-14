/*
 *   This is the top-level filter widget, which groups all sub-filters
 *   for a given data table/grid.
 */

import dk from "../../dk-obj";
import {zip_object} from "../../collections";
import {UIWidget} from "../../widgetcore/ui-widget";
import is from "../../is";
import {dkconsole} from "../../lifecycle/dkboot/dk-console";
import {CustomFilterDef, DropdownFilterDef, SelectMultipleFilterDef, SelectOneFilterDef} from "./filter-defs";


/*
 *  The top level filter container/widget.
 *
 *  dk.filter.DataFilter.create_on(filterbox, {
 *      ...
 *      filters: {
 *          testleader: {
 *              label: 'Testleder',
 *              select_multiple: true,
 *              url: 'progress/all!get-testleader-values'
 *          },
 *          favyear: {
 *              label: 'Favorittår',
 *              values: [2013, 2014, 2015, 2016],
 *              select_multiple: true
 *          },
 *          smile: {
 *              label: 'Smil',
 *              value: undefined,
 *              construct(location) {
 *                  const self = this;
 *                  const btn = $('<button/>').text(":-)");
 *                  this.widget = location.append(btn);
 *                  $(this.widget).on('click', function () {
 *                      self.value = "*SMILE*";
 *                      dk.publish(self.widget, 'change', self.widget);
 *                  });
 *              }
 *          }
 *      }
 *  });
 */
export class DataFilter extends UIWidget {
    constructor(...args) {
        super({
            // type: 'DataFilter',
            data: undefined,        // XXX: hmm...
            heading: 'Filter',
            filters: {},
            dataset: null,
            structure: {
                header: {
                    title: {
                        text: 'Filter'
                    }
                },
                content: {}
            },

            template: {
                root: 'section',
                header: '<header/>',
                title: '<h2/>',
                content: '<div/>',

                // Each filter is contained in a .filterbox that is structured
                // similarly to the main filter section.
                filterbox: '<div/>',
                filterheader: '<header/>',
                filtertitle: '<h3/>',
                filtercontent: '<div class="filter content"/>'
            },
            
        }, ...args);
        
        this._filter_data = this._get_filter_data(this.filters);
    }

    /**
     *  Convert the user supplied `.filters` to a list of FilterDefBase 
     *  subclasses, which can (later) be combined with a location to create
     *  a Widget.
     *  
     *  filterdata filterdef is either
     *    
     *    (a) { select_multiple: true, values: .., ... }
     *    (b) { construct(location) {}, ... }
     *    (c) { values: .., ... }
     *   
     *  For option (b), the object must 
     *  
     *    (i) create a `this.widget` property (the filter system listens
     *        for notifications on this widget.
     *   (ii) set `this.value` to the correct filter value (this can be a
     *        compound value, but must be _JSON_ serializable).
     *  (iii) call `dk.trigger(this.widget, 'change', this.widget)` whenever
     *        the filter value changes.
     *        
     */
    _get_filter_data(filters) {
        return Object.entries(this.filters).map(([filtername, filterdef]) => {
            filterdef.name = filtername;
            if (is.isProps(filterdef)) {
                if (filterdef.type === 'dropdown') {
                    return [filterdef, DropdownFilterDef];
                } else if (filterdef.select_multiple) {  // (a)
                    // console.info("SELECT_MULTIPLE", filterdef);
                    return [filterdef, SelectMultipleFilterDef];
                } else if (filterdef.construct_filter) {  // (b)
                    // console.info("CUSTOMFILTER", filterdef);
                    return [filterdef, CustomFilterDef];
                } else {
                    // console.info("SELECT_ONE", filterdef);
                    return [filterdef, SelectOneFilterDef];
                }
            } else {
                dkconsole.warn("filter def is not a properties object..?");
                // return [filterdef, null]; 
            }
        });
    }

    /**
     * Create widgets, and append to `this.content`, for all pairs in 
     * `this._filter_data`. Set it up so any `change` trigger on the filters 
     * triggers a `filter-change` event on the filter (with `this.values()` 
     * as the only parameter.
     */
    construct() {
        this.filters = {};
        this._filter_data.forEach(([filterprops, filtercls]) => {
            filterprops.datafilter = this;
            const res = filtercls.append_to(this.content, filterprops);
            dk.on(res, 'change', (...args) => {
                // console.info("FILTERCLS:ON:CHANGE", args);
                const values = this.values();
                // console.info("FILTERDATA::::::::::::::::::", values);
                if (this.data) this.data.set_filter(values);
                this.trigger('filter-change', values);
            });
            this.filters[filterprops.name] = res;
        });
    }

    values() {
        const keys = Object.keys(this.filters);
        // console.info("DATAFILTER:KEYS:", keys);
        const vals = keys.map(filter_name => {
            const filter = this.filters[filter_name];
            // const filter = materialize(this.filters[filter_name]);
            // console.info("MATERIALIZE:FILTER:", materialize(filter));
            
            // console.info("DATAFILTER:filter[NAME]", filter_name);
            // console.info("DATAFILTER:filter:", filter_name, filter);
            // console.info("DATAFILTER:filter:input:", filter.input);
            

            if (filter.value) {
                // filter has defined a value on itself.. (e.g. `CustomFilterDef`'s
                // console.info("DATAFILTER:filter:direct-VALUE:", filter.value);
                return filter.value;
            }
            if (filter.input && filter.input.jquery) {
                // found a jQuery object, get its .val()
                // console.info("DATAFILTER:filter:value:JQ:", filter.input.val());
                return filter.input.val();
            }
            if (filter.input && filter.input.value) {
                // found a dk.form object
                // console.info("DATAFILTER:filter:value:JS:", filter.input.value);
                return filter.input.value;
            }
        });
        // console.info("DATAFILTER:VALS:", vals);
        return zip_object(keys, vals);
    }
}
