
// const $ = require('jquery');
// const dk = require('../boot');
// const Widget = require('../widgetcore/dk-widget.js');

import dk from "../dk-obj";
import {Widget} from "../widgetcore/dk-widget";
import {dkconsole} from "../lifecycle/dkboot/dk-console";

export class PagerWidget extends Widget {
    constructor(...args) {
        super({
            // type: 'PagerWidget',

            pagecount: 0,               // total number of pages
            curpage: undefined,         // currently selected page (zero-based)

            classes: ['pagination'],
            css: {
                marginTop: 0,
                marginBottom: 0
            },
            template: {root: 'ul'},
            
        }, ...args);
    }
    

    /*
     *  Set the pagecount to `n`.
     */
    set_pagecount(n) {
        if (this.pagecount !== n) {
            this.pagecount = n;
            this.draw();
        }
    }

    /*
     *   Select page `n` (zero-based).
     */
    select_page(n) {
        if (n === this.curpage || this.pagecount=== 0) return;     // nothing to do
        if (n < 0 || n >= this.pagecount) {
            dkconsole.debug("PagerWidget.select_page: out of bounds ", n, this);
            return;
        }
        this.curpage = n;
        this.draw();
        this.trigger('select-page', n);
    }

    handlers() {
        const self = this;
        this.widget().on('click', 'li.page', function () {
            self.select_page(dk.$(this).data('page'));
        });
        this.widget().on('click', 'li.prev-nav', function () {
            if (self.curpage > 0) {
                self.select_page(self.curpage - 1);
            }
        });
        this.widget().on('click', 'li.next-nav', function () {
            if (self.curpage + 1 < self.pagecount) {
                self.select_page(self.curpage + 1);
            }
        });
    }
    _prerange(a, b) {
        return (b < a)? null: [a, Math.min(b + 1, a + 2)];
    }
    _postrange(a, b) {
        return (a > b)? null: [Math.max(a, b - 1), b];
    }
    draw_range(range) {
        for (let i = range[0]; i <= range[1]; i++) {
            const li = dk.$('<li/>', { page: i }).addClass('page-item page').data('page', i-1);
            li.append(dk.$('<a class="page-link" href="#"/>').text(i));
            if (i === this.curpage + 1) {
                li.addClass('active');
            }
            this.widget().append(li);
        }
    }
    draw() {
        this.widget().empty();
        this.widget().append(dk.$('<li class="page-item prev-nav"><a class="page-link" href="#">&laquo;</a></li>'));

        if (this.pagecount > 0) {
            let prerange = this._prerange(1, this.curpage - 3);
            let midrange = [Math.max(1, this.curpage - 3), Math.min(this.pagecount, this.curpage + 3)];
            let postrange = this._postrange(this.curpage + 3, this.pagecount);

            // console.log("PRE:", prerange);
            // console.log("MID:", midrange);
            // console.log("POST:", postrange);
            // console.log('----after...---');
            
            if (prerange && prerange[1] + 1 >= midrange[0]) {
                midrange[0] = 1;
                prerange = null;
            }
            if (postrange && midrange[1] + 1 >= postrange[0]) {
                midrange[1] = postrange[1];
                postrange = null;
            }
            // console.log("PRE:", prerange);
            // console.log("MID:", midrange);
            // console.log("POST:", postrange);
            if (prerange) {
                this.draw_range(prerange);
                this.widget().append(dk.$('<li class="ellipsis"><span>...</span></li>'));
            }
            if (midrange) {
                this.draw_range(midrange);
            }
            if (postrange) {
                this.widget().append(dk.$('<li class="ellipsis"><span>...</span></li>'));
                this.draw_range(postrange);
            }
        }

        this.widget().append(dk.$('<li class="page-item next-nav"><a class="page-link" href="#">&raquo;</a></li>'));
    }

}
