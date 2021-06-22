/*
 * util.js
 * This script contains various variables and functions that are used by multiple other scripts,
 * configuration and the like, and handles setup and launching into other scripts.
 */

const VERSION = {
  NUMBER      : "v3.0.0alpha009",
  NAME        : "Nonpublic Alpha Build",
  EXPERIMENTAL: true
}

const generalState = {
  __mode__: "menu",
  get mode( ) { return this.__mode__ },
  set mode( x ) {
    this.prevMode = this.__mode__
    this.__mode__ = x
    setUIPage( x )
  },
  prevMode: "menu",
  exitMode( ) {
    this.mode = this.prevMode
    this.prevMode = "menu"
  }
}

const canvases = {
  game: null,
  gamectx: null,
  editor: null,
  editorctx: null,
  w: 0,
  h: 0
}

const UNITSIZE = 20 // The size of one unit in pixels

const COLOR = {
  bgClr: "#333",
  bgDarker: "#181818",
  bgLighter: "#484848",
  bgGreen: "#484",
  fgClr: "#ccc",
  fgDarker: "#999",
  fgLighter: "#eee",
  fgCyan: "#3cc",
  fgMagenta: "#c3c",
  fgYellow: "#cc3",
  fgRed: "#c66",
  fgGreen: "#6c6",
  fgBlue: "#66c",
  mgClr: "#666",
  mgDarker: "#555",
  mgLighter: "#777",
}

const levelObjectTypes = [ ]

// Creates strings of the form "XXXX-XXXX-XXXX-XXXX" where X is a random hex digit
let usedStringUUIDS = new Set( ) // To insure no UUID reusage is possible
function mkStringUUID( prefix = "" ) {
  let uuid = Array.from( { length: 4 }, ( ) => Array.from( { length: 4 }, ( ) => Math.floor( Math.random( ) * 16 ).toString( 16 ) ).join( "" ) ).join( "-" )
  if ( usedStringUUIDS.has( uuid ) ) {
    return mkStringUUID( prefix )
  }
  usedStringUUIDS.add( uuid )
  return prefix + uuid
}

window.addEventListener( "load", ( ) => {
  setVersionDisplays( ) // From uimanager.js
  canvases.game = document.querySelector( ".gamescreen .mainrenderer" )
  fullscreenCanvas( canvases.game )
  canvases.gamectx = canvases.game.getContext( "2d" )
  canvases.editor = document.querySelector( ".editorscreen .mainrenderer" )
  fullscreenCanvas( canvases.editor )
  canvases.editorctx = canvases.editor.getContext( "2d" )
  setInterval( tick, 25 )
} )

window.addEventListener( "resize", ( ) => {
  fullscreenCanvas( canvases.game )
  fullscreenCanvas( canvases.editor )
} )

function fullscreenCanvas( canvas ) {
  canvas.width  = canvases.w = window.innerWidth
  canvas.height = canvases.h = window.innerHeight
}

let elapsedTime = 0, lastTime = +new Date( )
function tick( ) {
  let t = +new Date( )
  elapsedTime = t - lastTime
  lastTime = t
  if ( generalState.mode == "menu" ) return
  if ( generalState.mode == "game" ) {
    renderGame( )
  } else if ( generalState.mode == "editor" ) {
    
  }
}