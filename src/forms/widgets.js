/*
 *  dk.forms namespace
 *
 *  The purpose of these widgets is to auto-create widgets for inline editing of grids.
 *  (and filters..?)
 */

import dk from "../dk-obj";
import is from "../is";
import {Duration} from "../data/datacore/dk-datatypes";
import {env} from "../lifecycle/dkboot/lifecycle-parse-script-tag";
import {InputWidget} from "./input-widget";
import {dedent} from "../text/template-functions";
import {dkwarning} from "../lifecycle/coldboot/dkwarning";
import {dkconsole} from "../lifecycle/dkboot/dk-console";
import {zip_object} from "../collections";

/*
    Global attributes:
    
    accesskey, class
    contenteditable
    contextmenu-x
    data-*
    dir
    draggable
    dropzone-x
    hidden
    id
    inputmode-x
    is
    itemid, itemprop, itemref, itemscope, itemtype
    lang
    slot
    spellcheck
    style
    tabindex
    title
    translate-x
    
 */


export class TextInputWidget extends InputWidget {
    constructor(...args) {
        super({
            template: {root: 'input'}
        }, ...args);
    }
    construct() {
        super.construct();
        if (this.node.type !== 'text') this.node.type = 'text';
    }
    handlers() {
        super.handlers();
        this.retrigger('keyup');
    }
}


export class IntInputWidget extends InputWidget {
    constructor(...args) {
        super({
            template: {root: 'input'}
        }, ...args);
    }
    construct() {
        super.construct();
        if (this.node.type !== 'number') this.node.type = 'number';
    }
    handlers() {
        super.handlers();
        this.retrigger('keyup');
    }
    parse(str) {
        return parseInt(str, 10);
    }
    stringify(val) {
        return val.toString();
    }
}


export class DurationWidget extends InputWidget {
    constructor(...args) {
        super({
            template: {root: 'input'},
        }, ...args);
    }
    construct() {
        super.construct();
        if (this.node.type !== 'text') this.node.type = 'text';
    }
    parse(str) {
        if (str instanceof Duration) return str;
        return new Duration(str);
    }
    stringify(val) {
        if (val instanceof Duration) return val.toString();
        return (new Duration(val)).toString();
    }
}


export class RadioInputWidget extends InputWidget {
    constructor(...args) {
        const props = Object.assign({}, ...args);
        const _checked = props.checked || false;
        delete props.checked;
        
        super({
            template: {root: 'input'}
        }, ...args);
        this._checked = _checked;
    }
    
    construct() {
        super.construct();
        if (this.node.type !== 'radio') this.node.type = 'radio';
        this.node.checked = this._checked;
    }
    
    get checked() {
        return this._checked;
    }

    set checked(value) {
        this._checked = value;
        this.node.checked = value;  // XXX: should this be in set_node_value?
        if (env.DEBUG) this.node.setAttribute('checked', 'checked');
    }

    handlers() {
        const self = this;
        super.handlers();
        this.widget().on('change', function () {
            self._checked = self.node.checked;  // don't use setter here.
        });
    }
}

/* html attributes

        autocomplete, autofocus
        disabled
        form
        multiple
        name
        required
        size
        
 */

/**
 * create an options dict {name -> value} from either
 *
 *  (a) an options dict,
 *  (b) a flat array, or
 *  (c) a [[key, val], ..] array.
 *
 * @param options - key value dict
 */
