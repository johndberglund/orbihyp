let handle = 0;
let crosscap = 0;
let cone = [7,3,4];
let kali = [];
// infCount is for the inf. edges (ultra parallel lines)
let infCount = 0; // these count down negative, telling which ulta parallel "infinity" angle it is.
// For infArray, the zeroth entry is 0. Following entries at -infCount will look like [4,2] or [3,2,0]
let infArray = [0]; // The numbers are: step number, length and twist. (if there's a twist)
let newCone = JSON.parse(JSON.stringify(cone));
let newKali = []; // note that newKali will have one less layer of [] than kali, since it's just one.
let atomList = []; // each atom will look like ["pillow",7,3,-2] with the positive numbers being angles and negatives being ultraparallel 
let newSheet = [];
let newPillow = [];
let maxInfJoin;

let FDVerts = []; // elements will look like [atom#, atomVert#, FDMapVert, isDirect]
// Do the first two in the first pass then add then following. I may want to save the coordinates here?

let paramSegs = []; // The first element is 0. Other elements are 
// [startAtom#, startAtomVert#, endAtom#, endAtomVert#, twist] Note that twist = -1 if no twist. twist is in [0,1)
// if twist exists.

// use Weierstrass coordinates: (t,x,y) with -t^2+x^2+y^2=-1 and t>0 for hyperboloid model.
// call them WC. 

var startX, startY, endX, endY;
var hZoom = 1;
var orbi = 14;
var funDom = [];
var funDomMoreVert = [];
var funDomCent = [];
var genMats = [];
var matList = [];
var centList = [];
var moveMat = [
    [1,0,0],
    [0,1,0],
    [0,0,1]
  ];
var tempMat = [];
var atomPtList = [];

var NumMaps = 1;

var mode=1; // -1=pan, 0=edit, 1=line, 2=circle, n>=3 is polygon size
var atomType = 0; // 0=sheet, 1=pCase, 2=pillow
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
var maxT = 50;
var tileMethod = 1;

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

// why am I drawing here? do it in draw()...?
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

reDo();

} // end init


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

function setAtom(newType) {
  atomType = newType;
  reDo();
}

function reDo() {
  handle = Number(document.getElementById("handle").value);
  crosscap = Number(document.getElementById("crosscap").value);
  cone = JSON.parse(document.getElementById("cone").value);
  kali = JSON.parse(document.getElementById("kali").value);
  infCount = 0;
  infArray = [0];
  newCone = JSON.parse(JSON.stringify(cone));
  newKali = []; // note that newKali will have one less layer of [] than kali, since it's just one.
  atomList = [];
  orbi2Atoms();
  atomList.reverse(); // so we start with the most connections.

console.log(JSON.stringify([handle,crosscap,cone,kali]));
console.log(JSON.stringify(atomList));
console.log(JSON.stringify(infArray));

  let infJoins = [0];
  for (let i = 1;i<infArray.length;i++) {
    infJoins.push([]);
  }

  atomPtList = [];
  for (let i = 0; i<atomList.length; i++) {
    let nextAtom = atomList[i];
    let nextType = nextAtom[0];
    let paramList = [];
    let nextShape;

    
    for (let j = 1; j<nextAtom.length;j++) {
      if (nextAtom[j]>0) {
        paramList.push(nextAtom[j]);
      } else {
        paramList.push(infArray[-nextAtom[j]][1]);
// need more params if twist? No, cause we're just doing shape. Twist will affect joins.
        let joinCoords = findJoinCoords(nextType,j);
        infJoins[-nextAtom[j]].push([i,joinCoords[0],joinCoords[1]]);
      }
    } // end nextAtom loop
    
//alert(JSON.stringify(infJoins));
//alert(JSON.stringify([i,nextType,paramList,nextAtom]));
//alert(JSON.stringify(infArray));

    nextShape = getAtom(nextType,paramList);

// where to place this atom?
// it will always connect to one of the previous.
// join only from rules 7,8,9.
// start at 1-maxInfJoin to only join inf from rules 7,8,9
// *** need to add twist for rule 8.

    if (i > 0) { // move nextShape to fit with previous shapes. 
      for (let j=1-maxInfJoin;j<infJoins.length;j++) {
        if ((infJoins[j].length > 1) && (infJoins[j][1][0] === i)) {
          let currentMat = isomSeg2Seg(nextShape[infJoins[j][1][1]],nextShape[infJoins[j][1][2]],
                                       atomPtList[infJoins[j][0][0]][infJoins[j][0][2]],
                                       atomPtList[infJoins[j][0][0]][infJoins[j][0][1]]);
          for (let k = 0;k<nextShape.length;k++) {
            nextShape[k]=multMatVect(currentMat,nextShape[k]);
          } // end k loop
          j = infJoins.length; // find first match. Then stop.
        } // end if
      } // end j loop
    } // end if i > 0

console.log(JSON.stringify(nextShape));
console.log(JSON.stringify(distNAng(nextShape)));

    atomPtList.push(nextShape);
  } // end atomList loop

console.log(JSON.stringify(infJoins));
console.log("*");
console.log(JSON.stringify(atomPtList));

// here trace around the atoms to find funDom.

  let currentAtom = 0;
  let currentVert = 0;
  let vertList = [];

  let maxIter = 10000;
  for (let iter = 0; iter < maxIter; iter++) {
    let nVerts = atomPtList[currentAtom].length;
    let nextVert = (currentVert + 1) % nVerts;

    // Choice A: does edge (currentVert, nextVert) connect to another atom?
    let foundJoin = false;
    for (let j = 1 - maxInfJoin; j < infJoins.length; j++) {
      if (infJoins[j].length < 2) continue;
      for (let matchIdx = 0; matchIdx <= 1; matchIdx++) {
        if (infJoins[j][matchIdx][0] === currentAtom &&
            infJoins[j][matchIdx][1] === currentVert &&
            infJoins[j][matchIdx][2] === nextVert) {
          let otherIdx = 1 - matchIdx;
          currentAtom = infJoins[j][otherIdx][0];
          currentVert = infJoins[j][otherIdx][2]; // vertex coinciding with currentVert
          foundJoin = true;
          break;
        }
      }
      if (foundJoin) break;
    }

    if (!foundJoin) {
      // Choice A: No — advance along boundary
      vertList.push([currentAtom, currentVert]);
      currentVert = nextVert;
    }

    // Choice B: back at [0,0]?
    if (currentAtom === 0 && currentVert === 0) {
      break;
    }
  }

  funDom = vertList.map(([atom, vert]) => atomPtList[atom][vert]);
  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));




/*
// edit this to find all isometries of all edges of each atom.
// If they move the center too near to a previous center, don't count this isometry.
//
 let genLeng = genMats.length;
  matList = [];
  centList = [];
  if (tileMethod === 1) { // all within some radius
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
        if (newCent[0] < maxT) {
          let isNew = 1;
          for (let j=0;j<matMax;j++) {
            let thisDist = hDist(centList[j],newCent);
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

*/



