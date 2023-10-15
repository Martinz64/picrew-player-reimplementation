class ImageMakerProvider{
    constructor(parts,item_defaults){
        this.parts = parts;
        this.item_defaults = item_defaults;
    }

    getParts(){
        return this.parts;
    }

    getItemDefaults(){
        return this.item_defaults
    }

}

window.ImageMakerProvider = ImageMakerProvider