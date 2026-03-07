// use Weierstrass coordinates: (t,x,y) with -t^2+x^2+y^2=-1 and t>0 for hyperboloid model.
// call them WC. 

var startX, startY, endX, endY;
var hZoom = 1.5;
var orbi = 14;
var funDom = [];
var funDomMoreVert = [];
var funDomCent = [];
var genMats = [];
var matList = [];
var centList = [];


var NumMaps = 1;

var mode=1; // 0=edit, -1=spin, 1=line, 2=circle, n>=3 is polygon size
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
var epsilon = 0.0000001;
var maxT = 10;

var scrRadius = 200;
var scrCenterX;
var scrCenterY;
var posB3d = [];
var posA3d = [];
var asOutput;

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

//let blah = cross([-2,2.828,.172],[0,.172,-2.828]);
//alert(blah);
//regPolyMoreVert(5,4);


// 7,2,3
  funDom = [
    [1,0,0],
    [1.1523824355,0,0.5726999892],
    [1.1988801873,-0.2869260089,0.5958079967]
  ];


/*
// 8,2,3
  funDom = [
    [1,0,0],
    [1.3065629649,0,-.8408964153],
    [1.3938468501,0.3715793152,-0.8970718222]
  ];
*/

/*
// 5,3,2,2 Fails. the 3 vertex is twice the size it should be.
  funDom = [
    [1.2734126907,0.6838857342,0.3922756474],
    [1.5826770466,0,1.2267300574],
    [1,0,0],
    [1.1854652182,0.6366535821,0]
  ];
*/

/*
// 2,2,2,2,2,2 is failing. polygon crosses self
  funDom = [
    [1,0,0],
    [10.0676619958,10.0178749274,0],
    [11.273236387,11.2174874563,-0.5038192181],
    [5.622494188,5.4779592704,-0.7774336789],
    [2.4416640428,2.1292794551,0.6541347719],
    [1.0379417032,0,0.2780700979]
  ];
*/

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));
  genMats = [];
// this only works if generators are all reflections
  let polyLeng = funDom.length;
  let oldVertex = funDom[polyLeng-1];
  for (let i = 0;i<polyLeng;i++) {
    let myLine = points2Line(funDom[i],oldVertex);
    let myMat = hReflMat(myLine);
    oldVertex = funDom[i];
    genMats.push(myMat);
  }
  let genLeng = genMats.length;


  matList.push([
    [1,0,0],
    [0,1,0],
    [0,0,1]
  ]);
  centList.push(funDomCent);
  let matIndex = 0;
  let matMax = matList.length;
  while (matIndex <= matMax) {
    for (let i = 0;i<genLeng;i++) {
      let newMat = multMatMat(genMats[i],matList[matIndex]);
      let newCent = multMatVect(newMat,funDomCent);
//if (matMax === 23) {alert(newCent);};
      if (newCent[0] < maxT) {
        let isNew = 1;
        for (j=0;j<matMax;j++) {
          let thisDist = hDist(centList[j],newCent);
//if (matMax === 23 && j === 7) {alert(""+j+" "+thisDist+" "+centList[j]+" "+newCent+" "+hDist(centList[j],newCent));};
          if (thisDist < 0.001) {
            isNew = 0;
          } // end if
        } // end j loop
        if (isNew === 1) {
          centList.push(newCent);
          matList.push(newMat);
          matMax++;
        } // end if
      } // end in bounds
    } // end i loop
    matIndex++;
  } // end while loop


/*
  for (let i = 0;i<genLeng;i++) {
    matList.push(genMats[i]);
    centList.push(multMatVect(genMats[i],funDomCent));

//    for (let j = 0;j<genLeng;j++) {
//      let newMat = multMatMat(genMats[i],genMats[j]);
//      matList.push(newMat);
//      centList.push(multMatVect(newMat,funDomCent));

//      for (let k = 0;k<genLeng;k++) {
//        let newMat = multMatMat(multMatMat(genMats[i],genMats[j]),genMats[k]);
//        matList.push(newMat);
//        centList.push(multMatVect(newMat,funDomCent));
//      }

//    }

  }
*/

alert(JSON.stringify(genMats));

