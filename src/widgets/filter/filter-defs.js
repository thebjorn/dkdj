import {UIWidget} from "../../widgetcore/ui-widget";
import dk from "../../dk-obj";
import {CheckboxSelectWidget, RadioSelectWidget, SelectWidget} from "../../forms/widgets";
import {dkconsole} from "../../lifecycle/dkboot/dk-console";

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
                classes: ['filterdef'],
                filterbox: {
                    classes: [],
                    filterheader: {
                        template: 'header',
                        filtertitle: {
                            template: 'h3',
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
        // this is set to true for select-one/-many, so the data source's get_foo_filter_values
        // method will be called, you must set it to true manually in any other filter, 
        // e.g. a custom filter.
        this.needs_options = false;
    }

    get value() {
        return this.input ? this.input.value : {};  // should be this.widget, but clashes with dk.UIWidget.widget()
    }

    handlers() {
        if (this.input) dk.on(this.input, 'change', (evt, widget) => {
            // eslint-disable-next-line no-console
            // console.info("DK:ON:CHANGE:", evt, widget);
            this.trigger('change', this.value);
        });
    }

    draw(opts) {
        // console.log("FILTERDEF:BASE:DRAW:", opts);
        if (this.input && this.input.draw) {
            this.input.draw(opts);
        }
    }

    fetch_options() {
        if (this.needs_options) {
            if (this.datafilter && this.datafilter.dataset) {
                this.datafilter.dataset.get_filter_data(this.name, opts => {
                    this.draw(opts);
                    // eslint-disable-next-line no-console
                    dkconsole.info('fetch_options-1', opts);
                });
            } else {
                // eslint-disable-next-line no-console
                dkconsole.info('fetch_options-2', this.datafilter.dataset);
            }
        }
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
        delete props.name;
        super(props);
        this._name = name;
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
    }

    construct() {
        this.input = this.construct_filter(this.filterbox.filtercontent, this);
    }

}

export class SelectOneFilterDef extends FilterDefBase {
    constructor(...args) {
        super({
            select_multiple: false
        }, ...args);
        this.needs_options = true;
    }

    construct() {
        this.input = RadioSelectWidget.create_on(this.filterbox.filtercontent, {
            options: this.values,
            name: this.name,
            label: this.label
        });
        if (!this.values) this.fetch_options();
    }
}

export class SelectMultipleFilterDef extends FilterDefBase {
    constructor(...args) {
        super({
            select_multiple: true
        }, ...args);
        this.needs_options = true;
    }

    construct() {
        // console.log("SELECT:MULTIPLE:FILTERDEFS:CONSTRUCT:VALUES:", this.values);
        this.input = CheckboxSelectWidget.create_on(this.filterbox.filtercontent, {
            options: this.values,
            name: this.name,
            label: this.label
        });
        if (!this.values) this.fetch_options();
    }
}


export class DropdownFilterDef extends FilterDefBase {
    constructor(...args) {
        super({
            select_multiple: false,
            structure: {
                classes: ['filterdef'],
                filterbox: {
                    classes: [],
                    filterheader: {
                        template: 'header',
                        filtertitle: {
                            template: 'h3',
                            text: ""
                        }
                    },
                    filtercontent: {
                        classes: ['filter', 'content']
                    }
                }
            },
            template: {
                filtercontent: 'div',
            }
        }, ...args);
        this.needs_options = true;
    }

    construct() {
        this.input = SelectWidget.create_inside(this.filterbox.filtercontent, {
            options: this.values,
            name: this.name,
            label: this.label
        });
        if (!this.values) this.fetch_options();
    }
}
