/*
 * levelobjects/template.js
 * Contains the base LevelObject class from which all level objects are extended
 */

class LevelObject {
  constructor( ) {
    
  }
  
  //The following are a large list of functions that any LevelObject can override, and an explanation of what they do
  onBuild( ) {
    // This function is run when the game switches into play mode on the level this object is contained within
  }
  
  onSpawn( ) {
    // This function is run when the player spawns or respawns
  }
  
  onSpawnFirst( ) {
    // This function is run when the player spawns or respawns at the initial spawn position
  }
  
  onSpawnCheckpoint( ) {
    // This function is run when the play respawns at a checkpoint
  }
  
  getContainedChunks( ) {
    // This function should return a list of all the chunk positions this object is contained in,
    // i.e. any chunk that should render this object, or should cause physics calculations on this
    // object if the screen / player is suffeciently close
    return [ ]
  }
  
  static renderAll( cnvs, ctx, objs ) {
    // This function is called in this object's render step with cnvs and ctx being the canvas to render to
    // and a context for that canvas, and objs being a list of all objects of this type within the viewport as defined by their chunks
  }
  
  static renderAllEditor( cnvs, ctx, objs ) {
    // Same as renderAll but runs in the editor
  }
  
  onTick( elapsedTime ) {
    // Runs every game tick, is passed the time that has elapsed since the last tick, which is useful for timers and such, this function
    // runs regardless of the object's chunks
  }
  
  onTickEditor( elapsedTime ) {
    // Runs every game tick in the editor
  }
}

LevelObject.renderOrder = -1 // Lower Numbers render first, higher numbers render later, negative numbers don't render at all.
                             // This value can also be an array for objects that render at multiple points, the renderAll and renderAllEditor functions
                             // will recieve a fourth parameter "renderStep" for objects using this functionality