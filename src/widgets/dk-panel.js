
import {Widget} from "../widgetcore/dk-widget";
import css from "../browser/dk-css";
import dk from "../dk-obj";
import browser from "../browser/browser-version";
import {fa4_icon, icon} from "./dk-icon-library";
import styles from "../../styles/index.scss";

(function () {
    if (!dk.globals._dk_browser) return;
    if (dk.$('style#dkdj-styles').length === 0) {
        const style = `<style id="dkdj-styles">${styles.toString()}</style>`;
        dk.$('html>head').append(style);
    }
}());


export class PanelWidget extends Widget {
    constructor(...args) {
        super({
            // type: 'PanelWidget',
            width: undefined,
            height: undefined,
            collapsible: true,
            direction: 'up',   // or 'left'
            blind_duration: 0.1,
            rotate_duration: 0.1,
            status: 'open',
            icons: {
                collapse: 'folder-open-o:fw',
                expand: 'folder:fw',
                color: '#888'
            },

            overflow: 'resize',   // 'hidden'|'scroll'|'resize'
            kind: 'panel-default',

            structure: {
                classes: ['dk-panel', 'panel'],
                css: {
                    position: 'relative',
                    overflow: 'hidden'
                },

                header: {
                    classes: ['panel-heading'],
                    title: {
                        classes: ['panel-title'],

                        collapseicon: {
                            css: {cursor: 'pointer'}
                        },
                        headingtext: {
                            template: 'span'
                        }
                    }
                },
                panel_body: {
                    css: {overflow: 'auto'}
                },
                footer: {
                    classes: ['panel-footer'],
                    create: false
                }
            }
        }, ...args);

        if (this.panel && this.panel.height && typeof this.panel.height === 'string') {
            this.height = parseInt(this.panel.height, 10);
        }
    }

    construct_headingtext(htxt) {
        if (this.title) {
            htxt.text(this.title);
        }

        if (!this.icon) this.icon = this.widget('.collapseicon > dk-icon')[0];
        if (!this.icon) {
            const icon = dk.$('<dk-icon/>').attr('value', this.icons.collapse);
            this.icon = icon[0];
            this.widget('.collapseicon').append(icon);
        }
        return htxt;
    }

    construct_panel_body(body) {
        return body;
    }

    construct() {
        if (this.widget().hasClass('collapse-up'))      this.status = 'collapse-up';
        if (this.widget().hasClass('collapse-left'))    this.status = 'collapse-left';
        if (this.height) {
            this.panel_body.outerHeight(this.height - this.header.outerHeight() - this.footer.outerHeight());
        }
        if (!this.icon)  this.icon = this.widget('.collapseicon > dk-icon')[0];
    }

    set_icon(ikn) {
        this.icon.value = ikn;
    }

    _size(item) {
        return {
            height: item.outerHeight(),
            width: item.outerWidth()
        };
    }

    collapse_up() {
        const self = this;
        const wsize = this._size(this.widget());
        const hsize = this._size(this.header);

        this.widget().addClass('collapse-up');
        const orig_maxheight = css.maxheight(this.widget(), {
            height: hsize.height,
            duration: self.blind_duration,
            done() {
                self.__collapsing = false;
            }
        });

        this._expand = function () {
            self.widget().removeClass('collapse-up');
            css.maxheight(self.widget(), {
                height: wsize.height,
                duration: self.blind_duration,
                done() {
                    self.widget().css('max-height', orig_maxheight);
                    self.__collapsing = false;
                }
            });
        };
    }

    collapse_left() {
        const self = this;
        const wsize = this._size(this.widget());
        const hsize = this._size(this.header);
        let rotation;

        const orig_maxheight = css.maxheight(this.widget(), {
            height: hsize.height,
            duration: self.blind_duration,
            done: function () {
                rotation = css.tilt(self.widget(), {
                    direction: 'bottom left',
                    duration: self.rotate_duration,
                    done: function () {
                        self.__collapsing = false;
                        // noinspection JSSuspiciousNameCombination
                        self.trigger('collapse-done', {
                            height: hsize.width,
                            width: hsize.height
                        });
                    }
                });
                self.widget().addClass('collapse-left');
            }
        });

        this._expand = function () {
            css.unrotate(dk.update(rotation, {
                done: function () {
                    css.maxheight(self.widget(), {
                        height: wsize.height,
                        duration: self.blind_duration,
                        done: function () {
                            self.widget().css('max-height', orig_maxheight);
                            self.__collapsing = false;
                            self.trigger('expand-done', self);
                        }
                    });
                }
            }));
        };
    }

