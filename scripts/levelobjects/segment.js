/*
 * levelobjects/segment.js
 * Handles Line Segment Level Objects
 */

class Segment extends LevelObject {
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
    this.colliders = [
      new SegmentCollider( this.x1 + tx, this.y1 + ty, this.x2 + tx, this.y2 + ty ),
      new ArcCollider( this.x2, this.y2, 1 / 4, a + Math.PI / 2, a + 3 * Math.PI / 2 ),
      new SegmentCollider( this.x2 - tx, this.y2 - ty, this.x1 - tx, this.y1 - ty ),
      new ArcCollider( this.x1, this.y1, 1 / 4, a + 3 * Math.PI / 2, a + Math.PI / 2 )
    ]
  }
  
  getContainedChunks( ) {
    return [ ]
  }
  
  static renderAll( cnvs, ctx, objs ) {
    ctx.lineWidth = 1 / 2
    ctx.strokeStyle = COLOR.ground
    ctx.lineCap = "round"
    objs.forEach( obj => {
      ctx.beginPath( )
      ctx.moveTo( obj.x1, obj.y1 )
      ctx.lineTo( obj.x2, obj.y2 )
      ctx.stroke( )
    } )
  }
  
  static renderAllEditor( cnvs, ctx, objs ) {
    Segment.renderAll( cnvs, ctx, objs )
  }
}

levelObjectTypes.push( Segment )