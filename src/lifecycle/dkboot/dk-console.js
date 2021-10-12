
/*
 *  Wrappers for console.log|warn|info|debug
 *
 *  You must add the DEBUG attribute to the script tag, or define
 *  `window.DEBUG` for this module to write anything
 *
 *     <script DEBUG src="/dkdj/dk/dk.js"></script>
 *
 *   you can get less verbose logging by setting the LOGLEVEL to a lower value
 *   (default == 4 which logs everything). E.g. to only log warnings::
 *
 *       <script DEBUG LOGLEVEL=2 src="/dkdj/dk/dk.js"></script>
 *
 *   DEBUG and LOGLEVEL can also be set as global variables.
 *
 */

import globalThis from "../dkglobal";
import {env, loglevels} from "./lifecycle-parse-script-tag";


export const dkconsole = {
    error(...args) {
        // if you get here from a test it's because console.error raises an 
        // error not because of a code issue
        if (env.LOGLEVEL >= loglevels.ERROR && globalThis.console && globalThis.console.error) globalThis.console.error(...args);
    },
    warn(...args) {
        if (env.LOGLEVEL >= loglevels.WARN && globalThis.console && globalThis.console.warn) globalThis.console.warn(...args);
    },
    log(...args) {
        if (env.LOGLEVEL >= loglevels.LOG && globalThis.console && globalThis.console.log) globalThis.console.log(...args);
    },
    info(...args) {
        if (env.LOGLEVEL >= loglevels.INFO && globalThis.console && globalThis.console.info) globalThis.console.info(...args);
    },
    debug(...args) {
        if (env.LOGLEVEL >= loglevels.DEBUG && globalThis.console && globalThis.console.debug) globalThis.console.debug(...args);
    },
    dir(...args) {
        if (env.LOGLEVEL >= loglevels.DEBUG && globalThis.console && globalThis.console.dir) {
            if (!globalThis.console.group || args.length === 0) {
                globalThis.console.dir(...args);
            } else {
                let [label, ...rest] = args;
                globalThis.console.group(typeof label === 'string'? label: '');
                const obj = args.length === 1 ? label : rest;
                globalThis.console.dir(obj);
                globalThis.console.groupEnd();
            }
        }
    }
};

// export default function setup_console() {
//     let loglevel = env.LOGLEVEL;
//     const dkconsole = {
//         error: _nullfn,
//         warn: _nullfn,
//         log: _nullfn,
//         info: _nullfn,
//         debug: _nullfn,
//         dir: _nullfn
//     };
//    
//     if (loglevel >= loglevels.ERROR && window.console.error) {
//         dkconsole.error = window.console.error.bind(window.console);
//     }
//     if (loglevel >= loglevels.WARN && window.console.warn) {
//         dkconsole.warn = window.console.warn.bind(window.console);
//     }
//     if (loglevel >= loglevels.LOG && window.console.log) {
//         dkconsole.log = window.console.log.bind(window.console);
//     }
//     if (loglevel >= loglevels.INFO && window.console.info) {
//         dkconsole.info = window.console.info.bind(window.console);
//     }
//     if (loglevel >= loglevels.DEBUG && window.console.debug) {
//         dkconsole.debug = window.console.debug.bind(window.console);
//         dkconsole.dir = function dir(label, obj) {
//             try {
//                 console.group(typeof label === 'string'? label: '');
//                 obj = arguments.length === 1 ? label : obj;
//                 console.dir(obj);
//                 console.groupEnd();
//             } catch (e) {}
//         };
//     }
//     dkconsole.info(`set LOGLEVEL attribute on script tag to a smaller value to reduce logging, currently LOGLEVEL == ${loglevel}`);
//     performance('dk-console');
// }
