var startX, startY, endX, endY;
var R = 150; 
var W = R/2;
var H = R/2;
var W2 = R/2;
var orbi = 1;
var TranAx = 2 * R;
var TranAy = 0;
var TranBx = 0;
var TranBy = 2 * R;
var TranOrigx = R;
var TranOrigy = R;
var NumMaps = 8;

var mode=1; // 0=edit, 1=line, 2=circle, n>=3 is polygon size
var Ax, Ay, Bx, By; // start and end points
var color="#000000";
var fill=0; // 0 or 1

var stack = [];
var undoStack = [];

var img;
var boxSize = 7;
var sized=1;
var xOffset=0;
var yOffset=0;
var w;
var h;
var posi;
var posi1=0;
var x1,y1,x2,y2;
var ptMap1;
var oldPoint;
var pointList = [];
var curPoly = [];
var polyList = [];
var myTiling;
var myImage;
var baseX = 10;
var baseY = 10;
var Ax = 300;
var Ay = 0;
var Bx = 0;
var By = 300;
var shapeNum = -1;
var controlPt;

function init() {
  sized=1;
  xOffset=0;
  yOffset=0;
  pointList = [];
  curPoly = [];
  polyList = [];
//  mode = 1;
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  c.height = window.innerHeight-170;
  c.width = window.innerWidth-205;
  context.beginPath();
  context.rect(0,0,c.width,c.height);
  context.fillStyle = "white";
  context.fill();

  var d = document.getElementById("canvasDiv");
  d.style.maxHeight= window.innerHeight-145 + "px";
  d.style.height = window.innerHeight-145 + "px";
  d.style.maxWidth= window.innerWidth-180 + "px";
  d.style.width= window.innerWidth-180 + "px";

  document.onkeyup = function(e) {
    var myKey = e.which || e.keyCode;
    if (e.ctrlKey && myKey === 90) {goUndo();}
    if (e.ctrlKey && myKey === 89) {goRedo();}
  }
  draw();
}


function resize() {
  var d = document.getElementById("canvasDiv");
  d.style.maxHeight= window.innerHeight-145 + "px";
  d.style.height = window.innerHeight-145 + "px";
  d.style.maxWidth= window.innerWidth-180 + "px";
  d.style.width= window.innerWidth-180 + "px";
  if (img) { draw(); }
  else {
    var c = document.getElementById("myCanvas");
    var context = c.getContext("2d");
    c.height = (window.innerHeight-170)*sized;
    c.width = (window.innerWidth-205)*sized;
    draw(); }
}


function elementLeft() {

//  if (xOffset < w-10) {xOffset += 10;}
xOffset += 10;
  draw();
}

function elementRight() {

//  if (xOffset >= 10) {xOffset -= 10;}
xOffset -= 10;
  draw();
}

function elementUp() {

//  if (yOffset < h-10) {yOffset += 10;}
yOffset += 10;
  draw();
}

function elementDown() {

//  if (yOffset>=10) {yOffset -= 10;}
yOffset -= 10;
  draw();
}

function elementGrow() {

  sized *= 2;
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  c.height = (window.innerHeight-135)*sized;
  c.width = (window.innerWidth-195)*sized;
  draw();
}

function elementShrink() {

  sized /= 2;
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  c.height = (window.innerHeight-135)*sized;
  c.width = (window.innerWidth-195)*sized;
  draw();
}

function goUndo() {
  if (stack.length> 0) {
    undoStack.push(stack.pop());
    draw();
  }
}

function goRedo() {
  if (undoStack.length> 0) {
    stack.push(undoStack.pop());
    draw();
  }
}

function goPng(el) {
  var c = document.getElementById("myCanvas");
  var imageURI = c.toDataURL("image/png");
  el.href = imageURI;
}

function setMode(newMode) {
  posi1=0;
  posi=0;
  mode = newMode;
  if (newMode ===3) {mode = document.getElementById("ngon").value;}
  draw();
}

function setNgon() {
  if (mode > 2) {mode = document.getElementById("ngon").value;}
}

function setColor() {
  color=document.getElementById("color").value;
}

function setFill() {
  fill = 0;
  if (document.getElementById("fill").checked) {fill=1;}
}

function setSnap() {
//  snap=document.getElementById("snap").checked;
//  alert(snap); UNNEEDED
}

function findCoords(origX,origY,vectAx, vectAy, vectBx,vectBy,newX,newY) {
  // this will find coordinates of (newX,newY) in the new coordinate system.
  // it will solve the system of equations:
  // origX + M*vectAx + N*vectBx = newX
  // origY + M*vectAy + N*vectBy = newY
  // for M and N. We assume that there is one solution.
  // then we tranlate to be within the translation parallelogram.

  var M = (vectBx*(newY-origY) + vectBy*(origX-newX))/(vectBx*vectAy-vectBy*vectAx);
  var N;
  if (vectBx === 0) {
    N = (newY-origY-M*vectAy)/vectBy;
  } else {
    N = (newX-origX-M*vectAx)/vectBx;
  }
  M -= Math.floor(M);
  N -= Math.floor(N);
  return([M,N]);
} // end findCoords

