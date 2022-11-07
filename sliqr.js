var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();
createHiDPICanvas = function(w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}

document.body.style="margin:0;padding:0";
let startB = document.createElement("button")
startB.innerHTML = "START PRESENTATION"
document.body.appendChild(startB)
startB.style="width:100%;height:100%;z-index:-1";
let slqr, width, height, container;
// RECORD
let stream, recordedChunks=[], mediaRecorder, RECORD = false

startB.onclick=()=>{
    document.body.requestFullscreen().then(function(){
    let canvas = createHiDPICanvas(document.body.clientWidth,document.body.clientHeight);
    document.body.appendChild(canvas);
    width = document.body.clientWidth;
    height = document.body.clientHeight;
    slqr = canvas.getContext("2d");

    container = document.createElement("div");
    container.style = "width:100%;height:100%;position:absolute;left:0px;top:0px;";
    document.body.appendChild(container);

    // RECORD


    function handleDataAvailable(event) {
        //console.log("data-available");
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          console.log(recordedChunks);
          download_vid();
        } else {
          // …
        }
      }
      function download_vid() {
        const blob = new Blob(recordedChunks, {
          type: "video/webm"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = "test.webm";
        a.click();
        window.URL.revokeObjectURL(url);
      }
      



    if(RECORD){
        stream = canvas.captureStream(25);

        let options = { mimeType: "video/webm; codecs=vp9" };
        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start();
    }

    // ============================

    startB.remove();
    present();
    setInterval(()=>{
        update();
        },20)
    document.addEventListener('keydown', (event) => {
        if([32,39,40,13].includes(event.keyCode)){
            play_next()
        }
        else if(85==event.keyCode){
            update();
        }
    });
    });



}

function value(vals){
    if(vals instanceof Var){
        return vals.val;
    }
    else if(!Array.isArray(vals)){
        return vals;
    }
    let output = [];
    for(var n of vals){
        if(n instanceof Var){
            output.push(n.val);
        }
        else{
            output.push(n);
        }
    }
    return output
}

/**
 * Every changable attribute of Elements in slqr are of the type Var in order to allow animations
 * @class
 */
class Var{
    /**
     * Sets the value of the Var
     * @param {number} value 
     */
    constructor(value){
        /**
         * the value of the Var
         */
        this.val = value;
    }
    renew(){

    }
}

/**
 * represents color in an RGBA-format
 * @class
 */
class Color extends Var{
    /**
     * 
     * @param {number} r - red-value 0-255
     * @param {number} g - green-value 0-255 
     * @param {number} b - blue-value 0-255
     * @param {number} [a=1] - alpha-value 0-1
     */
    constructor(r,g,b,a=1){
        super();
        this.r = new Var(r);
        this.g = new Var(g);
        this.b = new Var(b);
        this.a = new Var(a);
        this.val = "";
        this.renew();
    }
    renew(){
        this.val = "rgba("+value(this.r)+","+value(this.g)+","+value(this.b)+","+value(this.a)+")";
    }
}

class SubCanvas{
    constructor(init,loop){
        this.init = ()=>{init(this);add(this);}
        this.loop = ()=>{loop(this);}
        this.stop = ()=>{stop(this);this.del();}
        this.color = colcopy(AWHITE);
    }
    del(){
        for(var key in this){
            //console.log(key)
            if (this[key] instanceof Element){
                clear(0.5,elements.filter(item=>item!=this[key]))
            }
        }
        elements = elements.filter(item=>item!=this);
    }
    display(){
        this.loop();
    }
}

function StartSubCanvas(sc){
    Play([sc.init,[]]);
}
function StopSubCanvas(sc){
    Play([sc.stop,[]]);
}

//-----------------------------------------------------------------

let lock = 0;

/**
 * Used to define custom animations that might use different JS frameworks or methods
 * @param {Function} func - the function that is called when the animation is played
 */
function Custom(func){
    return [func,[null]]
}

function animate(a,b,d,pause=0,func=()=>{}){
    // f(x) = x-x^2
    // F(x) = x^2/2 - x^3/3
    setTimeout(()=>{
    let steps = [];
    let n = 6*(a.val-b)/(d**3)
    F = (x)=>{return n*x**3/3 - n*d*x**2/2;}
    for(var i=0;i<d*40;i++){
        steps.push(
          F(i/40+0.025)-F(i/40)
        );
    }
    steps.push(b);
    let counter = 0;
    let run = function(){
        a.val+=steps[counter];
        func();
        counter++;
        if(counter==steps.length-1){
            a.val = steps[counter];
            update();
            clearInterval(runner);
            lock--;
        }
    }
    let runner;
    lock++;
    runner = setInterval(run,25)},pause*1000);
}

/** @module Animations **/

/**
* Used to animate a given Var a from its current value to a value b
* @memberof module:Animations
* @param {Var} a - variable that is to be animated
* @param {number} b - the value that a should have at the end of the animation
* @param {number} d - duration of the animation in seconds
* @param {number} [pause=0] - time in seconds before the animation begins
* @example
* let text = new Text(0.5,0.5,'example')
* Play(Animate(text.x,0,1,0.5));
*/
function Animate(a,b,d,pause=0){
    return [animate,[a,b,d,pause]];
}

function Wait(time){
    return [()=>{animate(new Var(1),1,time)},[]];
}

function drawto(element,x,y,time,pause){
    animate(element.x2,x,time,pause);
    animate(element.y2,y,time,pause);
}


/**
 * changes the end coordinates of a line
 * @memberof module:Animations
 * @param {Line} element - line to be animated
 * @param {number} x - x-coordinate
 * @param {number} y - y coordinate
 * @param {number} time - duration of animation
 * @param {number} [pause=0] - time before animation starts
 */
function DrawTo(element,x,y,time=1,pause=0){
    return [drawto,[element,x,y,time,pause]];
}

function fadein(element,time,pause=0){
    animate(element.color.a,1,time,pause);
}

function select(element,time,type=0,pause=0){
    let x1,y1,x2,y2;
    [x1,x2,y1,y2] = value([element.x1,element.x2,element.y1,element.y2]);
    let line1 = new Line(x1,y1,x1,y1,colcopy(WHITE));
    let line2 = new Line(x2,y1,x2,y1,colcopy(WHITE));
    let line3 = new Line(x2,y2,x2,y2,colcopy(WHITE));
    let line4 = new Line(x1,y2,x1,y2,colcopy(WHITE));
    let t = time/4;
    setTimeout(()=>{
        add(line1,line2,line3,line4);
        if(type == 0){
            drawto(line1,x2,y1,t,0*t);
            drawto(line2,x2,y2,t,0.9*t);
            drawto(line3,x1,y2,t,1.8*t);
            drawto(line4,x1,y1,t,2.7*t);
        }
        else{
            drawto(line1,x2,y1,2*t,0*t);
            line2.x1.val = line1.x1.val;
            line2.x2.val = line1.x1.val;
            drawto(line2,x1,y2,2*t,0*t);
            line3.y1.val = line1.y1.val;
            line3.y2.val = line1.y1.val;
            drawto(line3,x2,y2,2*t,1.5*t);
            drawto(line4,x2,y2,2*t,1.5*t);
        }
        setTimeout(()=>{
            elements = elements.filter(item => ![line1,line2,line3,line4].includes(item));
            element.color.a.val = 1;
        },4*t*1000);
        // TODO
    },1000*pause);
}

function Select(element,time,pause=0){
    return [select, [element,time,pause]]; 
}


/**
 * fades in an element by increasing its alpha-value to 1
 * @memberof Animations
 * @param {Element} element - element to be animated
 * @param {number} time - duration of animation
 * @param {number} [pause=0] - time before animation starts
 */
function FadeIn(element,time=1,pause=0){
    return [fadein,[element,time,pause]];
}

function fadeout(element,time=1,pause=0){
    animate(element.color.a,0,time,pause);
}

/**
 * fades out an element by reducing alpha-value
 * @memberof module:Animations
 * @param {Element} element - element to be animated
 * @param {number} time - duration of animation
 * @param {number} [pause=0] - time before animation starts
 */
function FadeOut(element,time=1,pause=0){
    return [fadeout,[element,time,pause]];
}

function moveto(element,x,y,time=1,pause=0){
    animate(element.x,x,time,pause);
    animate(element.y,y,time,pause);
}

/**
 * moves an element to a different coordinate
 * @memberof module:Animations
 * @param {Element} element - element to be animated
 * @param {number} x - x-coordinate of destination
 * @param {number} y - y-coordinate of destination
 * @param {number} time - duration of animation
 * @param {number} [pause=0] - time before animation starts
 */
function MoveTo(element,x,y,time,pause=0){
    return [moveto,[element,x,y,time,pause]];
}

function playsound(speaker){
    speaker.play();
}

function PlaySound(src){
    return [playsound, [new Audio(src)]];
}

function clear(time,excepts=[]){
    function containsObject(obj, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return true;
            }
        }
        return false;
    }
    for(let elem of elements){
        if(!containsObject(elem,excepts)){
            animate(elem.color.a,0,time);
            if(elem instanceof Slider){
                animate(elem.basecolor.a,0,time);
            }
            if(elem instanceof Picture || elem instanceof Snippet){
                animate(elem.percentage,0,time);
            }
            if(elem instanceof IFrame || elem instanceof Snippet){
                setTimeout(()=>{elem.html.remove();},time*1000);
            }
        }
    }
    setTimeout(()=>{elements = [...excepts];},time*1000)
}

