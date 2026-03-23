var scrRadius = 200;
var scrCenterX;
var scrCenterY;
var epsilon = 0.0000001;
var hZoom = 1;
var identity = [[1,0,0],[0,1,0],[0,0,1]];

var mode = 1;        // -1=pan, 0=edit, 1=line, n>=3=polygon
var ngon = 5;
var color = "#000000";
var fill = 0;
var stack = [];
var undoStack = [];
var moveMat     = [[1,0,0],[0,1,0],[0,0,1]];
var lastGoodMoveMat = [[1,0,0],[0,1,0],[0,0,1]];
var tempMat = [[1,0,0],[0,1,0],[0,0,1]];
var posA = 0, posB = 0;
var posA3d = 0, posB3d = 0;
var baseFDIdx = 0;
var shapeNum = -1;   // index of shape being edited (-1 = none)
var controlPt = 1;   // 1 = first control point, 2 = second control point
var editBoxSize = 8; // hit-test radius in screen pixels
var paramNum = -1;   // index into paramPtList[] being edited (-1 = none)
var paramEnd = -1;   // -1 = twist, 0 = P endpoint, 1 = Q endpoint
var paramDragFixed;     // view-space position of fixed endpoint (endpoint drag)
var paramDragLine;      // scene-space geodesic line for projection (in moveMatAtPress frame)
var paramDragFixedScene; // scene-space position of fixed endpoint at press time
var moveMatAtPress;     // copy of moveMat at mousePressed time
var panBestI, panBestJ; // indices of most screen-separated originFD vertices for pan isomSeg2Seg
var panDet = 1;         // sign of det(tempMat) at pan start: +1 or -1

// sturctural variables: only change when orbifold changes
// atomList[i] = [type, param1, param2, ...] e.g. ["C4", 3, 4] or ["S5", 2, 3, 4] or ["P6", 2, 3, 4]
let atomList = [];
let firstInnerMatch;
// stepEdges[i] is just the step number, e.g. [0, 3, 4, 4, 6, 7, 7, 7, 7]
let stepEdges;
// match[i] = list of [atomIndex, startVert] for each atom that has step edge i.
let match;
// glueMatch[i] = step edge index used to position atom i against a previously placed atom.
// Atom 0 is the anchor.
let glueMatch;
// borderFD[i] = [atomIdx, vertIdx] — structural boundary of the fundamental domain.
// Step-8 join vertices appear as two consecutive entries (coincide when twist is 0).
let borderFD;
// genMaps[i] = [j, orientation] — edge i of the FD boundary maps to edge j.
// orientation: 1 = direct, 0 = flipped, -1 = step edge (treated separately).
// Edge i runs from borderFD[i] to borderFD[(i+1) % borderFD.length].
let genMaps;
// indexedCents[i] compares allMappedCents[]. stores index of first instance
let indexedCents;
// uniqGens[i] = unique indices in indexedCents[]
let uniqGens;
// coords2Drop[i] = index of borderFD[] to drop. (if adjacent edges have same indexedCents[])
let coords2Drop;
// neighborMaps[i] = indexed by genMats[] of which isometries are composed. 
// offset from neighborMats[] by one, since it doesn't include the identity.
let neighborMaps;

// geometric variables.
// params[i] holds the length (and twist if step 3 or 8), e.g. [0, [2,0], [2], [2], ...]
let params;
// atomPtList[i] = list of geometric coordinates for the vertices of atom i, in the same order as the atom definition.
let atomPtList;
// originFD[i] = WC point — geometric boundary of the fundamental domain.
let originFD;
let originFDCent;
// recenterMat = matrix to translate originFDCent to [1,0,0]
let recenterMat;
// paramPtList[i] = endpoints of each edge in match[] in lowest atom. also twist.
let paramPtList;
let fdArea;
// allGenMats[i] = matrices of genMaps[]. Duplicates allowed.
let allGenMats;
// allMappedCents[i] = move originFDCent by allGenMats[]
let allMappedCents;
// genMats[i] = The matrices in allGenMats[] in uniqGens[]
let genMats;
// neighborCents[i] = Start with origin. Then allMappedCents[] in uniqGens[].
// then more centers of composed isometries.
let neighborCents;
// neighborMats[i] = Matrices. start with the identity. Then genMats[].
// then more matrices of composed isometries. Matches neighborCents[].
let neighborMats;


function init() {
  var c = document.getElementById("myCanvas");
  c.height = window.innerHeight - 220;
  c.width = window.innerWidth - 205;
  scrCenterX = Math.round(c.width / 2);
  scrCenterY = Math.round(c.height / 2);

  var d = document.getElementById("canvasDiv");
  d.style.maxHeight = window.innerHeight - 195 + "px";
  d.style.height = window.innerHeight - 195 + "px";
  d.style.maxWidth = window.innerWidth - 180 + "px";
  d.style.width = window.innerWidth - 180 + "px";

  document.onkeyup = function(e) {
    var myKey = e.which || e.keyCode;
    if (e.ctrlKey && myKey === 90) { goUndo(); }
    if (e.ctrlKey && myKey === 89) { goRedo(); }
  }

  reDo();
}


function reDo() {
  let handle = Number(document.getElementById("handle").value);
  let crosscap = Number(document.getElementById("crosscap").value);
  let cone = JSON.parse(document.getElementById("cone").value);
  let kali = JSON.parse(document.getElementById("kali").value);

  moveMat = [[1,0,0],[0,1,0],[0,0,1]];
  lastGoodMoveMat = [[1,0,0],[0,1,0],[0,0,1]];
  baseFDIdx = 0;

  stepEdges = [0];
  params = [0];
  atomList = [];

  orbi2Atoms(handle, crosscap, cone, kali);
  atomList.reverse(); // start with the most connections

  buildMatch();
  buildBorderFD();
  rebuildGeom();

  console.log(JSON.stringify([handle, crosscap, cone, kali]));
  console.log("atomList: " + JSON.stringify(atomList));
  console.log("stepEdges: " + JSON.stringify(stepEdges));
  console.log("params: " + JSON.stringify(params));
  console.log("match: " + JSON.stringify(match));
  console.log("glueMatch: " + JSON.stringify(glueMatch));
  console.log("genMaps: " + JSON.stringify(genMaps));
  console.log("atomPtList: " + JSON.stringify(atomPtList));
  console.log("originFD: " + JSON.stringify(originFD));
  console.log("allMappedCents: " + JSON.stringify(allMappedCents));

  draw();
}


function orbi2Atoms(handle, crosscap, cone, kali) {
  let stepEdgeCount = 0;
  let newCone = JSON.parse(JSON.stringify(cone));
  let newKali = [];
  let newSheet, newPillow;

  for (let i = 0; i < handle; i++) { // step 3: remove handle.
    stepEdgeCount++;
    newCone.push(-stepEdgeCount);
    newCone.push(-stepEdgeCount);
    stepEdges.push(3);
    params.push([2, 0]); // length 2, twist 0
  }

  for (let i = 0; i < crosscap; i++) { // step 2: remove crosscap.
    stepEdgeCount++;
    newCone.push(-stepEdgeCount);
    stepEdges.push(2);
    params.push([2]); // length 2
  }

  if (kali.length > 0) { // here there are kaleidoscopes

    for (let i = 0; i < kali.length; i++) { // ensure "2" corners adjacent if possible.
      if (kali[i].length > 1) {
        for (let j = 0; j < kali[i].length - 1; j++) {
          if (kali[i][j] != 2) {
            kali[i] = kali[i].slice(j).concat(kali[i].slice(0, j));
            break;
          }
        }
      }
    }

    newKali = JSON.parse(JSON.stringify(kali[0]));
    if (kali.length > 1) { // step 1: join kalis.
      let minStepEdgeCount = stepEdgeCount;
      newKali = JSON.parse(JSON.stringify(kali[0]));
      for (let i = 1; i < kali.length; i++) {
        stepEdgeCount++;
        newKali.push(-stepEdgeCount);
        stepEdges.push(1);
        params.push([2]); // length 2
        newKali.push(...kali[i]);
      }
      for (let i = stepEdgeCount; i > minStepEdgeCount; i--) { // add matching step edges
        newKali.push(-i);
      }
    }

    for (let i = 0; i < newCone.length; i++) { // step 4: "2" cone and kali.
      if (newCone[i] === 2) {
        newCone.splice(i, 1);
        stepEdgeCount++;
        newKali.push(-stepEdgeCount);
        stepEdges.push(4);
        i--;
      }
      params.push([2]); // length 2
    }

    for (let i = 0; i < newKali.length - 1; i++) { // step 6: "22" corners adjacent.
      if ((newKali[i] === 2) && (newKali[i + 1] === 2)) {
        stepEdgeCount++;
        newKali.splice(i, 2, -stepEdgeCount);
        stepEdges.push(6);
        params.push([2]); // length 2
      }
    }

    firstInnerMatch = stepEdgeCount;
    let pCaseName;
    if ((newCone.length === 1) && (newKali.length === 1)) { // just one pCase
      pCaseName = findPCase(newCone[0], newKali[0]);
      atomList.push([pCaseName, newCone[0], newKali[0]]);
    } else { // plural pCases
      for (let i = 0; i < newCone.length; i++) { // step 7: cone & kali (pCase -> sheet)
        if ((i === newCone.length - 1) && (newKali.length === 1)) { // last pCase
          pCaseName = findPCase(newCone[i], newKali[0]);
          atomList.push([pCaseName, newCone[i], newKali[0]]);
        } else {
          stepEdgeCount++;
          pCaseName = findPCase(newCone[i], -stepEdgeCount);
          atomList.push([pCaseName, newCone[i], -stepEdgeCount]);
          newKali.push(-stepEdgeCount);
          stepEdges.push(7);
          params.push([2]); // length 2
        }
      }
    }

    if (newKali.length === 3) { // just one sheet
      newSheet = rotList([Number(newKali[0]), Number(newKali[1]), Number(newKali[2])]);
      atomList.push(["S" + (3 + newSheet[3]), newSheet[0], newSheet[1], newSheet[2]]);
    } else { // many corners
      for (let i = 0; i < newKali.length - 3; i++) { // step 9: sheet
        stepEdgeCount++;
        newSheet = rotList([Number(newKali[i]), Number(newKali[i + 1]), Number(-stepEdgeCount)]);
        atomList.push(["S" + (3 + newSheet[3]), newSheet[0], newSheet[1], newSheet[2]]);
        newKali.push(-stepEdgeCount);
        stepEdges.push(9);
        params.push([2]); // length 2
        i++;
        if (i === newKali.length - 4) { // last sheet
          newSheet = rotList([Number(newKali[i + 1]), Number(newKali[i + 2]), Number(newKali[i + 3])]);
          atomList.push(["S" + (3 + newSheet[3]), newSheet[0], newSheet[1], newSheet[2]]);
        }
      }
    }

  } else { // no kaleidoscopes

    newCone = newCone.sort(function(a, b) { return b - a; });
    for (let i = 0; i < newCone.length - 1; i++) { // step 5: two "2" cones.
      if ((newCone[i] === 2) && (newCone[i + 1] === 2)) {
        stepEdgeCount++;
        newCone.splice(i, 2, -stepEdgeCount);
        stepEdges.push(5);
        params.push([2]); // length 2
      }
    }

    newCone = newCone.sort(function(a, b) { return b - a; });
    for (let i = 0; i < newCone.length; i++) { // rotate so step edges come first
      if (newCone[i] < 0) {
        let firstPart = newCone.slice(i);
        let secondPart = newCone.slice(0, i);
        newCone = [...firstPart, ...secondPart];
        i = newCone.length;
      }
    }

    firstInnerMatch = stepEdgeCount;
    if (newCone.length === 3) { // just one pillow
      newPillow = rotList([newCone[0], newCone[1], newCone[2]]);
      atomList.push(["P" + (3 + newPillow[3]), newPillow[0], newPillow[1], newPillow[2]]);
    } else { // many cones
      for (let i = 0; i < newCone.length - 3; i++) { // step 8: pillow, with twist.
        stepEdgeCount++;
        newPillow = rotList([newCone[i], newCone[i + 1], -stepEdgeCount]);
        atomList.push(["P" + (3 + newPillow[3]), newPillow[0], newPillow[1], newPillow[2]]);
        newCone.push(-stepEdgeCount);
        stepEdges.push(8);
        params.push([2, 0]); // length 2, twist 0
        i++;
        if (i === newCone.length - 4) { // last pillow
          newPillow = rotList([newCone[i + 1], newCone[i + 2], newCone[i + 3]]);
          atomList.push(["P" + (3 + newPillow[3]), newPillow[0], newPillow[1], newPillow[2]]);
        }
      }
    }

  } // end no kaleidoscopes

} // end orbi2Atoms()


