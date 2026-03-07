// use Weierstrass coordinates: (t,x,y) with -t^2+x^2+y^2=-1 and t>0 for hyperboloid model.
// call them WC. 

var startX, startY, endX, endY;
var hZoom = 1;
var orbi = 14;
var funDom = [];
var funDomMoreVert = [];
var funDomCent = [];
var genMats = [];
var matList = [];
var centList = [];
var moveMat = [
    [1,0,0],
    [0,1,0],
    [0,0,1]
  ];

var tempMat = [];

var NumMaps = 1;

var mode=1; // -1=pan, 0=edit, 1=line, 2=circle, n>=3 is polygon size
var atomType = 0; // 0=sheet, 1=hat, 2=pillow
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

var myRot = 6;
var symVects = [[0,1,0]];
var backupSymVects = [];
var stack = [];
var undoStack = [];
var backupStack = [];
var frontBez = [];
var rearBez = [];
var epsilon = 0.0000001;
var maxT = 2;
var tileMethod = 1;

var scrRadius = 200;
var scrCenterX;
var scrCenterY;
var posB3d = [];
var posA3d = [];
var asOutput;

function init() {
  pointList = [];
  curPoly = [];
  polyList = [];
//  mode = 1;

// why am I drawing here? do it in draw()...?
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  c.height = window.innerHeight-220;
  c.width = window.innerWidth-205;
  scrCenterX = Math.round(c.width/2);
  scrCenterY = Math.round(c.height/2);
  
  context.beginPath();
  context.rect(0,0,c.width,c.height);
  context.fillStyle = "white";
  context.fill();

  var d = document.getElementById("canvasDiv");
  d.style.maxHeight= window.innerHeight-195 + "px";
  d.style.height = window.innerHeight-195 + "px";
  d.style.maxWidth= window.innerWidth-180 + "px";
  d.style.width= window.innerWidth-180 + "px";

  document.onkeyup = function(e) {
    var myKey = e.which || e.keyCode;
    if (e.ctrlKey && myKey === 90) {goUndo();}
    if (e.ctrlKey && myKey === 89) {goRedo();}
  }

  reDo();
} // end init

function resize() {
  var d = document.getElementById("canvasDiv");
  d.style.maxHeight= window.innerHeight-195 + "px";
  d.style.height = window.innerHeight-195 + "px";
  d.style.maxWidth= window.innerWidth-180 + "px";
  d.style.width= window.innerWidth-180 + "px";
  if (img) { draw(); }
  else {
    var c = document.getElementById("myCanvas");
    var context = c.getContext("2d");
    c.height = (window.innerHeight-220);
    c.width = (window.innerWidth-205);
    scrCenterX = Math.round(c.width/2);
    scrCenterY =Math.round(c.height/2);
    draw(); }
}

function setAtom(newType) {
  atomType = newType;
  reDo();
}

function reDo() {
  document.getElementById("label1").textContent = "Input 1";
  document.getElementById("label2").textContent = "Input 2";
  document.getElementById("label3").textContent = "Input 3";
  document.getElementById("label4").textContent = "Input 4";
  document.getElementById("label5").textContent = "Input 5";
  document.getElementById("label6").textContent = "Input 6";
  document.getElementById("label7").textContent = "Input 7";
  document.getElementById("label8").textContent = "Input 8";
  document.getElementById("label9").textContent = "Input 9";

  document.getElementById("input1").value = 0;
  document.getElementById("input2").value = 0;
  document.getElementById("input3").value = 0;
  document.getElementById("input4").value = 0;
  document.getElementById("input5").value = 0;
  document.getElementById("input6").value = 0;
  document.getElementById("input7").value = 0;
  document.getElementById("input8").value = 0;
  document.getElementById("input9").value = 0;

moveMat = [
    [1,0,0],
    [0,1,0],
    [0,0,1]
  ];
 
  changeOrb();
} // end reDo()

function changeOrb() {
  let myOrb = document.getElementById("setOrb").value;
  switch(myOrb) {
    case "orbnxx": 
      orbnxx();
      break;
    case "orbon": 
      orbon();
      break;
    case "orbmnsp": 
      orbmnsp();
      break;
    case "orbssnsmp": 
      orbssnsmp();
      break;
  } // end switch

  draw();
} // end changeOrb()

function orbnxx() {
  document.getElementById("label1").textContent = "cone";
  document.getElementById("label2").textContent = "x length 1";
  document.getElementById("label3").textContent = "x length 2";
  let input1 = Number(document.getElementById("input1").value);
  let input2 = Number(document.getElementById("input2").value);
  let input3 = Number(document.getElementById("input3").value);
  if (input1 == 0) {input1 = 3; document.getElementById("input1").value = 3;}
  if (input2 == 0) {input2 = 2; document.getElementById("input2").value = 2;}
  if (input3 == 0) {input3 = .6; document.getElementById("input3").value = 0.6;}

  document.getElementById("orbifold").value="" + input1 + "xx";

  maxT = 950;
  tileMethod = 1;

// from pillow = 1 angle
  let side1 = input2;
  let side2 = input3;
  let angle3 = Math.PI/input1;
  shape1 = solve1Ang(side1,side2,angle3);
  shape2 = solve1Ang(side2,side1,angle3);
  let myMat = isomSeg2Seg(shape2[4],shape2[0],shape1[4],shape1[3]);
  let newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),           
                   multMatVect(myMat,shape2[2]),multMatVect(myMat,shape2[3]),multMatVect(myMat,shape2[4])];
  funDom = [newShape2[1],newShape2[2],newShape2[3],newShape2[4],shape1[0],shape1[1],shape1[2],shape1[3]];
  genMats = [];

  myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[6],funDom[5]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[1],funDom[2],funDom[4],funDom[5]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[2],funDom[3],funDom[4],funDom[3]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[3],funDom[4],funDom[3],funDom[2]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[4],funDom[5],funDom[1],funDom[2]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[5],funDom[6],funDom[1],funDom[0]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[7],funDom[6],funDom[0],funDom[7]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[0],funDom[7],funDom[7],funDom[6]);
  genMats.push(myMat);


  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));

  tileIt();
} // end orbnxx()

function orbon() {
  document.getElementById("label1").textContent = "cone";
  document.getElementById("label2").textContent = "o length";
  document.getElementById("label3").textContent = "not used???";
  document.getElementById("label4").textContent = "o twist";
  let input1 = Number(document.getElementById("input1").value);
  let input2 = Number(document.getElementById("input2").value);
  let input3 = Number(document.getElementById("input3").value);
  let input4 = Number(document.getElementById("input4").value);
  if (input1 + input2 + input3 + input4 == 0) {
    input1 = 3; document.getElementById("input1").value = 3;
    input2 = 1; document.getElementById("input2").value = 1;
    input3 = .6; document.getElementById("input3").value = 0.6;
    input4 = .2; document.getElementById("input4").value = 0.2;
  }

  document.getElementById("orbifold").value="o" + input1;

  maxT = 150;
  tileMethod = 1;

// from pillow - 1 angle. Needs twist
  let side1 = input2;
  let side2 = input2;
  let angle3 = Math.PI/input1;
  let twist = input4 - Math.floor(input4);
  let shape1 = solve1Ang(side1,side2,angle3);
  let shape2 = solve1Ang(side2,side1,angle3);
  let myMat = isomSeg2Seg(shape2[1],shape2[2],shape1[2],shape1[1]);
  let newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),           
                   multMatVect(myMat,shape2[2]),multMatVect(myMat,shape2[3]),multMatVect(myMat,shape2[4])];
  funDom = [newShape2[3],newShape2[4],newShape2[0],shape1[3],shape1[4],shape1[0]];
  let twistDistance = twist*hDist(funDom[2],funDom[3]);

  genMats = [];
  myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[5],funDom[4]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[1],funDom[2],funDom[4],funDom[3]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[2],funDom[3],funDom[0],funDom[5]);
  let twistMat = transPtDist2PtMat(-twistDistance,funDom[5],funDom[0]);
  genMats.push(multMatMat(twistMat,myMat));
  myMat = isomSeg2Seg(funDom[3],funDom[4],funDom[2],funDom[1]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[4],funDom[5],funDom[1],funDom[0]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[5],funDom[0],funDom[3],funDom[2]);
  twistMat = transPtDist2PtMat(twistDistance,funDom[3],funDom[2]);
  genMats.push(multMatMat(twistMat,myMat));

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));

  tileIt();
} // end orbon()

