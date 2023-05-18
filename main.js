var layer_selections = {};

/*
Layer id: 
    [Item id, Variant id, Variant color]

*/
var color_selections = {};


var parts = [];
let cf;
let base_id = 0
const data_directory = "data/"

let enable_tinting = false
let img_cache = {};

let compat_params = {
    part_item_offset: 1,
    item_item_offset: 1,
    compat_no_names_in_path: false
}

let parameters = window.location.search.replace("?","").split("&")
parameters.forEach(parameter => {
    let name = parameter.split("=")[0]
    let value = parameter.split("=")[1]
    if(name == "id"){
        base_id = parseInt(value)
    }
    if(name == "enable-tinting" && value == 1){
        enable_tinting = true 
    }
    if(name == "compat-mode"){
        if(value == "old1"){
            compat_params.item_item_offset = 0
        }
        if(value == "NO_NAMES_IN_PATH"){
            compat_params.compat_no_names_in_path = true
        }
    }
})

document.addEventListener("DOMContentLoaded", async () => {

    if(base_id == 0){
        document.body.classList.add("show-alert")
        document.body.classList.add("id-error")
        return
    }

    let cf_req = await fetch( data_directory + base_id + "/cf.json");
    cf = await cf_req.json();
    console.log(cf)

    let img_req = await fetch(data_directory + base_id + "/img.json");
    let img = await img_req.json();
    console.log(img)


    let cf_parts = cf.pList;

    //check compat mode
    checkCompatibility(cf_parts)
    

    for (let i = 0; i < cf_parts.length; i++) {
        const part_data = cf_parts[i];
        let name = part_data.pNm
        let id = part_data.pId
        
        
        let dirname = pad(i+compat_params.part_item_offset,4) + "-" + id + "-" + part_data.pNm
        if(compat_params.compat_no_names_in_path){
            dirname = pad(i+compat_params.part_item_offset,4) + "-" + id
        }
        
        let thumbnailURL = part_data.thumbUrl ? part_data.thumbUrl.match(/p_.*\.(?:png|jpg)/)+"" : ""
        let coveredLayers = part_data.lyrs
        let colorProfiles = cf.cpList[part_data.cpId]
        
        let items = [];
        for (let j = 0; j < part_data.items.length; j++) {
            const item_data = part_data.items[j];
            let variantId = item_data.itmId;
            let basedir = pad(j+compat_params.item_item_offset,4) + '-' + item_data.itmId;
            
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
                            VariantColorID: variant_id,
                            Layers: []
                        })
                    }
                    variant_d = variants.find(e => e.VariantID == variant_id)

                    let split_url = variants_imgdata[layerId][variant_id].url.split("/")
                    let url_fname = split_url[split_url.length - 1]
                    variant_d.Layers.push({
                        zIndex: cf.lyrList[layerId],
                        url: url_fname
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

        //Build the header 
        htmladd += "<div class='part-header'>"
        
        //Title bar with icon and clear button
        htmladd += "<div class='card part-title'>"
        htmladd += "<img src='" + data_directory + base_id+ "/" + part.BaseDirectory + "/" + part.ThumbnailFilename + "'>"
        htmladd += "<h3>" + part.Name + "</h3>"
        //htmladd += "<button class='clear-part' data-part-id='" + part.ID + "' onclick='clear_part(this)'>Clear</button>"
        htmladd += "</div>"
        
        //Color selector if available
        const firstItem = part.Items[0]
        if(firstItem?.Variants?.length > 1){
            htmladd += "<div class='card color-panel'>"
            for (let k = 0; k < firstItem.Variants.length; k++) {
                const variant = firstItem.Variants[k];
                htmladd += "<div data-part-id='" + part.ID + "' data-variant-id='" + variant.VariantID + "' class='color_selector_item' style='background-color:" + variant.VariantColor + "' data-variant-color-id='" + variant.VariantColorID + "' onclick='select_color(this)'></div>"
            }
            htmladd += "</div>"
        }

        if(enable_tinting){
            htmladd += "<div class='part-tint-options'>"
            htmladd += "<h3>Tint</h3>"
            htmladd += "<div>"
            htmladd += "<label class='switch'><input type='checkbox' class='part-tint-enable' onchange='updateTintControl(this)' data-part-id='" + part.ID + "'><span class='slider'></span></label>"
            htmladd += "<input type='color' class='part-tint-control' onchange='updateTintControl(this)' data-part-id='" + part.ID + "'>"
            htmladd += "</div>"
            htmladd += "</div>"
        }

        htmladd += "</div>"

        

        htmladd += "<div class='item_list'>"

        htmladd += "<div class='item_s'>"
        htmladd += "    <button class='clear-part' data-part-id='" + part.ID + "' onclick='clear_part(this)'>Clear</button>"
        htmladd += "</div>"


        for (let j = 0; j < part.Items.length; j++) {
            const item = part.Items[j];
            const hasColorPicker = item.Variants.length > 1
            htmladd += "<div class='item_s " + ( hasColorPicker ? "has-color-picker" : "") + "' data-part-id='" + part.ID + "' data-item-id='" + item.ItemID + "' onclick='update_canvas(this)'>"
            //htmladd += "<div class='item-thumbnail'>"
            htmladd += "<img src='" + data_directory + base_id+ "/" + part.BaseDirectory + "/" + item.BaseDirectory + "/" + item.ThumbnailFilename + "' > " //data-part-id='" + part.ID + "' data-item-id='" + item.ItemID + "' onclick='update_canvas(this)'>"
            //htmladd += "</div>"

            /*if(item.Variants.length > 1){
                htmladd += "<div class='color-panel'>"
                for (let k = 0; k < item.Variants.length; k++) {
                    const variant = item.Variants[k];
                    htmladd += "<div data-part-id='" + part.ID + "' data-item-id='" + item.ItemID + "' data-variant-id='" + variant.VariantID + "' class='color_selector_item' style='background-color:" + variant.VariantColor + "' data-variant-color-id='" + variant.VariantColorID + "' onclick='update_canvas(this)'></div>"
                }
                htmladd += "</div>"
            }*/
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
                //layer_selections[part.ID+""] = [item.ItemID,item.Variants[0].VariantID,item.Variants[0].VariantColor] //base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  item.VariantFilenames[0]
                layer_selections[part.ID+""] = {
                    Visible: true,
                    ItemID: item.ItemID,
                    VariantID: item.Variants[0].VariantID,
                    VariantColor: item.Variants[0].VariantColor,
                    VariantColorID: item.Variants[0].VariantColorID,
                    EnableTint: false,
                    TintColor: [0, 0, 0],
                    Offset: [0, 0],
                    Rotation: 0,
                    Scale: 1
                }
                //console.log(layer_selections[part.ID])
            }
        });
    }

    loadFromLocalStorage()
    //loadFromLocalstorage()
    updateEverything()
})

