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
    
    // ! NOT YET USED BY GAME
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
    
    // ! NOT YET USED BY GAME
  }
  
  onTickEditor( elapsedTime ) {
    // Runs every game tick in the editor
    
    // ! NOT YET USED BY GAME
  }
  
  getAnchors( ) {
    // This function should return an array of all the editable points in this object as Coordinate Anchors
  }
  
  isHoveredBy( x, y ) {
    // This function should return if a given x-y coordinate pair overlaps it. This is used to detect selection in the editor
  }
  
  copy( ) {
    // This function should return a data-accurate but unlinked copy of the level object
  }
}

//dotbounce.globalSpecialDictionary.push( {
//  stringIndex: "...",
//  parserFunction: ... => new ...( ... ),
//  test: obj => obj instanceof ...,
//  getValues: obj => [ ... ]
//} )

// levelObjectTypes.push( ... )