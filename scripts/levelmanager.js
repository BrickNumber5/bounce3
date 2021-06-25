/*
 * levelmanager.js
 * This script is responsible for how level and levelpack objects are handled on a data-level,
 * it holds the Level and LevelPack classes with their various data-functionalities.
 * It is also responsible for the functionality of adding and removing levels.
 */

let builtinLevels = new Set( ), customLevels = new Set( )

class LevelLike {
  constructor( title, disc, author, completed ) {
    this.title = title
    this.disc = disc
    this.author = author
    this.completed = completed
  }
  play( ) {
    startLevel( this )
  }
  
  edit( ) {
    // ...
  }
  
  download( ) {
    // ...
  }
  
  remove( ) {
    removeLevelUIComponent( this )
    customLevels.delete( this )
  }
  
  updateUI( ) {
    updateLevelUIComponent( this )
  }
  
  copy( ) {
    // ...
  }
}

class Level extends LevelLike {
  constructor ( title = "Untited Level", disc = "", author = "", completed = false, objects = [ ] ) {
    super( title, disc, author, completed )
    this.objects = objects
  }
  
  copy( ) {
    return new Level( this.title, this.disc, this.author, this.completed, this.objects.map( obj => obj.copy( ) ) )
  }
}

// A LevelPack is largely just a wrapper around an array of levels with some convience functions 
class LevelPack extends LevelLike {
  constructor ( title = "Untitled Level Pack", disc = "", author = "", completed = false, levels = [ ] ) {
    super( title, disc, author, completed )
    this.levels = levels
    t = this
    this.levels.forEach( l => l.pack = t )
  }
  
  copy( ) {
    return new LevelPack( this.title, this.disc, this.author, this.completed, this.levels.map( l => l.copy( ) ) )
  }
}

function newLevel( ) {
  importLevel( new Level( ) )
}

function newLevelPack( ) {
  importLevel( new LevelPack( ) )
}

function importLevel( levellike, isBuiltin = false ) {
  if ( isBuiltin ) {
    builtinLevels.add( levellike )
  } else {
    customLevels.add( levellike )
  }
  createLevelUIComponent( levellike, isBuiltin )
}