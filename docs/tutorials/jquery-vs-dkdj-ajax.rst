jQuery vs. dkdj: ajax
=====================

Given the following django views::

    def calc_plus(request):
        from dkdjango.dkhttp import debug_info
        from dkjason import jason
        json = jason.loads(request.body)
        a = json['a']
        b = json['b']
        return jason.response(request, dict(result=a + b))

    urlpatterns = [
        url(r'^adder/$', TemplateView.as_view(template_name='fetch-example.html')),
        url(r'^calc/add/$', calc_plus),


javascript, no libraries (``dk('#foo') is the same as ``document.getElementById('foo')``)::

    dk('#calc').addEventListener('submit', function (e) {
        e.preventDefault();
        fetch('/calc/plus/', {
            method: 'POST',
            // function (above) ties this -> the form we're adding an eventlistener to
            body: new FormData(this)   // FormData https://developer.mozilla.org/en-US/docs/Web/API/FormData
        })
        .then(r => r.json())
        .then(data => {
            dk('#result').innerText(data.result);
        });
    });


traditional jquery::

    $('#calc').on('submit', function (e) {
        e.preventDefault();
        $.ajax({
            method: 'POST',
            url: '/calc/plus/',
            data: $(this).serialize(),
            success: function (data) {
                $('#result').text(data.result)
            }
        });
    });

modern jquery::

    $('#calc').on('submit', function (e) {
        e.preventDefault();
        $.ajax({
            method: 'POST',
            url: '/calc/plus/',
            data: $(this).serialize(),
        }).done(data => $('#result').text(data.result));
    });

dkdj::

    class Add extends dk.Widget {
        constructor(...args) {
            super({
                data: {
                    sum: 0      // changing anythin under this.data calls .draw()
                }
            }, ...args);
        }
        construct() {
            this.a = dk.forms.IntInputWidget.create_on(this.widget('[name=a]'));
            this.b = dk.forms.IntInputWidget.create_on(this.widget('[name=b]'));
            this.result = this.widget('#result');
        }
        call_calc_add() {
            dk.json({
                url: '/calc/add/',
                data: {
                    a: this.a.value || 0,
                    b: this.b.value || 0
                }
            }).done(r => this.data.sum = r.result);
        }
        
        handlers() {
            const self = this;
            // automatic update on key-press
            // dk.on(this.a, 'value-changed', () => this.call_calc_add());
            // dk.on(this.b, 'value-changed', () => this.call_calc_add());

            this.widget().on('submit', function (e) {
                e.preventDefault();
                self.call_calc_add();
            });
        }
        draw(data) {
            this.result.text(this.data.sum);
        }
    }
    const add = Add.create_on('#calc');
