// LVL:0

const dkglobal = (function () {
    // the only reliable means to get the global object is
    // `Function('return this')()`
    // However, this causes CSP violations in Chrome apps.
    if (typeof globalThis !== "undefined") { return globalThis; }
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    if (typeof global !== 'undefined') { return global; }
    throw new Error('unable to locate global object');
})();
dkglobal.globalThis = dkglobal;

// eslint-disable-next-line no-console
console.debug("dkjs loaded from:", document.currentScript);


let _dk_script_tag = undefined;

function _find_dk_script_tag() {
    // all but IE
    if (document.currentScript !== undefined) return document.currentScript;
    // ..for IE (get the last executed script -- oh, so hackish, but the alternatives are worse)
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
}

export function get_dk_script_tag() {
    if (_dk_script_tag === undefined) {
        _dk_script_tag = _find_dk_script_tag();
    }
    return _dk_script_tag;
}


export default globalThis;