function setOrb(newOrbifold) {
  orbi = newOrbifold;
  H = R/2; // this might get reset in orbifold 22x.
  switch (orbi) {
    case 1: // *442
      stack=[];
      TranAx = 2 * R;
      TranAy = 0;
      TranBx = 0;
      TranBy = 2 * R;
      TranOrigx = R;
      TranOrigy = R;
      NumMaps = 8;
      break;
    case 2: // 442
      stack=[];
      TranAx = 2 * R;
      TranAy = 0;
      TranBx = 0;
      TranBy = 2 * R;
      TranOrigx = R;
      TranOrigy = R;
      NumMaps = 4;
      break;
    case 3: // 4*2
      stack=[];
      TranAx =  R;
      TranAy = -R;
      TranBx =  R;
      TranBy =  R;
      TranOrigx = 1.5*R;
      TranOrigy = 1.5*R;
      NumMaps = 8;
      break;
    case 4: // *632
      stack=[];
      TranAx = 1.5 * R;
      TranAy = 0.8660254037844386 * R;
      TranBx = 0;
      TranBy = 1.7320508075688772 * R;
      TranOrigx = 1.5 * R;
      TranOrigy = 0.8660254037844386 * R;
      NumMaps = 12;
      break;
    case 5: // *333
      stack=[];
      TranAx = 1.5 * R;
      TranAy = 0.8660254037844386 * R;
      TranBx = 0;
      TranBy = 1.7320508075688772 * R;
      TranOrigx = R;
      TranOrigy = 0;
      NumMaps = 6;     
      break;
    case 6: // 632
      stack=[];
      TranAx = 1.5 * R;
      TranAy = 0.8660254037844386 * R;
      TranBx = 0;
      TranBy = 1.7320508075688772 * R;
      TranOrigx = 1.5 * R;
      TranOrigy = 0.8660254037844386 * R;
      NumMaps = 6;
      break;
    case 7: // 333
      stack=[];
      TranAx = 1.5 * R;
      TranAy = 0.8660254037844386 * R;
      TranBx = 0;
      TranBy = 1.7320508075688772 * R;
      TranOrigx = R;
      TranOrigy = 0;
      NumMaps = 3;
      break;
    case 8: // 3*3
      stack=[];
      TranAx = 1.5 * R;
      TranAy = 0.8660254037844386 * R;
      TranBx = 0;
      TranBy = 1.7320508075688772 * R;
      TranOrigx = R;
      TranOrigy = 0;
      NumMaps = 6;
      break;
    case 9: // 22x
      stack=[];
      TranAx = 2 * W;
      TranAy = 0;
      TranBx = 0;
      TranBy = 2 * H;
      TranOrigx = W;
      TranOrigy = H;
      NumMaps = 4;
      break;
    case 10: // *2222
      stack=[];
      TranAx = 2 * W;
      TranAy = 0;
      TranBx = 0;
      TranBy = 2 * H;
      TranOrigx = W;
      TranOrigy = H;
      NumMaps = 4;
      break;
    case 11: // 22*
      stack=[];
      TranAx = 4 * W;
      TranAy = 0;
      TranBx = 0;
      TranBy = 2 * H;
      TranOrigx = 2*W;
      TranOrigy = H;
      NumMaps = 4;
      break;
    case 12: // **
      stack=[];
      TranAx = 2 * W;
      TranAy = 0;
      TranBx = 0;
      TranBy = 2 * H;
      TranOrigx = W;
      TranOrigy = H;
      NumMaps = 2;
      break;
    case 13: // xx
      stack=[];
      TranAx = 2 * W;
      TranAy = 0;
      TranBx = 0;
      TranBy = 2 * H;
      TranOrigx = W;
      TranOrigy = H;
      NumMaps = 2;
      break;
    case 14: // 2*22
      stack=[];
      TranAx = 2 * W;
      TranAy = -2 * H;
      TranBx = 2 * W;
      TranBy = 2 * H;
      TranOrigx = 3*W;
      TranOrigy = 3*H;
      NumMaps = 4;
      break;
    case 15: // *x
      stack=[];
      TranAx = W;
      TranAy = -2 * H;
      TranBx = W;
      TranBy = 2 * H;
      TranOrigx = W;
      TranOrigy = 3*H;
      NumMaps = 2;
      break;
    case 16: // 2222
      stack=[];
      TranAx = W + W2;
      TranAy = 0;
      TranBx = W - W2;
      TranBy = 2 * H;
      TranOrigx = W;
      TranOrigy = H;
      NumMaps = 2;
      break;
    case 17: // o
      stack=[];
      TranAx = W + W2;
      TranAy = 0;
      TranBx = W - W2;
      TranBy = 2 * H;
      TranOrigx = W;
      TranOrigy = H;
      NumMaps = 1;
      break;

  } // end switch
  draw();
}

function txtToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: "text/plain", endings: "native"});
  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
} // end txtToFile()

function svgToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: "image/svg+xml", endings: "native"});
  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
} // end svgToFile()

function saveSVG() {
  var asOutput = '<svg height="500" width="600">\r\n';
  stack.forEach(function(nextShape) {
    if (nextShape[0] === 1) { // line
      for (map=1;map<=NumMaps;map++) {
        var pt3 = MapOne(map,orbi,nextShape[1],nextShape[2]);
        var pt4 = MapOne(map,orbi,nextShape[3],nextShape[4]);
        for (i=0;i<6;i++) {
          var xAdd1 = i*TranAx;
          var yAdd1 = i*TranAy;
            for (j=0;j<6;j++) {
              var xAdd = xAdd1 + j*TranBx;
              var yAdd = yAdd1 + j*TranBy;
              asOutput = asOutput.concat('<path d="M ');
              asOutput = asOutput.concat(pt3[0]+xAdd);
              asOutput = asOutput.concat(' ');
              asOutput = asOutput.concat(pt3[1]+yAdd);
              asOutput = asOutput.concat(' L ');
              asOutput = asOutput.concat(pt4[0]+xAdd);
              asOutput = asOutput.concat(' ');
              asOutput = asOutput.concat(pt4[1]+yAdd);
              asOutput = asOutput.concat(' Z" stroke="' + nextShape[5]);
              asOutput = asOutput.concat('" />\r\n');
          } // end j loop
        } // end i loop
      } // end map loop
    } // end line
    if (nextShape[0] === 2) { // circle
      var myRadius = Math.sqrt((nextShape[1]-nextShape[3])**2+(nextShape[2]-nextShape[4])**2);
      for (map=1;map<=NumMaps;map++) {
        var pt3 = MapOne(map,orbi,nextShape[1],nextShape[2]);
        var pt4 = MapOne(map,orbi,nextShape[3],nextShape[4]);
        for (i=0;i<6;i++) {
          var xAdd1 = i*TranAx;
          var yAdd1 = i*TranAy;
          for (j=0;j<6;j++) {
            var xAdd = xAdd1 + j*TranBx;
            var yAdd = yAdd1 + j*TranBy;
            asOutput = asOutput.concat('<circle cx="');
            asOutput = asOutput.concat(pt3[0]+xAdd);
            asOutput = asOutput.concat('" cy="');
            asOutput = asOutput.concat(pt3[1]+yAdd);
            asOutput = asOutput.concat('" r="');
            asOutput = asOutput.concat(myRadius);
            asOutput = asOutput.concat('" ');
            if (nextShape[6] === 0) {
              asOutput = asOutput.concat('stroke="');
              asOutput = asOutput.concat(nextShape[5]);
              asOutput = asOutput.concat('" fill="none" />');
            } else {
              asOutput = asOutput.concat('fill="');
              asOutput = asOutput.concat(nextShape[5]);
              asOutput = asOutput.concat('" stroke="none" />');
            }
          } // end j loop
        } // end i loop
      } // end map loop
    } // end circle
    if (nextShape[0] > 2) { // polygon
      var angleStep = 2 * Math.PI / nextShape[0];
      for (map=1;map<=NumMaps;map++) {
        var pt3 = MapOne(map,orbi,nextShape[1],nextShape[2]);
        var pt4 = MapOne(map,orbi,nextShape[3],nextShape[4]);
        for (i=0;i<6;i++) {
          var xAdd1 = i*TranAx;
          var yAdd1 = i*TranAy;
          for (j=0;j<6;j++) {
            var xDiff = pt4[0]-pt3[0];
            var yDiff = pt4[1]-pt3[1];
            var xAdd = xAdd1 + j*TranBx;
            var yAdd = yAdd1 + j*TranBy;
            asOutput = asOutput.concat('<path d="M ');  
            asOutput = asOutput.concat(pt4[0]+xAdd);
            asOutput = asOutput.concat(' ');
            asOutput = asOutput.concat(pt4[1]+yAdd);
            asOutput = asOutput.concat(' ');
            for (k = 1;k<nextShape[0];k++) {
              var nowX = Math.cos(k * angleStep);
              var nowY = Math.sin(k * angleStep);
              var Dx = nowX * xDiff - nowY * yDiff + pt3[0]+xAdd;
              var Dy = nowX * yDiff + nowY * xDiff + pt3[1]+yAdd;
              asOutput = asOutput.concat(Dx);
              asOutput = asOutput.concat(' ');
              asOutput = asOutput.concat(Dy);
              asOutput = asOutput.concat(' '); 
            }
            asOutput = asOutput.concat(' Z" ');
            if (nextShape[6] === 0) {
              asOutput = asOutput.concat('stroke="');
              asOutput = asOutput.concat(nextShape[5]);
              asOutput = asOutput.concat('" fill="none" />');
            } else {
              asOutput = asOutput.concat('fill="');
              asOutput = asOutput.concat(nextShape[5]);
              asOutput = asOutput.concat('" stroke="none" />');
            }
          } // end j loop
        } // end i loop
      } // end map loop
    } // end polygon
  }); // end stack loop
  asOutput = asOutput.concat('</svg>');
  svgToFile(asOutput,"myDesign","svg");
} // end saveSVG()

