/*
 * util.js
 * This script contains various variables and functions that are used by multiple other scripts,
 * configuration and the like, and handles setup and launching into other scripts.
 */

const VERSION = {
  NUMBER      : "v3.0.0alpha049",
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
    editorSetTool( "adjust" )
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
  trail: [ "#ffffff", "#8accff" ],
  star: [ "#ff7b7b", "#fffde0" ],
  goalTape: {
    black: "#000",
    white: "#fff"
  },
  editor: {
    spawnPoint: "#4cc",
    grid: "#99AAC3",
    coordinateAnchor: {
      fill: "#fff",
      stroke: "#c66"
    }
  }
}

const levelObjectTypes = [ ]

const MAXTITLELENGTH  = 75
const MAXDISCLENGTH   = 350
const MAXAUTHORLENGTH = 35

const CUSTOMLEVELSHANDLE = "[Bounce3:UsrSave/CustomLevels]"

const EDITORAUTOSAVETIMEOUT = 5 * 60 * 1000 // 5 minutes in ms

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
  setupEditor( )
  loadCustomLevels( )
  setInterval( tick, 25 )
} )

window.addEventListener( "resize", ( ) => {
  fullscreenCanvas( canvases.game )
  fullscreenCanvas( canvases.editor )
  fullscreenCanvas( canvases.temp )
} )

window.addEventListener( "blur", ( ) => {
  if ( generalState.mode == "game" ) {
    pause( )
  }
} )

window.addEventListener( "keyup", e => {
  if ( generalState.mode == "game" ) {
    handleKeyPressGame( e )
  } else if ( generalState.mode == "editor" ) {
    handleKeyPressEditor( e )
  }
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
    editorTick( )
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

// The following 2 functions are in concept although not in implementation "stolen" shamelessly from here:
// https://math.stackexchange.com/questions/2193720/find-a-point-on-a-line-segment-which-is-the-closest-to-other-point-not-on-the-li

function nearestPointOnLine( x, y, x1, y1, x2, y2 ) {
  let vx = x2 - x1,
      vy = y2 - y1,
      ux = x1 - x,
      uy = y1 - y,
      vu = vx * ux + vy * uy,
      vv = vx * vx + vy * vy,
       t = -vu / vv
  return { t, x: t * x2 + ( 1 - t ) * x1, y: t * y2 + ( 1 - t ) * y1 }
}

function nearestPointOnSegment( x, y, x1, y1, x2, y2 ) {
  let npl = nearestPointOnLine( x, y, x1, y1, x2, y2 )
  if ( npl.t >= 0 && npl.t <= 1 ) return npl
  if ( npl.t < 0 ) return { t: 0, x: x1, y: y1 }
  return { t: 1, x: x2, y: y2 }
}

function sqrDistToSegment( x, y, x1, y1, x2, y2 ) {
  let nps = nearestPointOnSegment( x, y, x1, y1, x2, y2 )
  return ( nps.x - x ) ** 2 + ( nps.y - y ) ** 2
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

function downloadFile( name, arrayBuffer ) {
  // Requires and consumes a user-gesture for .click( )
  let blob = new Blob( [ arrayBuffer ] )
  let a = document.createElement( "a" )
  a.href = URL.createObjectURL( blob )
  a.download = name
  a.click( )
}

function uploadFile( callback ) {
  // Requires and consumes a user-gesture for .click( )
  let inp = document.createElement( "input" )
  inp.type = "file"
  inp.accept = ".bounce"
  inp.multiple = true
  inp.onchange = ( ) => {
    let files = inp.files, fileBuffers = [ ]
    const reader = new FileReader( )
    reader.addEventListener( "load", ( ) => {
      callback( reader.result )
      i++
      if ( i < files.length ) { reader.readAsArrayBuffer( files[ i ] ) }
    } )
    let i = 0
    reader.readAsArrayBuffer( files[ i ] )
  }
  inp.click( )
}

function assertTypeof( object, type ) {
  if ( typeof object !== type ) {
    throw new Error( `Expected ${ type }, found ${ object }` )
  }
  return object
}

function assertInstanceof( object, _class ) {
  if ( !( object instanceof _class ) ) {
    throw new Error( `Expected an instance of ${ _class.name }, found ${ object }` )
  }
  return object
}

function makeInteger( object ) {
  if ( typeof object !== "number" ) {
    if ( typeof object !== "bigint" ) {
      throw new Error( `Expected number or bigint, found ${ object }` )
    }
    return Math.round( Number( object ) )
  }
  return Math.round( object )
}

function makeTrimmedString( object, maxLength ) {
  return object.toString( ).substring( 0, maxLength )
}

function arrayBufferToBinaryString( buffer ) {
  let string = "", bytes = new Uint8Array( buffer )
  for ( let i = 0; i < bytes.length; i++ ) {
    string += String.fromCharCode( bytes[ i ] )
  }
  return string
}

function binaryStringToArrayBuffer( string ) {
  let buffer = new ArrayBuffer( string.length ), bytes = new Uint8Array( buffer )
  for ( let i = 0; i < string.length; i++ ) {
    bytes[ i ] = string.charCodeAt( i )
  }
  return buffer
}