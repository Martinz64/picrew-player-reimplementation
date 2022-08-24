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

function generateRGBKs( img ) {
    var w = img.width;
    var h = img.height;
    var rgbks = [];

    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    
    var ctx = canvas.getContext("2d");
    ctx.drawImage( img, 0, 0 );
    
    var pixels = ctx.getImageData( 0, 0, w, h ).data;

    // 4 is used to ask for 3 images: red, green, blue and
    // black in that order.
    for ( var rgbI = 0; rgbI < 4; rgbI++ ) {
        var canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        
        var ctx = canvas.getContext('2d');
        ctx.drawImage( img, 0, 0 );
        var to = ctx.getImageData( 0, 0, w, h );
        var toData = to.data;
        
        for (
                var i = 0, len = pixels.length;
                i < len;
                i += 4
        ) {
            toData[i  ] = (rgbI === 0) ? pixels[i  ] : 0;
            toData[i+1] = (rgbI === 1) ? pixels[i+1] : 0;
            toData[i+2] = (rgbI === 2) ? pixels[i+2] : 0;
            toData[i+3] =                pixels[i+3]    ;
        }
        
        ctx.putImageData( to, 0, 0 );
        
        // image is _slightly_ faster then canvas for this, so convert
        //var imgComp = new Image();
        //imgComp.src = canvas.toDataURL();
        rgbks.push( canvas );
    }

    return rgbks;
}

function generateTintImage( img, rgbks, red, green, blue ) {
    var buff = document.createElement( "canvas" );
    buff.width  = img.width;
    buff.height = img.height;
    
    var ctx  = buff.getContext("2d");

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage( rgbks[3], 0, 0 );

    ctx.globalCompositeOperation = 'lighter';
    if ( red > 0 ) {
        ctx.globalAlpha = red   / 255.0;
        ctx.drawImage( rgbks[0], 0, 0 );
    }
    if ( green > 0 ) {
        ctx.globalAlpha = green / 255.0;
        ctx.drawImage( rgbks[1], 0, 0 );
    }
    if ( blue > 0 ) {
        ctx.globalAlpha = blue  / 255.0;
        ctx.drawImage( rgbks[2], 0, 0 );
    }

    return buff;
}

function multiply(image,color){
    var buff = document.createElement( "canvas" );
    buff.width  = image.width;
    buff.height = image.height;
    
    var ctx  = buff.getContext("2d");

 

    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, image.width, image.height);

    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, buff.width, buff.height);
    
    return buff

}

function tint(image,color){
    var buff = document.createElement( "canvas" );
    buff.width  = image.width;
    buff.height = image.height;
    
    var ctx  = buff.getContext("2d");

 

    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, image.width, image.height);

    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, buff.width, buff.height);
    
    return buff
}

function hex_to_RGB(hex) {
    var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}
// ex.
hex_to_RGB('#FF0110') // {r: 255, g: 1, b: 16}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}