function orbmnsp() {
  document.getElementById("label1").textContent = "cone";
  document.getElementById("label2").textContent = "cone";
  document.getElementById("label3").textContent = "corner";
  document.getElementById("label4").textContent = "length";
  document.getElementById("label5").textContent = "length";
  let input1 = Number(document.getElementById("input1").value);
  let input2 = Number(document.getElementById("input2").value);
  let input3 = Number(document.getElementById("input3").value);
  let input4 = Number(document.getElementById("input4").value);
  let input5 = Number(document.getElementById("input5").value);
  if (input1 == 0) {input1 = 3; document.getElementById("input1").value = 3;}
  if (input2 == 0) {input2 = 5; document.getElementById("input2").value = 5;}
  if (input3 == 0) {input3 = 4; document.getElementById("input3").value = 4;}
  if (input4 == 0) {input4 = 1.2; document.getElementById("input4").value = 1.2;}
  if (input5 == 0) {input5 = 1.1; document.getElementById("input5").value = 1.1;}

  document.getElementById("orbifold").value="" + input1 + input2 + "*" + input3;

  maxT = 150;
  tileMethod = 1;

// hat redoing
  let angle1 = Math.PI/input2;
  let side2 = input4;
  let shape1 = solve2Ang(side2/2,Math.PI/2,angle1);
  let shape2 = solve2Ang(side2/2,angle1,Math.PI/2);

// hat redoing
  angle1 = Math.PI/input1;
  side2 = input5;
  let shape3 = solve2Ang(side2/2,Math.PI/2,angle1);
  let shape4 = solve2Ang(side2/2,angle1,Math.PI/2);

// sheet   case 5: one angle
  let shape5 = solve1Ang(input5,input4,Math.PI/input3);

  let myMat = isomSeg2Seg(shape2[1],shape2[2],shape1[0],shape1[3]);
  let newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),           
                   multMatVect(myMat,shape2[2]),multMatVect(myMat,shape2[3])];
  let newShape1n2 = [newShape2[0],shape1[1],shape1[2],shape1[3],newShape2[3]];

  myMat = isomSeg2Seg(shape4[1],shape4[2],shape3[0],shape3[3]);
  let newShape4 = [multMatVect(myMat,shape4[0]),multMatVect(myMat,shape4[1]),           
                   multMatVect(myMat,shape4[2]),multMatVect(myMat,shape4[3])];
  let newShape3n4 = [newShape4[0],shape3[1],shape3[2],shape3[3],newShape4[3]];
 
  myMat = isomSeg2Seg(shape5[3],shape5[2],newShape1n2[0],newShape1n2[1]);  
  let newShape5 = [multMatVect(myMat,shape5[0]),multMatVect(myMat,shape5[1]),           
                   multMatVect(myMat,shape5[2]),multMatVect(myMat,shape5[3]),multMatVect(myMat,shape5[4])];
 
  myMat = isomSeg2Seg(newShape3n4[1],newShape3n4[0],newShape5[0],newShape5[1]);  
  let newerShape3n4 = [multMatVect(myMat,newShape3n4[0]),multMatVect(myMat,newShape3n4[1]),           
                       multMatVect(myMat,newShape3n4[2]),multMatVect(myMat,newShape3n4[3]),multMatVect(myMat,newShape3n4[4])];

  funDom = [newShape1n2[3],newShape1n2[4],newShape5[4],newerShape3n4[2],newerShape3n4[3],newerShape3n4[4],newShape1n2[2]];

  genMats = [];

  myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[0],funDom[6]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[1],funDom[2],funDom[1],funDom[2]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[2],funDom[3],funDom[2],funDom[3]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[3],funDom[4],funDom[5],funDom[4]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[4],funDom[5],funDom[4],funDom[3]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[5],funDom[6],funDom[5],funDom[6]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[6],funDom[0],funDom[1],funDom[0]);
  genMats.push(myMat);

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));

  tileIt();
} // end orbmnsp()


function orbssnsmp() {
  document.getElementById("label1").textContent = "cone";
  document.getElementById("label2").textContent = "cone";
  document.getElementById("label3").textContent = "cone";
  document.getElementById("label4").textContent = "length";
  document.getElementById("label5").textContent = "length";
  document.getElementById("label6").textContent = "length";
  document.getElementById("label7").textContent = "length";
  document.getElementById("label8").textContent = "length";
  document.getElementById("label9").textContent = "length";
  let input1 = Number(document.getElementById("input1").value);
  let input2 = Number(document.getElementById("input2").value);
  let input3 = Number(document.getElementById("input3").value);
  let input4 = Number(document.getElementById("input4").value);
  let input5 = Number(document.getElementById("input5").value);
  let input6 = Number(document.getElementById("input6").value);
  let input7 = Number(document.getElementById("input7").value);
  let input8 = Number(document.getElementById("input8").value);
  let input9 = Number(document.getElementById("input9").value);
  if (input1 == 0) {input1 = 3; document.getElementById("input1").value = 3;}
  if (input2 == 0) {input2 = 4; document.getElementById("input2").value = 4;}
  if (input3 == 0) {input3 = 5; document.getElementById("input3").value = 5;}
  if (input4 == 0) {input4 = 1; document.getElementById("input4").value = 1;}
  if (input5 == 0) {input5 = 1; document.getElementById("input5").value = 1;}
  if (input6 == 0) {input6 = 2; document.getElementById("input6").value = 2;}
  if (input7 == 0) {input7 = 2; document.getElementById("input7").value = 2;}
  if (input8 == 0) {input8 = 2; document.getElementById("input8").value = 2;}
  if (input9 == 0) {input9 = 2; document.getElementById("input9").value = 2;}

  document.getElementById("orbifold").value="**" + input1 + "*" + input2 + input3;

  maxT = 950;
  tileMethod = 1;

// from sheet - 0 angle.
  let shape1 = solve0Ang(input6,input5,input4);
  let shape2 = solve0Ang(input7,input6,input4);
  let shape3 = solve1Ang(input8,input7,Math.PI/input1);
  let shape4 = solve0Ang(input9,input8,input5);
  let shape5 = solve2Ang(input9,Math.PI/input2,Math.PI/input3);


  let myMat = isomSeg2Seg(shape2[2],shape2[3],shape1[1],shape1[0]);
  let newShape2 = [multMatVect(myMat,shape2[0]),multMatVect(myMat,shape2[1]),multMatVect(myMat,shape2[2]),           
                   multMatVect(myMat,shape2[3]),multMatVect(myMat,shape2[4]),multMatVect(myMat,shape2[5])];
  myMat = isomSeg2Seg(shape3[2],shape3[3],newShape2[1],newShape2[0]);
  let newShape3 = [multMatVect(myMat,shape3[0]),multMatVect(myMat,shape3[1]),multMatVect(myMat,shape3[2]),           
                   multMatVect(myMat,shape3[3]),multMatVect(myMat,shape3[4])];
  myMat = isomSeg2Seg(shape4[2],shape4[3],newShape3[1],newShape3[0]);
  let newShape4 = [multMatVect(myMat,shape4[0]),multMatVect(myMat,shape4[1]),multMatVect(myMat,shape4[2]),           
                   multMatVect(myMat,shape4[3]),multMatVect(myMat,shape4[4]),multMatVect(myMat,shape4[5])];
  myMat = isomSeg2Seg(shape5[0],shape5[1],newShape4[1],newShape4[0]);
  let newShape5 = [multMatVect(myMat,shape5[0]),multMatVect(myMat,shape5[1]),multMatVect(myMat,shape5[2]),           
                   multMatVect(myMat,shape5[3])];

  funDom = [shape1[2],shape1[3],shape1[4],shape1[5],newShape2[4],newShape2[5],newShape3[4],newShape4[4],newShape4[5],newShape5[2],newShape5[3]];

  genMats = [];
  myMat = isomSeg2Seg(funDom[0],funDom[1],funDom[8],funDom[7]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[1],funDom[2],funDom[1],funDom[2]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[2],funDom[3],funDom[5],funDom[4]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[3],funDom[4],funDom[3],funDom[4]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[4],funDom[5],funDom[3],funDom[2]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[5],funDom[6],funDom[5],funDom[6]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[6],funDom[7],funDom[6],funDom[7]);
  genMats.push(myMat);
  myMat = isomSeg2Seg(funDom[7],funDom[8],funDom[1],funDom[0]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[8],funDom[9],funDom[8],funDom[9]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[9],funDom[10],funDom[9],funDom[10]);
  genMats.push(myMat);
  myMat = isomSeg2SegFlip(funDom[10],funDom[0],funDom[10],funDom[0]);
  genMats.push(myMat);

  funDomMoreVert = polyMoreVert(funDom);
  funDomCent = hNorm(avePts(funDom));

  tileIt();
} // end orbssnsmp()


