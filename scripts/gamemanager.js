/*
 * gamemanager.js
 * Handles a lot of general purpose gameplay logic, but also delegates a lot
 * of logic to renderer.js and physicsengine.js
 */

let levelsQueue = [ ]
function startLevel( levellike ) {
  levelsQueue = levellike instanceof LevelPack ? [ ...levellike.levels ] : [ levellike ]
  generalState.mode = "game"
  startNextLevel( )
}

// Pulls levels from the Queue
function startNextLevel( ) {
  
}

// Immediatly Ends the current Level
function stopGame( ) {
  generalState.exitMode( )
}