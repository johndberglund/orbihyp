// main.js — Combined orbifold app: UI handlers, mouse events, draw dispatcher.
// Depends on geomH.js (loaded first, defines scrRadius/scrCenterX/scrCenterY)
// and geomES.js (E and S geometry).

// ── Shared state ─────────────────────────────────────────────────────────────
// NOTE: stack, undoStack are used by all three geometries.
// scrRadius, scrCenterX, scrCenterY are defined in geomH.js and shared with S.

var geom     = 'H';          // 'H' | 'E' | 'S'
var stack    = [];
var undoStack = [];
var mode     = 1;            // -1=pan, 0=edit, 1=line, >=3=polygon sides
var color    = "#000000";
var fill     = 0;
var gridMode = true;
var snapMode = false;
var morphMode = true;

// ── Vector, Matrix utilities ──────────────────────────────────────────────────────────

function dot(a, b)      { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function cross(a, b)    { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function vectSum(a, b)  { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function vectDiff(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function scalarVect(s, V) { return [V[0]*s, V[1]*s, V[2]*s]; }
function vectLeng(a)    { return Math.sqrt(dot(a,a)); }

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

function matDet(M) {
  return M[0][0]*(M[1][1]*M[2][2] - M[1][2]*M[2][1])
       - M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0])
       + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0]);
}

// ── Orbifold helpers ──────────────────────────────────────────────────────────

function computeChi(handle, crosscap, cone, kali) {
  var k = kali.length;
  var chi = 2 - 2*handle - crosscap - k;
  for (var i = 0; i < cone.length; i++) chi -= (1 - 1/cone[i]);
  for (var i = 0; i < kali.length; i++)
    for (var j = 0; j < kali[i].length; j++) chi -= (0.5 - 1/(2*kali[i][j]));
  return chi;
}

// Canonicalise for signature matching: sort cone desc, sort each kali component
// desc, sort kali array of arrays desc-lexicographically.
function _canonOrbi(cone, kali) {
  var c = cone.slice().sort(function(a,b){return b-a;});
  var k = kali.map(function(a){return a.slice().sort(function(x,y){return y-x;});});
  k.sort(function(a,b){
    for (var i=0; i<Math.min(a.length,b.length); i++) { if(b[i]!==a[i]) return b[i]-a[i]; }
    return b.length-a.length;
  });
  return {c:c, k:k, cs:JSON.stringify(c), ks:JSON.stringify(k)};
}

// Returns eSetGroup index 0-16, or -1 if not recognised.
function orbi2EGroup(handle, crosscap, cone, kali) {
  var o = _canonOrbi(cone, kali);
  var cs=o.cs, ks=o.ks;
  if (handle===0 && crosscap===0 && cs==='[]'         && ks==='[[6,3,2]]')    return 0;  // p6m *632
  if (handle===0 && crosscap===0 && cs==='[6,3,2]'    && ks==='[]')           return 1;  // p6  632
  if (handle===0 && crosscap===0 && cs==='[]'         && ks==='[[4,4,2]]')    return 2;  // p4m *442
  if (handle===0 && crosscap===0 && cs==='[4,4,2]'    && ks==='[]')           return 3;  // p4  442
  if (handle===0 && crosscap===0 && cs==='[4]'        && ks==='[[2]]')        return 4;  // p4g 4*2
  if (handle===0 && crosscap===0 && cs==='[]'         && ks==='[[3,3,3]]')    return 5;  // p3m1 *333
  if (handle===0 && crosscap===0 && cs==='[3,3,3]'    && ks==='[]')           return 6;  // p3  333
  if (handle===0 && crosscap===0 && cs==='[3]'        && ks==='[[3]]')        return 7;  // p31m 3*3
  if (handle===0 && crosscap===0 && cs==='[]'         && ks==='[[2,2,2,2]]')  return 8;  // pmm *2222
  if (handle===0 && crosscap===0 && cs==='[2]'        && ks==='[[2,2]]')      return 9; // cmm 2*22
  if (handle===0 && crosscap===0 && cs==='[2,2]'      && ks==='[[]]')         return 10; // pmg 22*
  if (handle===0 && crosscap===1 && cs==='[2,2]'      && ks==='[]')           return 11;  // pgg 22×
  if (handle===0 && crosscap===0 && cs==='[2,2,2,2]'  && ks==='[]')           return 12; // p2 2222
  if (handle===0 && crosscap===0 && cs==='[]'         && ks==='[[],[]]')      return 13; // pm **
  if (handle===0 && crosscap===1 && cs==='[]'         && ks==='[[]]')         return 14; // cm *×
  if (handle===0 && crosscap===2 && cs==='[]'         && ks==='[]')           return 15; // pg ××
  if (handle===1 && crosscap===0 && cs==='[]'         && ks==='[]')           return 16; // p1 o
  return -1;
}