function Clear(time,excepts){
    return [clear,[time,excepts]];
}

function write(txt,step=1){
    if(txt instanceof Equation){
        writeeq(txt,step);
        return;
    }
    if(txt instanceof TextArea){
        for(let tx in txt.texts){
            setTimeout(()=>{write(txt.texts[tx],step)},step/3*tx*1000);
        }
        return;
    }
    lock++;
    let x,y,text,color,size,align,font;
    [x,y,text,size,color,align,font] = value([txt.x,txt.y,txt.text,txt.size,txt.color,txt.align,txt.font]);
    color = txt.color;
    let X;
    slqr.fillStyle = value(color);
    slqr.lineWidth = 1;
    slqr.font = size + "vh " + font;
    slqr.textAlign = align;
    if(align == "left"){
        X = x*width;
    }
    else if(align == "center"){
        X = x*width - slqr.measureText(text).width/2;
    }
    //alert(text)
    let chars1 = [];
    for(let i=0;i<text.length;i++){
        chars1.push(new Text((X+slqr.measureText(text.slice(0,i+1)).width-slqr.measureText(text.slice(i,i+1)).width)/width,y,text[i],size,new Color(color.r.val,color.g.val,color.b.val,0),"left",font));
        //chars1.push(new Text((X)/width,y,text[i],size,new Color(color.r.val,color.g.val,color.b.val,0),"left",font));
        //chars1.push(new Circle((X+slqr.measureText(text.slice(0,i+1)).width-slqr.measureText(text.slice(i,i+1)).width)/width, 0.2, 0.05, colcopy(WHITE)));
        chars1[i].func = "stroke";
    }
    let chars2 = [];
    for(let i=0;i<text.length;i++){
        chars2.push(new Text((X+slqr.measureText(text.slice(0,i+1)).width-slqr.measureText(text.slice(i,i+1)).width)/width,y,text[i],size,new Color(color.r.val,color.g.val,color.b.val,0),"left",font));
    }
    for(let char in chars1){
        add(chars1[char]);
        animate(chars1[char].color.a,1,step,step/10*char);
        animate(chars1[char].color.a,0,step,step*3);
    }
    for(let char in chars2){
        add(chars2[char]);
        animate(chars2[char].color.a,1,step,step/10*3 + step/10*char);
    }
    setTimeout(()=>{
        for(char of chars1.concat(chars2)){
            elements = elements.filter(item=>item!=char);
        }
        txt.color.a.val = 1;
        update();
        lock--;
    },step*1000+chars1.length*step/10*1000+step*2*1000);
}
function Write(txt,step=1){
    return [write,[txt,step]];
}

