/* eslint-disable valid-typeof */
/**
 * @param {String} type
 * @param {Any} args
 */
module.exports = (type, ...args) => {
    if (typeof type !== "string") {
        throw new TypeError("type is not a string.");
    }

    args.forEach(key => {
        if (typeof key !== type) {
            throw new TypeError(`${key} is ${typeof key}, not a ${type}.`);
        }
    });
};
