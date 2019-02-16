/*
 * Terminology:
 *
 *  publish/subscribe
 *  on/trigger
 *  listen/notify
 *  xx/emit
 *
 */

import {dkconsole} from "./dk-console";
import dkglobal from "../dkglobal";
import {env, loglevels} from "./lifecycle-parse-script-tag";
import {dkwarning} from "../coldboot/dkwarning";

const BINDING_NOTIFY_LEVEL = env.DEBUG ? loglevels.ERROR : loglevels.INFO;


function _debugstr(obj) {
    let res = "";
    if (obj.tagName) {
        res += obj.tagName;
        if (obj.id) {
            res += '#' + obj.id;
        }
        return res;
    }
    return obj.toString();
}


const listeners = Symbol('listeners');

function _attach_listener(obj, signal, fn) {
    if (obj[listeners] === undefined) obj[listeners] = {};
    if (obj[listeners][signal] === undefined) obj[listeners][signal] = [];
    obj[listeners][signal].push(fn);
}


/**
 *  Execute `fn` once after next time obj.method() is called.
 *  `fn` receives the result of obj.method() as its argument and the
 *  return value of fn is substituted for the return value of obj.method().

 * @param obj
 * @param method
 * @param fn
 */
export function after(obj, method, fn) {
    let _meth = obj[method];
    obj[method] = function (...args) {
        obj[method] = _meth;
        return fn(obj[method](...args));
    };
}


/*
 *      dk.on(velrep, 'draw-end').run(velrep.FN('reset_bs_titles');
 */
export function on(obj, signal, optfn) {
    if (obj === null) return {run: function () {}};
    if (env.DEBUG && env.LOGLEVEL >= BINDING_NOTIFY_LEVEL) {
        if (obj && signal && optfn) {
            dkconsole.debug(`dk.on(${_debugstr(obj)}, "${signal}", run: ${optfn.toString()})`);
        } else {
            dkconsole.error("dk.on argument error:", obj, signal, optfn);
            throw new Error("Cannot listen on undefined object: " + obj);
        }
    }
    if (obj === undefined) {
        throw new Error("Cannot listen on undefined object: " + obj);
    }
    if (optfn !== undefined) {
        _attach_listener(obj, signal, optfn);
    } else {
        return {
            run: function (fn) {
                _attach_listener(obj, signal, fn);
            }
        };
    }
}


export function trigger(obj, signal, ...args) {
    if (env.DEBUG && env.LOGLEVEL >= BINDING_NOTIFY_LEVEL + 1) {
        const obj_str = _debugstr(obj);
        const nl = obj_str.length > 90 ? '\n           ' : ' ';
        const argsval = (args.length === 1 && args[0] === obj) ? 'self' : args;
        dkconsole.debug(`dk.trigger[signal=${signal}](${obj_str},${nl}ARGS=[${argsval}])`);
    }
    if (obj[listeners]) {
        if (obj[listeners][signal]) {
            obj[listeners][signal].forEach(function (fn) {
                if (fn.name) {
                    dkconsole.debug(`    run: ${fn.name}(${args})`);
                }
                fn.apply(null, args);
            });
        }
    }
}

dkglobal.$trigger = trigger;


/**
 * When `obj` emits `signal` (+ `args`), then call `fn(args)`.
 * -or- when `signal` is emitted on `obj`...
 * @param obj
 * @param signal    string
 * @param fn
 */
export function subscribe(obj, signal, fn) {
    dkwarning("dk.subscribe is deprecated, use dk.on(obj, signal, fn) instead.");
    return on(obj, signal, fn);
}

export function publish(obj, signal, ...args) {
    dkwarning("dk.publish is deprecated, use dk.trigger(obj, signal, ...args) instead.");
    return trigger(obj, signal, ...args);
}