function writeeq(equation,time=1){
    lock++;
    let stroker = new Picture(equation.x.val,equation.y.val,"",equation.size.val,0);
    stroker.img = equation.img2;
    add(stroker);
    //console.log(stroker);
    animate(stroker.percentage,1,0.9*time);
    equation.transparency = 0;
    setTimeout(()=>{animate(equation.percentage,1,0.9*time); animate(equation.transparency,1,0.9*time)},0.2*time*1000);
    setTimeout(()=>{elements = elements.filter(item=>item!=stroker);},1.2*time*1000);
    lock--;
}

function WriteEq(equation,time){
    return [writeeq,[equation,time]]
}

function morphText(txt,newtxt,time){
    lock++;
    let x,y,text,color,size,align,font;
    [x,y,text,size,align,font] = value([txt.x,txt.y,txt.text,txt.size,txt.align,txt.font]);
    color = txt.color;
    slqr.font = size + "vh " + font;
    let w = slqr.measureText(text).width;
    let X = x*width - w/2;
    let chars1 = [];
    for(let i=0;i<text.length;i++){
        chars1.push(new Text((X+slqr.measureText(text.slice(0,i+1)).width-slqr.measureText(text.slice(i,i+1)).width)/width,y,text[i],new Color(color.r.val,color.g.val,color.b.val,1),size,"left",font));
        add(chars1[chars1.length-1]);
    }
    for(let ch of chars1){
        setTimeout(()=>{
            elements = elements.filter(item=>item!=ch);
            update();
    },time*1000);}
    w = slqr.measureText(newtxt).width;
    X = x*width - w/2;
    for(let i=0;i<newtxt.length;i++){
        let found = false;
        for(ch of chars1){
            if(ch.text.val == newtxt[i] && !found){
                chars1 = chars1.filter(item=>item!=ch);
                animate(ch.x,(X+slqr.measureText(newtxt.slice(0,i+1)).width-slqr.measureText(newtxt.slice(i,i+1)).width)/width,time);
                found = true;
            }
        }
        if(!found){
            let t = new Text((X+slqr.measureText(newtxt.slice(0,i+1)).width-slqr.measureText(newtxt.slice(i,i+1)).width)/width,y,newtxt[i],new Color(color.r.val,color.g.val,color.b.val,0),size,"left",font)
            add(t);
            setTimeout(()=>{write(t,time/2);},time/4*1000);
            setTimeout(()=>{elements = elements.filter(item=>item!=t);},time*1000)
        }
    }
    for(let ch of chars1){
        animate(ch.color.a,0,time/2);
    }
    elements = elements.filter(item=>item!=txt);
    setTimeout(()=>{
        txt.text.val = newtxt;
        add(txt);
        lock--;
    },time*1000)
}

