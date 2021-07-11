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
  dash: false,
  goalTimer: Infinity
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

let PAUSED = false

function gameTick( ) {
  if ( !PAUSED ) {
    physicsStep( elapsedTime )
    renderGame( )
    player.goalTimer -= elapsedTime
    if ( player.goalTimer <= 0 ) {
      clearLevel( )
    }
  }
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
  ;[ ...currentLevel.objects ].forEach( lo => lo.onBuild( ) )
  levelObjectTypes.forEach( lot => lot.currentLevelInstances = new Set( [ ...currentLevel.objects ].filter( lo => lo instanceof lot ) ) )
  trail = Array.from( { length: TRAILLENGTH }, ( ) => ( { x: null, y: null } ) )
  spawnPlayer( )
}

function clearLevel( ) {
  currentLevel.markCompleted( )
  if ( levelsQueue.length === 0 ) {
    stopGame( )
  } else {
    startNextLevel( )
  }
}

function spawnPlayer( spawnPoint = null, first = true ) {
  spawnPoint ??= currentLevel.spawnPoint
  player.x  = spawnPoint.x
  player.y  = spawnPoint.y
  player.vx = player.vy = 0
  player.dash = false
  player.goalTimer = Infinity
  ;[ ...currentLevel.objects ].forEach( lo => lo.onSpawn( ) )
  ;[ ...currentLevel.objects ].forEach( lo => first ? lo.onSpawnFirst( ) : onSpawnCheckPoint( ) )
  trail.shift( )
  trail.push( { x: null, y: null } )
}

// Immediatly Ends the current Level
function stopGame( ) {
  generalState.exitMode( )
}

function setupGamemanager( ) {
  let cnvs = canvases.game
  cnvs.addEventListener( "mousedown", startDash, { passive: false } )
  cnvs.addEventListener( "mousemove", editDash, { passive: false } )
  cnvs.addEventListener( "mouseup", releaseDash, { passive: false } )
  cnvs.addEventListener( "mouseleave", cancelDash, { passive: false } )
  const touchMouseAdaptor = fn => e => { fn( e.targetTouches.item( 0 ) ); e.preventDefault( ) }
  cnvs.addEventListener( "touchstart", touchMouseAdaptor( startDash ), { passive: false } )
  cnvs.addEventListener( "touchmove", touchMouseAdaptor( editDash ), { passive: false } )
  cnvs.addEventListener( "touchend", touchMouseAdaptor( releaseDash ), { passive: false } )
  cnvs.addEventListener( "touchcancel", touchMouseAdaptor( cancelDash ), { passive: false } )
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

function cancelDash( ) {
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

function pause( ) {
  PAUSED = true
  document.querySelector( ".pausedscreen" ).style.display = ""
}

function unpause( ) {
  PAUSED = false
  document.querySelector( ".pausedscreen" ).style.display = "none"
}

function handleKeyPressGame( e ) {
  if ( !PAUSED ) {
    switch ( e.key ) {
      case "Escape":
        stopGame( )
        break
      case "r":
        spawnPlayer( )
        break
      case "p":
        pause( )
        break
    }
  } else if ( e.key === "Enter" || e.key === "Escape" ) {
    unpause( )
  }
}