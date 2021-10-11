
Tutorial
=========

.. raw:: html

    <style>
    .div {
        padding: 2px 4px;
        border: 1px dashed #666;
        margin: 1ex;
    }
    </style>
    <link rel="stylesheet" href="https://static.datakortet.no/font/fa470/css/font-awesome.css">
    <script crossorigin="anonymous" src="https://polyfill.io/v3/polyfill.js?features=fetch,es5,es6,es7,Object.entries,Object.fromEntries,Element.prototype.append,DocumentFragment.prototype.append,DocumentFragment.prototype.prepend&flags=gated"></script>
    <script crossorigin="anonymous" src="https://unpkg.com/@webcomponents/webcomponentsjs@2.2.6/webcomponents-bundle.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/jquery-migrate-3.0.1.min.js" integrity="sha256-F0O1TmEa4I8N24nY0bya59eP6svWcshqX1uzwaWC4F4=" crossorigin="anonymous"></script>
    <script src="https://js.pusher.com/7.0/pusher.min.js"></script>
    <!-- script DEBUG LOGLEVEL="3" src="https://static.datakortet.no/dkdj/js/dkdj.8e5d6407c552ba86bace.min.js"></script -->
    <script DEBUG LOGLEVEL="3" src="http://localhost:8080/js/dkdj.min.js"></script>


Hello World
------------------------------------------------------
The simplest possible widget:


.. code-block:: html

    <div id="hello-foo"></div>
    <script>
        class HelloFoo extends dk.Widget {
            draw() {
                this.widget().text('\nHello World!\n');
            }
        }

        HelloFoo.create_inside('#hello-foo');
    </script>

results in:

.. raw:: html

    <div class="screen">
    <div id="mylabel" class="div">Hello World!</div>
    </div>

.. warning:: It is possible to create a widget directly on the page,
    yet  it's rarely very useful

    ::

        Widget.create_inside('#foo', {
            draw() {
                this.widget().text('\nHello World!\n');
            }
        });

    - Create new *direct* widgets by creating an instance of ``dk.Widget``
      and filling it with your implementation.
    - You can keep the widget code where it is used on the page by
      using a ``<script>`` tag inside the ``<div>`` tag that boxes your widget.


    It is a good idea to give the div an id, but ``dk.Widget.create()`` will
    work correctly even if you don't.

There are several different methods you can override to get your widget
onto the page. In the above example I've overridden the ``draw()`` method
which is used to draw data into existing dom/widget elements.


HelloWidget
------------------------------------------------------
Above, we created an instance of dk.Widget, by using the ``dk.Widget.create()``
method -- it's basically the same as ``new dk.Widget({...})`` but without the nasty
surprises of ``new``.  This is the preferred method of placing ad-hoc widgets
directly onto the page.  There is no need to, and you should not, create a
subclass just to put one instance of it onto the page. (this is probably wrong
based on experience).

However, if you want to use the same widget in multiple places on your page, you
will need to create a dk.Widget subclass:

.. code-block:: html

    <script>
        class HelloWidget extends dk.Widget {
            refresh() {
                return this.widget().attr('data-name');
            }
            draw(data) {
                this.widget().text('Hello: ' + data);
            }
        }

        $(document).ready(function () {
            HelloWidget.create_inside('.mywidgets > div');
        });
    </script>

Here I've used

- ``data-name="..."`` attributes on the div elements to provide data to the
  widgets.
- overridden the ``refresh()`` function to return the data from the html
  elements.
- used the ``$(..).dkWidget(WidgetType)`` jQuery plugin to create the widgets.

If a widget defines a ``refresh()`` method, then the ``draw()`` method is
automatically called with the result of the ``refresh()`` method as its
argument.

