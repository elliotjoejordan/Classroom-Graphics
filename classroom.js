//kbzh45
//creates vertex shader and fragment shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'varying vec4 v_Color;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  if(u_isLighting)\n' +
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' +
  '}\n';

var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// variables declared for matrices and angles for rotations etc
var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

var ANGLE_STEP = 3.0;
var g_xAngle = 0.0;
var g_yAngle = 0.0;
var doorAngle = 0.0;
var xStep = 0.0;
var zStep = 0.0;
var tuck = 0.0;

//Main function called immediately to initiate variables and canvas.
function main() {
  var canvas = document.getElementById('webgl');
  //Get canvas element from html and create canvas in the space

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('No rendering context');
    return;
  }
  //Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('No Shaders');
    return;
  }

  // Sets canvas colour (background)
  gl.clearColor(0.5, 0.7, 1.0, 1.0); // Blue sky outside classroom
  gl.enable(gl.DEPTH_TEST);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // initializes matrices for creating objects from gl
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting ) {
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Sets light colour and direction
  gl.uniform3f(u_LightColor, 0.972, 0.892, 0.858);
  var lightDirection = new Vector3([1.0, 2.0, 3.5]);
  lightDirection.normalize();
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Create view matrix and projection matrix
  viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  // onkeydown function recieves input from the keyboard
  document.onkeydown = function(ev){
      //Calls keydown function
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_LightColor);
  };
  //re-draws the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_LightColor) {
  switch (ev.keyCode) {
      //Four cases are arrow keys for rotating the scene for viewer
    case 38:
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 40:
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 37:
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 39:
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
      // D key turns out (down very low) teh lighting
    case 68:
        gl.uniform3f(u_LightColor, 0.2, 0.2, 0.2);
        break;
        // L key turns on the lights
    case 76:
        gl.uniform3f(u_LightColor, 0.972, 0.892, 0.858);
        break;
    case 69:
        // R key rotates the door closed
        if (doorAngle < 0){
            doorAngle = (doorAngle + ANGLE_STEP)%360;
            xStep = xStep+0.015;
            zStep = zStep-0.0165;
        }
        break;
    case 82:
        // E rotates the door open
        if (doorAngle > -90){
            doorAngle = (doorAngle - ANGLE_STEP)%360;
            xStep = xStep-0.015;
            zStep = zStep+0.0165;
        }
        break;
        // C key tucks or untucks teh chairs
    case 67:
        if (tuck<0){
            tuck = 0.0;
        }else{
            tuck = -0.2;
        }
        break;
    default: return;
  }
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}


function initVertexBuffers(gl) {
    // initializes the vertex buffers
  var vertices = new Float32Array([
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5
  ]);

  //Sets colour for drawing objects
  var colors = new Float32Array([
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05,
    0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05,
    0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05,
    0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05,
    0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05, 0.05,0.05,0.05
 ]);


  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0
  ]);



  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,
     4, 5, 6,   4, 6, 7,
     8, 9,10,   8,10,11,
    12,13,14,  12,14,15,
    16,17,18,  16,18,19,
    20,21,22,  20,22,23
 ]);

    // Initialize array buffers fro colour, position, normals
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Initialize index buffer
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

function initAxesVertexBuffers(gl) {

  var verticesColors = new Float32Array([
    // Vertex coordinates and color
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     0.0,  20.0,   0.0,  1.0,  1.0,  1.0,
     0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
     0.0,   0.0, -20.0,  1.0,  1.0,  1.0,
     0.0,   0.0,  20.0,  1.0,  1.0,  1.0
  ]);
  var n = 6;

  // Create a vertex color buffer
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);


  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

