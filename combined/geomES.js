// geomES.js — Euclidean and Spherical geometry for the combined orbifold app.

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

function dot(a, b)      { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function cross(a, b)    { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function vectSum(a, b)  { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function vectDiff(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function vectScale(a,s) { return [a[0]*s, a[1]*s, a[2]*s]; }
function vectLeng(a)    { return Math.sqrt(dot(a,a)); }
function sNormalize(a)  { return vectScale(a, 1/vectLeng(a)); }
function sReflect(n, v) { n = sNormalize(n); return vectSum(v, vectScale(n, -2*dot(n,v))); }

// Rodrigues rotation matrix stored row-major (multVectMat uses row-vector convention)
function sRotMat(axis, angle) {
  axis = sNormalize(axis);
  var c = Math.cos(angle), s = Math.sin(angle);
  var x = axis[0], y = axis[1], z = axis[2];
  return [c+x*x*(1-c),   x*y*(1-c)-z*s, x*z*(1-c)+y*s,
          y*x*(1-c)+z*s, c+y*y*(1-c),   y*z*(1-c)-x*s,
          z*x*(1-c)-y*s, z*y*(1-c)+x*s, c+z*z*(1-c)];
}

// row-vector convention: result = v * M
function multVectMat(v, m) {
  return [v[0]*m[0]+v[1]*m[3]+v[2]*m[6],
          v[0]*m[1]+v[1]*m[4]+v[2]*m[7],
          v[0]*m[2]+v[1]*m[5]+v[2]*m[8]];
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
        case 2:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.4*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.8*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.2*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.6*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.4*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.8*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.2*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.6*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 13: newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 14: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 15: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.4*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 16: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.8*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 17: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.2*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 18: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.6*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 19: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 20: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 21: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.4*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 22: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.8*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 23: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.2*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 24: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.6*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 2: // 532
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.4*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.8*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.2*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.6*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.4*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],0.8*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.2*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],1.6*Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[2],Math.PI)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 3: // *432
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI/2)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI/2)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI/2)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI/2)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 4: // 432
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI/2)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI/2)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6: newPt=multVectMat([x,y,z],sRotMat(sSymVects[0],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI/2)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 5: // *332
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=sReflect(sNormalize(sSymVects[3]),[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); newPt=sReflect(sNormalize(sSymVects[3]),newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 6: // 3*2
      switch(myMap) {
        case 1:  xOut=x; yOut=y; zOut=z; break;
        case 2:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4:  newPt=sReflect(sSymVects[0],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); newPt=sReflect(sSymVects[0],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); newPt=sReflect(sSymVects[0],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 7:  newPt=sReflect(sSymVects[1],[x,y,z]); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 8:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 9:  newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 10: newPt=sReflect(sSymVects[0],[x,y,z]); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 11: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); newPt=sReflect(sSymVects[0],newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 12: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); newPt=sReflect(sSymVects[0],newPt); newPt=sReflect(sSymVects[1],newPt); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
      } break;
    case 7: // 332
      switch(myMap) {
        case 1: xOut=x; yOut=y; zOut=z; break;
        case 2: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 3: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4: newPt=multVectMat([x,y,z],sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 5: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],2*Math.PI/3)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 6: newPt=multVectMat([x,y,z],sRotMat(sSymVects[2],4*Math.PI/3)); newPt=multVectMat(newPt,sRotMat(sSymVects[1],Math.PI)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
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
        case 3: newPt=sReflect(sSymVects[0],[x,y,z]); symRotAng=Math.PI/sMyRot; newPt=multVectMat(newPt,sRotMat(sSymVects[0],symRotAng)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
        case 4: newPt=sReflect(sSymVects[0],[x,y,z]); newPt=sReflect(sSymVects[1],newPt); symRotAng=Math.PI/sMyRot; newPt=multVectMat(newPt,sRotMat(sSymVects[0],symRotAng)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
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
        case 2: newPt=sReflect(sSymVects[0],[x,y,z]); symRotAng=Math.PI/sMyRot; newPt=multVectMat(newPt,sRotMat(sSymVects[0],symRotAng)); xOut=newPt[0]; yOut=newPt[1]; zOut=newPt[2]; break;
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
    if (lineMode === 2) maj = vectScale(maj, -1);
    var tanMajA = sNormalize(cross(maj, pvect));
    var tanMajB = vectScale(tanMajA, -1);
    var myAngA = Math.acos(Math.min(1, Math.max(-1, dot(maj, A))));
    var myAngB = Math.acos(Math.min(1, Math.max(-1, dot(maj, B))));
    var k2A = 0.011 + 0.276*myAngA + 0.0436*myAngA*myAngA;
    var k2B = 0.011 + 0.276*myAngB + 0.0436*myAngB*myAngB;
    var midA     = vectSum(A, vectScale(tanA, k2A));
    var midB     = vectSum(B, vectScale(tanB, k2B));
    var midMajA  = vectSum(maj, vectScale(tanMajA, k2A));
    var midMajB  = vectSum(maj, vectScale(tanMajB, k2B));
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
    var midA = vectSum(A, vectScale(tanA, k2));
    var midB = vectSum(B, vectScale(tanB, k2));
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
    if (lineMode === 2) maj = vectScale(maj, -1);
    var tanMajA = sNormalize(cross(maj, pvect));
    var tanMajB = vectScale(tanMajA, -1);
    var myAngA = Math.acos(Math.min(1, Math.max(-1, dot(maj, A))));
    var myAngB = Math.acos(Math.min(1, Math.max(-1, dot(maj, B))));
    var k2A = 0.011 + 0.276*myAngA + 0.0436*myAngA*myAngA;
    var k2B = 0.011 + 0.276*myAngB + 0.0436*myAngB*myAngB;
    var midA    = vectSum(A,   vectScale(tanA,    k2A));
    var midB    = vectSum(B,   vectScale(tanB,    k2B));
    var midMajA = vectSum(maj, vectScale(tanMajA, k2A));
    var midMajB = vectSum(maj, vectScale(tanMajB, k2B));
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
    var midA = vectSum(A, vectScale(tanA, k2));
    var midB = vectSum(B, vectScale(tanB, k2));
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
        var AA = multVectMat(A3, curMat);
        var BB = multVectMat(B3, curMat);
        sFindLineBez(frontBez, rearBez, AA, BB, myColor, myColorLite);
      }
    }
  }
  if (myMode > 2) { // polygon: P=center axis, Q=first vertex
    var angleStep = 2*Math.PI / myMode;
    var myPoly = [];
    for (var k = 0; k < myMode; k++) {
      myPoly.push(multVectMat(Q, sRotMat(P, angleStep*k)));
    }
    for (var map = 1; map <= sNumMaps; map++) {
      var mapPoly = myPoly.map(function(v){ return sMapOne(map, v[0], v[1], v[2]); });
      var symRotAng = 2*Math.PI / sMyRot;
      for (var i = 0; i < sMyRot; i++) {
        var curMat = sRotMat(sSymVects[0], symRotAng*i);
        var rotPoly = mapPoly.map(function(v){ return multVectMat(v, curMat); });
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
  var S  = vectScale(N, -1);
  // E0: equator point. Use s1 if available, else project [1,0,0] perp to N.
  var E0;
  if (s1) {
    E0 = s1;
  } else {
    var ref = (Math.abs(dot(s0, [1,0,0])) < 0.9) ? [1,0,0] : [0,0,1];
    E0 = sNormalize(vectDiff(ref, vectScale(s0, dot(s0, ref))));
  }
  var Ehn = multVectMat(E0, sRotMat(N, pi/n));
  var E2n = multVectMat(E0, sRotMat(N, 2*pi/n));
  switch (sOrbi) {
    case 0: { // *532: s0=5-fold, normalize(sv[2])=2-fold edge midpoint, C=3-fold face center
      var phi2 = (3+Math.sqrt(5))/2;  // φ² = φ+1 ≈ 2.618
      var e2 = sNormalize(sSymVects[2]);
      var C532 = sNormalize(vectSum(s1, vectScale(e2, phi2)));
      return [s0, e2, C532];
    }
    case 1: { // 532 — kite of two *532 triangles
      var phi2 = (3+Math.sqrt(5))/2;
      var e2 = sNormalize(sSymVects[2]);
      var C532  = sNormalize(vectSum(s1,               vectScale(e2, phi2)));
      var C532p = sNormalize(vectSum(vectScale(s1, -1), vectScale(e2, phi2)));
      return [C532, s0, C532p, e2];
    }
    case 2: { // *432: s0=4-fold pole, s1=2nd axis; nsX=[0,0,1] initially
      var nsX = vectScale(sX, -1);
      return [s0,
              sNormalize(vectSum(s0, nsX)),
              sNormalize(vectSum(vectSum(s0, s1), nsX))];
    }
    case 3: { // 432 — kite of two *432 triangles
      var nsX = vectScale(sX, -1);
      return [sNormalize(vectSum(vectSum(s0, s1), nsX)),
              s0,
              sNormalize(vectSum(vectDiff(s0, s1), nsX)),
              sNormalize(vectSum(s0, nsX))];
    }
    case 4: { // *332: sv[0,1,2,3] = [0,1,0],[1,0,0],[1,1,1],[0,1,1]
      // normalize(2*sv[0]+sv[1]-sv[3]) = normalize([1,1,-1])
      return [sNormalize(vectSum(vectSum(vectScale(sSymVects[0],2), sSymVects[1]),
                                 vectScale(sSymVects[3],-1))),
              s1,
              sNormalize(sSymVects[2])];
    }
    case 5: { // 3*2 — *432 triangle reflected across its x=z side
      // vertices: norm([0,1,1]), [0,1,0] (2-fold corner), norm([1,1,0]), norm([1,1,1])
      var nsX = vectScale(sX, -1);
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
      var rotPoly = mapped.map(function(v){ return multVectMat(v, curMat); });
      var isCanon = (map === 1 && i === 0);
      sFindPolyBez(frontBez, rearBez, 0, rotPoly,
                   isCanon ? hiColor   : edgeColor,
                   isCanon ? hiLite    : edgeLite,
                   isCanon ? 1 : 0);
    }
  }
}

// ── drawS(ctx, c) ─────────────────────────────────────────────────────────────
// Renders the complete S scene.  stack[] items: [mode, P, Q, color, fill]
// where P,Q are [x,y,z] unit-sphere vectors.

function drawS(ctx, c) {
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

  // draw front hemisphere
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

// ═══════════════════════════════════════════════════════════════════════════════
// E (Euclidean) geometry
// ═══════════════════════════════════════════════════════════════════════════════

// ── E state ───────────────────────────────────────────────────────────────────
// With R=1, W=H=W2=0.5.  TranA/B are lattice vectors; TranOrig is the FD origin.

var eOrbi    = 13;
var eNumMaps = 8;
var eTranAx  = 2,   eTranAy = 0;
var eTranBx  = 0,   eTranBy = 2;
var eTranOrigx = 1, eTranOrigy = 1;
var eScale   = 100;   // pixels per unit length
var eTransX  = 0;     // screen X of native origin (set by init/resize)
var eTransY  = 0;     // screen Y of native origin
var ePosA    = null;  // native [x,y] at press
var ePosB    = null;  // native [x,y] at current cursor

// ── E coordinate conversion ───────────────────────────────────────────────────

function ePt2Screen(x, y) {
  return [eTransX + x * eScale, eTransY - y * eScale];
}
function eScreen2Pt(sx, sy) {
  return [(sx - eTransX) / eScale, (eTransY - sy) / eScale];
}

// ── E group setup ─────────────────────────────────────────────────────────────

function eSetGroup(idx) {
  eOrbi = idx;
  var s3h = 0.8660254037844386; // sqrt(3)/2
  var s3  = 1.7320508075688772; // sqrt(3)
  switch (idx) {
    case 0:  // *442  p4m
      eTranAx=2; eTranAy=0; eTranBx=0; eTranBy=2;
      eTranOrigx=1; eTranOrigy=1; eNumMaps=8; break;
    case 1:  // 442   p4
      eTranAx=2; eTranAy=0; eTranBx=0; eTranBy=2;
      eTranOrigx=1; eTranOrigy=1; eNumMaps=4; break;
    case 2:  // 4*2   p4g
      eTranAx=1; eTranAy=-1; eTranBx=1; eTranBy=1;
      eTranOrigx=1.5; eTranOrigy=1.5; eNumMaps=8; break;
    case 3:  // *632  p6m
      eTranAx=1.5; eTranAy=s3h; eTranBx=0; eTranBy=s3;
      eTranOrigx=1.5; eTranOrigy=s3h; eNumMaps=12; break;
    case 4:  // *333  p3m1
      eTranAx=1.5; eTranAy=s3h; eTranBx=0; eTranBy=s3;
      eTranOrigx=1; eTranOrigy=0; eNumMaps=6; break;
    case 5:  // 632   p6
      eTranAx=1.5; eTranAy=s3h; eTranBx=0; eTranBy=s3;
      eTranOrigx=1.5; eTranOrigy=s3h; eNumMaps=6; break;
    case 6:  // 333   p3
      eTranAx=1.5; eTranAy=s3h; eTranBx=0; eTranBy=s3;
      eTranOrigx=1; eTranOrigy=0; eNumMaps=3; break;
    case 7:  // 3*3   p31m
      eTranAx=1.5; eTranAy=s3h; eTranBx=0; eTranBy=s3;
      eTranOrigx=1; eTranOrigy=0; eNumMaps=6; break;
    case 8:  // 22×   pmg   (W=H=0.5)
      eTranAx=1; eTranAy=0; eTranBx=0; eTranBy=1;
      eTranOrigx=0.5; eTranOrigy=0.5; eNumMaps=4; break;
    case 9:  // *2222 pmm
      eTranAx=1; eTranAy=0; eTranBx=0; eTranBy=1;
      eTranOrigx=0.5; eTranOrigy=0.5; eNumMaps=4; break;
    case 10: // 22*   cmm   (TranAx=2W=1)
      eTranAx=2; eTranAy=0; eTranBx=0; eTranBy=1;
      eTranOrigx=1; eTranOrigy=0.5; eNumMaps=4; break;
    case 11: // **    pm
      eTranAx=1; eTranAy=0; eTranBx=0; eTranBy=1;
      eTranOrigx=0.5; eTranOrigy=0.5; eNumMaps=2; break;
    case 12: // ××    pg
      eTranAx=1; eTranAy=0; eTranBx=0; eTranBy=1;
      eTranOrigx=0.5; eTranOrigy=0.5; eNumMaps=2; break;
    case 13: // 2*22  cmm  (unit cell 2×2, FD = right triangle area 1)
      eTranAx=2; eTranAy=0; eTranBx=0; eTranBy=2;
      eTranOrigx=1; eTranOrigy=1; eNumMaps=4; break;
    case 14: // *×    cm    (W=H=0.5)
      eTranAx=0.5; eTranAy=-1; eTranBx=0.5; eTranBy=1;
      eTranOrigx=0.5; eTranOrigy=1.5; eNumMaps=2; break;
    case 15: // 2222  p2    (W=W2=0.5 → TranAx=1, TranBx=0)
      eTranAx=1; eTranAy=0; eTranBx=0; eTranBy=1;
      eTranOrigx=0.5; eTranOrigy=0.5; eNumMaps=2; break;
    case 16: // ○     p1
      eTranAx=1; eTranAy=0; eTranBx=0; eTranBy=1;
      eTranOrigx=0.5; eTranOrigy=0.5; eNumMaps=1; break;
  }
  eDragHandle = null;
}

// ── E Map Data ────────────────────────────────────────────────────────────────
// Each row: [m00,m01,m10,m11, a,b]
//   output = [[m00,m01],[m10,m11]] * input  +  a*A + b*B
// where A=(eTranAx,eTranAy), B=(eTranBx,eTranBy).

var _eH = 0.8660254037844386; // sqrt(3)/2

// ── E tiling maps (BFS from genMats, mirroring H buildNeighborMats) ──────────────────
//
// eComputeMaps() generates all eNumMaps isometries that tile one unit cell.
// It uses eGenMats() as generators and expands by BFS, keeping only maps whose
// transformed FD centroid is distinct modulo the lattice (A, B).

function eComputeMaps() {
  var gens  = eGenMats();
  var verts = eFDVerts();
  var I     = [[1,0,0],[0,1,0],[0,0,1]];

  // Asymmetric interior probe point: prime-weighted vertex average.
  // Simple centroid fails when it lands on a mirror axis (e.g. *442 centroid
  // sits on y=x), causing reflections across that axis to look like duplicates.
  var primes = [2, 3, 5, 7, 11, 13];
  var cx = 0, cy = 0, tw = 0;
  for (var i = 0; i < verts.length; i++) {
    var w = primes[i % primes.length];
    cx += w*verts[i][0];  cy += w*verts[i][1];  tw += w;
  }
  cx /= tw;  cy /= tw;

  var det = eTranAx*eTranBy - eTranAy*eTranBx;  // det(A | B)

  // Return true if world point (px,py) has NOT been seen yet mod lattice
  function isNew(px, py) {
    for (var k = 0; k < cents.length; k++) {
      var dx = px - cents[k][0],  dy = py - cents[k][1];
      var fi = (dx*eTranBy - dy*eTranBx) / det;   // lattice coord i
      var fj = (dy*eTranAx - dx*eTranAy) / det;   // lattice coord j
      if (Math.abs(fi - Math.round(fi)) < 0.001 &&
          Math.abs(fj - Math.round(fj)) < 0.001) return false;
    }
    return true;
  }

  var mats  = [I];
  var cents = [[cx, cy]];
  var qi    = 0;

  while (qi < mats.length) {
    var M = mats[qi++];
    for (var g = 0; g < gens.length; g++) {
      var N  = multMatMat(gens[g], M);
      var pc = eApplyMat(N, [cx, cy]);
      if (isNew(pc[0], pc[1])) {
        mats.push(N);
        cents.push([pc[0], pc[1]]);
        if (mats.length === eNumMaps) return mats;
      }
    }
  }
  return mats;
}

// Cached maps — recomputed whenever group or lattice changes
var _eMaps = null, _eMapOrbi = -1,
    _eMapAx, _eMapAy, _eMapBx, _eMapBy;

function eGetMaps() {
  if (_eMaps === null || eOrbi !== _eMapOrbi ||
      eTranAx !== _eMapAx || eTranAy !== _eMapAy ||
      eTranBx !== _eMapBx || eTranBy !== _eMapBy) {
    _eMaps    = eComputeMaps();
    _eMapOrbi = eOrbi;
    _eMapAx = eTranAx;  _eMapAy = eTranAy;
    _eMapBx = eTranBx;  _eMapBy = eTranBy;
  }
  return _eMaps;
}

function eMapOne(myMap, orbi, x, y) {
  return eApplyMat(eGetMaps()[myMap - 1], [x, y]);
}

// ── E lattice handle drag ─────────────────────────────────────────────────────

var eDragHandle = null; // null | 'A' | 'B'

function eHasHandleB(orbi) {
  return eConstraint[orbi] === 'rc' || eConstraint[orbi] === 'ob';
}

function eApplyConstraintA(ax, ay) {
  var c = eConstraint[eOrbi];
  var oldBLen = Math.sqrt(eTranBx*eTranBx + eTranBy*eTranBy);
  var newALen = Math.sqrt(ax*ax + ay*ay);
  eTranAx = ax; eTranAy = ay;
  if      (c === 'sq') { eTranBx = -ay;             eTranBy = ax; }
  else if (c === 'hx') { eTranBx = .5*ax - _eH*ay;  eTranBy = _eH*ax + .5*ay; }
  else if (c === 'rc') {
    if (newALen < 1e-6) return;
    eTranBx = -ay * oldBLen / newALen;
    eTranBy =  ax * oldBLen / newALen;
  }
  else if (c === 'rh') { eTranBx = ax; eTranBy = -ay; }
  // 'ob': B unchanged
}

function eApplyConstraintB(bx, by) {
  if (eConstraint[eOrbi] === 'rc') {
    var a2 = eTranAx*eTranAx + eTranAy*eTranAy;
    if (a2 < 1e-12) return;
    var t = (-bx*eTranAy + by*eTranAx) / a2;
    eTranBx = -eTranAy * t;
    eTranBy =  eTranAx * t;
  } else {
    eTranBx = bx; eTranBy = by;
  }
}

// ── E isometry helpers (3×3 homogeneous matrices) ─────────────────────────────

function eApplyMat(M, p) {
  return [M[0][0]*p[0] + M[0][1]*p[1] + M[0][2],
          M[1][0]*p[0] + M[1][1]*p[1] + M[1][2]];
}

// Orientation-preserving isometry mapping segment P→Q onto R→S
function eIsomSeg2Seg(P, Q, R, S) {
  var dx = Q[0]-P[0], dy = Q[1]-P[1];
  var ex = S[0]-R[0], ey = S[1]-R[1];
  var len2 = dx*dx + dy*dy;
  var cosT = (dx*ex + dy*ey) / len2;
  var sinT = (dx*ey - dy*ex) / len2;
  var tx = R[0] - cosT*P[0] + sinT*P[1];
  var ty = R[1] - sinT*P[0] - cosT*P[1];
  return [[cosT,-sinT,tx],[sinT,cosT,ty],[0,0,1]];
}

// Orientation-reversing isometry (glide-reflection) mapping P→Q onto R→S
function eIsomSeg2SegFlip(P, Q, R, S) {
  var dx = Q[0]-P[0], dy = Q[1]-P[1];
  var ex = S[0]-R[0], ey = S[1]-R[1];
  var uLen = Math.sqrt(dx*dx+dy*dy), vLen = Math.sqrt(ex*ex+ey*ey);
  var ux = dx/uLen, uy = dy/uLen, vx = ex/vLen, vy = ey/vLen;
  var m00 = vx*ux - vy*uy,  m01 = vy*ux + vx*uy;
  var tx  = R[0] - m00*P[0] - m01*P[1];
  var ty  = R[1] - m01*P[0] + m00*P[1];
  return [[m00,m01,tx],[m01,-m00,ty],[0,0,1]];
}

// Reflection across line through P and Q
function eReflLineMat(P, Q) {
  var ddx = Q[0]-P[0], ddy = Q[1]-P[1];
  var len = Math.sqrt(ddx*ddx + ddy*ddy);
  var dx = ddx/len, dy = ddy/len;
  var m00 = 2*dx*dx-1, m01 = 2*dx*dy;
  var cross = P[0]*dy - P[1]*dx;
  return [[m00,m01, 2*dy*cross],
          [m01,-m00,-2*dx*cross],
          [0,  0,   1]];
}

// Generator matrices: one per FD edge, maps canonical FD to that neighbor
function eGenMats() {
  var v = eFDVerts();
  var v0=v[0], v1=v[1], v2=v[2], v3=v[3];
  switch (eOrbi) {
    case 0:  // *442 – all mirrors
      return [eReflLineMat(v0,v1), eReflLineMat(v1,v2), eReflLineMat(v2,v0)];
    case 1:  // 442 – 4-fold rotations at corners
      return [eIsomSeg2Seg(v0,v3,v0,v1), eIsomSeg2Seg(v3,v2,v1,v2),
              eIsomSeg2Seg(v2,v1,v2,v3), eIsomSeg2Seg(v1,v0,v3,v0)];
    case 2:  // 4*2
      return [eIsomSeg2Seg(v0,v2,v0,v1), eReflLineMat(v1,v2),
              eIsomSeg2Seg(v1,v0,v2,v0)];
    case 3:  // *632 – all mirrors
      return [eReflLineMat(v0,v1), eReflLineMat(v1,v2), eReflLineMat(v2,v0)];
    case 4:  // *333 – all mirrors
      return [eReflLineMat(v0,v1), eReflLineMat(v1,v2), eReflLineMat(v2,v0)];
    case 5:  // 632 – same structure as 4*2
      return [eIsomSeg2Seg(v0,v2,v0,v1), eReflLineMat(v1,v2),
              eIsomSeg2Seg(v1,v0,v2,v0)];
    case 6:  // 333 – quadrilateral, 3-fold rotations
      return [eIsomSeg2Seg(v2,v1,v0,v1), eIsomSeg2Seg(v1,v0,v1,v2),
              eIsomSeg2Seg(v0,v3,v2,v3), eIsomSeg2Seg(v3,v2,v3,v0)];
    case 7:  // 3*3 – same structure as 4*2
      return [eIsomSeg2Seg(v0,v2,v0,v1), eReflLineMat(v1,v2),
              eIsomSeg2Seg(v1,v0,v2,v0)];
    case 8:  // 22× – all glide-reflections
      return [eIsomSeg2SegFlip(v2,v3,v0,v1), eIsomSeg2SegFlip(v3,v0,v1,v2),
              eIsomSeg2SegFlip(v0,v1,v2,v3), eIsomSeg2SegFlip(v1,v2,v3,v0)];
    case 9:  // *2222 – all mirrors
      return [eReflLineMat(v0,v1), eReflLineMat(v1,v2),
              eReflLineMat(v2,v3), eReflLineMat(v3,v0)];
    case 10: // 22* – 2 mirrors + 2 half-turns
      return [eReflLineMat(v0,v1), eIsomSeg2Seg(v2,v1,v1,v2),
              eReflLineMat(v2,v3), eIsomSeg2Seg(v0,v3,v3,v0)];
    case 11: // ** – 2 mirrors + 2 translations
      return [eIsomSeg2Seg(v3,v2,v0,v1), eReflLineMat(v1,v2),
              eIsomSeg2Seg(v1,v0,v2,v3), eReflLineMat(v3,v0)];
    case 12: // ×× – 2 glides + 2 translations
      return [eIsomSeg2SegFlip(v2,v3,v0,v1), eIsomSeg2Seg(v0,v3,v1,v2),
              eIsomSeg2SegFlip(v0,v1,v2,v3), eIsomSeg2Seg(v2,v1,v3,v0)];
    case 13: // 2*22 – mirrors on legs (v0v1, v2v0) + half-turn on hypotenuse (v1v2)
      return [eReflLineMat(v0,v1), eIsomSeg2Seg(v1,v2,v2,v1),
              eReflLineMat(v2,v0)];
    case 14: // *× – glide maps leg v2v0 → v0v1, and leg v0v1 → v2v0
      return [eIsomSeg2Seg(v2,v0,v0,v1), eReflLineMat(v1,v2),
              eIsomSeg2Seg(v0,v1,v2,v0)];
    case 15: // 2222 – 4 half-turns at edge midpoints
      return [eIsomSeg2Seg(v1,v0,v0,v1), eIsomSeg2Seg(v0,v3,v1,v2),
              eIsomSeg2Seg(v3,v2,v2,v3), eIsomSeg2Seg(v2,v1,v3,v0)];
    case 16: // ○ – 4 pure translations
      return [eIsomSeg2Seg(v3,v2,v0,v1), eIsomSeg2Seg(v0,v3,v1,v2),
              eIsomSeg2Seg(v1,v0,v2,v3), eIsomSeg2Seg(v2,v1,v3,v0)];
    default: return [];
  }
}

// ── E drawing ─────────────────────────────────────────────────────────────────

// Draws one shape (line or polygon) with all its symmetry copies + lattice tiles.
function eDrawShape(ctx, mode, P, Q, color, myFill) {
  var w = ctx.canvas.width, h = ctx.canvas.height;
  // approximate range of lattice indices needed
  var range = Math.ceil(Math.max(w, h) / eScale / Math.min(Math.abs(eTranAx)||1, Math.abs(eTranBy)||1)) + 4;

  for (var map = 1; map <= eNumMaps; map++) {
    var mp = eMapOne(map, eOrbi, P[0], P[1]);
    var mq = eMapOne(map, eOrbi, Q[0], Q[1]);
    for (var ii = -range; ii <= range; ii++) {
      for (var jj = -range; jj <= range; jj++) {
        var dx = ii*eTranAx + jj*eTranBx;
        var dy = ii*eTranAy + jj*eTranBy;
        var sp = ePt2Screen(mp[0]+dx, mp[1]+dy);
        var sq = ePt2Screen(mq[0]+dx, mq[1]+dy);
        // coarse clip: skip if both endpoints far off canvas
        if (sp[0] < -200 && sq[0] < -200) continue;
        if (sp[0] > w+200 && sq[0] > w+200) continue;
        if (sp[1] < -200 && sq[1] < -200) continue;
        if (sp[1] > h+200 && sq[1] > h+200) continue;

        if (mode === 1) { // line
          ctx.beginPath();
          ctx.moveTo(sp[0], sp[1]);
          ctx.lineTo(sq[0], sq[1]);
          ctx.strokeStyle = color;
          ctx.stroke();
        } else if (mode > 2) { // polygon: P=center, Q=first vertex
          var angleStep = 2*Math.PI / mode;
          var pcx = sp[0], pcy = sp[1]; // mapped/translated center
          var pvx = sq[0]-sp[0], pvy = sq[1]-sp[1]; // first vertex relative to center
          ctx.beginPath();
          for (var k = 0; k < mode; k++) {
            var cx = Math.cos(k*angleStep), sx2 = Math.sin(k*angleStep);
            var vx = cx*pvx - sx2*pvy + pcx;
            var vy = cx*pvy + sx2*pvx + pcy;
            if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
          }
          ctx.closePath();
          if (myFill === 0) {
            ctx.strokeStyle = color;
            ctx.stroke();
          } else {
            ctx.fillStyle = color;
            ctx.fill();
          }
        }
      }
    }
  }
}

// Draw the lattice grid (parallelogram cells)
function eDrawGrid(ctx) {
  var w = ctx.canvas.width, h = ctx.canvas.height;
  var range = Math.ceil(Math.max(w, h) / eScale / Math.min(Math.abs(eTranAx)||1, Math.abs(eTranBy)||1)) + 4;
  ctx.beginPath();
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  for (var ii = -range; ii <= range+1; ii++) {
    for (var jj = -range; jj <= range; jj++) {
      // A-direction lines
      var p0 = ePt2Screen(ii*eTranAx + jj*eTranBx, ii*eTranAy + jj*eTranBy);
      var p1 = ePt2Screen((ii+1)*eTranAx + jj*eTranBx, (ii+1)*eTranAy + jj*eTranBy);
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
    }
    for (var jj = -range; jj <= range; jj++) {
      // B-direction lines
      var p0 = ePt2Screen(ii*eTranAx + jj*eTranBx, ii*eTranAy + jj*eTranBy);
      var p1 = ePt2Screen(ii*eTranAx + (jj+1)*eTranBx, ii*eTranAy + (jj+1)*eTranBy);
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
    }
  }
  ctx.stroke();
}

// ── E Fundamental Domain ──────────────────────────────────────────────────────

// Lattice constraint type per group (controls how dragging A or B handle is constrained).
var eConstraint = ['sq','sq','sq','hx','hx','hx','hx','hx',
                   'rc','rc','rc','rc','rc','sq','rh','ob','ob'];

// Lattice-fraction coordinates for each FD vertex.
// Vertex world position = f[0]*A + f[1]*B  where A=(eTranAx,eTranAy), B=(eTranBx,eTranBy).
var eFDFracs = [
  [[0,0],[.5,0],[.5,.5]],                        // 0  *442
  [[0,0],[.5,0],[.5,.5],[0,.5]],                 // 1  442
  [[0,0],[.5,0],[0,.5]],                         // 2  4*2
  [[0,0],[.5,0],[2/3,-1/3]],                     // 3  *632
  [[0,0],[2/3,-1/3],[1/3,1/3]],                  // 4  *333
  [[0,0],[2/3,-1/3],[1/3,1/3]],                  // 5  632
  [[0,0],[2/3,-1/3],[1,0],[1/3,1/3]],            // 6  333
  [[0,0],[-1/3,2/3],[-1/3,-1/3]],               // 7  3*3
  [[0,0],[.5,0],[.5,.5],[0,.5]],                 // 8  22×
  [[0,0],[.5,0],[.5,.5],[0,.5]],                 // 9  *2222
  [[-.25,0],[.25,0],[.25,.5],[-.25,.5]],         // 10 22*
  [[0,0],[.5,0],[.5,1],[0,1]],                   // 11 **
  [[0,0],[1,0],[1,.5],[0,.5]],                   // 12 ××
  [[0,0],[1,0],[0,.5]],                          // 13 2*22  (v2 = B/2)
  [[0,0],[1,0],[0,1]],                           // 14 *×
  [[0,0],[1,0],[1,.5],[0,.5]],                   // 15 2222
  [[0,0],[1,0],[1,1],[0,1]]                      // 16 ○
];

function eFDVerts() {
  var fracs = eFDFracs[eOrbi] || eFDFracs[16];
  return fracs.map(function(f) {
    return [f[0]*eTranAx + f[1]*eTranBx, f[0]*eTranAy + f[1]*eTranBy];
  });
}

function eDrawFD(ctx) {
  var verts0 = eFDVerts();
  var mats = eGenMats();

  function drawPoly(pts, isCanon) {
    var sp = pts.map(function(p) { return ePt2Screen(p[0], p[1]); });
    ctx.beginPath();
    ctx.moveTo(sp[0][0], sp[0][1]);
    for (var k = 1; k < sp.length; k++) ctx.lineTo(sp[k][0], sp[k][1]);
    ctx.closePath();
    if (isCanon) {
      ctx.fillStyle = 'rgba(255,240,200,0.8)';
      ctx.fill();
      ctx.strokeStyle = '#aaa';
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#ccc';
      ctx.stroke();
    }
  }

  ctx.lineWidth = 0.5;
  drawPoly(verts0, true);
  for (var k = 0; k < mats.length; k++) {
    var M = mats[k];
    drawPoly(verts0.map(function(p) { return eApplyMat(M, p); }), false);
  }
}

// ── drawE(ctx, c) ─────────────────────────────────────────────────────────────
// Renders the complete E scene.  stack[] items: [mode, P, Q, color, fill]
// where P,Q are [x,y] native E coordinates.

function drawE(ctx, c) {
  if (gridMode) {
    eDrawFD(ctx);
    var _ha = ePt2Screen(eTranAx, eTranAy);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(_ha[0], _ha[1], 7, 0, 2*Math.PI);
    ctx.fillStyle = '#ffdc64'; ctx.fill();
    ctx.strokeStyle = '#888'; ctx.stroke();
    if (eHasHandleB(eOrbi)) {
      var _hb = ePt2Screen(eTranBx, eTranBy);
      ctx.beginPath(); ctx.arc(_hb[0], _hb[1], 7, 0, 2*Math.PI);
      ctx.fillStyle = '#aaddff'; ctx.fill();
      ctx.strokeStyle = '#888'; ctx.stroke();
    }
  }

  ctx.lineWidth = 1;
  stack.forEach(function(sh) {
    eDrawShape(ctx, sh[0], sh[1], sh[2], sh[3], sh[4]);
  });

  // preview current shape
  if (ePosA !== null && ePosB !== null) {
    eDrawShape(ctx, mode, ePosA, ePosB, color, fill);
  }

  // edit mode: show control points
  if (mode === 0) {
    var boxSize = 7;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    stack.forEach(function(sh) {
      var sp = ePt2Screen(sh[1][0], sh[1][1]);
      var sq = ePt2Screen(sh[2][0], sh[2][1]);
      ctx.beginPath();
      ctx.rect(sp[0]-boxSize, sp[1]-boxSize, 2*boxSize+1, 2*boxSize+1);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(sq[0]-boxSize, sq[1]-boxSize, 2*boxSize+1, 2*boxSize+1);
      ctx.stroke();
    });
  }
}
