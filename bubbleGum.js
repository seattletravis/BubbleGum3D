import '../input.css'
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { EaselPlugin } from "gsap/EaselPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
// import { TextGeometry } from 'three/addons/TextGeometry.js'
// import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
// import CannonDebugger from 'cannon-es-debugger';
// import { space } from 'postcss/lib/list';
// import { TweenMax } from 'gsap/gsap-core';

gsap.registerPlugin(Flip, EaselPlugin, TextPlugin);

//Add audio tracks and play bg music
// const bgMusic = document.getElementById('bgMusic')
// bgMusic.loop = true;
const applaud = document.getElementById('applaud')
const winChime = document.getElementById('winChime')

// bgMusic.addEventListener("load", playAudio())
// function playAudio(){
//     bgMusic.play()
// }


var gameOver = false
//check if audio is playing ever 1 second and if it's not start audio
// setInterval(()=>{
//     if(bgMusic.paused && !gameOver){
//         playAudio()
//     }
// }, 1000)



//create three objects - initialize THREE
const scene = new THREE.Scene();
const canvasContainer = document.querySelector('#canvasContainer') //Grab canvas Container from document
// const sidePanel = document.querySelector('#sidePanel') // add sidePanel to the DOM
let gravityMaxValue = -9
// let blockSleepSpeed = .2
let tableOffset = 4

//create physics engine - initialize CANNON
const physicsWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, gravityMaxValue, 0), //Ramp Gravity up in Function
})

  //Function to apply visual bodies to physics bodies - call from animate()
function linkPhysics() {
  for (let i = 0; i < candyPhysicsArray.length; i++){
    candyVisualArray[i].position.copy(candyPhysicsArray[i].position)
    candyVisualArray[i].quaternion.copy(candyPhysicsArray[i].quaternion)
  }
}



//ENVIRONMENTAL VARIABLES
// physicsWorld.allowSleep = true;
physicsWorld.defaultContactMaterial.contactEquationRestitution = 0.1 //default = ?
physicsWorld.defaultContactMaterial.contactEquationStiffness = 5000//default 50,000,000
physicsWorld.defaultContactMaterial.friction = 3 //default = 0.3
// physicsWorld.defaultContactMaterial.frictionEquationRelaxation = 1 //defauuttongitlt = 3
physicsWorld.defaultContactMaterial.contactEquationRelaxationTime = .5
// console.log(physicsWorld.defaultContactMaterial)

//Window resize handler
window.onresize = function(){ resetTower() }

//create camera object
const camera = new THREE.PerspectiveCamera( 45, canvasContainer.offsetWidth / canvasContainer.offsetHeight, 0.5, 1000 );
camera.position.set(5, 2, 20)
// camera.lookAt(0, 0, 0)




//create renderer
const renderer = new THREE.WebGLRenderer(
    {
    antialias: true,
    canvas: document.querySelector('canvas'),
});
renderer.setSize( canvasContainer.offsetWidth, canvasContainer.offsetHeight );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

//orbit controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

// add ambient light source
const light = new THREE.AmbientLight( 0xFFFFFF, .3 );
scene.add( light );

//add pano as BG
var panoGeometry = new THREE.SphereGeometry( 50, 60, 40 );
  panoGeometry.scale( - 1, 1, 1 );
  var panoMaterial = new THREE.MeshBasicMaterial( {
    map: new THREE.TextureLoader().load( '/tower_images/pano2.jpg' )
  } );
  var panoMesh = new THREE.Mesh( panoGeometry, panoMaterial );
  panoMesh.position.set(0, 0, 0)
  scene.add( panoMesh );

//Key Light
const gameLight = new THREE.PointLight(0xffffff, .7, 2000)
gameLight.castShadow = true;
gameLight.position.set(-3, 10, 3)
scene.add( gameLight )

//Fill Light
const fillLight = new THREE.PointLight(0xffffff, .4, 2000)
fillLight.castShadow = true;
fillLight.position.set(2, 10, -2)
scene.add( fillLight )

//make a round table top
const tableTexture = new THREE.TextureLoader().load('/tower_images/wood.jpg')
const tableBody = new CANNON.Body({
  shape: new CANNON.Cylinder(5, 5, .25, 50),
  type: CANNON.Body.STATIC
})
tableBody.position.set(0, 0 - tableOffset, 0)
physicsWorld.addBody(tableBody)
const tableVisualBody = new THREE.Mesh( //visual part of ground
  new THREE.CylinderGeometry(5, 5, .25, 50),
  new THREE.MeshStandardMaterial({
    map: tableTexture
  }),
)
tableVisualBody.receiveShadow = true;
scene.add(tableVisualBody)
tableVisualBody.userData.ground = true;
tableVisualBody.position.copy(tableBody.position)
tableVisualBody.quaternion.copy(tableBody.quaternion)

