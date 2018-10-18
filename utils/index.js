exports.randomizeArray = (arr, finalLength) => {
    ramdomized = [];
    finished = false;

    while (!finished) {
        let index = Math.floor(Math.random()* arr.length);
        
        if (!ramdomized.some(r => r === index)) {
            ramdomized.push(index);
        }
        if (ramdomized.length === finalLength) {
            finished = true;
        }
    }
    return [...Array(finalLength)].map((_, i) => arr[ramdomized[i]]);
}