function MorphText(txt,newtxt,time){
    return [morphText,[txt,newtxt,time]];
}

function morphColor(element,color,time,pause){
    animate(element.color.r, color[0],time,pause);
    animate(element.color.g, color[1],time,pause);
    animate(element.color.b, color[2],time,pause);
    if(color.length==4){
        animate(element.color.a, color[3],time,pause);
    }
}

function MorphColor(element,color,time=1,pause=0){
    return [morphColor,[element,color,time,pause]];
}

//-------------------------------------------------------------------------------------------

/**
 * Every rendered object like shapes or text are Elements
 * @class
 */
class Element{
    constructor(){

    }
    center(){
        if(this.x instanceof Var){
            this.x.val -= value(this.w)/2;
        }else{ this.x -= value(this.w/2); }
        if(this.y instanceof Var){
            this.y.val -= value(this.h)/2;
        }else{ this.y -= value(this.h/2); }
    }
}

class Rect extends Element{
    constructor(x,y,w,h,color){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.w = new Var(w);
        this.h = new Var(h);
        this.color = color;
    }
    display(){
        let x,y,w,h,color;
        [x,y,w,h,color] = value([this.x,this.y,this.w,this.h,this.color]);
        rect(x*width,y*height,w*width,h*height,color);
    }
}