//make a round table Leg
const tableLegBody = new CANNON.Body({
  shape: new CANNON.Cylinder(.7, .7, 16, 50),
  type: CANNON.Body.STATIC
})
tableLegBody.position.set(0, -8 - tableOffset, 0)
physicsWorld.addBody(tableLegBody)
const tableLegVisualBody = new THREE.Mesh( //visual part of ground
  new THREE.CylinderGeometry(.7, .7, 16, 50),
  new THREE.MeshStandardMaterial({
    map: tableTexture
  }),
)
tableLegVisualBody.receiveShadow = true;
scene.add(tableLegVisualBody)
tableLegVisualBody.userData.ground = true;
tableLegVisualBody.position.copy(tableLegBody.position)
tableLegVisualBody.quaternion.copy(tableLegBody.quaternion)

const candyPhysicsArray = []
const candyVisualArray = []

//make candy jar
const holdingBoxnx = new THREE.BoxGeometry(0.1, 3 ,3 , 10, 10, 10)
const holdingBoxpx = new THREE.BoxGeometry(0.1, 3, 3 , 10, 10, 10)
const holdingBoxbottom = new THREE.BoxGeometry(3 , 0.1, 3, 10, 10, 10)
const holdingBoxnz = new THREE.BoxGeometry(3, 3, 0.1, 10, 10, 10)
const holdingBoxpz = new THREE.BoxGeometry(3, 3, 0.1, 10, 10, 10)

const jarMesh = new THREE.MeshStandardMaterial({
  transparent: true,
  opacity: 0.1,
  color: 0x010000
})
const boxSidenx = new THREE.Mesh( holdingBoxnx, jarMesh )
const boxSidepx = new THREE.Mesh( holdingBoxpx, jarMesh )
const boxSidebottom = new THREE.Mesh( holdingBoxbottom, jarMesh )
const boxSidenz = new THREE.Mesh( holdingBoxnz, jarMesh )
const boxSidepz = new THREE.Mesh( holdingBoxpz, jarMesh )

scene.add(boxSidenx)
candyVisualArray.push(boxSidenx)
scene.add(boxSidepx)
candyVisualArray.push(boxSidepx)
scene.add(boxSidebottom)
candyVisualArray.push(boxSidebottom)
scene.add(boxSidenz)
candyVisualArray.push(boxSidenz)
scene.add(boxSidepz)
candyVisualArray.push(boxSidepz)

const boxPhysicsnx = new CANNON.Body({STATIC: true, shape: new CANNON.Box(new CANNON.Vec3(0.05, 1.5, 1.5))})
boxPhysicsnx.position.set(1.5, 1.6 - tableOffset, 0)
const boxPhysicspx = new CANNON.Body({STATIC: true, shape: new CANNON.Box(new CANNON.Vec3(0.05, 1.5, 1.5))})
boxPhysicspx.position.set(-1.5, 1.6 - tableOffset, 0)
const boxPhysicsbottom = new CANNON.Body({STATIC: true, shape: new CANNON.Box(new CANNON.Vec3(1.5, 0.05, 1.5))})
boxPhysicsbottom.position.set(0, 0.1 - tableOffset, 0)
const boxPhysicsnz = new CANNON.Body({STATIC: true, shape: new CANNON.Box(new CANNON.Vec3(1.5, 1.5, 0.05))})
boxPhysicsnz.position.set(0, 1.6 - tableOffset, 1.5)
const boxPhysicspz = new CANNON.Body({STATIC: true, shape: new CANNON.Box(new CANNON.Vec3(1.5, 1.5, 0.05))})
boxPhysicspz.position.set(0, 1.6 - tableOffset, -1.5)

physicsWorld.addBody(boxPhysicsnx)
candyPhysicsArray.push(boxPhysicsnx)
physicsWorld.addBody(boxPhysicspx)
candyPhysicsArray.push(boxPhysicspx)
physicsWorld.addBody(boxPhysicsbottom)
candyPhysicsArray.push(boxPhysicsbottom)
physicsWorld.addBody(boxPhysicsnz)
candyPhysicsArray.push(boxPhysicsnz)
physicsWorld.addBody(boxPhysicspz)
candyPhysicsArray.push(boxPhysicspz)

//make candies
let listOfEachCandy = []
const colorSheet = [0xff0000, 0x00ff00, 0x0000ff, 0xe2619f, 0xffef00, 0xf88128]

