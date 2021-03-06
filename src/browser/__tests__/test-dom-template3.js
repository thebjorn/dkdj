

import $ from "jquery";
import {Template} from "../dk-dom-template";
import utidy from "../dk-html";

/**
 *  You cannot use the same label twice on one level (there would be
 *  no way to access the second one), however, you _can_ have the same
 *  label at different levels in the structure.
 *
 */
test("dk.dom.Template(), depth=1, using accessors", () => {
    document.body.innerHTML = `
    <div id="work"></div>
    `;
    const work = $('#work');

    const structure = {
        h3: {},
        content: {
            h3: {}
        }
    };
    const templ = new Template(structure);
    const node = templ.construct_on(work);

    expect(utidy(work.html())).toEqual(utidy(`
        <h3></h3>

        <div class="content">
            <h3></h3>
        </div>`
    ));
});
