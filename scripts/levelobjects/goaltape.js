/*
 * levelobjects/goaltape.js
 * Handles Goal Tape Level Objects
 */

class GoalTape extends LevelObject {
  constructor( x1, y1, x2, y2 ) {
    super( )
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
  }
  
  onBuild( ) {
    let a = Math.atan2( this.y2 - this.y1, this.x2 - this.x1 )
    let tx = Math.cos( a + Math.PI / 2 ) / 4,
        ty = Math.sin( a + Math.PI / 2 ) / 4
    this.colliders = [ new SegmentTriggerCollider( this.x1, this.y1, this.x2, this.y2, ( ) => player.goalTimer = 1750 ) ]
  }
  
  getContainedChunks( ) {
    return [ ]
  }
  
  static renderAll( cnvs, ctx, objs ) {
    objs.forEach( obj => {
      let lx = obj.x2 - obj.x1,
          ly = obj.y2 - obj.y1,
           l = Math.sqrt( lx ** 2 + ly ** 2 ),
          cs = Math.floor( l ),
          cl = l / cs,
        sqrX = lx / l,
        sqrY = ly / l,
          cx = 0.5 * sqrX * cl,
          cy = 0.5 * sqrY * cl
      for ( let i = 0; i < cs * 2; i++ ) {
        for ( let j = 0; j < 2; j++ ) {
          let k = j ? -1 : 1
          ctx.fillStyle = ( i + j ) % 2 ? COLOR.goalTape.black : COLOR.goalTape.white
          ctx.beginPath( )
          ctx.moveTo( obj.x1 + cx * i,                  obj.y1 + cy * i                  )
          ctx.lineTo( obj.x1 + cx * ( i + 1 ),          obj.y1 + cy * ( i + 1 )          )
          ctx.lineTo( obj.x1 + cx * ( i + 1 ) + cy * k, obj.y1 + cy * ( i + 1 ) - cx * k )
          ctx.lineTo( obj.x1 + cx * i + cy * k,         obj.y1 + cy * i         - cx * k )
          ctx.closePath( )
          ctx.fill( )
        }
      }
    } )
  }
  
  static renderAllEditor( cnvs, ctx, objs ) {
    GoalTape.renderAll( cnvs, ctx, objs )
  }
  
  copy( ) {
    return new GoalTape( this.x1, this.y1, this.x2, this.y2 )
  }
}

dotbounce.globalSpecialDictionary.push( {
  stringIndex: "GoalTape",
  parserFunction: ( x1, y1, x2, y2 ) => new GoalTape( makeInteger( x1 ), makeInteger( y1 ), makeInteger( x2 ), makeInteger( y2 ) ),
  test: obj => obj instanceof GoalTape,
  getValues: obj => [ obj.x1, obj.y1, obj.x2, obj.y2 ]
} )

levelObjectTypes.push( GoalTape )