// Returns {idx, n} for sSetOrb, or null if not recognised.
function orbi2SGroup(handle, crosscap, cone, kali) {
  if (handle !== 0) return null;
  var o = _canonOrbi(cone, kali);
  var c=o.c, k=o.k, cs=o.cs, ks=o.ks;
  // Fixed Platonic groups
  if (crosscap===0 && cs==='[]'       && ks==='[[5,3,2]]') return {idx:0, n:5};  // *532
  if (crosscap===0 && cs==='[5,3,2]'  && ks==='[]')        return {idx:1, n:5};  // 532
  if (crosscap===0 && cs==='[]'       && ks==='[[4,3,2]]') return {idx:2, n:4};  // *432
  if (crosscap===0 && cs==='[4,3,2]'  && ks==='[]')        return {idx:3, n:4};  // 432
  if (crosscap===0 && cs==='[]'       && ks==='[[3,3,2]]') return {idx:4, n:3};  // *332
  if (crosscap===0 && cs==='[3]'      && ks==='[[2]]')     return {idx:5, n:3};  // 3*2
  if (crosscap===0 && cs==='[3,3,2]'  && ks==='[]')        return {idx:6, n:3};  // 332
  // Variable-n groups
  // *22n: kali=[[n,2,2]], exactly two 2s among 3 corners
  if (crosscap===0 && c.length===0 && k.length===1 && k[0].length===3
      && k[0][1]===2 && k[0][2]===2) return {idx:7, n:k[0][0]};
  // 2*n: cone=[2], kali=[[n]]
  if (crosscap===0 && c.length===1 && c[0]===2 && k.length===1 && k[0].length===1)
    return {idx:8, n:k[0][0]};
  // 22n: cone=[n,2,2], exactly two 2s
  if (crosscap===0 && c.length===3 && k.length===0 && c[1]===2 && c[2]===2)
    return {idx:9, n:c[0]};
  // n*: cone=[n], kali=[[]]
  if (crosscap===0 && c.length===1 && k.length===1 && k[0].length===0)
    return {idx:10, n:c[0]};
  // n×: cone=[n], crosscap=1
  if (crosscap===1 && c.length===1 && k.length===0)
    return {idx:11, n:c[0]};
  // *nn: kali=[[n,n]]
  if (crosscap===0 && c.length===0 && k.length===1 && k[0].length===2 && k[0][0]===k[0][1])
    return {idx:12, n:k[0][0]};
  // nn: cone=[n,n]
  if (crosscap===0 && c.length===2 && c[0]===c[1] && k.length===0)
    return {idx:13, n:c[0]};
  return null;
}

// ── init / resize ─────────────────────────────────────────────────────────────

function init() {
  var c = document.getElementById("myCanvas");
  var d = document.getElementById("canvasDiv");
  var navH = document.querySelector("nav").offsetHeight || 30;
  var ctrlW = 163; // controls div: 155px + 2×4px padding
  d.style.height = (window.innerHeight - navH) + "px";
  c.height = window.innerHeight - navH - 6; // 6 = 2×3px border
  c.width  = window.innerWidth  - ctrlW - 6;

  // Shared display centre (used by H Poincaré disk and S sphere projection)
  scrCenterX = Math.round(c.width  / 2);
  scrCenterY = Math.round(c.height / 2);
  scrRadius  = Math.round(Math.min(c.width, c.height) * 0.42);

  // Centre E native origin
  eTransX = Math.round(c.width  / 2);
  eTransY = Math.round(c.height / 2);

  // Initial rebuild
  reDo();

  document.onkeyup = function(e) {
    var k = e.which || e.keyCode;
    if (e.ctrlKey && k === 90) stackUndo();
    if (e.ctrlKey && k === 89) stackRedo();
  };

  draw();
}

