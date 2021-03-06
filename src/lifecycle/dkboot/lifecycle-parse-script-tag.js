/* eslint-disable no-console */

import globalThis, {get_dk_script_tag} from "../dkglobal";

export const loglevels = {
    ERROR: 0,
    WARN: 1,
    LOG: 2,
    INFO: 3,
    DEBUG: 4
};


export const env = {
    _loglevel: null,
    _debug: null,
    _attrs: null,
    
    _get_attrs() {
        const tag = get_dk_script_tag();

        const _attrs = {  // defaults
            crossorigin: null,
            main: null
        };
        if (tag == null) return _attrs;

        Array.from(tag.attributes, attr => {
            let val;
            switch (attr.name.toLowerCase()) {
                case 'debug': break;
                case 'loglevel': break;
                case 'crossorigin':
                    _attrs.crossorigin = attr.value;
                    break;
                case 'data-main':
                    val = attr.value;
                    if (val.slice(-val.length) !== '.js') {
                        val += '.js';
                    }
                    // _attrs[attr.name] = val;
                    _attrs.main = val;
                    break;
                default:
                    // console.debug("default:attr.name", attr.name, "attr.value", attr.value);
                    _attrs[attr.name] = attr.value;
                    break;
            }
        });
        return _attrs;
    },
    
    _get_loglevel() {
        if (globalThis.LOGLEVEL !== undefined) return globalThis.LOGLEVEL;
        if (globalThis.DEBUG !== undefined) {
            this._debug = globalThis.DEBUG;
            return loglevels.DEBUG;
        }

        const tag = get_dk_script_tag();
        if (tag === null) return loglevels.DEBUG;  // running under e.g. jest
        const tag_loglevel = tag.getAttribute('loglevel');
        if (tag_loglevel !== null) return parseInt(tag_loglevel, 10);

        const tag_debug = tag.getAttribute('debug');
        if (tag_debug !== null) {
            this._debug = !!tag_debug;
            return loglevels.DEBUG;  // level == 4
        }

        return loglevels.ERROR;  // level == 0
    },
    
    _get_debug() {
        if (globalThis.DEBUG !== undefined) return globalThis.DEBUG;
        const tag = get_dk_script_tag();
        if (tag === null) return true;   // running under e.g. jest
        const tag_debug = tag.getAttribute('debug');
        if (tag_debug !== null) return !!tag_debug;
        return false;
    },
    
    get attrs() {
        if (this._attrs === null) this._attrs = this._get_attrs();
        return this._attrs;
    },
    
    get LOGLEVEL() {
        if (this._loglevel === null) this._loglevel = this._get_loglevel();           
        return this._loglevel;
    },

    get DEBUG() {
        if (this._debug === null) this._debug = this._get_debug();
        return this._debug;
    }
};