function tileIt() {
  let genLeng = genMats.length;
  matList = [];
  centList = [];
  if (tileMethod === 1) { // all within some radius
    matList.push([
      [1,0,0],
      [0,1,0],
      [0,0,1]
    ]);
    centList.push(funDomCent);
    let matIndex = 0;
    let matMax = matList.length;
//alert("mid tileIt");
    while (matIndex <= matMax) {
      for (let i = 0;i<genLeng;i++) {
        let newMat = multMatMat(genMats[i],matList[matIndex]);
        let newCent = multMatVect(newMat,funDomCent);
        if (newCent[0] < maxT) {
          let isNew = 1;
          for (j=0;j<matMax;j++) {
            let thisDist = hDist(centList[j],newCent);
            if (thisDist < 0.001) {
              isNew = 0;
            } // end if
          } // end j loop
          if (isNew === 1) {
            centList.push(newCent);
            matList.push(newMat);
            matMax++;
          } // end if
        } // end in bounds
      } // end i loop
      matIndex++;
//alert([matMax,matIndex]); // this counts up to about 300 then stops.
    } // end while loop
//alert("end tile meth 1"); // this one never showed up
  } // end tile method 1
  else // other tile method - layers of tiles 
  {
//alert("tile method 2");
    matList.push([
      [1,0,0],
      [0,1,0],
      [0,0,1]
    ]);
    for (let i = 0;i<genLeng;i++) {
      matList.push(genMats[i]);
      centList.push(multMatVect(genMats[i],funDomCent));

      for (let j = 0;j<genLeng;j++) {
        let newMat = multMatMat(genMats[i],genMats[j]);
        matList.push(newMat);
        centList.push(multMatVect(newMat,funDomCent));

        for (let k = 0;k<genLeng;k++) {
          let newMat = multMatMat(multMatMat(genMats[i],genMats[j]),genMats[k]);
          matList.push(newMat);
          centList.push(multMatVect(newMat,funDomCent));
        } // end k loop

      } // end j loop

    } // end i loop
  } // end tile method2

  draw(); // it never gets here
} // end tileIt()

