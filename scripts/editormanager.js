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
    editorCamera.x = 0
    editorCamera.y = 0
    editorCamera.s = 1
    levelObjectTypes.forEach( lot => lot.currentLevelInstances = currentLevel.objects.filter( lo => lo instanceof lot ) )
  }
}

function closeEditor( ) {
  saveCustomLevels( )
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
    editorTools[ "pan" ]?.mouseDown?.(
      ( ( e.clientX - canvases.w / 2 ) /  UNITSIZE ) / editorCamera.s + editorCamera.x,
      ( ( e.clientY - canvases.h / 2 ) / -UNITSIZE ) / editorCamera.s + editorCamera.y
    )
  } else {
    editorTools[ editorTool ]?.mouseDown?.(
      ( ( e.clientX - canvases.w / 2 ) /  UNITSIZE ) / editorCamera.s + editorCamera.x,
      ( ( e.clientY - canvases.h / 2 ) / -UNITSIZE ) / editorCamera.s + editorCamera.y
    )
  }
}

function editorMouseMove( e ) {
  if ( editorMouseDownCurrent ) {
    if ( panning ) {
      editorTools[ "pan" ]?.mouseDrag?.(
        ( ( e.clientX - canvases.w / 2 ) /  UNITSIZE ) / editorCamera.s + editorCamera.x,
        ( ( e.clientY - canvases.h / 2 ) / -UNITSIZE ) / editorCamera.s + editorCamera.y
      )
    } else {
      editorTools[ editorTool ]?.mouseDrag?.(
        ( ( e.clientX - canvases.w / 2 ) /  UNITSIZE ) / editorCamera.s + editorCamera.x,
        ( ( e.clientY - canvases.h / 2 ) / -UNITSIZE ) / editorCamera.s + editorCamera.y
      )
    }
  }
}

function editorMouseUp( e ) {
  editorMouseDownCurrent = false
  panning = false
  editorTools[ editorTool ]?.mouseUp?.(
    ( ( e.clientX - canvases.w / 2 ) /  UNITSIZE ) / editorCamera.s + editorCamera.x,
    ( ( e.clientY - canvases.h / 2 ) / -UNITSIZE ) / editorCamera.s + editorCamera.y
  )
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
    }
  },
  zoom: { /* ... */ },
  adjust: { /* ... */ },
  segment: {
    mouseDown( x, y ) {
      let obj = new Segment( Math.round( x ), Math.round( y ), Math.round( x ), Math.round( y ) )
      currentLevel.objects.push( obj )
      Segment.currentLevelInstances.push( obj )
      editorTools.segment.obj = obj
    },
    mouseDrag( x, y ) {
      editorTools.segment.obj.x2 = Math.round( x )
      editorTools.segment.obj.y2 = Math.round( y )
    }
  },
  polygon: { /* ... */ },
  goaltape: {
    mouseDown( x, y ) {
      let obj = new GoalTape( Math.round( x ), Math.round( y ), Math.round( x ), Math.round( y ) )
      currentLevel.objects.push( obj )
      GoalTape.currentLevelInstances.push( obj )
      editorTools.goaltape.obj = obj
    },
    mouseDrag( x, y ) {
      editorTools.goaltape.obj.x2 = Math.round( x )
      editorTools.goaltape.obj.y2 = Math.round( y )
    }
  },
  eraser: { /* ... */ },
  move: { /* ... */ },
  rotate: { /* ... */ },
  reflect: { /* ... */ }
}