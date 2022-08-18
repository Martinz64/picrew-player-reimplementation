var layer_selections = {};
/*
Layer id: 
    [Item id, Variant id, Variant color]

*/
var color_selections = {};


var parts = [];
let cf;
let base_id = 22352
const data_directory = "data/"

let img_cache = {};


let parameters = window.location.search.replace("?","").split("&")
parameters.forEach(parameter => {
    let name = parameter.split("=")[0]
    let value = parameter.split("=")[1]
    if(name == "id"){
        base_id = parseInt(value)
    }
})


document.addEventListener("DOMContentLoaded", async () => {


    let cf_req = await fetch( data_directory + base_id + "/cf.json");
    cf = await cf_req.json();
    console.log(cf)

    let img_req = await fetch(data_directory + base_id + "/img.json");
    let img = await img_req.json();
    console.log(img)


    let cf_parts = cf.pList;

    for (let i = 0; i < cf_parts.length; i++) {
        const part_data = cf_parts[i];
        let name = part_data.pNm
        let id = part_data.pId
        let dirname = pad(i+1,4) + "-" + id + "-" + part_data.pNm
        let thumbnailURL = part_data.thumbUrl ? part_data.thumbUrl.match(/p_.*\.(?:png|jpg)/)+"" : ""
        let coveredLayers = part_data.lyrs
        let colorProfiles = cf.cpList[part_data.cpId]
        
        let items = [];
        for (let j = 0; j < part_data.items.length; j++) {
            const item_data = part_data.items[j];
            let variantId = item_data.itmId;
            let basedir = pad(j,4) + '-' + item_data.itmId;
            
            
            if(id == 204183){
                console.log(id,img.lst[item_data.itmId])
                let aa = img.lst[item_data.itmId]
                console.log(aa[Object.keys(aa)[0]])
            }
            
            let variants = [];

            let variants_imgdata = img.lst[variantId]
            console.log(variants_imgdata)
            if(typeof variants_imgdata == "undefined") continue;

            Object.keys(variants_imgdata).forEach(layerId => {
                Object.keys(variants_imgdata[layerId]).forEach(variant_id => {
                    let variant_d = variants.find(e => e.VariantID == variant_id)

                    let variant_color = colorProfiles.find(e => e.cId == variant_id).cd
                    if(variant_d == undefined){
                        variants.push({
                            VariantID: parseInt(variant_id),
                            VariantColor: variant_color,
                            Layers: []
                        })
                    }
                    variant_d = variants.find(e => e.VariantID == variant_id)
                    variant_d.Layers.push({
                        zIndex: cf.lyrList[layerId],
                        url: variants_imgdata[layerId][variant_id].url.match(/i_.*\.(?:png|jpg)/)+""
                    })
                })
            })
            items.push({
                ItemID: variantId,
                BaseDirectory: basedir,
                //let thumbnailURL = typeof part_data.thumbUrl == 'undefined' ? part_data.thumbUrl.match(/p_.*\.(?:png|jpg)/)+"" : ""
                ThumbnailFilename: item_data.thumbUrl ? item_data.thumbUrl.match(/ii_.*\.(?:png|jpg)/)+"" : "",
                Variants: variants
            })
        }
        parts.push({
            Name: name,
            BaseDirectory: dirname,
            ThumbnailFilename: thumbnailURL,
            Name: name,
            ID: id,
            PartID: id,
            Items: items
        })
    }
    console.log(parts)

    let htmladd = ""
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        htmladd += "<div class='part_s'>"
        htmladd += "<div class='part-title'>"
        htmladd += "<img src='" + data_directory + base_id+ "/" + part.BaseDirectory + "/" + part.ThumbnailFilename + "'>"
        htmladd += "<h3>" + part.Name + "</h3>"
        htmladd += "<button class='clear-part' data-part-id='" + part.ID + "' onclick='clear_part(this)'>Clear</button>"

        htmladd += "</div>"


        htmladd += "<div class='item_list'>"
        for (let j = 0; j < part.Items.length; j++) {
            const item = part.Items[j];
            const hasColorPicker = item.Variants.length > 1
            htmladd += "<div class='item_s " + ( hasColorPicker ? "has-color-picker" : "") + "' data-part-id='" + part.ID + "' data-item-id='" + item.ItemID + "' onclick='update_canvas(this)'>"
            htmladd += "<div class='item-thumbnail'>"
            htmladd += "<img src='" + data_directory + base_id+ "/" + part.BaseDirectory + "/" + item.BaseDirectory + "/" + item.ThumbnailFilename + "' > " //data-part-id='" + part.ID + "' data-item-id='" + item.ItemID + "' onclick='update_canvas(this)'>"
            htmladd += "</div>"

            if(item.Variants.length > 1){
                htmladd += "<div class='color-panel'>"
                for (let k = 0; k < item.Variants.length; k++) {
                    const variant = item.Variants[k];
                    htmladd += "<div data-part-id='" + part.ID + "' data-item-id='" + item.ItemID + "' data-variant-id='" + variant.VariantID + "' class='color_selector_item' style='background-color:" + variant.VariantColor + "' data-variant-color='" + variant.VariantColor + "' onclick='update_canvas(this)'></div>"
                }
                htmladd += "</div>"
            }
            htmladd += "</div>"

        }
        htmladd += "</div>"
        htmladd += "</div>"
    }
    document.getElementById("htmladd").innerHTML=htmladd

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        //let defaultURL = base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  part.Items[0].VariantFilenames[0]
        //layer_selections[part.ID] = defaultURL
        let zeroItemId = cf.zeroConf[part.ID+""].itmId
        part.Items.forEach(item => {
            if(item.ItemID == zeroItemId){
                item.Variants.forEach(variant => {

                })
                layer_selections[part.ID+""] = [item.ItemID,item.Variants[0].VariantID,item.Variants[0].VariantColor] //base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  item.VariantFilenames[0]
                //console.log(layer_selections[part.ID])
            }
        });
    }

    loadFromLocalStorage()
    //loadFromLocalstorage()
    updateEverything()
})

