
import $ from "jquery";
import utidy from "../../browser/dk-html";
import {DurationWidget} from "../widgets";
import page from "../../widgetcore/dk-page";
import {Duration} from "../../data/datacore/dk-datatypes";
import {wmap} from "../widgetmap";


test("duration-widget", () => {
    document.body.innerHTML = `
    <div id="work"><input name="foo"></div>
    `;
    const work = $('#work');
    page.initialize(document);

    const w = DurationWidget.create_on(work.find('input'));

    expect(utidy(w.toString())).toEqual(utidy(`
        <input 
            class="DurationWidget" 
            id="duration-widget" 
            name="foo" 
            dk-value="null"
            dk-type="text">
    `));

    w.value = 3600;   // sets the widget prop, not attr
    console.log('w.value', w.value);
    console.log('w.value', w.data.value);
    console.log('typeof w.value', typeof w.value);
    console.log("W:", w);
    console.log('new duration:', (new Duration(3600)).toString());
    console.log('.val:', $('#' + w.id).val(), typeof $('#' + w.id).val());
    expect($('#' + w.id).val()).toEqual((new Duration(3600)).toString());
    expect(w.value).toEqual(new Duration(3600));
    
    // $('#' + w.id).attr('value', '1:00:01');  // .val(...) will not trigger onchange (see note: https://api.jquery.com/change/)
    w.widget().attr('value', '1:00:01').val('1:00:01').change();
    console.log(w.toString());
    expect(w.value).toEqual(new Duration(3601));
});


test("duration-create-inside", () => {
    document.body.innerHTML = `
        <div id="work">
            
        </div>
    `;
    const work = $('#work');
    console.log("WORK:", work);
    console.log("WORK:", work.length);
    console.log("WORK:", Array.isArray(work));
    page.initialize(document);
    
    const w = DurationWidget.create_inside(work);
    expect(w.value).toEqual(null);
    
    expect(utidy(work.html())).toEqual(utidy(`
         <input class="DurationWidget" id="duration-widget" name="duration_widget_2">
    `));
});



test("duration-widget2", () => {
    document.body.innerHTML = `
    <div id="work"><input></div>
    `;
    const work = $('#work');
    page.initialize(document);

    const w = DurationWidget.create_on(work.find('input'));

    expect(utidy(work.html())).toEqual(utidy(`
        <input class="DurationWidget" id="duration-widget" name="duration_widget_3">
    `));

    w.value = 3600;   // sets the widget prop, not attr
    console.log('w.value', w.value);
    console.log('w.value', w.data.value);
    console.log('typeof w.value', typeof w.value);
    console.log("W:", w);
    console.log('new duration:', (new Duration(3600)).toString());
    console.log('.val:', $('#' + w.id).val(), typeof $('#' + w.id).val());
    expect($('#' + w.id).val()).toEqual((new Duration(3600)).toString());
    expect(w.value).toEqual(new Duration(3600));

    // $('#' + w.id).attr('value', '1:00:01');  // .val(...) will not trigger onchange (see note: https://api.jquery.com/change/)
    w.widget().attr('value', '1:00:01').val('1:00:01').change();
    console.log(w.toString());
    expect(w.value).toEqual(new Duration(3601));
});
















































