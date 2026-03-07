let handle = 0;
let cross = 0;
let cone = [];
let kali = [[7],[2,2]];
// these are for the inf. edges
let infCount = 0;
let infArray = [0];
let newCone = JSON.parse(JSON.stringify(cone));
let newKali = []; // note that newKali will have one less layer of [] than kali, since it's just one.
let atomList = [];
let epsilon = 0.0001;

alert(JSON.stringify([handle, cross, cone, kali]));

for (i = 0; i<cross; i++) { // step 2: remove cross.
  infCount++;
  newCone.push(-infCount);
  infArray.push([2,2]); // step 2, length 2
}

//alert(JSON.stringify([2,newCone,newKali,infArray,atomList]));

for (i = 0; i<handle; i++) { // step 3: remove handle.
  infCount++;
  newCone.push(-infCount);
  newCone.push(-infCount);
  infArray.push([3,2,0]); // step 3. length 2. twist 0.
}

//alert(JSON.stringify([3,newCone,newKali,infArray,atomList]));

if (kali.length > 0) { // here there are kaleidoscopes
  for (i=0; i< kali.length; i++) { // ensure "2" corners adjacent if possible.
    if (kali[i].length >1) {
      for (j=0; j<kali[i].length-1; j++) {
        if (kali[i][j] != 2) {
          kali[i] = kali[i].slice(j).concat(kali[i].slice(0, j));
          break; // break from j loop
        }
      } // end j loop
    }
  } // end i loop

  newKali = JSON.parse(JSON.stringify(kali[0]));
  if (kali.length > 1) { // step 1. Join kalis.
    let minInfCount = infCount;
    newKali = JSON.parse(JSON.stringify(kali[0]));
    for (i=1;i<kali.length;i++) { 
      infCount++;
      newKali.push(-infCount);
      infArray.push([1,2]); // step 1. length 2
      newKali.push(...kali[i]);
    } // end i loop through all kalis
    for (i = infCount;i>minInfCount ;i--) { // add matching inf edges
      newKali.push(-i);
    }
  } // end step 1

//alert(JSON.stringify([1,newCone,newKali,infArray,atomList]));

  for (i=0; i<newCone.length; i++) { // step 4. "2" cone and kali.
    if (newCone[i] === 2) { // remove cone. add corner.
      newCone.splice(i, 1);
      infCount++;
      newKali.push(-infCount);
      infArray.push([4,2]); // step 4. length 2
      i--;
    }
  } // end step 4

//alert(JSON.stringify([4,newCone,newKali,infArray,atomList]));

  for (i=0; i<newKali.length-1; i++) {   // step 6. "22" corners adjacent
    if ((newKali[i] === 2) && (newKali[i+1] === 2)) {
      infCount++;
      newKali.splice(i, 2,-infCount);
      infArray.push([6,2]); // step 6. length 2
    } 
  } // end step 6

//alert(JSON.stringify([6,newCone,newKali,infArray,atomList]));

  if ((newCone.length === 1) && (newKali.length === 1)) { // just a hat
    atomList.push(["hat",newCone[0],newKali[0]]);
  } else { // plural hats
    for (i=0; i<newCone.length; i++) { // step 7. cone & kali (hat -> sheet)
      infCount++;
      atomList.push(["hat",newCone[i],-infCount]);
      newKali.push(-infCount);
      infArray.push([7,2]); // step 7. length 2
    } // end step 7
  } // end plural hats

//alert(JSON.stringify([7,newCone,newKali,infArray,atomList]));

  if (newKali.length === 3) { // just one sheet
    atomList.push(["sheet",newKali[0],newKali[1],newKali[2]]);
  } else { // many corners
    for (i=0; i<newKali.length-3; i++) { // step 9. (sheet)
      infCount++;
      atomList.push(["sheet",newKali[i],newKali[i+1],-infCount]);
      newKali.push(-infCount);
      infArray.push([9,2]); // step 9. length 2
      i++;
      if (i === newKali.length-4) {
        atomList.push(["sheet",newKali[i+1],newKali[i+2],newKali[i+3]]);
      }
    } // end step 9
  } // end many corners

//alert(JSON.stringify([9,newCone,newKali,infArray,atomList]));

} else { // here: no kaleidoscopes.
  newCone = newCone.sort(function(a, b){return a-b});
  for (i=0; i<newCone.length-1; i++) {  // step 5. two "2" cones
    if ((newCone[i] === 2) && (newCone[i+1] === 2)) {
      infCount++;
      newCone.splice(i,2,-infCount);
      infArray.push([5,2]); // step 5. length 2
    } 
  } // end step 5

//alert(JSON.stringify([5,newCone,newKali,infArray,atomList]));

  if (newCone.length === 3) { // just one sheet
    atomList.push(["pillow",newCone[0],newCone[1],newCone[2]]);
  } else { // many cones
    for (i=0; i<newCone.length-3; i++) {  // step 8. (pillow) remember twist.
      infCount++;
      atomList.push(["pillow",newCone[i],newCone[i+1],-infCount]);
      newCone.push(-infCount);
      infArray.push([8,2,0]); // step 8. length 2. twist 0.
      i++;
      if (i === newCone.length-4) {
        atomList.push(["pillow",newCone[i+1],newCone[i+2],newCone[i+3]]);
      }
    } // end step 8
  } // end many cones

//alert(JSON.stringify([8,newCone,newKali,infArray,atomList]));

}

