import $ from 'jquery';
import {SelectWidget} from "../widgets";
import page from "../../widgetcore/dk-page";
import utidy from "../../browser/dk-html";


test("select-widget", () => {
    document.body.innerHTML = `<div id="work"></div>`;
    const work = $('#work');
    page.initialize(document);
    
    const w = SelectWidget.create_inside(work, {
        size: 2,
        multiple: true,
        options: {
            1: 'hello',
            2: 'world'
        } 
    });
    // console.log(w);
    console.log("SELECT:WIDGET:WORK:", work.html());
    // console.log("1:W:DATA:", w.data, "W:VALUE", w.value, "W:_SELECTED:", w._selected);
    work.find('option[value=1]')
        .prop('selected', true)
        .trigger('change');
    
    console.log("2:W:DATA:", w.data, "W:VALUE", w.value, "W:_SELECTED:", w._selected);
    // console.log(work.html());
    expect(w.value).toEqual(['1']);
    
    // expect(w.formatted_value()).toBe('hello');
    // expect(w.get_field_value()).toMatchObject({v: "1", f: 'hello'});
    
    expect(utidy(work.html())).toEqual(utidy(`
        <select class="SelectWidget" id="select-widget" name="select_widget_1">
            <option value="1">hello</option>
            <option value="2">world</option>
        </select>
    `));
    expect(w.widget('option:selected').val()).toBe("1");
});


test("select-widget-string-values", () => {
    document.body.innerHTML = `<div id="work"></div>`;
    const work = $('#work');
    page.initialize(document);

    const w = SelectWidget.create_inside(work, {
        size: 2,
        multiple: true,
        options: {
            1: 'hello',
            2: 'world'
        }
    });
    console.log("W:VALUE:", w.value);
    console.log("W:SELECTED:", w._selected);
    console.log("W:GET_VALUE_FROM_SELECTED:", w._get_value_from_selected());
    console.log("W:DATA:", w.data);
    work.find('option[value=1]')
        .prop('selected', true)
        .trigger('change');
    console.log(work.html());
    console.log("W:VALUE:", w.value);
    console.log("W:SELECTED:", w._selected);
    console.log("W:GET_VALUE_FROM_SELECTED:", w._get_value_from_selected());
    console.log("W:DATA:", w.data);
    expect(w.value[0]).toBe('1');
});
