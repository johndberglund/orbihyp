// geomH.js — Hyperbolic geometry for the combined orbifold app.
// Extracted from deatonC.js.  Provides hReDo(), hDraw(ctx,c),
// hMousePressed(sx,sy,shiftKey), hMouseMoved(sx,sy), hMouseReleased(sx,sy).

// ── Constants & math helpers ──────────────────────────────────────────────────

var epsilon  = 0.0000001;
var identity = [[1,0,0],[0,1,0],[0,0,1]];

// ── Shared display state (also used by geomES.js for S) ───────────────────────
// Set by main.js init() and resize().
var scrRadius  = 200;
var scrCenterX = 400;
var scrCenterY = 300;

// ── H view state ──────────────────────────────────────────────────────────────

var hZoom           = 1;
var moveMat         = [[1,0,0],[0,1,0],[0,0,1]];
var lastGoodMoveMat = [[1,0,0],[0,1,0],[0,0,1]];
var tempMat         = [[1,0,0],[0,1,0],[0,0,1]];
var posA3d = 0, posB3d = 0;
var posA   = 0, posB   = 0;   // screen coords (or 0 when not drawing)
var shapeNum = -1, controlPt = 1, editBoxSize = 8;
var baseFDIdx  = 0;
var panBestI = 0, panBestJ = 1, panDet = 1;
var moveMatAtPress;
var paramNum = -1, paramEnd = -1;
var paramDragFixed, paramDragLine, paramDragFixedScene;

// ── H structural state ────────────────────────────────────────────────────────

var atomList = [], firstInnerMatch;
var stepEdges, match, glueMatch, borderFD, genMaps;
var indexedCents, uniqGens, coords2Drop, neighborMaps;
var params, atomPtList, originFD, originFDCent, recenterMat, paramPtList;
var fdArea, allGenMats, allMappedCents, genMats, neighborCents, neighborMats;
var specialPts = [], reflEdges = [];
var maxT;

// ── Math utilities ────────────────────────────────────────────────────────────

function hDot(P, Q) { return -P[0]*Q[0] + P[1]*Q[1] + P[2]*Q[2]; }

function hVectType(P) {
  let inner = hDot(P, P);
  if (Math.abs(inner) < epsilon) return 0;
  return inner < 0 ? -1 : 1;
}

function hNorm(P) {
  let denom;
  if (hVectType(P) === 0) { denom = 1/P[0]/Math.sqrt(2); }
  else { denom = Math.sqrt(Math.abs(hDot(P, P))); }
  let s = P[0] < 0 ? -1 : 1;
  return [P[0]*s/denom, P[1]*s/denom, P[2]*s/denom];
}

function hDotNorm(P, Q) {
  return Math.abs(hDot(P, Q)) / Math.sqrt(Math.abs(hDot(P,P) * hDot(Q,Q)));
}

function hDist(P, Q) {
  let N = hDotNorm(P, Q);
  if (N < 1 && N + epsilon > 1) N = 1;
  return Math.acosh(N);
}

function hTRef(P)          { return [-P[0], P[1], P[2]]; }

function hPoints2Line(P, Q) {
  let dist = hDist(P, Q);
  return scalarVect(1/Math.sinh(dist), hTRef(cross(P, Q)));
}

//function reflPtOverLine(P, L) {
//  return vectDiff(P, scalarVect(-2*hDot(P,L)/hDot(L,L), L));
//}

function hFootOfPerp(P, L) {
  return hNorm(vectSum(P, scalarVect(-hDot(P,L)/hDot(L,L), L)));
}

function hMidPoint(P, Q) { return hNorm(vectSum(P, Q)); }

//function reorthogLorentz(M) {
//  let c0 = [M[0][0], M[1][0], M[2][0]];
//  let c1 = [M[0][1], M[1][1], M[2][1]];
//  c0 = scalarVect(1 / Math.sqrt(-hDot(c0, c0)), c0);
//  c1 = vectSum(c1, scalarVect(hDot(c1, c0), c0));
//  c1 = scalarVect(1 / Math.sqrt(hDot(c1, c1)), c1);
//  let c2 = hTRef(cross(c0, c1));
//  if (matDet(M) < 0) c2 = scalarVect(-1, c2);
//  return [
//    [c0[0], c1[0], c2[0]],
//    [c0[1], c1[1], c2[1]],
//    [c0[2], c1[2], c2[2]]
//  ];
//}

function hReflMat(line) {
  let mat = [], denom = hDot(line, line);
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
  let diff = vectDiff(P, Q);
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

function hRotOrigMat(theta) {
  return [[1,0,0],[0,Math.cos(theta),-Math.sin(theta)],[0,Math.sin(theta),Math.cos(theta)]];
}

function hRotMat(P, theta) {
  if (hDist(P, [1,0,0]) < epsilon) return hRotOrigMat(theta);
  let mat1 = hFlipMat(P, [1,0,0]);
  let mat2 = hRotOrigMat(-theta);
  return multMatMat(mat1, multMatMat(mat2, mat1));
}

function hTransOrigMat(P) {
  return [[P[0],P[1],P[2]],
          [P[1], P[1]*P[1]/(P[0]+1)+1, P[1]*P[2]/(P[0]+1)],
          [P[2], P[1]*P[2]/(P[0]+1),   P[2]*P[2]/(P[0]+1)+1]];
}

function hTransMat(P, Q) {
  let pRefl = JSON.stringify(P) === "[1,0,0]"
    ? identity
    : hFlipMat(P, [1,0,0]);
  let newQ = multMatVect(pRefl, Q);
  let trans1 = hTransOrigMat(newQ);
  return multMatMat(pRefl, multMatMat(trans1, pRefl));
}

function hIsomSeg2SegFlip(P, Q, R, S) {
  return multMatMat(hReflMat(hPoints2Line(R, S)), hIsomSeg2Seg(P, Q, R, S));
}

function hIsomSeg2Seg(P, Q, R, S, twist=0) {
  if (Math.abs(hDotNorm(P,Q) - hDotNorm(R,S)) >= epsilon) return "Error. Don't match!";
  if (twist !== 0) {
    let d = hDist(R, S);
    let V = scalarVect(1/Math.sinh(d), vectDiff(S, scalarVect(Math.cosh(d), R)));
    let td = twist * d;
    R = vectSum(scalarVect(Math.cosh(td), R),     scalarVect(Math.sinh(td), V));
    S = vectSum(scalarVect(Math.cosh(td + d), R), scalarVect(Math.sinh(td + d), V));
  }
  let reflMat1, reflMat2;
  if (hDist(P, R) < epsilon) {
    if (hDist(Q, S) < epsilon) return identity;
    reflMat1 = hFlipMat(Q, S);
    reflMat2 = hReflMat(hPoints2Line(R, S));
    return multMatMat(reflMat2, reflMat1);
  }
  reflMat1 = hReflMat(vectDiff(P, R));
  let QPrime = multMatVect(reflMat1, Q);
  reflMat2 = hDist(S, QPrime) < epsilon * 1000
    ? hReflMat(hPoints2Line(R, S))
    : hReflMat(vectDiff(S, QPrime));
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

// this seems to require something special of the matrix involved.
//***
function invMat(M) {
  return [
    [ M[0][0], -M[1][0], -M[2][0]],
    [-M[0][1],  M[1][1],  M[2][1]],
    [-M[0][2],  M[1][2],  M[2][2]]
  ];
}

//***
function getInvMove() { return invMat(moveMat); }

// ── Triangle solvers ──────────────────────────────────────────────────────────

function hSolve3Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [0, Math.cos(alpha), Math.sin(alpha)];
  let sideAY = (Math.cos(gamma) + Math.cos(alpha)*Math.cos(beta)) / Math.sin(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [-Math.sqrt(sideAX*sideAX + sideAY*sideAY - 1), sideAX, -sideAY];
  return [hNorm(cross(hTRef(sideB),hTRef(sideC))),
          hNorm(cross(hTRef(sideC),hTRef(sideA))),
          hNorm(cross(hTRef(sideA),hTRef(sideB)))];
}

function hSolve2Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha), Math.cosh(alpha), 0];
  let sideAT = (Math.cos(gamma) + Math.cosh(alpha)*Math.cos(beta)) / Math.sinh(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [sideAT, sideAX, Math.sqrt(-sideAX*sideAX + sideAT*sideAT + 1)];
  let segAlpha = hNorm(cross(hTRef(sideB),hTRef(sideC)));
  let vertBeta  = hNorm(cross(hTRef(sideC),hTRef(sideA)));
  let vertGamma = hNorm(cross(hTRef(sideA),hTRef(sideB)));
  let vertAlphaC = hNorm(cross(hTRef(segAlpha),hTRef(sideC)));
  let vertAlphaB = hNorm(cross(hTRef(segAlpha),hTRef(sideB)));
  return [vertAlphaB, vertAlphaC, vertBeta, vertGamma];
}

