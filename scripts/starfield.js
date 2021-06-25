/*
 * starfield.js
 * This function is responsible for drawing the star-field
 */

const STARGRIDSIZE = 120

function drawStarfield( cnvs, ctx ) {
  drawStarfieldLayer( cnvs, ctx, 3 )
  drawStarfieldLayer( cnvs, ctx, 2 )
  drawStarfieldLayer( cnvs, ctx, 1 )
  drawStarfieldLayer( cnvs, ctx, 0 )
}

function drawStarfieldLayer( mcnvs, mctx, lyr ) {
  let m = 1 / ( UNITSIZE / ( 10 * ( lyr + 1 ) ) )
  let cnvs = canvases.temp, ctx = canvases.tempctx, w = canvases.w, h = canvases.h, mw = w * m, mh = h * m
  ctx.setTransform( 1, 0, 0, 1, 0, 0 )
  ctx.clearRect( 0, 0, w, h )
  ctx.translate( w / 2, h / 2 )
  ctx.scale( 1 / m, -1 / m )
  ctx.translate( -player.x, -player.y )
  ctx.lineCap = "round"
  let sx = Math.floor( ( player.x - mw / 2 ) / STARGRIDSIZE ),
      sy = Math.floor( ( player.y - mh / 2 ) / STARGRIDSIZE ),
      ex = Math.ceil(  ( player.x + mw / 2 ) / STARGRIDSIZE ) + 1,
      ey = Math.ceil(  ( player.y + mh / 2 ) / STARGRIDSIZE ) + 1
  for ( let i = sx; i < ex; i++ ) {
    for ( let j = sy; j < ey; j++ ) {
      TINYSTARFIELDRANDOMSEED = BigInt( ( i << 18 ) + ( j << 2 ) + lyr )
      if( tinyStarfieldRandom( ) > 60 - 10 * lyr ) continue
      let ox = STARGRIDSIZE * tinyStarfieldRandom( ) / 100,
          oy = STARGRIDSIZE * tinyStarfieldRandom( ) / 100
      ctx.lineWidth = 2 + 8 * tinyStarfieldRandom( ) / 100
      ctx.strokeStyle = ctx.fillStyle = lerpColor( COLOR.star[ 0 ], COLOR.star[ 1 ], tinyStarfieldRandom( ) / 100 )
      if ( lyr == 3 ) {
        ctx.fillRect( i * STARGRIDSIZE + ox, j * STARGRIDSIZE + oy, 1 * m, 1 * m )
      } else {
        ctx.beginPath( )
        ctx.moveTo( i * STARGRIDSIZE + ox, j * STARGRIDSIZE + oy )
        ctx.lineTo( i * STARGRIDSIZE + ox, j * STARGRIDSIZE + oy )
        ctx.stroke( )
      }
    }
  }
  
  let t = mctx.getTransform( )
  mctx.setTransform( 1, 0, 0, 1, 0, 0 )
  mctx.drawImage( cnvs, 0, 0 )
  mctx.setTransform( t )
}

let TINYSTARFIELDRANDOMSEED = 10n

function tinyStarfieldRandom( ) {
  TINYSTARFIELDRANDOMSEED += 0xe120fc15n
  let tmp = TINYSTARFIELDRANDOMSEED * 0x4a39b70dn
  let m1 = ( tmp >> 32n ) ^ tmp 
  tmp = m1 * 0x12fad5c9n
  let m2 = ( tmp >> 32n ) ^ tmp
  return Number( ( m2 >> 8n ) % 100n )
}