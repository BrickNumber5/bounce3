/*
 * editormanager.js
 * Handles editor logic
 */

let editorTool = "adjust"

let editorCamera = {
  x: 0,
  y: 0,
  s: 1
}

function editorTick( ) {
  spawnSpinnerTimer += elapsedTime
  spawnSpinnerTimer %= 10000
  renderLevelInEditor( )
}

function editLevel( levellike ) {
  if ( levellike instanceof Level ) {
    currentLevel = levellike
    generalState.mode = "editor"
    editorSetTool( "adjust" )
    levelObjectTypes.forEach( lot => lot.currentLevelInstances = currentLevel.objects.filter( lo => lo instanceof lot ) )
  }
}

function closeEditor( ) {
  generalState.exitMode( )
}

function editorSelectTool( toolButton ) {
  editorSetTool( toolButton.dataset.tool )
  toolButton.blur( )
}

function editorSetTool( tool ) {
  document.querySelector( `.editorToolButton[data-tool=${ editorTool }]` ).disabled = false
  document.querySelector( `.editorToolButton[data-tool=${ tool }]` ).disabled = true
  editorTool = tool
}

function setupEditor ( ) {
  let cnvs = canvases.editor
  cnvs.addEventListener( "mousedown", editorMouseDown )
  cnvs.addEventListener( "mousemove", editorMouseMove )
  cnvs.addEventListener( "mouseup", editorMouseUp )
  cnvs.addEventListener( "mouseleave", editorMouseCancel )
  cnvs.addEventListener( "wheel", editorScrollZoom )
}

let editorMouseDownCurrent = false, panning = false

function editorMouseDown( e ) {
  editorMouseDownCurrent = true
  if ( e.buttons & 4 ) {
    panning = true
    editorTools[ "pan" ]?.mouseDown?.( ( e.clientX / UNITSIZE ) / editorCamera.s, ( e.clientY / -UNITSIZE ) / editorCamera.s )
  } else {
    editorTools[ editorTool ]?.mouseDown?.( ( e.clientX / UNITSIZE ) / editorCamera.s, ( e.clientY / -UNITSIZE ) / editorCamera.s )
  }
}

function editorMouseMove( e ) {
  if ( editorMouseDownCurrent ) {
    if ( panning ) {
      editorTools[ "pan" ]?.mouseDrag?.( ( e.clientX / UNITSIZE ) / editorCamera.s, ( e.clientY / -UNITSIZE ) / editorCamera.s )
    } else {
      editorTools[ editorTool ]?.mouseDrag?.( ( e.clientX / UNITSIZE ) / editorCamera.s, ( e.clientY / -UNITSIZE ) / editorCamera.s )
    }
  }
}

function editorMouseUp( e ) {
  editorMouseDownCurrent = false
  panning = false
  editorTools[ editorTool ]?.mouseUp?.( ( e.clientX / UNITSIZE ) / editorCamera.s, ( e.clientY / -UNITSIZE ) / editorCamera.s )
}

function editorMouseCancel( ) {
  editorMouseDownCurrent = false
  panning = false
}

function editorScrollZoom( e ) {
  editorCamera.s *= 1.1 ** ( -e.deltaY / 100 )
}

const editorTools = {
  pan: {
    mouseDown( x, y ) {
      editorTools.pan.px = x
      editorTools.pan.py = y
    },
    mouseDrag( x, y ) {
      editorCamera.x -= x - editorTools.pan.px
      editorCamera.y -= y - editorTools.pan.py
      editorTools.pan.px = x
      editorTools.pan.py = y
    }
  },
  zoom: { /* ... */ },
  adjust: { /* ... */ },
  segment: { /* ... */ },
  polygon: { /* ... */ },
  goaltape: { /* ... */ },
  eraser: { /* ... */ },
  move: { /* ... */ },
  rotate: { /* ... */ },
  reflect: { /* ... */ }
}