// multiply a matrix times a (column) vector to get a vector.
// multMatVect(mat, vect) {

// multiply two matrices. Since we use column vectors, the second matrix is the one applied first.
// multMatMat(M,N) {

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


// hyperbolic stuff

// hyperbolic dot product (bilinear form)
function hDot(P,Q) {
   return(-P[0]*Q[0]+P[1]*Q[1]+P[2]*Q[2]);
}

// normalized vector. 
function hNorm(P) {
  if (vectType(P) === 0) {
    let denom = 1/P[0]/Math.sqrt(2);
  } else {
    let denom = Math.sqrt(Math.abs(hDot(P,P)));
  }
  return([P[0]/denom,P[1]/denom,P[2]/denom]);
}

// normalized hyperbolic dot product
function normHDot(P,Q) {
   return(Math.abs(hDot(P,Q))/Math.sqrt(Math.abs(hDot(P,P)*hDot(Q,Q))));
}

// P - Q
function vectMinus(P,Q) {
  return([P[0]-Q[0],P[1]-Q[1],P[2]-Q[2]]);
}

// P + Q
function vectPlus(P,Q) {
  return([P[0]+Q[0],P[1]+Q[1],P[2]+Q[2]]);
}

// which point type? -1 is a point, 0 is an ideal point at infinity, 1 is for a line.
function vectType(P) {
  let type = 1;
  let inner = hDot(P,P);
  if (Math.abs(inner) < epsilon) {type = 0}
  else if (inner < 0) {type = -1}
  return (type); 
}

// checks if a point P is incident on a line L. P may be ideal.
function isIncident(P,L) {
  let incident = 0;
  if (Math.abs(hDot(P,L)) < epsilon) {incident = 1}
  return(incident); 
}

// checks if two lines intersect
function inIntersecting(L,M) {
  let perpVect = cross(L,M);
  return(hDot(perpVect,perpVect) <= epsilon);
}

// return a line through two hyperbolic points. (given by a normal vector.)
function points2Line(P,Q) {
  let dist = hDist(P,Q);
  let line = tRef(cross(P,Q));
  line[0] = line[0]/Math.sinh(dist);
  line[1] = line[1]/Math.sinh(dist);
  line[2] = line[2]/Math.sinh(dist);
 // may need to multiply by -1 at times?...Or do I care which vector?
  return(line);
}

// this finds the angle between two lines. We don't check that they intersect.
function findAngle(L,M) {
  return(Math.acos(normHDot(L,M)));
}

// this finds the distance between two lines that don't intersect. We don't check they don't intersect.
function findLineDist(L,M) {
  return(Math.acosh(normHDot(L,M)));
}

// hyperbolic distance between two points
function hDist(P,Q) {
  let N = Math.abs(hDot(P,Q))/Math.sqrt(Math.abs(hDot(P,P)*hDot(Q,Q)));
  if (N < 1) {N += epsilon}
  let dist = Math.acosh(N);
  return(dist);
}

// hyperbolic distance from a point to a line
function hDistPt2Line(P,L) {
  return(Math.asinh(normHDot(P,L)));
}

// average list of points
function avePts(ptList) {
  let polyLeng = ptList.length;
  let tSum = 0;
  let xSum = 0;
  let ySum = 0;
  for (let i = 0;i<polyLeng;i++) {
    tSum += ptList[i][0];
    xSum += ptList[i][1];
    ySum += ptList[i][2];
  }
  return([tSum/polyLeng,xSum/polyLeng,ySum/polyLeng]);
}

// reflect over xy plane: t = -t.
function tRef(P) {
  return([-P[0],P[1],P[2]]);
}

// reflect a point P over a line L
function reflPtOverLine(P,L) {
  return(vectMinus(P, scalarVect(-2*hDot(P,L)/hDot(L,L),L)));
}

// usual cross product
function cross(P,Q) {
  return([P[1]*Q[2]-P[2]*Q[1], P[2]*Q[0]-P[0]*Q[2], P[0]*Q[1]-P[1]*Q[0]]);
}

