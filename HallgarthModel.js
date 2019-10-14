///////////////////////////////////////////////////////////////
//                                                           //
//       WebGl Model of 33 Hallgarth and Surronding Area     //
//                  by Simon Ellershaw                       //
//                                                           //   
///////////////////////////////////////////////////////////////

// Much of the code is based of that presented in lectures by Frederick Li

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +       
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +

  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_TexCoords = a_TexCoords;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_StreetLightColor;\n' +    
  'uniform vec3 u_FrontLightPosition;\n' + 
  'uniform vec3 u_BackLightPosition;\n' +
  'uniform bool u_StreetLightsOn;\n' +
  'uniform bool u_UseTextures;\n' +
  'uniform vec3 u_SunDirection;\n' +
  'uniform vec3 u_sunColor;\n' +
  'uniform sampler2D u_tex1;\n' +
  'uniform vec3 u_AmbientLight;\n' +  
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +


  //Light from Sun
  '  vec3 normal = normalize(v_Normal);\n' +
  '  float nDotL = max(dot(normal, u_SunDirection), 0.0);\n' +
  '  vec4 currentColor = texture2D(u_tex1, v_TexCoords);\n' +
  '  vec3 sunLight = u_sunColor * currentColor.rgb * nDotL;\n' +
 
  //Ambient Light
  '  vec3 ambient = u_AmbientLight * currentColor.rgb;\n' + 

  //Street lights
  '  if(u_StreetLightsOn){\n'+
  '   vec3 normal = normalize(v_Normal);\n' +
  '   vec3 lightDirection = normalize(u_FrontLightPosition - v_Position);\n' +
  '   float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
      //Front light
  '   vec3 FrontStreetLightOutput = u_StreetLightColor * currentColor.rgb * nDotL;\n' +
  '   lightDirection = normalize(u_BackLightPosition - v_Position);\n' +
  '   nDotL = max(dot(lightDirection, normal), 0.0);\n' +
      //Back light
  '   vec3 BackStreetLightOutput = u_StreetLightColor * currentColor.rgb * nDotL;\n' +
      //Total
  '   gl_FragColor = vec4((FrontStreetLightOutput + BackStreetLightOutput + sunLight + ambient), currentColor.a);\n' +
  '}\n'+
      //No street lights
  '    else{\n'+
        '  gl_FragColor = vec4((sunLight + ambient), currentColor.a);\n' +
  '    }\n'+
  '}\n';

//Global variables, to allow easy access
//WebGl variables
var gl;
var u_ModelMatrix;
var u_NormalMatrix;
var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

//Camera view variables
var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var theta;    // The vertical angle (degrees)
var sigma;    // The horizontal angle (degrees)
var r;
var xPos;
var yPos;
var zPos; 
var theta1P;
var sigma1P;
setInitalCameraPosition()

//Animation variables
var sunAngle = 35;
var doorOpening = false;
var doorAngle = 0;
var garageOpening = false;
var garageRotation = 0;
var binOpening = false;
var binRotation = 0;
var streetLightsOn = false;
var lightIntenisty = 1;
var lightDirection = new Vector3([Math.sin(sunAngle*(Math.PI / 180)),1,1]);
var then = 0;
var firstPerson = false;