// this is for three real angles of a triangle.
function solve3Ang(alpha, beta, gamma) {
  beta = -beta;
  let sideC = [0,1,0];
  let sideB = [0,Math.cos(alpha),Math.sin(alpha)];
  let sideAY = (Math.cos(gamma)+Math.cos(alpha)*Math.cos(beta))/Math.sin(alpha);
  let sideAX = Math.cos(beta);
  let sideA = [-Math.sqrt(sideAX*sideAX+sideAY*sideAY-1),sideAX,-sideAY];
  let vertAlpha = hNorm(cross(tRef(sideB),tRef(sideC)));
  let vertBeta = hNorm(cross(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(cross(tRef(sideA),tRef(sideB)));
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
  let segAlpha = hNorm(cross(tRef(sideB),tRef(sideC)));
  let vertBeta = hNorm(cross(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(cross(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(cross(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(cross(tRef(segAlpha),tRef(sideB)));
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
  let segAlpha = hNorm(cross(tRef(sideB),tRef(sideC)));
  let segBeta = hNorm(cross(tRef(sideC),tRef(sideA)));
  let vertGamma = hNorm(cross(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(cross(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(cross(tRef(segAlpha),tRef(sideB)));
  let vertBetaA = hNorm(cross(tRef(segBeta),tRef(sideA)));
  let vertBetaC = hNorm(cross(tRef(segBeta),tRef(sideC)));
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
  let segAlpha = hNorm(cross(tRef(sideB),tRef(sideC)));
  let segBeta = hNorm(cross(tRef(sideC),tRef(sideA)));
  let segGamma = hNorm(cross(tRef(sideA),tRef(sideB)));
  let vertAlphaC = hNorm(cross(tRef(segAlpha),tRef(sideC)));
  let vertAlphaB = hNorm(cross(tRef(segAlpha),tRef(sideB)));
  let vertBetaA = hNorm(cross(tRef(segBeta),tRef(sideA)));
  let vertBetaC = hNorm(cross(tRef(segBeta),tRef(sideC)));
  let vertGammaA = hNorm(cross(tRef(segGamma),tRef(sideA)));
  let vertGammaB = hNorm(cross(tRef(segGamma),tRef(sideB)));
//alert([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGammaA,vertGammaB]);
  return([vertAlphaB,vertAlphaC,vertBetaC,vertBetaA,vertGammaA,vertGammaB]);
}


// hyperbolic stuff

// hyperbolic dot product (bilinear form)
function hDot(P,Q) {
   return(-P[0]*Q[0]+P[1]*Q[1]+P[2]*Q[2]);
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

// normalized hyperbolic dot product
function normHDot(P,Q) {
   return(Math.abs(hDot(P,Q))/Math.sqrt(Math.abs(hDot(P,P)*hDot(Q,Q))));
}

// P - Q
function vectMinus(P,Q) {
  return([P[0]-Q[0],P[1]-Q[1],P[2]-Q[2]]);
}

// P + Q
function vectPlus(P,Q) {
  return([P[0]+Q[0],P[1]+Q[1],P[2]+Q[2]]);
}

// which point type? -1 is a point, 0 is an ideal point at infinity, 1 is for a line.
function vectType(P) {
  let type = 1;
  let inner = hDot(P,P);
  if (Math.abs(inner) < epsilon) {type = 0}
  else if (inner < 0) {type = -1}
  return (type); 
}

// checks if a point P is incident on a line L. P may be ideal.
function isIncident(P,L) {
  let incident = 0;
  if (Math.abs(hDot(P,L)) < epsilon) {incident = 1}
  return(incident); 
}

// checks if two lines intersect
function isIntersecting(L,M) {
  let perpVect = cross(L,M);
  return(hDot(perpVect,perpVect) <= epsilon);
}

// return a line through two hyperbolic points. (given by the complement of a vector normal to plane.)
function points2Line(P,Q) {
  let dist = hDist(P,Q);
  let line = tRef(cross(P,Q));
  line[0] = line[0]/Math.sinh(dist);
  line[1] = line[1]/Math.sinh(dist);
  line[2] = line[2]/Math.sinh(dist);
 // may need to multiply by -1 at times?...Or do I care which vector?
  return(line);
}

// this finds the angle between two lines. We don't check that they intersect.
function findAngle(L,M) {
  return(Math.acos(normHDot(L,M)));
}

// this finds the distance between two lines that don't intersect. We don't check they don't intersect.
function findLineDist(L,M) {
  return(Math.acosh(normHDot(L,M)));
}

// hyperbolic distance between two points
function hDist(P,Q) {
  let N = Math.abs(hDot(P,Q))/Math.sqrt(Math.abs(hDot(P,P)*hDot(Q,Q)));
  if (N < 1) {N += epsilon}
  let dist = Math.acosh(N);
  return(dist);
}

// hyperbolic distance from a point to a line
function hDistPt2Line(P,L) {
  return(Math.asinh(normHDot(P,L)));
}

// average list of points
function avePts(ptList) {
  let polyLeng = ptList.length;
  let tSum = 0;
  let xSum = 0;
  let ySum = 0;
  for (let i = 0;i<polyLeng;i++) {
    tSum += ptList[i][0];
    xSum += ptList[i][1];
    ySum += ptList[i][2];
  }
  return([tSum/polyLeng,xSum/polyLeng,ySum/polyLeng]);
}

// reflect over xy plane: t = -t.
function tRef(P) {
  return([-P[0],P[1],P[2]]);
}

// reflect a point P over a line L
function reflPtOverLine(P,L) {
  return(vectMinus(P, scalarVect(-2*hDot(P,L)/hDot(L,L),L)));
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
// I wrote a different version. It's down a few functions
// better use the other one. This one is just p-gon meeting q at a vertex.
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

// find in between points on reg. polygon edges. also only p-gons with q at a vertex.
function regPolyMoreVert(P,Q) {
  let extra = 5; // number of points to add per edge
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

// this one finds a regular n-gon given center and vertex.
function regPoly(center, vertex, n) {
  let myAngle = 2*Math.PI/n;
  let myVertList = [];
  let nextVert = vertex;
  let myRotMat = rotMat(center,myAngle);
  for (let i = 0; i< n+1; i++) {
    myVertList.push(nextVert);
    nextVert = multMatVect(myRotMat, nextVert);
  }
  return(myVertList);
}

// find in between points on polygon edges.
function polyMoreVert(vertices) {
  let extra = 5; // number of points to add per edge
//  let vertices = regPolyVertices(P,Q);
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

// Weierstrass Coordinates to hemisphere model
function WC2Hemi(P) {
  let newX = P[1]/P[0];
  let newY = P[2]/P[0];
  let newZ = Math.sqrt(1-(P[1]*P[1]+P[2]*P[2])/(P[0]*P[0]));
  return([newX,newY,newZ]);
}

// Weierstrass Coordinates to Klein model
function WC2Klein(P) {
  let newX = P[1]/P[0];
  let newY = P[2]/P[0];
  return([newX,newY]);
}

// Weierstrass Coordinates to Poincare disk model
function WC2PoinDisk(P) {
  let newX = P[1]/(P[0]+1);
  let newY = P[2]/(P[0]+1);
  return([newX,newY]);
}

// Weierstrass Coordinates to half plane model
function WC2HalfPlane(P) {
  let newX = 2*P[0]/(P[0]+P[1])*Math.sqrt(1-(P[1]*P[1]+P[2]*P[2])/(P[0]*P[0]))
  let newY = 2*P[2]/(P[0]+P[1]);
  return([newX,newY]);
}

// Weierstrass Coordinates to Free model. If free = 0, Klein. If free = 1, Poin. Disk. Try free > 1.
function WC2Free(P,free) {
  let newX = P[1]/(P[0]+free);
  let newY = P[2]/(P[0]+free);
  return([newX,newY]);
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

function normalize(P) {
  let denom = Math.sqrt(P[0]*P[0]+P[1]*P[1]+P[2]*P[2]);
  return([P[0]/denom,P[1]/denom,P[2]/denom]);
}

/*
// huh? what function name?
function hNormjpart2(P) {
  let k = 1/Math.sqrt(Math.abs(hDot(P,P)));
  return(scalarVect(k,P)); 
}
*/

function scalarVect(scal, vect) {
  return([vect[0]*scal,vect[1]*scal,vect[2]*scal]);
}

// multiply a matrix times a (column) vector to get a vector.
function multMatVect(mat, vect) {
  var v1 = vect[0]*mat[0][0]+vect[1]*mat[0][1]+vect[2]*mat[0][2];
  var v2 = vect[0]*mat[1][0]+vect[1]*mat[1][1]+vect[2]*mat[1][2];
  var v3 = vect[0]*mat[2][0]+vect[1]*mat[2][1]+vect[2]*mat[2][2];
  return([v1,v2,v3]);
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

// return a matrix that will switch points P and Q by reflection
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

// return inverse of a matrix. Check it works...
function invMat(m) {
    // m is a 2D array: [[a, b, c], [d, e, f], [g, h, i]]
    let a = m[0][0], b = m[0][1], c = m[0][2];
    let d = m[1][0], e = m[1][1], f = m[1][2];
    let g = m[2][0], h = m[2][1], i = m[2][2];

    let det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

    if (det === 0) {
        return null; // Matrix is not invertible
    }

    let invdet = 1 / det;
    
    // Calculate the adjugate matrix and multiply by 1/det
    let inv = [];
    inv[0] = [(e * i - f * h) * invdet, (c * h - b * i) * invdet, (b * f - c * e) * invdet];
    inv[1] = [(f * g - d * i) * invdet, (a * i - c * g) * invdet, (c * d - a * f) * invdet];
    inv[2] = [(d * h - e * g) * invdet, (b * g - a * h) * invdet, (a * e - b * d) * invdet];

    return inv;
}



// rotate about the origin by angle theta
function rotOrigMat(theta) {
  return([[1,0,0],[0,Math.cos(theta),-Math.sin(theta)],[0,Math.sin(theta),Math.cos(theta)]]);
}

// rotate about P by angle theta
function rotMat(P, theta) {
  if (P == [1,0,0]) { return rotOrigMat(theta) }
  else {
    let mat1 = hFlipMat(P,[1,0,0]);
    let mat2 = rotOrigMat(-theta);
    let mat3 = multMatMat(mat1,multMatMat(mat2,mat1));
    return(mat3);
  }
}

// translate from [1,0,0] to P
function transOrigMat(P) {
  return([[P[0],P[1],P[2]],
	[P[1],P[1]*P[1]/(P[0]+1)+1,P[1]*P[2]/(P[0]+1)],
	[P[2],P[1]*P[2]/(P[0]+1),P[2]*P[2]/(P[0]+1)+1]]);
}

// translate from P to Q.
function transMat(P,Q) {
  let pRefl = [];
  if (hDist(P,[1,0,0]) < epsilon) {
    pRefl =  hReflMat([0,1,0]);
  } else {
    pRefl = hFlipMat(P,[1,0,0]);
  }
  let newQ = multMatVect(pRefl,Q);
  let trans1 = transOrigMat(newQ);
  let trans = multMatMat(pRefl,multMatMat(trans1,pRefl));
  return(trans);
}

// translate distance d in positive x direction from <1,0,0>
function transOrigDistMat(d) {
  let myMat = [
    [Math.cosh(d), Math.sinh(d),0],
    [Math.sinh(d), Math.cosh(d),0],
    [0,0,1]
  ];
  return(myMat);
}

// translate distance d from P towards Q.
function transPtDist2PtMat(d,P,Q) {
  let myDist = hDist(P,Q);
  let xMat = transOrigMat(P);
  let QPrimeMat = multMatMat(xMat,transOrigDistMat(myDist));
  let QPrime = multMatVect(QPrimeMat,[1,0,0]);
  let yMat = hFlipMat(Q,QPrime); // this will fix P as it is equal distance to Q and Q'
  let yxMat = multMatMat(yMat,xMat); // this maps origin to P and some pt on positive x axis to Q
  let yxMatInv = invMat(yxMat);
  let zMat = transOrigDistMat(d);
  let finalMat = multMatMat(yxMat,multMatMat(zMat,yxMatInv));
  return(finalMat);
}

// direct isometry from segment PQ to segment RS. Length must be the same and > 0.
function isomSeg2Seg(P,Q,R,S) {
//alert(JSON.stringify([P,Q,R,S]));
  let result = [];
  let reflMat1,reflMat2,pointDiff1,pointDiff2,linePQ,lineRS,QPrime;
  if (Math.abs(hDist(P,Q)-hDist(R,S)) >= epsilon) { alert("isomSeg2Seg Error. Don't match!"); return("no"); }
  else {
    if (hDist(P,R)<epsilon) { // Here P=R
      if (hDist(Q,S)<epsilon) { // Here Q=S - so segments match.
        result = [
          [1,0,0],
          [0,1,0],
          [0,0,1]
        ];
        return(result);
      } // end segments match
      reflMat1 = hFlipMat(Q,S);
      lineRS = points2Line(R,S);
      reflMat2 = hReflMat(lineRS);
      result = multMatMat(reflMat2,reflMat1);
      return(result);
    } // end P=R

    pointDiff1 = vectMinus(P,R); 
// need more help if pointDiff1 is idea
    reflMat1 = hReflMat(pointDiff1);
    QPrime = multMatVect(reflMat1,Q);
    pointDiff2 = vectMinus(S,QPrime);
// need more help if pointDiff2 is ideal.
    reflMat2 = hReflMat(pointDiff2);
//alert(JSON.stringify([S,QPrime,hDist(S,QPrime)])); // once the hDist was .0004 so passed.
//    if (hDist(S,QPrime)<epsilon) { // Here S=Q' (this one fails at times.)
// Do I need to change others to match this?
if (Math.abs(pointDiff2[0])+Math.abs(pointDiff2[1])+Math.abs(pointDiff2[2])<epsilon) { // Here S=Q'
      lineRS = points2Line(R,S);
      reflMat2 = hReflMat(lineRS);
    }
    result = multMatMat(reflMat2,reflMat1);
    return(result);
  } // end same length
} // end isomSeg2Seg()



// orientation reversing isometry from segment PQ to segment RS. Length must be the same and > 0.
function isomSeg2SegFlip(P,Q,R,S) {
  if (Math.abs(hDist(P,Q)-hDist(R,S)) >= epsilon) { alert("isomSeg2SegFlip error. don't match"); return("no"); }
  else {
    let baseMat = isomSeg2Seg(P,Q,R,S);
    let perpVect = points2Line(R,S);
    let reflMat = hReflMat(perpVect);
    return(multMatMat(reflMat,baseMat));
  }
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

// divide the segment PQ. Add n points between them. (Evenly spaced.) return array of points.
function divSegReg(P,Q,n) {
  let direction = hNorm(vectMinus(Q,vectScalar(P,hDot(P,Q)/hDot(P,P))));
  let myDist = hDist(P,Q);
  let myList = [];
  for (let i = 0; i<n+2; i++) {
    let myStep = i/(n+1)*myDist;
    let nextPt = vectPlus(vectScalar(P,Math.cosh(myStep)),vectScalar(direction,Math.sinh(myStep)));
    myList.push(nextPt);
  }
  return(myList);
}

function goUndo() {
  if (stack.length> 0) {
    undoStack.push(stack.pop());
    draw();
  }
}

function goRedo() {
  if (undoStack.length> 0) {
    stack.push(undoStack.pop());
    draw();
  }
}

function goPng(el) {
  var c = document.getElementById("myCanvas");
  var imageURI = c.toDataURL("image/png");
  el.href = imageURI;
}

function setMode(newMode) {
  posA=0;
  posB=0;
  mode = newMode;
  if (newMode ===3) {mode = document.getElementById("ngon").value;}
  draw();
}

function setSymN() {
  if (orbi > 7) {myRot = document.getElementById("symN").value;}
}

function setNgon() {
  if (mode > 2) {mode = document.getElementById("ngon").value;}
}

function setColor() {
  color=document.getElementById("color").value;
}

function setFill() {
  fill = 0;
  if (document.getElementById("fill").checked) {fill=1;}
}

function setSnap() {
//  snap=document.getElementById("snap").checked;
//  alert(snap); UNNEEDED
}


function txtToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: "text/plain", endings: "native"});
  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
} // end txtToFile()

function svgToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: "image/svg+xml", endings: "native"});
  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
} // end svgToFile()


function saveSVG() {
  var c = document.getElementById("myCanvas");
  c.height = window.innerHeight-220;
  c.width = window.innerWidth-205;

  var asOutput = '<svg height="';
  asOutput = asOutput.concat(c.height);
  asOutput = asOutput.concat('" width="');
  asOutput = asOutput.concat(c.width);
  asOutput = asOutput.concat('">\r\n');
  asOutput = asOutput.concat();
  asOutput = asOutput.concat();
  asOutput = asOutput.concat();

  scrCenterX = Math.round(c.width/2);
  scrCenterY = Math.round(c.height/2);
  scrRadius = scrCenterY;

  // draw circle outline
  asOutput = asOutput.concat('<circle r="');
  asOutput = asOutput.concat(scrRadius);
  asOutput = asOutput.concat('" cx="');
  asOutput = asOutput.concat(scrCenterX);
  asOutput = asOutput.concat('" cy="');
  asOutput = asOutput.concat(scrCenterY);
  asOutput = asOutput.concat('" stroke="black" stroke-width="2" fill="white"/>\r\n');

  let polyLeng = matList.length;
  let moreVertices = funDomMoreVert;

  // draw fundamental domains
  for (let i = 0;i<polyLeng;i++) { // loop through matrices
    let newVertices = [];
    let thisMat = multMatMat(moveMat,matList[i]);

    moreVertices.forEach(function(vertex) {
      newVertices.push(multMatVect(thisMat, vertex));
    });
    let newCent = multMatVect(moveMat,centList[i]);

    // draw fundamental domains
    let morePolyLeng = moreVertices.length;
    scrVertices = ptList2Screen(newVertices,hZoom);

    asOutput = asOutput.concat('<path d="M ');
    asOutput = asOutput.concat(scrVertices[morePolyLeng-1][0]);
    asOutput = asOutput.concat(' ');
    asOutput = asOutput.concat(scrVertices[morePolyLeng-1][1]);

    scrVertices.forEach(function(vertex) {
      asOutput = asOutput.concat(' L ');
      asOutput = asOutput.concat(vertex[0]);
      asOutput = asOutput.concat(' ');
      asOutput = asOutput.concat(vertex[1]);
    });
    asOutput = asOutput.concat('"');

    // shade in just base F.D.
    if (i === 0) { 
      asOutput = asOutput.concat(' fill="beige"');
    } else {
      asOutput = asOutput.concat(' fill="white"');
    }
   
    asOutput = asOutput.concat(' stroke="lightgrey" stroke-width="1"/>\r\n');

    // centers of FDs
    scrVertices = ptList2Screen([newCent],hZoom);
    scrX = scrVertices[0][0];
    scrY = scrVertices[0][1];

    asOutput = asOutput.concat('<rect x="');
    asOutput = asOutput.concat(scrX-2);
    asOutput = asOutput.concat('" y="');
    asOutput = asOutput.concat(scrY-2);
    asOutput = asOutput.concat('" width="5" height="5" fill="red"/>\r\n');

  } // end i loop of matrices

  // draw saved shapes
  stack.forEach(function(nextShape) {
    if (nextShape[0] === 1) { // line
      let myPtList = divSeg([nextShape[1],nextShape[2],nextShape[3]],[nextShape[4],nextShape[5],nextShape[6]],5);
      scrVertices = ptList2Screen(myPtList,hZoom);
      let newVertices = [];
      for (let i = 0;i<polyLeng;i++) { // loop through matrices
        newVertices = [];
        let thisMat = multMatMat(moveMat,matList[i]);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(thisMat, vertex));
        });
        let newScrVertices = ptList2Screen(newVertices,hZoom);


        asOutput = asOutput.concat('<path d="M ');
        asOutput = asOutput.concat(newScrVertices[0][0]);
        asOutput = asOutput.concat(' ');
        asOutput = asOutput.concat(newScrVertices[0][1]);

        newScrVertices.forEach(function(vertex) {
         asOutput = asOutput.concat(' L ');
          asOutput = asOutput.concat(vertex[0]);
          asOutput = asOutput.concat(' ');
          asOutput = asOutput.concat(vertex[1]);
        });   
        asOutput = asOutput.concat('Z" stroke="');
        asOutput = asOutput.concat(nextShape[7]);
        asOutput = asOutput.concat('" stroke-width="1"/>\r\n');
      } // end i loop of matrices
    } // end line
    else { // poly
      let myPtList = regPoly([nextShape[1],nextShape[2],nextShape[3]],[nextShape[4],nextShape[5],nextShape[6]],nextShape[0]);
      myPtList =polyMoreVert(myPtList);
      scrVertices = ptList2Screen(myPtList,hZoom);
      newVertices = [];
      for (let i = 0;i<polyLeng;i++) { // loop through matrices
        newVertices = [];

        let thisMat = multMatMat(moveMat,matList[i]);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(thisMat, vertex));
        });
        let newScrVertices = ptList2Screen(newVertices,hZoom);

        asOutput = asOutput.concat('<path d="M ');
        asOutput = asOutput.concat(newScrVertices[0][0]);
        asOutput = asOutput.concat(' ');
        asOutput = asOutput.concat(newScrVertices[0][1]);

        newScrVertices.forEach(function(vertex) {
          asOutput = asOutput.concat(' L ');
          asOutput = asOutput.concat(vertex[0]);
          asOutput = asOutput.concat(' ');
          asOutput = asOutput.concat(vertex[1]);
        });   

        asOutput = asOutput.concat('Z"');
        if (nextShape[8]) { // fill
          asOutput = asOutput.concat(' fill="');
          asOutput = asOutput.concat(nextShape[7]);
          asOutput = asOutput.concat('" stroke="none" />\r\n');
        } else { // no fill
          asOutput = asOutput.concat(' stroke="');
          asOutput = asOutput.concat(nextShape[7]);
          asOutput = asOutput.concat('" stroke-width="1" fill="none"/>\r\n');
        }

      } // end i loop of matrices
    } // end poly
  }); // end loop of saved shapes
   
  asOutput = asOutput.concat('</svg>');
  svgToFile(asOutput,"myDesign","svg");

} // end saveSVG()


function saveDesign() {
  var asOutput = "orbi 1.0\r\n";
  asOutput = asOutput.concat('orbi = '+orbi+'\r\n');
  asOutput = asOutput.concat('H = '+H+'\r\n');
  asOutput = asOutput.concat('TranAx = '+TranAx+'\r\n');
  asOutput = asOutput.concat('TranAy = '+TranAy+'\r\n');
  asOutput = asOutput.concat('TranBx = '+TranBx+'\r\n');
  asOutput = asOutput.concat('TranBy = '+TranBy+'\r\n');
  asOutput = asOutput.concat('TranOrigx = '+TranOrigx+'\r\n');
  asOutput = asOutput.concat('TranOrigy = '+TranOrigy+'\r\n');
  asOutput = asOutput.concat('NumMaps = '+NumMaps+'\r\n');
  asOutput = asOutput.concat('stack:\r\n');

  stack.forEach(function(nextShape) {
    asOutput = asOutput.concat('' + nextShape[0] + ', ');
    asOutput = asOutput.concat('' + nextShape[1] + ', ');
    asOutput = asOutput.concat('' + nextShape[2] + ', ');
    asOutput = asOutput.concat('' + nextShape[3] + ', ');
    asOutput = asOutput.concat('' + nextShape[4] + ', ');
    asOutput = asOutput.concat('' + nextShape[5] + ', ');
    asOutput = asOutput.concat('' + nextShape[6] + '\r\n');
  });
  asOutput = asOutput.concat('end');
  txtToFile(asOutput,"myDesign","txt");
} // end saveDesign()

function loadDesign() {
//  var c = document.getElementById("myCanvas");
//  var context = c.getContext("2d");

  const file = document.getElementById("loadDesign").files[0];
  const reader = new FileReader();

  reader.addEventListener("load", function () {
    var lines = reader.result.split(/\r\n|\n/);
 //   init();

    var curLen = lines.length-1;
 //   var setPoly = 0;

    if (lines[0] != 'orbi 1.0') {
      alert("Wrong file format.");
    } else {
      var nextVar = lines[1].split("=");
      orbi = parseInt(nextVar[1]);
      switch (orbi) {
        case 1: 
          document.getElementById('astar732').checked = true;
          break;
        case 2: 
          document.getElementById('a732').checked = true;
          break;
        case 3: 
          document.getElementById('astar832').checked = true;
          break;
      }
      nextVar = lines[2].split("=");
      H = parseInt(nextVar[1]);
      nextVar = lines[3].split("=");
      TranAx = parseInt(nextVar[1]);
      nextVar = lines[4].split("=");
      TranAy = parseInt(nextVar[1]);
      nextVar = lines[5].split("=");
      TranBx = parseInt(nextVar[1]);
      nextVar = lines[6].split("=");
      TranBy = parseInt(nextVar[1]);
      nextVar = lines[7].split("=");
      TranOrigx = parseInt(nextVar[1]);
      nextVar = lines[8].split("=");
      TranOrigy = parseInt(nextVar[1]);
      nextVar = lines[9].split("=");
      NumMaps = parseInt(nextVar[1]);
      stack = [];
      for (i = 11;i<curLen;i++) {
        var nextStack = lines[i].split(",");
        var newMode = parseFloat(nextStack[0]);
        var newX1 = parseFloat(nextStack[1]);
        var newY1 = parseFloat(nextStack[2]);
        var newX2 = parseFloat(nextStack[3]);
        var newY2 = parseFloat(nextStack[4]);
        var newColor = nextStack[5];
        var newFill = parseFloat(nextStack[6]);
        stack.push([newMode,newX1,newY1,newX2,newY2,newColor,newFill]);
      } // end i loop through stack  
    } // end orbi 1.0 good format
    draw();
  },false);

  if (file) {
    reader.readAsText(file); 
  }

} // end loadDesign()

function mousePressed(event) {
//alert(mode);

  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
  posA = [canvasX,canvasY];
  posA3d = screen2Pt(posA,hZoom);

  if (mode === -1) { // pan - move view
    tempMat = moveMat;
  }

} // end mousePressed()

function mouseMoved(event) {
  var c = document.getElementById("myCanvas");
  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);
//  var shifty = event.shiftKey;
  posB = [canvasX,canvasY];
  posB3d = screen2Pt(posB,hZoom);
//  posB3d = screen2vect(canvasX,canvasY,shifty);

  if (mode === -1 && posA != 0) { // pan - translate view
    moveMat = multMatMat(transMat(posA3d,posB3d),tempMat);
    draw();
  } // end pan

//  if (mode === 1 && posA != 0) { // line 
//    draw();
//  } // end line

  if (mode === 0 && shapeNum >= 0) { // edit - move points around
    if (shapeNum === 0.5) { // move vector
      TranBy = posB[1]-TranOrigy;
      if (orbi === 9 || orbi === 13) {
        H = TranBy/2;
      }
      if (orbi > 15) {
        TranBx = posB[0]-TranOrigx;
      }
      if (orbi === 14 || orbi === 15) {
        TranAy = -TranBy;
      }
    } else { // move control point
      stack[shapeNum][controlPt] = posB[0];
      stack[shapeNum][controlPt+1] = posB[1];
    }
  } // end move pts around

  draw();
} // end mouseMoved()

function mouseClicked(event) {
//alert("huyh?");
}

function mouseReleased(event) {
 // shapeNum = -1; // we aren't moving control points around.
//alert(JSON.stringify(myColor));
//  if (mode > 0) { // end of drawing
//    undoStack = [];
//    stack.push([mode,posA3d[0],posA3d[1],posA3d[2],posB3d[0],posB3d[1],posB3d[2],color,fill]);
//  }

  if (mode === -1 && posA != 0) { // pan - translate view
    var c = document.getElementById("myCanvas");
    var cRect = c.getBoundingClientRect();        
    var canvasX = Math.round(event.clientX - cRect.left);  
    var canvasY = Math.round(event.clientY - cRect.top);
    posB = [canvasX,canvasY];
    posB3d = screen2Pt(posB,hZoom);
//alert(JSON.stringify([posA3d,posB3d]));
    moveMat = multMatMat(transMat(posA3d,posB3d),tempMat);
//  tempMat = []; // do I need this?
    posA = 0;
    posB = 0;
    posA3d=0;
    posB3d=0;
  } // end pan

  if (mode > 0) { // end of drawing line or poly.
    undoStack = [];
    let moveOrigin = multMatVect(moveMat, [1,0,0]);
    let moveOther = multMatVect(moveMat, [3,2,2]);
    let invMove = isomSeg2Seg(moveOrigin,moveOther,[1,0,0],[3,2,2]);
    if (Number.isNaN(invMove[0][0])) {invMove = [[1,0,0],[0,1,0],[0,0,1]];}
    posA3d = multMatVect(invMove,posA3d);
    posB3d = multMatVect(invMove,posB3d);
    stack.push([mode,posA3d[0],posA3d[1],posA3d[2],posB3d[0],posB3d[1],posB3d[2],color,fill]);
  }
  posA = 0;
  posB = 0;
  posA3d=0;
  posB3d=0;
  draw();
} // end mouseReleased()


function snapTo(checkX, checkY) {
  var newPoint = findCoords(TranOrigx, TranOrigy, TranAx, TranAy, TranBx, TranBy, checkX, checkY);
  movePt = [0,0];
  switch (orbi) {
    case 1: // *442
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-0.5,movePt);
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-0.5,movePt);
      movePt=checkLine(newPoint,0,1,-1,movePt);
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 2: // 442
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 3: // 4*2
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 4: // *632
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-1,movePt);
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);
      movePt=checkLine(newPoint,2,1,-1,movePt);
      movePt=checkLine(newPoint,1,2,-1,movePt);
      movePt=checkLine(newPoint,2,1,-2,movePt);
      movePt=checkLine(newPoint,1,2,-2,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 5: // *333
      movePt=checkLine(newPoint,2,1,-1,movePt);
      movePt=checkLine(newPoint,1,2,-1,movePt);
      movePt=checkLine(newPoint,2,1,-2,movePt);
      movePt=checkLine(newPoint,1,2,-2,movePt);
      movePt=checkLine(newPoint,1,-1,0,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 6: // 632
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 7: // 333
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 8: // 3*3
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-1,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.3333333333333333333,0.3333333333333333333,movePt);
      movePt=checkPoint(newPoint,0.6666666666666666666,0.6666666666666666666,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 9: // 22x
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 10: // *2222
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-0.5,movePt);
      movePt=checkLine(newPoint,1,0,-1,movePt);
      movePt=checkLine(newPoint,0,1,0,movePt); 
      movePt=checkLine(newPoint,0,1,-0.5,movePt);
      movePt=checkLine(newPoint,0,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 11: // 22*
      movePt=checkLine(newPoint,1,0,-0.25,movePt); 
      movePt=checkLine(newPoint,1,0,-0.75,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 12: // **
      movePt=checkLine(newPoint,1,0,0,movePt); 
      movePt=checkLine(newPoint,1,0,-0.5,movePt);
      movePt=checkLine(newPoint,1,0,-1,movePt);

      break;
    case 13: // xx

      break;
    case 14: // 2*22
      movePt=checkLine(newPoint,1,-1,0,movePt);
      movePt=checkLine(newPoint,1,1,-1,movePt);

      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 15: // *x
      movePt=checkLine(newPoint,1,1,-1,movePt);

      break;
    case 16: // 2222
      movePt=checkPoint(newPoint,0,0,movePt);
      movePt=checkPoint(newPoint,0,0.5,movePt);
      movePt=checkPoint(newPoint,0,1,movePt);
      movePt=checkPoint(newPoint,0.5,0,movePt);
      movePt=checkPoint(newPoint,0.5,0.5,movePt);
      movePt=checkPoint(newPoint,0.5,1,movePt);
      movePt=checkPoint(newPoint,1,0,movePt);
      movePt=checkPoint(newPoint,1,0.5,movePt);
      movePt=checkPoint(newPoint,1,1,movePt);
      break;
    case 17: // o

      break;
  } // end switch      
  return(movePt);
} //end snapTo()


function checkPoint(newPoint,Xcoord,Ycoord,movePt) {
  if (Math.abs((newPoint[0]-Xcoord)*TranAx+(newPoint[1]-Ycoord)*TranBx)< boxSize*2 && 
       Math.abs((newPoint[0]-Xcoord)*TranAy+(newPoint[1]-Ycoord)*TranBy)< boxSize*2) {
//    stationary = false;
    movePt = [(newPoint[0]-Xcoord)*TranAx+(newPoint[1]-Ycoord)*TranBx,
            (newPoint[0]-Xcoord)*TranAy+(newPoint[1]-Ycoord)*TranBy];
  }
  return(movePt);
}

function checkLine(newPoint,aa,bb,cc,movePt) {
// this will find if point on line aa*X + bb*Y + cc = 0 that is closest to newPoint
  var newX, newY;
  if (bb === 0) {
    newX = -cc/aa;
    newY = newPoint[1];
  } else {
    newX = -(aa*cc+aa*bb*newPoint[1]-bb*bb*newPoint[0])/(aa*aa+bb*bb);
    newY = (-cc-aa*newX)/bb;
  }

  var newMovePt = checkPoint(newPoint,newX,newY,movePt);
//alert([newX,newY,"*",newPoint,movePt,newMovePt]);
  return(newMovePt);
} // end checkLine()



function MapOne(myMap, myOrbi,x,y,z) {
//alert(myOrbi);
  var xOut, yOut, zOut;
  switch (myOrbi) {
    case 1: // *732
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 13:
          var newPt = reflect(symVects[1],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 14:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 15:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 16:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 17:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 18:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 19:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 20:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 21:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 22:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 23:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 24:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end *732
      break;  
    case 2: // 732
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z] ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.4*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],0.8*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.2*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],1.6*Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[2],Math.PI));
          newPt = multVectMat(newPt ,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end 732
      break;  
    case 3: // *832
      switch(myMap) {
        case 1:
          xOut = x;
          yOut = y;
          zOut = z;
          break;
        case 2:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 3:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 4:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 5:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 6:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 7:
          var newPt = reflect(symVects[1],[x,y,z]);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 8:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 9:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 10:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 11:
          var newPt = multVectMat([x,y,z],rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
        case 12:
          var newPt = multVectMat([x,y,z],rotMat(symVects[0],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI/2));
          newPt = multVectMat(newPt,rotMat(symVects[1],Math.PI));
          newPt = reflect(symVects[1],newPt);
          xOut = newPt[0];
          yOut = newPt[1];
          zOut = newPt[2];
          break;
      } // end *832
      break;  

  } // end switch(myOrbi)
  return([xOut,yOut,zOut]);

} // end MapOne









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



// draw segment. Not stand alone - part of polygon...?
function drawSeg(P,Q,context) {
  let lineVert = divSeg(P,Q,5);
  let polyLeng = lineVert.length;
  let scrVertices = ptList2Screen(lineVert,hZoom);
  scrVertices.forEach(function(vertex) {
    context.lineTo(vertex[0],vertex[1]);
  });
}


function seg3(context) {
  let p = 1;
  let alpha = 1;
  let r = Math.atanh(Math.tanh(p)/Math.cos(-alpha));
  let WC = polar2WC(r,0);
  let a = -.2;
let u = [0,-.172,2.828];
let v = [.2,.14,.0085];
  let nextPt = vectPlus(scalarVect(Math.sinh(a),u), scalarVect(Math.cosh(a),v));

  let newCoord = pt2Screen(nextPt, hZoom);
  context.beginPath();
  context.moveTo(newCoord[0],newCoord[1]);

    for (let w = a; w < .8; w += .1) {
    nextPt = vectPlus(scalarVect(Math.sinh(w),u), scalarVect(Math.cosh(w),v));
    newCoord = pt2Screen(nextPt, hZoom);
    context.lineTo(newCoord[0],newCoord[1]);
    context.stroke();

  }
    context.closePath();
}



function seg2(context) {
  let p = 1;
  let alpha = 1;
  let r = Math.atanh(Math.tanh(p)/Math.cos(-alpha));
  let WC = polar2WC(r,0);

  let newCoord = pt2Screen(WC, hZoom);
  context.moveTo(newCoord[0],newCoord[1]);
//  for (let theta = 0; theta < 1.5; theta += .1) {
    for (let theta = alpha-Math.PI/3; theta < alpha+Math.PI/3; theta += .1) {
    r = Math.atanh(Math.tanh(p)/Math.cos(theta-alpha));
    WC = polar2WC(r,theta);
    newCoord = pt2Screen(WC, hZoom);
    context.lineTo(newCoord[0],newCoord[1]);
    context.stroke();
  }
}


function txtToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: "text/plain", endings: "native"});
  
  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
};

