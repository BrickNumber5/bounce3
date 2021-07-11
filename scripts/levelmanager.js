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
    editLevel( this )
  }
  
  download( ) {
    downloadFile( this.title + ".bounce", dotbounce.encode( this ) )
  }
  
  remove( ) {
    if ( confirm( `Delete '${ this.title }'?` ) ) {
      removeLevelUIComponent( this )
      customLevels.delete( this )
      saveCustomLevels( )
    }
  }
  
  updateUI( ) {
    updateLevelUIComponent( this )
  }
  
  copy( ) {
    // ...
  }
}

class Level extends LevelLike {
  constructor ( title = "Untitled Level", disc = "", author = "", completed = false, objects = [ ], spawnPoint = { x: 0, y: 0 } ) {
    super( title, disc, author, completed )
    this.objects = new Set( objects )
    this.spawnPoint = spawnPoint
  }
  
  copy( ) {
    return new Level( this.title, this.disc, this.author, this.completed, [ ...this.objects ].map( obj => obj.copy( ) ) )
  }
  
  markCompleted( completed = true ) {
    this.completed = completed
    if ( this.pack ) {
      updateLevelUIComponent( this.pack )
    } else {
      updateLevelUIComponent( this )
    }
    if ( this.pack ) this.pack.checkCompleted( )
    saveCustomLevels( )
  }
}

dotbounce.globalSpecialDictionary.push( {
  stringIndex: "Level",
  parserFunction: ( title, disc, author, objects, spawnPoint ) => new Level(
    makeTrimmedString( title, MAXTITLELENGTH ),
    makeTrimmedString( disc, MAXDISCLENGTH ),
    makeTrimmedString( author, MAXAUTHORLENGTH ),
    false,
    assertInstanceof( objects, Array ).map( obj => assertInstanceof( obj, LevelObject ) ),
    { x: makeInteger( ( spawnPoint ?? { x: 0 } ).x ), y: makeInteger( ( spawnPoint ?? { y: 0 } ).y ) }
  ),
  test: obj => obj instanceof Level,
  getValues: obj => [ obj.title, obj.disc, obj.author, [ ...obj.objects ], obj.spawnPoint ]
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
  
  checkCompleted( ) {
    for ( let i = 0; i < this.levels.length; i++ ) {
      if ( !this.levels[ i ].completed ) {
        this.completed = false
        updateLevelUIComponent( this )
        return
      }
    }
    this.completed = true
    updateLevelUIComponent( this )
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

const UserLevelsSpecialDictionary = new dotbounce.SpecialDictionary(
  {
    stringIndex: "Level",
    parserFunction: ( title, disc, author, objects, completed, spawnPoint ) => new Level(
      makeTrimmedString( title, MAXTITLELENGTH ),
      makeTrimmedString( disc, MAXDISCLENGTH ),
      makeTrimmedString( author, MAXAUTHORLENGTH ),
      assertTypeof( completed ?? false, "boolean" ),
      assertInstanceof( objects, Array ).map( obj => assertInstanceof( obj, LevelObject ) ),
      { x: makeInteger( ( spawnPoint ?? { x: 0 } ).x ), y: makeInteger( ( spawnPoint ?? { y: 0 } ).y ) }
    ),
    test: obj => obj instanceof Level,
    getValues: obj => [ obj.title, obj.disc, obj.author, [ ...obj.objects ], obj.completed, obj.spawnPoint ]
  },
  {
    stringIndex: "LevelPack",
    parserFunction: ( title, disc, author, levels, completed ) => new LevelPack(
      makeTrimmedString( title, MAXTITLELENGTH ),
      makeTrimmedString( disc, MAXDISCLENGTH ),
      makeTrimmedString( author, MAXAUTHORLENGTH ),
      assertTypeof( completed ?? false, "boolean" ),
      assertInstanceof( levels, Array ).map( level => assertInstanceof( level, Level ) )
    ),
    test: obj => obj instanceof LevelPack,
    getValues: obj => [ obj.title, obj.disc, obj.author, obj.levels, obj.completed ]
  }
)

function saveCustomLevels( ) {
  localStorage.setItem( CUSTOMLEVELSHANDLE, arrayBufferToBinaryString( dotbounce.encode( [ ...customLevels ], UserLevelsSpecialDictionary ) ) )
}

function loadCustomLevels( ) {
  if ( localStorage.getItem( CUSTOMLEVELSHANDLE ) !== null ) {
    dotbounce.parse( binaryStringToArrayBuffer( localStorage.getItem( CUSTOMLEVELSHANDLE ) ), UserLevelsSpecialDictionary ).forEach(
      levellike => importLevel( levellike, false, false )
    )
  }
  saveCustomLevels( )
}

function archiveCustomLevels( ) {
  downloadFile( `Custom Levels Archive - ${ new Date( ).toDateString( ) }.bounce`, dotbounce.encode( { is: "[Bounce:CustomLevelsArchive]", levels: [ ...customLevels ] } ) )
}