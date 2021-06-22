/*
 * renderer.js
 * This script handles drawing to the canvases for the game and editor
 */

function renderGame( ) {
  let ctx = canvases.gamectx, w = canvases.w, h = canvases.h
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect( 0, 0, w, h )
  ctx.translate( w / 2, h / 2 )
  ctx.fillStyle = COLOR.fgBlue
  ctx.beginPath( )
  ctx.arc( 0, 0, UNITSIZE, 0, 2 * Math.PI )
  ctx.fill( )
}