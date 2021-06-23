/*
 * util.js
 * This script contains various variables and functions that are used by multiple other scripts,
 * configuration and the like, and handles setup and launching into other scripts.
 */

const VERSION = {
  NUMBER      : "v3.0.0alpha010",
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
  ground:      "#ccc",
  player:      "#66c",
  debugObject: "#0f0"
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

let SHOWDEBUGINFO = false // Set this to true ( for instance via the console ) to make debug info show up

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
    physicsStep( elapsedTime )
    renderGame( )
  } else if ( generalState.mode == "editor" ) {
    
  }
}

function segmentSegmentIntersection( s1x1, s1y1, s1x2, s1y2, s2x1, s2y1, s2x2, s2y2 ) {
  let d = ( s1x1 - s1x2 ) * ( s2y1 - s2y2 ) - ( s1y1 - s1y2 ) * ( s2x1 - s2x2 )
  let t = ( ( s1x1 - s2x1 ) * ( s2y1 - s2y2 ) - ( s1y1 - s2y1 ) * ( s2x1 - s2x2 ) ) / d
  let u = - ( ( s1x1 - s1x2 ) * ( s1y1 - s2y1 ) - ( s1y1 - s1y2 ) * ( s1x1 - s2x1 ) ) / d
  let x = s1x1 + t * ( s1x2 - s1x1 ), y = s1y1 + t * ( s1y2 - s1y1 )
  let b = t > 0 && t <= 1 && u > 0 && u <= 1
  return { t, u, x, y, b }
}

function reflectPointOverLine( p, q, x1, y1, x2, y2 ) {
  // ax + by + c = 0
  let a = y1 - y2, b = x2 - x1, c = x1 * y2 - x2 * y1
  let ab2 = a ** 2 + b ** 2
  return {
    x: ( p * ( b ** 2 - a ** 2 ) - 2 * a * ( b * q + c ) ) / ab2,
    y: ( q * ( a ** 2 - b ** 2 ) - 2 * b * ( a * p + c ) ) / ab2
  }
}