class Selector extends Element{
    constructor(x1,y1,x2,y2,color,width=1){
        super();
        this.x1 = new Var(x1);
        this.y1 = new Var(y1);
        this.x2 = new Var(x2);
        this.y2 = new Var(y2);
        this.swidth = new Var(width);
        this.color = color;
    }
    display(){
        let x1,x2,y1,y2,swidth,color;
        [x1,x2,y1,y2,swidth,color] = value([this.x1,this.x2,this.y1,this.y2,this.swidth,this.color]);
        let x,y,w,h;
        [x,y] = [x1,y1];
        [w,h] = [x2 - x1 , y2 - y1]
        rect(x*width,y*height,w*width,h*height,color,false);
    }
}

class Square extends Rect{
    constructor(x,y,w,h,color){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.w = new Var(w/width*height);
        this.h = new Var(h);
        this.color = color;
    }
}

class Picture extends Element{
    constructor(x,y,src,size=0.5,percentage=1,keepratio=true){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.size = new Var(size);
        this.img = new Image();
        this.img.src = src;
        this.color = AWHITE;
        this.percentage = new Var(percentage);
        this.transparency = new Var(1);
    }
    display(){
        let x,y,size,img,percentage;
        [x,y,size,img,percentage] = value([this.x,this.y,this.size,this.img,this.percentage]);
        //slqr.globalAlpha = this.transparency.val;
        slqr.drawImage(img,0,0,percentage*img.width,img.height,x*width-size*img.width/img.height*height/2,y*height-size*height/2,percentage*size*img.width/img.height*height,size*height)
        ///slqr.globalAlpha = 0;
        //slqr.drawImage(img,0,0,percentage*img.width,img.height,x*width-percentage*size*img.width/img.height*height/2,y*height-size*height/2,percentage*size*img.width/img.height*height,size*height)
        //slqr.drawImage(img,0,0,width,height)
    }
}

const latexToImg = function (formula) {
    //console.log("test")
      let wrapper = MathJax.tex2svg(`${formula}`, {em: 10, ex: 5,display: true});
      //console.log("test2");
      let output = { svg: "", svg2: "" }
      let mjOut = wrapper.getElementsByTagName("svg")[0]
      for(var element of mjOut.querySelectorAll("path,rect")){
        element.style.strokeWidth = "0";
      }
      output.svg = mjOut.outerHTML;
      for(var element of mjOut.querySelectorAll("path,rect")){
        element.style.fill = "transparent";
        element.style.strokeWidth = "10";
      }
      output.svg2 = mjOut.outerHTML;
      var image = new Image()
      image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(output.svg)));
      var image2 = new Image()
      image2.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(output.svg2)));
      return [image,image2];
}

class Equation extends Picture{
    constructor(x,y,tex,size=0.1,percentage=1,color="white"){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        [this.img,this.img2] = latexToImg("\\color{"+color+"} "+tex);
        this.size = new Var(size);
        this.percentage = new Var(percentage);
        this.tcolor = new Var(color);
        this.prevcolor = new Var(color);
        this.tex = new Var(tex);
        this.prevtex = new Var(tex);
        this.color = AWHITE;
        this.transparency = new Var(1);
        this.vars = [this.x,this.y,this.tex,this.size,this.tcolor];
    }
    display(){
        let x,y,size,img,percentage;
        if(this.tcolor.val!=this.prevcolor.val || this.tex.val!=this.prevtex.val){
            [this.img,this.img2] = latexToImg("\\color{"+this.tcolor.val+"} "+this.tex.val);
            this.prevcolor.val = this.tcolor.val;this.prevtex.val = this.tex.val;
        }
        [x,y,size,img,percentage] = value([this.x,this.y,this.size,this.img,this.percentage]);
        slqr.drawImage(img,0,0,percentage*img.width,img.height,x*width-size*img.width/img.height*height/2,y*height-size*height/2,percentage*size*img.width/img.height*height,size*height)
        
    }
}

