/* global test, expect */
// const Class = require('../dk-class');
import Class, {classattrs} from "../dk-class";


test('Class.create ctor', () => {
    class Person extends Class {
        constructor(props) {
            super(props);
        }
    }
    // for (let a in Person) {
    //     console.log("PERSON:", a, Person[a]);
    // }
    //
    // Object.getOwnPropertyNames(Person).forEach(p => console.log("P2:", p, Person[p]));

    let p = Person.create({name: 'roger'});
    // Object.getOwnPropertyNames(p).forEach(a => console.log("P3:", a, p[a]));
    
    expect(p.name).toBe('roger');
    expect(p instanceof Person).toBe(true);
});


test('Class.name and .toString()', () => {
    const Person = Class.extend({__name__: 'Person'});
    // const Person = Class.extend({__name__: 'Person'});
    const Employee = Person.extend({});
    
    // console.log("Person: ", Person);
    // console.log("Employee: ", Employee);
    
    expect(Person.name).toBe('Person');
    expect(Person.toString()).toBe('Person');
    
    expect(Employee.toString()).toBe('(missing __name__ attribute) SubclassOfPerson');
    
});


test('Class with init', () => {
    const Person = Class.extend({});

    let q = new Person({
        init (props) {
            this.p = 42;
        }
    });
    expect(q.p).toBe(42);
    
    let p = Person.create({
        init (props) {
            this.p = 3.14;
        }
    });
    expect(p.p).toBe(3.14);
});



test('new Class ctor', () => {
    class Person extends Class {
        constructor(name) {
            super();
            this.name = name;
        }
    }

    let q = new Person('roger');
    expect(q.name).toBe('roger');
    expect(q instanceof Person).toBe(true);
});



test('Class ctor with props', () => {
    class Person extends Class {}

    let p = Person.create({data: {name: 'roger'}});
    expect(p.data.name).toBe('roger');
    expect(p instanceof Person).toBe(true);

    let q = new Person({name: 'roger'});
    expect(q.name).toBe('roger');
    expect(q instanceof Person).toBe(true);
});



test('Class extend', () => {
    const Person = Class.extend({
        name: ''
    });

    let q = Person.create({name: 'roger'});
    expect(q.name).toBe('roger');
    expect(q instanceof Person).toBe(true);
});


test('Class extend class attrs', () => {
    const Person = Class.extend({
        classattrs: {foo: 42}
    });

    let q = Person.create({name: 'roger'});
    expect(Person.foo).toBe(42);
    expect(q.foo).toBe(undefined);
    
    const Employee = Person.extend({
        classattrs: {bar: 43},
        company: null
    });
    let e = Employee.create({
        name: 'Bob',
        company: 'Acme'
    });
    Person.foo = 99999;
    expect(Employee.foo).toBe(99999);
    expect(Employee.bar).toBe(43);
    expect(Person.foo).toBe(99999);
    expect(q.foo).toBe(undefined);
    
    const Admin = Employee.extend({
        classattrs: {baz: 44},
        dept: 'Anvils'
    });
    
    expect(Admin.foo).toBe(99999);
    expect(Admin.bar).toBe(43);
    expect(Admin.baz).toBe(44);
    
});


test('Class class/static methods', () => {
    const Person = Class.extend({});
    Person.hello = (name) => ('hello ' + name);

    let q = Person.create({name: 'roger'});
    expect(Person.hello('Brutus')).toBe('hello Brutus');
    
    class Employee extends Person {
        static hello(name) { return 'hello ' + name; }
    }
    expect(Employee.hello('Brutus')).toBe('hello Brutus');
});


test('DEFINEs', () => {
    class Person extends Class {
        foo() { return 'bar'; }
    }
    
    let p = new Person();
    
    expect(p.DEFINES('foo')).toBe(true);
    expect(p.DEFINES('bar')).toBe(false);
});


test("non-dkclass-ctor", () => {
    class Person extends Class {
        constructor(fname, lname) {
            super(fname, lname);
            this.fname = fname;
            this.lname = lname;
        }
    }
    expect((new Person('hello', 'world')).fname).toBe('hello');
});


// test("test-class-attrs", () => {
//     @classattrs({hello: 'world'})
//     class Person extends Class {
//         foo() { return 'bar'; }
//     }

//     let p = new Person();
//     expect(p.hello).toBe(undefined);
//     expect(Person.hello).toBe('world');
// });


test('obj.FN', () => {
    const Person = Class.extend({
        __name__: 'Person',
        bar: 42,
        
        foo() { return this.bar; }
    });
    
    let p = new Person();
    let localfoo = p.FN('foo');
    
    expect(localfoo()).toBe(42);
    expect(localfoo.name).toBe('Person.foo');
});
