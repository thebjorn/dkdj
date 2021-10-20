
import globalThis from "./dkglobal"

const state = {};


export default function setup_loaders(dk) {
    if (!globalThis._dk_has_document) return;
    
    dk.performance('setup-loaders-start');
    
    const _url2name = function (url) {
        return url.split('/').slice(-1)[0];
    };
    
    /**
     * load script tags to state
     */
    dk.$('head>script[src]').each(function () {
        const src = dk.$(this).attr('src');
        state[_url2name(src)] = {
            type: 'js',
            url: src,
            loaded: true,
            item: this
        };
    });


    /**
     * Load stylesheets (.css) to state
     */
    dk.$('head>link[rel=stylesheet]').each(function () {
        const url = dk.$(this).attr('href');
        state[_url2name(url)] = {
            type: 'css',
            url: url,
            loaded: true,
            item: this
        };
    });
    
    
    const load_javascript = function (name, url, fn) {
        return dk.$.ajax({
            dataType: "script",
            cache: true,
            url: url,
            success: function () {
                state[name].loaded = true;
                dk.publish(state[name], 'loaded', url);
                if (fn) fn();
            }
        });
    };
    load_javascript.type = 'js';
    
    
    const load_css = function (name, url, fn) {
        dk.$('<link>', {
            rel: "stylesheet",
            type: 'text/css',
            href: url
        }).appendTo('head');
        state[name].loaded = true;
        dk.publish(state[name], 'loaded', url);
        if (fn) fn();
    };
    load_css.type = 'css';
    
    
    const load_url = function (loader, url, fn) {
        const name = _url2name(url);
        const loadstate = state[name];
        if (!loadstate) {
            state[name] = {
                type: loader.type,
                url: url,
                loaded: false
            };
            dk.info("require:", url);
            loader(name, url, fn);
        } else if (fn) {
            if (loadstate.loaded) {
                fn();
            } else {
                dk.on(loadstate, 'loaded').run(fn);
            }
        }
    };
    
    
    const load_all = function load_all (loader, urls, fn) {
        if (Array.isArray(urls)) {
            if (urls.length === 1) {
                return load_url(loader, urls[0], fn);
            } else {
                return load_url(loader, urls[0], function () {
                    load_all(loader, urls.slice(1), fn);
                });
            }
        } else {
            return load_url(loader, urls, fn);
        }
    };
    
    
    dk.add({
        import : {
            _loadstate: state,
            css: (url, fn) => load_all(load_css, url, fn),
            js: (url, fn) => load_all(load_javascript, url, fn)
        }
    });

    dk.performance('setup-loaders-end');
    
}
