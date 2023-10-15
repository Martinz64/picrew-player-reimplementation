var layer_selections = {};

/*
Layer id: 
    [Item id, Variant id, Variant color]

*/
var color_selections = {};

let state = {
    parts: null,
    default_selection: null,

    provider: null,

    layer_selections: {},
    color_selections: {}
}

var item_defaults = {}
var parts = [];
var numLayers = 100;

let base_id = 0
const data_directory = "data/"

let img_cache = {};

let compat_params = {
    part_item_offset: 1,
    item_item_offset: 1,
    compat_no_names_in_path: false,
    load_json: null,

    compat_mode: null,
    using_old1: false
}

let parameters = window.location.search.replace("?","").split("&")
parameters.forEach(parameter => {
    let name = parameter.split("=")[0]
    let value = parameter.split("=")[1]
    if(name == "id"){
        //base_id = parseInt(value)
        base_id = value
    }
    if(name == "compat-mode"){
        if(value == "old1"){
            compat_params.item_item_offset = 0
            compat_params.using_old1 = true
        }
        if(value == "NO_NAMES_IN_PATH"){
            compat_params.compat_no_names_in_path = true
        }
    }
    if(name == "load-json"){
        compat_params.load_json = value
    }
})

function loadPicrew(state){

    let cur_state = state;
    const maker_provider = cur_state.provider;
    const parts_array = provider.getParts();


    function update_selection_f(i){
        const pID = i.dataset.partId
        const iID = i.dataset.itemId
        console.log(i.dataset.partId,i.dataset.itemId)
    
    
        maker_provider.getParts().find(e => e.PartID == pID).Items.forEach(item => {
            if(item.ItemID == iID){
                if(typeof cur_state.layer_selections[pID+""] == 'undefined'){
                    cur_state.layer_selections[pID+""] = {}
                }
    
                cur_state.layer_selections[pID+""].ItemID = item.ItemID
                cur_state.layer_selections[pID+""].VariantID = item.Variants[0]?.VariantID ?? 0
                if(typeof cur_state.layer_selections[pID+""].VariantColorID == 'undefined'){
                    console.log(item.Variants.length)
                    cur_state.layer_selections[pID+""].VariantColorID = item.Variants.length ? item.Variants[0].VariantColorID : 0
                }
                cur_state.layer_selections[pID+""].Visible = true
                item.Variants.forEach(variant => {
                    if(i.dataset.variantColorId){
                        if(variant.VariantColorID == i.dataset.variantColorId){
                            //layer_selections[pID+""] = [item.ItemID,variant.VariantID,variant.VariantColor] //base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  item.VariantFilenames[0]
                            cur_state.layer_selections[pID+""].ItemID = item.ItemID
                            cur_state.layer_selections[pID+""].VariantID = variant.VariantID 
                            cur_state.layer_selections[pID+""].VariantColor = variant.VariantColor 
                            cur_state.layer_selections[pID+""].VariantColorID = variant.VariantColorID
                            cur_state.layer_selections[pID+""].Visible = true
                            
                        }
                    }
                })
                
                
                //console.log(layer_selections[part.ID])
            }
        });
        updateEverything(cur_state)
    }
    function update_color_selection_f(i){
        const pID = i.dataset.partId
        console.log(i.dataset.partId,i.dataset.itemId)
        
        const current_selection = cur_state.layer_selections[pID+""]
    
        const part = maker_provider.getParts().find(e => e.PartID == pID)
        const item = part.Items.find(e => e.ItemID == current_selection.ItemID)
    
        console.log(item)
        const selectedVariantId = i.dataset.variantId
    
        cur_state.layer_selections[pID+""].VariantColorID = selectedVariantId
    
        console.log(selectedVariantId)

        updateEverything(cur_state)
    }
    function clear_part_f(i){
        const pID = i.dataset.partId
        cur_state.layer_selections[pID+""].Visible = false
        updateEverything(cur_state)
    
    }
    

    //this should be random    
    const globalName = "pic1066"

    window[globalName] = {
        update_selection: update_selection_f,
        update_color_selection: update_color_selection_f,
        clear_part: clear_part_f
    }

    const update_selection_func_name = `window.${globalName}.update_selection`
    const update_color_selection_func_name = `window.${globalName}.update_color_selection`
    const clear_part_func_name = `window.${globalName}.clear_part`


    console.log(parts_array)

    let htmladd = ""
    for (let i = 0; i < parts_array.length; i++) {
        const part = parts_array[i];
        htmladd += "<div class='part_s panel'>"

        //Build the header 
        htmladd += "<div class='part-header'>"
        
        //Title bar with icon and clear button
        htmladd += (
            "<div class='card part-title'>" +
            "<img src='" + part.ThumbnailUrl+ "'>" +
            "<h3>" + part.Name + "</h3>" + 
            "</div>"
        )
        


        //Color selector if available
        const firstItem = part.Items[0]
        if(firstItem?.Variants?.length > 1){
            htmladd += "<div class='card color-panel'>"
            for (let k = 0; k < firstItem.Variants.length; k++) {
                const variant = firstItem.Variants[k];
                htmladd += (`<div data-part-id='${part.ID}' `+
                            `data-variant-id='${variant.VariantID}' `+
                            `class='color_selector_item' `+
                            `style='background-color: ${variant.VariantColor}' `+
                            `data-variant-color-id='${variant.VariantColorID}' `+
                            `onclick='${update_color_selection_func_name}(this)'></div>`
                )
            }
            htmladd += "</div>"
        }
        htmladd += "</div>"

        

        htmladd += "<div class='item_list'>"

        htmladd += (
            `<div class='item_s panel' ` +
            `data-part-id='${part.ID}' ` +
            `onclick='${clear_part_func_name}(this)'>`
        )
        htmladd += "<img src='icons/close.svg'/>"
        htmladd += "</div>"


        for (let j = 0; j < part.Items.length; j++) {
            const item = part.Items[j];
            const hasColorPicker = item.Variants.length > 1
            htmladd += `<div class='item_s panel ${( hasColorPicker ? "has-color-picker" : "")}' data-part-id='${part.ID}' data-item-id='${item.ItemID}' onclick='${update_selection_func_name}(this)'>`

            htmladd += `<img src='${item.ThumbnailUrl}'>`
            htmladd += "</div>"

        }
        htmladd += "</div>"
        htmladd += "</div>"
    }
    document.getElementById("htmladd").innerHTML=htmladd


    //set defaults
    for (let i = 0; i < parts_array.length; i++) {
        const part = parts_array[i];
        //let defaultURL = base_id + "/" + part.BaseDirectory + "/" + part.Items[0].BaseDirectory + "/" +  part.Items[0].VariantFilenames[0]
        //layer_selections[part.ID] = defaultURL
        //let zeroItemId = cf.zeroConf[part.ID+""].itmId
        const defaultItemId = provider.getItemDefaults()[part.ID+""]

        cur_state.layer_selections[part.ID+""] = {
            Visible: false,
            ItemID: part.Items[0].ItemID,
            //VariantID: part.Items[0].Variants[0].VariantID,
            //VariantColor: part.Items[0].Variants[0].VariantColor,
            //VariantColorID: part.Items[0].Variants[0].VariantColorID,
            VariantID: 0,
            VariantColor: 0,
            VariantColorID:0,

            Offset: [0, 0],
            Rotation: 0,
            Scale: 1
        }

        part.Items.forEach(item => {
            if(item.ItemID == defaultItemId){
                const default_variant_id = item.Variants[0]?.VariantID?? 0
                const default_variant_color = item.Variants[0]?.VariantColor?? 0

                const default_variant_color_id = item.Variants[0]?.VariantColorID?? 0
                cur_state.layer_selections[part.ID+""] = {
                    Visible: true,
                    ItemID: item.ItemID,
                    VariantID: default_variant_id,
                    VariantColor: default_variant_color,
                    VariantColorID: default_variant_color_id,
                    Offset: [0, 0],
                    Rotation: 0,
                    Scale: 1
                }
                //console.log(layer_selections[part.ID])
            }
        });
    }

    loadFromLocalStorage(cur_state)
    //loadFromLocalstorage()
    updateEverything(cur_state)
}