async function render(){
    const canvas = document.getElementById("viewer")
    const ctx = canvas.getContext('2d')



    let layers = [];
    for (let i = 0; i < 100; i++) {
        layers.push("")    
    }


    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const id = part.ID;
        const variantID = layer_selections[id+""];
        if(variantID == undefined || variantID.length == 0) continue;
        console.log(variantID)
        console.log(part)
        let item = part.Items.find(e => e.ItemID == variantID[0])
        let vari = item.Variants.find(e => e.VariantID == variantID[1])
        if(variantID[2]){
            vari = item.Variants.find(e => e.VariantColor == variantID[2]) // variantID[2] is color
        }
        console.log(vari)
        vari.Layers.forEach(l => {
            layers[l.zIndex] = data_directory + base_id + "/" + part.BaseDirectory + "/" + item.BaseDirectory + "/" + l.url
        })
        /*part.Layers.forEach(lyr => {
            layers[lyr] = url
        })*/
        
        
    }

    /* Cache all images */

    for (let i = 0; i < layers.length; i++) {
        const url = layers[i];
        if(url != "" && url){
            if(document.getElementById(btoa(encodeURIComponent(url)))==null){
                await new Promise(function(done){
                    let image = document.createElement("img")
                        image.onload = async () => {
                            img_cache[url] = true
                            image.id = btoa(encodeURIComponent(url))
                            document.getElementById("imgcache").appendChild(image)
                            done()
                        }
                        image.onerror = () =>{
                            done()
                        }
                        image.src = url
                })
            }
        }
    }

    /*
    Funny drawing
    */

    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, 900, 900);

    for (let i = 0; i < layers.length; i++) {
        const url = layers[i];
        if(url != "" && url){
            ctx.drawImage(document.getElementById(btoa(encodeURIComponent(url))),0,0)
            await new Promise(function(done){
                if(document.getElementById(btoa(encodeURIComponent(url)))==null){
                    //let image = new Image();
                    let image = document.createElement("img")
                    image.onload = async () => {
                        ctx.drawImage(image,0,0);
                        img_cache[url] = true
                        image.id = btoa(encodeURIComponent(url))
                        document.getElementById("imgcache").appendChild(image)
                        done()
                    }
                    image.src = url
                } else {
                    
                    done()
                }
                //console.log(url)
            })
        }
    }

    for (const key in layer_selections) {
        if (Object.hasOwnProperty.call(layer_selections, key)) {
            
        }
    }
    
    /*var image = new Image();
    image.onload = () => {
        ctx.drawImage(image,0,0);
    }
    image.src = "22352/0002-47847-顔２(ほくろ)/0000-204160/i_hXYepKTMoNCcrKFo.png"*/
}

