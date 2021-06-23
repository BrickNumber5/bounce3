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