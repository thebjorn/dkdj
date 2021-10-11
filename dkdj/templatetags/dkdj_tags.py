# -*- coding: utf-8 -*-

"""dk.js template tags
"""
from django import template
from django.contrib.sites.shortcuts import get_current_site
from django.utils.safestring import mark_safe
from .. import jason


register = template.Library()


@register.inclusion_tag('dkdj/pagevar.html', takes_context=True)
def dkdj_create_page_var(context, varname='page'):
    """Create the variable ``page`` as a global variable for holding common page data, initially the 
       logged in user (request.user) is added.
       
       Usage (my-template.html, place it early in the file so it's available to the rest of the code)::

           {% block head %}
               {% dkdj_create_page_var %}
           {% endblock %}
       
       which is a shortcut for (naming the global variable ``page`` which is the default name)::
       
           {% block head %}
               {% dkdj_create_page_var "page" %}
           {% endblock %}
           
       You can explicitly name the variable to use (although it's strongly suggested to keep the default "page")::
       
           {% block head %}
               {% dkdj_create_page_var "my_special_page_var_name" %}
           {% endblock %}
           
       In your javascript code (that is not in the template) you can then add to the page var by::
       
           dk.global.page.foo = {{ my_template_var|jsonval }};
       
       and read from it similarly, ie. `alert(dk.global.page.user.username)`. 
       
       Soon, all browsers will support the `globalThis` variable::
       
           globalThis.page.foo = "bar";
           
       right now (2019), using the `window` variable will work (in the browser)::
       
           window.page.foo = "bar";
       
       In your template file, where the page variable is declared, you can simply do::
       
           page.foo = "bar";
       
       of for multiple values::
       
           Object.assign(page, {
               foo: 'bar',
               baz: 42
           });
   
    """
    return {
        'varname': varname,
        'user': context['user'],
        'site': get_current_site(context['request'])
    }
    

@register.filter
def jsonval(val):
    """Output `val` as a (json) value suitable for assigning to variables in
       javascript::

           var js_var = {{ python_var|jsonval }};

    """
    return mark_safe(jason.dumps(val))