function createCandy(candyName, position, color){
  const mass = 0.0001;
  candyName = new CANNON.Body({
    mass: mass,
    shape: new CANNON.Sphere(0.15),
    sleepSpeedLimit: 0.5
  })
  candyName.position.set(position.x, position.y, position.z)
  physicsWorld.addBody(candyName)
  listOfEachCandy.push(candyName)
  candyPhysicsArray.push(candyName)
  const sphereGeometry = new THREE.SphereGeometry(0.15, 15, 15)
  const sphereMesh = new THREE.MeshStandardMaterial({color: color, roughness: 0})
  candyName = new THREE.Mesh(
    sphereGeometry,
    sphereMesh
  )
  scene.add(candyName)
  candyVisualArray.push(candyName)
}

let numberOfCandy = 400 + Math.floor(Math.random() * 500)
function placeCandy(){
  let candyY =  - tableOffset
  for (let i = 0; i < numberOfCandy; i++){
    let candyColor = Math.floor(Math.random()*colorSheet.length)
    var color = colorSheet[candyColor]
    if (i%20 == 0){
      candyY += .3
    }
    let candyX = Math.cos(2 * Math.PI * i * .05)
    let candyZ = Math.sin(2 * Math.PI * i * .05)
    const position = {x: candyX, y: candyY, z: candyZ}
    createCandy('candy', position, color)
  }
}

placeCandy()



//create easterEgg Point
const fontLoader = new FontLoader();
fontLoader.load(
  '/fonts/Pixle_Font_Medium.json',
  (droidFont)=>{
      const textGeometry = new TextGeometry(numberOfCandy.toString(), {
        height: 0.05,
        size: .3,
        rotationZ: Math.PI/2,
        font: droidFont,
      });
      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xe2619f,
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      textMesh.position.set(-0.25, 0.3 - tableOffset, 0.15)
      textMesh.rotation.set(-Math.PI/2, 0, 0)
      scene.add(textMesh)
    }
  )


//resets tower 
const resetButton = document.getElementById('button1') //Grab button1 from html
function resetTower() { location.reload() }
resetButton.addEventListener('click', function(){ //give Button functionality - BUTTON ARMED
  resetTower()
})

resetButton.addEventListener('mouseover', function(){
  resetButton.className = "font-bold border-4 text-green-600 bg-blue-600 border-green-600 inline-block px-4 py-1 rounded-full"
})
resetButton.addEventListener('mouseout', ()=>{
  resetButton.className = "font-bold border-4 text-green-600 bg-yellow-400 border-green-600 inline-block px-4 py-1 rounded-full"
})

const guessButton = document.getElementById('guessButton')
guessButton.addEventListener('mouseover', function(){
  guessButton.className = "font-bold border-4 text-green-600 bg-blue-600 border-green-600 inline-block px-4 py-1 rounded-full"
})
guessButton.addEventListener('mouseout', ()=>{
  guessButton.className = "font-bold border-4 text-green-600 bg-yellow-400 border-green-600 inline-block px-4 py-1 rounded-full"
})

let guessCount = 0

const tooLowInt = []
const tooHighInt = []
const lowGuesses = document.getElementById('lowGuesses')
const highGuesses = document.getElementById('highGuesses')
const gameMessage = document.getElementById('gameMessage')

function checkGuess() {
  let guessedNumber = Number(document.getElementById('playerGuess').value)
  if (guessedNumber == 0) {
    gameMessage.innerText = "The number of GumBalls isn't 0! We wont count that as a guess, guess again."
  } else{
    guessCount += 1
    if (gameOver == true){
      guessCount -= 1
      gameMessage.innerText = "You guessed it already in " + guessCount + " tries! The number of GumBalls is still " + numberOfCandy + "!"
    }else if (tooLowInt.includes(guessedNumber) || tooHighInt.includes(guessedNumber)){
      gameMessage.innerText = "You already guessed that number. Guess a number you haven't tried yet!"
    }else if (guessedNumber == numberOfCandy && guessCount == 1){
      gameMessage.innerText = "You Guessed it! It took you " + guessCount + " try. There are " + numberOfCandy + " GumBalls!";
      gameOver = true
      winGame()
    }else if (guessedNumber == numberOfCandy && guessCount > 1){
      gameMessage.innerText = "You Guessed it! It took you " + guessCount + " tries. There are " + numberOfCandy + " GumBalls!";
      gameOver = true
      winGame()
    }else if (guessedNumber < numberOfCandy){
      tooLowInt.push(guessedNumber)
      gameMessage.innerText = "Your Guess of " + guessedNumber + " is Too Low, but Guess Again. You can still win!!"
      tooLowInt.sort(function(a, b){
        return a - b
      })
      lowGuesses.innerText = "Low Guesses: " + tooLowInt.join(', ')
    }else if (guessedNumber > numberOfCandy){
      tooHighInt.push(guessedNumber)
      gameMessage.innerText = "You Guessed Too High, Guess Lower than " + guessedNumber + ". You can still win this!"
      tooHighInt.sort(function(a, b){
        return a - b
      })
      highGuesses.innerText = "High Guesses: " + tooHighInt.join(', ')
    }else{
      console.log("error")
    }
  }
}


