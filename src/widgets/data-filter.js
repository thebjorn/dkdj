

/*
 *   This is the top-level filter widget, which groups all sub-filters
 *   for a given data table/grid.
 */

import dk from "../dk-obj";
// import {Widget} from "../widgetcore/dk-widget";
// import {Template} from "../browser/dk-dom-template";
import {CheckboxSelectWidget, RadioSelectWidget, TriboolWidget} from "../forms/widgets";
import {zip_object} from "../collections";
import {UIWidget} from "../widgetcore/ui-widget";
import is from "../is";
import {dkconsole} from "../lifecycle/dkboot/dk-console";


// export function list2data(lst) {
//     if (Array.isArray(lst)) {
//         const res = {};
//         lst.forEach(item => {
//             if (typeof item === 'number') {
//                 res[`0${item}`] = item; // make key a string wrt. order
//             } else {
//                 res[item] = item;
//             }
//         });
//         // res.__order = lst;      // XXX: Not needed anymore
//         return res;
//     } else {
//         return lst;
//     }
// }

/**
 * A single filter definition.
 * Think of it as a filter for a single field.
 * Multiple filter definitions will normally make up the filter for a datasource.
 */
export class FilterDefBase extends UIWidget {
    constructor(...args) {
        super({
            select_multiple: false,
            name: null,
            label: "",
            values: null,
            structure: {
                filterbox: {
                    classes: [],
                    filterheader: {
                        template: 'header',
                        filtertitle: {
                            template: 'h4',
                            text: ""
                        }
                    },
                    filtercontent: {
                        classes: ['filter', 'content']
                    }
                }
            }
        }, ...args);
        
        this.structure.filterbox.classes.push(this.name);
        this.structure.filterbox.filterheader.filtertitle.text = this.label || this.name;
    }
    
    get value() {
        return this.input ? this.input.value : {};  // should be this.widget, but clashes with dk.UIWidget.widget()
    }
    
    handlers() {
        if (this.input) dk.on(this.input, 'change', (evt, widget) => this.trigger('change', this.value));
    }
}

/**
 * Filters can construct their own UI, using the construct method,
 * which takes a location. When generating the UI you must:
 *
 *  - create a `this.widget` property (the filter system listens for
 *    notifications on this widget.
 *  - set `this.value` to the correct filter value (this can be a
 *    compound value, but must be _JSON_ serializable).
 *  - call `dk.publish(this.widget, 'change', this.widget)` whenever
 *    the filter value changes.
 */
export class CustomFilterDef extends FilterDefBase {
    constructor(...args) {
        const props = Object.assign({}, ...args);
        const name = props.name;
        // xconst value = props.value;
        delete props.construct;
        delete props.name;
        delete props.value;
        super(props);
        this._name = name;
        // xthis._value = value;
    }
    
    get value() { return this._value; }
    set value(val) { this._value = val; }

    construct() {
        console.log("CUSTOMFILTER:CONSTRUCT");
        this.input = this.construct_filter(this.filterbox.filtercontent, this);
    }
    
}


export class SelectOneFilterDef extends FilterDefBase {
    constructor(...args) {
        super({
            select_multiple: false
        }, ...args);
    }
    
    construct() {
        this.input = RadioSelectWidget.create_on(this.filterbox.filtercontent, {
            options: this.values,
            name: this.name,
            label: this.label
        });
    }
}


export class SelectMultipleFilterDef extends SelectOneFilterDef {
    constructor(...args) {
        super({
            select_multiple: true
        }, ...args);
    }

    construct() {
        this.input = CheckboxSelectWidget.create_on(this.filterbox.filtercontent, {
            options: this.values,
            name: this.name,
            label: this.label
        });
    }
}


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
            data: undefined,
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
                filtertitle: '<h4/>',
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
                if (filterdef.select_multiple) {  // (a)
                    console.info("SELECT_MULTIPLE", filterdef);
                    return [filterdef, SelectMultipleFilterDef];
                } else if (filterdef.construct_filter) {  // (b)
                    console.info("CUSTOMFILTER", filterdef);
                    return [filterdef, CustomFilterDef];
                } else {
                    console.info("SELECT_ONE", filterdef);
                    return [filterdef, SelectOneFilterDef];
                }
            } else {
                dkconsole.warn("filter def is not a properties object..?");
                console.info("FOFOFOSLDKJSDFOIFJS");
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
            const res = filtercls.append_to(this.content, filterprops);
            dk.on(res, 'change', (...args) => {
                if (this.data) this.data.set_filter(this.values());
                this.trigger('filter-change', this.values());
            });
            this.filters[filterprops.name] = res;
        });
    }

    values() {
        const keys = Object.keys(this.filters);
        const vals = keys.map(filter_name => {
            const filter = this.filters[filter_name];
            if (filter.value) {
                // filter has defined a value on itself.. (e.g. `CustomFilterDef`'s
                return filter.value;
            }
            if (filter.input && filter.input.jquery) {
                // found a jQuery object, get its .val()
                return filter.input.val();
            }
            if (filter.input && filter.input.value) {
                // found a dk.form object
                return filter.input.value;
            }
        });
        return zip_object(keys, vals);
    }
}
