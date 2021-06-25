/*
 * renderer.js
 * This script handles drawing to the canvases for the game and editor
 */

const TRAILLENGTH = 45
let trail = Array.from( { length: TRAILLENGTH }, ( ) => ( { x: null, y: null } ) )

function renderGame( ) {
  // Setup
  let cnvs = canvases.game, ctx = canvases.gamectx, w = canvases.w, h = canvases.h
  ctx.setTransform( 1, 0, 0, 1, 0, 0 )
  ctx.clearRect( 0, 0, w, h )
  ctx.translate( w / 2, h / 2 )
  ctx.scale( UNITSIZE, -UNITSIZE )
  ctx.translate( -player.x, -player.y )
  let renderObject = renderLevelObjectType.bind( renderLevelObjectType, cnvs, ctx )
  
  renderObject( Segment )
  
  trail.shift( )
  trail.push( { x: player.x, y: player.y } )
  drawTrail( cnvs, ctx )
  
  // Draw Player
  ctx.fillStyle = COLOR.player
  ctx.beginPath( )
  ctx.arc( player.x, player.y, 1, 0, 2 * Math.PI )
  ctx.fill( )
  
  // Draw Debug
  if ( SHOWDEBUGINFO ) {
    currentLevel.objects.forEach( obj => obj.colliders ? obj.colliders.forEach( col => col.render( cnvs, ctx ) ) : null )
  }
  
  // Dash Indicator
  renderDashIndicator( cnvs, ctx )
}

function renderLevelObjectType( cnvs, ctx, objType ) {
  objType.renderAll( cnvs, ctx, objType.currentLevelInstances )
}

function renderDashIndicator( cnvs, ctx ) {
  if ( !dashInterfaceData.active ) return
  let ax = dashInterfaceData.ax,
      ay = dashInterfaceData.ay
  ctx.strokeStyle = player.dash ? COLOR.dashIndicator.outline : COLOR.dashIndicator.outlineDead
  ctx.fillStyle = COLOR.dashIndicator.fill
  
  let x1 = dashInterfaceData.x1 / UNITSIZE + player.x - ( canvases.w / 2 ) / UNITSIZE,
      y1 = dashInterfaceData.y1 / UNITSIZE + player.y + ( canvases.h / 2 ) / UNITSIZE,
      x2 = dashInterfaceData.x2 / UNITSIZE + player.x - ( canvases.w / 2 ) / UNITSIZE,
      y2 = dashInterfaceData.y2 / UNITSIZE + player.y + ( canvases.h / 2 ) / UNITSIZE
  let len = Math.sqrt( ( x2 - x1 ) ** 2 + ( y2 - y1 ) ** 2 )
  drawDiamond( ctx, x1, y1, ax, ay )
  if ( player.dash ) ctx.fill( )
  ctx.stroke( )
  for ( let i = 1; i <= Math.floor( len / 1.5 ); i++ ) {
    drawDiamond( ctx, x1 + 1.5 * i * ax, y1 + 1.5 * i * ay, ax / 3, ay / 3 )
    ctx.stroke( )
  }
  
  drawDiamond( ctx, player.x + 2 * ax, player.y + 2 * ay, ax, ay )
  if ( player.dash ) ctx.fill( )
  ctx.stroke( )
  drawDiamond( ctx, player.x + 3.5 * ax, player.y + 3.5 * ay, 3 * ax / 5, 3 * ay / 5 )
  if ( player.dash ) ctx.fill( )
  ctx.stroke( )
  drawDiamond( ctx, player.x + 4.75 * ax, player.y + 4.75 * ay, ax / 3, ay / 3 )
  if ( player.dash ) ctx.fill( )
  ctx.stroke( )
  ctx.beginPath( )
  ctx.moveTo( player.x - 1.5 * ax,      player.y - 1.5 * ay      )
  ctx.lineTo( player.x - 2.5 * ax + ay, player.y - 2.5 * ay - ax )
  ctx.lineTo( player.x - 4.5 * ax,      player.y - 4.5 * ay      )
  ctx.lineTo( player.x - 2.5 * ax - ay, player.y - 2.5 * ay + ax )
  ctx.closePath( )
  if ( player.dash ) ctx.fill( )
  ctx.stroke( )
}

function drawDiamond( ctx, x, y, ax, ay ) {
  ax /= 2
  ay /= 2
  ctx.lineWidth = 1 / 4
  ctx.lineJoin = "round"
  ctx.beginPath( )
  ctx.moveTo( x + ax, y + ay )
  ctx.lineTo( x + ay, y - ax )
  ctx.lineTo( x - ax, y - ay )
  ctx.lineTo( x - ay, y + ax )
  ctx.closePath( )
}

function drawTrail( mcnvs, mctx ) {
  let cnvs = canvases.temp, ctx = canvases.tempctx, w = canvases.w, h = canvases.h
  ctx.setTransform( 1, 0, 0, 1, 0, 0 )
  ctx.clearRect( 0, 0, w, h )
  ctx.translate( w / 2, h / 2 )
  ctx.scale( UNITSIZE, -UNITSIZE )
  ctx.translate( -player.x, -player.y )
  ctx.lineCap = "round"
  for ( let i = 1; i < trail.length; i++ ) {
    if ( trail[ i ].x != null && trail[ i - 1 ].x != null ) {
      ctx.globalCompositeOperation = "destination-out"
      ctx.lineWidth = 1.95 * ( i / ( trail.length - 1 ) )
      ctx.globalAlpha = 1
      ctx.beginPath( )
      ctx.moveTo( trail[ i ].x, trail[ i ].y )
      ctx.lineTo( trail[ i - 1 ].x, trail[ i - 1 ].y )
      ctx.stroke( )
      ctx.globalCompositeOperation = "source-over"
      ctx.lineWidth = 2 * ( i / ( trail.length - 1 ) )
      ctx.globalAlpha = -1 / ( ( i / ( trail.length - 1 ) ) - 2 )
      ctx.strokeStyle = lerpColor( COLOR.trail[ 0 ], COLOR.trail[ 1 ], i / ( trail.length - 1 ) )
      ctx.beginPath( )
      ctx.moveTo( trail[ i ].x, trail[ i ].y )
      ctx.lineTo( trail[ i - 1 ].x, trail[ i - 1 ].y )
      ctx.stroke( )
    }
  }
  let t = mctx.getTransform( )
  mctx.setTransform( 1, 0, 0, 1, 0, 0 )
  mctx.drawImage( cnvs, 0, 0 )
  mctx.setTransform( t )
}