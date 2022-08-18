function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function turnIntoArray(o){
    let a = []
    for (let i = 0; i < Object.keys(o).length; i++) {
        const element = o[Object.keys(o)[i]];
        a.push(element)
    }
    return a;
}