var startX, startY, endX, endY;

//var R = 150; 
//var W = R/2;
//var H = R/2;
//var W2 = R/2;

var orbi = 14;

//var TranAx = 2 * R;
//var TranAy = 0;
//var TranBx = 0;
//var TranBy = 2 * R;
//var TranOrigx = R;
//var TranOrigy = R;

var NumMaps = 1;

var mode=1; // -1=pan, 0=edit, 1=line, 2=circle, n>=3 is polygon size
var Ax, Ay, Bx, By; // start and end points
var color="#000000";
var fill=0; // 0 or 1

var img;
var boxSize = 7;

var w;
var h;
var posB;
var posA=0;
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

var myRot = 6;
var symVects = [[0,1,0]];
var backupSymVects = [];
var stack = [];
var undoStack = [];
var backupStack = [];
var frontBez = [];
var rearBez = [];

var scrRadius = 200;
var scrCenterX;
var scrCenterY;
var posB3d = [];
var posA3d = [];

function init() {

  pointList = [];
  curPoly = [];
  polyList = [];
//  mode = 1;
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  c.height = window.innerHeight-220;
  c.width = window.innerWidth-205;
  scrCenterX = Math.round(c.width/2);
  scrCenterY = Math.round(c.height/2);
  
//  setOrb(14);

  context.beginPath();
  context.rect(0,0,c.width,c.height);
  context.fillStyle = "white";
  context.fill();

  var d = document.getElementById("canvasDiv");
  d.style.maxHeight= window.innerHeight-195 + "px";
  d.style.height = window.innerHeight-195 + "px";
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
  d.style.maxHeight= window.innerHeight-195 + "px";
  d.style.height = window.innerHeight-195 + "px";
  d.style.maxWidth= window.innerWidth-180 + "px";
  d.style.width= window.innerWidth-180 + "px";
  if (img) { draw(); }
  else {
    var c = document.getElementById("myCanvas");
    var context = c.getContext("2d");
    c.height = (window.innerHeight-220);
    c.width = (window.innerWidth-205);
    scrCenterX = Math.round(c.width/2);
    scrCenterY =Math.round(c.height/2);
    draw(); }
}

// given two unit vectors, return reflection of vect2 over a plane perpendicular to vect1 that passes through origin.
function reflect(vect1,vect2) {
  vect1=normalize(vect1);
  var myDot = dot(vect1, vect2);
  var vect3 = vectSum(vect2,vectScale(vect1,-2*myDot));
  return(vect3);
}

function vectSum(vect1,vect2) {
  return([vect1[0]+vect2[0],vect1[1]+vect2[1],vect1[2]+vect2[2]]);
}

function vectDiff(vect1,vect2) {
  return([vect1[0]-vect2[0],vect1[1]-vect2[1],vect1[2]-vect2[2]]);
}

function vectScale(vect, factor) {
  return([vect[0]*factor,vect[1]*factor,vect[2]*factor]);
}

function vectLeng(vect) {
  return(Math.sqrt(dot(vect,vect)));
}

function normalize(vect) {
  return(vectScale(vect,1/vectLeng(vect)));
}

// return the dot product of two unit vectors
function dot(vect1, vect2) {
  return(vect1[0]*vect2[0]+vect1[1]*vect2[1]+vect1[2]*vect2[2]);
}

// return cross product of two vectors
function cross(vect1,vect2) {
  return([vect1[1]*vect2[2]-vect1[2]*vect2[1],
          vect1[2]*vect2[0]-vect1[0]*vect2[2],
          vect1[0]*vect2[1]-vect1[1]*vect2[0]]);
}

// find the matrix to rotate around a unit vector by a given angle
function rotMat(vect, angle) {
vect = normalize(vect);
  var cosA = Math.cos(angle);
  var sinA = Math.sin(angle);
  var M11 = cosA + vect[0]*vect[0]*(1-cosA);
  var M12 = vect[0]*vect[1]*(1-cosA) - vect[2]*sinA;
  var M13 = vect[0]*vect[2]*(1-cosA) + vect[1]*sinA;
  var M21 = vect[1]*vect[0]*(1-cosA) + vect[2]*sinA;
  var M22 = cosA + vect[1]*vect[1]*(1-cosA);
  var M23 = vect[1]*vect[2]*(1-cosA) - vect[0]*sinA;
  var M31 = vect[2]*vect[0]*(1-cosA) - vect[1]*sinA;
  var M32 = vect[2]*vect[1]*(1-cosA) + vect[0]*sinA;
  var M33 = cosA + vect[2]*vect[2]*(1-cosA);
  return([M11,M12,M13,M21,M22,M23,M31,M32,M33]);
}