function saveDesign() {
  var asOutput = "orbi 1.0\r\n";
  asOutput = asOutput.concat('orbi = '+orbi+'\r\n');
  asOutput = asOutput.concat('H = '+H+'\r\n');
  asOutput = asOutput.concat('TranAx = '+TranAx+'\r\n');
  asOutput = asOutput.concat('TranAy = '+TranAy+'\r\n');
  asOutput = asOutput.concat('TranBx = '+TranBx+'\r\n');
  asOutput = asOutput.concat('TranBy = '+TranBy+'\r\n');
  asOutput = asOutput.concat('TranOrigx = '+TranOrigx+'\r\n');
  asOutput = asOutput.concat('TranOrigy = '+TranOrigy+'\r\n');
  asOutput = asOutput.concat('NumMaps = '+NumMaps+'\r\n');
  asOutput = asOutput.concat('stack:\r\n');

  stack.forEach(function(nextShape) {
    asOutput = asOutput.concat('' + nextShape[0] + ', ');
    asOutput = asOutput.concat('' + nextShape[1] + ', ');
    asOutput = asOutput.concat('' + nextShape[2] + ', ');
    asOutput = asOutput.concat('' + nextShape[3] + ', ');
    asOutput = asOutput.concat('' + nextShape[4] + ', ');
    asOutput = asOutput.concat('' + nextShape[5] + ', ');
    asOutput = asOutput.concat('' + nextShape[6] + '\r\n');
  });
  asOutput = asOutput.concat('end');
  txtToFile(asOutput,"myDesign","txt");
} // end saveDesign()

function loadDesign() {
//  var c = document.getElementById("myCanvas");
//  var context = c.getContext("2d");

  const file = document.getElementById("loadDesign").files[0];
  const reader = new FileReader();

  reader.addEventListener("load", function () {
    var lines = reader.result.split(/\r\n|\n/);
 //   init();

    var curLen = lines.length-1;
 //   var setPoly = 0;

    if (lines[0] != 'orbi 1.0') {
      alert("Wrong file format.");
    } else {
      var nextVar = lines[1].split("=");
      orbi = parseInt(nextVar[1]);
      switch (orbi) {
        case 1: 
          document.getElementById('astar442').checked = true;
          break;
        case 2: 
          document.getElementById('a442').checked = true;
          break;
        case 3: 
          document.getElementById('a4star2').checked = true;
          break;
        case 4: 
          document.getElementById('astar632').checked = true;
          break;
        case 5: 
          document.getElementById('astar333').checked = true;
          break;
        case 6: 
          document.getElementById('a632').checked = true;
          break;
        case 7: 
          document.getElementById('a333').checked = true;
          break;
        case 8: 
          document.getElementById('a3star3').checked = true;
          break;
        case 9: 
          document.getElementById('a22x').checked = true;
          break;
        case 10: 
          document.getElementById('astar2222').checked = true;
          break;
        case 11: 
          document.getElementById('a22star').checked = true;
          break;
        case 12: 
          document.getElementById('astarstar').checked = true;
          break;
        case 13: 
          document.getElementById('axx').checked = true;
          break;
        case 14: 
          document.getElementById('a2star22').checked = true;
          break;
        case 15: 
          document.getElementById('astarx').checked = true;
          break;
        case 16: 
          document.getElementById('a2222').checked = true;
          break;
        case 17: 
          document.getElementById('ao').checked = true;
          break;
      }
      nextVar = lines[2].split("=");
      H = parseInt(nextVar[1]);
      nextVar = lines[3].split("=");
      TranAx = parseInt(nextVar[1]);
      nextVar = lines[4].split("=");
      TranAy = parseInt(nextVar[1]);
      nextVar = lines[5].split("=");
      TranBx = parseInt(nextVar[1]);
      nextVar = lines[6].split("=");
      TranBy = parseInt(nextVar[1]);
      nextVar = lines[7].split("=");
      TranOrigx = parseInt(nextVar[1]);
      nextVar = lines[8].split("=");
      TranOrigy = parseInt(nextVar[1]);
      nextVar = lines[9].split("=");
      NumMaps = parseInt(nextVar[1]);
      stack = [];
      for (i = 11;i<curLen;i++) {
        var nextStack = lines[i].split(",");
        var newMode = parseFloat(nextStack[0]);
        var newX1 = parseFloat(nextStack[1]);
        var newY1 = parseFloat(nextStack[2]);
        var newX2 = parseFloat(nextStack[3]);
        var newY2 = parseFloat(nextStack[4]);
        var newColor = nextStack[5];
        var newFill = parseFloat(nextStack[6]);
        stack.push([newMode,newX1,newY1,newX2,newY2,newColor,newFill]);
      } // end i loop through stack  
    } // end orbi 1.0 good format
    draw();
  },false);

  if (file) {
    reader.readAsText(file); 
  }

} // end loadDesign()


