import dk from "../dk-obj";
import Class from "../lifecycle/coldboot/dk-class";
import widgetmap from "./dk-widgetmap";
import page from "./dk-page";
import {BaseWidget} from "./dk-base-widget";
import counter from "../core/counter";
import {Layout} from "../layout/dk-layout";
import {dkconsole} from "../lifecycle/dkboot/dk-console";
import {dkwarning} from "../lifecycle/coldboot/dkwarning";


export class UIWidget extends BaseWidget {
    constructor(...attrs) {
        let props = {
            id: null,                   // DOM id of this widget (foo-widget-43)
            dklayout: 'Layout',
            template: {root: 'div'},
        };
        Array.from(attrs).forEach(obj => {
            if (obj == null) return;
            if (props.template != null && obj.template != null) {
                props.template = dk.merge(props.template, obj.template);
            }
            if (props.structure != null && obj.structure != null) {
                props.structure = dk.merge(props.structure, obj.structure);
            }
            if (props.defaults != null && obj.defaults != null) {
                props.defaults = dk.merge(props.defaults, obj.defaults);
            }
            Object.assign(props, obj);
        });

        super(props);

        this._widget_props = {
            visible: false,
            ready: false,
            busy: false,
            mode: null,  // 'design'
        };

        if (this.type === undefined) this.type = this.constructor.name;

        this._node = null;
    }

    set(field, value) {
        this[field] = value;
        this.trigger('set-field', this, field, value);
        this.draw(null);
    }

    /*
     *  Short hand for forwarding an event, e.g. a click event on this
     *  widget into a click notification from this widget.
     */
    notify_on(evtname) {
        dkwarning(`Widget.notify_on is deprecated, use Widget.retrigger instead`);
        const self = this;
        this.widget().on(evtname, function () {
            self.trigger(evtname, self);
        });
    }

    /*
     *  Short hand for forwarding an event, e.g. a click event on this
     *  widget into a click notification from this widget.
     */
    retrigger(evtname) {
        const self = this;
        this.widget().on(evtname, function (event) {
            self.trigger(evtname, self, event);
        });
    }

    start_busy() {
        dk.debug("START-BUSY: ", this.id);
        if (this._widget_props.busy) return;
        // if (this.__busy) return;
        const shim_id = counter('busy-shim-');
        // this.__busy = shim_id;
        this._widget_props.busy = shim_id;
        const self = this;
        this.widget().addClass('busy');
        let count = 0;

        const adjust_size = function () {
            const shim = dk.$('#' + shim_id);
            const offset = self.widget().offset();
            shim.css({
                width: self.widget().outerWidth(),
                height: self.widget().outerHeight(),
                left: offset.left,
                top: offset.top
            });
            if (++count > 500) window.clearInterval(self.busyID);
        };

        if (this.widget().offset) {
            const shim = dk.$('<div/>', {busy: self.id}).prop('id', shim_id).css({
                position: 'absolute',
                zIndex: 999,
                backgroundColor: 'rgba(222,222,222,.5)'
            }).addClass('busy');
            adjust_size();
            this.busyID = window.setInterval(adjust_size, 100);
            dk.$('body').append(shim);
        }
    }

    end_busy() {
        dk.debug("END-BUSY: ", this.id);
        // if (!this.__busy) return;
        if (!this._widget_props.busy) return;
        window.clearInterval(this.busyID);
        // const shim_id = this.__busy;
        const shim_id = this._widget_props.busy;
        // this.__busy = false;
        this._widget_props.busy = false;
        this.widget().removeClass('busy');
        dk.$('#' + shim_id).remove();
    }
    
    toggle_busy() {
        if (this._widget_props.busy) {
            this.end_busy();
        } else {
            this.start_busy();
        }
    }
    
    hide() {
        this.widget().hide('fast');
        // this._visible = false;
        this._widget_props.visible = false;
    }

