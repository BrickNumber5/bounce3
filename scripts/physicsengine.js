/*
 * physicsengine.js
 * This script is responsible for handling physics.
 */

const GRAVITY = -0.00005
const FRICTION = 0.9999 // This is the amount of velocity maintained per ms
const DASHSTRENGTH = 0.01

function physicsStep( elapsedTime ) {
  if ( player.goalTimer < Infinity ) {
    player.x += 1.4 * player.vx * elapsedTime
    player.y += 1.4 * player.vy * elapsedTime
  } else {
    player.va = Math.atan2( player.vy, player.vx )
    
    // Speed Caps
    if ( player.vx ** 2 + player.vy ** 2 <= 0.00025 ** 2 ) {
      player.vx = 0
      player.vy = 0
    }
    if ( player.vx ** 2 + player.vy ** 2 > 0.05 ** 2 ) {
      player.vx = 0.05 * Math.cos( player.va )
      player.vy = 0.05 * Math.sin( player.va )
    }
    
    movePlayer( player.x, player.y, player.x + player.vx * elapsedTime, player.y + player.vy * elapsedTime )
    
    // Gravity
    player.vy += GRAVITY * elapsedTime
    
    // Friction
    player.vx *= FRICTION ** elapsedTime
    player.vy *= FRICTION ** elapsedTime
  }
}

function movePlayer( sx, sy, ex, ey ) {
  let checkCollisions = true, nearestCol = null, nearestColDistSq = Infinity
  while ( checkCollisions ) {
    checkCollisions = false
    nearestCol = null
    nearestColDistSq = Infinity
    let objsArr = [ ...currentLevel.objects ]
    for ( let i = 0; i < objsArr.length; i++ ) {
      let obj = objsArr[ i ]
      if ( obj.colliders ) {
        for ( let j = 0; j < obj.colliders.length; j++ ) {
          let col = obj.colliders[ j ]
          let res = col.collisionOnPath( sx, sy, ex, ey )
          if ( res.collided ) {
            checkCollisions = true
            let d = ( res.nsx - sx ) ** 2 + ( res.nsy - sy ) ** 2
            if ( d < nearestColDistSq ) {
              nearestCol = res
              nearestColDistSq = d
            }
          }
        }
      }
    }
    if ( nearestCol ) {
      sx = nearestCol.nsx
      sy = nearestCol.nsy
      ex = nearestCol.nex
      ey = nearestCol.ney
      player.vx = nearestCol.nvx
      player.vy = nearestCol.nvy
      player.va = Math.atan2( player.vy, player.vx )
      player.dash = true
      if ( nearestCol.dfn ) nearestCol.dfn( )
    }
  }
  player.x = ex
  player.y = ey
}

class Collider {
  constructor( ) {
  
  }
  
  collisionOnPath( sx, sy, ex, ey ) {
    return { collided: false }
  }
  
  render( cnvs, ctx ) {
    // Colliders are only rendered if SHOWDEBUGINFO is set to true
  }
}

class SegmentCollider extends Collider {
  constructor( x1, y1, x2, y2 ) {
    super( )
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.a  = Math.atan2( this.y2 - this.y1, this.x2 - this.x1 )
    this.ax = Math.cos( this.a )
    this.ay = Math.sin( this.a )
  }
  
  collisionOnPath( sx, sy, ex, ey ) {
    if ( Math.abs( angleDifference( this.a - Math.PI / 2, player.va ) ) > Math.PI / 2 ) return { collided: false } // Makes the collider one-sided
    let tx = this.ay,
        ty = -this.ax
    sx += tx
    sy += ty
    ex += tx
    ey += ty
    let res = segmentSegmentIntersection( this.x1, this.y1, this.x2, this.y2, sx, sy, ex, ey )
    if ( !res.b ) return { collided: false }
    sx = res.x - tx
    sy = res.y - ty
    let rE = reflectPointOverLine( ex, ey, this.x1, this.y1, this.x2, this.y2 )
    ex = rE.x - tx
    ey = rE.y - ty
    let rV = reflectPointOverLine( player.vx, player.vy, 0, 0, this.x2 - this.x1, this.y2 - this.y1 )
    return {
      collided: true,
      nsx: sx,
      nsy: sy,
      nex: ex,
      ney: ey,
      nvx: rV.x,
      nvy: rV.y
    }
  }
  