function mouseMoved(event) {
  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
  posi = [canvasX/sized+xOffset,canvasY/sized+yOffset];

  if (mode === 0 && shapeNum >= 0) { // edit - move points around
    if (shapeNum === 0.5) { // move vector
      TranBy = posi[1]-TranOrigy;
      if (orbi === 9 || orbi === 13) {
        H = TranBy/2;
      }
      if (orbi > 15) {
        TranBx = posi[0]-TranOrigx;
      }
      if (orbi === 14 || orbi === 15) {
        TranAy = -TranBy;
      }
    } else { // move control point
      stack[shapeNum][controlPt] = posi[0];
      stack[shapeNum][controlPt+1] = posi[1];
    }
  }
  draw();
} // end mouseMoved()

function mouseClicked(event) {
//alert("huyh?");
}

function mousePressed(event) {
//alert(mode);
  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
  posi1 = [canvasX/sized+xOffset,canvasY/sized+yOffset];

  if (mode === 0) { // edit - move points around
    shapeNum = -1;
    for (let i = 0; i < stack.length; ++i) {
      if (Math.abs(posi1[0]-stack[i][1])<boxSize && Math.abs(posi1[1]-stack[i][2])<boxSize) {
        shapeNum = i;
        controlPt = 1;
        break;
      }
      if (Math.abs(posi1[0]-stack[i][3])<boxSize && Math.abs(posi1[1]-stack[i][4])<boxSize) {
        shapeNum = i;
        controlPt = 3;
        break;
      } 
    } // end for loop
    if (orbi>8) { // move vector
      if (Math.abs(posi1[0]-TranOrigx-TranBx)<boxSize && 
            Math.abs(posi1[1]-TranOrigy-TranBy)<boxSize) {
        shapeNum = 0.5;
      }
    } // end move vector
  } // end mode === 0
  else { // mode not 0
    if (document.getElementById("snap").checked) { // snap 
      var movePt;
      movePt = snapTo(posi1[0],posi1[1]);
      posi1[0] -= movePt[0];
      posi1[1] -= movePt[1];
    } // end snap
  } // end mode not 0

} // end mousePressed()

function snapTo(checkX, checkY) {
  var newPoint = findCoords(TranOrigx, TranOrigy, TranAx, TranAy, TranBx, TranBy, checkX, checkY);
  movePt = [0,0];
  switch (orbi) {
    case 1: // *442
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-0.5,movePt);
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-0.5,movePt);
      movePt=checkLine(newPoint,0,1,-1,movePt);
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 2: // 442
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 3: // 4*2
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 4: // *632
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-1,movePt);
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);
      movePt=checkLine(newPoint,2,1,-1,movePt);
      movePt=checkLine(newPoint,1,2,-1,movePt);
      movePt=checkLine(newPoint,2,1,-2,movePt);
      movePt=checkLine(newPoint,1,2,-2,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 5: // *333
      movePt=checkLine(newPoint,2,1,-1,movePt);
      movePt=checkLine(newPoint,1,2,-1,movePt);
      movePt=checkLine(newPoint,2,1,-2,movePt);
      movePt=checkLine(newPoint,1,2,-2,movePt);
      movePt=checkLine(newPoint,1,-1,0,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 6: // 632
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 7: // 333
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 8: // 3*3
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-1,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 9: // 22x
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 10: // *2222
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-0.5,movePt);
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-0.5,movePt);
      movePt=checkLine(newPoint,0,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 11: // 22*
      movePt=checkLine(newPoint,1,0,-0.25,movePt); 
      movePt=checkLine(newPoint,1,0,-0.75,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 12: // **
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-0.5,movePt);
      movePt=checkLine(newPoint,1,0,-1,movePt);

      break;
    case 13: // xx

      break;
    case 14: // 2*22
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 15: // *x
      movePt=checkLine(newPoint,1,1,-1,movePt);

      break;
    case 16: // 2222
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 17: // o

      break;
  } // end switch      
  return(movePt);
} //end snapTo()


function checkPoint(newPoint,Xcoord,Ycoord,movePt) {
  if (Math.abs((newPoint[0]-Xcoord)*TranAx+(newPoint[1]-Ycoord)*TranBx)< boxSize*2 && 
       Math.abs((newPoint[0]-Xcoord)*TranAy+(newPoint[1]-Ycoord)*TranBy)< boxSize*2) {
//    stationary = false;
    movePt = [(newPoint[0]-Xcoord)*TranAx+(newPoint[1]-Ycoord)*TranBx,
            (newPoint[0]-Xcoord)*TranAy+(newPoint[1]-Ycoord)*TranBy];
  }
  return(movePt);
}