// find a line through P that is perpendicular to segment PQ. Not working right.
function perp2Seg(P,Q) {
  let seg = points2Line(P,Q);
  let newT = P[0];
  let newX = (seg[1]*P[0]*P[0]-P[1]*seg[0]*P[0])/(seg[1]*P[2]-P[1]*seg[2]);
  let newY = (P[0]*P[0]-P[1]*newX)/P[2];
  if (P[2] === 0) {
    newY = (seg[0]*P[0]-seg[1]*newX)/seg[2]
  }
  return([newT,newX,newY]);
}

// P-gons meeting Q at a point.
// find length of sides. P is center point. Q is vertex. Right triangle. 
function regPolySides(P,Q) {
  let alpha = Math.PI/P;
  let beta = Math.PI/Q;
  let c = Math.acosh(1/Math.tan(alpha)/Math.tan(beta));
  let a = Math.asinh(Math.sinh(c)*Math.sin(alpha));
  let b = Math.asinh(Math.sinh(c)*Math.sin(beta));
  return([a,b,c]);
}

// find vertices
function regPolyVertices(P,Q) {
  let lengths = regPolySides(P,Q);
  let vertices = [];
  let radius = lengths[2];
  for (let i = 0; i<P; i++) {
    let nextVert = polar2WC(radius,i*2*Math.PI/P);
    vertices.push(nextVert);
  }
  return(vertices);
}

// find in between points on reg. polygon edges.
function regPolyMoreVert(P,Q) {
  let extra = 3; // number of points to add per edge
  let vertices = regPolyVertices(P,Q);
  let moreVert = [];
  for (i=0;i<vertices.length-1;i++) {
    let lineVert = divSeg(vertices[i],vertices[i+1],extra);
    lineVert.pop(); // don't include endpoints twice
    moreVert = moreVert.concat(lineVert);
  }
  let lineVert = divSeg(vertices[vertices.length-1],vertices[0],extra);
  lineVert.pop(); // don't include endpoints twice
  moreVert = moreVert.concat(lineVert);
  return(moreVert);
}

// find in between points on polygon edges.
function polyMoreVert(vertices) {
  let extra = 3; // number of points to add per edge
//  let vertices = regPolyVertices(P,Q);
  let moreVert = [];
  for (i=0;i<vertices.length-1;i++) {
    let lineVert = divSeg(vertices[i],vertices[i+1],extra);
    lineVert.pop(); // don't include endpoints twice
    moreVert = moreVert.concat(lineVert);
  }
  let lineVert = divSeg(vertices[vertices.length-1],vertices[0],extra);
  lineVert.pop(); // don't include endpoints twice
  moreVert = moreVert.concat(lineVert);
  return(moreVert);
}

// Weierstrass Coordinates to hemisphere model
function WC2Hemi(P) {
  let newX = P[1]/P[0];
  let newY = P[2]/P[0];
  let newZ = Math.sqrt(1-(P[1]*P[1]+P[2]*P[2])/(P[0]*P[0]));
  return([newX,newY,newZ]);
}

// Weierstrass Coordinates to Klein model
function WC2Klein(P) {
  let newX = P[1]/P[0];
  let newY = P[2]/P[0];
  return([newX,newY]);
}

// Weierstrass Coordinates to Poincare disk model
function WC2PoinDisk(P) {
  let newX = P[1]/(P[0]+1);
  let newY = P[2]/(P[0]+1);
  return([newX,newY]);
}

// Weierstrass Coordinates to half plane model
function WC2HalfPlane(P) {
  let newX = 2*P[0]/(P[0]+P[1])*Math.sqrt(1-(P[1]*P[1]+P[2]*P[2])/(P[0]*P[0]))
  let newY = 2*P[2]/(P[0]+P[1]);
  return([newX,newY]);
}

// Weierstrass Coordinates to Free model. If free = 0, Klein. If free = 1, Poin. Disk. Try free > 1.
function WC2Free(P,free) {
  let newX = P[1]/(P[0]+free);
  let newY = P[2]/(P[0]+free);
  return([newX,newY]);
}

function polar2WC(radius, angle) {
  let t = Math.cosh(radius);
  let x = Math.sinh(radius)*Math.cos(angle);
  let y = Math.sinh(radius)*Math.sin(angle);
  return([t,x,y]);
}

