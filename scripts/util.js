/*
 * util.js
 * This script contains various variables and functions that are used by multiple other scripts,
 * configuration and the like, and handles setup and launching into other scripts.
 */

const VERSION = {
  NUMBER      : "v3.0.0alpha017",
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
  temp: null,
  tempctx: null,
  w: 0,
  h: 0
}

const UNITSIZE = 16 // The size of one unit in pixels

const COLOR = {
  ground:      "#ccc",
  player:      "#44c",
  debugObject: "#0f0",
  dashIndicator: {
    outline: "#fff",
    outlineDead: "#888",
    fill: "#8accff"
  },
  trail: [ "#ffffff", "#8accff" ]
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
  canvases.temp = document.querySelector( ".temprenderer" )
  fullscreenCanvas( canvases.temp )
  canvases.tempctx = canvases.temp.getContext( "2d" )
  setupGamemanager( )
  setInterval( tick, 25 )
} )

window.addEventListener( "resize", ( ) => {
  fullscreenCanvas( canvases.game )
  fullscreenCanvas( canvases.editor )
  fullscreenCanvas( canvases.temp )
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
    gameTick( )
  } else if ( generalState.mode == "editor" ) {
    
  }
}

function mod( n, m ) {
  return ( ( n % m ) + m ) % m
}

function segmentSegmentIntersection( s1x1, s1y1, s1x2, s1y2, s2x1, s2y1, s2x2, s2y2 ) {
  let d = ( s1x1 - s1x2 ) * ( s2y1 - s2y2 ) - ( s1y1 - s1y2 ) * ( s2x1 - s2x2 )
  let t = ( ( s1x1 - s2x1 ) * ( s2y1 - s2y2 ) - ( s1y1 - s2y1 ) * ( s2x1 - s2x2 ) ) / d
  let u = - ( ( s1x1 - s1x2 ) * ( s1y1 - s2y1 ) - ( s1y1 - s1y2 ) * ( s1x1 - s2x1 ) ) / d
  let x = s1x1 + t * ( s1x2 - s1x1 ), y = s1y1 + t * ( s1y2 - s1y1 )
  let b = t > 0 && t <= 1 && u > 0 && u <= 1
  return { t, u, x, y, b }
}

function segmentCircleIntersection( ax, ay, bx, by, cx, cy, r ) {
  ax -= cx
  ay -= cy
  bx -= cx
  by -= cy
  
  let A = ax ** 2 + ay ** 2 - 2 * ( ax * bx + ay * by ) + bx ** 2 + by ** 2
  let B = 2 * ( ax * bx + ay * by - bx ** 2 - by ** 2 )
  let C = bx ** 2 + by ** 2 - r ** 2
  
  let t1 = ( -B + Math.sqrt( B ** 2 - ( 4 * A * C ) ) ) / ( 2 * A ),
      t2 = ( -B - Math.sqrt( B ** 2 - ( 4 * A * C ) ) ) / ( 2 * A )
  
  let t = Math.max( t1, t2 )
  
  let b = t > 0 && t <= 1
  
  let ix = ax * t + bx * ( 1 - t )
  let iy = ay * t + by * ( 1 - t )
  
  ix += cx
  iy += cy
  
  return { t, b, x: ix, y: iy }
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

function angleDifference( a1, a2 ) {
  let a = a1 - a2
  a = mod( a + Math.PI, 2 * Math.PI ) - Math.PI
  return a
}

function angleBetweenAngles( a, b, c ) {
  a -= b
  c -= b
  a = mod( a, 2 * Math.PI )
  c = mod( c, 2 * Math.PI )
  return a > 0 && a <= c
}

function lerp( a, b, t ) {
  return a * ( 1 - t ) + b * t
}

/* The following functions all assume a string color is "#rrggbb" exactly */

function rgbToStringColor( rgb ) {
  return `#${ rgb.r.toString( 16 ).padStart( 2, 0 ) }${ rgb.g.toString( 16 ).padStart( 2, 0 ) }${ rgb.b.toString( 16 ).padStart( 2, 0 ) }`
}

function stringColorToRgb( stringcolor ) {
  let r = parseInt( stringcolor.substring( 1, 3 ), 16 )
  let g = parseInt( stringcolor.substring( 3, 5 ), 16 )
  let b = parseInt( stringcolor.substring( 5, 7 ), 16 )
  return { r, g, b }
}

function lerpColor( a, b, t ) {
  let ca = stringColorToRgb( a ),
      cb = stringColorToRgb( b )
  return rgbToStringColor( {
    r: Math.round( lerp( ca.r, cb.r, t ) ),
    g: Math.round( lerp( ca.g, cb.g, t ) ),
    b: Math.round( lerp( ca.b, cb.b, t ) )
  } )
}