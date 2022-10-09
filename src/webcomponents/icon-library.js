"use strict";

import {create_dom} from "../browser/dom";
// import _ from 'loadash';

// const Class = require('../boot/dk-class.js');
// const lifecycle = require('../core/dk-lifecycle.js');
// const _require = require('../boot/dk-require.js');
//
// const icons = {};


class IconLibrary {
    constructor() {
        this._url = '';
        this._prefix = '';
        this._classes = '';
    }

    /*
     *  name can include optional attributes::
     *
     *     play:fw,3x,li,spin,rotate-90
     *
     *  fw:             fixed witdth icon (e.g. for menus)
     *  lg,2x,3x,4x,5x: larger size
     *  border:         added border
     *  li:             list item bullet
     *  spin:           add css3 spinning animation
     *  rotate-90/180/270:
     *  flip-horizontal:
     *  flip-vertical
     */
    make_icon(name, style, item) {
        if (arguments.length === 2) {
            item = arguments[1];
            style = undefined;
        }
        name = name || "";  // catch undefined
        console.info('name:', name);
        console.info('item:', item);
        let res = item || create_dom('i');
        console.info('res:', res);
        res.classList.add('icon');
        let nameparts = name.split(':');
        name = nameparts[0];

        // res.addClass(this._classes);
        res.classList.add(...this._classes.split());

        let classname = this._prefix + (this[name] !== undefined ? this[name] : name);
        res.classList.add(classname);
        res.classList.add(name);
        if (nameparts.length > 1) {
            let attrs = nameparts[1].split(',');
            attrs.forEach(attr => {
                if (this[attr.replace('-', '_')]) {
                    res = this[attr.replace('-', '_')](res);
                } else {
                    res.classList.add(this._prefix + attr);
                }
            });
        }

        // if (style) res.css(style);

        return res;
    }
}

export default class FontAwsome4 extends IconLibrary {
    constructor() {
        super();
        this._classes = 'fa';
        this._prefix = 'fa-';
        this._url = "https://static.datakortet.no/font/fa620/css/fontawesome.min.css";
        this.remove = 'trash-o';
        this.cancel = 'times-circle-o';
        this.up = 'chevron-up';
        this.down = 'chevron-down';
        //require_css(this._url);
    }
}