// multiply a vector times a matrix to get a vector.
function multVectMat(vect, mat) {
  var v1 = vect[0]*mat[0]+vect[1]*mat[3]+vect[2]*mat[6];
  var v2 = vect[0]*mat[1]+vect[1]*mat[4]+vect[2]*mat[7];
  var v3 = vect[0]*mat[2]+vect[1]*mat[5]+vect[2]*mat[8];
  return([v1,v2,v3]);
}

// change screen coordinates to coordinates on unit sphere. Shift key shifts to back of sphere.
function screen2vect(scrX,scrY,shiftKey) {
  var xCoord = (scrX-scrCenterX)/scrRadius;
  var yCoord = (scrCenterY-scrY)/scrRadius;
  var zCoord = Math.sqrt(1-xCoord*xCoord-yCoord*yCoord);
  if (shiftKey) {zCoord*=-1};
  return([xCoord,yCoord,zCoord]);
}

// change from unit sphere to screen coordinates. We skip the shift value, since we might not be on the sphere surface.
function vect2screen(vect) {
  var xx = vect[0]*scrRadius + scrCenterX;
  var yy = -vect[1]*scrRadius + scrCenterY;
  return([xx,yy]);
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
  posA=0;
  posB=0;
  mode = newMode;
  if (newMode ===3) {mode = document.getElementById("ngon").value;}
  draw();
}