//Texture variables
var u_tex1;
var texture_fence;
var texture_brick;
var texture_pavement;
var texture_grass;
var texture_garageRoof;
var texture_garageDoor;
var texture_door;
var texture_road;
var texture_hedge;
var texture_roof;
var texture_lampPost;
var texture_lampOn;
var texture_lampOff;
var texture_window;
var texture_carpet;
var texture_browWindow;
var texture_whiteWindow;
var texture_bin;
var numberOfTexturesLoaded = 0;
var numberOfTextures = 18;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set inital clear color as blue and enable hidden surface removal
  gl.clearColor(0.4 , 0.4,  1, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_sunColor = gl.getUniformLocation(gl.program, 'u_sunColor');
  var u_SunDirection = gl.getUniformLocation(gl.program, 'u_SunDirection');
  var u_StreetLightsOn = gl.getUniformLocation(gl.program, 'u_StreetLightsOn'); 
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight'); 
  var u_BackLightPosition = gl.getUniformLocation(gl.program, 'u_BackLightPosition'); 
  var u_StreetLightColor = gl.getUniformLocation(gl.program, 'u_StreetLightColor');
  var u_FrontLightPosition = gl.getUniformLocation(gl.program, 'u_FrontLightPosition');
  var u_tex1 = gl.getUniformLocation(gl.program, 'u_tex1');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_sunColor || !u_SunDirection || !u_AmbientLight
       || !u_StreetLightColor || !u_FrontLightPosition || !u_BackLightPosition
       || !u_StreetLightsOn ||!u_tex1) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    //return;
  }

  //Set constant lighting parameters
  gl.uniform3f(u_BackLightPosition, 5,10,-21);
  gl.uniform3f(u_FrontLightPosition, 30,10,14);
  gl.uniform3f(u_StreetLightColor, 0.2,0.2,0.2);
  gl.uniform3f(u_AmbientLight, 0.2,0.2,0.2);
  
  // Set inital values for variable lighting parameters
  setSunColourAndDirection(u_sunColor, u_SunDirection, lightIntenisty)
  setu_StreetLightsOn(u_StreetLightsOn, streetLightsOn)

  // Calculate the view matrix and the projection matrix
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 1000);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
 
  setCameraPosition(viewMatrix, u_ViewMatrix)


  document.onkeydown = function(ev){
    keydown(ev, viewMatrix, u_ViewMatrix, u_sunColor, u_SunDirection, u_StreetLightsOn);
  };

  //Load textures
  texture_fence = gl.createTexture();   // Create a texture object
  texture_fence.image = new Image();  // Create the image object
  texture_fence.image.onload = function(){ loadTexAndDraw(gl, texture_fence)};
  texture_fence.image.src = 'textures/fence.jpg';

  texture_brick = gl.createTexture();   
  texture_brick.image = new Image();  
  texture_brick.image.onload = function(){ loadTexAndDraw(gl, texture_brick)};
  texture_brick.image.src = 'textures/bricks.jpg';

  texture_grass = gl.createTexture();   
  texture_grass.image = new Image();  
  texture_grass.image.onload = function(){ loadTexAndDraw(gl, texture_grass)};
  texture_grass.image.src = 'textures/grass.jpg';
  
  texture_roof = gl.createTexture();   
  texture_roof.image = new Image();  
  texture_roof.image.onload = function(){ loadTexAndDraw(gl, texture_roof)};
  texture_roof.image.src = 'textures/roof.jpg';
  
  texture_pavement = gl.createTexture();
  texture_pavement.image = new Image(); 
  texture_pavement.image.onload = function(){ loadTexAndDraw(gl, texture_pavement)};
  texture_pavement.image.src = 'textures/pavement.jpg';

  texture_door = gl.createTexture(); 
  texture_door.image = new Image();
  texture_door.image.onload = function(){ loadTexAndDraw(gl, texture_door)};
  texture_door.image.src = 'textures/door.jpg';

  texture_road = gl.createTexture();  
  texture_road.image = new Image(); 
  texture_road.image.onload = function(){ loadTexAndDraw(gl, texture_road)};
  texture_road.image.src = 'textures/road.jpg';

  texture_hedge = gl.createTexture();  
  texture_hedge.image = new Image(); 
  texture_hedge.image.onload = function(){ loadTexAndDraw(gl, texture_hedge)};
  texture_hedge.image.src = 'textures/hedge.jpg';

  texture_garageRoof = gl.createTexture();
  texture_garageRoof.image = new Image();
  texture_garageRoof.image.onload = function(){ loadTexAndDraw(gl, texture_garageRoof)};
  texture_garageRoof.image.src = 'textures/garageRoof.jpg';

  texture_garageDoor = gl.createTexture();
  texture_garageDoor.image = new Image(); 
  texture_garageDoor.image.onload = function(){ loadTexAndDraw(gl, texture_garageDoor)};
  texture_garageDoor.image.src = 'textures/garageDoor.jpg';

  texture_lampPost = gl.createTexture();
  texture_lampPost.image = new Image();
  texture_lampPost.image.onload = function(){ loadTexAndDraw(gl, texture_lampPost)};
  texture_lampPost.image.src = 'textures/lampPost.jpg';

  texture_lampOff = gl.createTexture(); 
  texture_lampOff.image = new Image();
  texture_lampOff.image.onload = function(){ loadTexAndDraw(gl, texture_lampOff)};
  texture_lampOff.image.src = 'textures/lightOff.jpg';

  texture_lampOn = gl.createTexture(); 
  texture_lampOn.image = new Image(); 
  texture_lampOn.image.onload = function(){ loadTexAndDraw(gl, texture_lampOn)};
  texture_lampOn.image.src = 'textures/lightOn.jpg';

  texture_window = gl.createTexture();  
  texture_window.image = new Image();  
  texture_window.image.onload = function(){ loadTexAndDraw(gl, texture_window)};
  texture_window.image.src = 'textures/window.jpg';

  texture_browWindow = gl.createTexture();  
  texture_browWindow.image = new Image();  
  texture_browWindow.image.onload = function(){ loadTexAndDraw(gl, texture_browWindow)};
  texture_browWindow.image.src = 'textures/brownWindow.jpg';

  texture_whiteWindow = gl.createTexture(); 
  texture_whiteWindow.image = new Image();
  texture_whiteWindow.image.onload = function(){ loadTexAndDraw(gl, texture_whiteWindow)};
  texture_whiteWindow.image.src = 'textures/whiteWindow.jpg';

  texture_carpet = gl.createTexture();  
  texture_carpet.image = new Image(); 
  texture_carpet.image.onload = function(){ loadTexAndDraw(gl, texture_carpet)};
  texture_carpet.image.src = 'textures/carpet.jpg';

  texture_bin = gl.createTexture();  
  texture_bin.image = new Image(); 
  texture_bin.image.onload = function(){ loadTexAndDraw(gl, texture_bin)};
  texture_bin.image.src = 'textures/bin.jpg';
  
}

