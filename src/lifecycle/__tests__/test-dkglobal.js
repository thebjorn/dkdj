import globalThis from "../dkglobal";
import {dkconsole} from "../dkboot/dk-console";

test('test-dkglobal', () => {
    // dkconsole.error('hello world');
    dkconsole.log('hello world');
    expect(globalThis).toBeTruthy();
});