    collapse(direction) {
        this.direction = direction || this.direction;
        this['collapse_' + this.direction]();
        this.icon.value = this.icons.expand;
        this.trigger('resized', this);
        this.trigger('collapse', this);
    }

    expand() {
        this.widget().removeClass('collapse-' + this.direction);
        this.icon.value = this.icons.collapse;
        if (this._expand) {
            this._expand();
            this._expand = null;
        }
        this.trigger('resized', this);
        this.trigger('expand', this);
    }

    handlers() {
        const self = this;
        if (this.collapsible) {
            //this.__collapsing = new Date();

            this.header.on('click dblclick', function () {
                if (self.__collapsing) return;
                self.__collapsing = true;
                const action = self.collapsed ? 'expand' : 'collapse';
                self.trigger(action + '-start', self);
                self[action]();
                self.collapsed = !self.collapsed;
            });
        }
    }
}


/**
 * Usage::
 * 
 *     <dk-panel>
 *         <h3>panel title</h3>
 *         PANEL BODY
 *     </dk-panel>
 */
if (typeof customElements !== 'undefined') customElements.whenDefined('dk-load').then(() => {
    // console.log("DK_PANEL_DEFINED:");

    
    let _dk_panel_template = null;
    function get_dkpanel_template() {
        if (!_dk_panel_template) {
            _dk_panel_template = document.createElement('template');
            _dk_panel_template.innerHTML = `
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
                  integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
                <link rel="stylesheet" href="https://static.datakortet.no/font/fa470/css/font-awesome.css">
                <style>
                    ${styles.toString()}
                    :host { 
                        display: block; 
                        margin-bottom: 4px;
                        will-change:  contents;
                        max-height: none;
                        transition-property: max-height;
                        transition-duration: 0.1s;
                        transition-timing-function: linear;
                        overflow: hidden;
                    }
                    #dk-panel {margin-bottom: 0;}
                    #title-text { 
                        font-size: var(--title-size); 
                        font-weight: var(--title-weight);
                    }
                </style>
                <div id="dk-panel" class="PanelWidget dk-panel panel panel-default">
                    <header id="header" class="panel-heading">
                        <div class="panel-title">
                            <span id="icon" class="collapseicon" style="cursor:pointer;"></span>
                            <span id="title-text" class="headingtext"></span>
                        </div>
                    </header>
                    <slot id="panel-body" name="panel-body"></slot>
                </div>
                <slot id="panel-content"></slot>
            `;
        }
        return _dk_panel_template.content.cloneNode(true);
    }
    let _panel_counter = 1;

    if (typeof customElements !== 'undefined') {
        if (browser.name === "msie" || browser.name === 'edge') {
            customElements.define('dk-panel', class extends HTMLElement {
                constructor() {
                    super();
                    if (!this.id) this.id = `dk-panel-ms-${_panel_counter++}`;
                }
                connectedCallback() {
                    dk.$(this).css('display', 'block');
                    const $header = dk.$(this).find('>:header:first-child');
                    const $img = $header.find('>img:first-child');
                    $header.detach();
                    dk.$(this).wrapInner('<div class="panel-body"/>');
                    
                    this._widget = PanelWidget.create_on('#' + this.id, {
                        title: $header.text()
                    });
                    try {
                        this._widget.footer.hide();
                    } catch (e) {}
                    if ($img.length && this._widget.header) {
                        this._widget.header.title.collapseicon.empty().append($img);
                    }
                }
            });
        } else {
            
            // normal browsers..
            customElements.define('dk-panel', class extends HTMLElement {
                constructor() {
                    super();
                    this._collapsed = false;
                    this._icon_open = 'folder-open-o:fw';
                    this._icon_closed = 'folder:fw';
                    this._dkicon = null;
                    this.collapse_pixels_per_second = 1200;  // to get uniform speed regardless of panel height
                    
                    const shadowRoot = this.attachShadow({mode: 'open'});
                    shadowRoot.append(get_dkpanel_template());
                    this._header = shadowRoot.getElementById('header');
                    this._icon = shadowRoot.getElementById('icon');
                    this._panel_title_text = shadowRoot.getElementById('title-text');
                    this._slot = shadowRoot.getElementById('panel-content');
                    this._panel_body_slot = shadowRoot.getElementById('panel-body');
                    this._current_body_panel = null;
                    this.__header_filled = false;
                    this.__collapsed_maxheight = null;
    
                    this._slot.addEventListener('slotchange', (e) => this._on_slot_change(e));
                    this._icon.addEventListener('click', (e) => this.toggle(e));
                }
                
                _fill_header() {
                    if (this.__header_filled) return;
                    const header = this.querySelector('h1,h2,h3,h4,h5,h6');  // :header
                    if (!header) return;
                    this.__header_filled = true;
                    this._panel_title_text.textContent = header.textContent;

                    const img = header.querySelector('img:first-child');
                    if (img) {
                        // img.setAttribute('slot', 'icon');
                        this._icon.append(img);
                    } else {
                        this._dkicon = icon(this.hasAttribute('collapsed') ? this._icon_closed : this._icon_open);
                        this._icon.append(this._dkicon);
                        // this._dkicon = dkicon.create_inside(this._icon, {value: this._icon_open});
                    }
                    this.removeChild(header);
                }
                
                _add_body_panel() {
                    const panel_body = document.createElement('div');
                    panel_body.classList.add('panel-body');
                    this.append(panel_body);
                    panel_body.setAttribute('slot', 'panel-body');
                    return panel_body;
                }
    
                _on_slot_change(e) {
                    this._fill_header();
                    const assigned_elements = this._slot.assignedElements();
                    if (assigned_elements.length === 0) return;

                    if (this.children.length === 0 && this.childNodes.length > 0) {  // only text nodes
                        this._current_body_panel = this._add_body_panel();
                        while (this.childNodes.length > 0 && this.childNodes[0] !== this._current_body_panel) {
                            this._current_body_panel.appendChild(this.childNodes[0]);
                        }
                    }                    
                    [...assigned_elements].forEach(n => {
                        switch (n.tagName) {
                            case 'TABLE':
                            case 'UL':
                                n.setAttribute('slot', 'panel-body');
                                this._current_body_panel = null;
                                break;
                            default:
                                if (!this._current_body_panel) this._current_body_panel = this._add_body_panel();
                                this._current_body_panel.append(n);                                
                        }
                    });
                }
                
                connectedCallback() {
                    // debugger;
                    this.collapsed = this.hasAttribute('collapsed');
                }
                
                static get observedAttributes() {
                    return [
                        'collapsed',
                    ];
                }
                
                attributeChangedCallback(attrname, oldval, newval) {
                    newval = newval === "";  // true
                    oldval = oldval === "";
                    // console.log(`attrchange: ${attrname} #${this.id} "${oldval}"->"${newval}"`);
                    if (attrname === 'collapsed' && oldval !== newval) {
                        // console.log(`performing-attrchange: ${attrname} #${this.id} "${oldval}"->"${newval}"`);
                        this.collapsed = newval;
                    }
                }
                
                get collapsed() { return this._collapsed; }
                set collapsed(v) {
                    if (!!v !== this._collapsed) {
                        if (v) {
                            this.collapse();
                        } else {
                            this.expand();
                        }
                    }
                }
                
                collapse() {
                    if (!this.collapsed) {
                        this._collapsed = true;
                        // this.classList.add('collapse-up');   // do not self-apply classes (https://developers.google.com/web/fundamentals/web-components/best-practices)
                        const hsize = this._header.scrollHeight;
                        this.__collapsed_curheight = this.offsetHeight;
                        
                        this.__collapsed_maxheight = css.maxheight(this, {
                            height: hsize,
                            duration: Math.max(0.09, this.__collapsed_curheight/ this.collapse_pixels_per_second) 
                        });
                        
                        this.setAttribute('collapsed', "");
                        
                        if (this._dkicon) {
                            fa4_icon(this._dkicon, this._icon_closed);
                            // this._dkicon = icon(this._icon_closed);
                        }
                    }
                }
                expand() {
                    const self = this;
                    if (this.collapsed) {
                        this._collapsed = false;
                        
                        if (this.__collapsed_maxheight != null) {
                            css.maxheight(this, {
                                height: this.__collapsed_curheight,
                                duration: Math.max(0.09, this.__collapsed_curheight/ this.collapse_pixels_per_second),
                                done() {
                                    self.style.maxHeight = self.__collapsed_maxheight;
                                    self.__collapsed_maxheight = null;
                                }
                            });
                        }
                        
                        this.removeAttribute('collapsed');
                        
                        if (this._dkicon) {
                            fa4_icon(this._dkicon, this._icon_open);
                            // this._dkicon = icon(this._icon_open);
                        }
                    }
                }
                toggle() {
                    if (this.collapsed) {
                        this.expand();
                    } else {
                        this.collapse();
                    }
                }
            });
    
        }
    }
});