genMats = [
    [1,0,0],
    [0,1,0],
    [0,0,1]
  ];

  tileIt();
  draw();



//console.log(funDom);

/*


  funDom = [atomPtList[2][3],atomPtList[2][4],atomPtList[2][0],
            atomPtList[1][2],atomPtList[1][3],atomPtList[0][4]];
//alert(JSON.stringify(funDom));

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));

  genMats = [];
  myMat = isomSeg2Seg(funDom[1],funDom[0],funDom[1],funDom[2]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[2],funDom[3],funDom[2],funDom[3]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[3],funDom[4],funDom[3],funDom[4]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[4],funDom[5],funDom[4],funDom[5]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[5],funDom[0],funDom[5],funDom[0]);
  genMats.push(myMat);

//alert(JSON.stringify(genMats));

  tileIt();
  draw();
*/






/*
  let nextAtom = atomList[0];
//alert(nextAtom[1]);

  funDom = getSheet(nextAtom[1],nextAtom[2],nextAtom[3]);
//alert(funDom);
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
//alert(input1);
  tileIt();

  draw();
*/

} // end reDo()



function findJoinCoords(atomType,myIndex) {
  let outCoords = [];
  switch(atomType) {
    case "S4":
    case "S5":
    case "S6":
      outCoords.push(2*myIndex-2);
      break;
    case "C5":
    case "C6":
      outCoords.push(7-3*myIndex);
      break;
    case "P4":
    case "P5":
    case "P6":
      outCoords.push(3*(myIndex-1));
      break;
  }
  outCoords.push(outCoords[0]+1);
  return(outCoords);
} // end findJoinCoords()


// atomEdge(atomType, vertNum):
// Given an edge of an atom — from vertNum to (vertNum+1) mod nVerts —
// return [mappedVertNum, isDirect] for edges that map to another edge of the same atom,
// or -1 for step edges (whose gluing is determined by the orbifold rules).
// Reflection edges map to themselves with isDirect = false.
function atomEdge(atomType, vertNum) {
  switch(atomType) {
    case "S3":
      // All three edges are reflections
      return [vertNum, false];
    case "S4":
      // Edge 0 (0→1): step edge; edges 1 (1→2), 2 (2→3), 3 (3→0): reflections
      if (vertNum === 0) return -1;
      return [vertNum, false];
    case "S5":
      // Edges 0 (0→1), 2 (2→3): step edge; edges 1 (1→2), 3 (3→4), 4 (4→0): reflections
      if (vertNum === 0 || vertNum === 2) return -1;
      return [vertNum, false];
    case "S6":
      // Edges 0 (0→1), 2 (2→3), 4 (4→5): step edge; edges 1 (1→2), 3 (3→4), 5 (5→0): reflections
      if (vertNum === 0 || vertNum === 2 || vertNum === 4) return -1;
      return [vertNum, false];
    case "C3":
      // Edge 0 (0→1) and edge 2 (2→0) identify via isomSeg2Seg(v0,v1,v0,v2); edge 1 (1→2) is a reflection.
      // C3 never joins other atoms.
      if (vertNum === 0) return [2, true];
      if (vertNum === 1) return [1, false]; // reflection: isomSeg2SegFlip(v1,v2,v1,v2)
      if (vertNum === 2) return [0, true];
      break;
    case "C4":
      // Edge 2 (2→3) and edge 0 (0→1) identify via isomSeg2Seg(v2,v3,v1,v0);
      // edge 3 (3→0) is a reflection; edge 1 (1→2) is a crosscap step edge.
      // C4 never joins other atoms.
      if (vertNum === 0) return [2, true];
      if (vertNum === 1) return -1; // crosscap step edge
      if (vertNum === 2) return [0, true];
      if (vertNum === 3) return [3, false]; // reflection: isomSeg2SegFlip(v3,v0,v3,v0)
      break;
    case "C5":
      // Edge 4 (4→0) and edge 3 (3→4) identify via isomSeg2Seg(v4,v0,v4,v3);
      // edges 0 (0→1) and 2 (2→3) are reflections; edge 1 (1→2) is a step edge.
      if (vertNum === 0) return [0, false]; // reflection: isomSeg2SegFlip(v0,v1,v0,v1)
      if (vertNum === 1) return -1; // step edge
      if (vertNum === 2) return [2, false]; // reflection: isomSeg2SegFlip(v2,v3,v2,v3)
      if (vertNum === 3) return [4, true];
      if (vertNum === 4) return [3, true];
      break;
    case "C6":
      // Edge 5 (5→0) and edge 3 (3→4) identify via isomSeg2Seg(v5,v0,v4,v3);
      // edges 0 (0→1) and 2 (2→3) are reflections; edges 1 (1→2) and 4 (4→5) are boundaries.
      if (vertNum === 0) return [0, false]; // reflection: isomSeg2SegFlip(v0,v1,v0,v1)
      if (vertNum === 1) return -1; // step edge
      if (vertNum === 2) return [2, false]; // reflection: isomSeg2SegFlip(v2,v3,v2,v3)
      if (vertNum === 3) return [5, true];
      if (vertNum === 4) return -1; // step edge
      if (vertNum === 5) return [3, true];
      break;
    case "P3":
      // Insert mid1=midPoint(v0,v1) between v0 and v1 → 6 verts: 0=v0,1=mid1,2=v1,3=v2,4=v3,5=v4
      // All edges pair via isomSeg2Seg; no step edges or reflection edges.
      if (vertNum === 0) return [5, true];
      if (vertNum === 1) return [2, true];
      if (vertNum === 2) return [1, true];
      if (vertNum === 3) return [4, true];
      if (vertNum === 4) return [3, true];
      if (vertNum === 5) return [0, true];
      break;
    case "P4":
      // Insert mid1=midPoint(v1,v2) between v1 and v2 → 7 verts: 0=v0,1=v1,2=mid1,3=v2,4=v3,5=v4,6=v5
      // Edge 0 (v0→v1) is a step edge.
      if (vertNum === 0) return -1; // step edge
      if (vertNum === 1) return [6, true];
      if (vertNum === 2) return [3, true];
      if (vertNum === 3) return [2, true];
      if (vertNum === 4) return [5, true];
      if (vertNum === 5) return [4, true];
      if (vertNum === 6) return [1, true];
      break;
    case "P5":
      // Insert mid1=midPoint(v1,v2) between v1 and v2 → 8 verts: 0=v0,1=v1,2=mid1,3=v2,4=v3,5=v4,6=v5,7=v6
      // Edges 0 (v0→v1) and 3 (v2→v3) are step edges.
      if (vertNum === 0) return -1; // step edge
      if (vertNum === 1) return [7, true];
      if (vertNum === 2) return [4, true];
      if (vertNum === 3) return -1; // step edge
      if (vertNum === 4) return [2, true];
      if (vertNum === 5) return [6, true];
      if (vertNum === 6) return [5, true];
      if (vertNum === 7) return [1, true];
      break;
    case "P6":
      // Insert mid1=midPoint(v1,v2) between v1 and v2 → 9 verts: 0=v0,1=v1,2=mid1,3=v2,4=v3,5=v4,6=v5,7=v6,8=v7
      // Edges 0 (v0→v1), 3 (v2→v3), and 6 (v5→v6) are step edges.
      if (vertNum === 0) return -1; // step edge
      if (vertNum === 1) return [8, true];
      if (vertNum === 2) return [4, true];
      if (vertNum === 3) return -1; // step edge
      if (vertNum === 4) return [2, true];
      if (vertNum === 5) return [7, true];
      if (vertNum === 6) return -1; // step edge
      if (vertNum === 7) return [5, true];
      if (vertNum === 8) return [1, true];
      break;
    default:
      return -1;
  }
} // end atomEdge()


