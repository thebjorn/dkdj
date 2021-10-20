/*
 *  This file defines the boot-up sequence, ensuring that all fundamental components are
 *  loaded in the correct order.
 *
 *  To be included here, a module must be both free of internal dependencies (besides the ones
 *  that have been carefully ordered here), and generally useful (i.e. would have been imported
 *  in most modules), or cause unwanted import requirements if they were located elsewhere.
 *
 *  This file exports the `dk` namespace.
 *
 *  Note on JS scoping:
 *
 *  Function declarations/statements  (hoisted/global)
 *  --------------------------------------------------
 *
 *  They are hoisted and become properties of the global object.
 *
 *      fn();                           // No error
 *      function fn() {}
 *      console.log('fn' in window);    // true
 *
 *  Function expressions with ``var`` (hoisted/global)
 *  --------------------------------------------------
 *
 *  They are not hoisted, but a variable declared in the global scope always
 *  becomes a property of the global object.
 *
 *      fn();                           // TypeError
 *      var fn = function () {};
 *      console.log('fn' in window);    // true
 *
 *  Function expressions with ``let`` (!hoisted/!global/is module-global)
 *  ---------------------------------------------------------------------------
 *
 *  They are not hoisted, they do not become properties of the global object,
 *  but you can assign another value to your variable. Since JavaScript is
 *  loosely typed, your function could be replaced by a string, a number,
 *  or anything else.
 *
 *      fn();                           // ReferenceError
 *      let fn = () => {};
 *      console.log('fn' in window);    // false
 *      fn = 'Foo';                     // No error
 *
 *  Function expressions with ``const`` (!hoisted/!global/is module-global)
 *  -------------------------------
 *
 *  They are not hoisted, they do not become properties of the global object
 *  and you cannot change them through re-assignment. Indeed, a constant
 *  cannot be redeclared.
 *
 *      fn();                           // ReferenceError
 *      const fn = () => {};
 *      console.log('fn' in window);    // false
 *      fn = 'Foo';                     // TypeError
 *
 */
// import "@babel/polyfill"; // must be first

import dk from "./dk-obj";
// import performance from "./performance-timer";


// import Lifecycle from "./lifecycle";
// performance('loaded-Lifecycle');

import sys from "./sys";
// performance('loaded-sys');

import state from "./data/state/dk-state";
// performance('loaded-dk-state');

// import core from "./core";
// performance('core');

// // make sure we're not imported again..
// if (globalThis && globalThis.dk) {
//     let cver = globalThis.dk.__version__ || 'unknown';
//     let myver = __version__ || 'unknown';
//     throw `Trying to import dk.js (v${myver}), but dk.js (v${cver}) is already imported.`;
// }

// // import "@webcomponents/webcomponentsjs";
// // import DkIcon from "./xtags/dk-icon";


