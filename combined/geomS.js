// geomS.js — Spherical geometry for the combined orbifold app.

// ═══════════════════════════════════════════════════════════════════════════════
// S (Spherical) geometry
// ═══════════════════════════════════════════════════════════════════════════════

// ── S state ──────────────────────────────────────────────────────────────────

var sOrbi      = 0;    // group index 0–13 (maps to orbiSph's 1–14)
var sMyRot     = 5;
var sSymVects  = [[0,1,0],[1,0,0],[0,1.6180339887498948482045868343656,1]];
var sNumMaps   = 24;
// scrRadius, scrCenterX, scrCenterY are shared with geomH.js (defined there).
var sPosA3d = [], sPosB3d = [];
var sBackupStack = [], sBackupSymVects = [];

// ── S vector math ─────────────────────────────────────────────────────────────

function sNormalize(a)  { return scalarVect(1/vectLeng(a),a); }
function sReflect(n, v) { n = sNormalize(n); return vectSum(v, scalarVect(-2*dot(n,v), n)); }

// Rodrigues rotation matrix as 2D array (column-vector convention: v' = M·v)
function sRotMat(axis, angle) {
  axis = sNormalize(axis);
  var c = Math.cos(angle), s = Math.sin(angle);
  var x = axis[0], y = axis[1], z = axis[2];
  return [[c+x*x*(1-c),   x*y*(1-c)-z*s, x*z*(1-c)+y*s],
          [y*x*(1-c)+z*s, c+y*y*(1-c),   y*z*(1-c)-x*s],
          [z*x*(1-c)-y*s, z*y*(1-c)+x*s, c+z*z*(1-c)]];
}

// sphere ↔ screen
function sVect2screen(v) {
  return [v[0]*scrRadius + scrCenterX, -v[1]*scrRadius + scrCenterY];
}
function sScreen2vect(sx, sy, shiftKey) {
  var x = (sx - scrCenterX) / scrRadius;
  var y = (scrCenterY - sy) / scrRadius;
  var z = Math.sqrt(Math.max(0, 1 - x*x - y*y));
  if (shiftKey) z = -z;
  return [x, y, z];
}

// ── S group setup ─────────────────────────────────────────────────────────────
// idx 0–13 matches the combined/index.html <select id="sGroup"> options.

function sSetOrb(idx, n) {
  sOrbi = idx;
  if (n === undefined) n = 2;
  switch (idx) {
    case 0: // *532
      sMyRot = 5;
      sSymVects = [[0,1,0],[1,0,0],[0,1.6180339887498948482045868343656,1]];
      sNumMaps = 24;
      break;
    case 1: // 532
      sMyRot = 5;
      sSymVects = [[0,1,0],[1,0,0],[0,1.6180339887498948482045868343656,1]];
      sNumMaps = 12;
      break;
    case 2: // *432
      sMyRot = 4;
      sSymVects = [[0,1,0],[1,0,0]];
      sNumMaps = 12;
      break;
    case 3: // 432
      sMyRot = 4;
      sSymVects = [[0,1,0],[1,0,0]];
      sNumMaps = 6;
      break;
    case 4: // *332
      sMyRot = 2;
      sSymVects = [[0,1,0],[1,0,0],[1,1,1],[0,1,1]];
      sNumMaps = 12;
      break;
    case 5: // 3*2
      sMyRot = 2;
      sSymVects = [[0,1,0],[1,0,0],[1,1,1]];
      sNumMaps = 12;
      break;
    case 6: // 332
      sMyRot = 2;
      sSymVects = [[0,1,0],[1,0,0],[1,1,1]];
      sNumMaps = 6;
      break;
    case 7: // *22n
      sMyRot = n;
      sSymVects = [[0,1,0],[1,0,0]];
      sNumMaps = 4;
      break;
    case 8: // 2*n
      sMyRot = n;
      sSymVects = [[0,1,0],[1,0,0]];
      sNumMaps = 4;
      break;
    case 9: // 22n
      sMyRot = n;
      sSymVects = [[0,1,0],[1,0,0]];
      sNumMaps = 2;
      break;
    case 10: // n*
      sMyRot = n;
      sSymVects = [[0,1,0]];
      sNumMaps = 2;
      break;
    case 11: // n×
      sMyRot = n;
      sSymVects = [[0,1,0]];
      sNumMaps = 2;
      break;
    case 12: // *nn
      sMyRot = n;
      sSymVects = [[0,1,0],[1,0,0]];
      sNumMaps = 2;
      break;
    case 13: // nn
      sMyRot = n;
      sSymVects = [[0,1,0]];
      sNumMaps = 1;
      break;
  }
}

