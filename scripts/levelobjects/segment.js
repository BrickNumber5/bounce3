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
  
  getContainedChunks( ) {
    return [ ]
  }
  
  static renderAll( cnvs, ctx, objs ) {
    ctx.lineWidth = 1 / 2
    ctx.strokeStyle = COLOR.fgClr
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