  render( cnvs, ctx ) {
    ctx.lineWidth = 1 / 10
    ctx.strokeStyle = COLOR.debugObject
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath( )
    ctx.moveTo( this.x1, this.y1 )
    ctx.lineTo( this.x2, this.y2 )
    ctx.stroke( )
    ctx.beginPath( )
    let cx = ( this.x2 - this.x1 ) / 2 + this.x1,
        cy = ( this.y2 - this.y1 ) / 2 + this.y1
    ctx.moveTo( cx, cy )
    ctx.lineTo( cx + -this.ay, cy + this.ax )
    ctx.stroke( )
  }
}

class ArcCollider extends Collider {
  constructor( cx, cy, r, sa, ea ) {
    super( )
    this.cx = cx
    this.cy = cy
    this.r  = r
    this.sa = sa
    this.ea = ea
  }
  
  collisionOnPath( sx, sy, ex, ey ) {
    if ( ( this.cx - sx ) ** 2 + ( this.cy - sy ) ** 2 <= ( 1 + this.r ) ** 2 ) return { collided: false }
    let res = segmentCircleIntersection( sx, sy, ex, ey, this.cx, this.cy, this.r + 1 )
    if( !res.b ) return { collided: false }
    // This looks like it should be !angleBetweenAngles, but angleBetweenAngles actually uses what is for this function the wrong arc
    // So it's actually the inverse
    if ( angleBetweenAngles( Math.atan2( res.y - this.cy, res.x - this.cx ), this.sa, this.ea ) ) return { collided: false }
    sx = res.x
    sy = res.y
    let dx = ( this.cx - sx ),
        dy = ( this.cy - sy ),
        oneOverLength = 1 / Math.sqrt( dx ** 2 + dy ** 2 )
    let tx = dx * oneOverLength,
        ty = dy * oneOverLength
    let rE = reflectPointOverLine( ex + tx, ey + ty, res.x + tx, res.y + ty, res.x + tx + ty, res.y + ty - tx )
    ex = rE.x - tx
    ey = rE.y - ty
    let rV = reflectPointOverLine( player.vx, player.vy, 0, 0, ty, -tx )
    return {
      collided: true,
      nsx: sx,
      nsy: sy,
      nex: ex,
      ney: ey,
      nvx: rV.x,
      nvy: rV.y
    }
  }
  
  render( cnvs, ctx ) {
    ctx.lineWidth = 1 / 10
    ctx.strokeStyle = COLOR.debugObject
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath( )
    ctx.arc( this.cx, this.cy, this.r, this.sa, this.ea, true )
    ctx.stroke( )
  }
}

class TriggerCollider extends Collider {
  constructor( ) {
    super( )
  }
}

class SegmentTriggerCollider extends TriggerCollider {
  constructor( x1, y1, x2, y2, fn ) {
    super( )
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.fn = fn
  }
  
  collisionOnPath( sx, sy, ex, ey ) {
    let res = segmentSegmentIntersection( sx, sy, ex, ey, this.x1, this.y1, this.x2, this.y2 )
    if ( !res.b ) return { collided: false }
    return {
      collided: true,
      nsx: res.x,
      nsy: res.y,
      nex: ex,
      ney: ey,
      nvx: player.vx,
      nvy: player.vy,
      dfn: this.fn
    }
  }
  
  render( cnvs, ctx ) {
    ctx.lineWidth = 1 / 10
    ctx.strokeStyle = COLOR.debugObject
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath( )
    ctx.moveTo( this.x1, this.y1 )
    ctx.lineTo( this.x2, this.y2 )
    ctx.stroke( )
    ctx.beginPath( )
    ctx.arc( this.x1 + ( this.x2 - this.x1 ) / 2, this.y1 + ( this.y2 - this.y1 ) / 2, 0.5, 0, 2 * Math.PI )
    ctx.stroke( )
  }
}