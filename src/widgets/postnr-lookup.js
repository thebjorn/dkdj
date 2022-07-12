
/*
 *  Usage::
 *      PostnrLookupWidget.create_on('#my-form', {
 *          postcode_id: '#id_postcode',
 *          city_id: '#id_city'
 *      });
 */
import {Widget} from "../widgetcore/dk-widget";
import dk from "../dk-obj";

/**
 * Look up a Norwegian zip code and return the city.
 * Create it on an item that only contains one address form (then you don't need to specify any parameters).
 * If more than one form exists you will need to provide the postcode_id and city_id.
 * 
 * If you use the {% edit_address .. %} and {% add_address .. %} template tags from dkaddress, all of this
 * is done for you automatically.
 */
export class PostnrLookupWidget extends Widget {
    constructor(...args) {
        super({
            zipcode: null,  // url paramter
            postcode_id: null,
            city_id: null,
            postcode_url: () => `https://cache.norsktest.no/ajax/poststed/${this.zipcode}/`,
        }, ...args);
    }

    construct() {
        this.$postnr = this.postcode_id ? this.widget(this.postcode_id) : this.widget('[name=postcode]');
        this.$poststed = this.city_id ? this.widget(this.city_id) : this.widget('[name=city]');
        this.$poststed.attr('tabindex', 7);
        this.zipcode = this.$postnr.val();
        this._submitting = false;
    }

    draw(poststed) {
        if (poststed !== undefined) this.$poststed.val(poststed || '');
    }

    do_lookup() {
        const self = this;
        this.zipcode = this.$postnr.val();
        dk.$.ajax({  // can't use dk.ajax here, since we're doing a cors call
            cache: false,
            crossDomain: true,
            url: self.postcode_url(),
            success(data) {
                self.draw(data);
                if (self._submitting) self.widget().trigger('submit');
            }
        });
    }

    handlers() {
        const self = this;
        this.$postnr.on('blur', () => this.do_lookup());

        /*
         * If the zip code field is the last field before the submit button, the user could
         * hit return after changing the zip, thus triggering a form-submit, but not 
         * a field-blur. Handle it by doing an extra do_lookup.
         * (NOTE: self.widget() is the form)
         */
        this.widget().on('submit', function (e) {
            if (self._submitting) return true;

            e.preventDefault();
            self._submitting = true;
            self.do_lookup();
            return false;
        })
    }
}
