

import $ from "jquery";
import {Template} from "../dk-dom-template";
import utidy from "../dk-html";

/**
 * The simplest form of creating a structure using dk.dom.Template().
 * We're saying the structure should have two sub-items, a `h3` element,
 * and a `div` with `class="content"`.
 *
 * After creating the _structure_, we add text to the created
 * elements.
 *
 */
test("dk.dom.Template(), depth=1, using accessors", () => {
    document.body.innerHTML = `
    <div id="work"></div>
    `;
    // const work = document.querySelector('#work');
    const work = $('#work');
    const structure = {
        h3: {},
        content: {}
    };
    const templ = new Template(structure);
    const obj = templ.construct_on(work);
    obj.h3.text('hello');
    obj.content.text('world');

    console.log("obj:", utidy(obj.html()));
    console.log("txt:", utidy(`
        <h3>hello</h3>
        <div class="content">world</div>`));
    
    expect(utidy(obj.html())).toEqual(utidy(`
        <h3>hello</h3>
        <div class="content">world</div>`
    ));
});