    show()  {
        this.widget().show('fast');
        // this._visible = true;
        this._widget_props.visible = true;
    }

    toggle() {
        this.widget().toggle('fast');
        this._visible = !this._visible;
    }

    /**
     * widget (DOM) jQuery selector.
     */
    widget(selector) {
        // usage:  this.widget('.checkins').replaceWith(...);
        const me = dk.$('#' + this.id);
        return (selector) ? me.find(selector) : me;
    }

    /**
     * Return the DOM node of this widget.
     * @returns {null}
     */
    get node() {  // cached accessor to underlying dom node.
        if (!this._node) {
            this._node = document.getElementById(this.id);
        }
        return this._node;
    }

    ready(fn) {
        // if (this.__ready) fn.call(this);
        if (this._widget_props.ready) fn.call(this);
        dk.after(this, 'render_data', fn);
    }
    
    /*
     *  `construct_widget()` is called by `page.create_widget` when the
     *  page has been initialized.
     */
    construct_widget(location) {
        // dk.debug('construct widget', this);
        if (location.inside) {
            this.prepare_layout(location.inside, location.append);
        } else if (!this.id && location.on) {
            const locid = location.on.prop('id');
            if (locid) {
                this.set_widget_id(locid);
            } else {
                const widgetid = this.constructor.next_widget_id();
                location.on.prop('id', widgetid);
                this.set_widget_id(widgetid);
            }
        } else {
            this.set_widget_id(this.id);
        }
        // at this point this.widget() exists in the dom and is
        // the element onto which the widget should be created
        page.widgets[this.id] = this;
        // dkconsole.debug("construct_widget:", this.id);

        this.create_layout(this.widget(), this.template, this.structure);
        this.construct();

        this.initialize();
        this._widget_props.visible = true;
        // console.log("CHECKED:LEN:1", this.widget().find('input:checked').length);

        if (this.handlers) this.handlers();
        // console.log("CHECKED:LEN:2", this.widget().find('input:checked').length);
        this.render_data();
        // console.log("CHECKED:LEN:3", this.widget().find('input:checked').length);

        this._widget_props.ready = true;
        // this.__ready = true;
        this.trigger('ready', this);
        return this;
    }

    /*  #1 (only for create_inside)
     *  Widget creation: root element
     *  prepare_layout() is called if we're creating the widget
     *  inside location (as opposed to creating the widget onto
     *  an existing dom element).
     *
     *  Find, or create the root element and append it to location,
     *  and set everything up so this.widget() will work.
     */
    prepare_layout(location, append) {
        let dom, id;
        location = dk.$(location);
        const exists = location.find(this.template.root);

        if (append) {  // force append
            dom = dk.$('<' + this.template.root + '/>');
            location.append(dom);
        } else {
            if (exists.length >= 1) {
                dom = dk.$(exists[0]);
            } else {
                dom = dk.$('<' + this.template.root + '/>');
                location.append(dom);
            }
        }
        id = dom.prop('id');
        if (!id) {
            id = this.constructor.next_widget_id();
            dom.prop('id', id);
        }
        this.set_widget_id(id);
    }

    /*  #2 (used to be more complex..)
     *  set the id of the widget.
     */
    set_widget_id(new_id) {
        this.id = new_id;
    }
    
    /*  #3  Create widget.layout
     *  If the widget has a .dklayout member, then that layout class
     *  is initialized. The default layout class is dk.Layout.
     *  The layout class can discover or create the structure
     *  of the widget and is the main method of creating elements in the
     *  widget post-hoc.
     */
    create_layout(location, template, structure) {
        if (this.dklayout === 'Layout') {

            try {
                // Layout.init sets widget.layout
                this.layout = Layout.create(this, location, template, structure);
            } catch (e) {
                throw e;  // easier to debug
                // throw "in class: " + this.constructor.name + " :: " + e;
            }

        } else {
            if (!this.dklayout.create) dk.error("this.dklayout:", this.dklayout);
            // dk.info("THIS:DKLAYOUT:", typeof this.dklayout);
            this.layout = new this.dklayout(this, location, template, structure);
        }
        return this;
    }