function checkLine(newPoint,aa,bb,cc,movePt) {
// this will find if point on line aa*X + bb*Y + cc = 0 that is closest to newPoint
  var newX, newY;
  if (bb === 0) {
    newX = -cc/aa;
    newY = newPoint[1];
  } else {
    newX = -(aa*cc+aa*bb*newPoint[1]-bb*bb*newPoint[0])/(aa*aa+bb*bb);
    newY = (-cc-aa*newX)/bb;
  }

  var newMovePt = checkPoint(newPoint,newX,newY,movePt);
//alert([newX,newY,"*",newPoint,movePt,newMovePt]);
  return(newMovePt);
} // end checkLine()


function mouseReleased(event) {
  shapeNum = -1; // we aren't moving control points around.
  if (mode > 0) { // end of drawing
    undoStack = [];
    stack.push([mode,posi1[0],posi1[1],posi[0],posi[1],color,fill]);
  }
  posi1=0;
  posi=0;
  draw();
} // end mouseReleased()

/*
function onVector() {

  var onVec = 2;
  if (Math.abs(posi1[0]-baseX)<=boxSize/sized 
         && Math.abs(posi1[1]-baseY)<=boxSize/sized )
          {onVec = 3; oldPoint = posi1;};
  if (Math.abs(posi1[0]-baseX-Ax)<=boxSize/sized 
         && Math.abs(posi1[1]-baseY-Ay)<=boxSize/sized )
          {onVec = 4;oldPoint = posi1;};
  if (Math.abs(posi1[0]-baseX-Bx)<=boxSize/sized 
         && Math.abs(posi1[1]-baseY-By)<=boxSize/sized )
          {onVec = 5;oldPoint = posi1;};
  return(onVec);
}

function erasePoint(ptMap) {

  if (ptMap[0]>=0) {
// remove point
    var pointless = ptMap[0];
    var newPointList = [];
    for (i=0;i<pointless;i++) {
      newPointList[i]=pointList[i];
     }
    for (i=pointless+1;i<pointList.length;i++) {
      newPointList[i-1]=pointList[i];
    }
   pointList = newPointList;

// remove polys that had that point
    var newPolyList = [];
    polyList.forEach(function(poly) {
      var keepPoly = 1;
      poly.forEach(function(ptMap) {
        if (ptMap[0] === pointless) {keepPoly = 0;}
        if (ptMap[0] > pointless) {ptMap[0]--;}
      });
      if (keepPoly === 1) {newPolyList.push(poly)}
    });
    polyList = newPolyList;
  }
}

function drawPoint(ptMap) {

//add new point
  if (ptMap[0]<0) { 
    ptMap= [pointList.length,[0,0]]; 
    pointList.push(posi);
  }
//if we return to polygon starting point
  if (JSON.stringify(ptMap) === JSON.stringify(curPoly[0])) {
    polyList.push(curPoly);
    curPoly = [];
    }
//add point to current polygon
  else {
    curPoly.push(ptMap); 
    }
}

function loadMyDesign() {

  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");

  const file = document.getElementById("loadTiling").files[0];
  const reader = new FileReader();

  reader.addEventListener("load", function () {
    var lines = reader.result.split(/\r\n|\n/);
    init();
    var curLen = lines.length-1;
    var setPoly = 0;
    for (i = 1;i<curLen;i++) {
      if (lines[i] === "points:") { setPoly = 1; continue;}
      if (lines[i] === "poly:") { setPoly = 2; curPoly = []; continue;}
      if (lines[i] === "end") { draw(); break;}
      var coords = lines[i].split(",");
      if (i===1) {Ax = coords[0],Ay=coords[1]}
      if (i===2) {Bx = coords[0],By=coords[1]}
      if (setPoly === 1) {pointList.push([parseFloat(coords[0]),parseFloat(coords[1])]);}   
      if (setPoly === 2) {
        curPoly.push( [parseInt(coords[0]),[parseInt(coords[1]),parseInt(coords[2])]] );
        if (lines[i+1] === "poly:") {polyList.push(curPoly);curPoly = [];};
        if (lines[i+1] === "end") {polyList.push(curPoly);curPoly = [];};
      }
    }
  },false);

  if (file) {
    reader.readAsText(file);
  }
} // end loadMyDesign()
*/

