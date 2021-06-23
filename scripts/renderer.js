/*
 * renderer.js
 * This script handles drawing to the canvases for the game and editor
 */

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
  
  // Draw Player
  ctx.fillStyle = COLOR.player
  ctx.beginPath( )
  ctx.arc( player.x, player.y, 1, 0, 2 * Math.PI )
  ctx.fill( )
  
  // Draw Debug
  if ( SHOWDEBUGINFO ) {
    currentLevel.objects.forEach( obj => obj.colliders ? obj.colliders.forEach( col => col.render( cnvs, ctx ) ) : null )
  }
}

function renderLevelObjectType( cnvs, ctx, objType ) {
  objType.renderAll( cnvs, ctx, objType.currentLevelInstances )
}