    /*  #4 Widget creation: adding dom scaffolding
     *
     */
    construct() {}

    /*  #5
     *  Widget initialization: get the correct html/DOM structure onto
     *  the page. This doesn't include "data parts" (use widget.draw()
     *  to paint those onto the page).
     *
     *  Either create new DOM and place into this.widget(), which is well
     *  defined as long as this widget is uniquely identified (cf. set_id),
     *  or bless an existing DOM structure with widgetitude (by calling
     *  widget.parse_html().
     *
     *  The `inside` parameter indicates whether the widget should be
     *  created _on_ the location or _inside_ the location.
     */
    initialize() {}

    //  #6
    //  handlers() {}   // don't uncomment

    /*  #7
     *  Render the widget data, by calling refresh() and/or draw().
     */
    render_data() {
        if (this.url) {
            this.refresh();
        } else if (this.DEFINES('refresh')) {
            // has refresh, but not url
            this.draw(this.refresh());
        } else {
            this.draw(null);
        }
    }

    /*  #8
     *  The `widget.draw(data)` method should be used to draw,
     *  i.e. incorporate new data into the widget.
     *
     *  The structure of the widget should be laid out by
     *  `widget.construct()`.
     *
     *  draw() should be overridden by subclassess (the default
     *  implementation does nothing).
     */
    draw(data) {}

    /*
     *   reflow is called when widget parameters have changed,
     *   e.g. parent container width has changed. The default
     *   action is to just call render_data().
     */
    reflow() {
        this.render_data();
    }
    
    static extend(props) {
        if (props.template) props.template = dk.merge(this.template, props.template);
        if (props.structure) props.structure = dk.merge(this.structure, props.structure);
        if (props.defaults) props.defaults = dk.merge(this.defaults, props.defaults);
        const SubClass = Class.extend.call(this, props);
        SubClass.type = props.type || this.name;  // this can assign undefined

        if (SubClass.type) {
            //SubClass.type = SubClass.type.replace(/\./, '-');
            widgetmap.add(SubClass);
            SubClass.toString = function () {
                return this.type + " (ctor)";
            };
        } else {
            dk.debug('SubClass without type', SubClass);
        }

        return SubClass;
    }

    /*
     *  Create an instance of this Widget class.
     *  I.e., create_onto this.widget(). Which means we must ensure we
     *        have an id.
     */
    static create() {
        let location, attrs;
        if (arguments.length >= 2) {
            location = arguments[0];
            Array.prototype.shift.call(arguments);
        } else {
            location = dk.$('body');
        }
        attrs = arguments[0];
        return this.create_on(location, attrs);
    }

    static create_on(location, attrs) {
        // we _must_ generate an id for this widget, so that
        // this.widget() works.
        try {
            const w = new this(attrs);
            // if (!location.jquery) location = dk.$(location);
            if (typeof location === 'string') location = dk.$(location);
            page.create_widget(w, {on: location});
            return w;
        } catch (e) {
            dk.error(e);
        }
    }

    static create_inside(location, attrs) {
        // we must not generate an id for this widget until we
        // get to the widget's construct() method.
        try {
            const w = new this(attrs);
            if (typeof location === 'string') location = dk.$(location);
            page.create_widget(w, {inside: location});
            return w;
        } catch (e) {
            dk.error(e);
        }
    }

    static append_to(location, attrs) {
        // we must not generate an id for this widget until we
        // get to the widget's construct() method.
        try {
            const w = new this(attrs);
            if (typeof location === 'string') location = dk.$(location);
            page.create_widget(w, {inside: location, append: true});
            return w;
        } catch (e) {
            dk.error(e);
        }
    }
}