class Snippet extends Picture{
    constructor(x,y,language,code,size,percentage=1,lines=true){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.size = new Var(size);
        this.percentage = new Var(percentage);
        this.img = new Image();

        let wrap = document.createElement("pre");
        let snip = document.createElement("code");
        this.html = document.createElement("div");
        snip.innerHTML = code;
        this.html.style.display = "inline-block";
        this.html.style.position = "absolute";
        wrap.appendChild(snip);
        this.html.appendChild(wrap);
        snip.className = "language-"+language;
        wrap.className = lines?"line-numbers":"no-line-numbers";
        this.color = colcopy(AWHITE);
        this.display();
    }
    display(){
        this.html.style.left = this.x.val*width;
        this.html.style.top = this.y.val*height;
        this.html.style.fontSize = this.size.val+"vh";
        if(this.size==0){this.html.style.display = "none";}
        else{this.html.style.display = "";}
    }
}

class Slider extends Element{
    constructor(x,y,w,h,color=new Color(150,150,150,1),percentage=0,interval=1){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.w = new Var(w);
        this.h = new Var(h);
        this.percentage = new Var(percentage);
        this.interval = new Var(interval)
        this.color = color;
        this.basecolor = new Color(255,255,255,1);
    }
    display(){
        let x,y,w,h,percentage,color,interval;
        let sliderh,sliderw;
        [x,y,w,h,color,percentage,interval] = value([this.x,this.y,this.w,this.h,this.color,this.percentage,this.interval]);
        sliderw = w*4
        sliderh = h/8;
        rect(x*width-w*width/2,y*height-h*height/2,w*width,h*height,this.basecolor.val);
        rect(x*width-sliderw*width/2,y*height+h*height/2-sliderh*height-(7/8*h*height)*percentage/interval,sliderw*width,sliderh*height,color);
    }
}

class Ellipse extends Element{
    constructor(x,y,r1,r2,color){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.r1 = new Var(r1);
        this.r2 = new Var(r2);
        this.w = 2*value(this.r1);
        this.h = 2*value(this.r2);
        this.color = color;
    }
    display(){
        let x,y,r1,r2,color;
        [x,y,r1,r2,color] = value([this.x,this.y,this.r1,this.r2,this.color]);
        ellipse(x*width,y*height,r1*width,r2*height,color);
    }
}

class Circle extends Ellipse{
    constructor(x,y,r,color){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.r1 = new Var(r/width*height);
        this.r2 = new Var(r);
        this.w = 2*value(this.r1);
        this.h = 2*value(this.r2);
        this.color = color;
    }
}
/**
 * @class
 */
class Line extends Element{
    /**
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     * @param {Color} color
     * @augments Element
     */
    constructor(x1,y1,x2,y2,color){
        super()
        this.x1 = new Var(x1);
        this.y1 = new Var(y1);
        this.x2 = new Var(x2);
        this.y2 = new Var(y2);
        this.color = color;
    }
    display(){
        let x1,y1,x2,y2,color;
        [x1,y1,x2,y2,color] = value([this.x1,this.y1,this.x2,this.y2,this.color]);
        line(x1*width,y1*height,x2*width,y2*height,color);
    }
}

class IFrame extends Element{
    constructor(x,y,width,height,link){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.width = new Var(width);
        this.height = new Var(height);
        this.color = AWHITE;
        this.html = document.createElement("iframe");
        this.html.src = link;
        this.html.style.position = "absolute";
        this.display();
    }
    display(){
        this.html.width = this.width.val*width;
        this.html.height = this.height.val*height;
        this.html.style.left = this.x.val*width;
        this.html.style.top = this.y.val*height;
    }
}

