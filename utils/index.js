const Types = require('mongoose').Types;

/**
 * @param {Array} array the array to be shuffled
 * @returns {any[]} shuffled array
 */
exports.shuffleArray = (array = []) => {
    return getRamdomizedArrayOfIndexes(array.length).map(v => array[v]);
};

/**
 *
 * @param {Number} length the length of the array to be generated
 * @param {Number[]} array initial array, if not specified, will be used by the same function recursively to obtain the desired values
 * @returns {Number[]} array of randomized indexes
 */
const getRamdomizedArrayOfIndexes = (length, array = []) => {
    const newArray = [
        ...new Set(array.concat(Math.floor(Math.random() * length)))
    ];
    return newArray.length < length
        ? getRamdomizedArrayOfIndexes(length, newArray)
        : newArray;
};

/**
 * @param {String|String[]} value A string or array of strings to be casted to ObjectId
 */
exports.castToObjectId = value => {
    if (typeof value === 'string') {
        return Types.ObjectId(value);
    }
    if (Array.isArray(value)) {
        return value.map(v => Types.ObjectId(v));
    }
    throw new Error('The value cannot be casted to ObjectId');
};