function setSymN() {
  if (orbi > 7) {myRot = document.getElementById("symN").value;}
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

function setOrb(newOrbifold) {
  orbi = newOrbifold;
  switch (orbi) {
    case 1: // *532
      stack=[];
myRot = 5;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
symVects.push([0,1.6180339887498948482045868343656,1]);
      NumMaps = 24;
      break;
    case 2: // 532
      stack=[];
myRot = 5;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
symVects.push([0,1.6180339887498948482045868343656,1]);
      NumMaps = 12;
      break;
    case 3: // *432
      stack=[];
myRot = 4;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);


      NumMaps =12;
      break;
    case 4: // 432
      stack=[];
myRot = 4;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);

      NumMaps = 6;
      break;
    case 5: // *332
      stack=[];
myRot = 2;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
symVects.push([1,1,1]);
symVects.push([0,1,1]);

      NumMaps = 12;     
      break;
    case 6: // 3*2
      stack=[];
myRot = 2;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
symVects.push([1,1,1]);
      NumMaps = 12;
      break;
    case 7: // 332
      stack=[];
myRot = 2;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
symVects.push([1,1,1]);
      NumMaps = 6;
      break;
    case 8: // *22n
      stack=[];
myRot = document.getElementById("symN").value;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
      NumMaps = 4;
      break;
    case 9: // 2*n
      stack=[];
myRot = document.getElementById("symN").value;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
      NumMaps = 4;
      break;
    case 10: // 22n
      stack=[];
myRot = document.getElementById("symN").value;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
      NumMaps = 2;
      break;
    case 11: // n*
      stack=[];
myRot = document.getElementById("symN").value;
symVects=[];
symVects.push([0,1,0]);
      NumMaps = 2;
      break;
    case 12: // nx
      stack=[];
myRot = document.getElementById("symN").value;
symVects=[];
symVects.push([0,1,0]);
      NumMaps = 2;
      break;
    case 13: // *nn
      stack=[];
myRot = document.getElementById("symN").value;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
      NumMaps = 2;
      break;
    case 14: // nn
      stack=[];
myRot = document.getElementById("symN").value;
symVects=[];
symVects.push([0,1,0]);
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
          document.getElementById('astar532').checked = true;
          break;
        case 2: 
          document.getElementById('a532').checked = true;
          break;
        case 3: 
          document.getElementById('astar432').checked = true;
          break;
        case 4: 
          document.getElementById('a432').checked = true;
          break;
        case 5: 
          document.getElementById('astar332').checked = true;
          break;
        case 6: 
          document.getElementById('a3star2').checked = true;
          break;
        case 7: 
          document.getElementById('a332').checked = true;
          break;
        case 8: 
          document.getElementById('astar22n').checked = true;
          break;
        case 9: 
          document.getElementById('a2starn').checked = true;
          break;
        case 10: 
          document.getElementById('a22n').checked = true;
          break;
        case 11: 
          document.getElementById('anstar').checked = true;
          break;
        case 12: 
          document.getElementById('anx').checked = true;
          break;
        case 13: 
          document.getElementById('astarnn').checked = true;
          break;
        case 14: 
          document.getElementById('ann').checked = true;
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

function mousePressed(event) {
//alert(mode);
  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
  var shifty = event.shiftKey;
  posA = [canvasX,canvasY,shifty];
  posA3d = screen2vect(canvasX,canvasY,shifty);

//document.getElementById("myText").value = " " + posA3d;

  if (mode === -1) { // spin - rotate sphere
    backupStack = stack;
    backupSymVects = symVects;
  } // end spin

  if (mode === 0) { // edit - move points around
    shapeNum = -1;
    for (var i = 0; i < stack.length; ++i) {
      if (Math.abs(posA[0]-stack[i][1])<boxSize && Math.abs(posA[1]-stack[i][2])<boxSize) {
        shapeNum = i;
        controlPt = 1;
        break;
      }
      if (Math.abs(posA[0]-stack[i][3])<boxSize && Math.abs(posA[1]-stack[i][4])<boxSize) {
        shapeNum = i;
        controlPt = 3;
        break;
      } 
    } // end for loop
    if (orbi>8) { // move vector
      if (Math.abs(posA[0]-TranOrigx-TranBx)<boxSize && 
            Math.abs(posA[1]-TranOrigy-TranBy)<boxSize) {
        shapeNum = 0.5;
      }
    } // end move vector
  } // end mode === 0

  if (mode>0) { // mode > 0
    if (document.getElementById("snap").checked) { // snap 
      var movePt;
      movePt = snapTo(posA[0],posA[1]);
      posA[0] -= movePt[0];
      posA[1] -= movePt[1];
    } // end snap
  } // end mode > 0
} // end mousePressed()

function mouseMoved(event) {
  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
  var shifty = event.shiftKey;
  posB = [canvasX,canvasY, shifty];
  posB3d = screen2vect(canvasX,canvasY,shifty);

  if (mode === -1 && posA != 0) { // spin - rotate sphere
    // find difference in positions
    var posDiff = vectScale(vectDiff(posB,posA),1/scrRadius);
    posDiff[1] *= -1; // screen has Y flipped
    posDiff[2]=0; // ignore shiftkey
    var posDiffLeng = vectLeng(posDiff);
    var axis = cross(posDiff,[0,0,1]);
    // it just happens that for unit sphere the distance moved is about the angle in radians we want to turn
    var myMatrix = rotMat(axis,posDiffLeng);
    // recreate stack rotated the desired amount
    stack = [];
    backupStack.forEach(function(elem) {
      var pt1 = multVectMat([elem[1],elem[2],elem[3]],myMatrix);
      var pt2 = multVectMat([elem[4],elem[5],elem[6]],myMatrix);
      var newElem = [elem[0],pt1[0],pt1[1],pt1[2],pt2[0],pt2[1],pt2[2],elem[7],elem[8]];
      stack.push(newElem);
    });
    symVects = [];
    backupSymVects.forEach(function(elem) {
      var newElem = multVectMat([elem[0],elem[1],elem[2]],myMatrix);
      symVects.push(newElem);
    });
  } // end spin

  if (mode === 0 && shapeNum >= 0) { // edit - move points around
    if (shapeNum === 0.5) { // move vector
      TranBy = posB[1]-TranOrigy;
      if (orbi === 9 || orbi === 13) {
        H = TranBy/2;
      }
      if (orbi > 15) {
        TranBx = posB[0]-TranOrigx;
      }
      if (orbi === 14 || orbi === 15) {
        TranAy = -TranBy;
      }
    } else { // move control point
      stack[shapeNum][controlPt] = posB[0];
      stack[shapeNum][controlPt+1] = posB[1];
    }
  } // end move pts around

  draw();
} // end mouseMoved()

function mouseClicked(event) {
//alert("huyh?");
}

function mouseReleased(event) {
  shapeNum = -1; // we aren't moving control points around.
//alert(JSON.stringify(myColor));
  if (mode > 0) { // end of drawing
    undoStack = [];
    stack.push([mode,posA3d[0],posA3d[1],posA3d[2],posB3d[0],posB3d[1],posB3d[2],color,fill]);
  }
  posA = 0;
  posB = 0;
  posA3d=0;
  posB3d=0;
  draw();
} // end mouseReleased()

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



/*
function onVector() {
  var onVec = 2;
  if (Math.abs(posA[0]-baseX)<=boxSize 
         && Math.abs(posA[1]-baseY)<=boxSize )
          {onVec = 3; oldPoint = posA;};
  if (Math.abs(posA[0]-baseX-Ax)<=boxSize 
         && Math.abs(posA[1]-baseY-Ay)<=boxSize )
          {onVec = 4;oldPoint = posA;};
  if (Math.abs(posA[0]-baseX-Bx)<=boxSize 
         && Math.abs(posA[1]-baseY-By)<=boxSize )
          {onVec = 5;oldPoint = posA;};
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
    pointList.push(posB);
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

function MapOne(myMap, myOrbi,x,y,z) {
//alert(myOrbi);
  var xOut, yOut, zOut;
  switch (myOrbi) {
    case 1: // *532
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 13:
          var newPt = reflect(symVects[1],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 14:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 15:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 16:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 17:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 18:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 19:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 20:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 21:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 22:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 23:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 24:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end *532
      break;  
    case 2: // 532
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end 532
      break;  
    case 3: // *432
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = reflect(symVects[1],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end *432
      break;  
    case 4: // 432
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end 432
      break; 
    case 5: // *332
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = reflect(normalize(symVects[3]), [x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          newPt = reflect(normalize(symVects[3]), newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          newPt = reflect(normalize(symVects[3]), newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          newPt = reflect(normalize(symVects[3]), newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          newPt = reflect(normalize(symVects[3]), newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          newPt = reflect(normalize(symVects[3]), newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end *332
      break; 
    case 6: // 3*2
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = reflect(symVects[0],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          newPt = reflect(symVects[0], newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          newPt = reflect(symVects[0], newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = reflect(symVects[1], [x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          newPt = reflect(symVects[1], newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          newPt = reflect(symVects[1], newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = reflect(symVects[0],[x,y,z]);
          newPt = reflect(symVects[1], newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          newPt = reflect(symVects[0], newPt);
          newPt = reflect(symVects[1], newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          newPt = reflect(symVects[0], newPt);
          newPt = reflect(symVects[1], newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end 3*2
      break; 
    case 7: // 332
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],2*Math.PI/3));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[2],4*Math.PI/3));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end 332
      break; 
    case 8: // *22n
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = reflect(symVects[1],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = reflect(symVects[0],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = reflect(symVects[0],[x,y,z]);
          var newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end *22n
      break; 
    case 9: // 2*n
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = reflect(symVects[1],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = reflect(symVects[0],[x,y,z]);
          var symRotAng = Math.PI/myRot;
          var newPt = multVectMat(newPt,rotMat(symVects[0],symRotAng));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = reflect(symVects[0],[x,y,z]);
          var newPt = reflect(symVects[1],newPt);
          var symRotAng = Math.PI/myRot;
          var newPt = multVectMat(newPt,rotMat(symVects[0],symRotAng));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end 2*n
      break; 
    case 10: // 22n
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = reflect(symVects[0],[x,y,z]);
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end 22n
      break; 
    case 11: // n*
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = reflect(symVects[0],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end n*
      break; 
    case 12: // nx
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = reflect(symVects[0],[x,y,z]);
          var symRotAng = Math.PI/myRot;
          var newPt = multVectMat(newPt,rotMat(symVects[0],symRotAng));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end nx
      break; 
    case 13: // *nn
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = reflect(symVects[1],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end *nn
      break; 
    case 14: // nn
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
      } // end nn
      break; 
  } // end switch(myOrbi)
  return([xOut,yOut,zOut]);

} // end MapOne

function findLineBez(context, A, B, myColor, myColorLite ) {
  var pvect = normalize(cross(A,B));

  // are points of line on top or bottom of sphere?
  // lineMode 0=top,top. 1=bot,top. 2=top,bot. 3=bot,bot
  var lineMode = 0;
  if (A[2]<0) {lineMode = 1};
  if (B[2]<0) {lineMode += 2};

  var tanA = normalize(cross(pvect,A));
  var tanB = normalize(cross(B,pvect));

  if (lineMode === 1 || lineMode === 2) { // points on opposite sides of sphere
    // find major axis of ellipse. then bezier curve.
    var maj = normalize(cross([0,0,1],pvect));
    if (lineMode === 2) {maj = vectScale(maj,-1)}
    var tanMajA = normalize(cross(maj,pvect));
    var tanMajB = vectScale(tanMajA,-1);
    var myAngA = Math.acos(dot(maj,A));
    var myAngB = Math.acos(dot(maj,B));
    var k2A = .011 + .276*myAngA + .0436*myAngA*myAngA;
    var k2B = .011 + .276*myAngB + .0436*myAngB*myAngB;
    var midA = vectSum(A,vectScale(tanA,k2A));
    var midB = vectSum(B,vectScale(tanB,k2B));
    var midMajA = vectSum(maj,vectScale(tanMajA,k2A));
    var midMajB = vectSum(maj,vectScale(tanMajB,k2B));

    // first point to major axis.
    var pt1 = vect2screen(A);
    var pt2 = vect2screen(midA);
    var pt3 = vect2screen(midMajA);
    var pt4 = vect2screen(maj);

    // major axis to second point.
    var pt5 = vect2screen(B);
    var pt6 = vect2screen(midB);
    var pt7 = vect2screen(midMajB);
    var pt8 = vect2screen(maj);

    // Save the back arc as Bez
    if (lineMode === 1) {   
      rearBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColorLite, 0]);
    } else {
      rearBez.push([pt5[0],pt5[1],[[pt6[0],pt6[1],pt7[0],pt7[1],pt8[0],pt8[1]]],myColorLite, 0]);
    }
 
    // Save the near arc as Bez
    if (lineMode === 1) {   
      frontBez.push([pt5[0],pt5[1],[[pt6[0],pt6[1],pt7[0],pt7[1],pt8[0],pt8[1]]],myColor, 0]);
    } else {
      frontBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColor, 0]);
    }
  } else { // points on same side of sphere
    // find bezier curve
    var myAng = Math.acos(dot(A,B));
    var k2 = .011 + .276*myAng + .0436*myAng*myAng;
    var midA = vectSum(A,vectScale(tanA,k2));
    var midB = vectSum(B,vectScale(tanB,k2));
    var pt1 = vect2screen(A);
    var pt2 = vect2screen(midA);
    var pt3 = vect2screen(midB);
    var pt4 = vect2screen(B);
    if (lineMode === 3) {  
      rearBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColorLite, 0]);
    } else {
      frontBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColor, 0]);
    }
  }
} //end findLineBez

function findLineBez2(A, B) {
  var myReturn = [];
  var pvect = normalize(cross(A,B));

  // are points of line on top or bottom of sphere?
  // lineMode 0=top,top. 1=bot,top. 2=top,bot. 3=bot,bot
  var lineMode = 0;
  if (A[2]<0) {lineMode = 1};
  if (B[2]<0) {lineMode += 2};
//alert(lineMode);
  var tanA = normalize(cross(pvect,A));
  var tanB = normalize(cross(B,pvect));

  if (lineMode === 1 || lineMode === 2) { // points on opposite sides of sphere
    // find major axis of ellipse. then bezier curve.
    var maj = normalize(cross([0,0,1],pvect));
    if (lineMode === 2) {maj = vectScale(maj,-1)}
    var tanMajA = normalize(cross(maj,pvect));
    var tanMajB = vectScale(tanMajA,-1);
    var myAngA = Math.acos(dot(maj,A));
    var myAngB = Math.acos(dot(maj,B));
    var k2A = .011 + .276*myAngA + .0436*myAngA*myAngA;
    var k2B = .011 + .276*myAngB + .0436*myAngB*myAngB;
    var midA = vectSum(A,vectScale(tanA,k2A));
    var midB = vectSum(B,vectScale(tanB,k2B));
    var midMajA = vectSum(maj,vectScale(tanMajA,k2A));
    var midMajB = vectSum(maj,vectScale(tanMajB,k2B));

    // first point to major axis.
    var pt1 = vect2screen(A);
    var pt2 = vect2screen(midA);
    var pt3 = vect2screen(midMajA);
    var pt4 = vect2screen(maj);

    // major axis to second point.
    var pt5 = vect2screen(maj);
    var pt6 = vect2screen(midMajB);
    var pt7 = vect2screen(midB);
    var pt8 = vect2screen(B);

    // Save arcs as Bez
    if (lineMode === 1) {   
      myReturn.push([-1,pt1[0],pt1[1],pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]);
      myReturn.push([1,pt5[0],pt5[1],pt6[0],pt6[1],pt7[0],pt7[1],pt8[0],pt8[1]]);
    } else {
      myReturn.push([1,pt1[0],pt1[1],pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]);
      myReturn.push([-1,pt5[0],pt5[1],pt6[0],pt6[1],pt7[0],pt7[1],pt8[0],pt8[1]]);
    }
 
  } else { // points on same side of sphere
    // find bezier curve
    var myAng = Math.acos(dot(A,B));
    var k2 = .011 + .276*myAng + .0436*myAng*myAng;
    var midA = vectSum(A,vectScale(tanA,k2));
    var midB = vectSum(B,vectScale(tanB,k2));
    var pt1 = vect2screen(A);
    var pt2 = vect2screen(midA);
    var pt3 = vect2screen(midB);
    var pt4 = vect2screen(B);
    if (lineMode === 3) {  
      myReturn.push([-1,pt1[0],pt1[1],pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]);
    } else {
      myReturn.push([1,pt1[0],pt1[1],pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]);
    }
  }
  return(myReturn);
} //end findLineBez2

function findPolyBez(context, myMode, thisPoly, myColor, myColorLite, myFill ) {
//alert(thisPoly);
  if (myFill === 0) { // No fill.
    for (var i=1; i<thisPoly.length; i++) {
      findLineBez(context, thisPoly[i-1], thisPoly[i], myColor, myColorLite);
    }
    findLineBez(context, thisPoly[thisPoly.length-1], thisPoly[0], myColor, myColorLite);
  } else { // fill
    var rearBezList = [];
    var frontBezList = [];
    for (var i=0; i<thisPoly.length; i++) {
      var nextLineBez;
      if (i === 0) {      
        nextLineBez = findLineBez2(thisPoly[thisPoly.length-1],thisPoly[0]);
      } else {
        nextLineBez = findLineBez2(thisPoly[i-1], thisPoly[i]);
      }
      if (nextLineBez[0][0] === 1) {
        frontBezList.push(nextLineBez[0]);
      } else {
        rearBezList.push(nextLineBez[0]);
      }

      if (nextLineBez.length>1) { // two bez curves
        if (nextLineBez[0][0] === 1) { // front first
          if (rearBezList.length === 0 ) { 
            rearBezList.push(nextLineBez[1]);
          } else { // second time switching front/rear
            var x1 = rearBezList[rearBezList.length-1][7];
            var y1 = rearBezList[rearBezList.length-1][8];
            var x4 = nextLineBez[1][1];
            var y4 = nextLineBez[1][2];
            var xc = scrCenterX;
            var yc = scrCenterY;
            var ax = x1 - xc;
            var ay = y1 - yc;
            var bx = x4 - xc;
            var by = y4 - yc;
            var q1 = ax * ax + ay * ay;
            var q2 = q1 + ax * bx + ay * by;
            var k2 = (4/3) * (Math.sqrt(2 * q1 * q2) - q2) / (ax * by - ay * bx);
            var x2 = xc + ax - k2 * ay;
            var y2 = yc + ay + k2 * ax;
            var x3 = xc + bx + k2 * by;                               
            var y3 = yc + by - k2 * bx;
            rearBezList.push([1,x1,y1,x2,y2,x3,y3,x4,y4]);
            rearBezList.push(nextLineBez[1]);
            frontBezList.push([-1,x4,y4,x3,y3,x2,y2,x1,y1]);
          } // end second time switching
        } else { // back first
          if (frontBezList.length === 0 ) {
            frontBezList.push(nextLineBez[1]);
          } else { // second time switching front/rear
            var x1 = frontBezList[frontBezList.length-1][7];
            var y1 = frontBezList[frontBezList.length-1][8];
            var x4 = nextLineBez[1][1];
            var y4 = nextLineBez[1][2];
            var xc = scrCenterX;
            var yc = scrCenterY;
            var ax = x1 - xc;
            var ay = y1 - yc;
            var bx = x4 - xc;
            var by = y4 - yc;
            var q1 = ax * ax + ay * ay;
            var q2 = q1 + ax * bx + ay * by;
            var k2 = (4/3) * (Math.sqrt(2 * q1 * q2) - q2) / (ax * by - ay * bx);
            var x2 = xc + ax - k2 * ay;
            var y2 = yc + ay + k2 * ax;
            var x3 = xc + bx + k2 * by;                               
            var y3 = yc + by - k2 * bx;
            frontBezList.push([1,x1,y1,x2,y2,x3,y3,x4,y4]);
            frontBezList.push(nextLineBez[1]);
            rearBezList.push([-1,x4,y4,x3,y3,x2,y2,x1,y1]);
          } // end second time switching
        } // end back first
      } // end two bez curves  
    } // end loop through n-1 polygon edges



//var  asOutput = JSON.stringify([myListy,'front',frontBezList,'rear',rearBezList]);
 // txtToFile(asOutput,"test1","txt");
/*
    // connect the last edge of the polygon
    var nextLineBez = findLineBez2(thisPoly[thisPoly.length-1],thisPoly[0]);  
    if (nextLineBez[0][0] === 1) {
      frontBezList.push(nextLineBez[0]);
    } else {
      rearBezList.push(nextLineBez[0]);
    }
      if (nextLineBez.length>1) { // two bez curves
        if (nextLineBez[0][0] === 1) { // front first
          if (rearBezList.length === 0 ) {
            rearBezList.push(nextLineBez[1]);
          } else {
            rearBezList.push(nextLineBez[1]);
//alert(JSON.stringify(rearBezList));
          }
        } else { // back first
          if (frontBezList.length === 0 ) {
            frontBezList.push(nextLineBez[1]);
          } else {
            frontBezList.push(nextLineBez[1]);
          }

        }
      } // end two bez curves  
*/


    var tempBezList = [];
    if (rearBezList.length>0) {
      for (var i = 0;i<rearBezList.length;i++) {
        tempBezList.push([rearBezList[i][3],rearBezList[i][4],rearBezList[i][5],rearBezList[i][6],
                          rearBezList[i][7],rearBezList[i][8]]);
      }
      rearBez.push([rearBezList[0][1],rearBezList[0][2],tempBezList,myColorLite, 1]);
    }

    tempBezList = [];
    if (frontBezList.length>0) {
      for (var i = 0;i<frontBezList.length;i++) {
        tempBezList.push([frontBezList[i][3],frontBezList[i][4],frontBezList[i][5],frontBezList[i][6],
                          frontBezList[i][7],frontBezList[i][8]]);
      }
      frontBez.push([frontBezList[0][1],frontBezList[0][2],tempBezList,myColor, 1]);
    } 

  }
} //end findPolyBez