// class Chart extends Element{
//     constructor(x,y,width,height,values=[],color=colcopy(WHITE)){
//         super();
//         this.x = new Var(x);
//         this.y = new Var(y);
//         this.width = new Var(width);
//         this.height = new Var(height);
//         this.values = values.map((el)=>{new Var(el)});
//         this.color = color;
//         this.higher;this.lower;
//     }
//     display(){
//         let x,y,w,h,color;
//         [x,y,w,h,color] = value([this.x,this.y,this.width,this.height,this.color]);
//         line(x*width, y*height, (x+w)*width, y*height, color);
//         line(x*width, y*height, x*width, (y-h)*height, color);

//         let higher, lower, step;
//         step = 5*10**(Math.floor(Math.log10(Math.abs(Math.max(this.values))))-1);
//         if(Math.max(this.values)>=0){
//             higher = step*Math.ceil(Math.abs(Math.max(this.values)/step));
//         }
//         else{
//             higher = -step*Math.ceil(Math.abs(Math.max(this.values)/step));
//         }

//         lower = step*Math.ceil(Math.abs(Math.min(this.values)/step));

//         this.displayVals();
//     }
//     displayVals(){}
// }

// class BarChart extends Chart{
//     constructor(x,y,width,height,values=[],color=colcopy(WHITE)){
//         super(x,y,width,height,values,color);
//     }
//     displayVals(){

//     }
// }

// class LineChart extends Chart{
    
// }

class Text extends Element{
    constructor(x,y,text,size=8,color,align="center",font="Computer Modern Serif"){
        super();
        this.x = new Var(x);
        this.y = new Var(y);
        this.text = new Var(text);
        this.size = new Var(size);
        this.color = color;
        this.align = new Var(align);
        this.font = new Var(font);
        this.func = "fill";
    }
    display(){
        let x,y,text,color,size,align,font;
        [x,y,text,color,size,align,font] = value([this.x,this.y,this.text,this.color,this.size,this.align,this.font]);
        textbox(x,y,text,color,size,align,font,this.func)
    }
    vcenter(){
        // slqr.font = this.size + "vh " + this.font;
        // slqr.textAlign = this.align;
    }
}

class TextArea extends Element{
    constructor(texts,align="top"){
        super();
        this.color = colcopy(BLACK);
        this.texts = texts;
        for(var txt in texts){
            if(txt>0){
                slqr.font = texts[txt-1].size.val+"vh "+texts[txt-1].font.val;
                let m1 = slqr.measureText(texts[txt-1].text);
                slqr.font = texts[txt].size.val+"vh "+texts[txt].font.val;
                let m2 = slqr.measureText(texts[txt].text);
                texts[txt].y.val = texts[txt-1].y.val + (m1.actualBoundingBoxAscent/2 + m1.actualBoundingBoxDescent + m2.actualBoundingBoxAscent + m2.actualBoundingBoxDescent)/width;                ;
            }
        }
    }
    display(){

    }
}

class CheckList extends Element{
    constructor(texts,numbered=false){
        super();
        this.color = colcopy(BLACK);
    }

    display(){
        
    }

}


//------------------------------------------

function colcopy(color){
    return new Color(color.r.val,color.g.val,color.b.val,color.a.val);
}

const WHITE = new Color(255,255,255,1)
const AWHITE = new Color(255,255,255,0);
const BLACK = new Color(0,0,0,1);
const ABLACK = new Color(0,0,0,0);

function rect(x,y,w,h,color, fill=true){
    slqr.beginPath();
    if(fill){
        //slqr.lineWidth = 15;
        slqr.fillStyle = value(color);
        slqr.fillRect(parseInt(x), parseInt(y), parseInt(w), parseInt(h));
    }
    else{
        slqr.strokeStyle = value(color);
        slqr.strokeRect(parseInt(x), parseInt(y), parseInt(w), parseInt(h));
    }
}

function ellipse(x,y,r1,r2,color){
    slqr.fillStyle = value(color);
    slqr.beginPath();
    slqr.ellipse(x, y, r1, r2, 0, 0, 2 * Math.PI);
    slqr.fill();
}