function distNAng(shape) {
  let distList = []; // edge lengths
  let dist2List = []; // lengths between vertices two apart.
  let angList = [];

  for (let i = 0; i< shape.length-1;i++) {
    distList.push(hDist(shape[i],shape[i+1]));
  }
  distList.push(hDist(shape[shape.length-1],shape[0]));

  for (let i = 0; i< shape.length-2;i++) {
    dist2List.push(hDist(shape[i],shape[i+2]));
  }
  dist2List.push(hDist(shape[shape.length-2],shape[0]));
  dist2List.push(hDist(shape[shape.length-1],shape[1]));
  
  let cosh1 = Math.cosh(distList[shape.length-1]);
  let cosh2 = Math.cosh(distList[0]);
  let sinh1 = Math.sqrt(cosh1*cosh1-1);
  let sinh2 = Math.sqrt(cosh2*cosh2-1);
  let nextAngle = Math.acos((cosh1*cosh2 - Math.cosh(dist2List[shape.length-1]))/(sinh1*sinh2));
  nextAngle = 360/(nextAngle/Math.PI*180);
  angList.push(nextAngle);
  for (let i = 0; i< shape.length-1;i++) {
    cosh1 = Math.cosh(distList[i]);
    cosh2 = Math.cosh(distList[i+1]);
    sinh1 = Math.sqrt(cosh1*cosh1-1);
    sinh2 = Math.sqrt(cosh2*cosh2-1);
    nextAngle =Math.acos((cosh1*cosh2 - Math.cosh(dist2List[i]))/(sinh1*sinh2));
    nextAngle = 360/(nextAngle/Math.PI*180);
    angList.push(nextAngle);
  }
  return([distList,angList]);
} // end distNAng()


function getAtom(thisType,thisParamList) {
  let thisShape;
  if (thisType.substring(0,1) === "S") { 
    thisShape = getSheet(thisType,thisParamList);
//alert(thisShape);
  } else if (thisType.substring(0,1) === "C") {
    thisShape = getPCase(thisType,thisParamList);
//alert(thisShape);
  } else if (thisType.substring(0,1) === "P") {
    thisShape = getPillow(thisType,thisParamList);
//alert(thisShape);
  }
  return(thisShape);
} // end getAtom()

function changeParams() {
// We will do this by moving a paramSeg[] endpoint. 
//Or by moving the twist parameter along the segment between the endpoints.
	// method: store the coordinates of the segments and twist points in the base fundamental domain coordinate system. 
	//Refind all origin atoms. Reglue to make the origin F.D. Refind the paramSegs[]. Map the coordinates of the new paramSegs{}
	// to the saved coordinaters, including direct or flipped.
} // end changeParams()