function findBez(context, myMode, myX1, myY1, myZ1, myX2, myY2, myZ2, myColor, myFill) {

  // hex to rgb
  var rgb = [
    parseInt(myColor.substr(-6,2),16),
    parseInt(myColor.substr(-4,2),16),
    parseInt(myColor.substr(-2),16)
  ];
  // find light version of myColor
  var lightFactor = .3
  rgb[0] = Math.round(255-(255-rgb[0])*lightFactor);
  rgb[1] = Math.round(255-(255-rgb[1])*lightFactor);
  rgb[2] = Math.round(255-(255-rgb[2])*lightFactor);
  var converting = (rgb[0] << 16) | (rgb[1] << 8) | (rgb[2] << 0);
  var myColorLite = '#' + (0x1000000 + converting).toString(16).slice(1);

  if (myMode === 1) { // line
    for (var map=1;map<=NumMaps;map++) {
      var posA3dZ = MapOne(map,orbi,myX1,myY1,myZ1);
      var posB3dZ = MapOne(map,orbi,myX2,myY2,myZ2);

      // rotate shapes around first axis.
      var symRotAng = 2*Math.PI/myRot;
      for (var i=0;i<myRot;i++) {
        var curMatrix = rotMat(symVects[0],symRotAng*i)
        var AA = multVectMat(posA3dZ,curMatrix);
        var BB = multVectMat(posB3dZ,curMatrix);
        findLineBez(context,AA,BB,myColor,myColorLite);
      }

    } // end map loop
  } // end line

  if (myMode === 2) { // circle
/*
    var myRadius = Math.sqrt((myX1-myX2)**2+(myY1-myY2)**2);
    for (var map=1;map<=NumMaps;map++) {
      var pt3 = MapOne(map,orbi,myX1,myY1);
      var pt4 = MapOne(map,orbi,myX2,myY2);
      for (var i=0;i<1;i++) {
        var xAdd1 = i*TranAx;
        var yAdd1 = i*TranAy;
        for (var j=0;j<1;j++) {
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
*/
  } // end circle
  if (myMode > 2) { // polygon
    // find vertices for original poly
    var angleStep = 2 * Math.PI / myMode;
    var myPoly = [];
    for (var k = 0;k<myMode;k++) {
      var nextVertex = multVectMat([myX2, myY2, myZ2],rotMat([myX1, myY1, myZ1],angleStep*k ));
      myPoly.push(nextVertex);
    } // end k loop
    
    // polygon remapped
    for (var map=1;map<=NumMaps;map++) {
      var mapPoly = [];
      myPoly.forEach(function(vertex) {
        mapPoly.push(MapOne(map,orbi,vertex[0],vertex[1],vertex[2]));
      });

      // polygon rotated around first axis.
      var symRotAng = 2*Math.PI/myRot;
      for (var i=0;i<myRot;i++) {
        var curMatrix = rotMat(symVects[0],symRotAng*i)
        var rotPoly = [];
        mapPoly.forEach(function(vertex) {
          rotPoly.push(multVectMat(vertex,curMatrix));
        });
        findPolyBez(context,myMode,rotPoly,myColor,myColorLite,myFill);
      } // end i loop
    } // end map loop
  } // end polygon
} // end findBez()

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

  frontBez = [];
  rearBez = [];

  // find bez of saved shapes
  context.lineWidth = 1;
  stack.forEach(function(nextShape) {
    findBez(context, nextShape[0],nextShape[1],nextShape[2],nextShape[3],nextShape[4],
              nextShape[5],nextShape[6],nextShape[7],nextShape[8]);
  });

  // find bez of current shape