function MapOne(myMap, myOrbi,x,y) {
//alert(myOrbi);
  var xOut, yOut;
  switch (myOrbi) {
    case 1: // *442
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = y;
          yOut = x;
          break;
        case 3:
          xOut = -x;
          yOut = y;
          break;
        case 4:
          xOut = -y;
          yOut = x;
          break;
        case 5:
          xOut = x;
          yOut = -y;
          break;
        case 6:
          xOut = y;
          yOut = -x;
          break;
        case 7:
          xOut = -x;
          yOut = -y;
          break;
        case 8:
          xOut = -y;
          yOut = -x;
          break;
      } // end *442
      break;  
    case 2: // 442
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -y;
          yOut = x;
          break;
        case 3:
          xOut = -x;
          yOut = -y;
          break;
        case 4:
          xOut = y;
          yOut = -x;
          break;
      } // end 442
      break;  
    case 3: // 4*2
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -y;
          yOut = x;
          break;
        case 3:
          xOut = -x;
          yOut = -y;
          break;
        case 4:
          xOut = y;
          yOut = -x;
          break;
        case 5:
          xOut = R - x;
          yOut = y;
          break;
        case 6:
          xOut = R + y;
          yOut = x;
          break;
        case 7:
          xOut = R + x;
          yOut = -y;
          break;
        case 8:
          xOut = R - y;
          yOut = -x;
          break;
      } // end 4*2
      break;  
    case 4: // *632
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = y;
          break;
        case 3:
          xOut = 0.5 * x - 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x + 0.5 * y;
          break;
        case 4:
          xOut = -0.5 * x - 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x + 0.5 * y;
          break;
        case 5:
          xOut = -0.5 * x + 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x + 0.5 * y;
          break;
        case 6:
          xOut = 0.5 * x + 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x + 0.5 * y;
          break;
        case 7:
          xOut = x;
          yOut = -y;
          break;
        case 8:
          xOut = -x;
          yOut = -y;
          break;
        case 9:
          xOut = 0.5 * x - 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x - 0.5 * y;
          break;
        case 10:
          xOut = -0.5 * x - 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x - 0.5 * y;
          break;
        case 11:
          xOut = -0.5 * x + 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x - 0.5 * y;
          break;
        case 12:
          xOut = 0.5 * x + 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x - 0.5 * y;
          break;
      } // end *632
      break; 
    case 5: // *333
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = x;
          yOut = -y;
          break;
        case 3:
          xOut = -0.5 * x - 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x - 0.5 * y;
          break;
        case 4:
          xOut = -0.5 * x + 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x + 0.5 * y;
          break;
        case 5:
          xOut = -0.5 * x - 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x + 0.5 * y;
          break;
        case 6:
          xOut = -0.5 * x + 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x - 0.5 * y;
          break;
      } // end *333
      break; 
    case 6: // 632
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = 0.5 * x - 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x + 0.5 * y;
          break;
        case 3:
          xOut = -0.5 * x - 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x - 0.5 * y;
          break;
        case 4:
          xOut = -x;
          yOut = -y;
          break;
        case 5:
          xOut = -0.5 * x + 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x - 0.5 * y;
          break;
        case 6:
          xOut = 0.5 * x + 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x + 0.5 * y;
          break;
      } // end 632
      break; 
    case 7: // 333
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -0.5 * x - 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x - 0.5 * y;
          break;
        case 3:
          xOut = -0.5 * x + 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x - 0.5 * y;
          break;
      } // end 333
      break; 
    case 8: // 3*3
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -R - x;
          yOut = y;
          break;
        case 3:
          xOut = -0.5 * x - 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * x - 0.5 * y;
          break;
        case 4:
          xOut = 0.5 * (R + x) - 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * (R + x) - 0.5 * y;
          break;
        case 5:
          xOut = -0.5 * x + 0.8660254037844386 * y;
          yOut = -0.8660254037844386 * x - 0.5 * y;
          break;
        case 6:
          xOut = 0.5 * (R + x) + 0.8660254037844386 * y;
          yOut = 0.8660254037844386 * (R + x) - 0.5 * y;
          break;
      } // end 3*3
      break; 
    case 9: // 22x
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = W - x;
          yOut = - H + y;
          break;
        case 3:
          xOut = -x
          yOut = -y;
          break;
        case 4:
          xOut = -W + x;
          yOut = H - y;
          break;
      } // end 22x
      break; 
    case 10: // *2222
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = y;
          break;
        case 3:
          xOut = x;
          yOut = -y;
          break;
        case 4:
          xOut = -x;
          yOut = -y;
          break;
      } // end *2222
      break; 
    case 11: // 22*
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = -y;
          break;
        case 3:
          xOut = 2 * W - x;
          yOut = y;
          break;
        case 4:
          xOut = 2 * W + x;
          yOut = -y;
          break;
      } // end 22*
      break; 
    case 12: // **
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = y;
          break;
      } // end **
      break; 
    case 13: // xx
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = H + y;
          break;
      } // end xx
      break; 
    case 14: // 2*22
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = -y;
          break;
        case 3:
          xOut = 2 * W - x;
          yOut = y;
          break;
        case 4:
          xOut = 2 * W + x;
          yOut = -y;
          break;
      } // end 2*22
      break; 
    case 15: // *x
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = y;
          break;
      } // end *x
      break; 
    case 16: // 2222
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          break;
        case 2:
          xOut = -x;
          yOut = -y;
          break;
      } // end 2222
      break; 
    case 17: // o
      xOut = x;
      yOut = y;
      break; 
  } // end switch(myOrbi)
  return([xOut,yOut]);

} // end MapOne

