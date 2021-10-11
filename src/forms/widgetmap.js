import {validate} from "./validators";
import {validated_input} from "./validating_inputs";
import {
    CheckboxSelectWidget,
    DurationWidget,
    RadioInputWidget,
    RadioSelectWidget,
    SelectWidget,
    TextInputWidget,
    IntInputWidget,
    TriboolWidget
} from "./widgets";
import {InputWidget} from "./input-widget";


export const wmap = {
    widgetmap:  {
        boolean: TextInputWidget,
        number: TextInputWidget,
        string: TextInputWidget
    },
    InputWidget,
    TextInputWidget,
    IntInputWidget,
    TextWidget: TextInputWidget,
    DurationWidget,
    RadioInputWidget,
    SelectWidget,
    RadioSelectWidget,
    CheckboxSelectWidget,
    TriboolWidget,

    validators: validate,
    validated_input: validated_input 
    
};
