/*
 * gamemanager.js
 * Handles a lot of general purpose gameplay logic, but also delegates a lot
 * of logic to renderer.js and physicsengine.js
 */

let levelsQueue = [ ], currentLevel
function startLevel( levellike ) {
  levelsQueue = levellike instanceof LevelPack ? [ ...levellike.levels ] : [ levellike ]
  generalState.mode = "game"
  startNextLevel( )
}

// Pulls levels from the Queue
function startNextLevel( ) {
  currentLevel = levelsQueue.shift( )
  levelObjectTypes.forEach( lot => lot.currentLevelInstances = currentLevel.objects.filter( lo => lo instanceof lot ) )
}

// Immediatly Ends the current Level
function stopGame( ) {
  generalState.exitMode( )
}