// import and attach LVL:0-1 modules

// jest needs these, webpack craps from them..
import $ from 'jquery';


import performance from "./performance-timer";
import {env} from "./lifecycle/dkboot/lifecycle-parse-script-tag";
import * as text from "./text/text-utils";
import counter from "./core/counter";

import {shallow_observer, deep_observer} from "./data/observable";
import require_css from "./browser/loaders";
import globalThis, {get_dk_script_tag} from "./lifecycle/dkglobal";
import Class from "./lifecycle/coldboot/dk-class";
import {version} from "./version";
import create_debug_environment from "./lifecycle/dkboot/lifecycle-create-debug-environment";
import namespace from "./lifecycle/coldboot/dk-namespace";
import setup_loaders from "./lifecycle/lifecycle-setup-loaders";
import {dkconsole} from "./lifecycle/dkboot/dk-console";
import {dkwarning} from "./lifecycle/coldboot/dkwarning";
import {pick, zip_object} from "./collections";
import is from "./is";
import {after, on, trigger, publish, subscribe} from "./lifecycle/dkboot/dk-signals";
import {add, mul, vec_mul, multiply_reduce} from "./dkmath/dk-math";
import {times} from "./lo-times";
import {HashStorage} from "./data/state/hash-storage";

const dk = function (selector) {
    return document.querySelector(selector);
};


Object.defineProperty(dk, 'hash', {
    get: function() {
        if (!dk._hash_obj) {
            dk._hash_obj = new HashStorage();
            const handler = {
                get(target, name) {
                    if (name in target) {
                        return target[name];
                    } else {
                        return target.get(name);
                    }
                },
                set(obj, prop, value) {
                    return obj.set(prop, value);
                }
            };
            dk._hash_obj_proxy = new Proxy(dk._hash_obj, handler);
        }
        return dk._hash_obj_proxy;
    }
});


Object.assign(dk, {
    Class,
    counter,
    globals: globalThis,
    env,
    namespace: namespace.create_namespace,
    combine: namespace.combine,
    merge: namespace.merge,
    traverse: namespace.traverse,
    on,
    trigger,
    after,
    publish,
    subscribe,
    bind: function (...args) {
        dkwarning("dk.bind is deprecated, called with:", ...args);
    },

    math: {
        add,
        mul,
        vec_mul,
        multiply_reduce
    },
    ...dkconsole,

    shallow_observer,
    deep_observer,
    
    performance,
    // require: {
    //     css: require_css
    // },
    version,
    text,
    id2name: text.id2name,
    cls2id: text.cls2id,
    count: text.count_char,
    dedent: text.dedent,
    
    // externals
    $: $,
    _jquery_version: $.fn.jquery,

    is,
    pick: pick,
    zip_object,
    times,

    // locally defined
    all(selector) {
        return document.querySelectorAll(selector);
    },
    
    app: {
        state: {}
    }
});

dk.DEBUG = env.DEBUG;
dk.LOGLEVEL = env.LOGLEVEL;

dk.dkjstag = {
    get src() {
        dkwarning("dk.dkjstag.src is deprecated, use dk.scripttag_attributes.src");
        return env.attrs.src;
    },
    get loglevel() {
        dkwarning("dk.dkjstag.loglevel is deprecated, use dk.LOGLEVEL");
        return env.LOGLEVEL;
    },
    get debug() {
        dkwarning("dk.dkjstag.debug is deprecated, use dk.DEBUG");
        return env.DEBUG;
    },
    get main() {
        dkwarning("dk.dkjstag.main is deprecated, use dk.scripttag['data-main']");
        return env.attrs['data-main'];
    },
    get tag() {
        dkwarning("dk.dkjstag.tag is deprecated and shouldn't be used anymore.");
        return get_dk_script_tag();
    }
};

create_debug_environment(dk);

setup_loaders(dk);

performance('created-dk-obj');
export default dk;
