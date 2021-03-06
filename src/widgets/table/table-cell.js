

import dk from "../../dk-obj";
import {Widget} from "../../widgetcore/dk-widget";
import {UIWidget} from "../../widgetcore/ui-widget";


/*
 *  The TableCell class is responsible for pushing and pulling data into a
 *  table cell.  The data itself is contained in the enclosing TableRow's
 *  `record` property.
 */
export class TableCell extends UIWidget {
    constructor(...args) {
        super({
            tablerow: null,
            coldef: null,
        }, ...args);
    }

    set value(val) {
        if (!this.tablerow) return;
        this.tablerow.set_column_value(this.coldef, val);
    }

    get value () {
        if (!this.tablerow) return null;
        return this.tablerow.get_column_value(this.coldef);
    }

    // set value(val) {
    //     if (!this.tablerow) {
    //         this.cell_value = val;
    //     } else {
    //         this.tablerow.set_column_value(this.coldef, val);
    //     }
    // }
    // get value () {
    //     if (!this.tablerow) return this.cell_value;
    //     return this.tablerow.get_column_value(this.coldef);        
    // }

    construct_edit_widget() {
        const location = this.widget();
        const coldef = this.coldef;
        const value = this.value;

        let width = location.width();
        location.empty();
        const edit_widget = coldef.widget_type.create_inside(location, {
            data: coldef.widget_data || {},  // eg. data to fill a drop-down list.
            url: coldef.widget_url,    // url to fetch data from
            css: { border: 'none' }
        });

        if (coldef.widget_type === 'SelectWidget') width += 20;  // XXX: yeuch!
        edit_widget.widget().width(width);
        edit_widget.value = value;  // does the right thing for select too..
        return edit_widget;
    }

    start_editing() {
        // prevent infinite recursion
        if (this.editing || this.coldef.editable === false) return;
        this.editing = true;

        if (!this._undo_stack) this._undo_stack = [];
        this._undo_stack.push(this.value);              // save current value, in case of undo.

        this.edit_widget = this.construct_edit_widget();

        // update field immediately on change (we can still undo..)
        this.edit_widget.widget().on('change', () => {
            const oldval = this.value;
            this.value = this.edit_widget.get_field_value();
            dk.trigger(this, 'dirty', this.coldef, this.value, this.edit_widget, oldval);
        });
    }

    save_editing() {
        if (this.coldef.editable === false) return;
        this.value = this.edit_widget.get_field_value();
        this._undo_stack.pop();
    }

    undo_editing() {
        if (this.coldef.editable === false) return;
        this.value = this._undo_stack.pop();
    }

    stop_editing() {
        if (this.coldef.editable === false) return;
        this._undo_stack = [];
        this.widget().empty();
        this.draw();
        this.editing = false;
    }
    
    handlers() {
        const draw_cell = (fieldname, newval) => {
            if (this.coldef.name === fieldname) {
                this.draw(newval)
            }
        };
        dk.on(this.tablerow.record, 'change', draw_cell);
        dk.on(this.tablerow.record, 'updated', fields => {
            fields.forEach(({fieldname, value}) => draw_cell(fieldname, value));
        });
    }

    draw(value) {
        const val = this.value === undefined ? value : this.value;
        const w = this.widget().attr({
            axis: this.coldef.name,
            title: this.coldef.title
        });
        // const rec = this.tablerow ? this.tablerow.record : null;
        const rec = this.tablerow.record;
        try {
            const fmtval = this.coldef.format(val, rec, this.widget());
            w.html(fmtval);
        } catch (e) {
            dk.error(`
                The .format() method on column ${this.coldef.name} raised an exception
                
                ${e}

                on value ${val}
                and record: ${rec}
            `);
            throw e;
        }
    }
}