// i want it to only do this if we are currently drawing a shape
  if (posA3d.length > 0) {
    findBez(context, mode,posA3d[0],posA3d[1],posA3d[2],posB3d[0],posB3d[1],posB3d[2],color,fill);
  }

  // draw rear Bez
  rearBez.forEach(function(bez) {
    context.beginPath();
    context.moveTo(bez[0],bez[1]);
    var partList = bez[2];
    partList.forEach(function(nextPart) {
      context.bezierCurveTo(nextPart[0],nextPart[1],nextPart[2],nextPart[3],nextPart[4],nextPart[5]);
    });

    if (bez[4] === 0) {
      context.lineWidth = 3;
      context.strokeStyle = bez[3];
      context.stroke();
    } else {
      context.save();
      context.globalAlpha = .7;  
      context.fillStyle = bez[3];
      context.fill();
      context.restore();
    }
  });

  // draw sphere outline
  context.beginPath();
  context.lineWidth = 2;
  context.arc(scrCenterX, scrCenterY,scrRadius,0,2*Math.PI);
  context.strokeStyle = "black";
  context.stroke();

  // draw front Bez
  frontBez.forEach(function(bez) {
    context.beginPath();
    context.moveTo(bez[0],bez[1]);
    var partList = bez[2];
    partList.forEach(function(nextPart) {
      context.bezierCurveTo(nextPart[0],nextPart[1],nextPart[2],nextPart[3],nextPart[4],nextPart[5]);
    });
    if (bez[4] === 0) {
      context.lineWidth = 3;
      context.strokeStyle = bez[3];
      context.stroke();
    } else {
      context.save();
      context.globalAlpha = .7; 
      context.fillStyle = bez[3];
      context.fill();
      context.restore();
    }
  });


if (mode ===0) {
// draw vector control point
  if (orbi > 8) { 
    context.rect(oldX+TranBx,oldY+TranBy,boxSize*2+1,boxSize*2+1);
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