function hSolve1Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha), Math.cosh(alpha), 0];
  let sideAT = (Math.cos(gamma) + Math.cosh(alpha)*Math.cosh(beta)) / Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT, sideAX, Math.sqrt(-sideAX*sideAX + sideAT*sideAT + 1)];
  let segAlpha = hNorm(cross(hTRef(sideB),hTRef(sideC)));
  let segBeta  = hNorm(cross(hTRef(sideC),hTRef(sideA)));
  let vertGamma  = hNorm(cross(hTRef(sideA),hTRef(sideB)));
  let vertAlphaC = hNorm(cross(hTRef(segAlpha),hTRef(sideC)));
  let vertAlphaB = hNorm(cross(hTRef(segAlpha),hTRef(sideB)));
  let vertBetaA  = hNorm(cross(hTRef(segBeta),hTRef(sideA)));
  let vertBetaC  = hNorm(cross(hTRef(segBeta),hTRef(sideC)));
  return [vertAlphaB, vertAlphaC, vertBetaC, vertBetaA, vertGamma];
}

function hSolve0Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha), Math.cosh(alpha), 0];
  let sideAT = (Math.cosh(gamma) + Math.cosh(alpha)*Math.cosh(beta)) / Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT, sideAX, Math.sqrt(-sideAX*sideAX + sideAT*sideAT + 1)];
  let segAlpha = hNorm(cross(hTRef(sideB),hTRef(sideC)));
  let segBeta  = hNorm(cross(hTRef(sideC),hTRef(sideA)));
  let segGamma = hNorm(cross(hTRef(sideA),hTRef(sideB)));
  return [hNorm(cross(hTRef(segAlpha),hTRef(sideB))),
          hNorm(cross(hTRef(segAlpha),hTRef(sideC))),
          hNorm(cross(hTRef(segBeta), hTRef(sideC))),
          hNorm(cross(hTRef(segBeta), hTRef(sideA))),
          hNorm(cross(hTRef(segGamma),hTRef(sideA))),
          hNorm(cross(hTRef(segGamma),hTRef(sideB)))];
}

// ── Atom builders ─────────────────────────────────────────────────────────────

function getAtom(thisType, thisParamList) {
  if (thisType[0] === "S") return getSheet(thisType, thisParamList);
  if (thisType[0] === "C") return getPCase(thisType, thisParamList);
  if (thisType[0] === "P") return getPillow(thisType, thisParamList);
}

function getSheet(thisType, thisParamList) {
  if (thisType === "S6") return hSolve0Ang(thisParamList[0], thisParamList[1], thisParamList[2]);
  if (thisType === "S5") return hSolve1Ang(thisParamList[0], thisParamList[1], Math.PI/thisParamList[2]);
  if (thisType === "S4") return hSolve2Ang(thisParamList[0], Math.PI/thisParamList[1], Math.PI/thisParamList[2]);
  return hSolve3Ang(Math.PI/thisParamList[0], Math.PI/thisParamList[1], Math.PI/thisParamList[2]);
}

function getPCase(thisType, thisParamList) {
  if (thisType === "C3") {
    let a1 = Math.PI/thisParamList[0], a2 = Math.PI/thisParamList[1];
    return hSolve3Ang(a1*2, a2/2, a2/2);
  }
  if (thisType === "C4") {
    let s1 = thisParamList[0]/2, a1 = Math.PI/thisParamList[1];
    return hSolve2Ang(s1*2, a1/2, a1/2);
  }
  if (thisType === "C5") {
    let a1 = 2*Math.PI/thisParamList[0], s1 = thisParamList[1];
    let s2 = Math.asinh(Math.sqrt((1+Math.cos(a1))/(Math.cosh(s1)-1)));
    return hSolve1Ang(s2, s2, a1);
  }
  // C6
  let s1 = thisParamList[0], s3 = thisParamList[1];
  let s2 = Math.asinh(Math.sqrt((Math.cosh(s1)+1)/(Math.cosh(s3)-1)));
  return hSolve0Ang(s2, s2, s1);
}