function textbox(x,y,text,color,size,align,font,func){
    slqr.fillStyle = value(color);
    slqr.lineWidth = 1;
    slqr.textBaseline = 'middle';
    if(func=="stroke"){slqr.strokeStyle = slqr.fillStyle;}
    else{slqr.strokeStyle = "rgba(0,0,0,0)";}
    slqr.font = size+"vh "+font;
    slqr.textAlign = align;
    if(func=="fill"){
        slqr.fillText(text,x*width,y*height);
    }
    else{
        slqr.strokeText(text,x*width,y*height);
    }
}

function line(x1,y1,x2,y2,color){
    slqr.beginPath();
    slqr.strokeStyle = color;
    slqr.lineWidth = 3;
    slqr.moveTo(x1, y1);
    slqr.lineTo(x2, y2);
    slqr.stroke();
}

//-------------------------------------------

let elements = [];
let commands = [];
function add(){
    //console.log(args)
    for(var elem of arguments){
        elements.push(elem);
    }
    //play_next();
}
function f_add(args){
    //console.log(args)
    for(var elem of args){
        elements.push(elem);
        if(elem instanceof IFrame){
            container.appendChild(elem.html);
        }
        else if(elem instanceof Snippet){
            container.appendChild(elem.html);
            Prism.highlightAll();
        }
    }
    play_next();
}
function f_Add(args){
    return [f_add,[args]];
}
function Add(){
    Play(f_Add(Array.from(arguments)));
}
  
//latex = latexToImg("(a+b)^2");

function update(){
    for(elem of elements){
        //console.log(elem)
        elem.color.renew();
        if(elem instanceof Slider){
            elem.basecolor.renew();
        }
    }
    rect(0,0,width,height,BLACK);
    //slqr.drawImage(latex,0,0,800,500);
    //var path = new Path2D("M 151.34904,307.20455 L 264.34904,307.20455 C 264.34904,291.14096 263.2021,287.95455 236.59904,287.95455 C 240.84904,275.20455 258.12424,244.35808 267.72404,244.35808 C 276.21707,244.35808 286.34904,244.82592 286.34904,264.20455 C 286.34904,286.20455 323.37171,321.67547 332.34904,307.20455 C 345.72769,285.63897 309.34904,292.21514 309.34904,240.20455 C 309.34904,169.05135 350.87417,179.18071 350.87417,139.20455 C 350.87417,119.20455 345.34904,116.50374 345.34904,102.20455 C 345.34904,83.30695 361.99717,84.403577 358.75805,68.734879 C 356.52061,57.911656 354.76962,49.23199 353.46516,36.143889 C 352.53959,26.857305 352.24452,16.959398 342.59855,17.357382 C 331.26505,17.824992 326.96549,37.77419 309.34904,39.204549 C 291.76851,40.631991 276.77834,24.238028 269.97404,26.579549 C 263.22709,28.901334 265.34904,47.204549 269.34904,60.204549 C 275.63588,80.636771 289.34904,107.20455 264.34904,111.20455 C 239.34904,115.20455 196.34904,119.20455 165.34904,160.20455 C 134.34904,201.20455 135.49342,249.3212 123.34904,264.20455 C 82.590696,314.15529 40.823919,293.64625 40.823919,335.20455 C 40.823919,353.81019 72.349045,367.20455 77.349045,361.20455 C 82.349045,355.20455 34.863764,337.32587 87.995492,316.20455 C 133.38711,298.16014 137.43914,294.47663 151.34904,307.20455 z ");
    //slqr.stroke(path);
    for(elem of elements){
        elem.display();
    }

    if(RECORD && !lock){
        play_next();
    }
}

//-----------------------------------------------

function Play(){
    commands.push(Array.from(arguments));
}

function play_next(){
    if(lock>0)return;
    if(commands.length==0){
        if(RECORD){mediaRecorder.stop();}
        return;
    }
    for(let command of commands.shift()){command[0](...command[1]);}
}

