import $ from 'jquery';
import {RadioSelectWidget} from "../widgets";
import page from "../../widgetcore/dk-page";
import utidy from "../../browser/dk-html";


test("radio-select-widget", () => {
    document.body.innerHTML = `
        <div id="work">
            
        </div>
    `;
    const work = $('#work');
    page.initialize(document);

    const w = RadioSelectWidget.create_on(work, {
        options: [
            'hello',
            'world'
        ]
    });
    console.log(w);
    console.log(w.toString());
    
    work.find('label:eq(0)').click();
    w.widget().change();
    console.log(work.html());

    expect(w.formatted_value()).toBe('hello');
    expect(w.get_field_value()).toMatchObject({v: "0", f: 'hello'});

    expect(utidy(work.html())).toEqual(utidy(`
        <label for="work" id="work-label">
            <input id="work" name="work" type="radio" value="0">
            &nbsp;hello
        </label>
        <label for="work" id="work-label">
            <input id="work" name="work" type="radio" value="1">
            &nbsp;world
        </label>
    `));
});
