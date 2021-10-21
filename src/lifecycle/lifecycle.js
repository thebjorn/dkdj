
import {dkconsole} from "./dkboot/dk-console";
import {env} from "./dkboot/lifecycle-parse-script-tag";
import {dkwarning} from "./coldboot/dkwarning";

let __document_ready__ = false;
const _ready_queue = [];
let _bind_q = [];


export const dkmodule = {

    ready: function (fn) {
        if (__document_ready__) {
            fn.apply(null, arguments);
        } else {
            _ready_queue.push({fn: fn, args: arguments});
        }
    },

    /*
     * Module initialization.
     */
    initialize: function () {
        dkconsole.info("INITIALIZING...");
        __document_ready__ = true;

        for (let i=0; i<_bind_q.length; i++) {
            this.bind(_bind_q[i]);
        }
        _bind_q = [];
        _ready_queue.forEach(item => {
            item.fn.apply(this.page, item.args);
        });

        if (env.attrs.main) _dkrequire.js(env.attrs.main);
    },

    /*
     * Regular jQuery bind calls the function with this bound to the target object,
     * which doesn't work for me.
     *
     * Usage:  dk.bind({ when: obj, triggers: 'event',  send: 'message', to: receiver })
     */
    bind: function (param) {
        dkwarning(`lifecycle.bind has been called with ${param}`);
    }

};
