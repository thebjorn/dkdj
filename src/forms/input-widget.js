import {Widget} from "../widgetcore/dk-widget";
import dk from "../dk-obj";
// import $ from 'jquery';

export class InputWidget extends Widget {   // XXX: should it be UIWidget or DataWidget instead?
    /*
        html attributes: autocomplete, autofocus, disabled, form, list, name, 
        readonly, required, tabindex, type, value
     */
    constructor(...args) {
        // console.log("ARGS:", args);
        const props = Object.assign({}, ...args);
        if ('value' in props) {
            props.data = props.data || {};
            props.data.value = props.value;
            delete props.value;
        }
        // console.log("PROPS:", props);
        super({
            data: {
                value: null,
                // disabled: false,
                // readonly: false,
                // required: false,
                // autofocus: false,
            }
        }, props);
        // this.layout = null;
        this._validators = [];
        this._updating = 0;
        this._status = {
            updating_from_widget: false,
            updating_from_data: false,
        };
        this._legal_attributes = [
            'autocomplete', 'autofocus', 'disabled', 'form', 'list', 'name',
            'readonly', 'required', 'tabindex', 'type', 'value'
        ];

    }
    
    _is_updating() {
        return this._status.updating_from_data || this._status.updating_from_widget; 
    }

    construct() {
        this.name = this.name || this.node.name || dk.id2name(this.id);
        if (this.node.name !== this.name) this.node.name = this.name;
        // this.node.type = this.node_type;  // xxx: it the default for <input>, but ...?
        this.widget().addClass(this.type);
        if (this.css) this.widget().css(this.css);
        if (this.value) this.dom_value = this.value;
        if (this.datasource) {
            if (this.datasource.value) this.value = this.datasource.value;
            dk.on(this.datasource, 'value-changed', val => this.value = val);
        }
    }

    get value() {
        return this.data.value;  // this is a proxy object..?
    }

    set value(v) {
        if (!this._status.updating_from_data) {
            // console.log("SET:DATA:", v, this._status);
            const value = this.parse(v);
            if (value !== this.data.value) {
                this.data.value = value;
                if (this.datasource) this.datasource.value = value;
                this.trigger('value-changed', this.value);
            }
        }
        return v;
    }

    get_value() {return this.value;}

    set_value(v) {
        this.value = v;
        return v;
    }

    formatted_value() {
        return this.value.f || this.value;
    }

    get_field_value() {return this.value;}

    /*
     * dom_value is automatically set from the .value setter 
     *  
     *      this.value
     *          => this.data.value = .. 
     *          => this.data_changed(..) 
     *          => this.dom_value = ..
     */
    set dom_value(v) {
        if (!this._status.updating_from_widget) {
            // console.log("SET:DOM:VALUE:", v, this._status);
            this.node.value = this.stringify(v);
            // this is wrong per the html standard, but useful for debugging.
            // if (env.DEBUG) this.node.setAttribute('value', this.stringify(v));
        }
    }

    /**
     * Automatically called when Widget.data.xxx is changed
     *
     * @param data      - the new Widget.data
     * @param path      - the path to the value being changed
     * @param val       - the new value
     * @param name      - the name of the attribute being changed (last part of path)
     * @param target    - the object (Widget.data, or Widget.data...) which is being changed
     */
    data_changed(data, path, val, name, target) {
        const v = data.value.value || data.value.v || data.value;
        this._status.updating_from_data = true;
        // console.log("DATA:CHANGED:", v, this._status);
        switch (name) {
            case 'value':
                this.dom_value = v;
                // this.trigger('value-changed', data.value);
                break;
            case 'readonly':  // handle mixed-case dom property
                this.node.readOnly = data.readonly;
                break;
            default:
                // console.log('data:name:', data[name]);
                this.node[name] = data[name];
        }
        // this.draw(data);
        // this.trigger('change', data);
        super.data_changed(data, path, val, name, target);
        this._status.updating_from_data = false;
    }

    /**
     * "Automatically" called (from handlers) when the dom has changed
     * @param event
     */
    widget_changed(event) {
        this._status.updating_from_widget = true;
        if (event.type === 'change') {
            // console.log("WIDGET:CHANGED:UPDATING value:EVENT", event);
            // console.log("WIDGET:CHANGED:UPDATING value:ITEM", event.item);
            // console.log("WIDGET:CHANGED:UPDATING value:VALUE", event.item.value);
            // console.log("WIDGET:CHANGED:UPDATING value:STATUS", this._status);
            // console.log("WIDGET:CHANGED:UPDATING value:data", this.data);
            // event.item is this from the jquery event handler
            this.value = event.item.value;  
        }
        this._status.updating_from_widget = false;
        // console.log("WIDGET:CHANGED:END_STATUS:", this.data);
        // console.log("WIDGET:CHANGED:END_STATUS:", this.options);
        // console.log("WIDGET:CHANGED:END_STATUS:", this._selected);
    }

    /**
     * Convert `val` to a string value.
     * 
     * @param val
     * @returns {*}
     */
    stringify(val) {return val;}

    /**
     * Convert `str` from a string to an object.
     * 
     * @param str
     * @returns {*}
     */
    parse(str) {return str;}

    handlers() {
        const self = this;
        this.widget().on('change input blur', function (e) {
            // console.log("HANDLERS:CHANGE:", this);
            // console.log("HANDLERS:CHANGE:VALUE", this.value);
            self.widget_changed({
                type: 'change',
                event: e,
                item: this
            });
            // console.log('input-widget-handlers-this.widget().on(change input blur', e);
            self.trigger('change', e, self);
        });
        this.retrigger('validation-change');
    }

    /* toString() helper methods. */
    _get_attribute_data(node) {
        const attributes = {};
        Array.from(node.attributes).forEach(({name, value}) => {
            const attrval = node.getAttribute(name);
            if (attrval !== undefined && attrval !== value) {
                attributes['dk-' + name] = value;
                attributes[name] = attrval;
            } else {
                attributes[name] = value;
            }
        });
        Object.entries(this.data).forEach(([k, v]) => {
            if (attributes[k] !== v) attributes['dk-' + k] = v;
        });
        if (!attributes.type) attributes['dk-type'] = node.type;
        return attributes;
    }
    
    _create_start_node() {
        let res = `
            <${this.node.tagName.toLowerCase()}`;
        const entries = Object.entries(this._get_attribute_data(this.node));
        const indent = '\n                ';
        entries.sort().forEach(([k, v]) => res += `${indent}${k}="${v}"`);
        return res + '>';
    }

    _create_child_nodes() {
        return "";
    }

    _create_end_node() {
        return "";
    }

    /**
     * The toString() method displays property values as well as attribute values.
     * 
     * @returns {string}
     */
    toString() {
        return this._create_start_node() + this._create_child_nodes() + this._create_end_node()
    }
}
