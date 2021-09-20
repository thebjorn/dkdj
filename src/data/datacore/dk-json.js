
import dk from "../../dk-obj";
import datatypes from "./dk-datatypes";


/*
 *  JSON handling of complex data types.
 */
export default {
    parse(s) {
        return JSON.parse(s, function (key, val) {
            if (typeof val === 'string' && val[0] === '@') {
                const colonpos = val.indexOf(':');
                if (colonpos > 1) {
                    const tag = val.slice(0, colonpos + 1);
                    if (!datatypes._datatypes[tag]) {
                        dk.warn("Uknown tag:", tag, "in value", val);
                        // dk.info("tags:", _datatypes);
                        return val;
                    }
                    return datatypes._datatypes[tag].create(val);
                }
            }
            return val;
        });
    },
    stringify(val) {
        return JSON.stringify(val);
    },
    postparse(jsonval) {
        return this.parse(JSON.stringify(jsonval));
    }
};