// dk.performance('made-dk');
import cookie from "./browser/dk-cookie";
import format from "./data/datacore/dk-format";
import jason from "./data/datacore/dk-json";
import {parse_uri} from "./lifecycle/uri";
import {DateTime, DkDate, Duration} from "./data/datacore/dk-datatypes";
import dom from "./browser/dom";
import {Template, DomItem} from "./browser/dk-dom-template";
import utidy from "./browser/dk-html";
import css from "./browser/dk-css";
import old_vs_new from "./dk-old-vs-new";
import {jq_get_attributes, jq_help_button, jq_links2popup, jq_toggle_busy} from "./browser/jquery-plugins";
import page from "./widgetcore/dk-page";
import widgetmap from "./widgetcore/dk-widgetmap";
import {Layout} from "./layout/dk-layout";
import {Widget} from "./widgetcore/dk-widget";
import {dkrequire_urls, dkrequire} from "./lifecycle/browser/dk-require";
import {icon, jq_dkicons, dkicon} from "./widgets/dk-icon-library";
import browser_version from "./browser/browser-version";
import {count_char, dedent} from "./text/text-utils";
import {PanelWidget} from "./widgets/dk-panel";
import {ListLayout} from "./layout/list-layout";
import {TableRowLayout, ResultsetLayout, TableLayout} from "./layout/table-layout";
import {CheckboxSelectWidget, DurationWidget, RadioInputWidget, RadioSelectWidget, SelectWidget, TextInputWidget, TriboolWidget} from "./forms/widgets";
import {validate} from "./forms/validators";
import {InputWidget} from "./forms/input-widget";
import {ArraySource} from "./data/source/dk-array-datasource";
import {DataSource} from "./data/source/dk-datasource-base";
import {cursor} from "./widgets/cursors";
import {ColumnDef} from "./widgets/table/column-def";
import counter from "./core/counter";
import {dkwarning} from "./lifecycle/coldboot/dkwarning";
import {TableCell} from "./widgets/table/table-cell";
import {TableRow} from "./widgets/table/table-row";
import {TableHeader} from "./widgets/table/table-header";
import {SortDirection} from "./widgets/table/sort-direction";
import {wmap} from "./forms/widgetmap";
import {JSONDataSource} from "./data/source/dk-json-datasource";
import {ajax, json} from "./browser/dk-client";
import {AjaxDataSource} from "./data/source/dk-ajax-datasource";
import {PusherDataSource} from "./data/source/dk-pusher-datasource";
import {DataPage} from "./data/dk-datapage";
import {DataSet} from "./data/dk-dataset";
import {DataTable, DataTableLayout} from "./widgets/table/data-table";
import {DataGrid} from "./widgets/table/datagrid/datagrid";
import {SearchWidget} from "./widgets/search-widget";
import {PagerWidget} from "./widgets/pager-widget";
import {ResultSet} from "./widgets/table/resultset/resultset";
import {DataGridRow} from "./widgets/table/datagrid/datagrid-row";
import {DataFilter} from "./widgets/filter/data-filter";
import tree_data from "./widgets/tree/tree-data";
import {dkmodule} from "./lifecycle/lifecycle";
import {PostnrLookupWidget} from "./widgets/postnr-lookup";
import {Leaf, Tree, TreeWidget} from "./widgets/tree/tree-list/tree-list";
import {Generation} from "./widgets/tree/tree-table/generation";
import {NodeList} from "./widgets/tree/tree-table/node-list";
import {TableTree} from "./widgets/tree/tree-table/table-tree";
import {Node as TreeNode} from "./widgets/tree/tree-table/tree-node";
import {VDataTable} from "./widgets/table/vert/vdata-table";
import {help} from "./core/help";
import "./browser/dk-load-tag";
import {sprintf} from "./data/datacore/sprintf";
import {BaseWidget} from "./widgetcore/dk-base-widget";
import {DataWidget} from "./widgetcore/data-widget";
import {ServerWidget} from "./widgetcore/server-widget";
import {HashStorage} from "./data/state/hash-storage";
import {ValueRef} from "./data/source/dk-datasource-base";
import globalThis from "./lifecycle/dkglobal";
import {init_test} from "./widgetcore/test-utils";

if (!String.prototype.format) {
    String.prototype.format = function (...args) {
        dkwarning('.format() is deprectated, use template strings with substitutions instead.');
        return sprintf(...args);
    };    
}