function create_options(options) {
    if (options == null) return {};
    let result = {};
    // let order = [];
    
    if (Array.isArray(options)) {  // (b) or (c)
        // https://www.stefanjudis.com/today-i-learned/property-order-is-predictable-in-javascript-objects-since-es2015/
        // property order in objects is by insertion order..
        // ..except for numbers -- which are sorted and inserted
        // in front (thus messing up an implied order that is 
        // not numerically ascending)
        if (options.length > 0) {  // options === []
            let [first, ...rest] = options;
            if (Array.isArray(first)) {  // (c) options === [[k,v], [k,v],...]
                if (Number.isInteger(first[0])) dkwarning(`
                    WARNING: Your filter received plain integers as keys. While this
                             will work, it will not present your data in the order
                             you sent from the server (it will look unsorted).
                             The solution is to prepend a character, ie. instead of
                             the datasource sending:
                             
                                 return [(usr.id, usr.name) for usr in ...]
                                  
                             instead do:
                             
                                 return [("u{}".format(usr.id), usr.name) for usr in ...]
                                   
                `);
                options.forEach(([k, v]) => result[k] = v);
                // order = options.map(([k, v]) => k);
            } else {   // optinos === [v1, v2, v3, ...]
                // order = options;
                options.forEach(v => result[v] = v);
                if (!is.isEqual(Object.keys(result), options.map(v => `${v}`))) {
                    throw `The default ordering of the options 
                     ${JSON.stringify(Object.keys(result))} does not match ${JSON.stringify(options)}. You
                     should specify the options as a property object (instead
                     of a list) to achieve your desired order.`;
                }
                // options.forEach(v => result[`${(typeof v === 'number' ? '0' : '')}${v}`] = v);
            }
        }
    } else {  // (a)
        result = options;
        // order = Object.keys(options);
    }

    // if (validate) {
    //     Object.keys(result).forEach(k => {
    //         if (result[k] !== validate[k]) {
    //             throw dedent`
    //                 Illegal value (${k}) - not in options
    //                 VALUES: ${JSON.stringify(result)}
    //                 VALIDATE: ${JSON.stringify(validate)} 
    //             `;
    //         }
    //     });
    // }
    // console.log("CREATE:OPTIONS:OPTIONS:", options);
    // console.log("CREATE:OPTIONS:VALIDATE:", validate);
    // console.log("CREATE:OPTIONS:RESULT:", result);
    return result;
}


function _validate_option_values(values, options) {
    if (values == null) return [];
    if (!Array.isArray(values)) values = [values];
    const keys = Object.keys(options);
    values.forEach(v => {
        if (!keys.includes(v)) {
            throw dedent`
                Illegal value (${v}) - not in options
                VALUES: ${JSON.stringify(values)}
                OPTIONS: ${JSON.stringify(options)} 
            `;
        }
    });
    return values;
}


export class SelectWidget extends InputWidget {
    constructor(...args) {
        // console.log("ARGS:", args);
        const props = Object.assign({}, ...args);
        
        const options = create_options(props.options);
        delete props.options;
        
        const value = _validate_option_values(props.value, options);
        delete props.value;
        
        super({
            size: 1,
            multiple: false,
            data: {value: value},
            template: {root: 'select'},
        }, props);

        this._selected = {};
        this.options = options;
        
        // console.log("SELECT:WIDGET:CTOR:VALUE:", value);
        if (!Array.isArray(value)) throw `value should be an array, not ${JSON.stringify(value)}`;
        if (!this.multiple && value.length > 1) throw "cannot have multiple values when multiple=false";
        value.forEach(k => this._selected[k] = true);
    }
    get options() { return this._options; }
    set options(options) {
        this._options = create_options(options);
        Object.keys(this._options).forEach(k => this._selected[k] = false);
    }

    get value() { return this.data.value; }   // default implementation
    
    _clear_selections() {
        // remove all selected options
        Object.keys(this._selected).forEach(k => this._selected[k] = false);
    }
    
    _set_selections(values) {
        // values is a list of options/_selected keys
        values.forEach(k => this._selected[k] = true);
    }
    
    set value(v) {
        if (!this._status.updating_from_data) {
            if (!Array.isArray(v)) v = [v];
            if (!this.multiple && v.length > 1) throw "Cannot set multiple values when multiple = false!";

            this._clear_selections();
            this._set_selections(v);

            this.data.value = v;
            if (this.datasource) this.datasource.value = v;
            this.trigger('value-changed', this.value);
        }
    }
    
