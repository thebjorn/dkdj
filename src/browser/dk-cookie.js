

export default {

    /**
     * Get a single cookie value
     * 
     * @param key           cookie name to get
     * @param options       .raw means don't decodeURI on the value
     * @returns {null}      the value for the cookie or null if the cookie is not set
     */
    get(key, options) {
        options = options || {};
        let result, decode = options.raw? function (s) { return s; }: decodeURIComponent;
        return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie))? decode(result[1]): null;
    },

    /**
     * Set a cookie value
     * 
     * @param key           name of cookie to set
     * @param value         the value to set the cookie to
     * @param options       {   // all options have defaults
     *                          raw: false=don't encodeURI on value, (default=true)
     *                          expires: properly formatted cookie expiration string (default=y2038) Date.toUTCString
     *                          path: the url path to set the cookie for (default=/ i.e. root)
     *                      }
     */
    set(key, value, options) {
        options = options || {expires: 'Tue, 19 Jan 2038 03:14:07 GMT', path: '/'};
        // document.cookie = '%s=%s; expires=%s'.format(key, value, options.expires);
        const val = options.raw ? value : encodeURIComponent(value);
        const samesite_policy = options.samesite ? options.samesite : 'Lax';
        document.cookie = `${encodeURIComponent(key)}=${val}; expires=${options.expires}; path=${options.path}; SameSite=${samesite_policy}`;
    },


    /**
     * Remove a cookie, by expiring it in the past.
     *
     * @param name          name of the cookie to remove.
     */
    del(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    },

    /**
     * Returns all cookies as a dict(name => value)
     */
    all() {
        const res = {};
        if (document.cookie === "") return res;
        document.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            res[name] = value;
        });
        return res;
    },
    
    includes(key) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(key).replace(/[\-.+*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    
    keys() {
        return Object.keys(this.all());
    },
    
    entries() {
        return Object.entries(this.all());
    }


};
