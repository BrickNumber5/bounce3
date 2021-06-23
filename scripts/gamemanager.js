/*
 * gamemanager.js
 * Handles a lot of general purpose gameplay logic, but also delegates a lot
 * of logic to renderer.js and physicsengine.js
 */

let player = {
  x:    0,
  y:    0,
  vx:   0,
  vy:   0,
  dash: false
}

let dashInterfaceData = {
  active: false,
  x1: null,
  y1: null,
  x2: null,
  y2: null,
  ax: null,
  ay: null
}

let levelsQueue = [ ], currentLevel
function startLevel( levellike ) {
  levelsQueue = levellike instanceof LevelPack ? [ ...levellike.levels ] : [ levellike ]
  generalState.mode = "game"
  startNextLevel( )
}

// Pulls levels from the Queue
function startNextLevel( ) {
  currentLevel = levelsQueue.shift( )
  currentLevel.objects.forEach( lo => lo.onBuild( ) )
  levelObjectTypes.forEach( lot => lot.currentLevelInstances = currentLevel.objects.filter( lo => lo instanceof lot ) )
  spawnPlayer( )
}

function spawnPlayer( spawnPoint = { x: 0, y: 0 }, first = true ) {
  player.x  = spawnPoint.x
  player.y  = spawnPoint.y
  player.vx = player.vy = 0
  player.dash = false
  currentLevel.objects.forEach( lo => lo.onSpawn( ) )
  currentLevel.objects.forEach( lo => first ? lo.onSpawnFirst( ) : onSpawnCheckPoint( ) )
}

// Immediatly Ends the current Level
function stopGame( ) {
  generalState.exitMode( )
}

function setupGamemanager( ) {
  let cnvs = canvases.game
  cnvs.addEventListener( "mousedown", startDash )
  cnvs.addEventListener( "mousemove", editDash )
  cnvs.addEventListener( "mouseup", releaseDash )
}

function startDash( e ) {
  dashInterfaceData.active = true
  dashInterfaceData.x1 =  e.clientX
  dashInterfaceData.y1 = -e.clientY
  editDash( e )
}

function editDash( e ) {
  if ( !dashInterfaceData.active ) return
  dashInterfaceData.x2 =  e.clientX
  dashInterfaceData.y2 = -e.clientY
  let dx = ( dashInterfaceData.x2 - dashInterfaceData.x1 ),
      dy = ( dashInterfaceData.y2 - dashInterfaceData.y1 )
  let oneOverLength = 1 / Math.sqrt( dx ** 2 + dy ** 2 )
  dashInterfaceData.ax = dx * oneOverLength
  dashInterfaceData.ay = dy * oneOverLength
}

function releaseDash( ) {
  if ( ( ( dashInterfaceData.x1 != dashInterfaceData.x2 ) || ( dashInterfaceData.y1 != dashInterfaceData.y2 ) ) && player.dash ) preformDash( )
  dashInterfaceData = {
    active: false,
    x1: null,
    y1: null,
    x2: null,
    y2: null,
    ax: null,
    ay: null
  }
}

function preformDash( ) {
  player.vx += DASHSTRENGTH * -dashInterfaceData.ax
  player.vy += DASHSTRENGTH * -dashInterfaceData.ay
  player.dash = false
}