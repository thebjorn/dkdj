import $ from 'jquery';
import {RadioInputWidget} from "../widgets";
import page from "../../widgetcore/dk-page";
import utidy from "../../browser/dk-html";


test("test-radiowidget", () => {
    document.body.innerHTML = `
        <div id="work">
            
        </div>
    `;
    const work = $('#work');
    page.initialize(document);
    
    const w = RadioInputWidget.create_inside(work, {value: 'a'});
    
    expect(utidy(w.toString())).toEqual(utidy(`
        <input 
            class="RadioInputWidget" 
            id="radio-input-widget" 
            name="radio_input_widget_1" 
            type="radio" 
            value="a">
    `));
    
    w.checked = true;
    console.log(w);
    
    expect(utidy(w.toString())).toEqual(utidy(`
        <input 
            class="RadioInputWidget" 
            checked="checked" 
            id="radio-input-widget" 
            name="radio_input_widget_1" 
            type="radio" 
            value="a">
    `));

});