async function load_picrew_parts(directory){

    let processed_parts = []
    let processed_default_states = {};

    let cf_req = await fetch(directory + "/cf.json");
    let cf = await cf_req.json();
    console.log(cf)

    let img_req = await fetch(directory + "/img.json");
    let img = await img_req.json();
    console.log(img)


    let cf_parts = cf.pList;

    //check compat mode
    await checkCompatibility(cf_parts)
    

    for (let i = 0; i < cf_parts.length; i++) {
        const part_data = cf_parts[i];
        let name = part_data.pNm
        let id = part_data.pId
        
        
        let dirname = pad(i+compat_params.part_item_offset,4) + "-" + id + "-" + part_data.pNm
        if(compat_params.compat_no_names_in_path){
            dirname = pad(i+compat_params.part_item_offset,4) + "-" + id
        }
        
        let thumbnailFilename = part_data.thumbUrl ? part_data.thumbUrl.match(/p_.*\.(?:png|jpg)/)+"" : ""
        let partThumbnailUrl = directory + "/" + dirname + "/" + thumbnailFilename



        let coveredLayers = part_data.lyrs
        let colorProfiles = cf.cpList[part_data.cpId]

        let zeroItemId = cf.zeroConf[id+""].itmId
        processed_default_states[id+""] = zeroItemId

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

            let itemThumbnailFilename = item_data.thumbUrl ? item_data.thumbUrl.match(/ii_.*\.(?:png|jpg)/)+"" : "";
            let itemThumbnailUrl = directory + "/" + dirname + "/" + basedir + "/" + itemThumbnailFilename

            items.push({
                ItemID: variantId,
                BaseDirectory: basedir,
                //let thumbnailURL = typeof part_data.thumbUrl == 'undefined' ? part_data.thumbUrl.match(/p_.*\.(?:png|jpg)/)+"" : ""
                ThumbnailFilename: itemThumbnailFilename,
                ThumbnailUrl: itemThumbnailUrl,
                Variants: variants
            })
        }
        processed_parts.push({
            Name: name,
            BaseDirectory: dirname,
            ThumbnailFilename: thumbnailFilename,
            ThumbnailUrl: partThumbnailUrl,
            Name: name,
            ID: id,
            PartID: id,
            Items: items
        })
    }

    //parts = processed_parts
    //item_defaults = processed_default_states


    return new ImageMakerProvider(processed_parts,processed_default_states);
    

    return {
        parts: processed_parts,
        item_defaults: processed_default_states
    }
}