.. note:: **$(..).dkWidget()**

   In this case we don't actually need a refresh method since ``$(..).dkWidget(..)``
   copies all properties of the html-element into the widget (**make sure
   you don't overwrite your attribute names!**).

   For attributes containing ``-``, ``dkWidget()`` creates nested namespaces,
   which means that the widgets would have ``.data.name`` attributes and
   that the ``draw()`` method could be written as::

       draw: function () {
           this.widget.text("Hello: " + this.data.name);
       }

..
    Templates
    ------------------------------------------------------
    Widgets are all about look and feel, so simply adding text to an existing div
    is not enough. The `dk.widget.get_template()` method lets you grab templates
    from script tags with type="text/html" (a much used microtemplating trick):

    .. code-block:: guess

        <script type="text/html" id="light-widget-template">
            <div class="widget light-widget"
                 style="border-radius:50%;width:100px;height:100px;background-color:yellow;">
                Hello Template!
            </div>
        </script>

    .. code-block:: html

        <script type="text/javascript">
            var light_widget = dk.widget.new_widget({
                name: 'light-widget',
                draw: function (page) {
                    this.widget().append(this.get_template('light-widget-template'));
                }
            });
        </script>
        <script type="text/javascript">
            $(document).ready(function () {
                $('.light').dkwidget({
                    type: 'light-widget'
                });
            });
        </script>
        </head>
        <body>
            <div id="light1" class="light"></div>
            <div id="light2" class="light"></div>
        </body>


Widget methods (actions)
------------------------------------------------------

Since widgets are regular objects, we can add methods that perform actions on
the widget.  E.g. we can implement a set_color method

.. code-block:: html
    :emphasize-lines: 8-10

        <div id="light1" class="light">
            <div class="circle"
                 style="border-radius:50%;width:100px;height:100px;background-color:yellow;">
            </div>

            <script type="text/javascript">
                const light = dk.Widget.create({
                    set_color: function (color) {
                        this.widget('.circle').css('background-color', color);
                    }
                });
            </script>
        </div>

        <button onclick="light.set_color('red');">red</button>
        <button onclick="light.set_color('yellow');">yellow</button>
        <button onclick="light.set_color('green');">green</button>

        .. examples/simple/socket1-lightcolor.html

and the result is (this documentation should be interactive if you're watching it in a browser):

.. raw:: html

    <div class="screen">
        <div id="light1" class="light">
            <div class="circle"
                 style="border-radius:50%;width:100px;height:100px;background-color:yellow;">
            </div>

            <script type="text/javascript">
                const light = dk.Widget.create({
                    set_color: function (color) {
                        this.widget('.circle').css('background-color', color);
                    }
                });
            </script>
        </div>

        <button onclick="light.set_color('red');">red</button>
        <button onclick="light.set_color('yellow');">yellow</button>
        <button onclick="light.set_color('green');">green</button>
    </div>

.. note::  widgets should know about their own state..

   It's probably a bad idea to change the state of the widget without recording it. A better
   approach would be to let ``set_color()`` set an instance variable, and then override
   ``draw()`` to display the widget with the new color.


Declaring event handlers
------------------------------------------------------

It might seem strange that the buttons in the previous example aren't widgets, so let's
define some handlers for the button click events. The ``Widget.handlers()`` method is
automatically called when a widget is placed on the page, and it is the place where you
set up event handlers.

.. code-block:: guess
    :emphasize-lines: 16-20

    <!-- non-widget html -->
    <div id="light">
        <div class="circle"
             style="border-radius:50%;width:100px;height:100px;background-color:yellow;">
        </div>
    </div>

    <!-- our widget.. -->
    <div>
        <button>red</button>
        <button>yellow</button>
        <button>green</button>

        <script type="text/javascript">
            dk.Widget.create({
                handlers: function () {
                    this.widget('button').click(function () {
                        $('#light .circle').css('background-color', $(this).text());
                    });
                }
            });
        </script>
    </div>

    .. examples/simple/event-handlers.html

In the above example, the ``handlers()`` method uses jQuery to create a click-handler on
``button`` children of the widget, that finds a DOM node and performs an action on it
(sets the background color to the text of the pressed button).  This kind of handler will
of course only work for pages that have the required DOM elements, with just the right id/class
combination, i.e. the widget is tightly coupled to the page it's on.


Connecting widgets
------------------------------------------------------
Let's get back to our lights and buttons example...
If you're writing all the widgets yourself, you could connect
them manually (like we just did), but widgets become more reusable when they're
not tightly coupled.  So instead of the button widgets telling
the light widget to change color, the button widget is just
going to "say" that it has been clicked, and then any widget
that wants to respond to that trigger can do so.  In particular,
we're going to connect the ``notify`` of the button widgets
to the sockets of the light widget after we've placed all the
widgets on the page.

.. note:: **self.notify("trigger-name")**

   Almost all event handlers shold notify when
   something happens to the widget, or when (before and/or after) they do something
   to the widget.  This will let other widgets on the page react by subscribing to
   these notifications.


.. code-block:: html

    <div id="light2">
        <div class="circle"
             style="border-radius:50%;width:100px;height:100px;background-color:yellow;">
        </div>
    </div>

    <button class="color-button" id="red"></button>
    <button class="color-button" id="yellow"></button>
    <button class="color-button" id="green"></button>

    <script type="text/javascript">

        class LightWidget extends dk.Widget {
            set_color(color) {
                this.widget('.circle').css('background-color', color);
            }
        }

        class ButtonWidget extends dk.Widget {
            construct() {
                this.color = this.id;             // this.id is red/green/yellow
                this.widget().text(this.color);
            }
            handlers() {
                this.retrigger('click', () => this.color);
            }
        }
        
        const light2 = LightWidget.create_on('#light2');
        const buttons = ButtonWidget.create_on('.color-button');
        dk.on(buttons, 'click', c => light2.set_color(c));

    </script>

.. examples/trigger-socket1.html

.. raw:: html

    <div id="light2">
        <div class="circle"
             style="border-radius:50%;width:100px;height:100px;background-color:yellow;">
        </div>
    </div>

    <button class="color-button" id="red"></button>
    <button class="color-button" id="yellow"></button>
    <button class="color-button" id="green"></button>

    <script type="text/javascript">

        class LightWidget extends dk.Widget {
            set_color(color) {
                console.log('setting color:', color);
                this.widget('.circle').css('background-color', color);
            }
        }
        const light2 = LightWidget.create_on('#light2');

        class ButtonWidget extends dk.Widget {
            construct() {
                this.color = this.id;
                this.widget().text(this.color);
            }
            handlers() {
                this.retrigger('click', () => this.color);

                // const self = this;
                // this.widget().on('click', function () {
                //     console.log(`self.trigger(${self.color})`);
                //     self.trigger('click', self.color);
                // });
            }
        }
        
        const buttons = ButtonWidget.create_on('.color-button');
        dk.on(buttons, 'click', c => light2.set_color(c));
    </script>


In the button widgets ``handlers()`` method, we set up the click handler as
before, but the action is now to only send a notification that a "click"
message/event has happened, and send the button color
along as an argument.

.. note::  **event forwarding shortcut**

   Notice the ``this.retrigger(evt, fn)`` shortcut above, it listens for a
   dom/jquery event (evt) and triggers a dkdj event by the same name with
   the result of running the function (fn) as the payload::

       handlers() {
           this.retrigger('click', () => this.color);
       }

   it is equivalent to::

       const self = this;
       this.widget().on('click', function () {
           self.trigger('click', self.color);
       });  



.. old docs below (don't pay any attention ;-)

    Widget creation steps
    ------------------------------------------------------
    Widgets can either be created from existing html on the page, that is "widgetized" (with
    widgetitude); or it can be constructed from scratch and placed inside an empty ``<div>``
    container. The creation process proceeds through 3 stages

    1. find where the widget should be placed
    2. create the structure of the widget
    3. draw the data of the widget

    .. graphviz::

        digraph foo {
            node [shape=box];

            subgraph cluster_1 {
                create -> init;

                create [label="dk.Widget.create(location, {..})\npass an optional location,\nand properties."];
                init [label="create calls widget.init() as part\nof the regular dk.Class machinery \n(this is where the id and name are determined)"];

                init -> page_add;
                page_add [label="dk.page.add(widget) adds the widget to the page\nmaking it available as $$.widgetname\nand calls initialize"];

                label = "find widget placement";
                color = lightgrey;
            }

            subgraph cluster_2 {
                initialize [label="widget.initialize()"];
                initialize -> { parse_html; construct; };

                color = lightgrey;
                label = "create widget structure";
            }

            subgraph cluster_3 {
                url -> { hasurl; refresh; draw };

                color = lightgrey;
                label = "draw widget data";
            }
            page_add -> initialize;
            construct -> url;
            parse_html -> url;


            parse_html [label="widget.parse_html() is called if the new \nwidget already contains any DOM elements"];
            construct [label="widget.construct_widget() is called if the target \nis empty and should construct the widgets elements\nand add them to the DOM"];

            url [label="widget.render_data() renders the data of the widget"];

            hasurl [label="if the widget has a .url attribute,\n call widget.refresh()\nwhich will call draw() internally"];
            refresh [label="if it doesn't have .url, \nbut does have a .refresh() method\ncall widget.draw(widget.refresh())"];
            draw [label="widget.draw(null)"];
        }


    Creating the structure
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    You should override both ``parse_html()`` to progressively enhance existing markup, and ``create_widget()``
    to assemble the widget programatically. You can always override ``initialize(location)`` if you want to
    handle this yourself.


    The widget is created when ``dk.page`` places it on the page and
    calls the ``dk.Widget.initialize()`` method.

    .. note:: **initialize()** vs **draw()**

    initialize(), and parse_html()/create_widget(), are for creating the initial widget structure, while
    draw() is for "filling-in" the widget with data.


    Narrowing
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Let's look at how we can construct our ButtonWidget. A first attempt might look like::

        var ButtonWidget = dk.Widget.extend({
            type: 'ButtonWidget',
            ...
            construct_widget: function () {
                this.widget().append('<button/>');
            },
            handlers: function () {
                this.notify_on('click');
            }
        });

    the problem here is that the handlers will act on the box that the ``<button/>`` element is placed inside, and not
    the button. The fix is simple::

        construct_widget: function () {
            this.narrow('<button/>');
        }

    which is similar to doing

    .. code-block:: guess

        construct_widget: function () {
            item = $('<button/>);
            var new_id = ButtonWidget.next_widget_id();  // get a fresh id
            item.prop('id', new_id);                     // attach it to the button
            this.widget().append(item);                  // append the button as before
            this.set_widget_id(new_id);                  // and then reset the widget id to the button
        }

    we're "narrowing" the scope of the widget, hence the name of the method.

    The item that you pass into ``narrow()`` can be text of a jQuery object (or indeed anything else that has
    an id).


    ..
        The default implementation looks like this::

            initialize: function (location) {
                if (this.widget()[0].innerHTML) {
                    // there is existing html inside the widget..
                    this.parse_html();
                } else {
                    // we need to create the widget from scratch..
                    this.construct_widget(location);
                }
            }

        which means you have a couple of options:

        1. override ``initialize()`` and handle it yourself. This makes sense if
        you're creating ad-hoc/in-page widgets where you have full control over
        the context in which the widgets are created.
        2. override either one or both of ``widgetize_html()`` and ``construct_widget()``.




    Layout
    ------------------------------------------------------
    ``dk.Layout`` is a lightweight class to create named layoutboxes::

        var StackLayout = dk.Layout.extend({
            init: function (location) {
                this._super(location);   // important!
                this.top = this.append('top');
                this.bottom = this.append('bottom');
        });

    if you have an element

    .. code-block:: html

        <div id="foo"></div>

    and apply the ``StackLayout``::

        var stklayout = StackLayout.create($('#foo'));

    the resulting DOM would look like

    .. code-block:: html

        <div id="foo">
            <div id="dk-layout-box-3" class="dk-layout" name="top"></div>
            <div id="dk-layout-box-4" class="dk-layout" name="bottom"></div>
        </div>

    where the ``id``'s are unique for the page, and::

        stklaoyout.top === $('dk-layout-box-3')
        stklaoyout.bottom === $('dk-layout-box-4')

    You would normally attach css to ``.top`` and ``.bottom`` to get the visual layout that you're after.

    ..
        position, vStack, ...



    Subwidgets
    ------------------------------------------------------
    Creating subwidgets starts with creating a layout, and then creating widgets into the layout::

        construct_widget: function (location) {
            this.layout = StackLayout.create(this.widget());
            this.light = LightWidget.create(this.layout.top, {color: 'yellow'});
            this.btn = ButtonWidget.create(this.layout.bottom, {...});
            $bind('click@', this.btn, 'set_color@', this.light);
        }

    the last line binds events and notifications between the subwidgets, in this case "when a *click*
    happens at *this.btn*, then send *set_color* to *this.light*.


    Ajax
    ------------------------------------------------------
    For this example we'll use the ajax service at::

        http://cache.norsktest.no/ajax/poststed/<%= zipcode %>/

    where `zipcode` is a valid Norwegian zip code, and the result is the associated
    `city`, as a json string.  This ajax service has been set up to reply with
    the required `Access-Control-Allow-*` headers
    (cf. https://gist.github.com/barrabinfc/426829 for details).

    For our html we'll have a text input to enter the zip, and a span to output
    the city:

    .. code-block:: html

        <div dkwidget="poststed-widget">
            <input type="text" name="postnr">
            <span class="poststed"></span>
        </div>

    the widget::

        var PostStedWidget = dk.Widget.extend({
            type: 'poststed-widget',
            zipcode: null,
            url: 'http://cache.norsktest.no/ajax/poststed/<%= zipcode %>/',

            urldata: {
                zipcode: function () { return this.zipcode || undefined; }
            },

            parse_html: function () {
                this.postnr = this.widget('> [name=postnr]');
                this.poststed = this.widget('> .poststed');
                this.zipcode = this.postnr.val();
            },

            draw: function (poststed) {
                this.poststed.text(poststed || '');
            },

            handlers: function () {
                var self = this;

                self.postnr.blur(function () {
                    self.zipcode = self.postnr.val();
                    self.refresh();
                });

            }
        });

    if your url has placeholders (i.e. ``<%= zipcode %>``), they are looked up in the widget's attributes.

    .. note:: **urldata**

        If the widget has an url with template paramters, it should also contain an **urldata**
        member that is a mapping from url parameters to their values. The values can be constants,
        or getter functions as in the example above. The **urldata** member can also be a function
        returning a hash of template parameters (for when you need ultimate flexibility).

        If any of the url parameters are *undefined*, then the ajax call is aborted.




    Design mode
    ------------------------------------------------------
    You can put the page, and its widgets into design mode, which currently implies:

    - The widgets are replaced by boxes indicating
        * the widget name
        * the widget's triggers
        * and the widgets sockets
    - an information area at the bottom of the page, listing all bindings that are in effect
    - if you hover over a trigger, all targets will be highlighted.

    For this to work you need to declare which triggers a widget has::

        var button_widget = dk.widget.new_widget({
            name: 'button-widget',
            triggers: ['click'],


    Temp storage
    ========================================================================

    old version...

    .. code-block:: guess

            <script type="text/javascript">
                dk.Widget.extend({
                    type: 'Button1',
                    handlers: function () {
                        var self = this;
                        return [
                            {on: 'click', do: function () {
                                console.log("click", self.id);
                                self.notify("click");
                            }}
                        ];
                    }
                });
            </script>

        <button dkwidget="Button1" id="red">red</button>
        <button dkwidget="Button1" id="yellow">yellow</button>
        <button dkwidget="Button1" id="green">green</button>

    .. note::

    **dkwidget="WidgetType"** I'm instantiating the widgets by adding a
    ``dkwidget="Button1"`` argument to the button html. This will be noticed on
    *document.ready* and the widgets will be automatically instantiated.