// this will process the orbifold and output the atoms.
// For angles, we have a positive integer, telling how many repeats in 360 degrees.
// Whenever we have ultra parallel lines instead of an angle, there is some distance between the lines.
// We keep track of these "infinities" with infCount. We use negative integers to index which infinity.
// We will have a length for all such infinities and sometimes a twist.
// It sets atomList and infArray
function orbi2Atoms() {

  for (let i = 0; i<handle; i++) { // step 3: remove handle.
    infCount--;
    newCone.push(infCount);
    newCone.push(infCount);
    infArray.push([3,2,0]); // step 3. length 2. twist 0.
  }

  //alert(JSON.stringify([3,newCone,newKali,infArray,atomList]));

//  alert(JSON.stringify([handle, crosscap, cone, kali]));
  for (let i = 0; i<crosscap; i++) { // step 2: remove crosscap. 
    infCount--;
    newCone.push(infCount);
    infArray.push([2,2]); // step 2, length 2
  }

  //alert(JSON.stringify([2,newCone,newKali,infArray,atomList]));

  if (kali.length > 0) { // here there are kaleidoscopes
    for (let i=0; i< kali.length; i++) { // ensure "2" corners adjacent if possible.
      if (kali[i].length >1) {
        for (let j=0; j<kali[i].length-1; j++) {
          if (kali[i][j] != 2) {
            kali[i] = kali[i].slice(j).concat(kali[i].slice(0, j));
            break; // break from j loop
          }
        } // end j loop
      }
    } // end i loop

    newKali = JSON.parse(JSON.stringify(kali[0]));
    if (kali.length > 1) { // step 1. Join kalis.

      let minInfCount = infCount;
      newKali = JSON.parse(JSON.stringify(kali[0]));
      for (let i=1;i<kali.length;i++) { 
        infCount--;
        newKali.push(infCount);
        infArray.push([1,2]); // step 1. length 2
        newKali.push(...kali[i]);
      } // end i loop through all kalis
      for (let i=infCount;i<minInfCount ;i++) { // add matching inf edges
        newKali.push(i);
      }
    } // end step 1

  //alert(JSON.stringify([1,newCone,newKali,infArray,atomList]));

    for (let i=0; i<newCone.length; i++) { // step 4. "2" cone and kali.
      if (newCone[i] === 2) { // remove cone. add corner.
        newCone.splice(i, 1);
        infCount--;
        newKali.push(infCount);
        infArray.push([4,2]); // step 4. length 2
        i--;
      }
    } // end step 4

  //alert(JSON.stringify([4,newCone,newKali,infArray,atomList]));

    for (let i=0; i<newKali.length-1; i++) {   // step 6. "22" corners adjacent
      if ((newKali[i] === 2) && (newKali[i+1] === 2)) {
        infCount--;
        newKali.splice(i, 2,infCount);
        infArray.push([6,2]); // step 6. length 2
      } 
    } // end step 6

  //alert(JSON.stringify([6,newCone,newKali,infArray,atomList]));

    maxInfJoin = infCount;
    let pCaseName;
    if ((newCone.length === 1) && (newKali.length === 1)) { // just a pCase
      pCaseName = findPCase(newCone[0],newKali[0]);
      atomList.push([pCaseName,newCone[0],newKali[0]]);
    } else { // plural pCases
      for (let i=0; i<newCone.length; i++) { // step 7. cone & kali (pCase -> sheet)
        if ((i === newCone.length-1) && (newKali.length === 1)) { // last pCase
          pCaseName = findPCase(newCone[i],newKali[0]);
          atomList.push([pCaseName,newCone[i],newKali[0]]);
        } else {
          infCount--;
          pCaseName = findPCase(newCone[i],infCount);
          atomList.push([pCaseName,newCone[i],infCount]);
          newKali.push(infCount);
          infArray.push([7,2]); // step 7. length 2
        }
      } // end step 7
    } // end plural pCases

 // alert(JSON.stringify([7,newCone,newKali,infArray,atomList]));

    if (newKali.length === 3) { // just one sheet
      newSheet = rotList([Number(newKali[0]),Number(newKali[1]),Number(newKali[2])]);
      atomList.push(["S"+(3+newSheet[3]),newSheet[0],newSheet[1],newSheet[2]]);
    } else { // many corners
      for (let i=0; i<newKali.length-3; i++) { // step 9. (sheet)
        infCount--;
        newSheet = rotList([Number(newKali[i]),Number(newKali[i+1]),Number(infCount)]);
        atomList.push(["S"+(3+newSheet[3]),newSheet[0],newSheet[1],newSheet[2]]);
        newKali.push(infCount);
        infArray.push([9,2]); // step 9. length 2
        i++;
        if (i === newKali.length-4) { // last sheet
          newSheet = rotList([Number(newKali[i+1]),Number(newKali[i+2]),Number(newKali[i+3])]);
          atomList.push(["S"+(3+newSheet[3]),newSheet[0],newSheet[1],newSheet[2]]);
        }
      } // end step 9
    } // end many corners

//  alert(JSON.stringify([9,newCone,newKali,infArray,atomList]));

  } else { // here: no kaleidoscopes.
    newCone = newCone.sort(function(a, b){return b-a});
    for (let i=0; i<newCone.length-1; i++) {  // step 5. two "2" cones
      if ((newCone[i] === 2) && (newCone[i+1] === 2)) {
        infCount--;
        newCone.splice(i,2,infCount);
        infArray.push([5,2]); // step 5. length 2
      } 
    } // end step 5

    newCone = newCone.sort(function(a, b){return b-a}); //may not need
    for (let i=0;i<newCone.length;i++) {
      if (newCone[i]<0) { // rotate array to start with handles if they exist.
       let firstPart = newCone.slice(i);
       let secondPart = newCone.slice(0, i);
       newCone = [...firstPart, ...secondPart];
       i=newCone.length;
      }
    }

  alert(JSON.stringify([5,newCone,newKali,infArray,atomList]));

    maxInfJoin = infCount;
    if (newCone.length === 3) { // just one pillow
      newPillow = rotList([newCone[0],newCone[1],newCone[2]]);
      atomList.push(["P"+(3+newPillow[3]),newPillow[0],newPillow[1],newPillow[2]]);
    } else { // many cones
      for (let i=0; i<newCone.length-3; i++) {  // step 8. (pillow) remember twist.
        infCount--;
        newPillow = rotList([newCone[i],newCone[i+1],infCount]);
        atomList.push(["P"+(3+newPillow[3]),newPillow[0],newPillow[1],newPillow[2]]);
        newCone.push(infCount);
        infArray.push([8,2,0]); // step 8. length 2. twist 0.
        i++;
        if (i === newCone.length-4) { // last pillow
          newPillow = rotList([newCone[i+1],newCone[i+2],newCone[i+3]]);
          atomList.push(["P"+(3+newPillow[3]),newPillow[0],newPillow[1],newPillow[2]]);
        }
      } // end step 8
    } // end many cones

 // alert(JSON.stringify([8,newCone,newKali,infArray,atomList]));

  } // end no kaleidoscopes

// I don't need to return anything, since this sets atomList and infArray.
//  let answer = JSON.stringify([atomList,infArray,"final", newCone,newKali]);
//  alert(answer);
//  return(answer);
} // end orbi2Atoms()


// begin with ultra parallels in list. 
function getSheet(thisType,thisParamList) {
  let myShape = [];
  if (thisType==="S6") { // all ultra parallel
//alert("S6");
    myShape = solve0Ang(thisParamList[0],thisParamList[1],thisParamList[2]);
  } else if (thisType==="S5") { // two ultra parallel
//alert("S5");
    myShape = solve1Ang(thisParamList[0],thisParamList[1],Math.PI/thisParamList[2]);
  } else if (thisType==="S4") { // one ultra parallel
//alert("S4");
    myShape = solve2Ang(thisParamList[0],Math.PI/thisParamList[1],Math.PI/thisParamList[2]);
  } else { // none ultra parallel
//alert("S3");
    myShape = solve3Ang(Math.PI/thisParamList[0],Math.PI/thisParamList[1],Math.PI/thisParamList[2]);
  }
  return(myShape);
} // end getSheet()


function getPCase(thisType,thisParamList) {
  let myShape = [];
  let angle1, angle2, side1, side2, side3;
  if (thisType==="C3") { // angle * angle
//alert("C3");
    angle1 = Math.PI/thisParamList[0];
    angle2 = Math.PI/thisParamList[1];
    myShape = solve3Ang(angle1*2,angle2/2,angle2/2);
  } else if (thisType==="C4") { // ultra * angle
//alert("C4");
    side1 = thisParamList[0]/2;
    angle1 = Math.PI/thisParamList[1];
    myShape = solve2Ang(side1*2,angle1/2,angle1/2);
  } else if (thisType==="C5") { // angle * ultra
//alert("C5");
    angle1 = 2*Math.PI/thisParamList[0];
    side1 = thisParamList[1];
    side2 = Math.asinh(Math.sqrt((1+Math.cos(angle1))/(Math.cosh(side1)-1)));
    myShape = solve1Ang(side2,side2,angle1);
  } else { // ultra * ultra
//alert("C6");
    side1 = thisParamList[0];
    side3 = thisParamList[1];
    side2 = Math.asinh(Math.sqrt((Math.cosh(side1)+1)/(Math.cosh(side3)-1)));
    myShape = solve0Ang(side2,side2,side1);
  }
  return(myShape);
} // end getPCase()

