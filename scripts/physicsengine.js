/*
 * physicsengine.js
 * This script is responsible for handling physics.
 */

const GRAVITY = -0.00005

function physicsStep( elapsedTime ) {
  player.va = Math.atan2( player.vy, player.vx )
  movePlayer( player.x, player.y, player.x + player.vx * elapsedTime, player.y + player.vy * elapsedTime )
  
  // Gravity
  player.vy += GRAVITY * elapsedTime
}

function movePlayer( sx, sy, ex, ey ) {
  let checkCollisions = true
  colCheckLoop: while ( checkCollisions ) {
    checkCollisions = false // Every time a colision is found, this variable is set to true again and the loop is immediatly
                            // `continue`d, this means that the loop won't exit until it makes a full pass without finding
                            // any collisions and when it finds one it won't bother to keep checking collisions that ir will
                            // have to check again anyways
    for ( let i = 0; i < currentLevel.objects.length; i++ ) {
      let obj = currentLevel.objects[ i ]
      if ( obj.colliders ) {
        for ( let j = 0; j < obj.colliders.length; j++ ) {
          let col = obj.colliders[ j ]
          let res = col.collisionOnPath( sx, sy, ex, ey )
          if ( res.collided ) {
            sx = res.nsx
            sy = res.nsy
            ex = res.nex
            ey = res.ney
            checkCollisions = true
            continue colCheckLoop
          }
        }
      }
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
    if ( Math.cos( this.a - player.va + Math.PI / 2 ) > 1 ) return { collided: false }
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
    player.vx = rV.x
    player.vy = rV.y
    return {
      collided: true,
      nsx: sx,
      nsy: sy,
      nex: ex,
      ney: ey
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