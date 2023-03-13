import { Application, Sprite, Assets, Container, Graphics, ParticleContainer } from './node_modules/pixi.js/dist/pixi.mjs';





// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new Application({width: window.innerWidth, height: window.innerHeight});

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

//view container
const view = new Container();
app.stage.addChild(view);
//view.position.set(0,0);
//previously using window.inner
view.width = 5000;
view.height = 5000;
view.interactive = true;
view.position.set(-2500,-2500);


//bakground mask
let mask = new Graphics();
mask.beginFill(0xffffff,1.00);
mask.drawRect(0,0,5000,5000);

view.addChild(mask);

//grid test contrainer 
//let testgrid = new Container();
let testgrid = new ParticleContainer(1000000);
testgrid.autoResize = true;


app.stage.addChild(testgrid);

//array of cell containers
let ind = 0;


let overlay_sample_template = new Graphics() 
    overlay_sample_template.beginFill(0x000000,0.5);
    overlay_sample_template.drawCircle(0,0,2,2);
    
//overlay

//populates a grid
function populateGrid() {
    //gap between boxes (must account for box size (75-50 = 25px gap))
    let gap = 7;

    for (let j = 0; j < 250; j++){
       for (let i = 0; i < 250; i++) {
           // cells.push(new Container());
            //cells[ind].addChild(Sprite.from("/img/square.png"));
            //cells[ind].position.set(i*gap,j*gap);
            testgrid.addChild(Sprite.from("/img/square.png"));
            
            testgrid.getChildAt(ind).position.set(i*gap,j*gap);
            
            ind++;
           
        }  
    }

    view.addChild(testgrid);
}

function testOpacities(){
    for (let i = 0; i < testgrid.children.length; i++) {
        let box = new Graphics();
        testgrid.getChildAt(i).alpha = (Math.random()*0.8)+0.2
        //console.log(testgrid.getChildAt(i).tint = 0xFFFFFF);
    }
}

//draws a path from one cell to another; needs to offset for box size 
function drawPath() {

}


function copyCell() {

}

populateGrid();

testOpacities();



//testing individual child movement
//testing individual childd movementtestgrid.getChildAt(8).x= 300;
//testgrid.position.set((app.screen.width/4)-75,(app.screen.height/4)-200);
testgrid.position.set(2500+500,2500)

// Listen for frame updates
let elapsed = 0;
let held = false;
//stores mosue position at every frame
let mPos = {x:0,y:0};

/**zoom in feature, fix camera cntering not wokring propely*/
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

/**zoom out: fix feature, zcamera centering not working properly  */
window.addEventListener("keydown", (e) => {
    if (e.code == "KeyO"){
        view.scale.x *=0.8;
        view.scale.y *= 0.8;
        view.x = view.x+700
        view.y = view.y+700
    }
});
//sets flag to true
view.on("mousedown", (e) => {
    held = true;
});

//sets flag to false
view.on("mouseup", (e) => {
    held = false;
});

//testing canvas movemement, sets location equal to previous location + difference between current frame and last frames mouse movement
view.on("mousemove", (e) => {
    if (held == true){
    view.position.set(view.x + e.x-mPos.x,view.y + e.y-mPos.y);
    }
               
});

app.stage.on("mousemove", (e) => {
    mPos.x = e.x;
    mPos.y = e.y;
});


function jitter() {
    for (let i = 0; i < ind; i ++) {
        let flipper = Math.random()
        if (flipper > 0.5) {
            testgrid.getChildAt(i).x += (Math.random()*0.5);
            testgrid.getChildAt(i).y += (Math.random()+0.5);    
        }
        else {
            testgrid.getChildAt(i).x -= (Math.random()*0.5);
            testgrid.getChildAt(i).y -= (Math.random()+0.5); 
        }
        
    } 
}
app.ticker.add((delta) => {

    // each frame we spin the bunny around a bit
  jitter()
  
    

});