document.addEventListener("DOMContentLoaded", async () => {

    if(!base_id){
        document.body.classList.add("show-alert")
        document.body.classList.add("id-error")
        return
    }

    if(!compat_params.load_json){
        let provider = await load_picrew_parts(data_directory + base_id)

        state.provider = provider;
        window.provider = provider

        //state.parts = processed_data.parts
        //state.default_selection = processed_data.item_defaults

    } else {
        let processed_req = await fetch( data_directory + base_id + "/"+compat_params.load_json);
        processed = await processed_req.json();
        console.log(processed)
        parts = processed.Parts
        item_defaults = processed.ItemDefaults
        numLayers = processed.NumLayers
    }

    loadPicrew(state)

})

async function checkCompatibility(cf_parts) {
    
    const first_part = cf_parts[0]
    const first_item = first_part.items[0]
    const thumbnail_url = (first_item.thumbUrl ? first_item.thumbUrl.match(/\/[a-z]{1,2}_.+\.(?:png|jpg)/)+"" : "").replace("/","")
    console.log(thumbnail_url)
    let part_dir;
    let suggest_compat_old1 = false, suggest_compat_names_in_path = false;

    if(compat_params.compat_no_names_in_path){
        part_dir = pad(compat_params.part_item_offset,4) + '-' + first_part.pId;
    } else {
        part_dir = pad(compat_params.part_item_offset,4) + '-' + first_part.pId + "-" + first_part.pNm;
    }

    function testItemItemOffset(offset){}

    function loadImgTest(part_dir, item_dir,thumbnail_url){
        return new Promise((resolve) => {
            let img_url = data_directory + base_id + "/" + part_dir + "/" + item_dir + "/" + thumbnail_url
            //console.log(img_url)
            //alert("img_url")
            fetch(img_url).then(a=>{
                //alert(a.status)
                if(a.status == 404){
                    //alert("compat error") 
                    resolve(false)
                    
                }
                resolve(true)
            })
        })
        
    }


    //test offset
    let test_item_dir;
    //test offset 0
    test_item_dir = pad(0,4) + '-' + first_item.itmId;
    if(await loadImgTest(part_dir,test_item_dir,thumbnail_url)){
        suggest_compat_old1 = true;
        //alert("not passed old1 check")
        //alert("you should use old1 ")
    }

    test_item_dir = pad(1,4) + '-' + first_item.itmId;
    if(await loadImgTest(part_dir,test_item_dir,thumbnail_url)){
        suggest_compat_old1 = false;
        //alert("passed old1 check")
    }
    

    let submessage = document.getElementById("submessage_compat_alert");

    if(suggest_compat_old1 && !compat_params.using_old1){
        let subm = "";

        subm += "Recommended compatibility mode: old1"
        subm += "<br>"
        subm += `<a class="big-button apply-compat-button" href="${location+"&compat-mode=old1"}">Apply old1 mode</a>`
        submessage.innerHTML = subm;

        document.body.classList.add("show-alert")
        document.body.classList.add("compat-error")
    }


    if(suggest_compat_names_in_path || suggest_compat_old1){
        //document.body.classList.add("show-alert")
        //document.body.classList.add("compat-error")
    }

    
}

