/*
 * uimanager.js
 * This script is responsible for handling various UI components
 * such as the titlescreen, back button in play mode, and various editing buttons
 */

// Maps string-based UIuuids to actual level objects
let uilevelsdict = new Map( )

function createLevelUIComponent( levelorpack, isBuiltin = false ) {
  let isPack = levelorpack.type == "levelpack"
  let uuid
  //This is probably Unecessary because an ID will be generated when the object is created and then used in all subsequent interations, but it causes no problems under normal operation and might help resolve issues in some usecases
  if ( uilevelsdict.has( levelorpack ) ) {
    uuid = uilevelsdict.get( levelorpack )
  } else {
    uuid = mkStringUUID( "ui-" )
    uilevelsdict.set( uuid, levelorpack )
    uilevelsdict.set( levelorpack, uuid )
  }
  let elem = document.createElement( "div" )
  elem.className = `${ isPack ? "levelpack" : "levelfullwidth" } ${ uuid }`
  
  let title = document.createElement( "h4" )
  title.className = "leveltitle"
  title.innerText = levelorpack.title
  elem.appendChild( title )
  
  if ( levelorpack.disc ) {
    let disc = document.createElement( "span" )
    disc.className = "leveldisc"
    disc.innerText = levelorpack.disc
    elem.appendChild( disc )
  }
  
  if ( levelorpack.author ) {
    let author = document.createElement( "span" )
    author.className = "levelauthor"
    author.innerText = levelorpack.author
    elem.appendChild( author )
  }
  
  if ( isPack ) {
    for ( let i = 0; i < levelorpack.levels.length; i++ ) {
      let level = levelorpack.levels[ i ]
      let levelelem = document.createElement( "button" )
      levelelem.className = "levelsmall"
      levelelem.dataset.levelIndex = i
      levelelem.innerText = i + 1
      elem.appendChild( levelelem )
    }
  }
  
  let toolbar = document.createElement( "div" )
  toolbar.className = "leveltoolbar"
  
  let play = document.createElement( "button" )
  play.className = "iconbutton play"
  toolbar.appendChild( play )
  
  // You can't directly edit builtin levels, but if you can make a copy to your custom levels and edit that
  let editorcopy = document.createElement( "button" )
  editorcopy.className = `iconbutton ${ isBuiltin ? "copy" : "edit" }`
  toolbar.appendChild( editorcopy )
  
  let download = document.createElement( "button" )
  download.className = "iconbutton download"
  toolbar.appendChild( download )
  
  // You can't delete builtin levels, so they have no delete button
  if ( !isBuiltin ) {
    let del = document.createElement( "button" )
    del.className = "iconbutton delete"
    toolbar.appendChild( del )
  }
  
  elem.appendChild( toolbar )
  
  let flag = document.createElement( "div" )
  flag.className = "flag"
  elem.appendChild( flag )
  
  document.getElementById( isBuiltin ? "builtinlevels" : "customlevels" ).appendChild( elem )
}

function markClear( levelorpack, clear = true ) {
  let flag = document.querySelector( `.${ uilevelsdict.get( levelorpack ) }` ).querySelector( ".flag" )
  flag.className = `flag ${ clear ? "completed" : "" }`
}

function markClearInPack( pack, index, clear = true ) {
  let levelbutton = document.querySelector( `.${ uilevelsdict.get( pack ) }` ).querySelector( `[data-level-index='${ index }']` )
  levelbutton.className = `levelsmall ${ clear ? "completed" : "" }`
}