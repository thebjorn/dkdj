
import {sprintf} from "./sprintf";
export {sprintf} from "./sprintf";


export function twodigits(n) {
 
    
    return (n < 10? '0': '') + n; 
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

export function no_datetime(val, secs=true) {
    if (!val) return "";
    const v = val.value;
    const res = _no_datetime(v);
    // return res.slice(0, -3);
    return secs ? res : res.slice(0, -3);
}

export function no_money(v) {
    const kr = Math.round(v / 100);
    const ore = v % 100;
    return `${kr} + ${ore}`;
}

export default {
    twodigits,
    value,
    percent,
    bool,
    no_date,
    no_datetime,
    
    /*
     *  Convert val to string, based on its implied type.
     *  (keep as separate top level function so there aren't any proxy issues
     *  when using dk.format.value as a parameter).
     */
    format_value: function (val, record, cell) {
        return value(val, record, cell);
    }
    
};
