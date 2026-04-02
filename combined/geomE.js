// geomE.js — Euclidean geometry for the combined orbifold app.

// ═══════════════════════════════════════════════════════════════════════════════
// E (Euclidean) geometry
// ═══════════════════════════════════════════════════════════════════════════════

// ── E state ───────────────────────────────────────────────────────────────────
var eOrbi, originFD, eGenMaps, paramPtList, originFDCent;
var eGenMats;
var eScale  = 150;   // pixels per unit length
var eTransX = 0;     // screen X of world origin (set by main.js init/resize)
var eTransY = 0;     // screen Y of world origin

var eMoveMat      = [[1,0,0],[0,1,0],[0,0,1]]; // similarity: shapeFD → world
var eShapeFD      = null;   // mutable working shape (copy of originFD)
var eParamVerts   = [];     // indices of movable param endpoints in eShapeFD
var eParamDragIdx = -1;     // which handle is being dragged: 0=v1, 1=second, -1=none
var eShapeNum  = -1;        // edit mode: index of selected stack item (-1 = none)
var eControlPt =  0;        // edit mode: which endpoint is selected (1 or 2)
var ePosA = null, ePosB = null;  // line drawing: start/end screen coords [sx,sy]
var _ePanStart  = null;          // pan drag: start screen pos
var _ePanOrigin = null;          // pan drag: [eTransX,eTransY] at press
var eNeighborMats = null;        // BFS tile matrices (canonical space)

// ── E coordinate conversion ───────────────────────────────────────────────────
// Accepts [x,y] or [x,y,1] — only first two components used.
function eVect2Screen(v) {
  return [eTransX + v[0] * eScale, eTransY - v[1] * eScale];
}
function eScreen2Vect(sx, sy) {
  return [(sx - eTransX) / eScale, (eTransY - sy) / eScale, 1];
}

// ── Inverse of a similarity (orientation-preserving) matrix ──────────────────
// For M = [[a,-b,tx],[b,a,ty],[0,0,1]]:  s² = a²+b²
function eInvSimilarity(M) {
  var a = M[0][0], b = M[1][0], tx = M[0][2], ty = M[1][2];
  var s2 = a*a + b*b;
  return [[ a/s2,  b/s2, -(a*tx + b*ty)/s2],
          [-b/s2,  a/s2,  (b*tx - a*ty)/s2],
          [0, 0, 1]];
}

// Return the current working shape (falls back to originFD if not yet set).
function eGetShapeFD() { return eShapeFD || originFD; }

// ── eSetGroup ─────────────────────────────────────────────────────────────────
function eSetGroup(idx) {
  eOrbi = idx;
  eBuildOriginFD();
  eBuildGenMats();
}