function drawShape(context, myMode, myX1, myY1, myX2, myY2, myColor, myFill) {
  if (myMode === 1) { // line
    for (map=1;map<=NumMaps;map++) {
      var pt3 = MapOne(map,orbi,myX1,myY1);
      var pt4 = MapOne(map,orbi,myX2,myY2);
      for (i=-10;i<10;i++) {
        var xAdd1 = i*TranAx;
        var yAdd1 = i*TranAy;
          for (j=-10;j<10;j++) {
            var xAdd = xAdd1 + j*TranBx;
            var yAdd = yAdd1 + j*TranBy;
            context.beginPath();
            context.moveTo(pt3[0]+xAdd, pt3[1]+yAdd);
            context.lineTo(pt4[0]+xAdd, pt4[1]+yAdd);
            context.strokeStyle = myColor;
            context.stroke();
        } // end j loop
      } // end i loop
    } // end map loop
  } // end line
  if (myMode === 2) { // circle
    var myRadius = Math.sqrt((myX1-myX2)**2+(myY1-myY2)**2);
    for (map=1;map<=NumMaps;map++) {
      var pt3 = MapOne(map,orbi,myX1,myY1);
      var pt4 = MapOne(map,orbi,myX2,myY2);
      for (i=-10;i<10;i++) {
        var xAdd1 = i*TranAx;
        var yAdd1 = i*TranAy;
        for (j=-10;j<10;j++) {
          var xAdd = xAdd1 + j*TranBx;
          var yAdd = yAdd1 + j*TranBy;
          context.beginPath();
          context.arc(pt3[0]+xAdd, pt3[1]+yAdd,myRadius,0,2*Math.PI);
          if (myFill === 0) {
            context.strokeStyle = myColor;
            context.stroke();
          } else {
            context.fillStyle = myColor;
            context.fill();
          }
        } // end j loop
      } // end i loop
    } // end map loop
  } // end circle
  if (myMode > 2) { // polygon
    var angleStep = 2 * Math.PI / myMode;
    for (map=1;map<=NumMaps;map++) {
      var pt3 = MapOne(map,orbi,myX1,myY1);
      var pt4 = MapOne(map,orbi,myX2,myY2);
      for (i=-10;i<10;i++) {
        var xAdd1 = i*TranAx;
        var yAdd1 = i*TranAy;
        for (j=-10;j<10;j++) {
          var xDiff = pt4[0]-pt3[0];
          var yDiff = pt4[1]-pt3[1];
          var xAdd = xAdd1 + j*TranBx;
          var yAdd = yAdd1 + j*TranBy;
          context.beginPath();
          context.moveTo(pt4[0]+xAdd, pt4[1]+yAdd);
          for (k = 1;k<myMode;k++) {
            var nowX = Math.cos(k * angleStep);
            var nowY = Math.sin(k * angleStep);
            var Dx = nowX * xDiff - nowY * yDiff + pt3[0]+xAdd;
            var Dy = nowX * yDiff + nowY * xDiff + pt3[1]+yAdd;
            context.lineTo(Dx, Dy);
          }
          context.lineTo(pt4[0]+xAdd, pt4[1]+yAdd);
          if (myFill === 0) {
            context.strokeStyle = myColor;
            context.stroke();
          } else {
            context.fillStyle = myColor;
            context.fill();
          }
        } // end j loop
      } // end i loop
    } // end map loop
  } // end polygon
} // end drawShape()

function draw() {
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  context.beginPath();
  context.rect(0,0,c.width,c.height);
  context.fillStyle = "white";
  context.fill();

  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);

// draw vectors
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle ="green";
  var oldX = (TranOrigx-xOffset)*sized-boxSize;
  var oldY = (TranOrigy-yOffset)*sized-boxSize;
  context.beginPath();
  context.moveTo(oldX+boxSize+TranAx*sized,oldY+boxSize+TranAy*sized);
  context.lineTo(oldX+boxSize,oldY+boxSize);
  context.lineTo(oldX+boxSize+TranBx*sized,oldY+boxSize+TranBy*sized);
  context.stroke();

// draw saved shapes
  context.lineWidth = 1;
  stack.forEach(function(nextShape) {
    drawShape(context, nextShape[0],nextShape[1],nextShape[2],nextShape[3],nextShape[4],nextShape[5],nextShape[6]);
  });


// draw current shape
  drawShape(context, mode,posi1[0],posi1[1],posi[0],posi[1],color,fill);

if (mode ===0) {
// draw vector control point
  if (orbi > 8) { 
    context.rect(oldX+TranBx*sized,oldY+TranBy*sized,boxSize*2+1,boxSize*2+1);
    context.stroke();
  }

// draw control points of shapes
  context.lineWidth = 2;
  context.strokeStyle ="red";
  stack.forEach(function(nextShape) {
    context.beginPath();
    context.rect(nextShape[1]-boxSize,nextShape[2]-boxSize,boxSize*2+1,boxSize*2+1);
    context.stroke();
    context.beginPath();
    context.rect(nextShape[3]-boxSize,nextShape[4]-boxSize,boxSize*2+1,boxSize*2+1);
    context.stroke();
  });
} // end mode ====0


} // end draw()