alert(JSON.stringify(["final", newCone,newKali,infArray,atomList]));

for (i=0;i<atomList.length;i++) {
  getAtom(atomList[i]);  


}



function getAtom(atom) {
  let numNeg=0;
  let atomPts = [];
  if ((atom[0]==="sheet") || (atom[0] ==="pillow")) {
    // cyclic rotate array so negatives first.
    let atom1 = atom[1];
    let atom2 = atom[2];
    let atom3 = atom[3];
    for (i=1;i<4;i++) {
      if (atom[i]<0) {numNeg++}
    }
    let breakpoint = 0; // this is true for +++, -++, --+, ---
    if ((atom1>0) && (atom2<0) && (atom3>0)) {
      breakpoint = 1;
    }
    if ((atom1>0) && (atom2>0) && (atom3<0)) {
      breakpoint = 2;
    }
    if ((atom1>0) && (atom2<0) && (atom3<0)) {
      breakpoint = 1;
    }
    if ((atom1<0) && (atom2>0) && (atom3<0)) {
      breakpoint = 2;
    }
    if (breakpoint === 1) {
      atom[1] = atom2;
      atom[2] = atom3;
      atom[3] = atom1;  
    }    
    if (breakpoint === 2) {
      atom[1] = atom3;
      atom[2] = atom1;
      atom[3] = atom2;  
    }   
    // done cyclic rotate
  }


  switch(atom[0]) {
    case "sheet":
      switch(numNeg) {
        case 0:
          atomPts = solve3Ang(Math.PI/atom[1],Math.PI/atom[2],Math.PI/atom[3]);
          break;
        case 1:
          atomPts = solve2Ang(infArray[-atom[1]][1],Math.PI/atom[2],Math.PI/atom[3]);
          break;
        case 2:
          atomPts = solve1Ang(infArray[-atom[1]][1],infArray[-atom[2]][1],Math.PI/atom[3]);
          break;
        case 3:
          atomPts = solve0Ang(infArray[-atom[1]][1],infArray[-atom[2]][1],infArray[-atom[3]][1]);
          break;
      }

alert(atomPts);
      break;
    case "hat":

      break;
    case "pillow":
     
      break;

  }


}




function sheet() {
  let numSides = Number(document.getElementById("numSides").value);
  let input1 = Number(document.getElementById("input1").value);
  let input2 = Number(document.getElementById("input2").value);
  let input3 = Number(document.getElementById("input3").value);
  let myOrbi;

  maxT = 50;
  tileMethod = 1;

  switch(numSides) {
    case 3:
      funDom = solve3Ang(Math.PI/input1,Math.PI/input2,Math.PI/input3);
      myOrbi = "*" + input1 + input2 + input3;
      break;
    case 4:
      funDom = solve2Ang(input1,Math.PI/input2,Math.PI/input3);
      myOrbi = "*22" + input2 + input3;
      break;
    case 5:
      funDom = solve1Ang(input1,input2,Math.PI/input3);
      myOrbi = "*2222" + input3;
      break;
    case 6:
      funDom = solve0Ang(input1,input2,input3);
      myOrbi = "*222222";
      break;
    default:
        alert("we need numbers of sides between 3 and 6");
  }

  document.getElementById("orbifold").value=myOrbi;

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));
  genMats = [];
  // this only works if generators are all reflections
  let polyLeng = funDom.length;
  let oldVertex = funDom[polyLeng-1];
  for (let i = 0;i<polyLeng;i++) {
    let myLine = points2Line(funDom[i],oldVertex);
    let myMat = hReflMat(myLine);
    oldVertex = funDom[i];
    genMats.push(myMat);
  }
