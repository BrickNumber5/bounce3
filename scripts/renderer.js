/*
 * renderer.js
 * This script handles drawing to the canvases for the game and editor
 */

const TRAILLENGTH = 45
let trail = Array.from( { length: TRAILLENGTH }, ( ) => ( { x: null, y: null } ) )

let spawnSpinnerTimer = 0

function renderGame( ) {
  // Setup
  let cnvs = canvases.game, ctx = canvases.gamectx, w = canvases.w, h = canvases.h
  ctx.setTransform( 1, 0, 0, 1, 0, 0 )
  ctx.clearRect( 0, 0, w, h )
  ctx.translate( w / 2, h / 2 )
  ctx.scale( UNITSIZE, -UNITSIZE )
  ctx.translate( -player.x, -player.y )
  let renderObject = renderLevelObjectType.bind( renderLevelObjectType, cnvs, ctx )
  
  // Starfield
  drawStarfield( cnvs, ctx )
  
  trail.shift( )
  trail.push( { x: player.x, y: player.y } )
  drawTrail( cnvs, ctx )
  
  // Player
  ctx.fillStyle = COLOR.player
  ctx.beginPath( )
  ctx.arc( player.x, player.y, 1, 0, 2 * Math.PI )
  ctx.fill( )
  
  renderObject( GoalTape )
  
  renderObject( Segment )
  
  // Debug
  if ( SHOWDEBUGINFO ) {
    [ ...currentLevel.objects ].forEach( obj => obj.colliders ? obj.colliders.forEach( col => col.render( cnvs, ctx ) ) : null )
  }
  
  // Dash Indicator
  renderDashIndicator( cnvs, ctx )
}

function renderLevelInEditor( ) {
   // Setup
  let cnvs = canvases.editor, ctx = canvases.editorctx, w = canvases.w, h = canvases.h
  ctx.setTransform( 1, 0, 0, 1, 0, 0 )
  ctx.clearRect( 0, 0, w, h )
  ctx.translate( w / 2, h / 2 )
  ctx.scale( UNITSIZE, -UNITSIZE )
  ctx.translate( -editorCamera.x * editorCamera.s, -editorCamera.y * editorCamera.s )
  ctx.scale( editorCamera.s, editorCamera.s )
  let renderObject = renderLevelObjectTypeEditor.bind( renderLevelObjectTypeEditor, cnvs, ctx )
  
  // Grid
  let scaledW = ( w / UNITSIZE ) / editorCamera.s,
      scaledH = ( h / UNITSIZE ) / editorCamera.s
  ctx.strokeStyle = COLOR.editor.grid
  let cellDist = UNITSIZE * editorCamera.s
  let inc = cellDist >= 8 ? 1 : cellDist >= 0.8 ? 10 : cellDist >= 0.08 ? 100 : 1000
  for (
    let i = Math.floor( ( editorCamera.x - scaledW / 2 ) / inc ) * inc;
    i < Math.ceil( ( editorCamera.x + scaledW / 2 ) / inc ) * inc;
    i += inc
  ) {
    ctx.lineWidth = i % 10 ? 1 / 12 : i % 100 ? 2 / 12 : i % 1000 ? 4 / 12 : 5 / 12
    ctx.beginPath( )
    ctx.moveTo( i, editorCamera.y - scaledH / 2 )
    ctx.lineTo( i, editorCamera.y + scaledH / 2 )
    ctx.stroke( )
  }
  for (
    let i = Math.floor( ( editorCamera.y - scaledH / 2 ) / inc ) * inc;
    i < Math.ceil( ( editorCamera.y + scaledH / 2 ) / inc ) * inc;
    i += inc
  ) {
    ctx.lineWidth = i % 10 ? 1 / 12 : i % 100 ? 2 / 12 : i % 1000 ? 4 / 12 : 5 / 12
    ctx.beginPath( )
    ctx.moveTo( editorCamera.x - scaledW / 2, i )
    ctx.lineTo( editorCamera.x + scaledW / 2, i )
    ctx.stroke( )
  }
  // Spawnpoint
  let rotation = -2 * Math.PI * spawnSpinnerTimer / 10000
  ctx.strokeStyle = COLOR.editor.spawnPoint
  ctx.lineWidth = 1 / 4
  ctx.lineCap = "round"
  ctx.beginPath( )
  ctx.arc( currentLevel.spawnPoint.x, currentLevel.spawnPoint.y, 7 / 8, rotation +  0,               rotation +      Math.PI / 6 )
  ctx.stroke( )
  ctx.beginPath( )
  ctx.arc( currentLevel.spawnPoint.x, currentLevel.spawnPoint.y, 7 / 8, rotation +  2 * Math.PI / 6, rotation +  3 * Math.PI / 6 )
  ctx.stroke( )
  ctx.beginPath( )
  ctx.arc( currentLevel.spawnPoint.x, currentLevel.spawnPoint.y, 7 / 8, rotation +  4 * Math.PI / 6, rotation +  5 * Math.PI / 6 )
  ctx.stroke( )
  ctx.beginPath( )
  ctx.arc( currentLevel.spawnPoint.x, currentLevel.spawnPoint.y, 7 / 8, rotation +  6 * Math.PI / 6, rotation +  7 * Math.PI / 6 )
  ctx.stroke( )
  ctx.beginPath( )
  ctx.arc( currentLevel.spawnPoint.x, currentLevel.spawnPoint.y, 7 / 8, rotation +  8 * Math.PI / 6, rotation +  9 * Math.PI / 6 )
  ctx.stroke( )
  ctx.beginPath( )
  ctx.arc( currentLevel.spawnPoint.x, currentLevel.spawnPoint.y, 7 / 8, rotation + 10 * Math.PI / 6, rotation + 11 * Math.PI / 6 )
  ctx.stroke( )
  
  renderObject( GoalTape )
  
  renderObject( Segment )
  
  // Draw Anchors
  ctx.strokeStyle = COLOR.editor.coordinateAnchor.stroke
  ctx.fillStyle = COLOR.editor.coordinateAnchor.fill
  ctx.lineWidth = 3 / 16
  ctx.lineCap = "round"
  if ( editorTool === "adjust" ) {
    if ( editorTools.adjust.dragging ) {
      let pos = editorTools.adjust.currentAnchor.pos
      ctx.beginPath( )
      ctx.arc( pos.x, pos.y, 3 / 8, 0, 2 * Math.PI )
      ctx.fill( )
      ctx.stroke( )
    } else {
      [ ...currentLevel.objects, spawnPointPseudoLevelObject ].forEach( obj => obj.getAnchors( ).forEach( a => {
        let pos = a.pos
        let s =  ( pos.x - editorTools.adjust.hoverX ) ** 2 + ( pos.y - editorTools.adjust.hoverY ) ** 2 <= 1 / 4 ? 3 / 8 : 1 / 4
        ctx.beginPath( )
        ctx.arc( pos.x, pos.y, s, 0, 2 * Math.PI )
        ctx.fill( )
        ctx.stroke( )
      } ) )
    }
  }
}

function renderLevelObjectType( cnvs, ctx, objType ) {
  objType.renderAll( cnvs, ctx, [ ...objType.currentLevelInstances ] )
}

function renderLevelObjectTypeEditor( cnvs, ctx, objType ) {
  objType.renderAllEditor( cnvs, ctx, [ ...objType.currentLevelInstances ] )
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