function resize() {
  var c = document.getElementById("myCanvas");
  var d = document.getElementById("canvasDiv");
  var navH = document.querySelector("nav").offsetHeight || 30;
  var ctrlW = 163;
  d.style.height = (window.innerHeight - navH) + "px";
  c.height = window.innerHeight - navH - 6;
  c.width  = window.innerWidth  - ctrlW - 6;
  scrCenterX = Math.round(c.width  / 2);
  scrCenterY = Math.round(c.height / 2);
  scrRadius  = Math.round(Math.min(c.width, c.height) * 0.42);
  draw();
}

// ── draw dispatcher ───────────────────────────────────────────────────────────

function draw() {
  var c   = document.getElementById("myCanvas");
  var ctx = c.getContext("2d");
  ctx.beginPath();
  ctx.rect(0, 0, c.width, c.height);
  ctx.fillStyle = "white";
  ctx.fill();

  if      (geom === 'H') hDraw(ctx, c);
  else if (geom === 'E') eDraw(ctx, c);
  else if (geom === 'S') sDraw(ctx, c);

  // Canvas label — top-left: geometry name + Conway notation
  try {
    var lblH = Number(document.getElementById("handle").value);
    var lblC = Number(document.getElementById("crosscap").value);
    var lblCone = JSON.parse(document.getElementById("cone").value);
    var lblKali = JSON.parse(document.getElementById("kali").value);
    var gName = geom === 'H' ? "Hyperbolic" : geom === 'E' ? "Euclidean" : "Spherical";
    var lbl = gName + "  " + orbi2String(lblH, lblC, lblCone, lblKali);
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText(lbl, 8, 20);
  } catch(e) {}
}


// ── Rebuild from orbifold inputs ──────────────────────────────────────────────

