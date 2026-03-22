var scrRadius = 200;
var scrCenterX;
var scrCenterY;
var epsilon = 0.0000001;
var hZoom = 1;

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

  stepEdges = [0];
  params = [0];
  atomList = [];

  orbi2Atoms(handle, crosscap, cone, kali);
  atomList.reverse(); // start with the most connections

  buildMatch();
  buildBorderFD();
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
  buildAllGenMats();
  console.log("allGenMats[14]:", JSON.stringify(allGenMats[14]));
  buildAllMappedCents();

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
if (i===14) {alert(JSON.stringify([allGenMats[i],allMappedCents[i]]));}
    if (allMappedCents[i] === null) {allGenMats[i] = null;}
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
  if (P == [1,0,0]) return rotOrigMat(theta);
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
    ? [[1,0,0],[0,1,0],[0,0,1]]
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
    if (hDist(Q, S) < epsilon) return [[1,0,0],[0,1,0],[0,0,1]];
    reflMat1 = hFlipMat(Q, S);
    reflMat2 = hReflMat(points2Line(R, S));
    return multMatMat(reflMat2, reflMat1);
  }
  reflMat1 = hReflMat(vectMinus(P, R));
  let QPrime = multMatVect(reflMat1, Q);
  reflMat2 = hDist(S, QPrime) < epsilon
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
    if (match[j].length < 2) { paramPtList.push(null); continue; }
    let entry = match[j][0][0] <= match[j][1][0] ? match[j][0] : match[j][1];
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


function draw() {
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

  // draw atoms in atomPtList
  if (atomPtList) {
    let atomColors = ["#d0e8ff", "#d0ffd8", "#fff0d0", "#f0d0ff", "#ffd0d0", "#d0ffff"];
    for (let a = 0; a < atomPtList.length; a++) {
      let verts = polyMoreVert(atomPtList[a]).map(p => pt2Screen(p, hZoom));
      context.beginPath();
      context.moveTo(verts[verts.length-1][0], verts[verts.length-1][1]);
      verts.forEach(v => context.lineTo(v[0], v[1]));
      context.closePath();
      context.fillStyle = atomColors[a % atomColors.length];
      context.fill();
      context.strokeStyle = "steelblue";
      context.lineWidth = 1;
      context.stroke();
    }
  }

  // draw fundamental domain boundary
  if (originFD && originFD.length > 0) {
    let verts = polyMoreVert(originFD).map(p => pt2Screen(p, hZoom));
    context.beginPath();
    context.moveTo(verts[verts.length-1][0], verts[verts.length-1][1]);
    verts.forEach(v => context.lineTo(v[0], v[1]));
    context.strokeStyle = "darkgrey";
    context.lineWidth = 2;
    context.stroke();
  }

  // TEMP: draw originFD transformed by each allGenMats entry
  if (allGenMats && originFD && originFD.length > 0) {
    let seenCenters = [];
    for (let i = 0; i < allGenMats.length; i++) {
      if (!allGenMats[i]) continue;
      let cent = multMatVect(allGenMats[i], originFDCent);
      if (seenCenters.some(c => hDist(c, cent) < 0.1)) continue;
      seenCenters.push(cent);
      let transformed = originFD.map(p => multMatVect(allGenMats[i], p));
      let verts = polyMoreVert(transformed).map(p => pt2Screen(p, hZoom));
      context.beginPath();
      context.moveTo(verts[verts.length-1][0], verts[verts.length-1][1]);
      verts.forEach(v => context.lineTo(v[0], v[1]));
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
      let seg = divSeg(P, Q, 5).map(p => pt2Screen(p, hZoom));
      context.beginPath();
      context.moveTo(seg[0][0], seg[0][1]);
      for (let k = 1; k < seg.length; k++) context.lineTo(seg[k][0], seg[k][1]);
      context.strokeStyle = "green";
      context.lineWidth = 1.5;
      context.stroke();
      context.closePath();

      // endpoint markers
      for (let pt of [P, Q]) {
        let s = pt2Screen(pt, hZoom);
        context.beginPath();
        context.arc(s[0], s[1], 4, 0, 2 * Math.PI);
        context.fillStyle = "green";
        context.fill();
        context.closePath();
      }

      // twist marker (diamond) — only for step types 3 and 8
      if (stepEdges[j] === 3 || stepEdges[j] === 8) {
        let t = Math.max(0, Math.min(1, twist));
        let twistPt = hNorm(vectPlus(scalarVect(1 - t, P), scalarVect(t, Q)));
        let s = pt2Screen(twistPt, hZoom);
        let r = 6;
        context.beginPath();
        context.moveTo(s[0],     s[1] - r);
        context.lineTo(s[0] + r, s[1]    );
        context.lineTo(s[0],     s[1] + r);
        context.lineTo(s[0] - r, s[1]    );
        context.closePath();
        context.fillStyle = "orange";
        context.fill();
      }
    }
  }

  // draw FD center
  if (originFDCent) {
    let ctr = pt2Screen(originFDCent, hZoom);
    context.beginPath();
    context.arc(ctr[0], ctr[1], 4, 0, 2 * Math.PI);
    context.fillStyle = "blue";
    context.fill();
    context.closePath();
  }

  // draw centers for each isometry in allMappedCents[]
  if (allMappedCents) {
    for (let i = 0; i < allMappedCents.length; i++) {
      if (allMappedCents[i] === null) continue;
      let ctr = pt2Screen(allMappedCents[i], hZoom);
      context.beginPath();
      context.arc(ctr[0], ctr[1], 3, 0, 2 * Math.PI);
      context.fillStyle = "red";
      context.fill();
      context.closePath();
    }
  }

}