function getPillow(thisType,thisParamList) {
  let myShape = [];
  let angle1, angle2, angle3, side1, side2, side3, mid1, vert1, vert2;
  let shape1, shape2, newShape2;
  let myLine, myMat;

  if (thisType==="P3") { // none ultra parallel
    angle1 = Math.PI/thisParamList[0];
    angle2 = Math.PI/thisParamList[1];
    angle3 = Math.PI/thisParamList[2];
    shape1 = solve3Ang(angle1,angle3,angle2);
    shape2 = solve3Ang(angle1,angle2,angle3);
    myMat = isomSeg2Seg(shape2[0],shape2[2],shape1[0],shape1[1]);
    newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),multMatVect(myMat,shape2[2])];
    myShape = [newShape2[0],newShape2[1],newShape2[2],shape1[2]];
    // above shape is two identical halves of pillow. Reshape to keep cones connected.
    mid1 = midPoint(myShape[3],myShape[0]);
    myMat = isomSeg2Seg(myShape[2],myShape[3],myShape[2],myShape[1]);
    vert1 = multMatVect(myMat,mid1);
    myShape = [myShape[0],myShape[1],vert1,myShape[2],mid1];
    mid1 = midPoint(myShape[0],myShape[1]);
    myShape = [myShape[0],mid1,myShape[1],myShape[2],myShape[3],myShape[4]];
  } else if (thisType==="P4") { // one ultra parallel
    side1 = thisParamList[0]/2;
    angle2 = Math.PI/thisParamList[1];
    angle3 = Math.PI/thisParamList[2];
    shape1 = solve2Ang(side1,angle2,angle3);
    shape2 = solve2Ang(side1,angle3,angle2);
    myMat = isomSeg2Seg(shape2[0],shape2[3],shape1[1],shape1[2]);
    newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),           
                 multMatVect(myMat,shape2[2]),multMatVect(myMat,shape2[3])];
    myShape = [newShape2[1],newShape2[2],newShape2[3],shape1[3],shape1[0]];
    // above shape is two identical halves of pillow. Reshape to keep cones connected.
    mid1 = midPoint(myShape[3],myShape[4]);
    myMat = isomSeg2Seg(myShape[2],myShape[3],myShape[2],myShape[1]);
    vert1 = multMatVect(myMat,mid1);
    myShape = [myShape[4],myShape[0],myShape[1],vert1,myShape[2],mid1];
    mid1 = midPoint(myShape[1],myShape[2]);
    myShape = [myShape[0],myShape[1],mid1,myShape[2],myShape[3],myShape[4],myShape[5]];
  } else if (thisType==="P5") { // two ultra parallel
    side1 = thisParamList[0]/2;
    side2 = thisParamList[1]/2;
    angle3 = Math.PI/thisParamList[2];
    shape1 = solve1Ang(side1,side2,angle3);
    shape2 = solve1Ang(side2,side1,angle3);

    myMat = isomSeg2Seg(shape2[3],shape2[4],shape1[0],shape1[4]);
    newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),           
                 multMatVect(myMat,shape2[2]),multMatVect(myMat,shape2[3]),multMatVect(myMat,shape2[4])];
    myShape = [shape1[1],shape1[2],shape1[3],shape1[4],newShape2[0],newShape2[1],newShape2[2]];
    // above shape is two identical halves of pillow. Reshape to keep cones connected.
    mid1 = midPoint(myShape[5],myShape[6]);
    myMat = isomSeg2Seg(myShape[3],myShape[4],myShape[3],myShape[2]);
    vert1 = multMatVect(myMat,mid1);
    vert2 = multMatVect(myMat,myShape[5]);
    myShape = [myShape[6],myShape[0],myShape[1],vert2,vert1,myShape[3],mid1];
    mid1 = midPoint(myShape[1],myShape[2]);
    myShape = [myShape[0],myShape[1],mid1,myShape[2],myShape[3],myShape[4],myShape[5],myShape[6]];
  } else  { // three ultra parallel (P6)
    side1 = thisParamList[0]/2;
    side2 = thisParamList[1]/2;
    side3 = thisParamList[2]/2;
    shape1 = solve0Ang(side1,side2,side3);
    shape2 = solve0Ang(side2,side1,side3);
    myMat = isomSeg2Seg(shape2[1],shape2[2],shape1[2],shape1[1]);
    newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),multMatVect(myMat,shape2[2]),
                 multMatVect(myMat,shape2[3]),multMatVect(myMat,shape2[4]),multMatVect(myMat,shape2[5])];
    myShape = [newShape2[3],newShape2[4],newShape2[5],newShape2[0],shape1[3],shape1[4],shape1[5],shape1[0]];
    // above shape is two identical halves of pillow. Reshape to keep cones connected.
    mid1 = midPoint(myShape[6],myShape[7]);
    myMat = isomSeg2Seg(myShape[4],myShape[5],myShape[3],myShape[2]);
    vert1 = multMatVect(myMat,mid1);
    vert2 = multMatVect(myMat,myShape[6]);
    myShape = [myShape[7],myShape[0],myShape[1],vert2,vert1,myShape[3],myShape[4],mid1];
    // move myShape[5] and myShape[6]
    // Drop perpendiculars from myShape[4] and myShape[7] onto the gamma line.
    let myLine = points2Line(myShape[5], myShape[6]);
    myShape[5] = footOfPerp(myShape[4], myLine);
    myShape[6] = footOfPerp(myShape[7], myLine);
    mid1 = midPoint(myShape[1],myShape[2]);
    myShape = [myShape[0],myShape[1],mid1,myShape[2],myShape[3],myShape[4],myShape[5],myShape[6],myShape[7]];
  }
  return(myShape);
} // end getPillow()


// This will rotate a list of three numbers to start with all negatives first, then positives
function rotList(oldList) {
  let A=oldList[0];
  let B=oldList[1];
  let C=oldList[2]; 
  let cutPoint = 0;
  if (A<0) { // A < 0
    if ((B>0) && (C<0)) { //-+-
      cutPoint = 2;
    }
  } else { // A > 0
    if (B<0) { // +-- or +-+
      cutPoint = 1;
    } else {
      if (C<0) { // ++-
        cutPoint = 2;
      }
    }
  }
  let negCount = 0;
  for (let i=0;i<3;i++) {
    if (oldList[i] < 0) {negCount++}
  }
  let newList = oldList.slice(cutPoint).concat(oldList.slice(0, cutPoint));
  newList.push(negCount);
  return(newList);
} // end rotList()

function findPCase(A,B) {
  let negA = (A<0);
  let negB = (B<0);
  return("C"+(3+1*negA+2*negB));
}


