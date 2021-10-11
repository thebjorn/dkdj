import namespace from "../lifecycle/coldboot/dk-namespace";
import {UIWidget} from "./ui-widget";
import is from "../is";
import {deep_observer} from "../data/observable";
import {dkconsole} from "../lifecycle/dkboot/dk-console";


export class DataWidget extends UIWidget {
    constructor(...args) {
        const data_args = [...args].filter(arg => arg && arg.data).map(arg => arg.data);
        const props = Object.assign(...args);
        delete props.data;
        const data = data_args.length > 0 ? namespace.merge(...data_args) : null;
        super(props);
        if (data != null) this.data = data;
    }
    
    get data() {
        return this._data;
    }

    /**
     * Observe this.data and call this.data_changed anything changes.
     * @param newval
     */
    set data(newval) {
        if (!is.isObject(newval)) throw `widget.data must be a properties object, not ${typeof newval}`;

        this._data = deep_observer(newval, (orig_data, target, name, val, path) => {
            this.data_changed(
                this._data,
                'this.data' + path,
                val,
                name,
                target,
            );
        });
    }

    /**
     * data_changed is called whenever a change is observed in this.data...
     *
     * @param data      - the new data (after the change)
     * @param path      - the dotted path to the field that was changed (this.data.foo.bar)
     * @param val       - the new value assigned to the path
     * @param name      - the last part of path (this.data.foo.bar => bar)
     * @param target    - the object containing `name` (for the running example it would be this.data.foo)
     */
    data_changed(data, path, val, name, target) {
        // dkconsole.debug(`data-changed ${path} = ${val}, new data: ${JSON.stringify(data)}`);
        this.draw(data);
        // console.log('data-widget..data-changed', path, val, name, target);
        this.trigger('change', data);
    }

    /**
     * Widgets are equal if their data is equal.
     *
     * @param other
     * @returns {*}
     */
    isEqual(other) {
        if (this.constructor === other.constructor) {
            if (this._data !== undefined && other._data !== undefined) {
                return is.isEqual(this._data, other._data);
            }
        }
        return false;
    }

    toString() {
        return `${this.__class__.name}(data=${JSON.stringify(this.data)})`
    }
    
}


