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
  } else {
    editorTools[ editorTool ]?.mouseHover?.(
      ( ( e.clientX - canvases.w / 2 ) /  UNITSIZE ) / editorCamera.s + editorCamera.x,
      ( ( e.clientY - canvases.h / 2 ) / -UNITSIZE ) / editorCamera.s + editorCamera.y
    )
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

function editorMouseCancel( e ) {
  editorTools[ editorTool ]?.mouseCancel?.(
    ( ( e.clientX - canvases.w / 2 ) /  UNITSIZE ) / editorCamera.s + editorCamera.x,
    ( ( e.clientY - canvases.h / 2 ) / -UNITSIZE ) / editorCamera.s + editorCamera.y
  )
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
  adjust: {
    hoverX: -Infinity,
    hoverY: -Infinity,
    dragging: false,
    currentAnchor: null,
    mouseHover( x, y ) {
      editorTools.adjust.hoverX = x
      editorTools.adjust.hoverY = y
    },
    mouseDown( x, y ) {
      for ( let i = 0; i < currentLevel.objects.length; i++ ) {
        let as = currentLevel.objects[ i ].getAnchors( )
        for ( let j = 0; j < as.length; j++ ) {
          let pos = as[ j ].pos
          if ( ( pos.x - x ) ** 2 + ( pos.y - y ) ** 2 <= 1 / 4 ) {
            editorTools.adjust.dragging = true
            editorTools.adjust.currentAnchor = as[ j ]
            return
          }
        }
      }
    },
    mouseDrag( x, y ) {
      editorTools.adjust.currentAnchor.pos = { x: Math.round( x ), y: Math.round( y ) }
    },
    mouseUp( ) {
      editorTools.adjust.dragging = false
      editorTools.adjust.currentAnchor = null
    },
    mouseCancel( ) {
      editorTools.adjust.dragging = false
      editorTools.adjust.currentAnchor = null
    }
  },
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

class CoordinateAnchor {
  constructor( get, set ) {
    this._get = get
    this._set = set
  }
  
  static unlinkedAnchor( x, y ) {
    // This function creates a Coordinate Anchor that isn't linked to any external value
    let _x = x
    let _y = y
    return new CoordinateAnchor( ( ) => ( { x: _x, y: _y } ), ( x, y ) => { _x = x;_y = y } )
  }
  
  get x( ) {
    return this._get( ).x
  }
  
  get y( ) {
    return this._get( ).y
  }
  
  get pos( ) {
    let { x, y } = this._get( )
    return { x, y }
  }
  
  get arr( ) {
    let { x, y } = this._get( )
    return [ x, y ]
  }
  
  set x( v ) {
    this._set( v, this._get( ).y )
  }
  
  set y( v ) {
    this._set( this._get( ).x, v )
  }
  
  set pos( v ) {
    this._set( v.x, v.y )
  }
  
  set arr( v ) {
    this._set( v[ 0 ], v[ 1 ] )
  }
  
  static copy( cAnchor ) {
    return new CoordinateAnchor( cAnchor._get, cAnchor._set )
  }
  
  static move( cAnchors, u, v ) {
    for ( let i = 0; i < cAnchors.length; i++ ) {
      let p = cAnchors[ i ].pos
      cAnchors[ i ].pos = { x: p.x + u, y: p.y + v }
    }
  }
  
  static getCenter( cAnchors ) {
    // The center of a set of anchors is itself an anchor, so if the anchors being derived from change, it changes too
    function getCenter( ) {
      let bounds = { lx: Infinity, ly: Infinity, hx: -Infinity, hy: -Infinity }
      for ( let i = 0; i < cAnchors.length; i++ ) {
        let pos = cAnchors[ i ].pos
        if ( pos.x < bounds.lx ) bounds.lx = pos.x
        if ( pos.y < bounds.ly ) bounds.ly = pos.y
        if ( pos.x > bounds.hx ) bounds.hx = pos.x
        if ( pos.y > bounds.hy ) bounds.hy = pos.y
      }
      return { x: bounds.lx + ( bounds.hx - bounds.lx ) / 2, y: bounds.ly + ( bounds.hy - bounds.ly ) / 2 }
    }
    
    return new CoordinateAnchor( getCenter, ( x, y ) => {
      // Moving the center anchor is done by translating all the underlying anchors
      let oldCenter = getCenter( )
      let translation = { x: x - oldCenter.x, y: y - oldCenter.y }
      for ( let i = 0; i < cAnchors.length; i++ ) {
        let pos = cAnchors[ i ].pos
        cAnchors[ i ].pos = { x: pos.x + translation.x, y: pos.y + translation.y }
      }
    } )
  }
}