    _set_value_from_selected() {
        this.data.value = this._get_value_from_selected();
        return this.data.value;
    }
    
    _get_value_from_selected() {
        const val = [];
        Object.entries(this._selected).forEach(([k, v]) => {
            if (v) val.push(k);
        });
        return val;
    }
    
    set dom_value(v) {
        if (!this._status.updating_from_widget) {
            this.widget().val(v);
        }
    }
    
    rebuild_options() {
        const widget = this.widget();
        widget.empty();
        Object.entries(this.options).forEach(([attr, value]) => {
            const option = dk.$('<option/>').val(attr).text(value);
            // noinspection EqualityComparisonWithCoercionJS
            if (attr == this.value) option.attr('selected', 'selected');  // we want 1 == "1" here!
            widget.append(option);
            widget.append('\n    ');
        });
    }
    
    construct() {
        super.construct();
        if (this.options) this.rebuild_options();
    }

    draw(data) {
        // console.log("SELECT:WIDGET:DRAW:", data);
        if (data != null) {
            if (data.options && !is.isEqual(data.options, this.options)) {
                this.options = data.options;
                this.rebuild_options();
            } else {
                this.dom_value = data.value;
            }
        } else {
            this.dom_value = this.value;
        }
    }
    
    formatted_value() {
        return this.options[this.value];
    }
    
    get_field_value() {
        return {v: this.value, f: this.formatted_value()};
    }
}


export class RadioSelectWidget extends SelectWidget {
    constructor(...args) {
        super({
            template: {root: 'div'},
        }, ...args);
    }
    
    set dom_value(v) {
        if (!this._status.updating_from_widget) {
            if (v == null) return;
            const values = v.value || v.v || v;
            if (!Array.isArray(values)) throw `value should be an array, not ${JSON.stringify(values)}`;
            // this.widget(':radio').val(values);
            values.forEach(val => {
                this.widget(`:radio[value="${val}"]`).prop("checked", true);
                this.widget(`:radio[value="${val}"]`).attr("checked", "checked");
            });
        }
    }
    
    rebuild_options() {
        const widget = this.widget();
        widget.empty();
        Object.entries(this.options).forEach(([attr, value]) => {
            const radio = this.layout.make('input', {
                type: 'radio',
                name: this.name,
                id: dk.counter(this.name + '-')
            });
            const label = this.layout.make('label', {
                id: radio.prop('id') + '-label',
                'for': radio.prop('id')
            }).text(value);
            radio.val(attr);
            // noinspection EqualityComparisonWithCoercionJS
            if (this.value.includes(attr)) radio.prop('checked', true);  // we want 1 == "1" here
            label.prepend(radio);
            this.widget().append(label);
            this.widget().append('\n        ');
        });
    }

    /**
     * "Automatically" called (from handlers) when the dom has changed
     * @param event
     */
    widget_changed(event) {
        this._status.updating_from_widget = true;
        if (event.type === 'change') {
            this._clear_selections();
            this._selected[event.item.value] = event.item.checked;
            this._set_value_from_selected();
        }
        this._status.updating_from_widget = false;
    }
    
    handlers() {
        const self = this;
        this.widget().on('change', ':radio', function (e) {
            self.widget_changed({
                type: 'change',
                event: e,
                item: this
            });
            self.trigger('change', e, self);
        });
        this.retrigger('validation-change');
    }
}


export class CheckboxSelectWidget extends RadioSelectWidget {
    constructor(...args) {
        super({
            multiple: true
        }, ...args);
    }
    
    set dom_value(v) {
        if (!this._status.updating_from_widget) {
            if (v == null) return;
            const value = v.value || v.v || v;
            if (!Array.isArray(value)) throw `value should be an array, not ${JSON.stringify(value)}`;
            this.widget(':checkbox').val(value);
        }
    }
    