//alert(input1);
  tileIt();
//alert("done");
  draw();
} // end sheet()


function hat() {
  let numSides = Number(document.getElementById("numSides").value);
  let input1 = Number(document.getElementById("input1").value);
  let input2 = Number(document.getElementById("input2").value);
  let myOrbi;

  maxT = 50;
  tileMethod = 1;
  let angle1, angle2, side1, side2;
  let myLine, myMat;

  switch(numSides) {
    case 3: // angle1 * angle2
      angle1 = Math.PI/input1;
      angle2 = Math.PI/input2;
      funDom = solve3Ang(angle1*2,angle2/2,angle2/2);
      genMats = [];
      myLine = points2Line(funDom[1],funDom[2]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[0],funDom[2]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[2],funDom[0],funDom[1]);
      genMats.push(myMat);
      myOrbi = input1 + "*" + input2;
      break;
    case 4: // side1 * angle2
      side1 = input1;
      angle2 = Math.PI/input2;
      funDom = solve2Ang(side1*2,angle2/2,angle2/2);
      genMats = [];
      myLine = points2Line(funDom[2],funDom[3]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[1],funDom[2],funDom[0],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[3],funDom[1],funDom[2]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[1],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[1],funDom[0],funDom[0],funDom[1]);
      genMats.push(myMat);
      myOrbi = "22*" + input2;
      break;
    case 5: // angle1 * side2
      angle1 = Math.PI/input1;
      side2 = input2;
      funDom = solve1Ang(side2/2,side2/2,angle1*2);
      genMats = [];
      myLine = points2Line(funDom[0],funDom[1]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myLine = points2Line(funDom[1],funDom[2]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myLine = points2Line(funDom[2],funDom[3]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[3],funDom[4],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[0],funDom[4],funDom[3]);
      genMats.push(myMat);
      myOrbi = input1 + "*22";
      break;
    case 6: // side1 * side2
      side1 = input1;
      side2 = input2;
      funDom = solve0Ang(side2/2,side2/2,side1*2);
      genMats = [];
      myLine = points2Line(funDom[0],funDom[1]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myLine = points2Line(funDom[1],funDom[2]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myLine = points2Line(funDom[2],funDom[3]);
      myMat = hReflMat(myLine);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[3],funDom[5],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[5],funDom[0],funDom[4],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[5],funDom[5],funDom[4]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[5],funDom[4],funDom[4],funDom[5]);
      genMats.push(myMat);
      myOrbi = "22*22";
      break;
  } // end switch

  document.getElementById("orbifold").value=myOrbi;

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));
  tileIt();
} // end hat()



function pillow() {
  let numSides = Number(document.getElementById("numSides").value);
  let input1 = Number(document.getElementById("input1").value);
  let input2 = Number(document.getElementById("input2").value);
  let input3 = Number(document.getElementById("input3").value);
  let myOrbi;

  maxT = 150;
  tileMethod = 1;
  let angle1, angle2, angle3, side1, side2, side3;
  let shape1, shape2, newShape2;
  let myLine, myMat;

  switch(numSides) {
    case 3: // 3 sides. 3 angles. 
      angle1 = Math.PI/input1;
      angle2 = Math.PI/input2;
      angle3 = Math.PI/input3;
      shape1 = solve3Ang(angle1,angle2,angle3);
      shape2 = solve3Ang(angle1,angle3,angle2);
      myMat = isomSeg2Seg(shape2[0],shape2[2],shape1[0],shape1[1]);
      newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),multMatVect(myMat,shape2[2])];
      funDom = [newShape2[0],newShape2[1],newShape2[2],shape1[2]];
      genMats = [];
      myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[0],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[3],funDom[0],funDom[1]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[2],funDom[1],funDom[2],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[2],funDom[3],funDom[2],funDom[1]);
      genMats.push(myMat);
      myOrbi = "" + input1 + input2 + input3;
      break;
    case 4: // 4 sides. 2 angles. 0.65,2,3 works. 0.8,5,3 works. 
      side1 = input1;
      angle2 = Math.PI/input2;
      angle3 = Math.PI/input3;
      shape1 = solve2Ang(side1,angle2,angle3);
      shape2 = solve2Ang(side1,angle3,angle2);
      myMat = isomSeg2Seg(shape2[0],shape2[3],shape1[1],shape1[2]);
      newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),           
                   multMatVect(myMat,shape2[2]),multMatVect(myMat,shape2[3])];
      funDom = [newShape2[1],newShape2[2],newShape2[3],shape1[3],shape1[0]];
      genMats = [];
      myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[4],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[3],funDom[0],funDom[1]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[2],funDom[1],funDom[2],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[2],funDom[3],funDom[2],funDom[1]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[4],funDom[4],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[0],funDom[0],funDom[4]);
      genMats.push(myMat);
      myOrbi = "22" + input2 + input3;
      break;
    case 5: // 5 sides. 1 angle. 1,1,3 works
      side1 = input1;
      side2 = input2;
      angle3 = Math.PI/input3;
      shape1 = solve1Ang(side1,side2,angle3);
      shape2 = solve1Ang(side2,side1,angle3);
      myMat = isomSeg2Seg(shape2[1],shape2[2],shape1[2],shape1[1]);
      newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),           
                   multMatVect(myMat,shape2[2]),multMatVect(myMat,shape2[3]),multMatVect(myMat,shape2[4])];
      funDom = [newShape2[3],newShape2[4],newShape2[0],shape1[3],shape1[4],shape1[0]];
      genMats = [];
      myMat = isomSeg2Seg(funDom[4],funDom[3],funDom[1],funDom[2]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[1],funDom[2],funDom[4],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[1],funDom[0],funDom[4],funDom[5]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[5],funDom[1],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[5],funDom[5],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[5],funDom[0],funDom[0],funDom[5]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[2],funDom[3],funDom[3],funDom[2]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[3],funDom[2],funDom[2],funDom[3]);
      genMats.push(myMat);
      myOrbi = "2222" + input3;
      break;
    case 6: // 6 sides. 0 angles. 1.2,1.2,1.2 works
      side1 = input1;
      side2 = input2;
      side3 = input3;
      shape1 = solve0Ang(side1,side2,side3);
      shape2 = solve0Ang(side2,side1,side3);
      myMat = isomSeg2Seg(shape2[1],shape2[2],shape1[2],shape1[1]);
      newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),multMatVect(myMat,shape2[2]),
                   multMatVect(myMat,shape2[3]),multMatVect(myMat,shape2[4]),multMatVect(myMat,shape2[5])];
      funDom = [newShape2[3],newShape2[4],newShape2[5],newShape2[0],shape1[3],shape1[4],shape1[5],shape1[0]];
      genMats = [];
      myMat = isomSeg2Seg(funDom[5],funDom[4],funDom[2],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[2],funDom[3],funDom[5],funDom[4]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[1],funDom[0],funDom[6],funDom[7]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[6],funDom[7],funDom[1],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[0],funDom[7],funDom[7],funDom[0]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[7],funDom[0],funDom[0],funDom[7]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[4],funDom[3],funDom[3],funDom[4]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[3],funDom[4],funDom[4],funDom[3]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[1],funDom[2],funDom[6],funDom[5]);
      genMats.push(myMat);
      myMat = isomSeg2Seg(funDom[6],funDom[5],funDom[1],funDom[2]);
      genMats.push(myMat);
      myOrbi = "222222";
      break;
  } // end switch

  document.getElementById("orbifold").value=myOrbi;

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));
  tileIt();
} // end pillow()