function pt2Screen(P,zoom=1) {
  let x = P[1]/(P[0]+zoom);
  let y = P[2]/(P[0]+zoom);
  x = x*scrRadius + scrCenterX;
  y = -y*scrRadius + scrCenterY;
  return([x,y]);
}

function ptList2Screen(list,zoom=1) {
  let scrList = [];
  list.forEach(function(point) {
    scrList.push(pt2Screen(point,zoom));
  });
  return(scrList); 
}

//
function screen2Pt(scrPt,zoom=1) {
  let x = (scrPt[0]-scrCenterX)/scrRadius;
  let y = (-scrPt[1]+scrCenterY)/scrRadius;                                           
  let diskRadius = Math.sqrt(x*x+y*y);
  let a = 1-diskRadius*diskRadius;
  let b = -2*diskRadius*diskRadius*zoom;
  let c = -1-diskRadius*diskRadius*zoom*zoom;
  let Ht = (-b+Math.sqrt(b*b-4*a*c))/2/a;
  let Hx = x*(Ht+zoom);
  let Hy = y*(Ht+zoom);
  return([Ht,Hx,Hy]);
}

function normalize(P) {
  let denom = Math.sqrt(P[0]*P[0]+P[1]*P[1]+P[2]*P[2]);
  return([P[0]/denom,P[1]/denom,P[2]/denom]);
}

function hNorm(P) {
  let k = 1/Math.sqrt(Math.abs(hDot(P,P)));
  return(scalarVect(k,P)); 
}

function scalarVect(scal, vect) {
  return([vect[0]*scal,vect[1]*scal,vect[2]*scal]);
}

// multiply a matrix times a (column) vector to get a vector.
function multMatVect(mat, vect) {
  var v1 = vect[0]*mat[0][0]+vect[1]*mat[0][1]+vect[2]*mat[0][2];
  var v2 = vect[0]*mat[1][0]+vect[1]*mat[1][1]+vect[2]*mat[1][2];
  var v3 = vect[0]*mat[2][0]+vect[1]*mat[2][1]+vect[2]*mat[2][2];
  return([v1,v2,v3]);
}

// multiply two matrices. Since we use column vectors, the second matrix is the one applied first.
function multMatMat(M,N) {
  let L = [];
  let row = [];
  for (let i=0;i<3;i++) {
    row = [];
    for (let j=0;j<3;j++) {
      let element = 0;
      for (let k=0;k<3;k++) {
        element += M[i][k]*N[k][j];
      } // end k loop
      row.push(element);
    } // end j loop
    L.push(row);
  } // end i loop
  return(L);
}

// return a matrix that will reflect over a hyperbolic line
function hReflMat(line) {
  let mat = [];
  let row = [];
  let denom = hDot(line,line);
  for (let i=0;i<3;i++) {
    row = [];
    for (let j = 0;j<3;j++) {
      let element = -2*line[i]*line[j]/denom;
      if (j===0) {element *= -1};
      if (i===j) {element += 1};
      row.push(element);
    } // end j loop
    mat.push(row);
  } // end i loop
  return(mat);
}

// return a matrix that will switch two points
function hFlipMat(P,Q) {
  let mat = [];
  let row = [];
  let diff = vectMinus(P,Q);
  let denom = Math.sqrt(hDot(diff,diff));
  diff = scalarVect(1/denom,diff);
  for (let i=0;i<3;i++) {
    row = [];
    for (let j = 0;j<3;j++) {
      let element = -2*diff[i]*diff[j];
      if (j===0) {element *= -1};
      if (i===j) {element += 1};
      row.push(element);
    } // end j loop
    mat.push(row);
  } // end i loop
  return(mat);
}

// rotate about the origin by angle theta
function rotOrigMat(theta) {
  return([[1,0,0],[0,Math.cos(theta),-Math.sin(theta)],[0,Math.sin(theta),Math.cos(theta)]]);
}

// rotate about P by angle theta
function rotMat(P, theta) {
  let mat1 = hFlipMat(P,[1,0,0]);
  let mat2 = rotOrigMat(-theta);
  let mat3 = multMatMat(mat1,multMatMat(mat2,mat1));
  return(mat3);
}

