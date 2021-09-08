const canvas = document.getElementById ('canvas');
const context = canvas.getContext ('2d');
const clear = document.getElementById('clear-button')

let pe=null,moved=false
let usedColors=[],rectangles=[];

function calcPos(e,dbl=0){
    if(!pe && !dbl) return null
    let pos={}
    pos.w = e.pageX-(dbl===1?e.pageX:pe.pageX)
    pos.h = e.pageY-(dbl===1?e.pageY:pe.pageY)
    pos.x = e.offsetX-pos.w
    pos.y = e.offsetY-pos.h
    return pos
}

clear.addEventListener('click',(e)=>{
    context.clearRect(0,0,context.canvas.width,context.canvas.height)
    rectangles = []
    usedColors = []
    pe = null
    moved = false
})

function sanitize(){
    removeGuide()
    pe = null;
    moved = false
}

canvas.addEventListener('mousedown',(e)=>{
    pe = e;
    moved = false
})

canvas.addEventListener('mousemove',(e)=>{
    let pos = calcPos(e)
    if(pos && Math.abs(pos.w)>=2 && Math.abs(pos.h)>=2){
        moved = true
        createGuide(pos,checkForRect(pos))
    }else if(pos){
        moved = false
    }
})

canvas.addEventListener('mouseup',(e)=>{
    let pos = calcPos(e)
    if(!pos || !moved) return sanitize()
    if(Math.abs(pos.w)<2 || Math.abs(pos.h)<2) return sanitize()

    let id = checkForRect(pos)

    //check if already a rectangle at this place
    if(id!==-1)
        moveRect(id,pos)
    //else make new
    else
        addNewRect(pos)

    sanitize()
})

canvas.addEventListener('dblclick',(e)=>{
    let pos = calcPos(e,1)
    if(!pos || moved) return sanitize()

    //Find and delete
    let id = checkForRect(pos)
    if(id!==-1)
        deleteRectId(id)

    sanitize()
})

function addNewRect(pos){
    let col = getNewColor()
    context.fillStyle = `rgb(${col.r},${col.g},${col.b})`
    context.fillRect(pos.x,pos.y,pos.w,pos.h)
    rectangles.push({
        x:Math.min(pos.x,pos.x+pos.w),
        y:Math.min(pos.y,pos.y+pos.h),
        z:rectangles.length,
        w:Math.abs(pos.w),
        h:Math.abs(pos.h),
        vis:true,
        col
    })
}

function removeGuide(){
    clearAllAbove(-1)
    restoreAllAbove(-1)
}

function createGuide(pos,id=-1){
    clearAllAbove(-1)
    restoreAllAbove(-1)
    context.strokeStyle = `black`
    if(id===-1){
        context.strokeRect(pos.x,pos.y,pos.w,pos.h)
    }else{
        context.strokeRect(rectangles[id].x+pos.w,
            rectangles[id].y+pos.h,rectangles[id].w,rectangles[id].h)
    }
}

function getNewColor(){
    function randomRGB(){
        return {r:Math.floor(Math.random()*255),
                g:Math.floor(Math.random()*255),
                b:Math.floor(Math.random()*255)}
    }
    let col
    do{
        col = randomRGB()
    }while(usedColors.includes(col))
    usedColors.push(col)
    return col
}

function posInside(pos,rect){
    return pos.x>rect.x && pos.x<(rect.x+rect.w) 
        && pos.y>rect.y && pos.y<(rect.y+rect.h)
}

function checkForRect(pos){
    if(rectangles.length===0) return -1;
    let id=-1
    rectangles.forEach((r,i)=>{
        if(posInside(pos,r)){
            if(id==-1 || r.z > rectangles[id].z){
                id = i
            }
        }
    })
    return id
}

function deleteRectId(id){
    clearAllAbove(-1)
    rectangles.splice(id,1)
    restoreAllAbove(-1)
}

function moveRect(id,pos){
    clearAllAbove(-1)
    rectangles[id].x += pos.w
    rectangles[id].y += pos.h
    restoreAllAbove(-1)
}

function restoreRectId(id){
    context.fillStyle = `rgb(${rectangles[id].col.r},${rectangles[id].col.g},${rectangles[id].col.b})`
    context.fillRect(rectangles[id].x,rectangles[id].y,rectangles[id].w,rectangles[id].h)
    rectangles[id].vis = true
}

function clearRectId(id){
    context.clearRect(
        rectangles[id].x,
        rectangles[id].y,
        rectangles[id].w,
        rectangles[id].h
    )
    rectangles[id].vis = false
}

//clears all rect with rect.z > z
function clearAllAbove(z){
    if(z==-1){
        context.clearRect(0,0,context.canvas.width,context.canvas.height)
    }else{
        rectangles.forEach((v,i) => {
            if(v.z>z) clearRectId(i)
        })
    }
}

//restores all rect with rect.z > z
function restoreAllAbove(z){
    rectangles.forEach((v,i) => {
        if(v.z>z) restoreRectId(i)
    })
}