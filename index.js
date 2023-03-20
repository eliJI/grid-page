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

//cell width constant
const cell_width = 7;
const primary_color = 0xFFCE00;
const secondary_color = 0x00B4FF;
const red_color = 0xfc0303;

//makes sure animation doesn't start before data is complete
let readyState = false;

//represents cell addresses to be utilized during operations
const cell_map = new Map();
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
             grid_2.getChildAt(ind).position.set(i*gap+1500,j*gap);
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
    console.log(batches);
    readyState = true;
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

const hexToDec = (value) => parseInt(value, 16);
//selects target cells & highlights them

function mapAdresses() {
    let adresses = base_addr.split('\r\n');
    for (let i = 0; i < adresses.length; i++) { 
        cell_map.set(hexToDec(adresses[i]), i);
    }

    console.log(cell_map);
}

function selectPrimaryTargets(cells) {
    for (let i = 0; i < cells.length; i++) {
        grid_1.getChildAt(cell_addr[i]).getChildAt(0).tint = red_color;
    }

}

function selectSecondaryTargets(cells) {
    for (let i = 0; i < cells.length; i++) {
        grid_2.getChildAt(cell_addr[i]).getChildAt(0).tint = red_color;
    }
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
let done = false;
function moveCells(cells) {
    //why is -1 needed here??????
    for (let i = 0; i < cells.length; i++) {
    
        temp_grid.getChildAt(i).x = temp_grid.getChildAt(i).x - 200;    
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

initializeView();
let ind = initializeGrids(200);

//view.x = ;
//view.y = ;








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
    if (readyState){
        if (lock === false) {
            console.log(batch_number);
            loadBatch(batches[batch_number]);
            clearPaths();
            generatePaths(cell_addr);
            duplicateCells(cell_addr);
            lock = true;
        }
        if (temp_grid.children.length != 0) {

            if ((temp_grid.getChildAt(0).x - grid_1.getChildAt(Number(temp_grid.getChildAt(0).name)).x > -1)){
                    moveCells(cell_addr);    
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