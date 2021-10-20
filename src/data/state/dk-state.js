/* global window */

import {CookieStorage} from "./cookie-storage";
import {LocalStorage} from "./local-storage";
import {SessionStorage} from "./session-storage";
import {HashStorage} from "./hash-storage";
import {MemoryStorage} from "./memory-storage";

/**
 * The State class enables pages (and especially widgets on pages) to save and restore
 * the page state from last visit. The underlying storage engines (which are pluggable)
 * have different features. E.g. the HashStorage engine stores the state in the browser's
 * url hash fragment, making it possible to send a link to someone else that lands them 
 * in the state you're seeing (this requires special care from the developer of course).
 * 
 * Initial state is created using the default parameter to get_item(key, defaultValue)::
 * 
 *     cookie_state = new dk.State({engine: dk.State.engines.cookie, name: 'pagename'});
 *     this.color = cookie_state.get_item('myapp', 'color', 'blue');
 *     
 *  The root level of the State objects consists of namespace => (keys => values). This 
 *  makes it easy to store individual widget state::
 *  
 *      mystate.set_item('widget-1', 'query', {filter: {year: 2019}, sort: ['-year']});
 *      
 */
export class State {
    
    /**
     * Create a new state object, typically::
     * 
     *     dk.state = new State({engine: State.engines.hash});
     *     
     * @param engine
     * @param name
     */
    constructor({engine, name}) {
        this.name = name;
        this._values = null;
        this._engine_state = "null";
        this.engine = engine ? (new engine()) : (new MemoryStorage());
        this.state = {hello: 'world'};  // fixme: backwards compatibility
    }
    
    toString() {
        return `STATE[${this.name}: ${this._values}]`;
    }
    
    get values() {
        if (this._values === null) {
            this._values = this.engine.values;
            this._engine_state = JSON.stringify(this._values);
        }
        return this._values;
    }
    
    /**
     * Get a top-level, named, state object.
     * 
     * Note: this operation does not save to storage.
     * 
     * @param {string} name - the name of the state object to return 
     * @returns {*} - a state object
     */
    get_name(name) {
        let obj = this.values[name];
        if (obj === undefined) {
            obj = {};
            this._values[name] = obj;
        }
        return obj;
    }

    /**
     * Usage::
     * 
     *     let color = dk.state.get_item('MyWidget1', 'color', 'yellow');
     * 
     * @param {string} name - Name of the object to store the value in
     * @param {string} key  - The key on the object to store the value on.
     * @param {any} defaultValue - JSON serializable value 
     * @returns {*}  The value stored on state[name][key]
     */
    get_item(name, key, defaultValue) {
        const obj = this.get_name(name);
        let val = obj[key];
        if (val === undefined) {
            val = this.set_item(name, key, defaultValue);
        }
        return val;
    }
    
    set_item(name, key, val) {
        const obj = this.get_name(name);
        obj[key] = val;
        this.save();
        return val;
    }
    
    save_widget(w) {
        const name = w.name;
        Object.entries(w.get_state()).forEach(([key, val]) => {
            this.set_item(name, key, val);
        });
    }
    
    restore_widget(w) {
        w.set_state(this.get_name(w.name));
    }
    
    changed() {
        return this._engine_state !== JSON.stringify(this._values);
    }
    
    save() {
        // console.debug("State.save()");
        if (this.changed()) {
            // console.debug("CHANGED");
            this.engine.save_values(this.name, this._values);
            this._engine_state = JSON.stringify(this._values);
        } else {
            // console.debug("NOT_CHANGED");
        }
    }
}
State.engines = {CookieStorage, HashStorage, LocalStorage, SessionStorage};


export default {
    storage: {
        cookie: CookieStorage,
        local: LocalStorage,
        session: SessionStorage,
        hash: HashStorage
    },
    State
};