function rotList(oldList) {
  let A = oldList[0];
  let B = oldList[1];
  let C = oldList[2];
  let cutPoint = 0;
  if (A < 0) {
    if ((B > 0) && (C < 0)) { cutPoint = 2; } // -+-
  } else {
    if (B < 0) { cutPoint = 1; } // +-- or +-+
    else if (C < 0) { cutPoint = 2; } // ++-
  }
  let negCount = 0;
  for (let i = 0; i < 3; i++) {
    if (oldList[i] < 0) { negCount++; }
  }
  let newList = oldList.slice(cutPoint).concat(oldList.slice(0, cutPoint));
  newList.push(negCount);
  return newList;
}


function findPCase(A, B) {
  let negA = (A < 0);
  let negB = (B < 0);
  return "C" + (3 + 1 * negA + 2 * negB);
}


// Returns the start vertex index of the step edge at position myIndex in an atom entry.
// myIndex is the position in the atomList entry (1-based: 1, 2, 3, ...).
function findJoinCoords(atomType, myIndex) {
  switch (atomType) {
    case "S4": case "S5": case "S6":
      return 2 * myIndex - 2;
    case "C5": case "C6":
      return 7 - 3 * myIndex;
    case "P4": case "P5": case "P6":
      return 3 * (myIndex - 1);
  }
}


// Builds match[] and glueMatch[] from atomList.
// Structural — call after orbi2Atoms() and atomList.reverse().
function buildMatch() {
  match = [0];
  for (let i = 1; i < stepEdges.length; i++) {
    match.push([]);
  }
  for (let i = 0; i < atomList.length; i++) {
    let nextAtom = atomList[i];
    let nextType = nextAtom[0];
    for (let j = 1; j < nextAtom.length; j++) {
      if (nextAtom[j] < 0) {
        let startVert = findJoinCoords(nextType, j);
        match[-nextAtom[j]].push([i, startVert]);
      }
    }
  }

  // For each atom i > 0, find the inner step edge (j > firstInnerMatch) that connects
  // it to an already-placed atom (lower index). Atom 0 is the anchor.
  glueMatch = [0];
  for (let i = 1; i < atomList.length; i++) {
    for (let j = firstInnerMatch + 1; j < match.length; j++) {
      if (match[j].length === 2) {
        let idx0 = match[j][0][0];
        let idx1 = match[j][1][0];
        if ((idx0 === i && idx1 < i) || (idx1 === i && idx0 < i)) {
          glueMatch.push(j);
          break;
        }
      }
    }
  }
}