(function () {
    dk.add({
        page,
        init_test,
        sys,
        // core,
        ColumnDef,
        TableCell,
        TableHeader,
        TableRow,
        TreeWidget,
        DataTable,
        VDataTable,
        DataTableLayout,
        DataGrid,
        SearchWidget,
        PagerWidget,
        ResultSet,
        SortDirection,
        DataFilter,
        PostnrLookupWidget,
        TableTree,
        
        State: state.State,
        format,
        format_value: format.value,
        Date: DkDate,
        DateTime,
        Duration,
        jason,
        parse_uri,
        ...dom,
        Template,
        DomItem,
        node: dom.create_dom,
        // here: dom.here,
        utidy,
        css,
        BaseWidget,
        DataWidget,
        ServerWidget,
        Widget,
        Panel: PanelWidget,
        panel: {
            PanelWidget
        },
        icon,
        dkicon,
        cursor,
        browser: browser_version,
        
        initialize: dkmodule.initialize,
        
        forms: wmap,
        // {
        //     CheckboxSelectWidget,
        //     DurationWidget,
        //     InputWidget,
        //     RadioInputWidget,
        //     RadioSelectWidget,
        //     SelectWidget,
        //     TextInputWidget,
        //     TextWidget: TextInputWidget,
        //     TriboolWidget,
        //     validators: validate,
        //     widgetmap: wmap
        // },
        help,
        core: {
            help,
            text: {
                count: count_char,
                dedent
            },
            counter,
            lifecycle: dkmodule
        },
        ctor_apply(...args) {
            dkwarning("dk.ctor_apply is no longer needed and has been deprecated.");
        },
        
        layout: {
            Layout,
            ListLayout,
            TableRowLayout, 
            ResultsetLayout, 
            TableLayout
        },
        
        filter: {
            DataFilter
        },

        widget: {
            page,
            Widget,
            widgetmap: {
                get() { dkwarning("widgetmap.get is deprecated"); },
                add() { dkwarning("widgetmap.add is deprecated"); },
                wmap: {
                    CheckboxSelectWidget,
                    InputWidget,
                    DurationWidget,
                    RadioInputWidget,
                    RadioSelectWidget,
                    SelectWidget,
                    TableCell,
                    TableRow,
                    TableHeader,
                    TriboolWidget,
                    PanelWidget,
                    SortDirection,
                    TextInputWidget,
                    DataGridRow,
                    search: SearchWidget,
                    datagrid: DataGrid,
                    datatable: DataTable,
                    resultset: ResultSet,
                    ['postnr-lookup-widget']: PostnrLookupWidget,
                    ['dk-tree-list-leaf']: Leaf,
                    ['dk-tree-list-tree']: Tree,
                    ['dk-tree-generation']: Generation,
                    ['tree-node']: TreeNode,
                    treeselect: TableTree,
                    ['treeselect-nodelist']: NodeList, 
                    ['vTableColumn']: VDataTable,
                    ['vdatatable']: VDataTable,
                    dktree: TreeWidget,
                    PagerWidget,
                    DataFilter
                }
            }
        },
        
        update(...args) {
            return Object.assign(...args);
        },
        data: {
            Source: DataSource,
            ArraySource,
            JSONDataSource,
            AjaxDataSource,
            PusherDataSource,
            DataPage,
            DataSet,
            Data: DataSet,
            datatype: {
                Date: DkDate,
                DateTime,
                Duration,
                _datatypes: {}
            },
            format: {format},
            jason
        },
        
        ValueRef,

        table: {
            ColumnDef,
            TableCell,
            TableRow,
            TableHeader,
            SortDirection,
            DataTable,
            VDataTable,
            DataTableLayout,
            DataGrid,
            PagerWidget,
            ResultSet,
            SearchWidget
        },

        tree: {
            JSonDataSource: tree_data.JSonDataSource,
            AjaxDataSource: tree_data.AjaxDataSource,
            data: tree_data,
            list: {
                Leaf,
                Tree,
                TreeWidget
            },
            Generation,
            NodeList,
            SelectTable: TableTree,
            TableTree,
        },
        
        ajax,
        json,
        web: {
            browser: {
                browser: browser_version,
            },
            cookie,
            uri: {parse: parse_uri},
            dom: {
                ...dom,
                Template: Template,
                DomItem: DomItem
            },
            html: {
                tidy: utidy
            },
            css,
            state,
            client: {
                ajax,
                json
            }
        },
        dom: {
            ...dom,
            DomItem,
            Template
        },
        dkrequire,
        require: {
            css: dkrequire_urls,
            js: dkrequire_urls
        },
        unsorted: {
            cursor,
            icons: {
                icon,
                // icons: {IconLibrary}
            },
            PostnrLookupWidget
        },
        ready(fn) {
            if (!globalThis._dk_browser) {
                page.ready(fn);
            } else {
                dk.$(fn);
            }
        }
    });
    
    
    dk.data.format.format_value = format.format_value;

    // print out all startup performance metrics 
    // eslint-disable-next-line no-console
    // console.log("PERFORMANCE:", dk.performance.toString());
    
    // customElements.define('dk-icon', new dk.DkIcon());
    
    // //
    // // export global jQuery/underscore..
    // //
    // if (!globals.$ && !scripttag_attributes['hide-jquery']) {
    //     // Prevent export of jquery by adding a hide-jquery attribute to the script tag:
    //     // <script hide-jquery src="/dkdj/dist/index.js"></script>
    //     globals.$ = $;
    //     globals.jQuery = $;
    // }
    //
    // if (!globals._ && !scripttag_attributes['hide-underscore']) {
    //     // <script hide-underscore src="/dkdj/dist/index.js"></script>
    //     globals._ = _;
    // }

    // old_vs_new(dk);

    dk.info('dk loaded');
    dk.ready(function () {
        jq_links2popup(dk);
        jq_dkicons(dk);
        jq_help_button(dk);
        jq_get_attributes(dk);
        jq_toggle_busy(dk);

        dk.info('dk-fully-loaded');
    });
    
})();

export {dk};