// this is for three real angles of a triangle.
function solve3Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [0,Math.cos(alpha),Math.sin(alpha)];
  let sideAY = (Math.cos(gamma)+Math.cos(alpha)*Math.cos(beta))/Math.sin(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [-Math.sqrt(sideAX*sideAX+sideAY*sideAY-1),sideAX,-sideAY];
  let vertAlpha = hNorm(cross2(tRef(sideB),tRef(sideC)));
  let vertBeta = hNorm(cross2(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(cross2(tRef(sideA),tRef(sideB)));
  return([vertAlpha,vertBeta,vertGamma]);
}

// this is for two real angles of a triangle and one imaginary (shortest segment between ultra parallels)
// alpha is the imaginary
function solve2Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha),Math.cosh(alpha),0];
  let sideAT = (Math.cos(gamma)+Math.cosh(alpha)*Math.cos(beta))/Math.sinh(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [sideAT,sideAX,Math.sqrt(-sideAX*sideAX+sideAT*sideAT+1)];
  let segAlpha = hNorm(cross2(tRef(sideB),tRef(sideC)));
  let vertBeta = hNorm(cross2(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(cross2(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(cross2(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(cross2(tRef(segAlpha),tRef(sideB)));
  return([vertAlphaB,vertAlphaC,vertBeta,vertGamma]);
}

// this is for one real angle of a triangle and two imaginary (shortest segment between ultra parallels)
// alpha, beta are the imaginary
function solve1Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha),Math.cosh(alpha),0];
  let sideAT = (Math.cos(gamma)+Math.cosh(alpha)*Math.cosh(beta))/Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT,sideAX,Math.sqrt(-sideAX*sideAX+sideAT*sideAT+1)];
  let segAlpha = hNorm(cross2(tRef(sideB),tRef(sideC)));
  let segBeta = hNorm(cross2(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(cross2(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(cross2(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(cross2(tRef(segAlpha),tRef(sideB)));
  let vertBetaA = hNorm(cross2(tRef(segBeta),tRef(sideA)));
  let vertBetaC = hNorm(cross2(tRef(segBeta),tRef(sideC)));
  return([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGamma]);
}


// this is for zero real angles of a triangle and three imaginary (shortest segment between ultra parallels)
function solve0Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [Math.sinh(alpha),Math.cosh(alpha),0];
  let sideAT = (Math.cosh(gamma)+Math.cosh(alpha)*Math.cosh(beta))/Math.sinh(alpha);
  let sideAX = Math.cosh(beta);
  let sideA = [sideAT,sideAX,Math.sqrt(-sideAX*sideAX+sideAT*sideAT+1)];
  let segAlpha = hNorm(cross2(tRef(sideB),tRef(sideC)));
  let segBeta = hNorm(cross2(tRef(sideC),tRef(sideA)));
  let segGamma = hNorm(cross2(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(cross2(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(cross2(tRef(segAlpha),tRef(sideB)));
  let vertBetaA = hNorm(cross2(tRef(segBeta),tRef(sideA)));
  let vertBetaC = hNorm(cross2(tRef(segBeta),tRef(sideC)));
  let vertGammaA = hNorm(cross2(tRef(segGamma),tRef(sideA)));
  let vertGammaB = hNorm(cross2(tRef(segGamma),tRef(sideB)));
//alert([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGammaA,vertGammaB]);
  return([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGammaA,vertGammaB]);
}



// normalized vector. (with t > 0)
function hNorm(P) {
  let denom;
  if (vectType(P) === 0) {
    denom = 1/P[0]/Math.sqrt(2);
  } else {
    denom = Math.sqrt(Math.abs(hDot(P,P)));
  }
  let multiplier = 1;
  if (P[0]<0) {multiplier = -1}
  return([P[0]*multiplier/denom,P[1]*multiplier/denom,P[2]*multiplier/denom]);
}


// reflect over xy plane: t = -t.
function tRef(P) {
  return([-P[0],P[1],P[2]]);
}

// hyperbolic dot product (bilinear form)
function hDot(P,Q) {
   return(-P[0]*Q[0]+P[1]*Q[1]+P[2]*Q[2]);
}

// which point type? -1 is a point, 0 is an ideal point at infinity, 1 is for a line.
function vectType(P) {
  let type = 1;
  let inner = hDot(P,P);
  if (Math.abs(inner) < epsilon) {type = 0}
  else if (inner < 0) {type = -1}
  return (type); 
}


// usual cross product
function cross2(P,Q) {
  return([P[1]*Q[2]-P[2]*Q[1], P[2]*Q[0]-P[0]*Q[2], P[0]*Q[1]-P[1]*Q[0]]);
}
