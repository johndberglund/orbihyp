let handle;
let crosscap;
let cone;
let kali;

let newCone = [];
let newKali = [];
let atomList = [];
let newSheet = [];
let newPillow = [];
let firstInnerMatch;

let stepEdgeCount;
// stepEdges[i] is just the step number, e.g. [0, 3, 4, 4, 6, 7, 7, 7, 7]
let stepEdges;
// params[i] holds the length (and twist if step 3 or 8), e.g. [0, [2,0], [2], [2], ...]
let params;
// match[i] = list of [atomIndex, startVert] for each atom that has step edge i.
// Structural: only changes when orbifold changes.
let match;
// glueMatch[i] = step edge index used to position atom i against a previously placed atom.
// Atom 0 is the anchor. Structural: only changes when orbifold changes.
let glueMatch;

var scrRadius = 200;
var scrCenterX;
var scrCenterY;
var epsilon = 0.0000001;
var hZoom = 1;

let atomPtList;
// borderFD[i] = [atomIdx, vertIdx] — structural boundary of the fundamental domain.
// Step-8 join vertices appear as two consecutive entries (coincide when twist is 0).
let borderFD;
// originFD[i] = WC point — geometric boundary of the fundamental domain.
let originFD;


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
  handle = Number(document.getElementById("handle").value);
  crosscap = Number(document.getElementById("crosscap").value);
  cone = JSON.parse(document.getElementById("cone").value);
  kali = JSON.parse(document.getElementById("kali").value);

  stepEdgeCount = 0;
  stepEdges = [0];
  params = [0];
  newCone = JSON.parse(JSON.stringify(cone));
  newKali = [];
  atomList = [];

  orbi2Atoms();
  atomList.reverse(); // start with the most connections

  buildMatch();
  buildBorderFD();
  buildAtomPtList();
  buildOriginFD();

  console.log(JSON.stringify([handle, crosscap, cone, kali]));
  console.log("atomList: " + JSON.stringify(atomList));
  console.log("stepEdges: " + JSON.stringify(stepEdges));
  console.log("params: " + JSON.stringify(params));
  console.log("match: " + JSON.stringify(match));
  console.log("glueMatch: " + JSON.stringify(glueMatch));
  console.log("atomPtList: " + JSON.stringify(atomPtList));

  draw();
}


function orbi2Atoms() {

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
        params.push([2]); // length 2
        i--;
      }
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


// Traces the boundary of the fundamental domain structurally.
// Structural — call after buildMatch().
// Each entry is [atomIdx, vertIdx]. Step-8 join vertices appear as two consecutive
// entries (one per atom side) — they coincide geometrically when twist is 0.
function buildBorderFD() {
  let currentAtom = 0;
  let currentVert = 0;
  borderFD = [];
  let pendingPartner = null; // [atomIdx, vertIdx] from entry side of a step-8 join
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
        borderFD.push(pendingPartner);
        pendingPartner = null;
      }
      borderFD.push([currentAtom, currentVert]);
      currentVert = nextVert;
    }
    if (currentAtom === 0 && currentVert === 0) break;
  }
}


// Converts borderFD[] to geometric coordinates. Call after buildAtomPtList().
function buildOriginFD() {
  originFD = borderFD.map(([atom, vert]) => atomPtList[atom][vert]);
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

  // draw fundamental domain boundary
  if (originFD && originFD.length > 0) {
    let verts = polyMoreVert(originFD).map(p => pt2Screen(p, hZoom));
    context.beginPath();
    context.moveTo(verts[verts.length-1][0], verts[verts.length-1][1]);
    verts.forEach(v => context.lineTo(v[0], v[1]));
    context.strokeStyle = "darkgrey";
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
  }

  // draw atoms
  if (atomPtList) {
    for (let i = 0; i < atomPtList.length; i++) {
      let verts = polyMoreVert(atomPtList[i]).map(p => pt2Screen(p, hZoom));
      context.beginPath();
      context.moveTo(verts[verts.length-1][0], verts[verts.length-1][1]);
      verts.forEach(v => context.lineTo(v[0], v[1]));
      context.strokeStyle = "lightgrey";
      context.lineWidth = 1;
      context.stroke();
      context.closePath();
    }
  }
}
