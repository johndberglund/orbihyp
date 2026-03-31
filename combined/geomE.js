// geomE.js — Euclidean geometry for the combined orbifold app.

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

// ── eDraw(ctx, c) ─────────────────────────────────────────────────────────────
// Renders the complete E scene.  stack[] items: [mode, P, Q, color, fill]
// where P,Q are [x,y] native E coordinates.

function eDraw(ctx, c) {
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

// ── E mouse handlers ───────────────────────────────────────────────────────────

var ePanStartScreen = null;
var ePanStartTransX = 0, ePanStartTransY = 0;
var eEditShapeIdx = -1, eEditPtIdx = -1;

function eMousePressed(sx, sy) {
  if (gridMode) {
    var _ha = ePt2Screen(eTranAx, eTranAy);
    if (Math.abs(sx-_ha[0]) < 12 && Math.abs(sy-_ha[1]) < 12) { eDragHandle = 'A'; return; }
    if (eHasHandleB(eOrbi)) {
      var _hb = ePt2Screen(eTranBx, eTranBy);
      if (Math.abs(sx-_hb[0]) < 12 && Math.abs(sy-_hb[1]) < 12) { eDragHandle = 'B'; return; }
    }
  }
  if (mode === -1) {
    ePanStartScreen = [sx, sy];
    ePanStartTransX = eTransX;
    ePanStartTransY = eTransY;
    return;
  }
  var pt = eScreen2Pt(sx, sy);
  if (mode === 0) {
    eEditShapeIdx = -1; eEditPtIdx = -1;
    for (var i = 0; i < stack.length; i++) {
      var sp = ePt2Screen(stack[i][1][0], stack[i][1][1]);
      var sq = ePt2Screen(stack[i][2][0], stack[i][2][1]);
      if (Math.abs(sx-sp[0]) < boxSize && Math.abs(sy-sp[1]) < boxSize) { eEditShapeIdx = i; eEditPtIdx = 1; break; }
      if (Math.abs(sx-sq[0]) < boxSize && Math.abs(sy-sq[1]) < boxSize) { eEditShapeIdx = i; eEditPtIdx = 2; break; }
    }
    return;
  }
  if (snapMode) pt = eSnapTo(pt);
  ePosA = pt; ePosB = pt;
  draw();
}

function eMouseMoved(sx, sy) {
  if (eDragHandle) {
    var pt = eScreen2Pt(sx, sy);
    if (eDragHandle === 'A') eApplyConstraintA(pt[0], pt[1]);
    else                     eApplyConstraintB(pt[0], pt[1]);
    draw(); return;
  }
  if (mode === -1 && ePanStartScreen) {
    eTransX = ePanStartTransX + (sx - ePanStartScreen[0]);
    eTransY = ePanStartTransY + (sy - ePanStartScreen[1]);
    draw();
    return;
  }
  if (mode === 0 && eEditShapeIdx >= 0) {
    var pt = eScreen2Pt(sx, sy);
    if (snapMode) pt = eSnapTo(pt);
    stack[eEditShapeIdx][eEditPtIdx] = pt;
    draw();
    return;
  }
  if (ePosA !== null) {
    ePosB = eScreen2Pt(sx, sy);
    if (snapMode) ePosB = eSnapTo(ePosB);
    draw();
  }
}

function eMouseReleased(sx, sy) {
  if (eDragHandle) { eDragHandle = null; return; }
  if (mode === -1) { ePanStartScreen = null; return; }
  if (mode === 0)  { eEditShapeIdx = -1; draw(); return; }
  if (ePosA !== null) {
    ePosB = eScreen2Pt(sx, sy);
    if (snapMode) ePosB = eSnapTo(ePosB);
    undoStack = [];
    stack.push([mode, ePosA, ePosB, color, fill]);
    ePosA = null; ePosB = null;
    draw();
  }
}

// Simple E snap: snap to nearest lattice vertex
function eSnapTo(pt) {
  var det = eTranAx*eTranBy - eTranAy*eTranBx;
  if (Math.abs(det) < 1e-10) return pt;
  var fi = ( (pt[0]-eTranOrigx)*eTranBy - (pt[1]-eTranOrigy)*eTranBx) / det;
  var fj = (-(pt[0]-eTranOrigx)*eTranAy + (pt[1]-eTranOrigy)*eTranAx) / det;
  var ni = Math.round(fi), nj = Math.round(fj);
  var near = [eTranOrigx + ni*eTranAx + nj*eTranBx,
              eTranOrigy + ni*eTranAy + nj*eTranBy];
  var snapPx = boxSize * 2 / eScale;
  var dx = pt[0]-near[0], dy = pt[1]-near[1];
  if (dx*dx+dy*dy < snapPx*snapPx) return near;
  return pt;
}