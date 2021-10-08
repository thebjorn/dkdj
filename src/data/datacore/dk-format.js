import {sprintf} from "./sprintf";
export {sprintf} from "./sprintf";


export function twodigits(n) {
    return (n < 10 ? '0' : '') + n;
}


export function value(val, record, cell) {
    if (val == null) return "";
    //if (typeof val === "undefined") debugger;
    let v;
    if (val.v !== undefined) {
        if (val.f !== undefined) {
            v = val.f;
        } else {
            v = val.v ? val.v : "";
        }
    } else if (!val) {
        v = "";
    } else {
        v = val;
    }
    return v.toString();
}


export function percent(val) {
    if (val == null) return "";
    return val + "%";
}


export function bool(trueval, falseval) {
    return function (val) {
        if (val) return trueval;
        return falseval;
    };
}

export function _no_date(v) {
    return sprintf('%02d.%02d.%04d', v.getDate(), v.getMonth() + 1, v.getFullYear());
}

export function no_date(val) {
    if (!val) return "";
    const v = val.value;
    return _no_date(v);
}

export function _no_datetime(v) {
    return sprintf('%02d.%02d.%04d kl.%02d.%02d:%02d',
        v.getDate(), v.getMonth() + 1, v.getFullYear(),
        v.getHours(), v.getMinutes(), v.getSeconds()
    );
}

export function no_datetime(val, secs = true) {
    if (!val) return "";
    const v = val.value;
    const res = _no_datetime(v);
    // return res.slice(0, -3);
    return secs ? res : res.slice(0, -3);
}

/**
 * Return a string version of the integer value ``kr``, with
   space as the thousand-separator.
 * @param kr
 * @returns {string}
 */
export function kronestring(kr) {
    if (kr === 0) {
        return '0';
    }
    let res = '';
    let fortegn = '';
    if (kr < 0) {
        fortegn = '-';
        kr = -kr;
    } 
    let tusen;
    while (kr) {
        tusen = kr % 1000;
        kr = Math.floor(kr / 1000);
        res = `${String(tusen).padStart(3, '0')} ${res}`;
    }

    return `${fortegn}${res.trim().replace(/^0+/, '')}`;
}

/**
 * Return a string version of the integer ``øre`` value. Either a two-digit
   string or a dash (as in 5,-).
 * @param ore
 * @returns {string|string}
 */
export function orestring(ore) {
    return (ore === 0) ? '-': String(ore).padStart(2, '0');
}

/**
 * Format val as Norwegian currency.
 * @param v
 * @returns {string}
 */
export function no_money(v) {
    const kr = Math.floor(v / 100);
    const ore = v % 100;
    return `${kronestring(kr)},${orestring(ore)}`;
}

export default {
    twodigits,
    value,
    percent,
    bool,
    no_date,
    no_datetime,
    no_money,

    /*
     *  Convert val to string, based on its implied type.
     *  (keep as separate top level function so there aren't any proxy issues
     *  when using dk.format.value as a parameter).
     */
    format_value: function (val, record, cell) {
        return value(val, record, cell);
    }

};
