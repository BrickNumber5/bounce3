/*
 * uimanager.js
 * This script is responsible for handling various UI components
 * such as the titlescreen, back button in play mode, and various editing buttons.
 */

// Maps string-based UIuuids to actual level objects
let uilevelsdict = new Map( )

function createLevelUIComponent( levellike, isBuiltin = false ) {
  let isPack = levellike instanceof LevelPack
  
  let uuid = mkStringUUID( "ui-" )
  uilevelsdict.set( uuid, levellike )
  uilevelsdict.set( levellike, uuid )
  
  let elem = document.createElement( "div" )
  elem.className = `${ isPack ? "levelpack" : "levelfullwidth" } ${ uuid }`
  
  let title = document.createElement( "h4" )
  title.className = "leveltitle"
  title.innerText = levellike.title
  elem.appendChild( title )
  
  let disc = document.createElement( "span" )
  disc.className = "leveldisc"
  disc.innerText = levellike.disc
  disc.style.display = levellike.disc ? "" : "none"
  elem.appendChild( disc )
  
  let author = document.createElement( "span" )
  author.className = "levelauthor"
  author.innerText = levellike.author
  author.style.display = levellike.author ? "" : "none"
  elem.appendChild( author )
  
  if ( isPack ) {
    let levels = document.createElement( "div" )
    levels.className = "levellevels" // Is this an extremely silly name? Yes, it is. Is using "level" as a generic for all levellikes a little silly to begin with? Yes. Is this the natural consequences of my naming conventions? Also, Yes. Am I going to do anything to change it? No.. Why Would I Do That?
    levels.dataset.numLevels = levellike.levels.length
    for ( let i = 0; i < levellike.levels.length; i++ ) {
      let level = levellike.levels[ i ]
      let levelelem = document.createElement( "button" )
      levelelem.className = `levelsmall ${ levellike.levels[ i ].completed ? "completed" : "" }`
      levelelem.dataset.levelIndex = i
      levelelem.innerText = i + 1
      levels.appendChild( levelelem )
    }
    elem.appendChild( levels )
  }
  
  let toolbar = document.createElement( "div" )
  toolbar.className = "leveltoolbar"
  
  let play = document.createElement( "button" )
  play.className = "iconbutton play"
  play.onclick = levellike.play.bind( levellike )
  toolbar.appendChild( play )
  
  // You can't directly edit builtin levels, but if you can make a copy to your custom levels and edit that
  let editorcopy = document.createElement( "button" )
  editorcopy.className = `iconbutton ${ isBuiltin ? "copy" : "edit" }`
  editorcopy.onclick = isBuiltin ? ( ( ) => console.log( "## COPY ##" ) ) : levellike.edit.bind( levellike )
  toolbar.appendChild( editorcopy )
  
  let download = document.createElement( "button" )
  download.className = "iconbutton download"
  download.onclick = levellike.download.bind( levellike )
  toolbar.appendChild( download )
  
  // You can't delete builtin levels, so they have no delete button
  if ( !isBuiltin ) {
    let del = document.createElement( "button" )
    del.className = "iconbutton delete"
    del.onclick = levellike.remove.bind( levellike )
    toolbar.appendChild( del )
  }
  
  elem.appendChild( toolbar )
  
  let flag = document.createElement( "div" )
  flag.className = `flag ${ levellike.completed ? "completed" : "" }`
  elem.appendChild( flag )
  
  document.getElementById( isBuiltin ? "builtinlevels" : "customlevels" ).appendChild( elem )
}

function updateLevelUIComponent( levellike ) {
  let isPack = levellike instanceof LevelPack
  let elem = document.querySelector( `.${ uilevelsdict.get( levellike ) }` )

  elem.querySelector( ".leveltitle"  ).innerText = levellike.title
  let disc = elem.querySelector( ".leveldisc" )
  disc.innerText = levellike.disc
  disc.style.display = levellike.disc ? "" : "none"
  let author = elem.querySelector( ".levelauthor" )
  author.innerText = levellike.author
  author.style.display = levellike.author ? "" : "none"
  
  if ( isPack ) {
    let levels = elem.querySelector( ".levellevels" )
    if ( +levels.dataset.numLevels < levellike.levels.length ) {
      for ( let i = +levels.dataset.numLevels; i < levellike.levels.length; i++ ) {
        let levelelem = document.createElement( "div" )
        levelelem.dataset.levelIndex = i
        levelelem.innerText = i + 1
        levels.appendChild( levelelem )
      }
    } else if ( +levels.dataset.numLevels > levellike.levels.length ) {
      for ( let i = +levels.dataset.numLevels - 1; i >= levellike.levels.length; i-- ) {
        levels.removeChild( levels.querySelector( `[data-level-index='${ i }']` ) )
      }
    }
    levels.dataset.numLevels = levellike.levels.length
    for ( let i = 0; i < levellike.levels.length; i++ ) {
      levels.querySelector( `[data-level-index='${ i }']` ).className = `levelsmall ${ levellike.levels[ i ].completed ? "completed" : "" }`
    }
  }
  
  elem.querySelector( ".flag" ).className = `flag ${ levellike.completed ? "completed" : "" }`
}

function removeLevelUIComponent( levellike ) {
  let uuid = uilevelsdict.get( levellike )
  let elem = document.querySelector( `.${ uuid }` )
  elem.parentNode.removeChild( elem )
  uilevelsdict.delete( uuid )
  uilevelsdict.delete( levellike )
}

function setVersionDisplays( ) {
  document.querySelector( "title" ).innerText = "Bounce " + VERSION.NUMBER
  let versionLine = document.querySelector( ".subtitle" )
  
  let versionNumber = document.createElement( "span" )
  versionNumber.className = "versionnumber"
  let vntxt = "", rnum = ""
  for ( let i = 0; i < VERSION.NUMBER.length; i++ ) {
    let chr = VERSION.NUMBER[ i ]
    if ( /\d/.test( chr ) ) {
      rnum += chr
    } else {
      if ( rnum !== "" ) {
        vntxt += `<span class="num">${ rnum }</span>`
        rnum = ""
      }
      vntxt += chr
    }
  }
  if ( rnum !== "" ) {
    vntxt += `<span class="num">${ rnum }</span>`
    rnum = ""
  }
  versionNumber.innerHTML = vntxt
  versionLine.appendChild( versionNumber )
  
  let seperator = document.createElement( "span" )
  seperator.className = "seperator"
  seperator.innerText = " - "
  versionLine.appendChild( seperator )
  
  let versionName = document.createElement( "span" )
  versionName.className = "versionname"
  versionName.innerText = VERSION.NAME.replace( " ", "\u00a0" /* NBSP */ )
  versionLine.appendChild( versionName )
  
  let changelog = document.createElement( "span" )
  changelog.className = "changelog"
  changelog.innerHTML = ' (<a target="_blank" href="about:blank">changelog</a>)'
  versionLine.appendChild( changelog )
  
  if ( VERSION.EXPERIMENTAL ) {
    let experimental = document.createElement( "div" )
    experimental.className = "experimental"
    versionLine.appendChild( experimental )
  }
}