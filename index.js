'use strict';
import { Application, Sprite, Assets, Container, Graphics, ParticleContainer, LineStyle, DisplayObject } from './node_modules/pixi.js/dist/pixi.mjs';


 
//-----initializing application and first view-----
const app = new Application({width: window.innerWidth, height: window.innerHeight});
document.body.appendChild(app.view);
const view = new Container();
//viewport of entire application (enables "camera " movement)
app.stage.addChild(view);
//bakground mask
let mask = new Graphics();
mask.beginFill(0xffffff,1.00);
mask.drawRect(0,0,5000,5000);
view.addChild(mask);
//-------------------------------------------------
//animation speed constant
const speed_element = document.querySelector('#speed-selector');
let speed = 1;

//cell width constant
const cell_width = 7;
const primary_color = 0xFFCE00;
const secondary_color = 0x00B4FF;
const red_color = 0xfc0303;

//makes sure animation doesn't start before data is complete
let ready_state = false;

const FIRST_ADRESS_DEBUG = 139806654861312;
const LAST_ADRESS_DEBUG = 139809875431424;
//represents cell addresses to be utilized during operations
const cell_map_base = new Map();
let cell_map = new Map();
cell_map = cell_map_base;
//stores all data in batches
const batches = [];
//stores translated cell adresses
const cell_addr = [];
let grid_1 = new Container();
let grid_2 = new Container();
let temp_grid = new Container();

//adjust positioning and initializes view of the project
function initializeView(){
    view.width = 5000;
    view.height = 5000;
    view.interactive = true;
    
}

//initialized grids can modularize later
//cell name used as an identifier for future use
function initializeGrids(size) {
    let gap = 7;
    let ind = 0;
    let offset = size*7+10
    for (let j = 0; j < size; j++){
       for (let i = 0; i < size; i++) {
            grid_1.addChild(new Container());
            grid_1.getChildAt(ind).name = ind;
            grid_1.getChildAt(ind).addChild(Sprite.from("/img/whiteCell.png"));
            grid_1.getChildAt(ind).getChildAt(0).tint = primary_color;
            grid_1.getChildAt(ind).getChildAt(0).alpha = 0.5;
            grid_1.getChildAt(ind).position.set(i*gap,j*gap);
            ind++; 
        }  
    }
    view.addChild(grid_1);

    ind = 0;
    for (let j = 0; j < size; j++){
        for (let i = 0; i < size; i++) {
             grid_2.addChild(new Container());
             grid_2.getChildAt(ind).name = ind;
             grid_2.getChildAt(ind).addChild(Sprite.from("/img/whiteCell.png"));
             grid_2.getChildAt(ind).getChildAt(0).tint = secondary_color;
             grid_2.getChildAt(ind).getChildAt(0).alpha = 0.5;
             grid_2.getChildAt(ind).position.set(i*gap+offset,j*gap);
             ind++;
         }  
     }
 
     view.addChild(grid_2);
     view.addChild(temp_grid);
     return ind;
}

//translates base adress and loads batch into cell_addr
function loadBatch(base_adress_array) {
    for (let i = 0; i < base_adress_array.length; i++) {
        cell_addr.push(cell_map.get(base_adress_array[i]))
    }
    //console.log(cell_addr);
}

function clearBatch(){
    for (let i = cell_addr.length-1; i >=0; i--) {
        cell_addr.pop();
    }
}
    //extracts steps from data
let content;
let file = document.getElementById('input')
file.addEventListener('change', () => {

    const fr = new FileReader();
   

    fr.readAsText(file.files[0]);

    fr.addEventListener('load', () => {
        content = fr.result;
        extractSteps();
        cleanBatches();
        //loadBatch(batches[0]);
    })

});

let base_addr;
let file2 = document.getElementById('input2')
file2.addEventListener('change', () => {

    const fr2 = new FileReader();

    fr2.readAsText(file2.files[0]);

    fr2.addEventListener('load', () => {
        base_addr = fr2.result;
        mapAdresses();
    });
});

function extractSteps() {
    let vals = [];
    let batch = -1;
    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let temp = lines[i].split(',');
        if (temp[0] === 's' ) {
            batch += 1;
            batches[batch] = [];
        }
        if (temp[0] === 'f' ) {
            batches[batch].push(hexToDec(temp[1]));
        }
    }

    //console.log('min: '+ Math.min(...vals)+' max: '+Math.max(...vals));
    //console.log(batches);
}

function cleanBatches() {
    for (let i = 0; i < batches.length; i++) {
        let temp = [];
        if (batches[i].length == 1) {
            temp.push((batches[i])[0]);
        } else {
            for (let j = 0; j < batches[i].length-1; j++) {
                if ((batches[i])[j] !== (batches[i])[j+1]) {
                temp.push((batches[i])[j]);
                }
            }
        }

        batches[i] = structuredClone(temp);
    }
    console.log(batches);
}

//normalizes batch based on a specific page size (in KB). thisversion treats only accessed pages as the entire virtual memory, ignoring pages that weren't accessed
function normalizeBatches(base_page_size, normalized_page_size) {
    let pages_per_batch = normalized_page_size/base_page_size;
    console.log("pages per batch ", pages_per_batch);
    let normalized_map = new Map();

    let new_page_number = -1;
    cell_map_base.forEach((value, key) => {
        //console.log(key," ",value);
        if (value % pages_per_batch == 0) {
        new_page_number+= 1;
        }
        normalized_map.set(key, new_page_number)

    });
    cell_map = structuredClone(normalized_map);
    console.log(normalized_map);
}