function update_canvas(i){
    const pID = i.dataset.partId
    const iID = i.dataset.itemId
    console.log(i.dataset.partId,i.dataset.itemId)

    parts.find(e => e.PartID == pID).Items.forEach(item => {
        if(item.ItemID == iID){
            if(typeof layer_selections[pID+""] == 'undefined'){
                layer_selections[pID+""] = []
            }

            layer_selections[pID+""][0] = item.ItemID
            layer_selections[pID+""][1] = item.Variants[0].VariantID
            if(typeof layer_selections[pID+""][2] == 'undefined'){
                layer_selections[pID+""][2] = item.Variants[0].VariantColor
            }
            item.Variants.forEach(variant => {
                if(i.dataset.variantColor){
                    if(variant.VariantColor == i.dataset.variantColor){
                        layer_selections[pID+""] = [item.ItemID,variant.VariantID,variant.VariantColor] //base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  item.VariantFilenames[0]
                    }
                }
            })
            
            
            //console.log(layer_selections[part.ID])
        }
    });
    updateEverything()
}

function clear_part(i){
    const pID = i.dataset.partId
    layer_selections[pID+""] = []
    updateEverything()

}

function updateSelections() {
    let item_selectors = document.querySelectorAll(".item_s")
    item_selectors.forEach(it => {
        if(layer_selections[it.dataset.partId+'']){
            if(layer_selections[it.dataset.partId+''][0]+"" == it.dataset.itemId){
                it.classList.add("selected_item")
            } else {
                it.classList.remove("selected_item")
            }
        }
    });

    let color_item_selectors = document.querySelectorAll(".color_selector_item")
    color_item_selectors.forEach(it => {
        if(layer_selections[it.dataset.partId+'']){
            if(layer_selections[it.dataset.partId+''][0]+"" == it.dataset.itemId && layer_selections[it.dataset.partId+''][2]+"" == it.dataset.variantColor){
                it.classList.add("color_selector_item_selected")
            } else {
                it.classList.remove("color_selector_item_selected")
            }
        }
    });


}

function updateEverything(){
    render()
    updateSelections()
    updateTextarea()
    saveToLocalStorage()
}

function updateTextarea() {
    let textarea = document.getElementById("state-data")
    textarea.value = JSON.stringify(layer_selections)
}
function loadFromTextarea() {
    let textarea = document.getElementById("state-data")
    layer_selections = JSON.parse(textarea.value)
    console.log(JSON.parse(textarea.value))
    updateEverything()
}

function loadFromLocalStorage() {
    if(localStorage.getItem(base_id+"-data")){
        let ls_data = localStorage.getItem(base_id+"-data")
        layer_selections = JSON.parse(ls_data)
    }
}
function saveToLocalStorage() {
    localStorage.setItem(base_id+"-data",JSON.stringify(layer_selections))
}
function clearLocalStorage() {
    localStorage.removeItem(base_id+"-data")

}

function resizeSelectorArea() {
    let height = document.getElementById("viewer-area").getClientRects()[0].height
    //document.getElementById("selector-area").style = "height:calc( 100vh - " + height + "px);"
    document.getElementById("selector-area").style = "--computed-height:" + height + "px;"
    //document.getElementById("selector-area").dataset.computedHeight = height
    
}
function downloadURI(uri, name) 
{
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
}

function downloadCanvas() {
    const canvas = document.getElementById("viewer")
    canvas.toBlob(b => {
        let blobURL = URL.createObjectURL(b)
        downloadURI(blobURL,base_id + ".png")
    })
}

/*

Part
    - id
    - name
    - thumbnailURL
    - Items


*/