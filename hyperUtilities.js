
// use Weierstrass coordinates: (t,x,y) with -t^2+x^2+y^2=-1 and t>0 for hyperboloid model.
// call them WC. 
// lines are given by a vector. Find the plane orthogonal to the line vector that contains the origin. Intersection of this plane and hyperboloid is the line.

var startX, startY, endX, endY;
var hZoom = 1.5;
var orbi = 14;

var NumMaps = 1;

var mode=1; // 0=edit, -1=spin, 1=line, 2=circle, n>=3 is polygon size
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






// hyperbolic stuff

// hyperbolic dot product
function hDot(P,Q) {
   return(-P[0]*Q[0]+P[1]*Q[1]+P[2]*Q[2]);
}

// P - Q
function vectMinus(P,Q) {
  return([P[0]-Q[0],P[1]-Q[1],P[2]-Q[2]]);
}

// P + Q
function vectPlus(P,Q) {
  return([P[0]+Q[0],P[1]+Q[1],P[2]+Q[2]]);
}

// return a line through two hyperbolic points. (line given by a normal vector.)
// do I want to assume they are normalized?
function points2Line(P,Q) {
  let dist = hDist(P,Q);
  let line = tRef(cross(P,Q));
  line[0] = line[0]/Math.sinh(dist);
  line[1] = line[1]/Math.sinh(dist);
  line[2] = line[2]/Math.sinh(dist);
 // may need to multiply by -1 at times?...
  return(line);
}

// hyperbolic distance
function hDist(P,Q) {
  let N = Math.abs(hDot(P,Q))/Math.sqrt(Math.abs(hDot(P,P)*hDot(Q,Q)));
  let dist = Math.acosh(N);
  return(dist);
}

// reflect over xy plane: t = -t.
function tRef(P) {
  return([-P[0],P[1],P[2]]);
}

// usual cross product
function cross(P,Q) {
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

// find in between points on polygon edges.
function regPolyMoreVert(P,Q) {
  let extra = 3; // number of points to add per edge
  let vertices = regPolyVertices(P,Q);
  let moreVert = [];
  for (i=0;i<vertices.length-1;i++) {
    let lineVert = divSeg(vertices[i],vertices[i+1],extra);
    lineVert.pop(); // don't include endpoints twice
    moreVert = moreVert.concat(lineVert);
  }
  let lineVert = divSeg(vertices[vertices.length-1],vertices[0],extra);
  lineVert.pop(); // don't include endpoints twice
  moreVert = moreVert.concat(lineVert);
  return(moreVert);
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

// multiply a matrix times a (column) vector to get a vector.
function multMatVect(mat, vect) {
  var v1 = vect[0]*mat[0][0]+vect[1]*mat[0][1]+vect[2]*mat[0][2];
  var v2 = vect[0]*mat[1][0]+vect[1]*mat[1][1]+vect[2]*mat[1][2];
  var v3 = vect[0]*mat[2][0]+vect[1]*mat[2][1]+vect[2]*mat[2][2];
  return([v1,v2,v3]);
}

function normalize(P) {
  let denom = Math.sqrt(P[0]*P[0]+P[1]*P[1]+P[2]*P[2]);
  return([P[0]/denom,P[1]/denom,P[2]/denom]);
}

function hNorm(P) {
  let k = 1/Math.sqrt(Math.abs(hDot(P,P)));
  return(scalarVect(k,P)); 
}

function scalarVect(scal, vect) {
  return([vect[0]*scal,vect[1]*scal,vect[2]*scal]);
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
  let mat1 = hFlipMat(P,[1,0,0]);
  let mat2 = rotOrigMat(-theta);
  let mat3 = multMatMat(mat1,multMatMat(mat2,mat1));
  return(mat3);
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















// given two hyperboloid points, draw segment on screen. Doesn't work
function drawSeg2(P,Q,context) {
  let scrP = pt2Screen(P,hZoom);
  let scrQ = pt2Screen(Q,hZoom);

  let R = cross(P,Q);
  let refR = tRef(R);
  let S;
  if (JSON.stringify(R) === JSON.stringify(refR)) {
    S = cross(R,[1,0,0]);
  } else {
    S = cross(R,refR);
  }
  let T = cross(S,R);
  S = hNorm(S);
  T = hNorm(T);
alert([S,T]);
  let a = Math.log(P[0]/2 + Math.sqrt(P[0]*P[0]-4*T[0])/2);
  let b = Math.log(Q[0]/2 + Math.sqrt(Q[0]*Q[0]-4*T[0])/2);
  let i = a;
//alert([P,Q]);
  for (i=-1.5;i<-.5;i+=.1) {
   let newPoint = vectPlus(scalarVect(Math.cosh(i),T),scalarVect(Math.sinh(i),S));
//   alert([i,newPoint]);
  }

/*

  let U = cross(R,[1,0,0]);
  let V = cross(R,U);
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
