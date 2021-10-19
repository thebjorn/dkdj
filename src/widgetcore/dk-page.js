
/*
 *  page is an object representing the current web page (document).
 */
import dk from "../dk-obj"
import globalThis from "../lifecycle/dkglobal";
import {State} from "../data/state/dk-state";
import {mcall} from "../sys/mcall";
import throttle from "lodash.throttle";
import {dkconsole} from "../lifecycle/dkboot/dk-console";
import {dkwarning} from "../lifecycle/coldboot/dkwarning";
import {HashStorage} from "../data/state/hash-storage";


let _ready_queue = [];

const page = {
    // initial module state
    name: 'page',
    triggers: ['load_js'],
    _sockets: ['load_css', 'load_js'],
    _bindings: {},
    widgets: {},
    widget_list: [],
    widget_refresh_q: [],
    state: {
        css: [],
        js: [],
        path: [],
        __uuid__: ''    // the current view instance.
    },

    create_widget(widget, location) {
        if (!this._initialized)
            return this._cache_widget_init(widget, location);
        widget.construct_widget(location);
    },

    storagekey(key) {
        return globalThis.window.location.hostname + globalThis.window.location.pathname + ':' + key;
    },

    // environment
    localstorage: (function () {
        if (!globalThis?.window?.localStorage) return false;
        try {
            return 'localStorage' in globalThis.window && globalThis.window.localStorage !== null;
        } catch (e) {
            return false;
        }
    }()),

    hash: new State({engine: State.HashStorage, name: 'page'}),

    /*
     *  All attributes are strings..
     *
     *      param := {
     *          when: src,
     *          triggers: eventname,
     *          send: message,
     *          to: dst,
     *          convert: fn
     *      }
     *
     *   page._bindings is  {
     *       src: {
     *           eventname: [ {to:dst, send:message, convert:fn}... ]
     *           ...
     *       ...
     *   }
     */
    bind(param) {
        const src = param.when;
        if (!this._bindings[src]) {
            this._bindings[src] = {};
        }
        if (!this._bindings[src][param.triggers]) {
            this._bindings[src][param.triggers] = [];
        }
        this._bindings[src][param.triggers].push(param);
    },

    ready(fn) {
        if (this._initialized) {
            fn.apply(this, arguments);
        } else {
            _ready_queue.push({fn: fn, args: arguments});
        }
    },

    initialize(doc) {

        // cleanup widget queue
        this._initialized = true;
        for (let i = 0; i < this._widget_q.length; i++) {
            const w = this._widget_q[i];
            w.widget.construct_widget(w.location);
            this.widget_list.push(w.widget);
        }
        this._widget_q = [];

        // cleanup bind queue
        for (let i = 0; i < this._bind_q.length; i++) {
            this.bind(this._bind_q[i]);
        }
        this._bind_q = [];

        const rawpath = doc.location.pathname.split('/');
        for (let i = 0; i < rawpath.length; i++) {
            if (rawpath[i] > "") {
                this.state.path.push(rawpath[i]);
            }
        }

        // cleanup ready queue
        _ready_queue.forEach(item => {
            item.fn.apply(this, item.args);
        });
        _ready_queue = [];

        dk.$(globalThis.window).on('resize', throttle(function () {
            mcall(self.widgets, 'flow');
        }, 25));

        dk.$(globalThis.window).on('unload', this.unload.bind(this));
    },

    reflow() {
        mcall(this.widgets, 'flow');
    },

    refresh() {
        mcall(this.widgets, 'refresh', this);
        return this;
    },

    refresh_widget(widget, seconds) {
        const itimer = window.setInterval(function () {
            widget.refresh();
        }, seconds*1000);
        this.widget_refresh_q.push(itimer);
    },

    _cache_widget_init(widget, location) {
        this._widget_q.push({
            widget: widget,
            location: location
        });
    },

    unload() {
        for (let i = 0; i < this.widget_refresh_q.length; i++) {
            window.clearInterval(this.widget_refresh_q[i]);
        }
    },


    /*  @DEPRECATED?
     *  src is a real object, eventname is a string, args is a list.
     */
    trigger(src, eventname, args) {
        dkwarning("$notify is deprecated..");
        dkconsole.debug('page._bindings', this._bindings);
        dkconsole.debug('$notify: ', src.id, '.', eventname, '(', args, ')');
        const src_bindings = this._bindings[src.id];
        if (src_bindings && src_bindings[eventname]) {
            src_bindings[eventname].forEach(function (param) {
                const dst = param.to === 'page'? this: this.widgets[param.to];
                if (dst && dst[param.send]) {
                    if (param.convert) {
                        args = param.convert.apply(src, args);
                    }
                    //                    if (!_.isArray(args)) {
                    //                        args = [args];  // args can be singular from the sender, but must be array to .apply below.
                    //                    }
                    // the problem: how to notify with an array argument?
                    // calling apply will convert it to varargs
                    // ==> should only notify with one arg, {...}
                    dkconsole.debug('....handled:', param.to, '.', param.send);
                    //dst[param.send].apply(dst, args);
                    dst[param.send].call(dst, args);
                } else {
                    dkconsole.warn("Missing method:", param.to, '.', param.send);
                }
            });
        }
        dk.$(src).trigger(eventname, args);
    },

    // private..
    _initialized: false,
    _widget_q: [],
    _bind_q: []
};

// if (globalThis._dk_browser) {
page.ready(() => {
    // module init
    dk.$(document).ready(function () {
        dkconsole.debug("initializing page");
        page.initialize(document);
        dk.$('html').addClass('dk-initialized');
        dk.trigger(document, 'dk-initialized');
        dkconsole.debug("document.ready: dk-initialized");
    });

    dk.$(window).on('load', function () {
        // add css class that enables css animations.
        dk.$('html').addClass('dk-fully-loaded');
        dk.trigger(window, 'dk-fully-loaded');
        dkconsole.debug("window.load: dk-fully-loaded");
    });
});
// } else {
//     page.ready(() => {
//         dkconsole.debug('delayed page init');
//        
//     });
// }

globalThis.$$ = page.widgets;
// globalThis.$notify = page.trigger.bind(page);

export default page;