async function render(state){
    const canvas = document.getElementById("viewer")
    const ctx = canvas.getContext('2d')

    let src_state = state;
    const maker_provider = state.provider;

    let layers = [];

    let layers_scale = [];
    let layers_offset = [];
    let layers_rotation = [];
    for (let i = 0; i < numLayers; i++) {
        layers.push("") 
        layers_scale.push(1)
        layers_offset.push([0,0])
        layers_rotation.push(0)
    }

    

    const parts_array = provider.getParts()
    for (let i = 0; i < parts_array.length; i++) {
        const part = parts_array[i];
        const id = part.ID;
        const variantID = src_state.layer_selections[id+""];
        if(variantID == undefined || variantID.length == 0) continue;
        if(!variantID.Visible) continue;
        
        let item = part.Items.find(e => e.ItemID == variantID.ItemID)
        let vari = item.Variants.find(e => e.VariantID == variantID.VariantID)
        if(variantID.VariantColorID){
            vari = item.Variants.find(e => e.VariantColorID == variantID.VariantColorID) // variantID[2] is color
        }

        if(!vari) continue;

        vari.Layers.forEach(l => {
            console.log("AAAA",variantID)
            layers[l.zIndex] = data_directory + base_id + "/" + part.BaseDirectory + "/" + item.BaseDirectory + "/" + l.url
            if(variantID.Offset){
                layers_offset[l.zIndex] = variantID.Offset
            }
            
            layers_rotation[l.zIndex] = variantID.Rotation
            layers_scale[l.zIndex] = variantID.Scale
        })
        

        
    }
    console.log(layers)
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
       
    }

    /*
    Funny drawing
    */

    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, 900, 900);

    for (let i = 0; i < layers.length; i++) {
        const url = layers[i];
        if(url != "" && url){
            const offset = layers_offset[i] || [0,0]
            const rotation = layers_rotation[i]

            let image = document.getElementById(btoa(encodeURIComponent(url)))
                
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
            
        }
    }

}





function updateSelections(cur_state) {
    let item_selectors = document.querySelectorAll(".item_s")
    item_selectors.forEach(it => {
        const item_partId = it.dataset.partId+''
        if(cur_state.layer_selections[item_partId]){
            if(cur_state.layer_selections[item_partId].ItemID+"" == it.dataset.itemId && cur_state.layer_selections[item_partId].Visible){
                it.classList.add("selected_item")
            } else {
                it.classList.remove("selected_item")
            }
        }
    });

    let color_item_selectors = document.querySelectorAll(".color_selector_item")
    color_item_selectors.forEach(it => {
        const item_partId = it.dataset.partId+''
        if(cur_state.layer_selections[item_partId]){
            if(cur_state.layer_selections[item_partId].VariantColorID+"" == it.dataset.variantColorId && cur_state.layer_selections[item_partId].Visible){
                it.classList.add("color_selector_item_selected")
            } else {
                it.classList.remove("color_selector_item_selected")
            }
        }
    });




}

function updateEverything(state){
    render(state)
    updateSelections(state)
    updateTextarea(state)
    saveToLocalStorage(state)
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
    //updateEverything()
}

function loadFromLocalStorage(state) {
    if(localStorage.getItem(base_id+"-data")){
        let ls_data = localStorage.getItem(base_id+"-data")
        state.layer_selections = JSON.parse(ls_data)
    }
}
function saveToLocalStorage(cur_state) {
    localStorage.setItem(base_id+"-data",JSON.stringify(cur_state.layer_selections))
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
        //toggle_button.innerText = "+"
    } else {
        document.body.classList.remove("small-preview")
        //toggle_button.innerText = "-"
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

function showInfo() {
    document.body.classList.add("show-info-modal")
}

/*

Part
    - id
    - name
    - thumbnailURL
    - Items


*/