// translate from [1,0,0] to P
function transOrigMat(P) {
  return([[P[0],P[1],P[2]],
	[P[1],P[1]*P[1]/(P[0]+1)+1,P[1]*P[2]/(P[0]+1)],
	[P[2],P[1]*P[2]/(P[0]+1),P[2]*P[2]/(P[0]+1)+1]]);
}

// translate from P to Q
function transMat(P,Q) {
  let pRefl = [];
  if (JSON.stringify(P) === "[1,0,0]") {
    pRefl = [[1,0,0],[0,1,0],[0,0,1]];
  } else {
    pRefl = hFlipMat(P,[1,0,0]);
  }
  let newQ = multMatVect(pRefl,Q);
  let trans1 = transOrigMat(newQ);
  let trans = multMatMat(pRefl,multMatMat(trans1,pRefl));
  return(trans);
}

// direct isometry from segment PQ to segment RS. Length must be the same and > 0.
function isomSeg2Seg(P,Q,R,S) {
  if (Math.abs(normHDot(P,Q)-normHDot(R,S)) >= epsilon) { return("Error. Don't match!") }
  else {
    let pointDiff1 = vectMinus(P,R); 
// need more help if pointDiff1 is ideal.
    let reflMat1 = hReflMat(pointDiff1);
    let QPrime = multMatVect(reflMat1,Q);
    let pointDiff2 = vectMinus(S,QPrime);
// need more help if pointDiff2 is ideal.
    let reflMat2 = hReflMat(pointDiff2);
    return(multMatMat(reflMat2,reflMat1));
  }
}

// orientation reversing isometry from segment PQ to segment RS. Length must be the same and > 0.
function isomSeg2SegFlip(P,Q,R,S) {
  if (Math.abs(normHDot(P,Q)-normHDot(R,S)) >= epsilon) { return("Error. Don't match!") }
  else {
    let baseMat = isomSeg2Seg(P,Q,R,S);
    let perpVect = cross(R,S);
    let reflMat = hReflMat(perpVect);
    return(multMatMat(reflMat,baseMat));
  }
}

// divide the segment PQ. Add n points between them. (Not evenly spaced.) return array of points.
function divSeg(P,Q,n) {
  let myList = [];
  for (let i = 0; i<n+2; i++) {
    let nextPt = [P[0]*(n+1-i)/(n+1)+Q[0]*i/(n+1), P[1]*(n+1-i)/(n+1)+Q[1]*i/(n+1), P[2]*(n+1-i)/(n+1)+Q[2]*i/(n+1)];
    nextPt = hNorm(nextPt);
    myList.push(nextPt);
  }
  return(myList);
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
    case 1: // *732
      stack=[];
myRot = 7;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
symVects.push([0,1.6180339887498948482045868343656,1]);
      NumMaps = 24;
      break;
    case 2: // 732
      stack=[];
myRot = 7;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
symVects.push([0,1.6180339887498948482045868343656,1]);
      NumMaps = 12;
      break;
    case 3: // *832
      stack=[];
myRot = 8;
symVects=[];
symVects.push([0,1,0]);
symVects.push([1,0,0]);
      NumMaps = 12;
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
          document.getElementById('astar732').checked = true;
          break;
        case 2: 
          document.getElementById('a732').checked = true;
          break;
        case 3: 
          document.getElementById('astar832').checked = true;
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
  posA = [canvasX,canvasY];
  let posWC = screen2Pt(posA);

alert(posWC);
/*
  posA3d = screen2vect(canvasX,canvasY,shifty);

//document.getElementById("myText").value = " " + posA3d;

  if (mode === -1) { // spin - rotate sphere
    backupStack = stack;
    backupSymVects = symVects;
  } // end spin

  if (mode === 0) { // edit - move points around
    shapeNum = -1;
    for (let i = 0; i < stack.length; ++i) {
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
*/
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


function MapOne(myMap, myOrbi,x,y,z) {
//alert(myOrbi);
  var xOut, yOut, zOut;
  switch (myOrbi) {
    case 1: // *732
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
      } // end *732
      break;  
    case 2: // 732
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
      } // end 732
      break;  
    case 3: // *832
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
      } // end *832
      break;  

  } // end switch(myOrbi)
  return([xOut,yOut,zOut]);

} // end MapOne









