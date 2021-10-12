
import dk from "../../../dk-obj";
import {UIWidget} from "../../../widgetcore/ui-widget";
import {dkwarning} from "../../../lifecycle/coldboot/dkwarning";


export class Leaf extends UIWidget {
    constructor(...args) {
        super({
            type: 'dk-tree-list-leaf',
            tree_data: null,     // dk.tree.Leaf
            structure: {
                classes: ['leaf']
            },
            template: {
                root: 'li'
            },
            
        }, ...args);
    }
    
    decorate_widget() {
        this.widget()
            .attr('nodeid', this.tree_data.id)
            .attr('kind', this.tree_data.kind)
            .addClass(this.tree_data.kind);
    }
    construct() {
        this.decorate_widget();
        this.widget().text(this.tree_data.name);
    }
    select() {
        this.trigger('select', this);
    }
    handlers() {
        const self = this;
        this.widget().on('click', function (e) {
            e.stopImmediatePropagation();
            self.select();
        });
    }
}

export class Tree extends UIWidget {
    constructor(...args) {
        super({
            tree_data: null,                 // dk.tree.Tree (could also be Leaf iff root w/o children).
            animation: undefined,       // jQuery animation to pass to .hide()/.show()
            children: null,
            collapsed: false,
            icons: {
                closed: 'plus-square-o:fw',
                open: 'minus-square-o:fw',
                childless: 'square-o:fw'
            },
            structure: {
                classes: ['tree'],
                icon: { template: '<dk-icon/>' },
                label: { template: '<span/>' },
                subtree: { template: '<ul/>' }
            },
            template: {root: 'li'},
            
        }, ...args);
    }
    
    /*
     *  Get currently correct icon.
     */
    get_icon() {
        if (this.tree_data.children.length === 0) return this.icons.childless;
        if (this.collapsed) return this.icons.closed;
        return this.icons.open;
    }
    construct() {
        this.widget()
            .attr('nodeid', this.tree_data.id)
            .attr('kind', this.tree_data.kind)
            .addClass(this.tree_data.kind);
        this.icon.attr('value', this.get_icon());
        this.label.text(this.tree_data.name);
    }
    collapse(boolval) {
        const subtree = this.widget('> .subtree');
        if (boolval === undefined) boolval = !this.collapsed;  // for toggle behavior
        if (boolval) {
            subtree.hide(this.animation);
            this.trigger('collapse', this);
        } else {
            subtree.show(this.animation);
            this.trigger('expand', this);
        }
        this.collapsed = boolval;
        this.icon.attr('value', this.get_icon());
    }
    handlers() {
        const self = this;
        this.widget('dk-icon, span').on('click', function (e) {
            self.collapse();
            e.stopImmediatePropagation();
        });
    }
}


/*
 *  dk.tree.list.TreeWidget is the outermost tree widget.
 *  It also implements the visitor protocol for dk.tree.Leaf|Tree.
 */
export class TreeWidget extends UIWidget {
    constructor(...args) {
        if (args.length > 0 && args[0].data && !args[0].tree_data) {
            dkwarning("TreeWidget created with .data and not .tree_data!");
        }
        super({
            type: 'dktree',
            tree_data: null,             // dk.tree.DataSource
            animation: undefined,   // to pass to .show()/.hide()
            initial_collapse: true, // should only roots (true) be showing?

            roots: [],
            nodes: {},
            treewidget: Tree,
            leafwidget: Leaf,

            structure: {
                classes: ['panel', 'panel-default'],
                panel_body: {
                    tree: {
                        template: '<ul/>',
                        css: {
                            paddingLeft: 0
                        }
                    }
                }
            },
        }, ...args);
        this.nodes = {};
    }

    construct() {
        dk.on(this.tree_data, 'fetch-data-start', () => this.start_busy());
        dk.on(this.tree_data, 'fetch-data', () => this.draw());
        dk.on(this.tree_data, 'fetch-data', () => this.end_busy());
    }

    draw(data) {
        if (!data && this.tree_data && this.tree_data.__fetched) data = this.tree_data;
        if (!data) {
            this.tree_data.fetch();
        } else {
            this.trigger('draw-start', this);
            dk.debug("start tree draw", new Date());
            this.panel_body.tree.empty();
            this.roots = this.tree_data.roots.map(r => {
                return r.visit(this.panel_body.tree, this);
            });
            if (this.initial_collapse) {
                this.roots.forEach(function (r) {
                    r.collapse(true);
                });
            }
            dk.debug("finished tree draw", new Date());
            this.trigger('draw-end', this);
        }
    }

    // visitor methods..
    leaf(location, node) {
        const self = this;
        const leaf = this.leafwidget.append_to(location, { tree_data: node, tree: self });
        this.nodes[node.id] = leaf;
        return leaf;
    }
    tree(location, node) {
        const self = this;
        const t = this.treewidget.append_to(location, {
            tree_data: node,
            tree: self,
            animation: this.animation
        });

        t.children = node.children.map(function (item) {
            const child = item.visit(t.subtree, self);
            child.parent = t;
            return child;
        });
        this.nodes[node.id] = t;
        return t;
    }
}