    rebuild_options() {
        const widget = this.widget();
        const self = this;
        widget.empty();
        Object.entries(this.options).forEach(([attr, value]) => {
            const chkbx = this.layout.make('input', {
                type: 'checkbox',
                name: this.name,
                id: dk.counter(this.name + '-')
            });
            const label = this.layout.make('label', {
                id: chkbx.prop('id') + '-label',
                'for': chkbx.prop('id')
            }).text(value);
            chkbx.val(attr);
            // noinspection EqualityComparisonWithCoercionJS
            if (this.value.includes(attr)) {
                chkbx.prop('checked', true);
            }
            label.prepend(chkbx);
            widget.append(label);
            widget.append('\n');
        });
    }
   
    widget_changed(event) {
        // called from function set up in .handers() below..
        this._status.updating_from_widget = true;
        // console.debug("IN:WIDGET:CHANGED:this.value", this.value, "CLICKED:ON:", event.item.value, "NEW:VALUE:", event.item.checked, this._status);
        if (event.type === 'change') {
            // console.debug("SELECTED:BEFORE:", this._selected);
            this._selected[event.item.value] = event.item.checked;
            // console.debug("SELECTED:AFTER:", this._selected);
            this._set_value_from_selected();
            // console.debug("WIDGET:CHANGED:VALUE:", this.value);
        }
        this._status.updating_from_widget = false;
    }
    
    handlers() {
        const self = this;
        this.widget().on('change', ':checkbox', function (e) {
            self.widget_changed({
                type: 'change',
                event: e,
                item: this
            });
            self.trigger('change', e, self);
        });
        this.retrigger('validation-change');
    }
}


// XXX: is this a form widget?
export class TriboolWidget extends InputWidget {
    constructor(...args) {
        super({
            values: { 0: 0, 1: 1, 2: 2 },
            value: 0,
            structure: {  // basic layout of widget
                tribool_label_box: {},
                true_widget_box: {
                    css: { float: 'left' }
                },
                false_widget_box: {
                    css: { float: 'left' }
                },
            }
        }, ...args);
    }
    construct() {
        super.construct();
        // fixme: add to structure
        this.label = this.widget('label');
        this.tribool_label_box.text(this.label.text);
        this.true_widget = dk.$('<button type="button" class="btn btn-default btn-circle"><dk-icon src="check checked"></dk-icon></button>');
        this.true_widget_box.append(this.true_widget);
        this.false_widget = dk.$('<button type="button" class="btn btn-default btn-circle"><dk-icon src="minus checked"></dk-icon></i></button>');
        this.false_widget_box.append(this.false_widget);
    }
    set dom_value(v) {
        
    }
    
    draw(value) {
        if (value === undefined) return;

        switch (value) {
            case 0:
                this.true_widget.removeClass('btn-success').addClass('btn-default');
                this.false_widget.removeClass('btn-danger').addClass('btn-default');
                break;
            case 1:
                //this.true_widget.toggleClass('btn-default btn-success');
                this.true_widget.removeClass('btn-default').addClass('btn-success');
                this.false_widget.removeClass('btn-danger').addClass('btn-default');
                break;
            case 2:
                //this.false_widget.toggleClass('btn-default btn-danger');
                this.true_widget.removeClass('btn-success').addClass('btn-default');
                this.false_widget.removeClass('btn-default').addClass('btn-danger');
                break;
        }
    }
    handlers() {
        const self = this;
        this.true_widget.on('click', function () {
            switch (self.value) {
                case 0: self.value = 1; break;
                case 1: self.value = 0; break;
                case 2: self.value = 1; break;
            }
            self.draw(self.value);
            dk.trigger(self.widget, 'change', self.widget);
            self.notify('change', self);
        });
        this.false_widget.on('click', function() {
            switch (self.value) {
                case 0: self.value = 2; break;
                case 1: self.value = 2; break;
                case 2: self.value = 0; break;
            }
            self.draw(self.value);
            dk.trigger(self.widget, 'change', self.widget);
            self.notify('change', self);
        });
    }
}
