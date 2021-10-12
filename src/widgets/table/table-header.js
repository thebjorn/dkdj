

import dk from "../../dk-obj";
import {TableCell} from "./table-cell";
import {cursor} from "../cursors";
import {SortDirection} from "./sort-direction";

/*
 *  Column header widget.
 */
export class TableHeader  extends TableCell {
    constructor(...args) {
        super({
            scope: 'col',
            width: undefined,
            sortable: true,

            name: undefined,
            label: undefined,
            title: undefined,
            format: undefined,
            field: undefined,
            table: undefined,

            template: {root: 'th'},

        }, ...args);
    }
    

    construct() {
        if (this.sortable) {
            this.sort_icon = SortDirection.create_inside(this.widget(), {
                width: '2ex'
            });
        }
        this.title = this.description;
    }

    handlers() {
        const self = this;
        if (this.sortable) {
            self.widget().on('click', function () {
                self.table.set_sort(self);
            });
            dk.on(this.sort_icon, 'sort', () => this.set_sort_cursor());
        }
    }

    set_sort_cursor() {
        if (this.sortable) {
            const _cursor = this.sort_icon.direction === 'desc' ? 'down' : 'up';
            this.widget().css('cursor', cursor(_cursor));
            // this.table.notify('sort', this.sort_icon.direction);
            // this.table.trigger('sort', this.sort_icon.direction);
            dk.trigger(this.table, 'sort', this.sort_icon.direction);
        }
    }

    draw() {
        this.widget().attr({
            title: this.title,
            scope: this.scope,
            fieldname: this.name
        }).append(this.label);
        if (this.sortable) this.set_sort_cursor();
    }
}