function reDo() {
  var handle   = Number(document.getElementById("handle").value);
  var crosscap = Number(document.getElementById("crosscap").value);
  var cone, kali;
  try { cone = JSON.parse(document.getElementById("cone").value); } catch(e) { return; }
  try { kali = JSON.parse(document.getElementById("kali").value); } catch(e) { return; }

  if (!morphMode) { stack = []; undoStack = []; }

  var prevGeom = geom;
  var chi = computeChi(handle, crosscap, cone, kali);
  var EPS = 1e-9;

  if (Math.abs(chi) < EPS) {
    var idx = orbi2EGroup(handle, crosscap, cone, kali);
    if (idx >= 0) { geom = 'E'; eSetGroup(idx); }
  } else if (chi > EPS) {
    var sg = orbi2SGroup(handle, crosscap, cone, kali);
    if (sg) { geom = 'S'; sSetOrb(sg.idx, sg.n); }
  } else {
    geom = 'H'; hReDo();
  }

  // Morph: warp all stack shapes into the new H FD.
  // E shapes have 2-element points; lift them to the hyperboloid before warping.
  if (morphMode && geom === 'H' && stack.length > 0) {
    function toH(p) {
      // H hyperboloid points have p[0] >= 1; S sphere and E 2D points do not.
      if (p.length === 3 && p[0] >= 1.0) return p;
      var x = p[0] || 0, y = (p.length >= 2 ? p[1] : 0) || 0;
      return [Math.sqrt(1 + x*x + y*y), x, y];
    }
    stack = stack.map(shape => [
      shape[0],
      toPoincareFDRep(toH(shape[1])).pt,
      toPoincareFDRep(toH(shape[2])).pt,
      shape[3],
      shape[4]
    ]);
  }

  // Show zoom only for H; show opaque toggle only for S
  document.getElementById("hZoomDiv").style.display   = (geom === 'H') ? "" : "none";
  document.getElementById("sOpaqueDiv").style.display = (geom === 'S') ? "" : "none";

  draw();
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function toggleGallery() {
  var p = document.getElementById("galleryPanel");
  p.style.display = (p.style.display === "none") ? "" : "none";
}

function selectOrbi(handle, crosscap, cone, kali) {
  document.getElementById("handle").value   = String(handle);
  document.getElementById("crosscap").value = String(crosscap);
  document.getElementById("cone").value     = JSON.stringify(cone);
  document.getElementById("kali").value     = JSON.stringify(kali);
  document.getElementById("galleryPanel").style.display = "none";
  reDo();
}

function selectVarS(sIdx) {
  var n = Number(document.getElementById("galleryN").value) || 4;
  var h=0, c=0, cone=[], kali=[];
  switch(sIdx) {
    case 7:  kali=[[2,2,n]]; break;
    case 8:  cone=[2]; kali=[[n]]; break;
    case 9:  cone=[2,2,n]; break;
    case 10: cone=[n]; kali=[[]]; break;
    case 11: c=1; cone=[n]; break;
    case 12: kali=[[n,n]]; break;
    case 13: cone=[n,n]; break;
  }
  selectOrbi(h, c, cone, kali);
}

// ── Canvas label ──────────────────────────────────────────────────────────────

function orbi2String(handle, crosscap, cone, kali) {
  var s = "";
  for (var i=0; i<cone.length; i++) s += cone[i];
  for (var i=0; i<kali.length; i++) {
    s += "*";
    for (var j=0; j<kali[i].length; j++) s += kali[i][j];
  }
  for (var i=0; i<crosscap; i++) s += "\u00d7"; // ×
  for (var i=0; i<handle; i++)   s += "o";
  return s || "?";
}

function setZoom() {
  var z = Number(document.getElementById("zoom").value);
  hZoom = z;
  document.getElementById("zoomVal").textContent = hZoom.toFixed(2);
  draw();
}


// ── Common tool handlers ──────────────────────────────────────────────────────

function stackUndo() {
  if (stack.length > 0) { undoStack.push(stack.pop()); draw(); }
}
function stackRedo() {
  if (undoStack.length > 0) { stack.push(undoStack.pop()); draw(); }
}

function setModeRadio(m) {
  if      (m === -1) document.getElementById("rPan").checked  = true;
  else if (m ===  0) document.getElementById("rEdit").checked = true;
  else if (m ===  1) document.getElementById("rLine").checked = true;
  else if (m ===  3) document.getElementById("rPoly").checked = true;
  setMode(m);
}

function setMode(m) {
  mode = m;
  if (m === 3) mode = Number(document.getElementById("ngon").value);
  // cancel any in-progress drawing
  posA = 0; posB = 0; posA3d = 0; posB3d = 0;
  sPosA3d = []; sPosB3d = [];
  ePosA = null; ePosB = null;
  draw();
}

function setNgon() {
  if (mode > 2) mode = Number(document.getElementById("ngon").value);
}

function setColor() {
  color = document.getElementById("color").value;
}

function setFill() {
  fill = document.getElementById("fill").checked ? 1 : 0;
}

function setGrid() {
  gridMode = document.getElementById("grid").checked;
  draw();
}

function setSnap() {
  snapMode = document.getElementById("snap").checked;
}

function setMorph() {
  morphMode = document.getElementById("morph").checked;
}

function setOpaque() {
  sOpaque = document.getElementById("opaque").checked;
  draw();
}

function goPng(el) {
  var c = document.getElementById("myCanvas");
  el.href = c.toDataURL("image/png");
}

function goSave(el) {
  var data = { geom: geom, eOrbi: eOrbi, sOrbi: sOrbi, stack: stack };
  var blob = new Blob([JSON.stringify(data)], {type: "text/plain"});
  el.href = URL.createObjectURL(blob);
  el.download = "orbiData.json";
}

// ── Mouse handlers ────────────────────────────────────────────────────────────

function mousePressed(event) {
  var c = document.getElementById("myCanvas");
  var r = c.getBoundingClientRect();
  var sx = Math.round(event.clientX - r.left);
  var sy = Math.round(event.clientY - r.top);
  if      (geom === 'H') { hMousePressed(sx, sy); draw(); }
  else if (geom === 'E') { eMousePressed(sx, sy); }
  else if (geom === 'S') { sMousePressed(sx, sy, event.shiftKey); }
}

function mouseMoved(event) {
  var c = document.getElementById("myCanvas");
  var r = c.getBoundingClientRect();
  var sx = Math.round(event.clientX - r.left);
  var sy = Math.round(event.clientY - r.top);
  if      (geom === 'H') { hMouseMoved(sx, sy); draw(); }
  else if (geom === 'E') { eMouseMoved(sx, sy); }
  else if (geom === 'S') { sMouseMoved(sx, sy, event.shiftKey); }
}

function mouseReleased(event) {
  var c = document.getElementById("myCanvas");
  var r = c.getBoundingClientRect();
  var sx = Math.round(event.clientX - r.left);
  var sy = Math.round(event.clientY - r.top);
  if      (geom === 'H') { hMouseReleased(sx, sy); draw(); }
  else if (geom === 'E') { eMouseReleased(sx, sy); }
  else if (geom === 'S') { sMouseReleased(sx, sy, event.shiftKey); }
}

function mouseClicked(event) { /* drawing is handled via press/move/release */ }