function tileIt() {
  let genLeng = genMats.length;
  matList = [];
  centList = [];
  if (tileMethod === 1) { // all within some radius
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
        if (newCent[0] < maxT) {
          let isNew = 1;
          for (let j=0;j<matMax;j++) {
            let thisDist = hDist(centList[j],newCent);
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
//alert("end tile meth 1"); // this one never showed up
  } // end tile method 1
  else // other tile method - layers of tiles 
  {
//alert("tile method 2");
    matList.push([
      [1,0,0],
      [0,1,0],
      [0,0,1]
    ]);
    for (let i = 0;i<genLeng;i++) {
      matList.push(genMats[i]);
      centList.push(multMatVect(genMats[i],funDomCent));

      for (let j = 0;j<genLeng;j++) {
        let newMat = multMatMat(genMats[i],genMats[j]);
        matList.push(newMat);
        centList.push(multMatVect(newMat,funDomCent));

        for (let k = 0;k<genLeng;k++) {
          let newMat = multMatMat(multMatMat(genMats[i],genMats[j]),genMats[k]);
          matList.push(newMat);
          centList.push(multMatVect(newMat,funDomCent));
        } // end k loop

      } // end j loop

    } // end i loop
  } // end tile method2
} // end tileIt()

// this is for three real angles of a triangle.
function solve3Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [0,Math.cos(alpha),Math.sin(alpha)];
  let sideAY = (Math.cos(gamma)+Math.cos(alpha)*Math.cos(beta))/Math.sin(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [-Math.sqrt(sideAX*sideAX+sideAY*sideAY-1),sideAX,-sideAY];
  let vertAlpha = hNorm(crossProd(tRef(sideB),tRef(sideC)));
  let vertBeta = hNorm(crossProd(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(crossProd(tRef(sideA),tRef(sideB)));
  return([vertAlpha,vertBeta,vertGamma]);
}

// this is for two real angles of a triangle and one imaginary (shortest segment between ultra parallels)
// alpha is the imaginary
function solve2Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha),Math.cosh(alpha),0];
  let sideAT = (Math.cos(gamma)+Math.cosh(alpha)*Math.cos(beta))/Math.sinh(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [sideAT,sideAX,Math.sqrt(-sideAX*sideAX+sideAT*sideAT+1)];
  let segAlpha = hNorm(crossProd(tRef(sideB),tRef(sideC)));
  let vertBeta = hNorm(crossProd(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(crossProd(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(crossProd(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(crossProd(tRef(segAlpha),tRef(sideB)));
  return([vertAlphaB,vertAlphaC,vertBeta,vertGamma]);
}

// this is for one real angle of a triangle and two imaginary (shortest segment between ultra parallels)
// alpha, beta are the imaginary
function solve1Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha),Math.cosh(alpha),0];
  let sideAT = (Math.cos(gamma)+Math.cosh(alpha)*Math.cosh(beta))/Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT,sideAX,Math.sqrt(-sideAX*sideAX+sideAT*sideAT+1)];
  let segAlpha = hNorm(crossProd(tRef(sideB),tRef(sideC)));
  let segBeta = hNorm(crossProd(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(crossProd(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(crossProd(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(crossProd(tRef(segAlpha),tRef(sideB)));
  let vertBetaA = hNorm(crossProd(tRef(segBeta),tRef(sideA)));
  let vertBetaC = hNorm(crossProd(tRef(segBeta),tRef(sideC)));
  return([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGamma]);
}


// this is for zero real angles of a triangle and three imaginary (shortest segment between ultra parallels)
function solve0Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha),Math.cosh(alpha),0];
  let sideAT = (Math.cosh(gamma)+Math.cosh(alpha)*Math.cosh(beta))/Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT,sideAX,Math.sqrt(-sideAX*sideAX+sideAT*sideAT+1)];
  let segAlpha = hNorm(crossProd(tRef(sideB),tRef(sideC)));
  let segBeta = hNorm(crossProd(tRef(sideC),tRef(sideA)));
  let segGamma = hNorm(crossProd(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(crossProd(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(crossProd(tRef(segAlpha),tRef(sideB)));
  let vertBetaA = hNorm(crossProd(tRef(segBeta),tRef(sideA)));
  let vertBetaC = hNorm(crossProd(tRef(segBeta),tRef(sideC)));
  let vertGammaA = hNorm(crossProd(tRef(segGamma),tRef(sideA)));
  let vertGammaB = hNorm(crossProd(tRef(segGamma),tRef(sideB)));
//alert([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGammaA,vertGammaB]);
  return([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGammaA,vertGammaB]);
}




// hyperbolic stuff

// hyperbolic dot product (bilinear form)
function hDot(P,Q) {
   return(-P[0]*Q[0]+P[1]*Q[1]+P[2]*Q[2]);
}

// normalized vector. (with t > 0)
function hNorm(P) {
  let denom;
  if (vectType(P) === 0) {
    denom = 1/P[0]/Math.sqrt(2);
  } else {
    denom = Math.sqrt(Math.abs(hDot(P,P)));
  }
  let multiplier = 1;
  if (P[0]<0) {multiplier = -1}
  return([P[0]*multiplier/denom,P[1]*multiplier/denom,P[2]*multiplier/denom]);
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
function isIntersecting(L,M) {
  let perpVect = crossProd(L,M);
  return(hDot(perpVect,perpVect) <= epsilon);
}

// return a line through two hyperbolic points. (given by the complement of a vector normal to plane.)
function points2Line(P,Q) {
  let dist = hDist(P,Q);
  let line = tRef(crossProd(P,Q));
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
  if ((N < 1) && (N+epsilon>1)) {N=1;}
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

// drop a perpendicular from point P onto line L, returning the foot of the perpendicular
function footOfPerp(P,L) {
  return(hNorm(vectPlus(P, scalarVect(-hDot(P,L)/hDot(L,L), L))));
}

// usual cross product
function crossProd(P,Q) {
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
// I wrote a different version. It's in old program packet.
// better use the other one. This one is just p-gon meeting q at a vertex.
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

// find in between points on reg. polygon edges. also only p-gons with q at a vertex.
function regPolyMoreVert(P,Q) {
  let extra = 3; // number of points to add per edge
  let vertices = regPolyVertices(P,Q);
  let moreVert = [];
  for (let i=0;i<vertices.length-1;i++) {
    let lineVert = divSeg(vertices[i],vertices[i+1],extra);
    lineVert.pop(); // don't include endpoints twice
    moreVert = moreVert.concat(lineVert);
  }
  let lineVert = divSeg(vertices[vertices.length-1],vertices[0],extra);
  lineVert.pop(); // don't include endpoints twice
  moreVert = moreVert.concat(lineVert);
  return(moreVert);
}

// this one finds a regular n-gon given center and vertex.
function regPoly(center, vertex, n) {
  let myAngle = 2*Math.PI/n;
  let myVertList = [];
  let nextVert = vertex;
  let myRotMat = rotMat(center,myAngle);
  for (let i = 0; i< n+1; i++) {
    myVertList.push(nextVert);
    nextVert = multMatVect(myRotMat, nextVert);
  }
  return(myVertList);
}

// find in between points on polygon edges.
function polyMoreVert(vertices) {
  let extra = 3; // number of points to add per edge
//  let vertices = regPolyVertices(P,Q);
  let moreVert = [];
  for (let i=0;i<vertices.length-1;i++) {
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

// this is Euclidean normalization
function normalize(P) {
  let denom = Math.sqrt(P[0]*P[0]+P[1]*P[1]+P[2]*P[2]);
  return([P[0]/denom,P[1]/denom,P[2]/denom]);
}

function midPoint(P,Q) {
  return(hNorm(vectPlus(P,Q)));
}

/*
function hNormjpart2(P) {
  let k = 1/Math.sqrt(Math.abs(hDot(P,P)));
  return(scalarVect(k,P)); 
}
*/

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
  if (P == [1,0,0]) { return rotOrigMat(theta) }
  else {
    let mat1 = hFlipMat(P,[1,0,0]);
    let mat2 = rotOrigMat(-theta);
    let mat3 = multMatMat(mat1,multMatMat(mat2,mat1));
    return(mat3);
  }
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
  let result, reflMat1, reflMat2;
  if (Math.abs(normHDot(P,Q)-normHDot(R,S)) >= epsilon) { return("Error. Don't match!") }
  else {
    if (hDist(P,R) < epsilon) { // Here P=R
      if (hDist(Q,S) < epsilon) { // so segments are the same
        result =  [
          [1,0,0],
          [0,1,0],
          [0,0,1]
        ];
        return(result);
      } //  end segments same.
      reflMat1 = hFlipMat(Q,S);
      let lineRS = points2Line(R,S);
      reflMat2 = hReflMat(lineRS);
      result = multMatMat(reflMat2,reflMat1);
      return(result);
    } // end P=R
    let pointDiff1 = vectMinus(P,R); 
// need more help if pointDiff1 is ideal. 
    reflMat1 = hReflMat(pointDiff1);
    let QPrime = multMatVect(reflMat1,Q);
    let pointDiff2 = vectMinus(S,QPrime);
// need more help if pointDiff2 is ideal.
    reflMat2 = hReflMat(pointDiff2);
    if (hDist(S,QPrime) < epsilon) { // Here S=Q'

//    if (Math.abs(pointDiff2[0])+Math.abs(pointDiff2[1])+Math.abs(pointDiff2[2])<epsilon) { // Here S=Q'
      let lineRS = points2Line(R,S);
      reflMat2 = hReflMat(lineRS);
    }
    result = multMatMat(reflMat2,reflMat1);
//alert(JSON.stringify(["*",reflMat2,reflMat1,result]));
    return(result);
  }
} // end isomSeg2Seg()

// orientation reversing isometry from segment PQ to segment RS. Length must be the same and > 0.
function isomSeg2SegFlip(P,Q,R,S) {
  if (Math.abs(normHDot(P,Q)-normHDot(R,S)) >= epsilon) { alert(4); return("Error. Don't match!") }
  else {
    let baseMat = isomSeg2Seg(P,Q,R,S);
    let perpVect = points2Line(R,S);
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

// divide the segment PQ. Add n points between them. (Evenly spaced.) return array of points.
function divSegReg(P,Q,n) {
  let direction = hNorm(vectMinus(Q,vectScalar(P,hDot(P,Q)/hDot(P,P))));
  let myDist = hDist(P,Q);
  let myList = [];
  for (let i = 0; i<n+2; i++) {
    let myStep = i/(n+1)*myDist;
    let nextPt = vectPlus(vectScalar(P,Math.cosh(myStep)),vectScalar(direction,Math.sinh(myStep)));
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
      for (let map=1;map<=NumMaps;map++) {
        var pt3 = MapOne(map,orbi,nextShape[1],nextShape[2]);
        var pt4 = MapOne(map,orbi,nextShape[3],nextShape[4]);
        for (let i=0;i<6;i++) {
          var xAdd1 = i*TranAx;
          var yAdd1 = i*TranAy;
            for (let j=0;j<6;j++) {
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
      for (let map=1;map<=NumMaps;map++) {
        var pt3 = MapOne(map,orbi,nextShape[1],nextShape[2]);
        var pt4 = MapOne(map,orbi,nextShape[3],nextShape[4]);
        for (let i=0;i<6;i++) {
          var xAdd1 = i*TranAx;
          var yAdd1 = i*TranAy;
          for (let j=0;j<6;j++) {
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
      for (let map=1;map<=NumMaps;map++) {
        var pt3 = MapOne(map,orbi,nextShape[1],nextShape[2]);
        var pt4 = MapOne(map,orbi,nextShape[3],nextShape[4]);
        for (let i=0;i<6;i++) {
          var xAdd1 = i*TranAx;
          var yAdd1 = i*TranAy;
          for (let j=0;j<6;j++) {
            var xDiff = pt4[0]-pt3[0];
            var yDiff = pt4[1]-pt3[1];
            var xAdd = xAdd1 + j*TranBx;
            var yAdd = yAdd1 + j*TranBy;
            asOutput = asOutput.concat('<path d="M ');  
            asOutput = asOutput.concat(pt4[0]+xAdd);
            asOutput = asOutput.concat(' ');
            asOutput = asOutput.concat(pt4[1]+yAdd);
            asOutput = asOutput.concat(' ');
            for (let k = 1;k<nextShape[0];k++) {
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
      for (let i = 11;i<curLen;i++) {
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
  posA3d = screen2Pt(posA,hZoom);

  if (mode === -1) { // pan - move view
    tempMat = moveMat;
  }

//alert(posWC);
/*
  posA3d = screen2vect(canvasX,canvasY,shifty);

//document.getElementById("myText").value = " " + posA3d;

  if (mode === -1) { // pan - move view
//    backupStack = stack;
//    backupSymVects = symVects;
  } // end pan

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

/* other mousePressed
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

*/

function mouseMoved(event) {
  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
//  var shifty = event.shiftKey;
  posB = [canvasX,canvasY];
  posB3d = screen2Pt(posB,hZoom);
//  posB3d = screen2vect(canvasX,canvasY,shifty);

  if (mode === -1 && posA != 0) { // pan - translate view
    moveMat = multMatMat(transMat(posA3d,posB3d),tempMat);
    draw();
  } // end pan

//  if (mode === 1 && posA != 0) { // line 
//    draw();
//  } // end line

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
 // shapeNum = -1; // we aren't moving control points around.
//alert(JSON.stringify(myColor));
//  if (mode > 0) { // end of drawing
//    undoStack = [];
//    stack.push([mode,posA3d[0],posA3d[1],posA3d[2],posB3d[0],posB3d[1],posB3d[2],color,fill]);
//  }

  if (mode === -1 && posA != 0) { // pan - translate view

  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
//  var shifty = event.shiftKey;
  posB = [canvasX,canvasY];
  posB3d = screen2Pt(posB,hZoom);
//alert(JSON.stringify([posA3d,posB3d]));

  moveMat = multMatMat(transMat(posA3d,posB3d),tempMat);
  tempMat = [];

  posA = 0;
  posB = 0;
  posA3d=0;
  posB3d=0;
  } // end pan

  if (mode > 0) { // end of drawing line or poly.
    undoStack = [];
    let moveOrigin = multMatVect(moveMat, [1,0,0]);
    let moveOther = multMatVect(moveMat, [3,2,2]);
    let invMove = isomSeg2Seg(moveOrigin,moveOther,[1,0,0],[3,2,2]);
    if (Number.isNaN(invMove[0][0])) {invMove = [[1,0,0],[0,1,0],[0,0,1]];}
    posA3d = multMatVect(invMove,posA3d);
    posB3d = multMatVect(invMove,posB3d);
    stack.push([mode,posA3d[0],posA3d[1],posA3d[2],posB3d[0],posB3d[1],posB3d[2],color,fill]);
  }
  posA = 0;
  posB = 0;
  posA3d=0;
  posB3d=0;
  draw();
} // end mouseReleased()


// snapTo(), checkPoint(), checkLine(), MapOne() removed (Euclidean version, unused)
/*
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









// given two hyperboloid points, draw segment on screen. Doesn't work
function drawSeg2(P,Q,context) {
  let scrP = pt2Screen(P,hZoom);
  let scrQ = pt2Screen(Q,hZoom);

  let R = crossProd(P,Q);
  let refR = tRef(R);
  let S;
  if (JSON.stringify(R) === JSON.stringify(refR)) {
    S = crossProd(R,[1,0,0]);
  } else {
    S = crossProd(R,refR);
  }
  let T = crossProd(S,R);
  S = hNorm(S);
  T = hNorm(T);
alert([S,T]);
  let a = Math.log(P[0]/2 + Math.sqrt(P[0]*P[0]-4*T[0])/2);
  let b = Math.log(Q[0]/2 + Math.sqrt(Q[0]*Q[0]-4*T[0])/2);
  let i = a;
//alert([P,Q]);
  for (let i=-1.5;i<-.5;i+=.1) {
   let newPoint = vectPlus(scalarVect(Math.cosh(i),T),scalarVect(Math.sinh(i),S));
//   alert([i,newPoint]);
  }

/*

  let U = crossProd(R,[1,0,0]);
  let V = crossProd(R,U);
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

//alert("draw");
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

//  scrRadius = (scrCenterX+scrCenterY)/2;
  scrRadius = scrCenterY;

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

  let polyLeng = matList.length;
//alert(JSON.stringify(matList));
//alert(JSON.stringify(funDom));


/*
for (let i = 0;i<atomPtList.length;i++) {
  let fdNow = atomPtList[i];
  let fdNowMore = polyMoreVert(fdNow);
 // funDomCent = hNorm(avePts(fdNow));
 
  let morePolyLeng = fdNowMore.length;
  scrVertices = ptList2Screen(fdNowMore,hZoom);
  context.beginPath();
  context.moveTo(scrVertices[morePolyLeng-1][0],scrVertices[morePolyLeng-1][1]);
  scrVertices.forEach(function(vertex) {
    context.lineTo(vertex[0],vertex[1]);
  });
  context.strokeStyle = "lightgrey";
  context.stroke();
  context.closePath();
}
*/

  

  // draw fundamental domains
  let moreVertices = funDomMoreVert;
  for (let i = 0;i<polyLeng;i++) { // loop through matrices
    let newVertices = [];
    let thisMat = multMatMat(moveMat,matList[i]);

    moreVertices.forEach(function(vertex) {
      newVertices.push(multMatVect(thisMat, vertex));
    });
    let newCent = multMatVect(moveMat,centList[i]);

    // draw fundamental domains
    let morePolyLeng = moreVertices.length;
    scrVertices = ptList2Screen(newVertices,hZoom);
    context.beginPath();
    context.moveTo(scrVertices[morePolyLeng-1][0],scrVertices[morePolyLeng-1][1]);
    scrVertices.forEach(function(vertex) {
      context.lineTo(vertex[0],vertex[1]);
    });
    context.strokeStyle = "lightgrey";
    context.stroke();
    // shade in just base F.D.
    if (i === 0) {context.fillStyle = "beige";     context.fill();}

    context.closePath();

    // centers of FDs
    scrVertices = ptList2Screen([newCent],hZoom);
    scrX = scrVertices[0][0];
    scrY = scrVertices[0][1];
    context.beginPath();
    context.rect(scrX-2,scrY-2,5,5);
    context.stroke();
    context.fillStyle = "red";
    context.fill();
    context.closePath();
  } // end i loop of matrices



  // draw saved shapes
  context.lineWidth = 1;
  stack.forEach(function(nextShape) {
    if (nextShape[0] === 1) { // line
      let myPtList = divSeg([nextShape[1],nextShape[2],nextShape[3]],[nextShape[4],nextShape[5],nextShape[6]],5);
      scrVertices = ptList2Screen(myPtList,hZoom);
      let newVertices = [];
      for (let i = 0;i<polyLeng;i++) { // loop through matrices
        newVertices = [];
        let thisMat = multMatMat(moveMat,matList[i]);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(thisMat, vertex));
        });
        let newScrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(newScrVertices[0][0],newScrVertices[0][1]);
        newScrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = nextShape[7];
        context.stroke();
        context.closePath();
      } // end i loop of matrices
    } // end line
    else { // poly
      let myPtList = regPoly([nextShape[1],nextShape[2],nextShape[3]],[nextShape[4],nextShape[5],nextShape[6]],nextShape[0]);
      myPtList =polyMoreVert(myPtList);
      scrVertices = ptList2Screen(myPtList,hZoom);
      newVertices = [];
      for (let i = 0;i<polyLeng;i++) { // loop through matrices
        newVertices = [];
        let thisMat = multMatMat(moveMat,matList[i]);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(thisMat, vertex));
        });
        let newScrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(newScrVertices[0][0],newScrVertices[0][1]);
        newScrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = nextShape[7];
        context.stroke();
        if (nextShape[8]) {
          context.fillStyle = nextShape[7];
          context.fill();
        }
        context.closePath();
      } // end i loop of matrices
    } // end poly
  }); // end loop of saved shapes
  

  // draw current line or poly
  for (let i = 0;i<polyLeng;i++) { // loop through matrices
    let newVertices = [];
    let thisMat = multMatMat(moveMat,matList[i]);
    if (posA3d != 0 && mode > 0) {
      if (mode == 1) {
        let myPtList = divSeg(posA3d,posB3d,5);
        let moveOrigin = multMatVect(moveMat, [1,0,0]);
        let moveOther = multMatVect(moveMat, [3,2,2]);
        let invMove = isomSeg2Seg(moveOrigin,moveOther,[1,0,0],[3,2,2]);
        if (Number.isNaN(invMove[0][0])) {invMove = [[1,0,0],[0,1,0],[0,0,1]];}
        newVertices = [];
        let myNextMat = multMatMat(thisMat,invMove);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(myNextMat, vertex));
        });
        scrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(scrVertices[0][0],scrVertices[0][1]);
        scrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = color;
        context.stroke();
        context.closePath();
      } // end current line
      else { // current poly
        let myPtList = regPoly(posA3d,posB3d,mode);
        myPtList =polyMoreVert(myPtList);
        let moveOrigin = multMatVect(moveMat, [1,0,0]);
        let moveOther = multMatVect(moveMat, [3,2,2]);
        let invMove = isomSeg2Seg(moveOrigin,moveOther,[1,0,0],[3,2,2]);
        if (Number.isNaN(invMove[0][0])) {invMove = [[1,0,0],[0,1,0],[0,0,1]];}
        newVertices = [];
        let myNextMat = multMatMat(thisMat,invMove);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(myNextMat, vertex));
        });
        scrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(scrVertices[0][0],scrVertices[0][1]);
        scrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = color;
        context.stroke();
        if (fill) {
          context.fillStyle = color;
          context.fill();
        }
        context.closePath();   
      } // end current poly
    } // end current stuff
  } // end i loop of matrices

} // end draw()