// Array for storing a matrix created, and function to store a matrix on the array
var g_matrixStack = [];
function pushMatrix(m) {
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

// Return a matrix from the array
function popMatrix() {
  return g_matrixStack.pop();
}

// Function to draw the scene
function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  // Clear color and depth
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  modelMatrix.setTranslate(0, 0, 0);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.uniform1i(u_isLighting, true);

  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  modelMatrix.setTranslate(0, 0, 0);
  modelMatrix.rotate(g_yAngle, 0, 1, 0);
  modelMatrix.rotate(g_xAngle, 1, 0, 0);

// Build room by calling and placing funcitons for room and furniture
  pushMatrix(modelMatrix);
    room(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    drawWindow(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    teacher(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    papers(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.975+xStep, -0.1, -3.45+zStep);
    modelMatrix.rotate(doorAngle, 0, 1, 0);
    door(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  for(i=-1; i<2; i++){
      for(j=-1; j<2; j++){
          pushMatrix(modelMatrix);
            modelMatrix.translate(1.5*i, 0, 1.5*j + 0.5);
            desk(gl, u_ModelMatrix, u_NormalMatrix, n);
          modelMatrix = popMatrix();

          pushMatrix(modelMatrix);
            modelMatrix.translate(1.5*i, 0, 1.5*j + 0.5);
            modelMatrix.translate(0, 0, tuck);
            chair(gl, u_ModelMatrix, u_NormalMatrix, n);
          modelMatrix = popMatrix();
      }
  }




}
//Creates door
function door(gl, u_ModelMatrix, u_NormalMatrix, n){
    //Defines new door colour
    var colors2 = new Float32Array([
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.15,0.15,0.2, 0.15,0.15,0.2, 0.15,0.15,0.2, 0.15,0.15,0.2,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.15,0.15,0.2, 0.15,0.15,0.2, 0.15,0.15,0.2, 0.15,0.15,0.2,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05
    ]);
    // New array buffer with new colour
    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

        // Door
        pushMatrix(modelMatrix);
          modelMatrix.scale(0.9, 1.8, 0.1);
          drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
        modelMatrix = popMatrix();
}

function teacher(gl, u_ModelMatrix, u_NormalMatrix, n){
    // Teachers Desk and Chair

          var colors2 = new Float32Array([
            0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,
            0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,
            0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,
            0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,
            0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,
            0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078,   0.462, 0.286, 0.078
          ]);

          initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)
    //Chair
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.5, -0.65, -3);
      modelMatrix.scale(0.4, 0.05, 0.4);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(1.5, -0.6, -3.2);
      modelMatrix.scale(0.4, 0.85, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(1.675, -0.85, -2.825);
      modelMatrix.scale(0.05, 0.4, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(1.325, -0.85, -2.825);
      modelMatrix.scale(0.05, 0.4, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
   //DESK
  pushMatrix(modelMatrix);
    modelMatrix.translate(1.5, -0.45, -2.5);
    modelMatrix.scale(1.4, 0.05, 0.6);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(1.5, -0.75, -2.25);
    modelMatrix.scale(1.375, 0.6, 0.05);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(0.85, -0.75, -2.75);
    modelMatrix.scale(0.05, 0.6, 0.05);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(2.15, -0.75, -2.75);
    modelMatrix.scale(0.05, 0.6, 0.05);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(2.15, -0.85, -2.5);
    modelMatrix.scale(0.05, 0.05, 0.45);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(0.85, -0.85, -2.5);
    modelMatrix.scale(0.05, 0.05, 0.45);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

}

function papers(gl, u_ModelMatrix, u_NormalMatrix, n){
    //White paper
    var colors2 = new Float32Array([
      1,1,1,   1,1,1,   1,1,1,   1,1,1,
      1,1,1,   1,1,1,   1,1,1,   1,1,1,
      1,1,1,   1,1,1,   1,1,1,   1,1,1,
      1,1,1,   1,1,1,   1,1,1,   1,1,1,
      1,1,1,   1,1,1,   1,1,1,   1,1,1,
      1,1,1,   1,1,1,   1,1,1,   1,1,1
   ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

    pushMatrix(modelMatrix);
      modelMatrix.translate(1.25, -0.425, -2.5);
      modelMatrix.scale(0.2, 0.02, 0.3);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
    // Green paper
    var colors2 = new Float32Array([
      0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,
      0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,
      0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,
      0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,
      0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,
      0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164,   0.219, 0.494, 0.164
   ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

    pushMatrix(modelMatrix);
      modelMatrix.translate(1.5, -0.425, -2.5);
      modelMatrix.scale(0.2, 0.02, 0.3);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
}

function room(gl, u_ModelMatrix, u_NormalMatrix, n){
    // Model the whiteboard
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 0, -3.5);
      modelMatrix.scale(2.0, 1.0, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    var colors2 = new Float32Array([
      0.219, 0.243, 0.215,     0.219, 0.243, 0.215,     0.219, 0.243, 0.215,    0.219, 0.243, 0.215,
      0.219, 0.243, 0.215,     0.219, 0.243, 0.215,     0.219, 0.243, 0.215,    0.219, 0.243, 0.215,
      0.219, 0.243, 0.215,     0.219, 0.243, 0.215,     0.219, 0.243, 0.215,    0.219, 0.243, 0.215,
      0.219, 0.243, 0.215,     0.219, 0.243, 0.215,     0.219, 0.243, 0.215,    0.219, 0.243, 0.215,
      0.219, 0.243, 0.215,     0.219, 0.243, 0.215,     0.219, 0.243, 0.215,    0.219, 0.243, 0.215,
      0.219, 0.243, 0.215,     0.219, 0.243, 0.215,     0.219, 0.243, 0.215,    0.219, 0.243, 0.215
   ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 0.525, -3.5);
      modelMatrix.scale(2, 0.05, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -0.525, -3.5);
      modelMatrix.scale(2, 0.05, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(1.025, 0, -3.5);
      modelMatrix.scale(0.05, 1.1, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.025, 0, -3.5);
      modelMatrix.scale(0.05, 1.1, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();


    var colors2 = new Float32Array([
      0.882, 0.850, 0.819,     0.882, 0.850, 0.819,     0.882, 0.850, 0.819,    0.882, 0.850, 0.819,
      0.882, 0.850, 0.819,     0.882, 0.850, 0.819,     0.882, 0.850, 0.819,    0.882, 0.850, 0.819,
      0.882, 0.850, 0.819,     0.882, 0.850, 0.819,     0.882, 0.850, 0.819,    0.882, 0.850, 0.819,
      0.882, 0.850, 0.819,     0.882, 0.850, 0.819,     0.882, 0.850, 0.819,    0.882, 0.850, 0.819,
      0.882, 0.850, 0.819,     0.882, 0.850, 0.819,     0.882, 0.850, 0.819,    0.882, 0.850, 0.819,
      0.882, 0.850, 0.819,     0.882, 0.850, 0.819,     0.882, 0.850, 0.819,    0.882, 0.850, 0.819
   ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)
    // Back Wall
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 0, -3.6);
      modelMatrix.scale(5.05, 2, 0.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

      // Left Wall
    pushMatrix(modelMatrix);
      modelMatrix.translate(-2.475, 0, 0.45);
      modelMatrix.scale(0.1, 2, 5.9);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

      // Left Wall 2
      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.475, 0, -3.5);
        modelMatrix.scale(0.1, 2, 0.2);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      // Left Wall Top
      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.475, 0.9, -2.9);
        modelMatrix.scale(0.1, 0.2, 1);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();


      // Right Wall 1
    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, -2.8);
      modelMatrix.scale(0.1, 2, 1.5);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

      // Right Wall 2
    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, 0);
      modelMatrix.scale(0.1, 2, 1.5);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

      // Right Wall 3
    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, 2.65);
      modelMatrix.scale(0.1, 2, 1.5);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Right Wall 4
  pushMatrix(modelMatrix);
    modelMatrix.translate(2.475, -0.75, -0.1);
    modelMatrix.scale(0.1, 0.5, 6.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Right Wall 5
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.475, 0.75, -0.1);
  modelMatrix.scale(0.1, 0.5, 6.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

    var colors2 = new Float32Array([
        0.35, 0.0, 0.0,   0.35, 0.0, 0.0,   0.35, 0.0, 0.0,  0.35, 0.0, 0.0,
        0.35, 0.0, 0.0,   0.35, 0.0, 0.0,   0.35, 0.0, 0.0,  0.35, 0.0, 0.0,
        0.35, 0.0, 0.0,   0.35, 0.0, 0.0,   0.35, 0.0, 0.0,  0.35, 0.0, 0.0,
        0.35, 0.0, 0.0,   0.35, 0.0, 0.0,   0.35, 0.0, 0.0,  0.35, 0.0, 0.0,
        0.35, 0.0, 0.0,   0.35, 0.0, 0.0,   0.35, 0.0, 0.0,  0.35, 0.0, 0.0,
        0.35, 0.0, 0.0,   0.35, 0.0, 0.0,   0.35, 0.0, 0.0,  0.35, 0.0, 0.0
    ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)
      // Floor
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1.05, -0.125);
      modelMatrix.scale(5.05, 0.1, 7.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
}

function drawWindow(gl, u_ModelMatrix, u_NormalMatrix, n){
    // WINDOWS

    var colors2 = new Float32Array([
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05
    ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, -2);
      modelMatrix.scale(0.1, 1, 0.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, -0.8);
      modelMatrix.scale(0.1, 1, 0.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, 0.8);
      modelMatrix.scale(0.1, 1, 0.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, 1.85);
      modelMatrix.scale(0.1, 1, 0.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0.45, 1.325);
      modelMatrix.scale(0.1, 0.1, 1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, -0.45, 1.325);
      modelMatrix.scale(0.1, 0.1, 1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0.45, -1.4);
      modelMatrix.scale(0.1, 0.1, 1.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, -0.45, -1.4);
      modelMatrix.scale(0.1, 0.1, 1.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, 1.325);
      modelMatrix.scale(0.05, 0.05, 1.1);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, 1.325);
      modelMatrix.scale(0.05, 1, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, -1.375);
      modelMatrix.scale(0.05, 0.05, 1.2);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(2.475, 0, -1.375);
      modelMatrix.scale(0.05, 1, 0.05);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
}

function desk(gl, u_ModelMatrix, u_NormalMatrix, n){
    // School desk
    var colors2 = new Float32Array([
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.7, 0.5, 0.3,   0.7, 0.5, 0.3,   0.7, 0.5, 0.3,   0.7, 0.5, 0.3,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,
      0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05,  0.3, 0.1, 0.05
    ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.35, -0.75, -0.25);
        modelMatrix.scale(0.05, 0.5, 0.05);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.35, -0.75, 0.25);
        modelMatrix.scale(0.05, 0.5, 0.05);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.35, -0.75, 0.25);
        modelMatrix.scale(0.05, 0.5, 0.05);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.35, -0.75, -0.25);
        modelMatrix.scale(0.05, 0.5, 0.05);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0, -0.5, 0);
        modelMatrix.scale(0.9, 0.05, 0.6);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
  }

function chair(gl, u_ModelMatrix, u_NormalMatrix, n){
    // School chair
    var colors2 = new Float32Array([
      0.1, 0.1, 0.45,   0.1, 0.1, 0.45,  0.1, 0.1, 0.45,  0.1, 0.1, 0.45,
      0.1, 0.1, 0.45,   0.1, 0.1, 0.45,  0.1, 0.1, 0.45,  0.1, 0.1, 0.45,
      0.1, 0.1, 0.45,   0.1, 0.1, 0.45,  0.1, 0.1, 0.45,  0.1, 0.1, 0.45,
      0.1, 0.1, 0.45,   0.1, 0.1, 0.45,  0.1, 0.1, 0.45,  0.1, 0.1, 0.45,
      0.1, 0.1, 0.45,   0.1, 0.1, 0.45,  0.1, 0.1, 0.45,  0.1, 0.1, 0.45,
      0.1, 0.1, 0.45,   0.1, 0.1, 0.45,  0.1, 0.1, 0.45,  0.1, 0.1, 0.45
    ]);

    initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

      //Chair
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, -0.75, 0.375);
        modelMatrix.scale(0.35, 0.05, 0.35);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0, -0.55, 0.575);
        modelMatrix.scale(0.35, 0.45, 0.05);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
      // Legs
      var colors2 = new Float32Array([
        0.05, 0.05, 0.05,   0.05, 0.05, 0.05,  0.05, 0.05, 0.05,  0.05, 0.05, 0.05,
        0.05, 0.05, 0.05,   0.05, 0.05, 0.05,  0.05, 0.05, 0.05,  0.05, 0.05, 0.05,
        0.05, 0.05, 0.05,   0.05, 0.05, 0.05,  0.05, 0.05, 0.05,  0.05, 0.05, 0.05,
        0.05, 0.05, 0.05,   0.05, 0.05, 0.05,  0.05, 0.05, 0.05,  0.05, 0.05, 0.05,
        0.05, 0.05, 0.05,   0.05, 0.05, 0.05,  0.05, 0.05, 0.05,  0.05, 0.05, 0.05,
        0.05, 0.05, 0.05,   0.05, 0.05, 0.05,  0.05, 0.05, 0.05,  0.05, 0.05, 0.05
      ]);

      initArrayBuffer(gl, 'a_Color', colors2, 3, gl.FLOAT)

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.16, -0.9, 0.3);
        modelMatrix.scale(0.025, 0.3, 0.025);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.16, -0.9, 0.3);
        modelMatrix.scale(0.025, 0.3, 0.025);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.16, -0.9, 0.55);
        modelMatrix.scale(0.025, 0.3, 0.025);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.16, -0.9, 0.55);
        modelMatrix.scale(0.025, 0.3, 0.025);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

}
// Function for brawing box, used to create other shapes
function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}