// ── eBuildOriginFD ────────────────────────────────────────────────────────────
function eBuildOriginFD() {
  paramPtList = [0];
  var s3h = 0.86602540378443864676372317075294; // sqrt(3)/2
  var P, Q;
  switch (eOrbi) {
    case 0:  // *632
      originFD = [[0,0],[.5,0],[.5,s3h]];
      originFDCent = [1/3, s3h/3];
      eGenMaps = [[0,0],[1,0],[2,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 1:  // 632
      originFD = [[0,0],[1,0],[.5,s3h]];
      originFDCent = [.5, s3h/3];
      eGenMaps = [[0,1],[2,1],[1,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 2:  // *442
      originFD = [[0,0],[1,0],[0,1]];
      originFDCent = [1/3, 1/3];
      eGenMaps = [[0,0],[1,0],[2,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 3:  // 442
      originFD = [[0,0],[1,0],[1,1],[0,1]];
      originFDCent = [.5, .5];
      eGenMaps = [[3,1],[2,1],[1,1],[0,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 4:  // 4*2
      originFD = [[0,0],[1,0],[0,1]];
      originFDCent = [1/3, 1/3];
      eGenMaps = [[2,1],[1,0],[0,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 5:  // *333
      originFD = [[0,0],[1,0],[.5,s3h]];
      originFDCent = [.5, s3h/3];
      eGenMaps = [[0,0],[1,0],[2,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 6:  // 333
      originFD = [[0,0],[1,0],[1.5,s3h],[.5,s3h]];
      originFDCent = [.75, s3h/2];
      eGenMaps = [[1,1],[0,1],[3,1],[2,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 7:  // 3*3
      originFD = [[0,0],[.5,-s3h],[.5,s3h]];
      originFDCent = [1/3, 0];
      eGenMaps = [[2,1],[1,0],[0,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      break;
    case 8:  // *2222
      originFD = [[0,0],[1,0],[1,.5],[0,.5]];
      originFDCent = [.5, .25];
      eGenMaps = [[0,0],[1,0],[2,0],[3,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
    case 9:  // 2*22
      originFD = [[0,0],[1,0],[0,.5]];
      originFDCent = [1/3, 1/6];
      eGenMaps = [[0,0],[1,1],[2,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[2]; paramPtList.push([P,Q]);
      break;
    case 10:  // 22*
      originFD = [[0,0],[1,0],[1,.5],[0,.5]];
      originFDCent = [.5, .25];
      eGenMaps = [[0,1],[1,0],[2,1],[3,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
    case 11:  // 22×
      originFD = [[0,0],[1,0],[1,.5],[0,.5]];
      originFDCent = [.5, .25];
      eGenMaps = [[0,1],[3,0],[2,1],[1,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
    case 12:  // 2222
      originFD = [[0,0],[1,0],[1.5,1],[.5,1]];
      originFDCent = [.75, .5];
      eGenMaps = [[0,1],[3,1],[2,1],[1,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
    case 13:  // **
      originFD = [[0,0],[1,0],[1,.5],[0,.5]];
      originFDCent = [.5, .25];
      eGenMaps = [[0,0],[3,1],[2,0],[1,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
    case 14:  // *×
      originFD = [[0,0],[1,0],[1,.5],[0,.5]];
      originFDCent = [.5, .25];
      eGenMaps = [[0,0],[3,0],[2,0],[1,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
    case 15:  // ××
      originFD = [[0,0],[1,0],[1,.5],[0,.5]];
      originFDCent = [.5, .25];
      eGenMaps = [[2,1],[3,0],[0,1],[1,0]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
    case 16:  // o
      originFD = [[0,0],[1,0],[1.5,1],[.5,1]];
      originFDCent = [.75, .5];
      eGenMaps = [[2,1],[3,1],[0,1],[1,1]];
      P = originFD[0]; Q = originFD[1]; paramPtList.push([P,Q]);
      Q = originFD[3]; paramPtList.push([P,Q]);
      break;
  }

  // Initialise mutable interactive state
  eShapeFD    = originFD.map(function(v) { return v.slice(); });
  eMoveMat    = [[1,0,0],[0,1,0],[0,0,1]];
  eParamVerts = (eOrbi >= 8) ? [1, (eOrbi === 9 ? 2 : 3)] : [1];
}

// ── E isometry helpers (3×3 homogeneous, column-vector convention) ─────────────

// Orientation-preserving isometry mapping segment P→Q onto segment R→S
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

// Orientation-reversing isometry mapping segment P→Q onto segment R→S
function eIsomSeg2SegFlip(P, Q, R, S) {
  var dx = Q[0]-P[0], dy = Q[1]-P[1];
  var ex = S[0]-R[0], ey = S[1]-R[1];
  var uLen = Math.sqrt(dx*dx+dy*dy), vLen = Math.sqrt(ex*ex+ey*ey);
  var ux = dx/uLen, uy = dy/uLen, vx = ex/vLen, vy = ey/vLen;
  var m00 = vx*ux - vy*uy, m01 = vy*ux + vx*uy;
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
  return [[m00, m01,  2*dy*cross],
          [m01,-m00, -2*dx*cross],
          [0,   0,    1]];
}

// ── eBuildGenMats ─────────────────────────────────────────────────────────────
function eBuildGenMats() {
  var fd = eGetShapeFD();
  var n  = fd.length;
  eGenMats = [];
  for (var i = 0; i < n; i++) {
    var j = eGenMaps[i][0], orient = eGenMaps[i][1];
    var Pi = fd[i],       Qi = fd[(i + 1) % n];
    var Pj = fd[j],       Qj = fd[(j + 1) % n];
    if (orient === 0) {
      if (j === i) eGenMats.push(eReflLineMat(Pi, Qi));
      else         eGenMats.push(eIsomSeg2SegFlip(Pi, Qi, Pj, Qj));
    } else {
      eGenMats.push(eIsomSeg2Seg(Pi, Qi, Qj, Pj));
    }
  }
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

// Draw a polygon given world-space vertices (any [x,y,...] arrays).
function eDrawPoly(ctx, verts, fillStyle, strokeStyle) {
  var sp = verts.map(function(v) { return eVect2Screen(v); });
  ctx.beginPath();
  ctx.moveTo(sp[0][0], sp[0][1]);
  for (var i = 1; i < sp.length; i++) ctx.lineTo(sp[i][0], sp[i][1]);
  ctx.closePath();
  if (fillStyle)   { ctx.fillStyle   = fillStyle;   ctx.fill();   }
  if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.stroke(); }
}

// ── eBuildNeighborMats ────────────────────────────────────────────────────────
// BFS outward from identity in canonical space, collecting every tile whose
// world-space centre falls within the canvas bounds + one maxDist margin.
// canvasW, canvasH: pixel dimensions of the canvas element.
function eBuildNeighborMats(canvasW, canvasH) {
  var ident = [[1,0,0],[0,1,0],[0,0,1]];
  if (!eGenMats || eGenMats.length === 0) { eNeighborMats = [ident]; return; }

  // Use vertex average of current shape as the canonical centre.
  // This stays correct even after eShapeFD has been modified by the user.
  var fd = eGetShapeFD();
  var cent = [0, 0];
  for (var vi = 0; vi < fd.length; vi++) { cent[0] += fd[vi][0]; cent[1] += fd[vi][1]; }
  cent[0] /= fd.length; cent[1] /= fd.length;

  // Distances from cent to each immediate-neighbour centre (canonical).
  var dists = eGenMats.map(function(M) {
    var nc = multMatVect(M, [cent[0], cent[1], 1]);
    var dx = nc[0] - cent[0], dy = nc[1] - cent[1];
    return Math.sqrt(dx*dx + dy*dy);
  });
  var minDist    = Math.min.apply(null, dists);
  var maxDist    = Math.max.apply(null, dists);
  var sameThresh = minDist * 0.4; // centres closer than this are the same tile

  // Scale factor of eMoveMat (canonical → world stretch).
  var a = eMoveMat[0][0], b = eMoveMat[1][0];
  var s = Math.max(Math.sqrt(a*a + b*b), 1e-9);

  // Canvas bounds in world space.
  // Use 3× maxDist margin so BFS paths that detour diagonally can always
  // route through in-bounds intermediate tiles to reach canvas-edge tiles.
  var margin = maxDist * s * 3;
  var xMin = (-eTransX)          / eScale - margin;
  var xMax = (canvasW - eTransX) / eScale + margin;
  var yMin = (eTransY - canvasH) / eScale - margin;
  var yMax = eTransY             / eScale + margin;

  // BFS
  var mats  = [ident];
  var cents = [[cent[0], cent[1], 1]]; // canonical centres of found tiles

  var idx = 0;
  while (idx < mats.length && mats.length < 4000) {
    for (var k = 0; k < eGenMats.length; k++) {
      var newMat  = multMatMat(eGenMats[k], mats[idx]);
      var newCent = multMatVect(newMat, [cent[0], cent[1], 1]);

      // World-space bounds check.
      var wc = multMatVect(eMoveMat, newCent);
      if (wc[0] < xMin || wc[0] > xMax || wc[1] < yMin || wc[1] > yMax) continue;

      // Duplicate check in canonical space.
      var isNew = true;
      for (var j = 0; j < cents.length; j++) {
        var ddx = newCent[0] - cents[j][0], ddy = newCent[1] - cents[j][1];
        if (ddx*ddx + ddy*ddy < sameThresh*sameThresh) { isNew = false; break; }
      }
      if (isNew) { mats.push(newMat); cents.push(newCent); }
    }
    idx++;
  }
  eNeighborMats = mats;
}

// ── Shape drawing helper ──────────────────────────────────────────────────────
// Draw one stack shape using combined world-transform TM.
// shape = [type, P_canon, Q_canon, color, fill]
// type 1 = line segment; type >= 3 = regular n-gon (center P, vertex Q).
function eDrawShapeWithMat(ctx, shape, TM) {
  var type = shape[0];
  var Pw = multMatVect(TM, [shape[1][0], shape[1][1], 1]);
  var Qw = multMatVect(TM, [shape[2][0], shape[2][1], 1]);
  var Ps = eVect2Screen(Pw), Qs = eVect2Screen(Qw);

  if (type === 1) {
    // Straight segment
    ctx.beginPath();
    ctx.moveTo(Ps[0], Ps[1]);
    ctx.lineTo(Qs[0], Qs[1]);
    ctx.stroke();
  } else {
    // Regular n-gon: centre Pw, one vertex Qw
    var n  = type;
    var cx = Pw[0], cy = Pw[1];
    var vx = Qw[0]-cx, vy = Qw[1]-cy;
    var r  = Math.sqrt(vx*vx + vy*vy);
    var a0 = Math.atan2(vy, vx);
    var step = 2*Math.PI / n;
    ctx.beginPath();
    for (var k = 0; k < n; k++) {
      var a  = a0 + k*step;
      var sc = eVect2Screen([cx + r*Math.cos(a), cy + r*Math.sin(a)]);
      if (k === 0) ctx.moveTo(sc[0], sc[1]); else ctx.lineTo(sc[0], sc[1]);
    }
    ctx.closePath();
    if (shape[4]) { ctx.fillStyle = shape[3]; ctx.fill(); }
    ctx.stroke();
  }
}

// ── eDraw ─────────────────────────────────────────────────────────────────────
function eDraw(ctx, c) {
  var fd = eGetShapeFD();

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, c.width, c.height);

  // Build full neighbour list for this frame (identity tile is index 0).
  eBuildNeighborMats(c.width, c.height);
  var nm = eNeighborMats;

  // Draw all tile FDs: neighbours first (outline only), origin on top (beige fill).
  ctx.lineWidth = 1;
  for (var k = 1; k < nm.length; k++) {
    var M   = multMatMat(eMoveMat, nm[k]);
    var nbr = fd.map(function(v) { return multMatVect(M, [v[0],v[1],1]); });
    eDrawPoly(ctx, nbr, null, '#aac');
  }
  ctx.lineWidth = 1.5;
  var worldFD = fd.map(function(v) { return multMatVect(eMoveMat, [v[0],v[1],1]); });
  eDrawPoly(ctx, worldFD, 'rgba(255,240,200,0.8)', '#888');

  // ── Stack shapes tiled through all neighbour mats ─────────────────────────
  for (var s = 0; s < stack.length; s++) {
    var shape = stack[s];
    ctx.strokeStyle = shape[3];
    ctx.lineWidth   = 1.5;
    for (var t = 0; t < nm.length; t++) {
      eDrawShapeWithMat(ctx, shape, multMatMat(eMoveMat, nm[t]));
    }
  }

  // ── Preview shape being drawn ─────────────────────────────────────────────
  if (ePosA !== null && ePosB !== null && mode >= 1) {
    var invM = eInvSimilarity(eMoveMat);
    var P = multMatVect(invM, eScreen2Vect(ePosA[0], ePosA[1]));
    var Q = multMatVect(invM, eScreen2Vect(ePosB[0], ePosB[1]));
    var preview = [mode === 1 ? 1 : mode, P, Q, color, fill];
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    for (var t = 0; t < nm.length; t++) {
      eDrawShapeWithMat(ctx, preview, multMatMat(eMoveMat, nm[t]));
    }
  }

  // ── Parameter edit UI (green) — shown in edit mode only ──────────────────
  if (mode === 0) {
    var s0 = eVect2Screen(multMatVect(eMoveMat, [0,0,1]));

    eParamVerts.forEach(function(pvIdx) {
      var vp = fd[pvIdx];
      var sw = eVect2Screen(multMatVect(eMoveMat, [vp[0],vp[1],1]));

      // Green line from v0 to handle
      ctx.beginPath();
      ctx.moveTo(s0[0], s0[1]);
      ctx.lineTo(sw[0], sw[1]);
      ctx.strokeStyle = '#0a0';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Filled circle marker at movable endpoint
      ctx.beginPath();
      ctx.arc(sw[0], sw[1], 5, 0, 2*Math.PI);
      ctx.fillStyle = '#0a0';
      ctx.fill();
    });

    // ── Stack control-point boxes ─────────────────────────────────────────
    var r = 8;
    for (var si = 0; si < stack.length; si++) {
      for (var cp = 1; cp <= 2; cp++) {
        var p  = stack[si][cp];
        var sc = eVect2Screen(multMatVect(eMoveMat, [p[0], p[1], 1]));
        ctx.beginPath();
        ctx.rect(sc[0]-r, sc[1]-r, r*2, r*2);
        ctx.fillStyle = (si === eShapeNum && cp === eControlPt) ? 'yellow' : 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth   = 1;
        ctx.stroke();
      }
    }
  }
}

// ── Mouse handlers ────────────────────────────────────────────────────────────

var _eHitR2 = 12 * 12; // hit-test radius² in pixels

// Squared pixel distance from screen point (sx,sy) to world point wv.
function _eDistSq(sx, sy, wv) {
  var sv = eVect2Screen(wv);
  var dx = sx - sv[0], dy = sy - sv[1];
  return dx*dx + dy*dy;
}

function eMousePressed(sx, sy) {
  var fd = eGetShapeFD();

  if (mode === -1) {
    // Pan: record start
    _ePanStart  = [sx, sy];
    _ePanOrigin = [eTransX, eTransY];
    return;
  }

  // Hit-test param handles (works in all non-pan modes)
  eParamDragIdx = -1;
  for (var i = 0; i < eParamVerts.length; i++) {
    var wv = multMatVect(eMoveMat, [fd[eParamVerts[i]][0], fd[eParamVerts[i]][1], 1]);
    if (_eDistSq(sx, sy, wv) < _eHitR2) {
      eParamDragIdx = i;
      break;
    }
  }
  if (eParamDragIdx >= 0) return;

  if (mode === 0) {
    // Hit-test stack control-point boxes
    eShapeNum = -1; eControlPt = 0;
    var r = 8;
    var found = false;
    for (var i = 0; i < stack.length && !found; i++) {
      for (var cp = 1; cp <= 2; cp++) {
        var p  = stack[i][cp];
        var sc = eVect2Screen(multMatVect(eMoveMat, [p[0], p[1], 1]));
        if (Math.abs(sx - sc[0]) < r && Math.abs(sy - sc[1]) < r) {
          eShapeNum = i; eControlPt = cp; found = true; break;
        }
      }
    }
    return; // edit mode never starts a new shape
  }

  // mode >= 1: start line/polygon drawing
  ePosA = [sx, sy];
  ePosB = null;
}

function eMouseMoved(sx, sy) {
  // ── Pan ──────────────────────────────────────────────────────────────────
  if (mode === -1 && _ePanStart !== null) {
    eTransX = _ePanOrigin[0] + (sx - _ePanStart[0]);
    eTransY = _ePanOrigin[1] + (sy - _ePanStart[1]);
    draw();
    return;
  }

  // ── Edit-mode control-point drag ─────────────────────────────────────────
  if (mode === 0 && eShapeNum >= 0) {
    var invM = eInvSimilarity(eMoveMat);
    var pC   = multMatVect(invM, eScreen2Vect(sx, sy));
    stack[eShapeNum][eControlPt] = [pC[0], pC[1]];
    draw();
    return;
  }

  // ── Param drag ────────────────────────────────────────────────────────────
  if (eParamDragIdx !== -1) {
    var fd = eGetShapeFD();
    var p  = eScreen2Vect(sx, sy);

    if (eParamDragIdx === 0) {
      // Drag v1: update eMoveMat (scale + rotation), keeping v0 world-fixed
      var anchor = [eMoveMat[0][2], eMoveMat[1][2]];
      var v1     = fd[1];
      eMoveMat = eIsomSeg2Seg([0,0], [v1[0],v1[1]], anchor, [p[0],p[1]]);
    } else {
      // Drag second param: update eShapeFD shape
      var pC    = multMatVect(eInvSimilarity(eMoveMat), [p[0],p[1],1]);
      var pvIdx = eParamVerts[1];
      var v1    = fd[1];
      var newPos;

      // Right-angle constraint: groups 8–11, 13–15
      var rightAngle = (eOrbi >= 8 && eOrbi <= 11) ||
                       (eOrbi >= 13 && eOrbi <= 15);
      if (rightAngle) {
        var len2 = v1[0]*v1[0] + v1[1]*v1[1];
        var t    = (-v1[1]*pC[0] + v1[0]*pC[1]) / len2;
        newPos   = [-t*v1[1], t*v1[0]];
      } else {
        newPos = [pC[0], pC[1]];
      }

      eShapeFD[pvIdx] = newPos;
      if (fd.length === 4 && pvIdx === 3) {
        eShapeFD[2] = [eShapeFD[1][0] + newPos[0], eShapeFD[1][1] + newPos[1]];
      }
      eBuildGenMats();
    }
    draw();
    return;
  }

  // ── Line/polygon preview ──────────────────────────────────────────────────
  if (ePosA !== null && mode >= 1) {
    ePosB = [sx, sy];
    draw();
  }
}

function eMouseReleased(sx, sy) {
  // End pan
  _ePanStart = null;

  // End param drag / control-point drag
  eParamDragIdx = -1;
  eShapeNum = -1;

  // Commit line/polygon to stack
  if (ePosA !== null && ePosB !== null && mode >= 1) {
    var invM = eInvSimilarity(eMoveMat);
    var P    = multMatVect(invM, eScreen2Vect(ePosA[0], ePosA[1]));
    var Q    = multMatVect(invM, eScreen2Vect(ePosB[0], ePosB[1]));
    stack.push([mode === 1 ? 1 : mode,
                [P[0], P[1]], [Q[0], Q[1]],
                color,
                mode === 1 ? 0 : fill]);
    undoStack = [];
    draw();
  }

  ePosA = null;
  ePosB = null;
}