// given two hyperboloid points, draw segment on screen. Doesn't work
function drawSeg2(P,Q,context) {
  let scrP = pt2Screen(P,hZoom);
  let scrQ = pt2Screen(Q,hZoom);

  let R = cross(P,Q);
  let refR = tRef(R);
  let S;
  if (JSON.stringify(R) === JSON.stringify(refR)) {
    S = cross(R,[1,0,0]);
  } else {
    S = cross(R,refR);
  }
  let T = cross(S,R);
  S = hNorm(S);
  T = hNorm(T);
alert([S,T]);
  let a = Math.log(P[0]/2 + Math.sqrt(P[0]*P[0]-4*T[0])/2);
  let b = Math.log(Q[0]/2 + Math.sqrt(Q[0]*Q[0]-4*T[0])/2);
  let i = a;
//alert([P,Q]);
  for (i=-1.5;i<-.5;i+=.1) {
   let newPoint = vectPlus(scalarVect(Math.cosh(i),T),scalarVect(Math.sinh(i),S));
//   alert([i,newPoint]);
  }

/*

  let U = cross(R,[1,0,0]);
  let V = cross(R,U);
  let rescale = 0.2/V[0];
  V = scalarVect(rescale,V);
//alert(JSON.stringify([P,Q,R,U,V]));
  let pParam = Math.log(P[0]/V[0]/2+Math.sqrt(P[0]*P[0]/V[0]/V[0]-4)/2);
  let qParam = Math.log(Q[0]/V[0]/2+Math.sqrt(Q[0]*Q[0]/V[0]/V[0]-4)/2);
//alert([pParam, qParam]);
//alert(hDot(U,V));

//alert(P);
  context.beginPath();
  context.moveTo(scrP[0],scrP[1]);
  for (let W = -5; W<5; W++) {
 //   let nextParam = pParam+W*(qParam-pParam)/4;
 let nextParam = W/5;
//alert([nextParam,U[0]*Math.sinh(nextParam)+V[0]*Math.cosh(nextParam),
 //                U[1]*Math.sinh(nextParam)+V[1]*Math.cosh(nextParam),
  //               U[2]*Math.sinh(nextParam)+V[2]*Math.cosh(nextParam)]);

    let nextPt = [U[0]*Math.sinh(nextParam)+V[0]*Math.cosh(nextParam),
                 U[1]*Math.sinh(nextParam)+V[1]*Math.cosh(nextParam),
                 U[2]*Math.sinh(nextParam)+V[2]*Math.cosh(nextParam)];
    let scrNext = pt2Screen(nextPt,hZoom);

    context.lineTo(scrNext[0],scrNext[1]);
    context.strokeStyle = "blue";
    context.stroke();

  }
  context.closePath();
*/
} // end drawSeg2 failing...



// draw segment. Not stand alone - part of polygon...?
function drawSeg(P,Q,context) {
  let lineVert = divSeg(P,Q,5);
  let polyLeng = lineVert.length;
  let scrVertices = ptList2Screen(lineVert,hZoom);
  scrVertices.forEach(function(vertex) {
    context.lineTo(vertex[0],vertex[1]);
  });
}


function seg3(context) {
  let p = 1;
  let alpha = 1;
  let r = Math.atanh(Math.tanh(p)/Math.cos(-alpha));
  let WC = polar2WC(r,0);
  let a = -.2;
let u = [0,-.172,2.828];
let v = [.2,.14,.0085];
  let nextPt = vectPlus(scalarVect(Math.sinh(a),u), scalarVect(Math.cosh(a),v));

  let newCoord = pt2Screen(nextPt, hZoom);
  context.beginPath();
  context.moveTo(newCoord[0],newCoord[1]);

    for (let w = a; w < .8; w += .1) {
    nextPt = vectPlus(scalarVect(Math.sinh(w),u), scalarVect(Math.cosh(w),v));
    newCoord = pt2Screen(nextPt, hZoom);
    context.lineTo(newCoord[0],newCoord[1]);
    context.stroke();

  }
    context.closePath();
}



