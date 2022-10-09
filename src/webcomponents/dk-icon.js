/*
 *   <dk-icon value="chevron-left:fw"></dk-icon>
 */

// import {LitElement, html} from '@polymer/lit-element';
// import {html} from '@polymer/lit-element';

export default class DkIcon extends HTMLElement {
    constructor() {
        super();
        const root = this.attachShadow({mode: 'open'});
        const style = `
            :host { font-family: monospace; }
            #icon { font-size: 20px; }
        `;
        this.src = 'check';
        root.innerHTML = `
            <style>${style}</style>
            <i id="icon" class="fa fa-${this.src}">icon-${this.src}</i>
        `;
        
        this.icon = root.querySelector('#icon');
    }
    
    invalidate() {
        this.icon.setAttribute('src', this.src);
    }
    
}

customElements.define('dk-icon', DkIcon);
// export default DkIcon;

/*
import $ from 'jquery';


const _xtag = require('x-tag');

const xtag = _xtag.xtag;
const XTagElement = _xtag.XTagElement;


class DKIcon extends XTagElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        dk.icon(this.value, undefined, $(this));
    }
    set 'value::attr' (val) {
        $(this).attr('class', '');
        dk.icon(val, undefined, $(this));
    }
    get 'value::attr' () {
        return $(this).attr('value');
    }
}

xtag.register('dk-icon', DKIcon);
*/