const hexToDec = (value) => parseInt(value, 16);
//selects target cells & highlights them

//mapsadresses,converting hex to dec
function mapAdresses() {
    let adresses = base_addr.split('\r\n');
    for (let i = 0; i < adresses.length; i++) { 
        cell_map_base.set(hexToDec(adresses[i]), i);
    }

    console.log(cell_map);
}

//generates paths
function generatePaths(cells) {
    for (let i = 0; i < cells.length; i++) {
        let path = new Graphics();
        path.name = 'path';
        path.beginFill(0x0000000,1.0);
        path.moveTo(grid_1.getChildAt(cells[i]).x+cell_width, grid_1.getChildAt(cells[i]).y+cell_width/4);
        path.lineStyle(1,0x00000,1.0,0.5,false);
        path.alpha = 0.5;
        path.lineTo(grid_2.getChildAt(cells[i]).x, grid_2.getChildAt(cells[i]).y+cell_width/4)
        view.addChild(path);

    }
}

function clearPaths() {
    for (let i = 0; i < view.children.length; i++)
    if (view.getChildAt(i).name == 'path') {
        view.removeChildAt(i);
    }

    
}
//moves data from one cell to the next
function moveCells(cells, speed) {
    //why is -1 needed here??????
    for (let i = 0; i < cells.length; i++) {
    
        temp_grid.getChildAt(i).x = temp_grid.getChildAt(i).x - 1*speed;    
    }
}


//updates the opacity after a move is complete
function updateOpacity(cells) {
    for (let i = 0; i < cells.length; i++) {
        grid_1.getChildAt(cells[i]).alpha *=  2;
        grid_2.getChildAt(cells[i]).alpha *=  2;
    }
}


function duplicateCells(cells) {
    for (let i = 0; i < cells.length; i++) {
        temp_grid.addChild(new Container());
        temp_grid.getChildAt(i).name = (grid_2.getChildAt(cells[i])).name;
        temp_grid.getChildAt(i).addChild(Sprite.from("/img/whiteCell.png"));
        temp_grid.getChildAt(i).getChildAt(0).tint = red_color;
        temp_grid.getChildAt(i).position.set(grid_2.getChildAt(cells[i]).x,grid_2.getChildAt(cells[i]).y);    
    }    
}

function clearTemp() {
    temp_grid.removeChildren();
}

//start button begins initialization
document.querySelector("#start").addEventListener('click', (e) => {
    normalizeBatches(4,2048);
    initializeView();
    let i = Array.from(cell_map.values()).pop();
    //let iprime = Math.ceil(Math.sqrt(i))
    //console.log(iprime);
    initializeGrids(Math.ceil(Math.sqrt(i)));
    ready_state = true;
    console.log(batches);
});


//view.x = ;
//view.y = ;

//-------------speed selection---------------------

speed_element.addEventListener('click', e => {
    //console.log(e.target.value);
    speed = e.target.value;
});






//--------------mosue and keyboard zoom and pan for ddebugging---------------------

let held = false;
//stores mosue position at every frame
let mPos = {x:0,y:0};

view.on("mousedown", (e) => {
    held = true;
});

view.on("mouseup", (e) => {
    held = false;
});

view.on("mousemove", (e) => {
    if (held == true){
        view.position.set(view.x + e.x-mPos.x,view.y + e.y-mPos.y);
    }
               
});

app.stage.on("mousemove", (e) => {
    mPos.x = e.x;
    mPos.y = e.y;
});

window.addEventListener ("keydown", (e) => {
    if (e.code == "Space"){
        let prewidth = view.width;
        view.scale.x *= 1.2;
        let postwidth = view.width;

        let preheight = view.height;
        view.scale.y *= 1.2;  
        let postheight = view.height;   

        view.x = view.x*1.22
        view.y = view.y*1.22  
    }          
});

window.addEventListener("keydown", (e) => {
    if (e.code == "KeyO"){
        view.scale.x *=0.87;
        view.scale.y *= 0.87;
        view.x = view.x+700
        view.y = view.y+700
    }
});

//---------------------------------------------------


//app loop
let lock = false;
let batch_number = 0;

app.ticker.add((delta) => {
    //iincludes moving and deleting of object, also need to update3 and pack into one mfunction
    if (ready_state){
        if (lock === false) {
            //console.log(batch_number);
        
            loadBatch(batches[batch_number]);
            clearPaths();
            
            console.log(cell_addr);
            generatePaths(cell_addr);
            duplicateCells(cell_addr);
            lock = true;
        }
        
        if (temp_grid.children.length != 0) {

            if ((temp_grid.getChildAt(0).x - grid_1.getChildAt(Number(temp_grid.getChildAt(0).name)).x > -1)){
                    moveCells(cell_addr, speed);    
                } else {
                    updateOpacity(cell_addr);
                    clearPaths();
                    temp_grid.removeChildren();
                    clearBatch();
                    batch_number += 1
                    lock = false;
                }
        }
          
    }
   
    
});