// Returns [mappedVertIdx, isDirect] for edges that map to another edge of the same atom,
// or -1 for outer step edges (whose gluing is determined by the orbifold rules).
// Reflection edges map to themselves with isDirect = false.
function atomEdge(atomType, vertNum) {
  switch (atomType) {
    case "S3":
      return [vertNum, false]; // all three edges are reflections
    case "S4":
      if (vertNum === 0) return -1; // step edge
      return [vertNum, false];
    case "S5":
      if (vertNum === 0 || vertNum === 2) return -1; // step edges
      return [vertNum, false];
    case "S6":
      if (vertNum === 0 || vertNum === 2 || vertNum === 4) return -1; // step edges
      return [vertNum, false];
    case "C3":
      if (vertNum === 0) return [2, true];
      if (vertNum === 1) return [1, false]; // reflection
      if (vertNum === 2) return [0, true];
      break;
    case "C4":
      if (vertNum === 0) return [2, true];
      if (vertNum === 1) return -1; // crosscap step edge
      if (vertNum === 2) return [0, true];
      if (vertNum === 3) return [3, false]; // reflection
      break;
    case "C5":
      if (vertNum === 0) return [0, false]; // reflection
      if (vertNum === 1) return -1; // step edge
      if (vertNum === 2) return [2, false]; // reflection
      if (vertNum === 3) return [4, true];
      if (vertNum === 4) return [3, true];
      break;
    case "C6":
      if (vertNum === 0) return [0, false]; // reflection
      if (vertNum === 1) return -1; // step edge
      if (vertNum === 2) return [2, false]; // reflection
      if (vertNum === 3) return [5, true];
      if (vertNum === 4) return -1; // step edge
      if (vertNum === 5) return [3, true];
      break;
    case "P3":
      if (vertNum === 0) return [5, true];
      if (vertNum === 1) return [2, true];
      if (vertNum === 2) return [1, true];
      if (vertNum === 3) return [4, true];
      if (vertNum === 4) return [3, true];
      if (vertNum === 5) return [0, true];
      break;
    case "P4":
      if (vertNum === 0) return -1; // step edge
      if (vertNum === 1) return [6, true];
      if (vertNum === 2) return [3, true];
      if (vertNum === 3) return [2, true];
      if (vertNum === 4) return [5, true];
      if (vertNum === 5) return [4, true];
      if (vertNum === 6) return [1, true];
      break;
    case "P5":
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
}


// Traces the boundary of the fundamental domain and builds genMaps[].
// Structural — call after buildMatch().
// borderFD[i] = [atomIdx, vertIdx]. Step-8 join vertices appear as two consecutive
// entries (one per atom side) — they coincide geometrically when twist is 0.
// genMaps[i] = [j, orientation]: edge i maps to edge j.
// orientation: 1 = direct, 0 = flipped, -1 = step edge, null = twist edge (no mapping).
function buildBorderFD() {
  let currentAtom = 0;
  let currentVert = 0;
  borderFD = [];
  genMaps = [];
  let pendingPartner = null;
  let twistIndices = new Set();
  let lookup = new Map(); // "atomIdx,vertIdx" → borderFD index

  // Pass 1: build borderFD and lookup map
  for (let iter = 0; iter < 10000; iter++) {
    let nVerts = nVertsForAtom(atomList[currentAtom][0]);
    let nextVert = (currentVert + 1) % nVerts;
    let foundJoin = false;
    for (let j = firstInnerMatch + 1; j < match.length; j++) {
      if (match[j].length < 2) continue;
      for (let matchIdx = 0; matchIdx <= 1; matchIdx++) {
        if (match[j][matchIdx][0] === currentAtom &&
            match[j][matchIdx][1] === currentVert) {
          let otherIdx = 1 - matchIdx;
          let otherAtom = match[j][otherIdx][0];
          let otherNVerts = nVertsForAtom(atomList[otherAtom][0]);
          if (stepEdges[j] === 8) {
            pendingPartner = [currentAtom, currentVert];
          }
          currentAtom = otherAtom;
          currentVert = (match[j][otherIdx][1] + 1) % otherNVerts;
          foundJoin = true;
          break;
        }
      }
      if (foundJoin) break;
    }
    if (!foundJoin) {
      if (pendingPartner !== null) {
        twistIndices.add(borderFD.length);
        lookup.set(pendingPartner[0] + "," + pendingPartner[1], borderFD.length);
        borderFD.push(pendingPartner);
        pendingPartner = null;
      }
      lookup.set(currentAtom + "," + currentVert, borderFD.length);
      borderFD.push([currentAtom, currentVert]);
      currentVert = nextVert;
    }
    if (currentAtom === 0 && currentVert === 0) break;
  }

  // Pass 2: build genMaps
  for (let i = 0; i < borderFD.length; i++) {
    if (twistIndices.has(i)) {
      genMaps.push(null);
      continue;
    }
    let [atomIdx, vertIdx] = borderFD[i];
    let result = atomEdge(atomList[atomIdx][0], vertIdx);
    if (result === -1) {
      // outer step edge: find partner in borderFD via match
      let found = false;
      for (let j = 1; j <= firstInnerMatch && !found; j++) {
        if (!match[j] || match[j].length === 0) continue;
        if (match[j].length === 1) { // crosscap: edge glued to itself reversed
          if (match[j][0][0] === atomIdx && match[j][0][1] === vertIdx) {
            genMaps.push([i, -1]);
            found = true;
          }
        } else {
          for (let side = 0; side <= 1; side++) {
            if (match[j][side][0] === atomIdx && match[j][side][1] === vertIdx) {
              let other = match[j][1 - side];
              genMaps.push([lookup.get(other[0] + "," + other[1]), -1]);
              found = true;
              break;
            }
          }
        }
      }
      if (!found) genMaps.push([-1, -1]); // shouldn't happen
    } else {
      let [mappedVert, isDirect] = result;
      genMaps.push([lookup.get(atomIdx + "," + mappedVert), isDirect ? 1 : 0]);
    }
  }
}


// Builds allGenMats[] — one isometry matrix per edge of originFD[].
// allGenMats[i] maps the FD across edge i to the adjacent copy.
// Null where genMaps[i] is null (twist edge).
function buildAllGenMats() {
  let n = originFD.length;
  allGenMats = [];
  for (let i = 0; i < n; i++) {
    if (genMaps[i] === null) { allGenMats.push(null); continue; }
    let [j, orient] = genMaps[i];
    let Pi = originFD[i], Qi = originFD[(i + 1) % n];

    if (orient === 0) {
      // kaleidoscope reflection over geodesic of edge i
      allGenMats.push(hReflMat(points2Line(Pi, Qi)));
      continue;
    }

    if (orient === 1) {
      // direct gluing (pillow/sheet/pcase internal symmetry)
      let Pj = originFD[j], Qj = originFD[(j + 1) % n];
      allGenMats.push(isomSeg2Seg(Pi, Qi, Qj, Pj));
      continue;
    }

    // orient === -1: outer step edge — find step type
    let stepType = 0, twist = 0;
    let [atomIdx, vertIdx] = borderFD[i];
    for (let k = 1; k <= firstInnerMatch; k++) {
      if (!match[k] || match[k].length === 0) continue;
      let found = false;
      for (let side = 0; side < match[k].length; side++) {
        if (match[k][side][0] === atomIdx && match[k][side][1] === vertIdx) {
          stepType = stepEdges[k];
          twist = paramPtList[k] ? paramPtList[k][2] : 0;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (j !== i) {
      // steps 1, 3: map to partner edge (reversed by FD traversal convention)
      let Pj = originFD[j], Qj = originFD[(j + 1) % n];
      allGenMats.push(isomSeg2Seg(Pi, Qi, Qj, Pj, twist)); // twist=0 for step 1
    } else {
      // self-mapping step edges (steps 2, 4, 5, 6)
      switch (stepType) {
        case 4: case 5:
          allGenMats.push(isomSeg2Seg(Pi, Qi, Qi, Pi));
          break;
        case 6:
          allGenMats.push(hReflMat(points2Line(Pi, Qi)));
          break;
        case 2: {
          let mid1 = midPoint(Pi, Qi);
          allGenMats.push(isomSeg2SegFlip(Pi, mid1, mid1, Qi));
          allGenMats.push(isomSeg2SegFlip(Qi, mid1, mid1, Pi));
          break;
        }
        default:
          allGenMats.push(null);
      }
    }
  }
}


function buildAllMappedCents() {
  allMappedCents = allGenMats.map(mat => {
    if (mat === null) return null;
    let cent = multMatVect(mat, originFDCent);
    return hDist(cent, originFDCent) < 0.1 ? null : cent;
  });
  // filter out allGenMats entries whose center maps back to origin
  for (let i = 0; i < allGenMats.length; i++) {
    if (allMappedCents[i] === null) {allGenMats[i] = null;}
  }
}


// Builds indexedCents[] and uniqGens[].
// indexedCents[i] = i if allMappedCents[i] is a new unique center,
//                 = j (j < i) if it duplicates allMappedCents[j],
//                 = null if allMappedCents[i] is null.
// uniqGens[] = list of indices i where indexedCents[i] === i (unique generators).
function buildIndexedCents() {
  indexedCents = [];
  uniqGens = [];
  for (let i = 0; i < allMappedCents.length; i++) {
    if (allMappedCents[i] === null) {
      indexedCents.push(null);
      continue;
    }
    let found = -1;
    for (let k = 0; k < uniqGens.length; k++) {
      if (hDist(allMappedCents[i], allMappedCents[uniqGens[k]]) < 0.001) {
        found = uniqGens[k];
        break;
      }
    }
    if (found === -1) {
      indexedCents.push(i);
      uniqGens.push(i);
    } else {
      indexedCents.push(found);
    }
  }
}


// Builds genMats[] — unique non-null matrices, one per entry in uniqGens[].
// genMats[k] = allGenMats[uniqGens[k]].
function buildGenMats() {
  genMats = uniqGens.map(i => allGenMats[i]);
}


// BFS over genMats[] to build neighborMats[], neighborCents[], neighborMaps[].
// Always starts from the identity tile (scene origin). Covers a fixed scene-space
// region regardless of pan — rebuilt only when orbifold/parameters change.
// neighborMaps[i] = array of genMats indices composing neighborMats[i+1] relative to [0].
var maxT;
function buildNeighborMats() {
  // target ~70 tiles: area-based formula + FD vertex extent for long skinny FDs
  let maxVertT = Math.max(...originFD.map(p => p[0]));
  maxT = Math.min(1000, Math.max(30, Math.round(10 * fdArea + maxVertT)));

  neighborMats  = [identity];
  neighborCents = [originFDCent];
  neighborMaps  = [];           // neighborMaps[i] corresponds to neighborMats[i+1]

  let matIndex = 0;
  while (matIndex < neighborMats.length) {
    let parentSeq = matIndex === 0 ? [] : neighborMaps[matIndex - 1];
    for (let k = 0; k < genMats.length; k++) {
      let newMat  = multMatMat(genMats[k], neighborMats[matIndex]);
      let newCent = multMatVect(newMat, originFDCent);
      // Stop when tile centre is outside scene-space range (x0 in scene-space >= maxT).
      if (newCent[0] >= maxT) continue;
      let isNew = true;
      for (let j = 0; j < neighborCents.length; j++) {
        if (hDist(neighborCents[j], newCent) < 0.001) { isNew = false; break; }
      }
      if (isNew) {
        neighborMats.push(newMat);
        neighborCents.push(newCent);
        neighborMaps.push([k, ...parentSeq]);
      }
    }
    matIndex++;
  }
}


// Converts borderFD[] to geometric coordinates. Call after buildAtomPtList().
function buildOriginFD() {
  originFD = borderFD.map(([atom, vert]) => atomPtList[atom][vert]);
}


// Finds the area centroid of originFD[]. Call after buildOriginFD().
// Triangulates (fan from vertex 0), weights triangle centroids by hyperbolic area.
function buildOriginFDCent() {
  let n = originFD.length;
  if (n < 3) { originFDCent = originFD[0]; return; }
  let A = originFD[0];
  let totalArea = 0, cx = 0, cy = 0, cz = 0;
  for (let i = 1; i < n - 1; i++) {
    let B = originFD[i], C = originFD[i + 1];
    let area = hTriangleArea(A, B, C);
    if (!isFinite(area) || area < epsilon) continue;
    let triCent = hNorm(vectPlus(vectPlus(A, B), C));
    cx += area * triCent[0];
    cy += area * triCent[1];
    cz += area * triCent[2];
    totalArea += area;
  }
  fdArea = totalArea;
  originFDCent = hNorm([cx / totalArea, cy / totalArea, cz / totalArea]);
}


// ── Math utilities ────────────────────────────────────────────────────────────

function hDot(P, Q) { return -P[0]*Q[0] + P[1]*Q[1] + P[2]*Q[2]; }

function vectType(P) {
  let inner = hDot(P, P);
  if (Math.abs(inner) < epsilon) return 0;
  return inner < 0 ? -1 : 1;
}

function hNorm(P) {
  let denom;
  if (vectType(P) === 0) { denom = 1/P[0]/Math.sqrt(2); }
  else { denom = Math.sqrt(Math.abs(hDot(P, P))); }
  let s = P[0] < 0 ? -1 : 1;
  return [P[0]*s/denom, P[1]*s/denom, P[2]*s/denom];
}

function normHDot(P, Q) {
  return Math.abs(hDot(P, Q)) / Math.sqrt(Math.abs(hDot(P,P) * hDot(Q,Q)));
}

function hDist(P, Q) {
  let N = normHDot(P, Q);
  if (N < 1 && N + epsilon > 1) N = 1;
  return Math.acosh(N);
}

function vectPlus(P, Q)  { return [P[0]+Q[0], P[1]+Q[1], P[2]+Q[2]]; }
function vectMinus(P, Q) { return [P[0]-Q[0], P[1]-Q[1], P[2]-Q[2]]; }
function scalarVect(s, V) { return [V[0]*s, V[1]*s, V[2]*s]; }
function tRef(P) { return [-P[0], P[1], P[2]]; }

function crossProd(P, Q) {
  return [P[1]*Q[2]-P[2]*Q[1], P[2]*Q[0]-P[0]*Q[2], P[0]*Q[1]-P[1]*Q[0]];
}

function points2Line(P, Q) {
  let dist = hDist(P, Q);
  let line = tRef(crossProd(P, Q));
  return scalarVect(1/Math.sinh(dist), line);
}

function reflPtOverLine(P, L) {
  return vectMinus(P, scalarVect(-2*hDot(P,L)/hDot(L,L), L));
}

function footOfPerp(P, L) {
  return hNorm(vectPlus(P, scalarVect(-hDot(P,L)/hDot(L,L), L)));
}

function midPoint(P, Q) { return hNorm(vectPlus(P, Q)); }

function multMatVect(mat, vect) {
  return [
    vect[0]*mat[0][0] + vect[1]*mat[0][1] + vect[2]*mat[0][2],
    vect[0]*mat[1][0] + vect[1]*mat[1][1] + vect[2]*mat[1][2],
    vect[0]*mat[2][0] + vect[1]*mat[2][1] + vect[2]*mat[2][2]
  ];
}

function multMatMat(M, N) {
  let L = [];
  for (let i = 0; i < 3; i++) {
    let row = [];
    for (let j = 0; j < 3; j++) {
      let e = 0;
      for (let k = 0; k < 3; k++) e += M[i][k]*N[k][j];
      row.push(e);
    }
    L.push(row);
  }
  return L;
}

// Re-orthogonalize a Lorentz matrix to counteract floating-point drift.
// Columns of a Lorentz matrix must be hDot-orthonormal: col0 timelike (-1), col1,2 spacelike (+1).
function reorthogLorentz(M) {
  let c0 = [M[0][0], M[1][0], M[2][0]];
  let c1 = [M[0][1], M[1][1], M[2][1]];
  // Normalize c0 (timelike)
  c0 = scalarVect(1 / Math.sqrt(-hDot(c0, c0)), c0);
  // Orthogonalize c1 against c0, then normalize (spacelike)
  // Gram-Schmidt: subtract (hDot(c1,c0)/hDot(c0,c0))*c0 = -hDot(c1,c0)*c0
  c1 = vectPlus(c1, scalarVect(hDot(c1, c0), c0));
  c1 = scalarVect(1 / Math.sqrt(hDot(c1, c1)), c1);
  // c2 = Minkowski cross product — always gives det=+1 frame.
  // Negate if M had det < 0 to preserve orientation (reflections).
  let c2 = tRef(crossProd(c0, c1));
  if (matDet(M) < 0) c2 = scalarVect(-1, c2);
  return [
    [c0[0], c1[0], c2[0]],
    [c0[1], c1[1], c2[1]],
    [c0[2], c1[2], c2[2]]
  ];
}

function hReflMat(line) {
  let mat = [];
  let denom = hDot(line, line);
  for (let i = 0; i < 3; i++) {
    let row = [];
    for (let j = 0; j < 3; j++) {
      let e = -2*line[i]*line[j]/denom;
      if (j === 0) e *= -1;
      if (i === j) e += 1;
      row.push(e);
    }
    mat.push(row);
  }
  return mat;
}

function hFlipMat(P, Q) {
  let diff = vectMinus(P, Q);
  diff = scalarVect(1/Math.sqrt(hDot(diff,diff)), diff);
  let mat = [];
  for (let i = 0; i < 3; i++) {
    let row = [];
    for (let j = 0; j < 3; j++) {
      let e = -2*diff[i]*diff[j];
      if (j === 0) e *= -1;
      if (i === j) e += 1;
      row.push(e);
    }
    mat.push(row);
  }
  return mat;
}

function rotOrigMat(theta) {
  return [[1,0,0],[0,Math.cos(theta),-Math.sin(theta)],[0,Math.sin(theta),Math.cos(theta)]];
}

function rotMat(P, theta) {
  if (hDist(P, [1,0,0]) < epsilon) return rotOrigMat(theta);
  let mat1 = hFlipMat(P, [1,0,0]);
  let mat2 = rotOrigMat(-theta);
  return multMatMat(mat1, multMatMat(mat2, mat1));
}

function transOrigMat(P) {
  return [[P[0],P[1],P[2]],
          [P[1], P[1]*P[1]/(P[0]+1)+1, P[1]*P[2]/(P[0]+1)],
          [P[2], P[1]*P[2]/(P[0]+1),   P[2]*P[2]/(P[0]+1)+1]];
}

function transMat(P, Q) {
  let pRefl = JSON.stringify(P) === "[1,0,0]"
    ? identity
    : hFlipMat(P, [1,0,0]);
  let newQ = multMatVect(pRefl, Q);
  let trans1 = transOrigMat(newQ);
  return multMatMat(pRefl, multMatMat(trans1, pRefl));
}

// Orientation-reversing isometry mapping segment P→Q to segment R→S.
// Composed as hReflMat(geodesic RS) * isomSeg2Seg(P,Q,R,S).
function isomSeg2SegFlip(P, Q, R, S) {
  return multMatMat(hReflMat(points2Line(R, S)), isomSeg2Seg(P, Q, R, S));
}


function isomSeg2Seg(P, Q, R, S, twist=0) {
  if (Math.abs(normHDot(P,Q) - normHDot(R,S)) >= epsilon) return "Error. Don't match!";
  if (twist !== 0) {
    let d = hDist(R, S);
    let V = scalarVect(1/Math.sinh(d), vectMinus(S, scalarVect(Math.cosh(d), R)));
    let td = twist * d;
    let Rprime = vectPlus(scalarVect(Math.cosh(td),     R), scalarVect(Math.sinh(td),     V));
    let Sprime = vectPlus(scalarVect(Math.cosh(td + d), R), scalarVect(Math.sinh(td + d), V));
    R = Rprime;
    S = Sprime;
  }
  let reflMat1, reflMat2;
  if (hDist(P, R) < epsilon) {
    if (hDist(Q, S) < epsilon) return identity;
    reflMat1 = hFlipMat(Q, S);
    reflMat2 = hReflMat(points2Line(R, S));
    return multMatMat(reflMat2, reflMat1);
  }
  reflMat1 = hReflMat(vectMinus(P, R));
  let QPrime = multMatVect(reflMat1, Q);
  reflMat2 = hDist(S, QPrime) < epsilon * 1000
    ? hReflMat(points2Line(R, S))
    : hReflMat(vectMinus(S, QPrime));
  return multMatMat(reflMat2, reflMat1);
}

function hTriangleArea(A, B, C) {
  let ab = hDot(A, B), ac = hDot(A, C), bc = hDot(B, C);
  let cosA = (ab*ac - bc) / (Math.sqrt(ab*ab - 1) * Math.sqrt(ac*ac - 1));
  let cosB = (ab*bc - ac) / (Math.sqrt(ab*ab - 1) * Math.sqrt(bc*bc - 1));
  let cosC = (ac*bc - ab) / (Math.sqrt(ac*ac - 1) * Math.sqrt(bc*bc - 1));
  return Math.PI - Math.acos(Math.max(-1, Math.min(1, cosA)))
                 - Math.acos(Math.max(-1, Math.min(1, cosB)))
                 - Math.acos(Math.max(-1, Math.min(1, cosC)));
}


// ── Triangle solvers ──────────────────────────────────────────────────────────

function solve3Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [0, Math.cos(alpha), Math.sin(alpha)];
  let sideAY = (Math.cos(gamma) + Math.cos(alpha)*Math.cos(beta)) / Math.sin(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [-Math.sqrt(sideAX*sideAX + sideAY*sideAY - 1), sideAX, -sideAY];
  return [hNorm(crossProd(tRef(sideB),tRef(sideC))),
          hNorm(crossProd(tRef(sideC),tRef(sideA))),
          hNorm(crossProd(tRef(sideA),tRef(sideB)))];
}

function solve2Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha), Math.cosh(alpha), 0];
  let sideAT = (Math.cos(gamma) + Math.cosh(alpha)*Math.cos(beta)) / Math.sinh(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [sideAT, sideAX, Math.sqrt(-sideAX*sideAX + sideAT*sideAT + 1)];
  let segAlpha = hNorm(crossProd(tRef(sideB),tRef(sideC)));
  let vertBeta  = hNorm(crossProd(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(crossProd(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(crossProd(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(crossProd(tRef(segAlpha),tRef(sideB)));
  return [vertAlphaB, vertAlphaC, vertBeta, vertGamma];
}

function solve1Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha), Math.cosh(alpha), 0];
  let sideAT = (Math.cos(gamma) + Math.cosh(alpha)*Math.cosh(beta)) / Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT, sideAX, Math.sqrt(-sideAX*sideAX + sideAT*sideAT + 1)];
  let segAlpha = hNorm(crossProd(tRef(sideB),tRef(sideC)));
  let segBeta  = hNorm(crossProd(tRef(sideC),tRef(sideA)));
  let vertGamma  = hNorm(crossProd(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(crossProd(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(crossProd(tRef(segAlpha),tRef(sideB)));
  let vertBetaA  = hNorm(crossProd(tRef(segBeta),tRef(sideA)));
  let vertBetaC  = hNorm(crossProd(tRef(segBeta),tRef(sideC)));
  return [vertAlphaB, vertAlphaC, vertBetaC, vertBetaA, vertGamma];
}

function solve0Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha), Math.cosh(alpha), 0];
  let sideAT = (Math.cosh(gamma) + Math.cosh(alpha)*Math.cosh(beta)) / Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT, sideAX, Math.sqrt(-sideAX*sideAX + sideAT*sideAT + 1)];
  let segAlpha = hNorm(crossProd(tRef(sideB),tRef(sideC)));
  let segBeta  = hNorm(crossProd(tRef(sideC),tRef(sideA)));
  let segGamma = hNorm(crossProd(tRef(sideA),tRef(sideB)));
  return [hNorm(crossProd(tRef(segAlpha),tRef(sideB))),
          hNorm(crossProd(tRef(segAlpha),tRef(sideC))),
          hNorm(crossProd(tRef(segBeta), tRef(sideC))),
          hNorm(crossProd(tRef(segBeta), tRef(sideA))),
          hNorm(crossProd(tRef(segGamma),tRef(sideA))),
          hNorm(crossProd(tRef(segGamma),tRef(sideB)))];
}

// ── Atom builders ─────────────────────────────────────────────────────────────

function getAtom(thisType, thisParamList) {
  if (thisType[0] === "S") return getSheet(thisType, thisParamList);
  if (thisType[0] === "C") return getPCase(thisType, thisParamList);
  if (thisType[0] === "P") return getPillow(thisType, thisParamList);
}

function getSheet(thisType, thisParamList) {
  if (thisType === "S6") return solve0Ang(thisParamList[0], thisParamList[1], thisParamList[2]);
  if (thisType === "S5") return solve1Ang(thisParamList[0], thisParamList[1], Math.PI/thisParamList[2]);
  if (thisType === "S4") return solve2Ang(thisParamList[0], Math.PI/thisParamList[1], Math.PI/thisParamList[2]);
  return solve3Ang(Math.PI/thisParamList[0], Math.PI/thisParamList[1], Math.PI/thisParamList[2]);
}

function getPCase(thisType, thisParamList) {
  if (thisType === "C3") {
    let a1 = Math.PI/thisParamList[0], a2 = Math.PI/thisParamList[1];
    return solve3Ang(a1*2, a2/2, a2/2);
  }
  if (thisType === "C4") {
    let s1 = thisParamList[0]/2, a1 = Math.PI/thisParamList[1];
    return solve2Ang(s1*2, a1/2, a1/2);
  }
  if (thisType === "C5") {
    let a1 = 2*Math.PI/thisParamList[0], s1 = thisParamList[1];
    let s2 = Math.asinh(Math.sqrt((1+Math.cos(a1))/(Math.cosh(s1)-1)));
    return solve1Ang(s2, s2, a1);
  }
  // C6
  let s1 = thisParamList[0], s3 = thisParamList[1];
  let s2 = Math.asinh(Math.sqrt((Math.cosh(s1)+1)/(Math.cosh(s3)-1)));
  return solve0Ang(s2, s2, s1);
}

function getPillow(thisType, thisParamList) {
  let angle1, angle2, angle3, side1, side2, side3, mid1, vert1, vert2;
  let shape1, shape2, newShape2, myMat, myShape;

  if (thisType === "P3") {
    angle1 = Math.PI/thisParamList[0]; angle2 = Math.PI/thisParamList[1]; angle3 = Math.PI/thisParamList[2];
    shape1 = solve3Ang(angle1, angle3, angle2);
    shape2 = solve3Ang(angle1, angle2, angle3);
    myMat = isomSeg2Seg(shape2[0], shape2[2], shape1[0], shape1[1]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [newShape2[0], newShape2[1], newShape2[2], shape1[2]];
    mid1 = midPoint(myShape[3], myShape[0]);
    myMat = isomSeg2Seg(myShape[2], myShape[3], myShape[2], myShape[1]);
    vert1 = multMatVect(myMat, mid1);
    myShape = [myShape[0], myShape[1], vert1, myShape[2], mid1];
    mid1 = midPoint(myShape[0], myShape[1]);
    myShape = [myShape[0], mid1, myShape[1], myShape[2], myShape[3], myShape[4]];

  } else if (thisType === "P4") {
    side1 = thisParamList[0]/2; angle2 = Math.PI/thisParamList[1]; angle3 = Math.PI/thisParamList[2];
    shape1 = solve2Ang(side1, angle2, angle3);
    shape2 = solve2Ang(side1, angle3, angle2);
    myMat = isomSeg2Seg(shape2[0], shape2[3], shape1[1], shape1[2]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [newShape2[1], newShape2[2], newShape2[3], shape1[3], shape1[0]];
    mid1 = midPoint(myShape[3], myShape[4]);
    myMat = isomSeg2Seg(myShape[2], myShape[3], myShape[2], myShape[1]);
    vert1 = multMatVect(myMat, mid1);
    myShape = [myShape[4], myShape[0], myShape[1], vert1, myShape[2], mid1];
    mid1 = midPoint(myShape[1], myShape[2]);
    myShape = [myShape[0], myShape[1], mid1, myShape[2], myShape[3], myShape[4], myShape[5]];

  } else if (thisType === "P5") {
    side1 = thisParamList[0]/2; side2 = thisParamList[1]/2; angle3 = Math.PI/thisParamList[2];
    shape1 = solve1Ang(side1, side2, angle3);
    shape2 = solve1Ang(side2, side1, angle3);
    myMat = isomSeg2Seg(shape2[3], shape2[4], shape1[0], shape1[4]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [shape1[1], shape1[2], shape1[3], shape1[4], newShape2[0], newShape2[1], newShape2[2]];
    mid1 = midPoint(myShape[5], myShape[6]);
    myMat = isomSeg2Seg(myShape[3], myShape[4], myShape[3], myShape[2]);
    vert1 = multMatVect(myMat, mid1);
    vert2 = multMatVect(myMat, myShape[5]);
    myShape = [myShape[6], myShape[0], myShape[1], vert2, vert1, myShape[3], mid1];
    mid1 = midPoint(myShape[1], myShape[2]);
    myShape = [myShape[0], myShape[1], mid1, myShape[2], myShape[3], myShape[4], myShape[5], myShape[6]];

  } else { // P6
    side1 = thisParamList[0]/2; side2 = thisParamList[1]/2; side3 = thisParamList[2]/2;
    shape1 = solve0Ang(side1, side2, side3);
    shape2 = solve0Ang(side2, side1, side3);
    myMat = isomSeg2Seg(shape2[1], shape2[2], shape1[2], shape1[1]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [newShape2[3], newShape2[4], newShape2[5], newShape2[0], shape1[3], shape1[4], shape1[5], shape1[0]];
    mid1 = midPoint(myShape[6], myShape[7]);
    myMat = isomSeg2Seg(myShape[4], myShape[5], myShape[3], myShape[2]);
    vert1 = multMatVect(myMat, mid1);
    vert2 = multMatVect(myMat, myShape[6]);
    myShape = [myShape[7], myShape[0], myShape[1], vert2, vert1, myShape[3], myShape[4], mid1];
    let myLine = points2Line(myShape[5], myShape[6]);
    myShape[5] = footOfPerp(myShape[4], myLine);
    myShape[6] = footOfPerp(myShape[7], myLine);
    mid1 = midPoint(myShape[1], myShape[2]);
    myShape = [myShape[0], myShape[1], mid1, myShape[2], myShape[3], myShape[4], myShape[5], myShape[6], myShape[7]];
  }
  return myShape;
}

// Returns number of vertices for a given atom type.
function nVertsForAtom(type) {
  let n = parseInt(type[1]);
  if (type[0] === "P") return n + 3; // P3→6, P4→7, P5→8, P6→9
  return n;                          // S3→3...S6→6, C3→3...C6→6
}

// Builds paramPtList[] from match[], atomPtList[], params[].
// paramPtList[i] = [P, Q, twist] — endpoints and twist of step edge i,
// taken from the lower-indexed atom. Indexed like match[] (entry 0 unused).
function buildParamPtList() {
  paramPtList = [0];
  for (let j = 1; j < match.length; j++) {
    if (match[j].length === 0) { paramPtList.push(null); continue; }
    // length 1 = self-gluing edge (crosscap); length 2 = two matched edges (handle etc.)
    let entry = match[j].length === 1 ? match[j][0]
      : (match[j][0][0] <= match[j][1][0] ? match[j][0] : match[j][1]);
    let atomIdx = entry[0], startVert = entry[1];
    let nVerts = nVertsForAtom(atomList[atomIdx][0]);
    let P = atomPtList[atomIdx][startVert];
    let Q = atomPtList[atomIdx][(startVert + 1) % nVerts];
    let twist = params[j][1] ?? 0;
    paramPtList.push([P, Q, twist]);
  }
}


// Builds atomPtList[] from atomList[], params[], glueMatch[], match[].
// Geometric: call whenever params change (also called from reDo for initial build).
function buildAtomPtList() {
  atomPtList = [];
  for (let i = 0; i < atomList.length; i++) {
    let nextAtom = atomList[i];
    let nextType = nextAtom[0];

    // Build parameter list: positive entries are angle denominators,
    // negative entries are step edges — look up the length from params[].
    let paramList = [];
    for (let j = 1; j < nextAtom.length; j++) {
      paramList.push(nextAtom[j] > 0 ? nextAtom[j] : params[-nextAtom[j]][0]);
    }

    let nextShape = getAtom(nextType, paramList);

    if (i > 0) {
      let j = glueMatch[i];
      // Determine which match entry is the anchor (already placed) and which is new.
      let anchorEntry = match[j][0][0] === i ? match[j][1] : match[j][0];
      let newEntry    = match[j][0][0] === i ? match[j][0] : match[j][1];

      let nVerts       = nVertsForAtom(nextType);
      let newStart     = newEntry[1];
      let newEnd       = (newStart + 1) % nVerts;

      let anchorAtomIdx = anchorEntry[0];
      let anchorNVerts  = nVertsForAtom(atomList[anchorAtomIdx][0]);
      let anchorStart   = anchorEntry[1];
      let anchorEnd     = (anchorStart + 1) % anchorNVerts;

      // Map new edge (newStart→newEnd) onto anchor edge (anchorEnd→anchorStart).
      // Reversed because adjacent edges are traversed in opposite orientations.
      let twist = params[j][1] ?? 0;
      let mat = isomSeg2Seg(
        nextShape[newStart], nextShape[newEnd],
        atomPtList[anchorAtomIdx][anchorEnd], atomPtList[anchorAtomIdx][anchorStart],
        twist
      );
      nextShape = nextShape.map(v => multMatVect(mat, v));
    }

    atomPtList.push(nextShape);
  }
}


// ── Coordinate conversion & drawing helpers ───────────────────────────────────

function pt2Screen(P, zoom = 1) {
  let x =  P[1]/(P[0]+zoom) * scrRadius + scrCenterX;
  let y = -P[2]/(P[0]+zoom) * scrRadius + scrCenterY;
  return [x, y];
}

function polyMoreVert(vertices) {
  let extra = 3;
  let moreVert = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    let seg = divSeg(vertices[i], vertices[i+1], extra);
    seg.pop();
    moreVert = moreVert.concat(seg);
  }
  let seg = divSeg(vertices[vertices.length-1], vertices[0], extra);
  seg.pop();
  return moreVert.concat(seg);
}

function divSeg(P, Q, n) {
  let myList = [];
  for (let i = 0; i < n+2; i++) {
    myList.push(hNorm(vectPlus(scalarVect(i/(n+1), Q), scalarVect((n+1-i)/(n+1), P))));
  }
  return myList;
}


// ── Bezier geodesic rendering ─────────────────────────────────────────────────

// Screen-space tangent [dx,dy] at view-space point Xv, for hyperboloid tangent Xp = dX/ds.
function geodTangentScreen(Xv, Xp) {
  let d = Xv[0] + hZoom;
  return [
     (Xp[1] * d - Xv[1] * Xp[0]) / (d * d) * scrRadius,
    -(Xp[2] * d - Xv[2] * Xp[0]) / (d * d) * scrRadius
  ];
}

// Add one cubic Bezier piece along the geodesic from param s1 to s2.
// N = foot of perp from origin, T = unit tangent at N (pointing towards positive s).
// Assumes ctx path is already positioned at pt2Screen(X(s1)).
function addGeodPiece(ctx, s1, s2, N, T) {
  function X(s)  { return vectPlus(scalarVect(Math.cosh(s), N), scalarVect(Math.sinh(s), T)); }
  function Xp(s) { return vectPlus(scalarVect(Math.sinh(s), N), scalarVect(Math.cosh(s), T)); }
  let S1 = pt2Screen(X(s1), hZoom), S2 = pt2Screen(X(s2), hZoom);
  let t1 = geodTangentScreen(X(s1), Xp(s1));
  let t2 = geodTangentScreen(X(s2), Xp(s2));
  let alpha = (s2 - s1) / 3;
  ctx.bezierCurveTo(
    S1[0] + alpha * t1[0], S1[1] + alpha * t1[1],
    S2[0] - alpha * t2[0], S2[1] - alpha * t2[1],
    S2[0], S2[1]
  );
}

// Add a geodesic edge from view-space Pv to Qv as Bezier path command(s).
// Ctx must already be positioned at pt2Screen(Pv).
function addGeodEdge(ctx, Pv, Qv) {
  if (hDist(Pv, Qv) < epsilon) return;

  if (hZoom < epsilon) {
    let S2 = pt2Screen(Qv, hZoom);
    ctx.lineTo(S2[0], S2[1]);
    return;
  }

  let L = points2Line(Pv, Qv);
  let N = footOfPerp([1, 0, 0], L);
  let c = hDot(N, Pv);                            // = -cosh(dist(N,Pv))
  let T_raw = vectPlus(Pv, scalarVect(c, N));     // component of Pv orthogonal to N
  let d_P = Math.sqrt(Math.max(0, c * c - 1));    // = sinh(dist(N,Pv))

  if (d_P < epsilon) {
    let S2 = pt2Screen(Qv, hZoom);
    ctx.lineTo(S2[0], S2[1]);
    return;
  }

  let T  = scalarVect(1 / d_P, T_raw);      // unit tangent at N towards Pv
  let sP = Math.asinh(hDot(T, Pv));         // > 0  (T points to Pv)
  let sQ = Math.asinh(hDot(T, Qv));         // signed

  if (sP * sQ < 0) {
    // Foot lies between endpoints: split into two pieces
    addGeodPiece(ctx, sP, 0, N, T);
    addGeodPiece(ctx, 0, sQ, N, T);
  } else {
    addGeodPiece(ctx, sP, sQ, N, T);
  }
}

// Add a closed geodesic polygon path (moveTo first vertex, Bezier edges, no closePath).
// viewVerts: array of view-space hyperboloid points.
function addGeodPolyPath(ctx, viewVerts) {
  let n = viewVerts.length;
  let S0 = pt2Screen(viewVerts[0], hZoom);
  ctx.moveTo(S0[0], S0[1]);
  for (let i = 0; i < n; i++) {
    addGeodEdge(ctx, viewVerts[i], viewVerts[(i + 1) % n]);
  }
}


// ── screen ↔ hyperboloid ──────────────────────────────────────────────────────

// Project a scene-space point through moveMat to screen coordinates.
function dispPt(p) { return pt2Screen(multMatVect(moveMat, p), hZoom); }

function screen2Pt(scrPt, zoom) {
  let x = (scrPt[0] - scrCenterX) / scrRadius;
  let y = (-scrPt[1] + scrCenterY) / scrRadius;
  let r2 = x*x + y*y;
  if (r2 >= 1) { let r = Math.sqrt(r2) / 0.9999; x /= r; y /= r; r2 = (0.9999)*(0.9999); }
  let a = 1 - r2;
  let b = -2 * r2 * zoom;
  let c = -1 - r2 * zoom * zoom;
  let Ht = (-b + Math.sqrt(b*b - 4*a*c)) / 2 / a;
  return [Ht, x*(Ht + zoom), y*(Ht + zoom)];
}


// ── n-gon helper ───────────────────────────────────────────────────────────────

// Given center C and first vertex V, returns all n vertices of a regular n-gon.
function nGonVerts(C, V, n) {
  let M = rotMat(C, 2 * Math.PI / n);
  let verts = [V];
  for (let k = 1; k < n; k++) verts.push(multMatVect(M, verts[k - 1]));
  return verts;
}


// ── O(2,1) matrix inverse ─────────────────────────────────────────────────────
// For any isometry M in O(2,1): M⁻¹ = η Mᵀ η, η = diag(-1,1,1).
// Works for both orientation-preserving and reversing isometries.
function invMat(M) {
  return [
    [ M[0][0], -M[1][0], -M[2][0]],
    [-M[0][1],  M[1][1],  M[2][1]],
    [-M[0][2],  M[1][2],  M[2][2]]
  ];
}

function getInvMove() { return invMat(moveMat); }

function matDet(M) {
  return M[0][0]*(M[1][1]*M[2][2] - M[1][2]*M[2][1])
       - M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0])
       + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0]);
}


// ── baseFD ─────────────────────────────────────────────────────────────────────

// Finds which existing neighborMats tile is nearest to the current view centre.
// Lightweight scan — does NOT modify moveMat. Safe to call any time.
function updateBaseFD() {
  if (!neighborCents || neighborCents.length === 0) { baseFDIdx = 0; return; }
  let minT = Infinity, bestIdx = 0;
  for (let i = 0; i < neighborCents.length; i++) {
    let t = multMatVect(moveMat, neighborCents[i])[0];
    if (t < minT) { minT = t; bestIdx = i; }
  }
  baseFDIdx = bestIdx;
}

// Aligns moveMat so the tile nearest to (1,0,0) becomes the identity tile.
// Uses a greedy walk through genMats to find the true nearest tile globally.
// Rebuilds neighborMats from the new position. Returns true if an align occurred.
// Also updates tempMat and panBestI/panBestJ when called mid-drag (pass updateDragState=true).
function alignBaseFD(updateDragState) {
  // Greedy walk: find nearest tile (det=+1 or det=-1) to view centre in scene space.
  let viewCenterScene = hNorm(multMatVect(invMat(moveMat), [1,0,0]));
  let bestMat  = identity;
  let bestCent = originFDCent;
  let improved = true;
  while (improved) {
    improved = false;
    for (let k = 0; k < genMats.length; k++) {
      let tryMat  = multMatMat(genMats[k], bestMat);
      let tryCent = multMatVect(tryMat, originFDCent);
      if (hDist(tryCent, viewCenterScene) < hDist(bestCent, viewCenterScene) - 1e-6) {
        bestMat  = tryMat;
        bestCent = tryCent;
        improved = true;
        break;
      }
    }
  }
  // If the identity tile is already nearest, nothing to do.
  if (hDist(bestCent, viewCenterScene) >= hDist(originFDCent, viewCenterScene) - 1e-6) return false;

  // Compute candidateMat = moveMat * bestMat (position of bestMat tile in view space).
  let candidateMat = multMatMat(moveMat, bestMat);
  let alignDet = matDet(candidateMat) < 0 ? -1 : 1;

  // Use two-vertex trick so the visual position doesn't change (no jump).
  let newScr = originFD.map(p => pt2Screen(multMatVect(candidateMat, p), hZoom));
  let bI = 0, bJ = 1, pbd = -1;
  for (let i = 0; i < newScr.length; i++)
    for (let j = i+1; j < newScr.length; j++) {
      let dx = newScr[i][0]-newScr[j][0], dy = newScr[i][1]-newScr[j][1];
      let d = dx*dx+dy*dy;
      if (d > pbd) { pbd = d; bI = i; bJ = j; }
    }
  let V0 = hNorm(multMatVect(candidateMat, originFD[bI]));
  let V1 = hNorm(multMatVect(candidateMat, originFD[bJ]));
  let newMat = alignDet < 0
    ? isomSeg2SegFlip(originFD[bI], originFD[bJ], V0, V1)
    : isomSeg2Seg(originFD[bI], originFD[bJ], V0, V1);
  moveMat = (typeof newMat === 'string') ? candidateMat : newMat;
  if (isFinite(moveMat[0][0]) && isFinite(moveMat[1][1]) && isFinite(moveMat[2][2]))
    lastGoodMoveMat = moveMat.map(row => [...row]);

  buildNeighborMats();
  baseFDIdx = 0;
  if (updateDragState) {
    tempMat = moveMat.map(row => [...row]);
    panBestI = bI;
    panBestJ = bJ;
    panDet = alignDet;  // new moveMat has this det sign
  }
  return true;
}


// ── geometric rebuild ─────────────────────────────────────────────────────────

// Rebuilds all geometry from atomList/params. Called by reDo() and parameter editing.
function rebuildGeom() {
  buildAtomPtList();
  buildParamPtList();
  buildOriginFD();
  buildOriginFDCent();
  recenterMat = transMat(originFDCent, [1, 0, 0]);
  originFD = originFD.map(p => multMatVect(recenterMat, p));
  originFDCent = multMatVect(recenterMat, originFDCent);
  for (let j = 1; j < paramPtList.length; j++) {
    if (paramPtList[j] === null) continue;
    paramPtList[j] = [
      multMatVect(recenterMat, paramPtList[j][0]),
      multMatVect(recenterMat, paramPtList[j][1]),
      paramPtList[j][2]
    ];
  }
  atomPtList = atomPtList.map(atom => atom.map(p => multMatVect(recenterMat, p)));
  // Stack shapes are stored as absolute hyperboloid positions — do NOT apply recenterMat.
  // Their screen position is moveMat * s[1], which stays fixed because moveMat is unchanged.
  buildAllGenMats();
  buildAllMappedCents();
  buildIndexedCents();
  buildGenMats();
  buildNeighborMats();
  updateBaseFD();
}


// ── mode / UI setters ──────────────────────────────────────────────────────────

function setMode(newMode) {
  mode = newMode;
  if (newMode === 3) mode = parseInt(document.getElementById("ngon").value);
  draw();
}

function setColor() { color = document.getElementById("color").value; }
function setFill()  { fill = document.getElementById("fill").checked ? 1 : 0; }

function setZoom() {
  hZoom = Number(document.getElementById("zoom").value);
  document.getElementById("zoomVal").textContent = hZoom.toFixed(2);
  draw();
}

function setNgon() {
  ngon = parseInt(document.getElementById("ngon").value);
  if (mode >= 3) { mode = ngon; draw(); }
}


// ── undo / redo ────────────────────────────────────────────────────────────────

function goUndo() { if (stack.length  > 0) { undoStack.push(stack.pop());  draw(); } }
function goRedo() { if (undoStack.length > 0) { stack.push(undoStack.pop()); draw(); } }


// ── save / export ──────────────────────────────────────────────────────────────

function goPng(elem) {
  elem.href = document.getElementById("myCanvas").toDataURL("image/png");
}

function goSave(elem) {
  let blob = new Blob([JSON.stringify({ stack, moveMat })], { type: "text/plain" });
  elem.href = URL.createObjectURL(blob);
  elem.download = "myData.json";
}


// ── resize ─────────────────────────────────────────────────────────────────────

function resize() {
  let c = document.getElementById("myCanvas");
  c.height = window.innerHeight - 220;
  c.width  = window.innerWidth  - 205;
  scrCenterX = Math.round(c.width  / 2);
  scrCenterY = Math.round(c.height / 2);
  let d = document.getElementById("canvasDiv");
  d.style.maxHeight = window.innerHeight - 195 + "px";
  d.style.height    = window.innerHeight - 195 + "px";
  d.style.maxWidth  = window.innerWidth  - 180 + "px";
  d.style.width     = window.innerWidth  - 180 + "px";
  draw();
}


// ── mouse handlers ─────────────────────────────────────────────────────────────

function mousePressed(event) {
  let c = document.getElementById("myCanvas");
  let r = c.getBoundingClientRect();
  posA   = [Math.round(event.clientX - r.left), Math.round(event.clientY - r.top)];
  posA3d = screen2Pt(posA, hZoom);

  if (mode === -1) {
    tempMat = moveMat.map(row => [...row]);
    panDet = matDet(tempMat) >= 0 ? 1 : -1;
    // Precompute the two most screen-separated vertices of the identity tile at press time
    let scrVerts = originFD.map(p => pt2Screen(multMatVect(moveMat, p), hZoom));
    panBestI = 0; panBestJ = 1; let panBestDist = -1;
    for (let i = 0; i < scrVerts.length; i++)
      for (let j = i+1; j < scrVerts.length; j++) {
        let dx = scrVerts[i][0]-scrVerts[j][0], dy = scrVerts[i][1]-scrVerts[j][1];
        let d = dx*dx + dy*dy;
        if (d > panBestDist) { panBestDist = d; panBestI = i; panBestJ = j; }
      }
    return;
  }

  if (mode === 0) { // edit: find closest control point
    shapeNum = -1; paramNum = -1;
    moveMatAtPress = moveMat.map(row => [...row]);

    // hit-test twist markers (diamonds) first
    for (let j = 1; paramPtList && j < paramPtList.length; j++) {
      if (!paramPtList[j]) continue;
      if (stepEdges[j] !== 3 && stepEdges[j] !== 8) continue;
      let [P, Q, twist] = paramPtList[j];
      let t = Math.max(0, Math.min(1, twist));
      let twistPt = hNorm(vectPlus(scalarVect(1 - t, P), scalarVect(t, Q)));
      let s = dispPt(twistPt);
      if (Math.abs(posA[0] - s[0]) < editBoxSize && Math.abs(posA[1] - s[1]) < editBoxSize) {
        paramNum = j; paramEnd = -1;
        paramDragLine = points2Line(P, Q);
        return;
      }
    }

    // hit-test param endpoints
    for (let j = 1; paramPtList && j < paramPtList.length; j++) {
      if (!paramPtList[j]) continue;
      let [P, Q] = paramPtList[j];
      let sP = dispPt(P), sQ = dispPt(Q);
      if (Math.abs(posA[0] - sP[0]) < editBoxSize && Math.abs(posA[1] - sP[1]) < editBoxSize) {
        paramNum = j; paramEnd = 0;
        paramDragFixed = multMatVect(moveMat, Q);
        paramDragFixedScene = Q;
        paramDragLine = points2Line(P, Q);
        return;
      }
      if (Math.abs(posA[0] - sQ[0]) < editBoxSize && Math.abs(posA[1] - sQ[1]) < editBoxSize) {
        paramNum = j; paramEnd = 1;
        paramDragFixed = multMatVect(moveMat, P);
        paramDragFixedScene = P;
        paramDragLine = points2Line(P, Q);
        return;
      }
    }

    // hit-test stack shapes
    for (let i = 0; i < stack.length; i++) {
      let s1 = dispPt(stack[i][1]);
      let s2 = dispPt(stack[i][2]);
      if (Math.abs(posA[0]-s1[0]) < editBoxSize && Math.abs(posA[1]-s1[1]) < editBoxSize) {
        shapeNum = i; controlPt = 1; break;
      }
      if (Math.abs(posA[0]-s2[0]) < editBoxSize && Math.abs(posA[1]-s2[1]) < editBoxSize) {
        shapeNum = i; controlPt = 2; break;
      }
    }
  }
}

function mouseMoved(event) {
  let c = document.getElementById("myCanvas");
  let r = c.getBoundingClientRect();
  posB   = [Math.round(event.clientX - r.left), Math.round(event.clientY - r.top)];
  posB3d = screen2Pt(posB, hZoom);

  if (mode === 0 && paramNum >= 0) { // edit: drag param marker
    let mouseScene = multMatVect(invMat(moveMatAtPress), posB3d);
    let F = footOfPerp(mouseScene, paramDragLine);

    if (paramEnd === -1) {
      // twist drag: project onto geodesic, compute fractional position
      let [P, Q] = paramPtList[paramNum];
      let lenPQ = hDist(P, Q);
      if (lenPQ > epsilon) {
        let distPF = hDist(P, F);
        let distFQ = hDist(F, Q);
        let t;
        if (distPF + distFQ < lenPQ + 0.001) {
          t = distPF / lenPQ;           // F between P and Q
        } else if (distFQ > lenPQ) {
          t = 0;                         // F is past P (other side)
        } else {
          t = 1;                         // F is past Q
        }
        if (t < epsilon) t = 0;
        params[paramNum][1] = t;
        paramPtList[paramNum][2] = t;  // keep draw() in sync for partial rebuild
      }
      // partial rebuild: skip atomPtList/originFD for step-3 (they don't depend on twist)
      // Keep baseFDIdx stable during drag — align on mouse release.
      let savedIdx = baseFDIdx;
      if (stepEdges[paramNum] === 3) {
        buildAllGenMats(); buildAllMappedCents(); buildIndexedCents();
        buildGenMats(); buildNeighborMats();
      } else {
        rebuildGeom();
      }
      baseFDIdx = savedIdx;
      draw(); return;
    }

    // endpoint drag
    let fixedPtScene = paramDragFixedScene;  // saved at mousePressed (stable across moves)
    if (hDist(F, fixedPtScene) < epsilon * 100) { draw(); return; }
    let newLen = hDist(F, fixedPtScene);
    params[paramNum][0] = newLen;

    let F_view = multMatVect(moveMatAtPress, F);
    // Keep baseFDIdx stable during drag — align on mouse release.
    let savedIdx = baseFDIdx;
    rebuildGeom();
    baseFDIdx = savedIdx;

    // adjust moveMat so new param segment aligns with dragged position.
    // use orientation-matching variant so panned (possibly reflected) view stays consistent.
    let P_new = paramPtList[paramNum][paramEnd];
    let Q_new = paramPtList[paramNum][1 - paramEnd];
    moveMat = matDet(moveMatAtPress) >= 0
      ? isomSeg2Seg(P_new, Q_new, F_view, paramDragFixed, 0)
      : isomSeg2SegFlip(P_new, Q_new, F_view, paramDragFixed);

    draw(); return;
  }

  if (mode === 0 && shapeNum >= 0) { // edit: move control point live
    stack[shapeNum][controlPt] = multMatVect(invMat(moveMat), posB3d);
    draw();
    return;
  }

  if (posA === 0) return;
  if (mode === -1) {
    let candidate = multMatMat(transMat(posA3d, posB3d), tempMat);
    if (isFinite(candidate[0][0])) {
      let V0 = hNorm(multMatVect(candidate, originFD[panBestI]));
      let V1 = hNorm(multMatVect(candidate, originFD[panBestJ]));
      let newMat = panDet < 0
        ? isomSeg2SegFlip(originFD[panBestI], originFD[panBestJ], V0, V1)
        : isomSeg2Seg(originFD[panBestI], originFD[panBestJ], V0, V1);
      moveMat = (typeof newMat !== 'string') ? newMat : candidate;
      if (isFinite(moveMat[0][0]) && isFinite(moveMat[1][1]) && isFinite(moveMat[2][2]))
        lastGoodMoveMat = moveMat.map(row => [...row]);
    }
  }
  draw();
}

function mouseReleased(event) {
  if (mode === 0) { shapeNum = -1; paramNum = -1; posA = 0; alignBaseFD(false); draw(); return; }
  if (posA === 0) { posB = 0; posB3d = 0; return; }
  let c = document.getElementById("myCanvas");
  let r = c.getBoundingClientRect();
  posB   = [Math.round(event.clientX - r.left), Math.round(event.clientY - r.top)];
  posB3d = screen2Pt(posB, hZoom);

  if (mode === -1) {
    alignBaseFD(false);
  }

  if (mode >= 1) {
    let inv = getInvMove();
    let P = multMatVect(inv, posA3d);
    let Q = multMatVect(inv, posB3d);
    undoStack = [];
    if (mode === 1) stack.push([1, P, Q, color]);
    else            stack.push([mode, P, Q, color, fill]);
  }

  posA = 0; posB = 0; posA3d = 0; posB3d = 0;
  draw();
}

function mouseClicked() {}


function draw() {
  // Sanity check: recover from NaN/Infinity in moveMat by aligning back to last good position.
  if (!moveMat || !isFinite(moveMat[0][0]) || !isFinite(moveMat[1][1]) || !isFinite(moveMat[2][2])) {
    console.warn('draw: bad moveMat, recovering');
    moveMat = lastGoodMoveMat.map(row => [...row]);
    buildNeighborMats();
    updateBaseFD();
  }
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");

  c.height = window.innerHeight - 220;
  c.width = window.innerWidth - 205;
  scrCenterX = Math.round(c.width / 2);
  scrCenterY = Math.round(c.height / 2);
  scrRadius = scrCenterY;

  // white background
  context.beginPath();
  context.rect(0, 0, c.width, c.height);
  context.fillStyle = "white";
  context.fill();

  // draw circle outline
  context.beginPath();
  context.lineWidth = 2;
  context.arc(scrCenterX, scrCenterY, scrRadius, 0, 2 * Math.PI);
  context.strokeStyle = "black";
  context.stroke();
  context.closePath();

  // draw baseFD tile filled beige (draw before other tiles so outlines appear on top)
  if (neighborMats && originFD && originFD.length > 0) {
    let vv = originFD.map(p => multMatVect(moveMat, multMatVect(neighborMats[baseFDIdx], p)));
    context.beginPath();
    addGeodPolyPath(context, vv);
    context.closePath();
    context.fillStyle = "beige";
    context.fill();
    context.strokeStyle = "darkgrey";
    context.lineWidth = 2;
    context.stroke();
  }

  // draw all neighbor tiles (outlines, baseFD already drawn above)
  if (neighborMats && originFD && originFD.length > 0) {
    for (let i = 0; i < neighborMats.length; i++) {
      if (i === baseFDIdx) continue;
      let vv = originFD.map(p => multMatVect(moveMat, multMatVect(neighborMats[i], p)));
      context.beginPath();
      addGeodPolyPath(context, vv);
      context.strokeStyle = "red";
      context.lineWidth = 1;
      context.stroke();
      context.closePath();
    }
  }

  // draw paramPtList segments
  if (paramPtList) {
    for (let j = 1; j < paramPtList.length; j++) {
      if (!paramPtList[j]) continue;
      let [P, Q, twist] = paramPtList[j];

      // segment
      let Pv = multMatVect(moveMat, P), Qv = multMatVect(moveMat, Q);
      context.beginPath();
      context.moveTo(...pt2Screen(Pv, hZoom));
      addGeodEdge(context, Pv, Qv);
      context.strokeStyle = "green";
      context.lineWidth = 1.5;
      context.stroke();

      // endpoint markers
      for (let ep = 0; ep < 2; ep++) {
        let pt = ep === 0 ? P : Q;
        let s = dispPt(pt);
        context.beginPath();
        context.arc(s[0], s[1], 4, 0, 2 * Math.PI);
        context.fillStyle = (paramNum === j && paramEnd === ep) ? "yellow" : "green";
        context.fill();
        context.closePath();
      }

      // twist marker (diamond) — only for step types 3 and 8
      if (stepEdges[j] === 3 || stepEdges[j] === 8) {
        let t = Math.max(0, Math.min(1, twist));
        let twistPt = hNorm(vectPlus(scalarVect(1 - t, P), scalarVect(t, Q)));
        let s = dispPt(twistPt);
        let r = 6;
        context.beginPath();
        context.moveTo(s[0],     s[1] - r);
        context.lineTo(s[0] + r, s[1]    );
        context.lineTo(s[0],     s[1] + r);
        context.lineTo(s[0] - r, s[1]    );
        context.closePath();
        context.fillStyle = (paramNum === j && paramEnd === -1) ? "yellow" : "orange";
        context.fill();
      }
    }
  }

  // draw stack shapes, tiled through all neighborMats
  if (stack.length > 0 && neighborMats) {
    for (let s = 0; s < stack.length; s++) {
      let shape = stack[s];
      context.strokeStyle = shape[3];
      context.lineWidth = 1.5;
      for (let t = 0; t < neighborMats.length; t++) {
        let M = neighborMats[t];
        if (shape[0] === 1) {
          // line: [1, P, Q, color]
          let Pv = multMatVect(moveMat, multMatVect(M, shape[1]));
          let Qv = multMatVect(moveMat, multMatVect(M, shape[2]));
          context.beginPath();
          context.moveTo(...pt2Screen(Pv, hZoom));
          addGeodEdge(context, Pv, Qv);
          context.stroke();
        } else {
          // polygon: [n, C, V, color, fill]  — center C, first vertex V
          let Cv = multMatVect(moveMat, multMatVect(M, shape[1]));
          let Vv = multMatVect(moveMat, multMatVect(M, shape[2]));
          let polyVerts = nGonVerts(Cv, Vv, shape[0]);
          context.beginPath();
          addGeodPolyPath(context, polyVerts);
          context.closePath();
          if (shape[4]) { context.fillStyle = shape[3]; context.fill(); }
          context.stroke();
        }
      }
    }
  }

  // draw current shape preview, tiled through all neighborMats
  if (posA !== 0 && posB !== 0 && mode >= 1 && neighborMats) {
    let inv = getInvMove();
    let P = multMatVect(inv, posA3d); // convert view-space → scene-space
    let Q = multMatVect(inv, posB3d);
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    for (let t = 0; t < neighborMats.length; t++) {
      let M = neighborMats[t];
      if (mode === 1) {
        let Pv = multMatVect(moveMat, multMatVect(M, P));
        let Qv = multMatVect(moveMat, multMatVect(M, Q));
        context.beginPath();
        context.moveTo(...pt2Screen(Pv, hZoom));
        addGeodEdge(context, Pv, Qv);
        context.stroke();
      } else {
        let Cv = multMatVect(moveMat, multMatVect(M, P));
        let Vv = multMatVect(moveMat, multMatVect(M, Q));
        let polyVerts = nGonVerts(Cv, Vv, mode);
        context.beginPath();
        addGeodPolyPath(context, polyVerts);
        context.closePath();
        if (fill) { context.fillStyle = color; context.fill(); }
        context.stroke();
      }
    }
  }

  // draw edit-mode control point markers
  if (mode === 0) {
    let r = editBoxSize;
    for (let s = 0; s < stack.length; s++) {
      for (let cp = 1; cp <= 2; cp++) {
        let sc = dispPt(stack[s][cp]);
        context.beginPath();
        context.rect(sc[0] - r, sc[1] - r, r*2, r*2);
        context.fillStyle = (s === shapeNum && cp === controlPt) ? "yellow" : "white";
        context.fill();
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.stroke();
      }
    }
  }

  // draw FD center (blue dot)
  if (originFDCent) {
    let ctr = dispPt(originFDCent);
    context.beginPath();
    context.arc(ctr[0], ctr[1], 4, 0, 2 * Math.PI);
    context.fillStyle = "blue";
    context.fill();
    context.closePath();
  }

  // draw all neighborCents (red dots)
  if (neighborCents) {
    for (let i = 0; i < neighborCents.length; i++) {
      let ctr = dispPt(neighborCents[i]);
      context.beginPath();
      context.arc(ctr[0], ctr[1], 3, 0, 2 * Math.PI);
      context.fillStyle = "red";
      context.fill();
      context.closePath();
    }
  }

}
