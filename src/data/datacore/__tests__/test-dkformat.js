import {_no_date, _no_datetime, bool, no_date, no_datetime, percent, sprintf, twodigits, value, no_money} from "../dk-format";
import foo from "../dk-format";

const dk = {f:sprintf};

test("printf", () => {
    // %.2f
    const world = 'world';
    console.log(`hello ${world}, pi = ${dk.f('%.2f', Math.PI)}.`);
    expect(
        `hello ${world}, pi = ${dk.f('%.2f', Math.PI)}.`
    ).toEqual("hello world, pi = 3.14.");

    expect(sprintf("hello")).toEqual("hello");
    expect(sprintf("%f", 3.0)).toEqual("3");
    // expect(sprintf("%#f", 3.0)).toEqual("3");
    expect(sprintf("%f", Math.PI)).toEqual("3.141592653589793");
    expect(sprintf("%e", Math.PI)).toEqual("3.141592653589793e+0");
    expect(sprintf("%b", 4)).toEqual("100");
    expect(sprintf("%c", 32)).toEqual(" ");
    
    expect(sprintf("%o", 8)).toEqual("10");
    expect(sprintf("%r", {hello: 'world'})).toEqual('{"hello":"world"}');
    expect(sprintf("%s", "hello")).toEqual("hello");
    expect(sprintf("%u", -1)).toEqual(`${2**32-1}`);
    expect(sprintf("%x", 15)).toEqual("f");
    expect(sprintf("%X", 15)).toEqual("F");
    expect(sprintf("%%")).toEqual("%");
    expect(sprintf("%2$d %1$d",16,17)).toEqual("17 16");
    expect(sprintf("%2$-5d %1$03d", 1, 2)).toEqual("2     001");
    
    expect(sprintf("%03d", 1)).toEqual("001");
    expect(sprintf("%+5d", 1)).toEqual("   +1");
    expect(sprintf("%-5d", 1)).toEqual("1    ");

});


test("twodigits", () => {
    expect(twodigits(1)).toBe('01');
    expect(twodigits(11)).toBe('11');
});


test("test-value", () => {
    expect(value(null)).toBe("");
    expect(value("")).toBe("");
    expect(value(42)).toBe("42");
    expect(value({v: "hello", f: "42"})).toBe("42");
    expect(value({v: "42"})).toBe("42");
});

test("test-format-value", () => {
    expect(foo.format_value(null)).toBe("");
    expect(foo.format_value("")).toBe("");
    expect(foo.format_value(42)).toBe("42");
    expect(foo.format_value({v: "hello", f: "42"})).toBe("42");
    expect(foo.format_value({v: "42"})).toBe("42");
});


test("percent", () => {
    expect(percent(51)).toBe('51%');
});


test("bool", () => {
    expect(bool('yes', 'no')(true)).toBe('yes');
    expect(bool('yes', 'no')(false)).toBe('no');
});

test("_no_date", () => {
    expect(
        _no_date(new Date(2019, 0, 23, 16, 1))
    ).toEqual("23.01.2019");
});


test("test-no_date", () => {
    expect(no_date()).toBe("");
    const val = {value: new Date(2019, 0, 23, 16, 1)};
    expect(no_date(val)).toEqual("23.01.2019");
});

test("_no_datetime", () => {
    expect(
        _no_datetime(new Date(2019, 0, 23, 16, 1))
    ).toEqual("23.01.2019 kl.16.01:00");
});


test("test-no_datetime", () => {
    expect(no_datetime()).toBe("");
    const val = {value: new Date(2019, 0, 23, 16, 1)};
    expect(no_datetime(val)).toEqual("23.01.2019 kl.16.01:00");
});


test("test-no_money", () => {
    expect(no_money(0)).toBe("0 + 0 asd");
})