function goSave() {
  asOutput = JSON.stringify(centList);
  asOutput = asOutput.concat("**");
  asOutput = asOutput.concat(JSON.stringify(matList));
  let thisFile = "myData";
  txtToFile(asOutput,thisFile,"txt");
}


function draw() {
//alert("draw");
  var c = document.getElementById("myCanvas");
  var context = c.getContext("2d");
  context.beginPath();
  context.rect(0,0,c.width,c.height);
  context.fillStyle = "white";
  context.fill();

  c.height = window.innerHeight-220;
  c.width = window.innerWidth-205;
  scrCenterX = Math.round(c.width/2);
  scrCenterY = Math.round(c.height/2);
//  scrRadius = Math.min(scrCenterX,scrCenterY)-5;

//  scrRadius = (scrCenterX+scrCenterY)/2;
  scrRadius = scrCenterY;

  var cRect = c.getBoundingClientRect();        
  var canvasX = Math.round(event.clientX - cRect.left);  
  var canvasY = Math.round(event.clientY - cRect.top);

  // draw circle outline
  context.beginPath();
  context.lineWidth = 2;
  context.arc(scrCenterX, scrCenterY,scrRadius,0,2*Math.PI);
  context.strokeStyle = "black";
  context.stroke();
  context.closePath();

  let polyLeng = matList.length;
//alert(JSON.stringify(matList));
//alert(JSON.stringify(funDom));

  // draw fundamental domains
  let moreVertices = funDomMoreVert;
  for (let i = 0;i<polyLeng;i++) { // loop through matrices
    let newVertices = [];
    let thisMat = multMatMat(moveMat,matList[i]);

    moreVertices.forEach(function(vertex) {
      newVertices.push(multMatVect(thisMat, vertex));
    });
    let newCent = multMatVect(moveMat,centList[i]);

    // draw fundamental domains
    let morePolyLeng = moreVertices.length;
    scrVertices = ptList2Screen(newVertices,hZoom);
    context.beginPath();
    context.moveTo(scrVertices[morePolyLeng-1][0],scrVertices[morePolyLeng-1][1]);
    scrVertices.forEach(function(vertex) {
      context.lineTo(vertex[0],vertex[1]);
    });
    context.strokeStyle = "lightgrey";
    context.stroke();
    // shade in just base F.D.
    if (i === 0) {context.fillStyle = "beige";     context.fill();}

    context.closePath();

    // centers of FDs
    scrVertices = ptList2Screen([newCent],hZoom);
    scrX = scrVertices[0][0];
    scrY = scrVertices[0][1];
    context.beginPath();
    context.rect(scrX-2,scrY-2,5,5);
    context.stroke();
    context.fillStyle = "red";
    context.fill();
    context.closePath();
  } // end i loop of matrices


  // draw saved shapes
  context.lineWidth = 1;
  stack.forEach(function(nextShape) {
    if (nextShape[0] === 1) { // line
      let myPtList = divSeg([nextShape[1],nextShape[2],nextShape[3]],[nextShape[4],nextShape[5],nextShape[6]],5);
      scrVertices = ptList2Screen(myPtList,hZoom);
      let newVertices = [];
      for (let i = 0;i<polyLeng;i++) { // loop through matrices
        newVertices = [];
        let thisMat = multMatMat(moveMat,matList[i]);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(thisMat, vertex));
        });
        let newScrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(newScrVertices[0][0],newScrVertices[0][1]);
        newScrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = nextShape[7];
        context.stroke();
        context.closePath();
      } // end i loop of matrices
    } // end line
    else { // poly
      let myPtList = regPoly([nextShape[1],nextShape[2],nextShape[3]],[nextShape[4],nextShape[5],nextShape[6]],nextShape[0]);
      myPtList =polyMoreVert(myPtList);
      scrVertices = ptList2Screen(myPtList,hZoom);
      newVertices = [];
      for (let i = 0;i<polyLeng;i++) { // loop through matrices
        newVertices = [];
        let thisMat = multMatMat(moveMat,matList[i]);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(thisMat, vertex));
        });
        let newScrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(newScrVertices[0][0],newScrVertices[0][1]);
        newScrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = nextShape[7];
        context.stroke();
        if (nextShape[8]) {
          context.fillStyle = nextShape[7];
          context.fill();
        }
        context.closePath();
      } // end i loop of matrices
    } // end poly
  }); // end loop of saved shapes
  

  // draw current line or poly
  for (let i = 0;i<polyLeng;i++) { // loop through matrices
    let newVertices = [];
    let thisMat = multMatMat(moveMat,matList[i]);
    if (posA3d != 0 && mode > 0) {
      if (mode == 1) {
        let myPtList = divSeg(posA3d,posB3d,5);
        let moveOrigin = multMatVect(moveMat, [1,0,0]);
        let moveOther = multMatVect(moveMat, [3,2,2]);
        let invMove = isomSeg2Seg(moveOrigin,moveOther,[1,0,0],[3,2,2]);
        if (Number.isNaN(invMove[0][0])) {invMove = [[1,0,0],[0,1,0],[0,0,1]];}
        newVertices = [];
        let myNextMat = multMatMat(thisMat,invMove);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(myNextMat, vertex));
        });
        scrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(scrVertices[0][0],scrVertices[0][1]);
        scrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = color;
        context.stroke();
        context.closePath();
      } // end current line
      else { // current poly
        let myPtList = regPoly(posA3d,posB3d,mode);
        myPtList =polyMoreVert(myPtList);
        let moveOrigin = multMatVect(moveMat, [1,0,0]);
        let moveOther = multMatVect(moveMat, [3,2,2]);
        let invMove = isomSeg2Seg(moveOrigin,moveOther,[1,0,0],[3,2,2]);
        if (Number.isNaN(invMove[0][0])) {invMove = [[1,0,0],[0,1,0],[0,0,1]];}
        newVertices = [];
        let myNextMat = multMatMat(thisMat,invMove);
        myPtList.forEach(function(vertex) {
          newVertices.push(multMatVect(myNextMat, vertex));
        });
        scrVertices = ptList2Screen(newVertices,hZoom);

        context.beginPath();
        context.moveTo(scrVertices[0][0],scrVertices[0][1]);
        scrVertices.forEach(function(vertex) {
          context.lineTo(vertex[0],vertex[1]);
        });
        context.strokeStyle = color;
        context.stroke();
        if (fill) {
          context.fillStyle = color;
          context.fill();
        }
        context.closePath();   
      } // end current poly
    } // end current stuff
  } // end i loop of matrices

} // end draw()