function loadTexAndDraw(gl, texture) {
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);

  //Handle powers of 2
 if (isPowerOf2(texture.image.width) && isPowerOf2(texture.image.height)) {
   //If PO2 generate mipmap and repeat as generic texture
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  }
  else{
    //If not clamp to edge as is wanted for a single object e.g. window/door
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  //Once all textures loaded the initial draw is called
  numberOfTexturesLoaded ++;
  if(numberOfTexturesLoaded<numberOfTextures){
    return
  }
  else{
    numberOfTexturesLoaded = 0;
    draw(gl, u_ModelMatrix, u_NormalMatrix)
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function keydown(ev, viewMatrix, u_ViewMatrix, u_sunColor, u_SunDirection, u_StreetLightsOn) {
 //console.log(ev.keyCode) //Testing purposes
  var toggleInput = true;
  var cameraInput = true;

  switch (ev.keyCode) {
    case 82: // r key -> reset view
      setInitalCameraPosition()
      setCameraPosition(viewMatrix, u_ViewMatrix)
      break;
    case 84: // t Key -> add 5 degree to sunAngle and update lighting
      changeSunAngle(u_sunColor, u_SunDirection, u_StreetLightsOn)
      break;
    case 79: // o key -> Toggle house front doors open and closed
      doorOpening= !(doorOpening)
      requestAnimationFrame(openCloseDoor)
      break;
    case 76: // l key -> Toggle street lights on/off
      streetLightsOn= !(streetLightsOn)
      setu_StreetLightsOn(u_StreetLightsOn, streetLightsOn)
      break;
    case 71: // g key -> Garage open close
      garageOpening = !(garageOpening)
      requestAnimationFrame(openCloseGarage)
      openCloseGarage()
      break;
    case 80: // p key -> Toggle first person
      firstPerson = !(firstPerson)
      setInitalCameraPosition()
      setCameraPosition(viewMatrix, u_ViewMatrix)
      break;
    case 66: // b key -> Toggle bin open and closed
      binOpening = !(binOpening)
      requestAnimationFrame(openCloseBin)
      openCloseGarage()
      break;
    default:
      toggleInput = false;
  }
  //Changing camera position (Perspective dependent)
  if(firstPerson){
    var deltaZ;
    var deltaX;
    switch (ev.keyCode) {
      //Movement in x z relative to current angle that is being viewed
      case 38: // Up arrow key -> Increase theta value (Vertical 3D Spherical Polar) and update cameras
        deltaZ = Math.cos(sigma1P*(Math.PI / 180))
        deltaX = Math.sin(sigma1P*(Math.PI / 180))
        updateXZPos(deltaZ, deltaX)
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 40: // Down arrow key -> Decrease theta value (Vertical 3D Spherical Polar) and update camera
        deltaZ = -Math.cos(sigma1P*(Math.PI / 180))
        deltaX = -Math.sin(sigma1P*(Math.PI / 180))
        updateXZPos(deltaZ, deltaX)
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 39: // Right arrow key -> Increase sigma value (Horizontal 3D Spherical Polar) and update camera
        deltaZ = Math.sin(sigma1P*(Math.PI / 180))
        deltaX = Math.cos(sigma1P*(Math.PI / 180))
        updateXZPos(deltaZ, deltaX)
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 37: // Left arrow key -> Decrease sigma value (Horizontal 3D Spherical Polar) and update camera
        deltaZ = -Math.sin(sigma1P*(Math.PI / 180))
        deltaX = -Math.cos(sigma1P*(Math.PI / 180))
        updateXZPos(deltaZ, deltaX)
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 87: // W key -> Decrease theta1P value (Vertical 3D Spherical Polar) and update camera
        if(theta1P>43){ // Prevent going full rotation and inverting
          theta1P = (theta1P - ANGLE_STEP) % 360;
          setCameraPosition(viewMatrix, u_ViewMatrix)
        }
        break;
      case 83: // S arrow key -> Increase theta1P value (Vertical 3D Spherical Polar) and update camera
        if(theta<115){//Prevent going full rotation and inverting
          theta1P = (theta1P + ANGLE_STEP) % 360;
          setCameraPosition(viewMatrix, u_ViewMatrix)
        }
        break;
      case 65: // A arrow key -> Increase sigma value (Horizontal 3D Spherical Polar) and update camera
        sigma1P = (sigma1P + ANGLE_STEP) % 360;
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 68: // D arrow key -> Decrease sigma1P value (Horizontal 3D Spherical Polar) and update camera
        sigma1P = (sigma1P - ANGLE_STEP) % 360;
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      default:
        cameraInput = false;
      }
  }
  else{
    switch (ev.keyCode) {
      case 40: // Up arrow key -> Increase theta value (Vertical 3D Spherical Polar) and update camera
        if(theta<165){ // Prevent going full rotation and inverting
          theta = (theta + ANGLE_STEP) % 360;
          setCameraPosition(viewMatrix, u_ViewMatrix)
        }
        break;
      case 38: // Down arrow key -> Decrease theta value (Vertical 3D Spherical Polar) and update camera
        if(theta>15){//Prevent going full rotation and inverting
          theta = (theta - ANGLE_STEP) % 360;
          setCameraPosition(viewMatrix, u_ViewMatrix)
        }
        break;
      case 39: // Right arrow key -> Increase sigma value (Horizontal 3D Spherical Polar) and update camera
        sigma = (sigma + ANGLE_STEP) % 360;
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 37: // Left arrow key -> Decrease sigma value (Horizontal 3D Spherical Polar) and update camera
        sigma = (sigma - ANGLE_STEP) % 360;
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 88: // x key -> zoom out
        r = r + 5;
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      case 90: // z key -> zoom in
        r = r - 5;
        setCameraPosition(viewMatrix, u_ViewMatrix)
        break;
      default:
        cameraInput = false;
      } 
  }
  //Only redraw if valid input given
  if(cameraInput || toggleInput){
    //Draw the scene
    draw(gl, u_ModelMatrix, u_NormalMatrix);
  }
}

function updateXZPos(deltaZ, deltaX){
  //Prevents leaving bounds of model
  if(zPos + deltaZ<30 && zPos + deltaZ > -30){
    zPos+=deltaZ
  }
  if(xPos + deltaX<40 && xPos + deltaX > -40){
    xPos+=deltaX
  }
}

function setInitalCameraPosition(){
  //Inital camera position for each perspective
  if(firstPerson){
      xPos = 20;
      yPos = 2;
      zPos = 20;
      theta1P = 89; //Vertical 
      sigma1P = -90; //Horizontal
  }
  else{
    theta = 71; 
    sigma = 0;    
    r = 120;
  }
}

function setCameraPosition(viewMatrix, u_ViewMatrix){
  if(firstPerson){
    //3D spherical polars of radius 1 based at current position in model
    var xView = xPos + Math.sin(sigma1P*(Math.PI / 180))*Math.sin(theta1P*(Math.PI / 180));
    var yView = yPos + Math.cos(theta1P*(Math.PI / 180));
    var zView = zPos + Math.cos(sigma1P*(Math.PI / 180))*Math.sin(theta1P*(Math.PI / 180));
  }
  else{
    //3D spherical polars rotation about origin
    xPos = r*Math.sin(sigma*(Math.PI / 180))*Math.sin(theta*(Math.PI / 180));
    yPos = r*Math.cos(theta*(Math.PI / 180));
    zPos = r*Math.cos(sigma*(Math.PI / 180))*Math.sin(theta*(Math.PI / 180));

    var xView = 0;
    var yView = 0;
    var zView = 0;
  }
  //Update camera
  viewMatrix.setLookAt(xPos, yPos, zPos, xView, yView, zView, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
}

var doorAnimationID;
function openCloseDoor(now){
  var rotationAngle;
  var rotationSpeed = 90;
  now *= 0.001;
  var deltaT = now-then;
  rotationAngle = rotationSpeed*deltaT;
  //Upper bound
  if(!(rotationAngle<5)){
    rotationAngle = 5;
  }
  //Correct orientation
  if(doorOpening){
    rotationAngle *= -1
  }
  //Recursive call till door fully opened or closed
  if((doorOpening && doorAngle > -90) || (!(doorOpening) && doorAngle < 0)){
    doorAngle += rotationAngle;
    draw(gl, u_ModelMatrix, u_NormalMatrix)
    then = now;
    doorAnimationID = requestAnimationFrame(openCloseDoor)
  }
  else{
    then = 0;
    cancelAnimationFrame(doorAnimationID);
  }
}

var binAnimationID;
function openCloseBin(now){
  var rotationAngle;
  var rotationSpeed = 180;
  now *= 0.001;
  var deltaT = now-then;
  rotationAngle = rotationSpeed*deltaT;
  //Upper bound
  if(!(rotationAngle<5)){
    rotationAngle = 5;
  }
  //Correct orientation
  if(binOpening){
    rotationAngle *= -1
  }

  //Recursive call till door fully opened or closed
  if((binOpening && binRotation > -90 ) || (!(binOpening) && binRotation < 0)){
    binRotation += rotationAngle;
    draw(gl, u_ModelMatrix, u_NormalMatrix)
    then = now;
    garageAnimationID = requestAnimationFrame(openCloseBin)
  }
  else{
    then = 0;
    cancelAnimationFrame(binAnimationID);
  }
}

var garageAnimationID;
function openCloseGarage(now){
  var rotationAngle;
  var rotationSpeed = 120;
  now *= 0.001;
  var deltaT = now-then;
  rotationAngle = rotationSpeed*deltaT;
  //Upper bound
  if(!(rotationAngle<5)){
    rotationAngle = 5;
  }
  //Correct orientation
  if(garageOpening){
    rotationAngle *= -1
  }

  //Recursive call till door fully opened or closed
  if((garageOpening && garageRotation > -90) || (!(garageOpening) && garageRotation < 0)){
    garageRotation += rotationAngle;
    draw(gl, u_ModelMatrix, u_NormalMatrix)
    then = now;
    garageAnimationID = requestAnimationFrame(openCloseGarage)
  }
  else{
    then = 0;
    cancelAnimationFrame(garageAnimationID);
  }

}

function changeSunAngle(u_sunColor, u_SunDirection, u_StreetLightsOn){
  //Day is from 0-180 degrees
  sunAngle = (sunAngle+5)%360;
  if(sunAngle < 0){
    sunAngle = 350
  }

  //LightIntenisty always 1 during day and then changes sinusoidally at night
  if(sunAngle>160 && sunAngle<340){
    lightIntenisty = 1+ 1*Math.sin((sunAngle + 20)*(Math.PI / 180))
  }
  else{
    lightIntenisty = 1
  }

  //Street lights on a night
  if(sunAngle > 170 || sunAngle < 10){
    streetLightsOn = true;
  }
  else{
    streetLightsOn = false;
  }
  
  //Update streetlights, sun and background colour accordingly
  lightDirection = new Vector3([0,Math.sin(sunAngle*(Math.PI / 180)),Math.cos(sunAngle*(Math.PI / 180))]);
  setu_StreetLightsOn(u_StreetLightsOn, streetLightsOn)
  setSunColourAndDirection(u_sunColor, u_SunDirection, lightIntenisty)
  gl.clearColor(0.4*lightIntenisty, 0.4*lightIntenisty,  1*lightIntenisty,1);
}

function setSunColourAndDirection(u_sunColor,u_SunDirection, lightIntenisty){
  gl.uniform3f(u_sunColor, lightIntenisty,lightIntenisty,lightIntenisty);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_SunDirection, lightDirection.elements);
}

function setu_StreetLightsOn(u_StreetLightsOn, streetLightsOn){
  gl.uniform1i(u_StreetLightsOn, streetLightsOn);
}

function initCubeVertexBuffers(gl, inputColors) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
	1,1,1,		-1,1,1,		-1,-1,1,	1,-1,1,
	1,1,1,		1,-1,1,		1,-1,-1,	1,1,-1,
	1,1,1,		1,1,-1,		-1,1,-1,	-1,1,1,
	-1,1,1,		-1,1,-1,	-1,-1,-1,	-1,-1,1,
	-1,-1,-1,	1,-1,-1,	1,-1,1,		-1,-1,1,
	1,-1,-1,	-1,-1,-1,	-1,1,-1,	1,1,-1
  ]);

  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initTriangleVertexBuffers(gl) {
  // Create a 2D triangle for side of house
  var vertices = new Float32Array([   // Coordinates
     0, 1,0,   -1, -1,0,   1, -1, 0
  ]);

  var normals = new Float32Array([    // Normal
    00, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2
 ]);

 var texCoords = new Float32Array([
  1, 0.9, 0.0,0,  2,0
]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initMirrorLShapeVertexBuffers(gl) {
  // Create a mirror l for windows
  var vertices = new Float32Array([   // Coordinates
     1, 1, 0.1,   1, 0.7, 0.1,  0.45, 0.7, 0.1,   0.45, 0, 0.1,     0, 0, 0.1,   0, 1, 0.1,   0.45, 1, 0.1   
    ]);
  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  0.0, 0.0, 1.0,    0.0, 0.0, 1.0,
  ]);
  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,    0,2,6,      6,3,5,   3, 4, 5,
 ]);
 var texCoords = new Float32Array([
  0,1,   0,0.7,   0.55,0.7,   0.55,0,   1,0,  1,1,  0.55, 1,
]);
  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return indices.length;
}

