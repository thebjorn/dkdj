
/**
 * Returns an array of n elements with values from calling fn.
 *
 * @param n
 * @param fn
 * @returns {Array}
 */
export function times(n, fn) {
    const res = Array(n);
    for (let i=0; i<n; i++) {
        res[i] = fn(i);
    }
    return res;
}