function seg2(context) {
  let p = 1;
  let alpha = 1;
  let r = Math.atanh(Math.tanh(p)/Math.cos(-alpha));
  let WC = polar2WC(r,0);

  let newCoord = pt2Screen(WC, hZoom);
  context.moveTo(newCoord[0],newCoord[1]);
//  for (let theta = 0; theta < 1.5; theta += .1) {
    for (let theta = alpha-Math.PI/3; theta < alpha+Math.PI/3; theta += .1) {
    r = Math.atanh(Math.tanh(p)/Math.cos(theta-alpha));
    WC = polar2WC(r,theta);
    newCoord = pt2Screen(WC, hZoom);
    context.lineTo(newCoord[0],newCoord[1]);
    context.stroke();
  }
}


function txtToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: "text/plain", endings: "native"});
  
  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
};

function goSave() {
  asOutput = JSON.stringify(centList);
  asOutput = asOutput.concat("**");
  asOutput = asOutput.concat(JSON.stringify(matList));
  let thisFile = "myData";
  txtToFile(asOutput,thisFile,"txt");
}




function draw() {
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  context.beginPath();
  context.rect(0,0,c.width,c.height);
  context.fillStyle = "white";
  context.fill();

  c.height = window.innerHeight-220;
  c.width = window.innerWidth-205;
  scrCenterX = Math.round(c.width/2);
  scrCenterY = Math.round(c.height/2);
//  scrRadius = Math.min(scrCenterX,scrCenterY)-5;
  scrRadius = (scrCenterX+scrCenterY)/2;

  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);

  // draw circle outline
  context.beginPath();
  context.lineWidth = 2;
  context.arc(scrCenterX, scrCenterY,scrRadius,0,2*Math.PI);
  context.strokeStyle = "black";
  context.stroke();
  context.closePath();

//  let vertices = funDom;
  let moreVertices = funDomMoreVert;

//let vertices = regPolyVertices(7,3);
//let moreVertices = regPolyMoreVert(7,3);
//let vertices = [[1,0,0],[Math.sqrt(2),1,0],[3,2,2]];


  let polyLeng = matList.length;
  for (let i = 0;i<polyLeng;i++) {
    let newVertices = [];
    moreVertices.forEach(function(vertex) {
      newVertices.push(multMatVect(matList[i], vertex));
    });
    let newCent = centList[i];

    let morePolyLeng = moreVertices.length;
    scrVertices = ptList2Screen(newVertices,hZoom);
    context.beginPath();
    context.moveTo(scrVertices[morePolyLeng-1][0],scrVertices[morePolyLeng-1][1]);
    scrVertices.forEach(function(vertex) {
      context.lineTo(vertex[0],vertex[1]);
    });
    context.stroke();
    context.fillStyle = "yellow";
    context.fill();
    context.closePath();

    scrVertices = ptList2Screen([newCent],hZoom);
    scrX = scrVertices[0][0];
    scrY = scrVertices[0][1];

    context.beginPath();
    context.rect(scrX-2,scrY-2,5,5);
    context.stroke();
    context.fillStyle = "red";
    context.fill();
    context.closePath();
  }

/*
  let polyLeng = vertices.length;
  let oldVertex = vertices[polyLeng-1];
  for (let i = 0;i<polyLeng;i++) {
    let myLine = points2Line(vertices[i],oldVertex);
    let myMat = hReflMat(myLine);
    let newVertices = [];
    oldVertex = vertices[i];

    moreVertices.forEach(function(vertex) {
      newVertices.push(multMatVect(myMat, vertex));
    });

    let morePolyLeng = moreVertices.length;
    scrVertices = ptList2Screen(newVertices,hZoom);

    context.beginPath();
    context.moveTo(scrVertices[morePolyLeng-1][0],scrVertices[morePolyLeng-1][1]);
    scrVertices.forEach(function(vertex) {
      context.lineTo(vertex[0],vertex[1]);
    });
    context.stroke();
    context.fillStyle = "yellow";
    context.fill();
    context.closePath();
  }
*/

} // end draw()