// guessButton.addEventListener('click', ()=>{
//   if(bgMusic.paused == true && !gameOver){
//     playAudio()
//   }
//     checkGuess()
//     document.getElementById('playerGuess').value = ''
// })

window.onkeyup = function(e) {
  let key = e.key.toLowerCase()
  if (key === 'enter'){
    // if(bgMusic.paused == true && !gameOver){
    //   playAudio()
    // }
    checkGuess()
    document.getElementById('playerGuess').value = ''
  }
}


function explodeCandy(){
  for (let i = 0; i < listOfEachCandy.length; i++){
    let randoX = (Math.random() - 0.51) * .005
    let randoZ = (Math.random() - 0.49) * .005
    let randoY = (Math.random() + 0.5) * 0.0015
    listOfEachCandy[i].applyImpulse(new CANNON.Vec3(randoX, randoY, randoZ), new CANNON.Vec3(0, 0, 0));
  }
}

const rotateGeometry = new THREE.SphereGeometry(1, 3, 2)
const rotateMaterial = new THREE.MeshBasicMaterial({visible: false})
const rotatePoint = new THREE.Mesh(rotateGeometry, rotateMaterial)
scene.add(rotatePoint)


function winGame(){
  // bgMusic.pause()
  winChime.play()
  winChime.addEventListener('ended', (e)=>{
    applaud.play()
  })
  // applaud.addEventListener('ended', (e)=>{
  //   bgMusic.play()
  // })

  const fontLoader = new FontLoader();
  fontLoader.load(
    '/fonts/Pixle_Font_Medium.json',
    (droidFont)=>{
        const textGeometry = new TextGeometry("YOU WIN".toString(), {
          height: 0.2,
          size: .6,
          rotationZ: Math.PI/2,
          font: droidFont,
        });
        const textMaterial = new THREE.MeshBasicMaterial({
          color: 0xe2619f,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.position.set(-1.6, 1.5 - tableOffset, 2)
        textMesh.rotation.set(0, 0, 0)
        rotatePoint.add(textMesh)
      }
    )
  fontLoader.load(
    '/fonts/Pixle_Font_Medium.json',
    (droidFont)=>{
        const textGeometry = new TextGeometry("YOU WIN".toString(), {
          height: 0.2,
          size: .6,
          rotationZ: Math.PI/2,
          font: droidFont,
        });
        const textMaterial = new THREE.MeshBasicMaterial({
          color: 0x000ff,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.position.set(1.6, 1.5 - tableOffset, -2)
        textMesh.rotation.set(0, Math.PI, 0)
        rotatePoint.add(textMesh)
      }
    )
    fontLoader.load(
      '/fonts/Pixle_Font_Medium.json',
      (droidFont)=>{
          const textGeometry = new TextGeometry("YOU WIN".toString(), {
            height: 0.2,
            size: .6,
            rotationZ: Math.PI/2,
            font: droidFont,
          });
          const textMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
          });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial)
          textMesh.position.set(-2, 1.5 - tableOffset, -1.6)
          textMesh.rotation.set(0, -Math.PI/2, 0)
          rotatePoint.add(textMesh)
        }
      )
      fontLoader.load(
        '/fonts/Pixle_Font_Medium.json',
        (droidFont)=>{
          const textGeometry = new TextGeometry("YOU WIN".toString(), {
            height: 0.2,
            size: .6,
            rotationZ: Math.PI/2,
            font: droidFont,
          });
          const textMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
          });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial)
          textMesh.position.set(2, 1.5 - tableOffset, 1.6)
          textMesh.rotation.set(0, Math.PI/2, 0)
          rotatePoint.add(textMesh)
        }
      )
  explodeCandy()
}




//ANIMATION FUNCTION
function animate() {
  requestAnimationFrame( animate );
  physicsWorld.fixedStep()
  // cannonDebugger.update()
  linkPhysics()
  renderer.render( scene, camera );
  // getCenterOfTopBlock()
  // topBlock.sleepState = 0
  // easterEgg.render(scene, camera)
  if(gameOver == true){
    rotatePoint.rotation.y += -0.015 

  }

}

animate();





