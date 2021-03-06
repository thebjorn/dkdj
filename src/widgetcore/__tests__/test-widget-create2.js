

import $ from "jquery";
import utidy from "../../browser/dk-html";
import {Widget} from "../dk-widget";
import page from "../dk-page";

/**
 *  You can create a widget onto a dom object that already has
 *  an `id`.
 *
 */
test("Widget.create_on(#id)", () => {
    document.body.innerHTML = `
    <div id="work">
        <div id="foo" class="bar"></div>
    </div>
    `;
    const work = $('#work');
    page.initialize(document);

    class HelloFoo extends Widget {
        draw() {
            this.widget().text(`\nHello ${this.data.whom}!\n`);
        }
    }
    const w = HelloFoo.create_on(work.find('#foo'), {
        data: {
            whom: 'world',
            // foo: {
            //     bar: {
            //         baz: 42
            //     }
            // }
        }
    });
    w.data.whom = 'FOO';
    // w.data.foo.bar.baz = 14;
    // w.data.foo = 'hello';

    expect(utidy(work.html())).toEqual(utidy(`
        <div id="foo" class="HelloFoo bar">
            Hello FOO!
        </div>
    `));
});
