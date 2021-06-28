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
    downloadFile( this.title + ".bounce", dotbounce.encode( this ) )
  }
  
  remove( ) {
    removeLevelUIComponent( this )
    customLevels.delete( this )
    saveCustomLevels( )
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

dotbounce.globalSpecialDictionary.push( {
  stringIndex: "Level",
  parserFunction: ( title, disc, author, objects ) => new Level(
    makeTrimmedString( title, MAXTITLELENGTH ),
    makeTrimmedString( disc, MAXDISCLENGTH ),
    makeTrimmedString( author, MAXAUTHORLENGTH ),
    false,
    assertInstanceof( objects, Array ).map( obj => assertInstanceof( obj, LevelObject ) )
  ),
  test: obj => obj instanceof Level,
  getValues: obj => [ obj.title, obj.disc, obj.author, obj.objects ]
} )

// A LevelPack is largely just a wrapper around an array of levels with some convience functions 
class LevelPack extends LevelLike {
  constructor ( title = "Untitled Level Pack", disc = "", author = "", completed = false, levels = [ ] ) {
    super( title, disc, author, completed )
    this.levels = levels
    let t = this
    this.levels.forEach( l => l.pack = t )
  }
  
  copy( ) {
    return new LevelPack( this.title, this.disc, this.author, this.completed, this.levels.map( l => l.copy( ) ) )
  }
}

dotbounce.globalSpecialDictionary.push( {
  stringIndex: "LevelPack",
  parserFunction: ( title, disc, author, levels ) => new LevelPack(
    makeTrimmedString( title, MAXTITLELENGTH ),
    makeTrimmedString( disc, MAXDISCLENGTH ),
    makeTrimmedString( author, MAXAUTHORLENGTH ),
    false,
    assertInstanceof( levels, Array ).map( level => assertInstanceof( level, Level ) )
  ),
  test: obj => obj instanceof LevelPack,
  getValues: obj => [ obj.title, obj.disc, obj.author, obj.levels ]
} )

function newLevel( ) {
  importLevel( new Level( ) )
}

function newLevelPack( ) {
  importLevel( new LevelPack( ) )
}

function uploadLevel( ) {
  uploadFile( file => {
    let val = dotbounce.parse( file )
    if ( val.is === "[Bounce:CustomLevelsArchive]" ) {
      if ( confirm( `Upload ${ val.levels.length } level${ val.levels.length === 1 ? "" : "s" } from this Custom Levels Archive?` ) ) {
        for ( let i = 0; i < val.levels.length; i++ ) {
          importLevel( assertInstanceof( val.levels[ i ], LevelLike ), false, false )
        }
        return
      }
    }
    importLevel( assertInstanceof( val, LevelLike ) )
  } )
}

function importLevel( levellike, isBuiltin = false, autoSave = true ) {
  if ( isBuiltin ) {
    builtinLevels.add( levellike )
  } else {
    customLevels.add( levellike )
  }
  createLevelUIComponent( levellike, isBuiltin )
  if ( !isBuiltin && autoSave ) {
    saveCustomLevels( )
  }
}

function saveCustomLevels( ) {
  localStorage.setItem( CUSTOMLEVELSHANDLE, arrayBufferToBinaryString( dotbounce.encode( [ ...customLevels ] ) ) )
}

function loadCustomLevels( ) {
  dotbounce.parse( binaryStringToArrayBuffer( localStorage.getItem( CUSTOMLEVELSHANDLE ) ) ).forEach( levellike => importLevel( levellike, false, false ) )
  saveCustomLevels( )
}

function archiveCustomLevels( ) {
  downloadFile( `Custom Levels Archive - ${ new Date( ).toDateString( ) }.bounce`, dotbounce.encode( { is: "[Bounce:CustomLevelsArchive]", levels: [ ...customLevels ] } ) )
}