function initLShapeVertexBuffers(gl) {
  // Create a l shape for windows
  var vertices = new Float32Array([   // Coordinates
      0, 1, 0.1,   0, 0.7, 0.1,   0.55 ,0.7 ,0.1 ,   0.55, 0, 0.1,   1, 0, 0.1,  1, 1, 0.1,  0.55 , 1, 0.1,
    ]);
  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  0.0, 0.0, 1.0,    0.0, 0.0, 1.0,
  ]);
  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,    0,2,6,      6,3,5,   3, 4, 5,
 ]);
 var texCoords = new Float32Array([
  0,1,   0,0.7,   0.55,0.7,   0.55,0,   1,0,  1,1,  0.55, 1,
]);
  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return indices.length;
}


function initArrayBuffer(gl, attribute, data, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  // Element size
  var FSIZE = data.BYTES_PER_ELEMENT;

  // Assign the buffer object to the attribute variable

  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, FSIZE * num, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function drawObject(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);
    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix) {
  //Main work to draw scene is done here

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Rectangles
  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
	  modelMatrix.translate(-10, -0.9, 0);  // Translation- to centre final object


  //Road
  // Texture Coordinates have to update so textures render correctly
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    20.0, 0.0,    20.0, 15,   0.0, 15,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    20, 0.0,   20, 15,   0.0, 15,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 10.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
  gl.bindTexture(gl.TEXTURE_2D, texture_road);

  pushMatrix(modelMatrix);
	  modelMatrix.translate(10, -0.9, 0);  // Translation
    modelMatrix.scale(40, 0.5, 30); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Grass
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    6.0, 0.0,    6.0, 4,   0.0, 4,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 10.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
  gl.bindTexture(gl.TEXTURE_2D, texture_grass);

  //Main grass section
  pushMatrix(modelMatrix);
	  modelMatrix.translate(1.5, -0.4,-7.5);  // Translation
    modelMatrix.scale(31.5, 0.3, 22.5); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1.3, 0.0,    1.3, 1.5,   0.0, 1.5,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 10.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  //Small grass section behing left garage
  pushMatrix(modelMatrix);
	  modelMatrix.translate(-23.5, -0.4,22.5);  // Translation
    modelMatrix.scale(6.5, 0.3, 7.5); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Kerb
  //Left Garage
  gl.bindTexture(gl.TEXTURE_2D, texture_pavement);
  pushMatrix(modelMatrix);
	  modelMatrix.translate(-17, -0.4,22.5);  // Translation
    modelMatrix.scale(0.3, 0.3, 7.5); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //House
  pushMatrix(modelMatrix);
	  modelMatrix.translate(8.5, -0.4, 15);  // Translation
    modelMatrix.scale(24.8, 0.3, 0.3); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Right Garage
  pushMatrix(modelMatrix);
	  modelMatrix.translate(33, -0.4, -7.5);  // Translation
    modelMatrix.scale(0.3, 0.3, 22.5); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  

  //Pavement
  //Pavement-Front House
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    15, 0.0,    15, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 10.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  pushMatrix(modelMatrix);
	  modelMatrix.translate(5, -0.15,10);  // Translation
    modelMatrix.scale(28, 0.1, 2); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Pavement- Back House
  pushMatrix(modelMatrix);
	  modelMatrix.translate(5.5, -0.15,-23);  // Translation
    modelMatrix.scale(20, 0.1, 2); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1, 0.0,    1, 8,  0, 8,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 10.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
  
  //Pavement-Side Garage
  pushMatrix(modelMatrix);
    modelMatrix.translate(23.5, -0.15, -7);  // Translation
    modelMatrix.scale(2, 0.1, 15); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1, 0.0,    1, 2,  0, 2,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 10.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  pushMatrix(modelMatrix);
	  modelMatrix.translate(-12.5, -0.15,-27);  // Translation
    modelMatrix.scale(2, 0.1, 3); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Pavement to house
  var XDisplace = [-8.4, 8.4, 11.65, -11.65]
  for (var i in XDisplace){
    pushMatrix(modelMatrix);
      modelMatrix.translate(XDisplace[i], -0.15, 5);  // Translation
      modelMatrix.scale(1.4, 0.1, 3); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }

  var houseX= [10,-10]
  //House
  for (var i in houseX){
    pushMatrix(modelMatrix);
      modelMatrix.translate(houseX[i],0,0);
      
      gl.bindTexture(gl.TEXTURE_2D, texture_brick);
      var texCoords = new Float32Array([
        5.0, 1.0,    0.0, 1.0,   0.0, 0.0,   5.0, 0.0,  // v0-v1-v2-v3 front
        0.0, 1.0,    0.0, 0.0,   2.0, 0.0,   2.0, 1.0,  // v0-v3-v4-v5 right
        1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
        2.0, 1.0,    0.0, 1.0,   0.0, 0.0,   2.0, 0.0,  // v1-v6-v7-v2 left
        0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
        0.0, 0.0,    5.0, 0.0,   5.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
      ]);
      if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
      //Top Floor
      pushMatrix(modelMatrix);
        modelMatrix.translate(0,6,0);  // Translation
        modelMatrix.scale(10, 2, 4); // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
      
      var texCoords = new Float32Array([
        1.75, 1.0,    0.0, 1,   0.0, 0.0,   1.75, 0.0,  // v0-v1-v2-v3 front
        0.0, 1.0,    0.0, 0.0,   2.0, 0.0,   2.0, 1.0,  // v0-v3-v4-v5 right
        1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
        2.0, 1.0,    0.0, 1.0,   0.0, 0.0,   2.0, 0.0,  // v1-v6-v7-v2 left
        0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
        0.0, 0.0,    1.75, 0.0,   1.75, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
      ]);
      if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;


      //Right lower
      pushMatrix(modelMatrix);
        modelMatrix.translate(6.5,2,0);  // Translation
        modelMatrix.scale(3.5, 2, 4); // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //Left lower
      pushMatrix(modelMatrix);
        modelMatrix.translate(-6.5,2,0);  // Translation
        modelMatrix.scale(3.5, 2, 4); // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      var texCoords = new Float32Array([
        0.1, 1.0,    0.0, 1,   0.0, 0.0,   0.1, 0.0,  // v0-v1-v2-v3 front
        0.0, 1.0,    0.0, 0.0,   2.0, 0.0,   2.0, 1.0,  // v0-v3-v4-v5 right
        1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
        2.0, 1.0,    0.0, 1.0,   0.0, 0.0,   2.0, 0.0,  // v1-v6-v7-v2 left
        0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
        0.0, 0.0,    0.1, 0.0,   0.1, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
      ]);
      if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

      //Door divider
      pushMatrix(modelMatrix);
        modelMatrix.translate(0,2,0);  // Translation
        modelMatrix.scale(0.25, 2, 4); // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      var texCoords = new Float32Array([
        1, 0,    0.0, 0,   0.0, 1.0,   1, 1.0,  // v0-v1-v2-v3 front
        0.0, 1.0,    0.0, 0.0,   1, 0.0,   1, 1.0,  // v0-v3-v4-v5 right
        1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
        0.1, 1.0,    0.0, 1.0,   0.0, 0.0,   0.1, 0.0,  // v1-v6-v7-v2 left
        0.0, 0.0,    1, 0.0,   1, 1,   0.0, 1,  // v7-v4-v3-v2 down
        0.0, 1.0,    1, 1.0,   1, 0,   0.0, 0   // v4-v7-v6-v5 back
      ]);
      if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
      
      //Doors + Carpet
      var XDoorCoord = 1.5; //Initally do RH doors
      var ZDoorCoord;
      var xRotationOpen;
      var xTranslationOpen
      for(var k=0; k<4; k++){
        if(k > 1){
          XDoorCoord=-1.5; //Repeat for LH doors
        }
        if(k%2 === 0){
          //Front Doors- are animated
          ZDoorCoord=2; 
          xRotationOpen = 90*Math.sin(doorAngle*(Math.PI / 180)); // rotation animation
          xTranslationOpen = 0.3*Math.sin(doorAngle*(Math.PI / 180)); // to keep axis of rotation roughly constant
          //Carpet
          gl.bindTexture(gl.TEXTURE_2D, texture_carpet);
          pushMatrix(modelMatrix);
            modelMatrix.translate(XDoorCoord,0 , -0.6);  // Translation
            modelMatrix.scale(1.5, 0.05, 2.65); // Scale
            drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
          modelMatrix = popMatrix();
        }
        else{
          //Back door
          ZDoorCoord=-3.8;
          xRotationOpen = 0;
          xTranslationOpen = 0;
        }
        //Draw doors
        gl.bindTexture(gl.TEXTURE_2D, texture_door)
        pushMatrix(modelMatrix);
          modelMatrix.translate(XDoorCoord + 1.5 + xTranslationOpen ,2,ZDoorCoord);  // Translation
          modelMatrix.rotate(xRotationOpen,0,1,0)
          modelMatrix.translate(-1.5,0,0) //rotate about door hinge not centre axis
          modelMatrix.scale(1.5, 2, 0.2); // Scale
          drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
        modelMatrix = popMatrix();
      }
    modelMatrix = popMatrix();

    //Roof
    gl.bindTexture(gl.TEXTURE_2D, texture_roof)
    var texCoords = new Float32Array([
      5.5, 1.0,    0.0, 1,   0.0, 0.0,   5.5, 0.0,  // v0-v1-v2-v3 front
      0.0, 1.0,    0.0, 0.0,   2.0, 0.0,   2.0, 1.0,  // v0-v3-v4-v5 right
      1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
      2.0, 1.0,    0.0, 1.0,   0.0, 0.0,   2.0, 0.0,  // v1-v6-v7-v2 left
      0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
      0.0, 0.0,   5.5, 0.0,   5.5, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
    ]);
    if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
    //Front and back 
    for(var i=-1; i<2; i+=2){
    pushMatrix(modelMatrix);
      modelMatrix.translate(0,9.5,i*-2.2);  // Translation
      modelMatrix.rotate(i*56.3, 1, 0, 0);  // Translation
      modelMatrix.scale(20, 2.8, 0.1); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
    }

    //Fence
    gl.bindTexture(gl.TEXTURE_2D, texture_fence);
    var texCoords = new Float32Array([
      10, 1.0,    0.0, 1,   0.0, 0.0,   10, 0.0,  // v0-v1-v2-v3 front
      0.0, 1.0,    0.0, 0.0,   2.0, 0.0,   2.0, 1.0,  // v0-v3-v4-v5 right
      1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
      2.0, 1.0,    0.0, 1.0,   0.0, 0.0,   2.0, 0.0,  // v1-v6-v7-v2 left
      0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
      0.0, 0.0,   10, 0.0,   10, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
    ]);
    if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

    //Main back fence
    var fenceHeight = 2;
    var fenceDepth = 0.1
    pushMatrix(modelMatrix);
      modelMatrix.translate(-5,2,-10);  // Translation
      modelMatrix.scale(25, fenceHeight, fenceDepth); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    var texCoords = new Float32Array([
      2, 1.0,    0.0, 1,   0.0, 0.0,   2, 0.0,  // v0-v1-v2-v3 front
      0.0, 1.0,    0.0, 0.0,   2.0, 0.0,   2.0, 1.0,  // v0-v3-v4-v5 right
      1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
      2.0, 1.0,    0.0, 1.0,   0.0, 0.0,   2.0, 0.0,  // v1-v6-v7-v2 left
      0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
      0.0, 0.0,   2, 0.0,   2, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
    ]);
    if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

    //Front fence
    pushMatrix(modelMatrix);
      modelMatrix.translate(-25,2,0);  // Translation
      modelMatrix.scale(5, fenceHeight, fenceDepth); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
    
    //Fence dividers
    var dividerXPos = [20, 10, 0, -10]
    for (var i in dividerXPos){
      pushMatrix(modelMatrix);
        modelMatrix.translate(dividerXPos[i],2,-7);  // Translation
        modelMatrix.rotate(90, 0, 1, 0);  // Translation
        modelMatrix.scale(3, fenceHeight, fenceDepth); // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
      }
  }

  //Garages
  var garageTranslationCords = [[-19.5,2,19.7],[30,2.1,-8.2]]; //LH and RH garage co-ordinates
  var dividerDisplacement = [[-10,-5, 0, 5], [-10,-5, 0, 5,10]]; //Dividers for LH and RH garages
  var yDisplacment = [0,2.5]; // Y co-ordinate for garage floor and roof
  //Loop through for each garage
  for (var j = 0; j < 2; j++){
    pushMatrix(modelMatrix);
      modelMatrix.translate(garageTranslationCords[j][0], 2.1, garageTranslationCords[j][2]);  
      modelMatrix.rotate(90, 0, 1, 0); 
      dividerXPos = dividerDisplacement[j] //Get garage's divider co-ordinates 
      //Loop for each garage unit
      for (var i in dividerXPos){
          gl.bindTexture(gl.TEXTURE_2D, texture_brick);

          var texCoords = new Float32Array([
            0.1, 1.0,    0.0, 1,   0.0, 0.0,   0.1, 0.0,   // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1.5, 0.0,   1.5, 1.0,  // v0-v3-v4-v5 right
            1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.5, 1.0,    0.0, 1.0,   0.0, 0.0,   1.5, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
            0.0, 0.0,   2, 0.0,   2, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
          ]);
          if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

          //Garage Walls
          pushMatrix(modelMatrix);
            modelMatrix.translate(dividerXPos[i], 0, 0);  // Translation
            modelMatrix.scale(0.25, 1.9, 2.7); // Scale
            drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
          modelMatrix = popMatrix();

          var YDis = yDisplacment[j]
          var texCoords = new Float32Array([
            4, 1.0,    0.0, 1,   0.0, 0.0,   4, 0.0,   // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1.5, 0.0,   1.5, 1.0,  // v0-v3-v4-v5 right
            1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.5, 1.0,    0.0, 1.0,   0.0, 0.0,   1.5, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    3.0, 0.0,   3.0, 2,   0.0, 2,  // v7-v4-v3-v2 down
            0.0, 0.0,   4, 0.0,   4, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
          ]);
          if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

          //Garage- back wall
          pushMatrix(modelMatrix);
            modelMatrix.translate(-2.5 + YDis, 0, -2.6);  // Translation
            modelMatrix.scale(7.5 + YDis, 2, 0.1); // Scale
            drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
          modelMatrix = popMatrix();
          
          gl.bindTexture(gl.TEXTURE_2D, texture_garageDoor);

          var texCoords = new Float32Array([
            1, 1.0,    0.0, 1,   0.0, 0.0,   1, 0.0,   // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1, 0.0,   1, 1.0,  // v0-v3-v4-v5 right
            1, 0.0,    1, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
            1, 1.0,    0.0, 1.0,   0.0, 0.0,   1, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    1.0, 0.0,   1.0, 1,   0.0, 1,  // v7-v4-v3-v2 down
            0.0, 0.0,   1, 0.0,   1, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
          ]);
          if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

          //Garage Doors
          if(i!=0){ //First element defines wall but don't want door
          pushMatrix(modelMatrix);
              modelMatrix.translate(-2.5 + dividerXPos[i], 1.4*(1-Math.cos(-garageRotation*(Math.PI / 180))), 2.5 - 3*Math.sin(-garageRotation*(Math.PI / 180)));  // Translation
              modelMatrix.rotate(garageRotation,1,0,0)
              modelMatrix.scale(2.25, 2, 0.1); // Scale
              drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
              modelMatrix = popMatrix();
          }
        }
      //Garage -floor and roof
      var YPos = [-2,2]
          var texCoords = new Float32Array([
            1, 1.0,    0.0, 1,   0.0, 0.0,   1, 0.0,   // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1, 0.0,   1, 1.0,  // v0-v3-v4-v5 right
            2, 0.0,    2, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
            1, 1.0,    0.0, 1.0,   0.0, 0.0,   1, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    2.0, 0.0,   2.0, 1,   0.0, 1,  // v7-v4-v3-v2 down
            0.0, 0.0,   1, 0.0,   1, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
          ]);
          if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
      
      gl.bindTexture(gl.TEXTURE_2D, texture_pavement)

      for (var i in YPos){
        if(i>0){
          gl.bindTexture(gl.TEXTURE_2D, texture_garageRoof)
        }
          pushMatrix(modelMatrix);
            modelMatrix.translate(-2.5 + YDis, YPos[i], 0);  // Translation
            modelMatrix.scale(7.75 + YDis, 0.1, 2.75); // Scale
            drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
          modelMatrix = popMatrix();
        }
    modelMatrix = popMatrix();
  }
  
  //Street Lights
    //Loop through for 2 lights
    for(var i=0; i<2; i++){
      pushMatrix(modelMatrix);
        if(i===0){
          //Front light
          modelMatrix.translate(30, 0, 13.5);  // Translation
        }
        else{
          //Back light
          modelMatrix.translate(5, 0, -18);  // Translation
          modelMatrix.rotate(180, 0, 1, 0);  // Rotate 180 for back light
        }

        gl.bindTexture(gl.TEXTURE_2D, texture_lampPost);

        var texCoords = new Float32Array([
          0.1, 5.0,    0.0, 5,   0.0, 0.0,   0.1, 0.0,   // v0-v1-v2-v3 front
          0.0, 5.0,    0.0, 0.0,   0.1, 0.0,   0.1, 5.0,  // v0-v3-v4-v5 right
          2, 0.0,    2, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
          0.1, 5.0,    0.0, 5.0,   0.0, 0.0,   0.1, 0.0,  // v1-v6-v7-v2 left
          0.0, 0.0,    2.0, 0.0,   2.0, 1,   0.0, 1,  // v7-v4-v3-v2 down
          0.0, 0.0,   5, 0.0,   5, 0.1,   0.0, 0.1   // v4-v7-v6-v5 back
        ]);
        if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
        //Pole
        pushMatrix(modelMatrix);
          modelMatrix.translate(0, 5, 0);  // Translation
          modelMatrix.scale(0.25, 5, 0.25); // Scale
          drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
        modelMatrix = popMatrix();

        var texCoords = new Float32Array([
          0.1, 0.1,    0.0, 0.1,   0.0, 0.0,   0.1, 0.0,   // v0-v1-v2-v3 front
          0.0, 0.1,    0.0, 0.0,   2, 0.0,   2, 0.1,  // v0-v3-v4-v5 right
          2, 0.0,    2, 0.1,  0, 0.1,   0.0, 0.0,  // v0-v5-v6-v1 up
          2, 0.1,    0.0, 0.1,   0.0, 0.0,   2, 0.0,  // v1-v6-v7-v2 left
          0.0, 0.0,    2.0, 0.0,   2.0, 0.1,   0.0, 0.1,  // v7-v4-v3-v2 down
          0.0, 0.0,   5, 0.0,   5, 0.1,   0.0, 0.1   // v4-v7-v6-v5 back
        ]);
        if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

        //Top
        pushMatrix(modelMatrix);
          modelMatrix.translate(0, 10, 1.75);  // Translation
          modelMatrix.scale(0.25, 0.25, 2); // Scale
          drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
        modelMatrix = popMatrix();
        
        //Bulb
        //If street light on yellow texture if not grey texture
        if(streetLightsOn){
          gl.bindTexture(gl.TEXTURE_2D, texture_lampOn);
        }
        else{
          gl.bindTexture(gl.TEXTURE_2D, texture_lampOff);
        }
        pushMatrix(modelMatrix);
          modelMatrix.translate(0, 9.5, 2.75);  // Translation
          modelMatrix.scale(0.25, 0.25, 1); // Scale
          drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
        modelMatrix = popMatrix();
      modelMatrix = popMatrix();
    }

  //Bin
  gl.bindTexture(gl.TEXTURE_2D, texture_bin);
  var texCoords = new Float32Array([
    1, 2.0,    0.0, 2,   0.0, 0.0,   1, 0.0,   // v0-v1-v2-v3 front
    0.0, 2.0,    0.0, 0.0,   1, 0.0,   1, 2.0,  // v0-v3-v4-v5 right
    0.5, 0.0,    0.5, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
    1, 2.0,    0.0, 2.0,   0.0, 0.0,   1, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    0.5, 0.0,   0.5, 1,   0.0, 1,  // v7-v4-v3-v2 down
    0.0, 0.0,   1, 0.0,   1, 2.0,   0.0, 2.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;
  xBinCoords = [18, 8, -1, -12]
  for(i in xBinCoords){
    pushMatrix(modelMatrix);
      modelMatrix.translate(xBinCoords[i], 1, -11); 
      modelMatrix.rotate(180, 0, 1, 0); 
      //Main
      pushMatrix(modelMatrix);
        modelMatrix.scale(0.5, 1, 0.5); // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
      //Rim
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 1, 0);  // Translation
        modelMatrix.scale(0.7, 0.05, 0.7); // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
      //Lid
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 1.05, -0.5);
        modelMatrix.rotate(binRotation, 1,0,0);  // Scale
        modelMatrix.translate(0,0, 0.5);  // Translation
        modelMatrix.scale(0.5, 0.05, 0.5);  // Scale
        drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
    modelMatrix = popMatrix();
  }

  //Hedges
  //Hedge by house
  var texCoords = new Float32Array([
    0.5, 1.0,    0.0, 1,   0.0, 0.0,   0.5, 0.0,   // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1, 0.0,   1, 1.0,  // v0-v3-v4-v5 right
    0.5, 0.0,    0.5, 1,  0, 1,   0.0, 0.0,  // v0-v5-v6-v1 up
    1, 1.0,    0.0, 1.0,   0.0, 0.0,   1, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    0.5, 0.0,   0.5, 1,   0.0, 1,  // v7-v4-v3-v2 down
    0.0, 0.0,   0.5, 0.0,   0.5, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  gl.bindTexture(gl.TEXTURE_2D, texture_hedge);
  pushMatrix(modelMatrix);
    
    modelMatrix.translate(19, 1.5, 6);  // Translation
    modelMatrix.scale(1, 1.5, 2); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var texCoords = new Float32Array([
    1, 1.0,    0.0, 1,   0.0, 0.0,   1, 0.0,   // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   7.5, 0.0,   7.5, 1.0,  // v0-v3-v4-v5 right
    1, 0.0,    1, 7.5,  0, 7.5,   0.0, 0.0,  // v0-v5-v6-v1 up
    7.5, 1.0,    0.0, 1.0,   0.0, 0.0,   7.5, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    0.5, 0.0,   0.5, 1,   0.0, 1,  // v7-v4-v3-v2 down
    0.0, 0.0,   0.5, 0.0,   0.5, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  //LH Hedge
  pushMatrix(modelMatrix);
    modelMatrix.translate(-29, 1, 15);  // Translation
    modelMatrix.scale(1, 1, 15); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var texCoords = new Float32Array([
    1, 1.0,    0.0, 1,   0.0, 0.0,   1, 0.0,   // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   7.5, 0.0,   7.5, 1.0,  // v0-v3-v4-v5 right
    1, 0.0,    1, 7.5,  0, 7.5,   0.0, 0.0,  // v0-v5-v6-v1 up
    7.5, 1.0,    0.0, 1.0,   0.0, 0.0,   7.5, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    0.5, 0.0,   0.5, 1,   0.0, 1,  // v7-v4-v3-v2 down
    0.0, 0.0,   1, 0.0,   1, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  //Square windows
  //Brown Windows
  gl.bindTexture(gl.TEXTURE_2D, texture_browWindow);

  var bigWindowYPos = [2,6.1]
  for(i in bigWindowYPos){
  pushMatrix(modelMatrix);
    modelMatrix.translate(-16, bigWindowYPos[i], 4.0);  // Translation
    modelMatrix.scale(2, 1.5, 0.01); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  }
  //Top small window
  pushMatrix(modelMatrix);
    modelMatrix.translate(-11, 6.1, 4.0);  // Translation
    modelMatrix.scale(1.5, 1.5, 0.01); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //White windows (Rear)
  gl.bindTexture(gl.TEXTURE_2D, texture_whiteWindow);

  //Top floor rear windows
  var WindowxPos = [-14, -5, 4, 14]
  for(i in WindowxPos){
  pushMatrix(modelMatrix);
    modelMatrix.translate(WindowxPos[i], 6.1, -4.0);  // Translation
    modelMatrix.scale(3, 1.5, 0.01); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  }
  //Bottom floor rear windows
  WindowxPos = [-17, -3, 3, 17]
  for(i in WindowxPos){
    pushMatrix(modelMatrix);
      modelMatrix.translate(WindowxPos[i], 2, -4.0);  // Translation
      modelMatrix.scale(1.5, 1.5, 0.01); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }

  
  
  // End triangles of roof
  var n = initTriangleVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture_brick);
  //Made from 2 panels
  for(var k=-1; k<2; k+=2){
    pushMatrix(modelMatrix);
      modelMatrix.translate(k*20, 9.5, 0);  // Translation
      modelMatrix.rotate(90, 0, k*1, 0);  // Translation
      modelMatrix.scale(4.5, 1.5, 2); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }
  modelMatrix = popMatrix();

  //L shaped windows
  n = initLShapeVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture_window);
  var windowLocations=[[5,0], [5,3.8], [-14,0], [-14,3.8]];

  for(q in windowLocations){
    pushMatrix(modelMatrix);
      modelMatrix.translate(windowLocations[q][0], windowLocations[q][1], 4.0);  // Translation
      modelMatrix.scale(3, 3, 1); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }

  //Over door window is slightly smaller
  pushMatrix(modelMatrix);
  	modelMatrix.translate(-3, 3.8, 4.0);  // Translation
    modelMatrix.scale(2.5, 3, 1); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Inverted L shape
  n = initMirrorLShapeVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  windowLocations=[[-8,0], [-8,3.8], [-19,3.8]];

  for(q in windowLocations){
    pushMatrix(modelMatrix);
      modelMatrix.translate(windowLocations[q][0], windowLocations[q][1], 4.0);  // Translation
      modelMatrix.scale(3, 3, 1); // Scale
      drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }

  //Over door window is slightly smaller
  pushMatrix(modelMatrix);
  	modelMatrix.translate(1, 3.8, 4.0);  // Translation
    modelMatrix.scale(2.5, 3, 2); // Scale
    drawObject(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  
}