function getPillow(thisType, thisParamList) {
  let angle1, angle2, angle3, side1, side2, side3, mid1, vert1, vert2;
  let shape1, shape2, newShape2, myMat, myShape;

  if (thisType === "P3") {
    angle1 = Math.PI/thisParamList[0]; angle2 = Math.PI/thisParamList[1]; angle3 = Math.PI/thisParamList[2];
    shape1 = hSolve3Ang(angle1, angle3, angle2);
    shape2 = hSolve3Ang(angle1, angle2, angle3);
    myMat = hIsomSeg2Seg(shape2[0], shape2[2], shape1[0], shape1[1]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [newShape2[0], newShape2[1], newShape2[2], shape1[2]];
    mid1 = hhMidPoint(myShape[3], myShape[0]);
    myMat = hIsomSeg2Seg(myShape[2], myShape[3], myShape[2], myShape[1]);
    vert1 = multMatVect(myMat, mid1);
    myShape = [myShape[0], myShape[1], vert1, myShape[2], mid1];
    mid1 = hMidPoint(myShape[0], myShape[1]);
    myShape = [myShape[0], mid1, myShape[1], myShape[2], myShape[3], myShape[4]];
  } else if (thisType === "P4") {
    side1 = thisParamList[0]/2; angle2 = Math.PI/thisParamList[1]; angle3 = Math.PI/thisParamList[2];
    shape1 = hSolve2Ang(side1, angle2, angle3);
    shape2 = hSolve2Ang(side1, angle3, angle2);
    myMat = hIsomSeg2Seg(shape2[0], shape2[3], shape1[1], shape1[2]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [newShape2[1], newShape2[2], newShape2[3], shape1[3], shape1[0]];
    mid1 = hMidPoint(myShape[3], myShape[4]);
    myMat = hIsomSeg2Seg(myShape[2], myShape[3], myShape[2], myShape[1]);
    vert1 = multMatVect(myMat, mid1);
    myShape = [myShape[4], myShape[0], myShape[1], vert1, myShape[2], mid1];
    mid1 = hMidPoint(myShape[1], myShape[2]);
    myShape = [myShape[0], myShape[1], mid1, myShape[2], myShape[3], myShape[4], myShape[5]];
  } else if (thisType === "P5") {
    side1 = thisParamList[0]/2; side2 = thisParamList[1]/2; angle3 = Math.PI/thisParamList[2];
    shape1 = hSolve1Ang(side1, side2, angle3);
    shape2 = hSolve1Ang(side2, side1, angle3);
    myMat = hIsomSeg2Seg(shape2[3], shape2[4], shape1[0], shape1[4]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [shape1[1], shape1[2], shape1[3], shape1[4], newShape2[0], newShape2[1], newShape2[2]];
    mid1 = hMidPoint(myShape[5], myShape[6]);
    myMat = hIsomSeg2Seg(myShape[3], myShape[4], myShape[3], myShape[2]);
    vert1 = multMatVect(myMat, mid1);
    vert2 = multMatVect(myMat, myShape[5]);
    myShape = [myShape[6], myShape[0], myShape[1], vert2, vert1, myShape[3], mid1];
    mid1 = hMidPoint(myShape[1], myShape[2]);
    myShape = [myShape[0], myShape[1], mid1, myShape[2], myShape[3], myShape[4], myShape[5], myShape[6]];
  } else { // P6
    side1 = thisParamList[0]/2; side2 = thisParamList[1]/2; side3 = thisParamList[2]/2;
    shape1 = hSolve0Ang(side1, side2, side3);
    shape2 = hSolve0Ang(side2, side1, side3);
    myMat = hIsomSeg2Seg(shape2[1], shape2[2], shape1[2], shape1[1]);
    newShape2 = shape2.map(v => multMatVect(myMat, v));
    myShape = [newShape2[3], newShape2[4], newShape2[5], newShape2[0], shape1[3], shape1[4], shape1[5], shape1[0]];
    mid1 = hMidPoint(myShape[6], myShape[7]);
    myMat = hIsomSeg2Seg(myShape[4], myShape[5], myShape[3], myShape[2]);
    vert1 = multMatVect(myMat, mid1);
    vert2 = multMatVect(myMat, myShape[6]);
    myShape = [myShape[7], myShape[0], myShape[1], vert2, vert1, myShape[3], myShape[4], mid1];
    let myLine = hPoints2Line(myShape[5], myShape[6]);
    myShape[5] = hFootOfPerp(myShape[4], myLine);
    myShape[6] = hFootOfPerp(myShape[7], myLine);
    mid1 = hMidPoint(myShape[1], myShape[2]);
    myShape = [myShape[0], myShape[1], mid1, myShape[2], myShape[3], myShape[4], myShape[5], myShape[6], myShape[7]];
  }
  return myShape;
}

function nVertsForAtom(type) {
  let n = parseInt(type[1]);
  if (type[0] === "P") return n + 3;
  return n;
}

// ── Orbifold topology ─────────────────────────────────────────────────────────

function orbi2Atoms(handle, crosscap, cone, kali) {
  let stepEdgeCount = 0;
  let newCone = JSON.parse(JSON.stringify(cone));
  let newKali = [], newSheet, newPillow;

  for (let i = 0; i < handle; i++) {
    stepEdgeCount++;
    newCone.push(-stepEdgeCount);
    newCone.push(-stepEdgeCount);
    stepEdges.push(3);
    params.push([2, 0]);
  }
  for (let i = 0; i < crosscap; i++) {
    stepEdgeCount++;
    newCone.push(-stepEdgeCount);
    stepEdges.push(2);
    params.push([2]);
  }

  if (kali.length > 0) {
    for (let i = 0; i < kali.length; i++) {
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
    if (kali.length > 1) {
      let minStepEdgeCount = stepEdgeCount;
      newKali = JSON.parse(JSON.stringify(kali[0]));
      for (let i = 1; i < kali.length; i++) {
        stepEdgeCount++;
        newKali.push(-stepEdgeCount);
        stepEdges.push(1);
        params.push([2]);
        newKali.push(...kali[i]);
      }
      for (let i = stepEdgeCount; i > minStepEdgeCount; i--) {
        newKali.push(-i);
      }
    }

    for (let i = 0; i < newCone.length; i++) {
      if (newCone[i] === 2) {
        newCone.splice(i, 1);
        stepEdgeCount++;
        newKali.push(-stepEdgeCount);
        stepEdges.push(4);
        i--;
      }
      params.push([2]);
    }

    for (let i = 0; i < newKali.length - 1; i++) {
      if ((newKali[i] === 2) && (newKali[i + 1] === 2)) {
        stepEdgeCount++;
        newKali.splice(i, 2, -stepEdgeCount);
        stepEdges.push(6);
        params.push([2]);
      }
    }

    firstInnerMatch = stepEdgeCount;
    let pCaseName;
    if ((newCone.length === 1) && (newKali.length === 1)) {
      pCaseName = findPCase(newCone[0], newKali[0]);
      atomList.push([pCaseName, newCone[0], newKali[0]]);
    } else {
      for (let i = 0; i < newCone.length; i++) {
        if ((i === newCone.length - 1) && (newKali.length === 1)) {
          pCaseName = findPCase(newCone[i], newKali[0]);
          atomList.push([pCaseName, newCone[i], newKali[0]]);
        } else {
          stepEdgeCount++;
          pCaseName = findPCase(newCone[i], -stepEdgeCount);
          atomList.push([pCaseName, newCone[i], -stepEdgeCount]);
          newKali.push(-stepEdgeCount);
          stepEdges.push(7);
          params.push([2]);
        }
      }
    }

    if (newKali.length === 3) {
      newSheet = rotList([Number(newKali[0]), Number(newKali[1]), Number(newKali[2])]);
      atomList.push(["S" + (3 + newSheet[3]), newSheet[0], newSheet[1], newSheet[2]]);
    } else {
      for (let i = 0; i < newKali.length - 3; i++) {
        stepEdgeCount++;
        newSheet = rotList([Number(newKali[i]), Number(newKali[i + 1]), Number(-stepEdgeCount)]);
        atomList.push(["S" + (3 + newSheet[3]), newSheet[0], newSheet[1], newSheet[2]]);
        newKali.push(-stepEdgeCount);
        stepEdges.push(9);
        params.push([2]);
        i++;
        if (i === newKali.length - 4) {
          newSheet = rotList([Number(newKali[i + 1]), Number(newKali[i + 2]), Number(newKali[i + 3])]);
          atomList.push(["S" + (3 + newSheet[3]), newSheet[0], newSheet[1], newSheet[2]]);
        }
      }
    }

  } else { // no kaleidoscopes
    newCone = newCone.sort(function(a, b) { return b - a; });
    for (let i = 0; i < newCone.length - 1; i++) {
      if ((newCone[i] === 2) && (newCone[i + 1] === 2)) {
        stepEdgeCount++;
        newCone.splice(i, 2, -stepEdgeCount);
        stepEdges.push(5);
        params.push([2]);
      }
    }
    newCone = newCone.sort(function(a, b) { return b - a; });
    for (let i = 0; i < newCone.length; i++) {
      if (newCone[i] < 0) {
        let firstPart = newCone.slice(i);
        let secondPart = newCone.slice(0, i);
        newCone = [...firstPart, ...secondPart];
        i = newCone.length;
      }
    }

    firstInnerMatch = stepEdgeCount;
    if (newCone.length === 3) {
      newPillow = rotList([newCone[0], newCone[1], newCone[2]]);
      atomList.push(["P" + (3 + newPillow[3]), newPillow[0], newPillow[1], newPillow[2]]);
    } else {
      for (let i = 0; i < newCone.length - 3; i++) {
        stepEdgeCount++;
        newPillow = rotList([newCone[i], newCone[i + 1], -stepEdgeCount]);
        atomList.push(["P" + (3 + newPillow[3]), newPillow[0], newPillow[1], newPillow[2]]);
        newCone.push(-stepEdgeCount);
        stepEdges.push(8);
        params.push([2, 0]);
        i++;
        if (i === newCone.length - 4) {
          newPillow = rotList([newCone[i + 1], newCone[i + 2], newCone[i + 3]]);
          atomList.push(["P" + (3 + newPillow[3]), newPillow[0], newPillow[1], newPillow[2]]);
        }
      }
    }
  }
}

function rotList(oldList) {
  let A = oldList[0], B = oldList[1], C = oldList[2];
  let cutPoint = 0;
  if (A < 0) {
    if ((B > 0) && (C < 0)) { cutPoint = 2; }
  } else {
    if (B < 0) { cutPoint = 1; }
    else if (C < 0) { cutPoint = 2; }
  }
  let negCount = 0;
  for (let i = 0; i < 3; i++) { if (oldList[i] < 0) negCount++; }
  let newList = oldList.slice(cutPoint).concat(oldList.slice(0, cutPoint));
  newList.push(negCount);
  return newList;
}

function findPCase(A, B) {
  return "C" + (3 + 1*(A<0) + 2*(B<0));
}

function findJoinCoords(atomType, myIndex) {
  switch (atomType) {
    case "S4": case "S5": case "S6": return 2 * myIndex - 2;
    case "C5": case "C6": return 7 - 3 * myIndex;
    case "P4": case "P5": case "P6": return 3 * (myIndex - 1);
  }
}

function buildMatch() {
  match = [0];
  for (let i = 1; i < stepEdges.length; i++) match.push([]);
  for (let i = 0; i < atomList.length; i++) {
    let nextAtom = atomList[i], nextType = nextAtom[0];
    for (let j = 1; j < nextAtom.length; j++) {
      if (nextAtom[j] < 0) {
        let startVert = findJoinCoords(nextType, j);
        match[-nextAtom[j]].push([i, startVert]);
      }
    }
  }
  glueMatch = [0];
  for (let i = 1; i < atomList.length; i++) {
    for (let j = firstInnerMatch + 1; j < match.length; j++) {
      if (match[j].length === 2) {
        let idx0 = match[j][0][0], idx1 = match[j][1][0];
        if ((idx0 === i && idx1 < i) || (idx1 === i && idx0 < i)) {
          glueMatch.push(j); break;
        }
      }
    }
  }
}

function atomEdge(atomType, vertNum) {
  switch (atomType) {
    case "S3": return [vertNum, false];
    case "S4": if (vertNum === 0) return -1; return [vertNum, false];
    case "S5": if (vertNum === 0 || vertNum === 2) return -1; return [vertNum, false];
    case "S6": if (vertNum === 0 || vertNum === 2 || vertNum === 4) return -1; return [vertNum, false];
    case "C3":
      if (vertNum === 0) return [2, true];
      if (vertNum === 1) return [1, false];
      if (vertNum === 2) return [0, true]; break;
    case "C4":
      if (vertNum === 0) return [2, true];
      if (vertNum === 1) return -1;
      if (vertNum === 2) return [0, true];
      if (vertNum === 3) return [3, false]; break;
    case "C5":
      if (vertNum === 0) return [0, false];
      if (vertNum === 1) return -1;
      if (vertNum === 2) return [2, false];
      if (vertNum === 3) return [4, true];
      if (vertNum === 4) return [3, true]; break;
    case "C6":
      if (vertNum === 0) return [0, false];
      if (vertNum === 1) return -1;
      if (vertNum === 2) return [2, false];
      if (vertNum === 3) return [5, true];
      if (vertNum === 4) return -1;
      if (vertNum === 5) return [3, true]; break;
    case "P3":
      if (vertNum === 0) return [5, true]; if (vertNum === 1) return [2, true];
      if (vertNum === 2) return [1, true];  if (vertNum === 3) return [4, true];
      if (vertNum === 4) return [3, true];  if (vertNum === 5) return [0, true]; break;
    case "P4":
      if (vertNum === 0) return -1; if (vertNum === 1) return [6, true];
      if (vertNum === 2) return [3, true]; if (vertNum === 3) return [2, true];
      if (vertNum === 4) return [5, true]; if (vertNum === 5) return [4, true];
      if (vertNum === 6) return [1, true]; break;
    case "P5":
      if (vertNum === 0) return -1; if (vertNum === 1) return [7, true];
      if (vertNum === 2) return [4, true]; if (vertNum === 3) return -1;
      if (vertNum === 4) return [2, true]; if (vertNum === 5) return [6, true];
      if (vertNum === 6) return [5, true]; if (vertNum === 7) return [1, true]; break;
    case "P6":
      if (vertNum === 0) return -1; if (vertNum === 1) return [8, true];
      if (vertNum === 2) return [4, true]; if (vertNum === 3) return -1;
      if (vertNum === 4) return [2, true]; if (vertNum === 5) return [7, true];
      if (vertNum === 6) return -1; if (vertNum === 7) return [5, true];
      if (vertNum === 8) return [1, true]; break;
    default: return -1;
  }
}

function buildBorderFD() {
  let currentAtom = 0, currentVert = 0;
  borderFD = []; genMaps = [];
  let pendingPartner = null, twistIndices = new Set(), lookup = new Map();
  for (let iter = 0; iter < 10000; iter++) {
    let nVerts = nVertsForAtom(atomList[currentAtom][0]);
    let nextVert = (currentVert + 1) % nVerts;
    let foundJoin = false;
    for (let j = firstInnerMatch + 1; j < match.length; j++) {
      if (match[j].length < 2) continue;
      for (let matchIdx = 0; matchIdx <= 1; matchIdx++) {
        if (match[j][matchIdx][0] === currentAtom && match[j][matchIdx][1] === currentVert) {
          let otherIdx = 1 - matchIdx;
          let otherAtom = match[j][otherIdx][0];
          let otherNVerts = nVertsForAtom(atomList[otherAtom][0]);
          if (stepEdges[j] === 8) pendingPartner = [currentAtom, currentVert];
          currentAtom = otherAtom;
          currentVert = (match[j][otherIdx][1] + 1) % otherNVerts;
          foundJoin = true; break;
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
  for (let i = 0; i < borderFD.length; i++) {
    if (twistIndices.has(i)) { genMaps.push(null); continue; }
    let [atomIdx, vertIdx] = borderFD[i];
    let result = atomEdge(atomList[atomIdx][0], vertIdx);
    if (result === -1) {
      let found = false;
      for (let j = 1; j <= firstInnerMatch && !found; j++) {
        if (!match[j] || match[j].length === 0) continue;
        if (match[j].length === 1) {
          if (match[j][0][0] === atomIdx && match[j][0][1] === vertIdx) {
            genMaps.push([i, -1]); found = true;
          }
        } else {
          for (let side = 0; side <= 1; side++) {
            if (match[j][side][0] === atomIdx && match[j][side][1] === vertIdx) {
              genMaps.push([lookup.get(match[j][1-side][0] + "," + match[j][1-side][1]), -1]);
              found = true; break;
            }
          }
        }
      }
      if (!found) genMaps.push([-1, -1]);
    } else {
      let [mappedVert, isDirect] = result;
      genMaps.push([lookup.get(atomIdx + "," + mappedVert), isDirect ? 1 : 0]);
    }
  }
}

function buildAllGenMats() {
  let n = originFD.length;
  allGenMats = [];
  for (let i = 0; i < n; i++) {
    if (genMaps[i] === null) { allGenMats.push(null); continue; }
    let [j, orient] = genMaps[i];
    let Pi = originFD[i], Qi = originFD[(i + 1) % n];
    if (orient === 0) { allGenMats.push(hReflMat(hPoints2Line(Pi, Qi))); continue; }
    if (orient === 1) {
      let Pj = originFD[j], Qj = originFD[(j + 1) % n];
      allGenMats.push(hIsomSeg2Seg(Pi, Qi, Qj, Pj)); continue;
    }
    let stepType = 0, twist = 0;
    let [atomIdx, vertIdx] = borderFD[i];
    for (let k = 1; k <= firstInnerMatch; k++) {
      if (!match[k] || match[k].length === 0) continue;
      let found = false;
      for (let side = 0; side < match[k].length; side++) {
        if (match[k][side][0] === atomIdx && match[k][side][1] === vertIdx) {
          stepType = stepEdges[k];
          twist = paramPtList[k] ? paramPtList[k][2] : 0;
          found = true; break;
        }
      }
      if (found) break;
    }
    if (j !== i) {
      let Pj = originFD[j], Qj = originFD[(j + 1) % n];
      allGenMats.push(hIsomSeg2Seg(Pi, Qi, Qj, Pj, twist));
    } else {
      switch (stepType) {
        case 4: case 5: allGenMats.push(hIsomSeg2Seg(Pi, Qi, Qi, Pi)); break;
        case 6: allGenMats.push(hReflMat(hPoints2Line(Pi, Qi))); break;
        case 2: {
          let mid1 = hMidPoint(Pi, Qi);
          allGenMats.push(hIsomSeg2SegFlip(Pi, mid1, mid1, Qi));
          allGenMats.push(hIsomSeg2SegFlip(Qi, mid1, mid1, Pi));
          break;
        }
        default: allGenMats.push(null);
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
  for (let i = 0; i < allGenMats.length; i++) {
    if (allMappedCents[i] === null) allGenMats[i] = null;
  }
}

function buildIndexedCents() {
  indexedCents = []; uniqGens = [];
  for (let i = 0; i < allMappedCents.length; i++) {
    if (allMappedCents[i] === null) { indexedCents.push(null); continue; }
    let found = -1;
    for (let k = 0; k < uniqGens.length; k++) {
      if (hDist(allMappedCents[i], allMappedCents[uniqGens[k]]) < 0.001) { found = uniqGens[k]; break; }
    }
    if (found === -1) { indexedCents.push(i); uniqGens.push(i); }
    else              { indexedCents.push(found); }
  }
}

function buildGenMats() { genMats = uniqGens.map(i => allGenMats[i]); }

function buildNeighborMats() {
  let maxVertT = Math.max(...originFD.map(p => p[0]));
  maxT = Math.min(1000, Math.max(30, Math.round(10 * fdArea + maxVertT)));
  neighborMats  = [identity];
  neighborCents = [originFDCent];
  neighborMaps  = [];
  let matIndex = 0;
  while (matIndex < neighborMats.length) {
    let parentSeq = matIndex === 0 ? [] : neighborMaps[matIndex - 1];
    for (let k = 0; k < genMats.length; k++) {
      let newMat  = multMatMat(genMats[k], neighborMats[matIndex]);
      let newCent = multMatVect(newMat, originFDCent);
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

function buildOriginFD() { originFD = borderFD.map(([atom, vert]) => atomPtList[atom][vert]); }

function buildOriginFDCent() {
  let n = originFD.length;
  if (n < 3) { originFDCent = originFD[0]; return; }
  let A = originFD[0], totalArea = 0, cx = 0, cy = 0, cz = 0;
  for (let i = 1; i < n - 1; i++) {
    let B = originFD[i], C = originFD[i + 1];
    let area = hTriangleArea(A, B, C);
    if (!isFinite(area) || area < epsilon) continue;
    let triCent = hNorm(vectSum(vectSum(A, B), C));
    cx += area * triCent[0]; cy += area * triCent[1]; cz += area * triCent[2];
    totalArea += area;
  }
  fdArea = totalArea;
  originFDCent = hNorm([cx / totalArea, cy / totalArea, cz / totalArea]);
}

function buildParamPtList() {
  paramPtList = [0];
  for (let j = 1; j < match.length; j++) {
    if (match[j].length === 0) { paramPtList.push(null); continue; }
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

function buildAtomPtList() {
  atomPtList = [];
  for (let i = 0; i < atomList.length; i++) {
    let nextAtom = atomList[i], nextType = nextAtom[0];
    let paramList = [];
    for (let j = 1; j < nextAtom.length; j++) {
      paramList.push(nextAtom[j] > 0 ? nextAtom[j] : params[-nextAtom[j]][0]);
    }
    let nextShape = getAtom(nextType, paramList);
    if (i > 0) {
      let j = glueMatch[i];
      let anchorEntry = match[j][0][0] === i ? match[j][1] : match[j][0];
      let newEntry    = match[j][0][0] === i ? match[j][0] : match[j][1];
      let nVerts       = nVertsForAtom(nextType);
      let newStart     = newEntry[1];
      let newEnd       = (newStart + 1) % nVerts;
      let anchorAtomIdx = anchorEntry[0];
      let anchorNVerts  = nVertsForAtom(atomList[anchorAtomIdx][0]);
      let anchorStart   = anchorEntry[1];
      let anchorEnd     = (anchorStart + 1) % anchorNVerts;
      let twist = params[j][1] ?? 0;
      let mat = hIsomSeg2Seg(
        nextShape[newStart], nextShape[newEnd],
        atomPtList[anchorAtomIdx][anchorEnd], atomPtList[anchorAtomIdx][anchorStart],
        twist
      );
      nextShape = nextShape.map(v => multMatVect(mat, v));
    }
    atomPtList.push(nextShape);
  }
}

function rebuildGeom() {
  buildAtomPtList();
  buildParamPtList();
  buildOriginFD();
  buildOriginFDCent();
  recenterMat = hTransMat(originFDCent, [1, 0, 0]);
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
  buildAllMappedCents();
  buildIndexedCents();
  buildGenMats();
  buildNeighborMats();
  updateBaseFD();
  buildSpecialPts();
}

// ── Coordinate conversion & Bezier rendering ──────────────────────────────────

function pt2Screen(P, zoom) {
  zoom = zoom !== undefined ? zoom : 1;
  let x =  P[1]/(P[0]+zoom) * scrRadius + scrCenterX;
  let y = -P[2]/(P[0]+zoom) * scrRadius + scrCenterY;
  return [x, y];
}

function dispPt(p) { return pt2Screen(multMatVect(moveMat, p), hZoom); }

function screen2Pt(scrPt, zoom) {
  let x = (scrPt[0] - scrCenterX) / scrRadius;
  let y = (-scrPt[1] + scrCenterY) / scrRadius;
  let r2 = x*x + y*y;
  if (r2 >= 1) { let r = Math.sqrt(r2) / 0.9999; x /= r; y /= r; r2 = (0.9999)*(0.9999); }
  let a = 1 - r2, b = -2 * r2 * zoom, c = -1 - r2 * zoom * zoom;
  let Ht = (-b + Math.sqrt(b*b - 4*a*c)) / 2 / a;
  return [Ht, x*(Ht + zoom), y*(Ht + zoom)];
}

function divSeg(P, Q, n) {
  let myList = [];
  for (let i = 0; i < n+2; i++) {
    myList.push(hNorm(vectSum(scalarVect(i/(n+1), Q), scalarVect((n+1-i)/(n+1), P))));
  }
  return myList;
}

function geodTangentScreen(Xv, Xp) {
  let d = Xv[0] + hZoom;
  return [
     (Xp[1] * d - Xv[1] * Xp[0]) / (d * d) * scrRadius,
    -(Xp[2] * d - Xv[2] * Xp[0]) / (d * d) * scrRadius
  ];
}

function addGeodPiece(ctx, s1, s2, N, T) {
  function X(s)  { return vectSum(scalarVect(Math.cosh(s), N), scalarVect(Math.sinh(s), T)); }
  function Xp(s) { return vectSum(scalarVect(Math.sinh(s), N), scalarVect(Math.cosh(s), T)); }
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

function addGeodEdge(ctx, Pv, Qv) {
  if (hDist(Pv, Qv) < epsilon) return;
  if (hZoom < epsilon) {
    let S2 = pt2Screen(Qv, hZoom); ctx.lineTo(S2[0], S2[1]); return;
  }
  let L = hPoints2Line(Pv, Qv);
  let N = hFootOfPerp([1, 0, 0], L);
  let c = hDot(N, Pv);
  let T_raw = vectSum(Pv, scalarVect(c, N));
  let d_P = Math.sqrt(Math.max(0, c * c - 1));
  if (d_P < epsilon) {
    let S2 = pt2Screen(Qv, hZoom); ctx.lineTo(S2[0], S2[1]); return;
  }
  let T  = scalarVect(1 / d_P, T_raw);
  let sP = Math.asinh(hDot(T, Pv));
  let sQ = Math.asinh(hDot(T, Qv));
  if (sP * sQ < 0) {
    addGeodPiece(ctx, sP, 0, N, T);
    addGeodPiece(ctx, 0, sQ, N, T);
  } else {
    addGeodPiece(ctx, sP, sQ, N, T);
  }
}

function addGeodPolyPath(ctx, viewVerts) {
  let n = viewVerts.length;
  let S0 = pt2Screen(viewVerts[0], hZoom);
  ctx.moveTo(S0[0], S0[1]);
  for (let i = 0; i < n; i++) addGeodEdge(ctx, viewVerts[i], viewVerts[(i + 1) % n]);
}

function nGonVerts(C, V, n) {
  let M = hRotMat(C, 2 * Math.PI / n);
  let verts = [V];
  for (let k = 1; k < n; k++) verts.push(multMatVect(M, verts[k - 1]));
  return verts;
}

// ── Base FD alignment & snap ──────────────────────────────────────────────────

function updateBaseFD() {
  if (!neighborCents || neighborCents.length === 0) { baseFDIdx = 0; return; }
  let minT = Infinity, bestIdx = 0;
  for (let i = 0; i < neighborCents.length; i++) {
    let t = multMatVect(moveMat, neighborCents[i])[0];
    if (t < minT) { minT = t; bestIdx = i; }
  }
  baseFDIdx = bestIdx;
}

function toPoincareFDRep(P) {
  let cur = hNorm(P), path = [], improved = true;
  while (improved) {
    improved = false;
    let d = hDist(cur, originFDCent), bestK = -1, bestD = d;
    for (let k = 0; k < genMats.length; k++) {
      let dc = hDist(multMatVect(invMat(genMats[k]), cur), originFDCent);
      if (dc < bestD - epsilon || (Math.abs(dc - bestD) < epsilon && bestK < 0)) {
        bestD = dc; bestK = k;
      }
    }
    if (bestK >= 0 && bestD < d - epsilon) {
      cur = hNorm(multMatVect(invMat(genMats[bestK]), cur));
      path.push(bestK); improved = true;
    }
  }
  return { pt: cur, path };
}

function buildSpecialPts() {
  specialPts = []; reflEdges = [];
  let n = originFD.length;
  for (let i = 0; i < n; i++) {
    let gm = genMaps[i];
    if (gm && gm[1] === 0) {
      let A = originFD[i], B = originFD[(i + 1) % n];
      if (A[0] < 1000 && B[0] < 1000) reflEdges.push([A, B]);
    }
    let prev = (i - 1 + n) % n, gp = genMaps[prev], gi = genMaps[i];
    let op = gp ? gp[1] : null, oi = gi ? gi[1] : null;
    let pt = originFD[i];
    if (pt[0] >= 1000) continue;
    if (op === 0 || oi === 0) { specialPts.push({pt, type: 'kali'}); continue; }
    if (op === 1 && oi === 1 && gp[0] === i && gi[0] === prev) {
      specialPts.push({pt, type: 'cone'}); continue;
    }
  }
}

function getSnappedPoint(P, screenPos) {
  let rep = toPoincareFDRep(P), path = rep.path;
  function fromPFD(Q) {
    let q = Q;
    for (let i = path.length - 1; i >= 0; i--) q = multMatVect(genMats[path[i]], q);
    return q;
  }
  let bestDist = 4, snapped = null;  // 4px threshold
  for (let sp of specialPts) {
    let tpt = fromPFD(sp.pt), sc = dispPt(tpt);
    let d = Math.hypot(sc[0] - screenPos[0], sc[1] - screenPos[1]);
    if (d < bestDist) { bestDist = d; snapped = tpt; }
  }
  if (snapped) return snapped;
  for (let [A, B] of reflEdges) {
    let sA = fromPFD(A), sB = fromPFD(B);
    let foot = hFootOfPerp(P, hPoints2Line(sA, sB));
    let sc = dispPt(foot);
    let d = Math.hypot(sc[0] - screenPos[0], sc[1] - screenPos[1]);
    if (d < bestDist) { bestDist = d; snapped = foot; }
  }
  return snapped || P;
}

function alignBaseFD(updateDragState) {
  let viewCenterScene = hNorm(multMatVect(invMat(moveMat), [1,0,0]));
  let bestMat = identity, bestCent = originFDCent, improved = true;
  while (improved) {
    improved = false;
    for (let k = 0; k < genMats.length; k++) {
      let tryMat = multMatMat(genMats[k], bestMat);
      let tryCent = multMatVect(tryMat, originFDCent);
      if (hDist(tryCent, viewCenterScene) < hDist(bestCent, viewCenterScene) - 1e-6) {
        bestMat = tryMat; bestCent = tryCent; improved = true; break;
      }
    }
  }
  if (hDist(bestCent, viewCenterScene) >= hDist(originFDCent, viewCenterScene) - 1e-6) return false;
  let candidateMat = multMatMat(moveMat, bestMat);
  let alignDet = matDet(candidateMat) < 0 ? -1 : 1;
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
    ? hIsomSeg2SegFlip(originFD[bI], originFD[bJ], V0, V1)
    : hIsomSeg2Seg(originFD[bI], originFD[bJ], V0, V1);
  moveMat = (typeof newMat === 'string') ? candidateMat : newMat;
  if (isFinite(moveMat[0][0]) && isFinite(moveMat[1][1]) && isFinite(moveMat[2][2]))
    lastGoodMoveMat = moveMat.map(row => [...row]);
  buildNeighborMats();
  baseFDIdx = 0;
  if (updateDragState) {
    tempMat = moveMat.map(row => [...row]);
    panBestI = bI; panBestJ = bJ; panDet = alignDet;
  }
  return true;
}

// ── hReDo — rebuild orbifold from UI params ───────────────────────────────────

function hReDo() {
  let handle   = Number(document.getElementById("handle").value);
  let crosscap = Number(document.getElementById("crosscap").value);
  let cone     = JSON.parse(document.getElementById("cone").value);
  let kali     = JSON.parse(document.getElementById("kali").value);

  moveMat = [[1,0,0],[0,1,0],[0,0,1]];
  lastGoodMoveMat = [[1,0,0],[0,1,0],[0,0,1]];
  baseFDIdx = 0;
  stepEdges = [0];
  params    = [0];
  atomList  = [];

  orbi2Atoms(handle, crosscap, cone, kali);
  atomList.reverse();
  buildMatch();
  buildBorderFD();
  rebuildGeom();
}

// ── hDraw — render hyperbolic scene ──────────────────────────────────────────

function hDraw(ctx, c) {
  // Recover from bad moveMat
  if (!moveMat || !isFinite(moveMat[0][0]) || !isFinite(moveMat[1][1]) || !isFinite(moveMat[2][2])) {
    moveMat = lastGoodMoveMat.map(row => [...row]);
    buildNeighborMats(); updateBaseFD();
  }

  // White background
  ctx.beginPath();
  ctx.rect(0, 0, c.width, c.height);
  ctx.fillStyle = "white";
  ctx.fill();

  // Disk outline
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.arc(scrCenterX, scrCenterY, scrRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.closePath();

  // FD tiles
  if (neighborMats && originFD && originFD.length > 0) {
    let vv = originFD.map(p => multMatVect(moveMat, multMatVect(neighborMats[baseFDIdx], p)));
    if (gridMode) {
      ctx.beginPath();
      addGeodPolyPath(ctx, vv);
      ctx.closePath();
      ctx.fillStyle = "beige";
      ctx.fill();
      ctx.strokeStyle = "lightgrey";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (gridMode) {
      ctx.strokeStyle = "lightgrey";
      ctx.lineWidth = 1;
      for (let i = 0; i < neighborMats.length; i++) {
        if (i === baseFDIdx) continue;
        let vv2 = originFD.map(p => multMatVect(moveMat, multMatVect(neighborMats[i], p)));
        ctx.beginPath();
        addGeodPolyPath(ctx, vv2);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }

  // Param segment display in edit mode
  if (mode === 0 && paramPtList) {
    for (let j = 1; j < paramPtList.length; j++) {
      if (!paramPtList[j]) continue;
      let [P, Q, twist] = paramPtList[j];
      let Pv = multMatVect(moveMat, P), Qv = multMatVect(moveMat, Q);
      ctx.beginPath();
      ctx.moveTo(...pt2Screen(Pv, hZoom));
      addGeodEdge(ctx, Pv, Qv);
      ctx.strokeStyle = "green"; ctx.lineWidth = 1.5; ctx.stroke();
      for (let ep = 0; ep < 2; ep++) {
        let pt = ep === 0 ? P : Q;
        let s = dispPt(pt);
        ctx.beginPath();
        ctx.arc(s[0], s[1], 4, 0, 2 * Math.PI);
        ctx.fillStyle = (paramNum === j && paramEnd === ep) ? "yellow" : "green";
        ctx.fill(); ctx.closePath();
      }
      if (stepEdges[j] === 3 || stepEdges[j] === 8) {
        let t = Math.max(0, Math.min(1, twist));
        let twistPt = hNorm(vectSum(scalarVect(1 - t, P), scalarVect(t, Q)));
        let s = dispPt(twistPt), r = 6;
        ctx.beginPath();
        ctx.moveTo(s[0], s[1] - r); ctx.lineTo(s[0] + r, s[1]);
        ctx.lineTo(s[0], s[1] + r); ctx.lineTo(s[0] - r, s[1]);
        ctx.closePath();
        ctx.fillStyle = (paramNum === j && paramEnd === -1) ? "yellow" : "orange";
        ctx.fill();
      }
    }
  }

  // Stack shapes tiled through neighborMats
  if (stack.length > 0 && neighborMats) {
    for (let s = 0; s < stack.length; s++) {
      let shape = stack[s];
      ctx.strokeStyle = shape[3]; ctx.lineWidth = 1.5;
      for (let t = 0; t < neighborMats.length; t++) {
        let M = neighborMats[t];
        if (shape[0] === 1) {
          let Pv = multMatVect(moveMat, multMatVect(M, shape[1]));
          let Qv = multMatVect(moveMat, multMatVect(M, shape[2]));
          ctx.beginPath();
          ctx.moveTo(...pt2Screen(Pv, hZoom));
          addGeodEdge(ctx, Pv, Qv);
          ctx.stroke();
        } else {
          let Cv = multMatVect(moveMat, multMatVect(M, shape[1]));
          let Vv = multMatVect(moveMat, multMatVect(M, shape[2]));
          let polyVerts = nGonVerts(Cv, Vv, shape[0]);
          ctx.beginPath();
          addGeodPolyPath(ctx, polyVerts);
          ctx.closePath();
          if (shape[4]) { ctx.fillStyle = shape[3]; ctx.fill(); }
          ctx.stroke();
        }
      }
    }
  }

  // Preview current shape
  if (posA !== 0 && posB !== 0 && mode >= 1 && neighborMats) {
    let inv = getInvMove();
    let P = multMatVect(inv, posA3d);
    let Q = multMatVect(inv, posB3d);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    for (let t = 0; t < neighborMats.length; t++) {
      let M = neighborMats[t];
      if (mode === 1) {
        let Pv = multMatVect(moveMat, multMatVect(M, P));
        let Qv = multMatVect(moveMat, multMatVect(M, Q));
        ctx.beginPath();
        ctx.moveTo(...pt2Screen(Pv, hZoom));
        addGeodEdge(ctx, Pv, Qv);
        ctx.stroke();
      } else {
        let Cv = multMatVect(moveMat, multMatVect(M, P));
        let Vv = multMatVect(moveMat, multMatVect(M, Q));
        let polyVerts = nGonVerts(Cv, Vv, mode);
        ctx.beginPath();
        addGeodPolyPath(ctx, polyVerts);
        ctx.closePath();
        if (fill) { ctx.fillStyle = color; ctx.fill(); }
        ctx.stroke();
      }
    }
  }

  // Edit-mode control point markers
  if (mode === 0) {
    let r = 8;
    for (let s = 0; s < stack.length; s++) {
      for (let cp = 1; cp <= 2; cp++) {
        let sc = dispPt(stack[s][cp]);
        ctx.beginPath();
        ctx.rect(sc[0] - r, sc[1] - r, r*2, r*2);
        ctx.fillStyle = (s === shapeNum && cp === controlPt) ? "yellow" : "white";
        ctx.fill();
        ctx.strokeStyle = "black"; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  }
}

// ── H mouse handlers ───────────────────────────────────────────────────────────
// Reference shared globals from main.js: mode, color, fill, snapMode, stack, undoStack.

function hMousePressed(sx, sy) {
  posA   = [sx, sy];
  posA3d = screen2Pt(posA, hZoom);

  if (mode === -1) {
    tempMat = moveMat.map(row => [...row]);
    panDet = matDet(tempMat) >= 0 ? 1 : -1;
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

  if (mode === 0) {
    shapeNum = -1; paramNum = -1;
    moveMatAtPress = moveMat.map(row => [...row]);
    // hit-test twist markers (diamonds)
    for (let j = 1; paramPtList && j < paramPtList.length; j++) {
      if (!paramPtList[j]) continue;
      if (stepEdges[j] !== 3 && stepEdges[j] !== 8) continue;
      let [P, Q, twist] = paramPtList[j];
      let t = Math.max(0, Math.min(1, twist));
      let twistPt = hNorm(vectSum(scalarVect(1-t, P), scalarVect(t, Q)));
      let s = dispPt(twistPt);
      if (Math.abs(posA[0]-s[0]) < editBoxSize && Math.abs(posA[1]-s[1]) < editBoxSize) {
        paramNum = j; paramEnd = -1;
        paramDragLine = hPoints2Line(P, Q);
        return;
      }
    }
    // hit-test param endpoints
    for (let j = 1; paramPtList && j < paramPtList.length; j++) {
      if (!paramPtList[j]) continue;
      let [P, Q] = paramPtList[j];
      let sP = dispPt(P), sQ = dispPt(Q);
      if (Math.abs(posA[0]-sP[0]) < editBoxSize && Math.abs(posA[1]-sP[1]) < editBoxSize) {
        paramNum = j; paramEnd = 0;
        paramDragFixed = multMatVect(moveMat, Q);
        paramDragFixedScene = Q;
        paramDragLine = hPoints2Line(P, Q);
        return;
      }
      if (Math.abs(posA[0]-sQ[0]) < editBoxSize && Math.abs(posA[1]-sQ[1]) < editBoxSize) {
        paramNum = j; paramEnd = 1;
        paramDragFixed = multMatVect(moveMat, P);
        paramDragFixedScene = P;
        paramDragLine = hPoints2Line(P, Q);
        return;
      }
    }
    // hit-test stack control points
    for (let i = 0; i < stack.length; i++) {
      let s1 = dispPt(stack[i][1]), s2 = dispPt(stack[i][2]);
      if (Math.abs(posA[0]-s1[0]) < editBoxSize && Math.abs(posA[1]-s1[1]) < editBoxSize) { shapeNum = i; controlPt = 1; break; }
      if (Math.abs(posA[0]-s2[0]) < editBoxSize && Math.abs(posA[1]-s2[1]) < editBoxSize) { shapeNum = i; controlPt = 2; break; }
    }
  }
}

function hMouseMoved(sx, sy) {
  posB   = [sx, sy];
  posB3d = screen2Pt(posB, hZoom);

  if (mode === 0 && paramNum >= 0) {
    let mouseScene = multMatVect(invMat(moveMatAtPress), posB3d);
    let F = hFootOfPerp(mouseScene, paramDragLine);
    if (paramEnd === -1) {
      let [P, Q] = paramPtList[paramNum];
      let lenPQ = hDist(P, Q);
      if (lenPQ > epsilon) {
        let distPF = hDist(P, F), distFQ = hDist(F, Q);
        let t;
        if (distPF + distFQ < lenPQ + 0.001) { t = distPF / lenPQ; }
        else if (distFQ > lenPQ) { t = 0; }
        else { t = 1; }
        if (t < epsilon) t = 0;
        params[paramNum][1] = t;
        paramPtList[paramNum][2] = t;
      }
      let savedIdx = baseFDIdx;
      if (stepEdges[paramNum] === 3) {
        buildAllGenMats(); buildAllMappedCents(); buildIndexedCents();
        buildGenMats(); buildNeighborMats();
      } else { rebuildGeom(); }
      baseFDIdx = savedIdx;
      return;
    }
    let fixedPtScene = paramDragFixedScene;
    if (hDist(F, fixedPtScene) < epsilon * 100) return;
    params[paramNum][0] = hDist(F, fixedPtScene);
    let savedIdx = baseFDIdx;
    rebuildGeom();
    baseFDIdx = savedIdx;
    let P_new = paramPtList[paramNum][paramEnd];
    let Q_new = paramPtList[paramNum][1 - paramEnd];
    let F_view = multMatVect(moveMatAtPress, F);
    moveMat = matDet(moveMatAtPress) >= 0
      ? hIsomSeg2Seg(P_new, Q_new, F_view, paramDragFixed, 0)
      : hIsomSeg2SegFlip(P_new, Q_new, F_view, paramDragFixed);
    return;
  }

  if (mode === 0 && shapeNum >= 0) {
    let sceneP = multMatVect(invMat(moveMat), posB3d);
    if (snapMode) sceneP = getSnappedPoint(sceneP, posB);
    stack[shapeNum][controlPt] = sceneP;
    return;
  }

  if (posA === 0) return;
  if (mode === -1) {
    let candidate = multMatMat(hTransMat(posA3d, posB3d), tempMat);
    if (isFinite(candidate[0][0])) {
      let V0 = hNorm(multMatVect(candidate, originFD[panBestI]));
      let V1 = hNorm(multMatVect(candidate, originFD[panBestJ]));
      let newMat = panDet < 0
        ? hIsomSeg2SegFlip(originFD[panBestI], originFD[panBestJ], V0, V1)
        : hIsomSeg2Seg(originFD[panBestI], originFD[panBestJ], V0, V1);
      moveMat = (typeof newMat !== 'string') ? newMat : candidate;
      if (isFinite(moveMat[0][0]) && isFinite(moveMat[1][1]) && isFinite(moveMat[2][2]))
        lastGoodMoveMat = moveMat.map(row => [...row]);
    }
  }
}

function hMouseReleased(sx, sy) {
  if (mode === 0) { shapeNum = -1; paramNum = -1; posA = 0; alignBaseFD(false); return; }
  if (posA === 0) { posB = 0; posB3d = 0; return; }
  posB   = [sx, sy];
  posB3d = screen2Pt(posB, hZoom);
  if (mode === -1) { alignBaseFD(false); }
  if (mode >= 1) {
    let inv = getInvMove();
    let P = multMatVect(inv, posA3d);
    let Q = multMatVect(inv, posB3d);
    if (snapMode) {
      P = getSnappedPoint(P, posA);
      Q = getSnappedPoint(Q, posB);
    }
    undoStack = [];
    stack.push([mode === 1 ? 1 : mode, P, Q, color, mode === 1 ? 0 : fill]);
  }
  posA = 0; posB = 0; posA3d = 0; posB3d = 0;
}