// ── S MapOne ──────────────────────────────────────────────────────────────────
// Internal function; myOrbi is 1-based (sOrbi+1 from the outside).

function sMapOneInner(myMap, myOrbi, x, y, z) {
  var xOut, yOut, zOut, newPt, symRotAng;
  switch (myOrbi) {
    case 1: // *532
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multMatVect(sRotMat(sSymVects[0],0.4*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multMatVect(sRotMat(sSymVects[0],0.8*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multMatVect(sRotMat(sSymVects[0],1.2*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multMatVect(sRotMat(sSymVects[0],1.6*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multMatVect(sRotMat(sSymVects[0],0.4*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multMatVect(sRotMat(sSymVects[0],0.8*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multMatVect(sRotMat(sSymVects[0],1.2*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multMatVect(sRotMat(sSymVects[0],1.6*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 13: newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 14: newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 15: newPt=multMatVect(sRotMat(sSymVects[0],0.4*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 16: newPt=multMatVect(sRotMat(sSymVects[0],0.8*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 17: newPt=multMatVect(sRotMat(sSymVects[0],1.2*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 18: newPt=multMatVect(sRotMat(sSymVects[0],1.6*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 19: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 20: newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 21: newPt=multMatVect(sRotMat(sSymVects[0],0.4*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 22: newPt=multMatVect(sRotMat(sSymVects[0],0.8*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 23: newPt=multMatVect(sRotMat(sSymVects[0],1.2*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 24: newPt=multMatVect(sRotMat(sSymVects[0],1.6*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 2: // 532
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multMatVect(sRotMat(sSymVects[0],0.4*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multMatVect(sRotMat(sSymVects[0],0.8*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multMatVect(sRotMat(sSymVects[0],1.2*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multMatVect(sRotMat(sSymVects[0],1.6*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multMatVect(sRotMat(sSymVects[0],0.4*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multMatVect(sRotMat(sSymVects[0],0.8*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multMatVect(sRotMat(sSymVects[0],1.2*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multMatVect(sRotMat(sSymVects[0],1.6*Math.PI),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[2],Math.PI),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 3: // *432
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multMatVect(sRotMat(sSymVects[0],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multMatVect(sRotMat(sSymVects[0],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multMatVect(sRotMat(sSymVects[0],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multMatVect(sRotMat(sSymVects[0],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 4: // 432
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3: newPt=multMatVect(sRotMat(sSymVects[0],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6: newPt=multMatVect(sRotMat(sSymVects[0],Math.PI/2),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI/2),newPt); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 5: // *332
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=sReflect(sNormalize(sSymVects[3]),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 6: // 3*2
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=sReflect(sSymVects[0],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); newPt=sReflect(sSymVects[0],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); newPt=sReflect(sSymVects[0],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=sReflect(sSymVects[0],[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); newPt=sReflect(sSymVects[0],newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); newPt=sReflect(sSymVects[0],newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 7: // 332
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3: newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4: newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5: newPt=multMatVect(sRotMat(sSymVects[2],2*Math.PI/3),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6: newPt=multMatVect(sRotMat(sSymVects[2],4*Math.PI/3),[x,y,z]); newPt=multMatVect(sRotMat(sSymVects[1],Math.PI),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 8: // *22n
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3: newPt=sReflect(sSymVects[0],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4: newPt=sReflect(sSymVects[0],[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 9: // 2*n
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3: newPt=sReflect(sSymVects[0],[x,y,z]); symRotAng=Math.PI/sMyRot; newPt=multMatVect(sRotMat(sSymVects[0],symRotAng),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4: newPt=sReflect(sSymVects[0],[x,y,z]); newPt=sReflect(sSymVects[1],newPt); symRotAng=Math.PI/sMyRot; newPt=multMatVect(sRotMat(sSymVects[0],symRotAng),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 10: // 22n
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=sReflect(sSymVects[0],[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 11: // n*
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=sReflect(sSymVects[0],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 12: // n×
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=sReflect(sSymVects[0],[x,y,z]); symRotAng=Math.PI/sMyRot; newPt=multMatVect(sRotMat(sSymVects[0],symRotAng),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 13: // *nn
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 14: // nn
      xOut=x; yOut=y; zOut=z;
      break;
  }
  return [xOut, yOut, zOut];
}

// Public wrapper: converts 0-based sOrbi to 1-based case
function sMapOne(myMap, x, y, z) {
  return sMapOneInner(myMap, sOrbi+1, x, y, z);
}

// ── S Bezier geodesic rendering ───────────────────────────────────────────────
// These push segments into local frontBez/rearBez arrays passed by reference.

function sFindLineBez(frontBez, rearBez, A, B, myColor, myColorLite) {
  var pvect = sNormalize(cross(A, B));
  var lineMode = 0;
  if (A[2] < 0) lineMode = 1;
  if (B[2] < 0) lineMode += 2;
  var tanA = sNormalize(cross(pvect, A));
  var tanB = sNormalize(cross(B, pvect));

  if (lineMode === 1 || lineMode === 2) {
    var maj = sNormalize(cross([0,0,1], pvect));
    if (lineMode === 2) maj = scalarVect(-1, maj);
    var tanMajA = sNormalize(cross(maj, pvect));
    var tanMajB = scalarVect(-1, tanMajA);
    var myAngA = Math.acos(Math.min(1, Math.max(-1, dot(maj, A))));
    var myAngB = Math.acos(Math.min(1, Math.max(-1, dot(maj, B))));
    var k2A = 0.011 + 0.276*myAngA + 0.0436*myAngA*myAngA;
    var k2B = 0.011 + 0.276*myAngB + 0.0436*myAngB*myAngB;
    var midA     = vectSum(A, scalarVect(k2A, tanA));
    var midB     = vectSum(B, scalarVect(k2B, tanB));
    var midMajA  = vectSum(maj, scalarVect(k2A, tanMajA));
    var midMajB  = vectSum(maj, scalarVect(k2B, tanMajB));
    var pt1=sVect2screen(A), pt2=sVect2screen(midA),  pt3=sVect2screen(midMajA), pt4=sVect2screen(maj);
    var pt5=sVect2screen(B), pt6=sVect2screen(midB),  pt7=sVect2screen(midMajB), pt8=sVect2screen(maj);
    if (lineMode === 1) {
      rearBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColorLite,0]);
      frontBez.push([pt5[0],pt5[1],[[pt6[0],pt6[1],pt7[0],pt7[1],pt8[0],pt8[1]]],myColor,0]);
    } else {
      rearBez.push([pt5[0],pt5[1],[[pt6[0],pt6[1],pt7[0],pt7[1],pt8[0],pt8[1]]],myColorLite,0]);
      frontBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColor,0]);
    }
  } else {
    var myAng = Math.acos(Math.min(1, Math.max(-1, dot(A, B))));
    var k2 = 0.011 + 0.276*myAng + 0.0436*myAng*myAng;
    var midA = vectSum(A, scalarVect(k2, tanA));
    var midB = vectSum(B, scalarVect(k2, tanB));
    var pt1=sVect2screen(A), pt2=sVect2screen(midA), pt3=sVect2screen(midB), pt4=sVect2screen(B);
    if (lineMode === 3) {
      rearBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColorLite,0]);
    } else {
      frontBez.push([pt1[0],pt1[1],[[pt2[0],pt2[1],pt3[0],pt3[1],pt4[0],pt4[1]]],myColor,0]);
    }
  }
}

// Returns array of {front:bool, bez:[x1,y1,cx1,cy1,cx2,cy2,x2,y2]} segments
function sFindLineBez2(A, B) {
  var out = [];
  var pvect = sNormalize(cross(A, B));
  var lineMode = 0;
  if (A[2] < 0) lineMode = 1;
  if (B[2] < 0) lineMode += 2;
  var tanA = sNormalize(cross(pvect, A));
  var tanB = sNormalize(cross(B, pvect));
  if (lineMode === 1 || lineMode === 2) {
    var maj = sNormalize(cross([0,0,1], pvect));
    if (lineMode === 2) maj = scalarVect(-1, maj);
    var tanMajA = sNormalize(cross(maj, pvect));
    var tanMajB = scalarVect(-1, tanMajA);
    var myAngA = Math.acos(Math.min(1, Math.max(-1, dot(maj, A))));
    var myAngB = Math.acos(Math.min(1, Math.max(-1, dot(maj, B))));
    var k2A = 0.011 + 0.276*myAngA + 0.0436*myAngA*myAngA;
    var k2B = 0.011 + 0.276*myAngB + 0.0436*myAngB*myAngB;
    var midA    = vectSum(A,   scalarVect(k2A, tanA));
    var midB    = vectSum(B,   scalarVect(k2B, tanB));
    var midMajA = vectSum(maj, scalarVect(k2A, tanMajA));
    var midMajB = vectSum(maj, scalarVect(k2B, tanMajB));
    var pt1=sVect2screen(A),    pt2=sVect2screen(midA),    pt3=sVect2screen(midMajA), pt4=sVect2screen(maj);
    var pt5=sVect2screen(maj),  pt6=sVect2screen(midMajB), pt7=sVect2screen(midB),    pt8=sVect2screen(B);
    if (lineMode === 1) {
      out.push([-1, pt1[0],pt1[1], pt2[0],pt2[1], pt3[0],pt3[1], pt4[0],pt4[1]]);
      out.push([ 1, pt5[0],pt5[1], pt6[0],pt6[1], pt7[0],pt7[1], pt8[0],pt8[1]]);
    } else {
      out.push([ 1, pt1[0],pt1[1], pt2[0],pt2[1], pt3[0],pt3[1], pt4[0],pt4[1]]);
      out.push([-1, pt5[0],pt5[1], pt6[0],pt6[1], pt7[0],pt7[1], pt8[0],pt8[1]]);
    }
  } else {
    var myAng = Math.acos(Math.min(1, Math.max(-1, dot(A, B))));
    var k2 = 0.011 + 0.276*myAng + 0.0436*myAng*myAng;
    var midA = vectSum(A, scalarVect(k2, tanA));
    var midB = vectSum(B, scalarVect(k2, tanB));
    var pt1=sVect2screen(A), pt2=sVect2screen(midA), pt3=sVect2screen(midB), pt4=sVect2screen(B);
    if (lineMode === 3) {
      out.push([-1, pt1[0],pt1[1], pt2[0],pt2[1], pt3[0],pt3[1], pt4[0],pt4[1]]);
    } else {
      out.push([ 1, pt1[0],pt1[1], pt2[0],pt2[1], pt3[0],pt3[1], pt4[0],pt4[1]]);
    }
  }
  return out;
}

function sFindPolyBez(frontBez, rearBez, myMode, thisPoly, myColor, myColorLite, myFill) {
  if (myFill === 0) {
    for (var i = 1; i < thisPoly.length; i++) {
      sFindLineBez(frontBez, rearBez, thisPoly[i-1], thisPoly[i], myColor, myColorLite);
    }
    sFindLineBez(frontBez, rearBez, thisPoly[thisPoly.length-1], thisPoly[0], myColor, myColorLite);
  } else {
    var rearBezList = [], frontBezList = [];
    for (var i = 0; i < thisPoly.length; i++) {
      var nextLineBez;
      if (i === 0) {
        nextLineBez = sFindLineBez2(thisPoly[thisPoly.length-1], thisPoly[0]);
      } else {
        nextLineBez = sFindLineBez2(thisPoly[i-1], thisPoly[i]);
      }
      if (nextLineBez[0][0] === 1) {
        frontBezList.push(nextLineBez[0]);
      } else {
        rearBezList.push(nextLineBez[0]);
      }
      if (nextLineBez.length > 1) {
        var xc = scrCenterX, yc = scrCenterY;
        if (nextLineBez[0][0] === 1) { // front first
          if (rearBezList.length === 0) {
            rearBezList.push(nextLineBez[1]);
          } else {
            var x1=rearBezList[rearBezList.length-1][7], y1=rearBezList[rearBezList.length-1][8];
            var x4=nextLineBez[1][1], y4=nextLineBez[1][2];
            var ax=x1-xc, ay=y1-yc, bx=x4-xc, by=y4-yc;
            var q1=ax*ax+ay*ay, q2=q1+ax*bx+ay*by;
            var k2=(4/3)*(Math.sqrt(2*q1*q2)-q2)/(ax*by-ay*bx);
            var x2=xc+ax-k2*ay, y2=yc+ay+k2*ax, x3=xc+bx+k2*by, y3=yc+by-k2*bx;
            rearBezList.push([1,x1,y1,x2,y2,x3,y3,x4,y4]);
            rearBezList.push(nextLineBez[1]);
            frontBezList.push([-1,x4,y4,x3,y3,x2,y2,x1,y1]);
          }
        } else { // back first
          if (frontBezList.length === 0) {
            frontBezList.push(nextLineBez[1]);
          } else {
            var x1=frontBezList[frontBezList.length-1][7], y1=frontBezList[frontBezList.length-1][8];
            var x4=nextLineBez[1][1], y4=nextLineBez[1][2];
            var ax=x1-xc, ay=y1-yc, bx=x4-xc, by=y4-yc;
            var q1=ax*ax+ay*ay, q2=q1+ax*bx+ay*by;
            var k2=(4/3)*(Math.sqrt(2*q1*q2)-q2)/(ax*by-ay*bx);
            var x2=xc+ax-k2*ay, y2=yc+ay+k2*ax, x3=xc+bx+k2*by, y3=yc+by-k2*bx;
            frontBezList.push([1,x1,y1,x2,y2,x3,y3,x4,y4]);
            frontBezList.push(nextLineBez[1]);
            rearBezList.push([-1,x4,y4,x3,y3,x2,y2,x1,y1]);
          }
        }
      }
    }
    if (rearBezList.length > 0) {
      var tempList = rearBezList.map(function(s){ return [s[3],s[4],s[5],s[6],s[7],s[8]]; });
      rearBez.push([rearBezList[0][1], rearBezList[0][2], tempList, myColorLite, 1]);
    }
    if (frontBezList.length > 0) {
      var tempList = frontBezList.map(function(s){ return [s[3],s[4],s[5],s[6],s[7],s[8]]; });
      frontBez.push([frontBezList[0][1], frontBezList[0][2], tempList, myColor, 1]);
    }
  }
}

// Compute Bezier representation of one stack element (mode, P=[x,y,z], Q=[x,y,z])
// P is the center/first point, Q is the second point / first vertex direction.
function sFindBez(frontBez, rearBez, myMode, P, Q, myColor, myFill) {
  // compute lighter version of color for back-hemisphere rendering
  var rgb = [parseInt(myColor.substr(1,2),16), parseInt(myColor.substr(3,2),16), parseInt(myColor.substr(5,2),16)];
  var lf = 0.3;
  rgb = rgb.map(function(c){ return Math.round(255-(255-c)*lf); });
  var myColorLite = '#' + rgb.map(function(c){ return ('0'+c.toString(16)).slice(-2); }).join('');

  if (myMode === 1) { // line
    for (var map = 1; map <= sNumMaps; map++) {
      var A3 = sMapOne(map, P[0], P[1], P[2]);
      var B3 = sMapOne(map, Q[0], Q[1], Q[2]);
      var symRotAng = 2*Math.PI / sMyRot;
      for (var i = 0; i < sMyRot; i++) {
        var curMat = sRotMat(sSymVects[0], symRotAng*i);
        var AA = multMatVect(curMat, A3);
        var BB = multMatVect(curMat, B3);
        sFindLineBez(frontBez, rearBez, AA, BB, myColor, myColorLite);
      }
    }
  }
  if (myMode > 2) { // polygon: P=center axis, Q=first vertex
    var angleStep = 2*Math.PI / myMode;
    var myPoly = [];
    for (var k = 0; k < myMode; k++) {
      myPoly.push(multMatVect(sRotMat(P, angleStep*k), Q));
    }
    for (var map = 1; map <= sNumMaps; map++) {
      var mapPoly = myPoly.map(function(v){ return sMapOne(map, v[0], v[1], v[2]); });
      var symRotAng = 2*Math.PI / sMyRot;
      for (var i = 0; i < sMyRot; i++) {
        var curMat = sRotMat(sSymVects[0], symRotAng*i);
        var rotPoly = mapPoly.map(function(v){ return multMatVect(curMat, v); });
        sFindPolyBez(frontBez, rearBez, myMode, rotPoly, myColor, myColorLite, myFill);
      }
    }
  }
}

// ── S Fundamental Domain ──────────────────────────────────────────────────────

function sFDVerts() {
  var pi = Math.PI;
  var n  = sMyRot;
  var s0 = sNormalize(sSymVects[0]);
  var s1 = (sSymVects.length > 1) ? sNormalize(sSymVects[1]) : null;
  var sX = s1 ? sNormalize(cross(s0, s1)) : null;  // perp to s0 and s1
  var N  = s0;
  var S  = scalarVect(-1, N);
  // E0: equator point. Use s1 if available, else project [1,0,0] perp to N.
  var E0;
  if (s1) {
    E0 = s1;
  } else {
    var ref = (Math.abs(dot(s0, [1,0,0])) < 0.9) ? [1,0,0] : [0,0,1];
    E0 = sNormalize(vectDiff(ref, scalarVect(dot(s0, ref), s0)));
  }
  var Ehn = multMatVect(sRotMat(N, pi/n), E0);
  var E2n = multMatVect(sRotMat(N, 2*pi/n), E0);
  switch (sOrbi) {
    case 0: { // *532: s0=5-fold, normalize(sv[2])=2-fold edge midpoint, C=3-fold face center
      var phi2 = (3+Math.sqrt(5))/2;  // φ² = φ+1 ≈ 2.618
      var e2 = sNormalize(sSymVects[2]);
      var C532 = sNormalize(vectSum(s1, scalarVect(phi2, e2)));
      return [s0, e2, C532];
    }
    case 1: { // 532 — kite of two *532 triangles
      var phi2 = (3+Math.sqrt(5))/2;
      var e2 = sNormalize(sSymVects[2]);
      var C532  = sNormalize(vectSum(s1,               scalarVect(phi2, e2)));
      var C532p = sNormalize(vectSum(scalarVect(-1, s1), scalarVect(phi2, e2)));
      return [C532, s0, C532p, e2];
    }
    case 2: { // *432: s0=4-fold pole, s1=2nd axis; nsX=[0,0,1] initially
      var nsX = scalarVect(-1, sX);
      return [s0,
              sNormalize(vectSum(s0, nsX)),
              sNormalize(vectSum(vectSum(s0, s1), nsX))];
    }
    case 3: { // 432 — kite of two *432 triangles
      var nsX = scalarVect(-1, sX);
      return [sNormalize(vectSum(vectSum(s0, s1), nsX)),
              s0,
              sNormalize(vectSum(vectDiff(s0, s1), nsX)),
              sNormalize(vectSum(s0, nsX))];
    }
    case 4: { // *332: sv[0,1,2,3] = [0,1,0],[1,0,0],[1,1,1],[0,1,1]
      // normalize(2*sv[0]+sv[1]-sv[3]) = normalize([1,1,-1])
      return [sNormalize(vectSum(vectSum(scalarVect(2,sSymVects[0]), sSymVects[1]),
                                 scalarVect(-1,sSymVects[3]))),
              s1,
              sNormalize(sSymVects[2])];
    }
    case 5: { // 3*2 — *432 triangle reflected across its x=z side
      // vertices: norm([0,1,1]), [0,1,0] (2-fold corner), norm([1,1,0]), norm([1,1,1])
      var nsX = scalarVect(-1, sX);
      return [sNormalize(vectSum(s0, nsX)),
              s0,
              sNormalize(vectSum(s0, s1)),
              sNormalize(vectSum(vectSum(s0, s1), nsX))];
    }
    case 6: { // 332 — triangle of area pi/3 (twice *332 area)
      // vertices: norm([1,1,1]), norm([1,1,-1]), norm([1,-1,-1])
      return [sNormalize(sSymVects[2]),
              sNormalize(vectSum(vectSum(s0, s1), sX)),
              sNormalize(vectSum(vectDiff(s1, s0), sX))];
    }
    case 7: case 8:           return [N, E0, Ehn];
    case 9: case 10: case 11: return [N, E0, E2n];
    case 12:                  return [N, E0, S, Ehn];
    case 13:                  return [N, E0, S, E2n];
    default:                  return [N, E0, S];
  }
}

function sFillFD(frontBez, rearBez) {
  var verts     = sFDVerts();
  var hiColor   = '#ffdc64';
  var hiLite    = '#ffebb8';
  var edgeColor = '#aaaaaa';
  var edgeLite  = '#cccccc';
  var symRotAng = 2 * Math.PI / sMyRot;
  for (var map = 1; map <= sNumMaps; map++) {
    var mapped = verts.map(function(v){ return sMapOne(map, v[0], v[1], v[2]); });
    for (var i = 0; i < sMyRot; i++) {
      var curMat  = sRotMat(sSymVects[0], symRotAng * i);
      var rotPoly = mapped.map(function(v){ return multMatVect(curMat, v); });
      var isCanon = (map === 1 && i === 0);
      sFindPolyBez(frontBez, rearBez, 0, rotPoly,
                   isCanon ? hiColor   : edgeColor,
                   isCanon ? hiLite    : edgeLite,
                   isCanon ? 1 : 0);
    }
  }
}

// ── sDraw(ctx, c) ─────────────────────────────────────────────────────────────
// Renders the complete S scene.  stack[] items: [mode, P, Q, color, fill]
// where P,Q are [x,y,z] unit-sphere vectors.

function sDraw(ctx, c) {
  var frontBez = [], rearBez = [];

  if (gridMode) sFillFD(frontBez, rearBez);

  // build bezier lists for all saved shapes
  stack.forEach(function(sh) {
    sFindBez(frontBez, rearBez, sh[0], sh[1], sh[2], sh[3], sh[4]);
  });

  // add preview shape if currently drawing
  if (sPosA3d.length > 0 && sPosB3d.length > 0) {
    sFindBez(frontBez, rearBez, mode, sPosA3d, sPosB3d, color, fill);
  }

  // draw rear hemisphere
  rearBez.forEach(function(bez) {
    ctx.beginPath();
    ctx.moveTo(bez[0], bez[1]);
    bez[2].forEach(function(seg) {
      ctx.bezierCurveTo(seg[0],seg[1],seg[2],seg[3],seg[4],seg[5]);
    });
    if (bez[4] === 0) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = bez[3];
      ctx.stroke();
    } else {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = bez[3];
      ctx.fill();
      ctx.restore();
    }
  });

  // sphere outline
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.arc(scrCenterX, scrCenterY, scrRadius, 0, 2*Math.PI);
  ctx.strokeStyle = "black";
  ctx.stroke();

  // draw front hemisphere on top of outline
  frontBez.forEach(function(bez) {
    ctx.beginPath();
    ctx.moveTo(bez[0], bez[1]);
    bez[2].forEach(function(seg) {
      ctx.bezierCurveTo(seg[0],seg[1],seg[2],seg[3],seg[4],seg[5]);
    });
    if (bez[4] === 0) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = bez[3];
      ctx.stroke();
    } else {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = bez[3];
      ctx.fill();
      ctx.restore();
    }
  });
}

// ── S mouse handlers ───────────────────────────────────────────────────────────

var sPanPosA = null;
var sEditShapeIdx = -1, sEditPtIdx = -1;
var boxSize = 7;

function sMousePressed(sx, sy, shiftKey) {
  var pt3 = sScreen2vect(sx, sy, shiftKey);
  if (mode === -1) {
    sPanPosA = [sx, sy, shiftKey];
    sBackupStack    = stack.map(function(s){ return [s[0], s[1].slice(), s[2].slice(), s[3], s[4]]; });
    sBackupSymVects = sSymVects.map(function(v){ return v.slice(); });
    return;
  }
  if (mode === 0) {
    sEditShapeIdx = -1;
    for (var i = 0; i < stack.length; i++) {
      var sp = sVect2screen(stack[i][1]);
      var sq = sVect2screen(stack[i][2]);
      if (Math.abs(sx-sp[0]) < boxSize && Math.abs(sy-sp[1]) < boxSize) { sEditShapeIdx = i; sEditPtIdx = 1; break; }
      if (Math.abs(sx-sq[0]) < boxSize && Math.abs(sy-sq[1]) < boxSize) { sEditShapeIdx = i; sEditPtIdx = 2; break; }
    }
    return;
  }
  sPosA3d = pt3; sPosB3d = pt3;
  draw();
}

function sMouseMoved(sx, sy, shiftKey) {
  var pt3 = sScreen2vect(sx, sy, shiftKey);
  if (mode === -1 && sPanPosA) {
    var diff = [(sx - sPanPosA[0]) / scrRadius, -(sy - sPanPosA[1]) / scrRadius, 0];
    var len  = vectLeng(diff);
    if (len < 1e-10) return;
    var axis = cross(diff, [0,0,1]);
    var myMatrix = sRotMat(axis, -len);
    stack = sBackupStack.map(function(elem) {
      return [elem[0], multMatVect(myMatrix, elem[1]), multMatVect(myMatrix, elem[2]), elem[3], elem[4]];
    });
    sSymVects = sBackupSymVects.map(function(v){ return multMatVect(myMatrix, v); });
    draw();
    return;
  }
  if (mode === 0 && sEditShapeIdx >= 0) {
    stack[sEditShapeIdx][sEditPtIdx] = pt3;
    draw();
    return;
  }
  if (sPosA3d.length > 0) {
    sPosB3d = pt3;
    draw();
  }
}

function sMouseReleased(sx, sy, shiftKey) {
  var pt3 = sScreen2vect(sx, sy, shiftKey);
  if (mode === -1) { sPanPosA = null; return; }
  if (mode === 0)  { sEditShapeIdx = -1; draw(); return; }
  if (sPosA3d.length > 0) {
    sPosB3d = pt3;
    undoStack = [];
    stack.push([mode, sPosA3d.slice(), sPosB3d.slice(), color, fill]);
    sPosA3d = []; sPosB3d = [];
    draw();
  }
}