function checkCompatibility(cf_parts) {
    
    const first_part = cf_parts[0]
    const first_item = first_part.items[0]
    const thumbnail_url = (first_item.thumbUrl ? first_item.thumbUrl.match(/\/[a-z]{1,2}_.+\.(?:png|jpg)/)+"" : "").replace("/","")
    console.log(thumbnail_url)
    let part_dir = pad(compat_params.part_item_offset,4) + '-' + first_part.pId + "-" + first_part.pNm;
    if(compat_params.compat_no_names_in_path){
        part_dir = pad(compat_params.part_item_offset,4) + '-' + first_part.pId;
    }

    let item_dir = pad(compat_params.item_item_offset,4) + '-' + first_item.itmId;
    
    let img_url = data_directory + base_id + "/" + part_dir + "/" + item_dir + "/" + thumbnail_url
    console.log(img_url)
    fetch(img_url).then(a=>{
        //alert(a.status)
        if(a.status == 404){
            //alert("compat error") 
            document.body.classList.add("show-alert")
            document.body.classList.add("compat-error")
        }
    })
}

async function render(){
    const canvas = document.getElementById("viewer")
    const ctx = canvas.getContext('2d')



    let layers = [];

    let layers_scale = [];
    let layers_offset = [];
    let layers_rotation = [];
    for (let i = 0; i < 100; i++) {
        layers.push("") 
        layers_scale.push(1)
        layers_offset.push([0,0])
        layers_rotation.push(0)
    }
    let layer_tint_data = [];
    for (let i = 0; i < 100; i++) {
        layer_tint_data.push([])
    }


    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const id = part.ID;
        const variantID = layer_selections[id+""];
        if(variantID == undefined || variantID.length == 0) continue;
        if(!variantID.Visible) continue;
        
        let item = part.Items.find(e => e.ItemID == variantID.ItemID)
        let vari = item.Variants.find(e => e.VariantID == variantID.VariantID)
        if(variantID.VariantColorID){
            vari = item.Variants.find(e => e.VariantColorID == variantID.VariantColorID) // variantID[2] is color
        }
        vari.Layers.forEach(l => {
            layers[l.zIndex] = data_directory + base_id + "/" + part.BaseDirectory + "/" + item.BaseDirectory + "/" + l.url
            layers_offset[l.zIndex] = variantID.Offset
            layers_rotation[l.zIndex] = variantID.Rotation
            layers_scale[l.zIndex] = variantID.Scale
        })
        if(enable_tinting){
            vari.Layers.forEach(l => {
                layer_tint_data[l.zIndex] = [variantID.EnableTint, ...variantID.TintColor]
            })
        } else {
            vari.Layers.forEach(l => {
                if(variantID.TintColor){
                    layer_tint_data[l.zIndex] = [false, ...variantID.TintColor]
                } else {
                    layer_tint_data[l.zIndex] = [false, 0,0,0]
                }
            })
        }
        /*part.Layers.forEach(lyr => {
            layers[lyr] = url
        })*/
        
        
    }

    console.log(layers.length)

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
        if(layer_tint_data[i][0]){
            const tint_data = layer_tint_data[i]
            const hash = btoa(encodeURIComponent(url)+tint_data[1]+tint_data[2]+tint_data[3])
            if(document.getElementById(hash)==null){
                await new Promise(function(done){
                    let image = document.getElementById(btoa(encodeURIComponent(url)))
                    var rgbks = generateRGBKs( image );
                    var tintImg = generateTintImage( image, rgbks, tint_data[1], tint_data[2], tint_data[3]);
                    //var tintImg = multiply(image,"#990");

                    tintImg.toBlob(b => {
                        let blobURL = URL.createObjectURL(b)
                        let image = document.createElement("img")
                        image.onload = async () => {
                            img_cache[url] = true
                            image.id = hash
                            document.getElementById("imgcache").appendChild(image)
                            done()
                        }
                        image.onerror = () =>{
                            done()
                        }

                        image.src = blobURL
                    })
                    
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
            const tintData = layer_tint_data[i]
            const offset = layers_offset[i]
            const rotation = layers_rotation[i]
            console.log(tintData)

            if(!tintData[0]){
                let image = document.getElementById(btoa(encodeURIComponent(url)))
                
                //ctx.drawImage(image,0,0)

                

                var tr_x = canvas.width / 2 + offset[0];
                var tr_y = canvas.height / 2 + offset[1];
                
                var angle = rotation * Math.PI / 180; // Convertir a radianes

                ctx.save()
                ctx.translate(tr_x,tr_y)
                ctx.rotate(angle)
                //ctx.drawImage(image,0,0,scaledWidth,scaledHeight);
                ctx.drawImage(image,-image.width/2,-image.height/2);
                //ctx.rotate(-rotation)
                //ctx.translate(-tr_x,-tr_y)
                ctx.restore()

            } else {
                const tint_hash = btoa(encodeURIComponent(url)+tintData[1]+tintData[2]+tintData[3])
                let image = document.getElementById(tint_hash)
                ctx.drawImage(image,0,0)
            }
            
        }
    }

}

function update_canvas(i){
    const pID = i.dataset.partId
    const iID = i.dataset.itemId
    console.log(i.dataset.partId,i.dataset.itemId)

    parts.find(e => e.PartID == pID).Items.forEach(item => {
        if(item.ItemID == iID){
            if(typeof layer_selections[pID+""] == 'undefined'){
                layer_selections[pID+""] = {}
            }

            layer_selections[pID+""].ItemID = item.ItemID
            layer_selections[pID+""].VariantID = item.Variants[0].VariantID
            if(typeof layer_selections[pID+""].VariantColorID == 'undefined'){
                layer_selections[pID+""].VariantColorID = item.Variants[0].VariantColorID
            }
            layer_selections[pID+""].Visible = true
            item.Variants.forEach(variant => {
                if(i.dataset.variantColorId){
                    if(variant.VariantColorID == i.dataset.variantColorId){
                        //layer_selections[pID+""] = [item.ItemID,variant.VariantID,variant.VariantColor] //base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  item.VariantFilenames[0]
                        layer_selections[pID+""].ItemID = item.ItemID
                        layer_selections[pID+""].VariantID = variant.VariantID 
                        layer_selections[pID+""].VariantColor = variant.VariantColor 
                        layer_selections[pID+""].VariantColorID = variant.VariantColorID
                        layer_selections[pID+""].Visible = true
                        
                    }
                }
            })
            
            
            //console.log(layer_selections[part.ID])
        }
    });
    updateEverything()
}

function select_color(i){
    const pID = i.dataset.partId
    console.log(i.dataset.partId,i.dataset.itemId)

    const current_selection = layer_selections[pID+""]

    const part = parts.find(e => e.PartID == pID)
    const item = part.Items.find(e => e.ItemID == current_selection.ItemID)

    console.log(item)
    const selectedVariantId = i.dataset.variantId

    layer_selections[pID+""].VariantColorID = selectedVariantId

    console.log(layer_selections[pID])
    console.log(selectedVariantId)


    /*parts.find(e => e.PartID == pID).Items.forEach(item => {
        if(item.ItemID == iID){
            if(typeof layer_selections[pID+""] == 'undefined'){
                layer_selections[pID+""] = {}
            }

            layer_selections[pID+""].ItemID = item.ItemID
            layer_selections[pID+""].VariantID = item.Variants[0].VariantID
            if(typeof layer_selections[pID+""].VariantColorID == 'undefined'){
                layer_selections[pID+""].VariantColorID = item.Variants[0].VariantColorID
            }
            layer_selections[pID+""].Visible = true
            item.Variants.forEach(variant => {
                if(i.dataset.variantColorId){
                    if(variant.VariantColorID == i.dataset.variantColorId){
                        //layer_selections[pID+""] = [item.ItemID,variant.VariantID,variant.VariantColor] //base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  item.VariantFilenames[0]
                        layer_selections[pID+""].ItemID = item.ItemID
                        layer_selections[pID+""].VariantID = variant.VariantID 
                        layer_selections[pID+""].VariantColor = variant.VariantColor 
                        layer_selections[pID+""].VariantColorID = variant.VariantColorID
                        layer_selections[pID+""].Visible = true
                        
                    }
                }
            })
            
            
            //console.log(layer_selections[part.ID])
        }
    });*/
    updateEverything()
}

function clear_part(i){
    const pID = i.dataset.partId
    layer_selections[pID+""].Visible = false
    updateEverything()

}

function updateSelections() {
    let item_selectors = document.querySelectorAll(".item_s")
    item_selectors.forEach(it => {
        const item_partId = it.dataset.partId+''
        if(layer_selections[item_partId]){
            if(layer_selections[item_partId].ItemID+"" == it.dataset.itemId && layer_selections[item_partId].Visible){
                it.classList.add("selected_item")
            } else {
                it.classList.remove("selected_item")
            }
        }
    });

    let color_item_selectors = document.querySelectorAll(".color_selector_item")
    color_item_selectors.forEach(it => {
        const item_partId = it.dataset.partId+''
        if(layer_selections[item_partId]){
            if(layer_selections[item_partId].VariantColorID+"" == it.dataset.variantColorId && layer_selections[item_partId].Visible){
                it.classList.add("color_selector_item_selected")
            } else {
                it.classList.remove("color_selector_item_selected")
            }
        }
    });

    let tint_control_selectors = document.querySelectorAll(".part-tint-control")
    tint_control_selectors.forEach(it => {
        const item_partId = it.dataset.partId+''
        if(layer_selections[item_partId]){
            const tint_data = layer_selections[item_partId].TintColor
            console.log(tint_data)
            it.value = rgbToHex(tint_data[0],tint_data[1],tint_data[2])
        }
    });

    let tint_enable_selectors = document.querySelectorAll(".part-tint-enable")
    tint_enable_selectors.forEach(it => {
        const item_partId = it.dataset.partId+''
        if(layer_selections[item_partId]){
            const tint_data = layer_selections[item_partId].TintColor
            it.checked = layer_selections[item_partId].EnableTint
        }
    });


}

function updateEverything(){
    render()
    updateSelections()
    updateTextarea()
    saveToLocalStorage()
    updateViewerSize()
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
    let height = document.body.clientHeight
    let width = document.body.clientWidth
    let horizontal = width > height
    console.log(width,height)
    
    if(horizontal){
        document.body.classList.add("horizontal")
    } else {
        document.body.classList.remove("horizontal")
    }
    
    


    //let height = document.getElementById("viewer-area").getClientRects()[0].height
    //document.getElementById("selector-area").style = "height:calc( 100vh - " + height + "px);"
    //document.getElementById("selector-area").style = "--computed-height:" + height + "px;"
    //document.getElementById("selector-area").dataset.computedHeight = height
    
}

function updateViewerSize(){
    /*if(localStorage.smallPreviewSize === undefined){
        localStorage.smallPreviewSize = false
    }*/
    let toggle_button = document.getElementById("preview-size-button")
    if(localStorage.previewSize == "small"){
        document.body.classList.add("small-preview")
        toggle_button.innerText = "+"
    } else {
        document.body.classList.remove("small-preview")
        toggle_button.innerText = "-"
    }
}
function toggleViewerSize(){
    localStorage.previewSize = (!(localStorage.previewSize == "small"))?"small":"big"
    updateViewerSize()
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

function updateTintControl(c) {
    console.log(c.type)
    console.log(c.checked)
    if(c.type == 'checkbox'){
        layer_selections[c.dataset.partId+''].EnableTint = c.checked
    }
    //console.log(hex_to_RGB(c.value))
    updateEverything()
}
/*

Part
    - id
    - name
    - thumbnailURL
    - Items


*/