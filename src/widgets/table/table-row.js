
/*
 *  A Data Record widget.
 */
import dk from "../../dk-obj";
import {Widget} from "../../widgetcore/dk-widget";
import {TableCell} from "./table-cell";
import {TableRowLayout} from "../../layout/table-layout";


export class TableRow extends Widget {
    constructor(...args) {
        super({
            dklayout: TableRowLayout,
            rownum: null,
            record: null,
            table: null,
            cells: [],
            template: {root: 'tr'},
        }, ...args);
    }
    
    delete_widget() {
        delete this.record;
        delete this.table;
        this.cells.forEach(c => {if (c) c.delete_widget();});
        this.cells = [];
        super.delete_widget();
    }

    construct() {
        const record = this.record;
        const table = this.table;
        this.widget().attr({
            pk: record.pk,
            rownum: this.rownum
        });
        this.cells = table.column_order.map(fname => {
            const coldef = table.column[fname];
            return TableCell.create_on(this.layout.add_td(), {
                tablerow: this,
                coldef: coldef
            });
        });
    }
    
    flash() {
        this.widget().addClass('item-flash');
        this.widget().on('animationend', () => this.widget().removeClass('item-flash'));
    }
    
    handlers() {
        // XXX: maybe flash only changed fields?
        dk.on(this.record, 'updated', fields => this.flash());
    }

    get_column_value(coldef) {
        return coldef.get_value(this.record);
    }
    set_column_value(coldef, val) {
        this.record[coldef.name] = val;
    }
}
