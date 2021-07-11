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
    levelObjectTypes.forEach( lot => lot.currentLevelInstances = new Set( [ ...currentLevel.objects ].filter( lo => lo instanceof lot ) ) )
  }
}

function closeEditor( ) {
  saveCustomLevels( )
  generalState.exitMode( )
}

let EDITINGMETADATA = false

function editorSelectTool( toolButton ) {
  editorSetTool( toolButton.dataset.tool )
  toolButton.blur( )
}

function editorSetTool( tool ) {
  document.querySelector( `.editorToolButton[data-tool=${ editorTool }]` ).disabled = false
  document.querySelector( `.editorToolButton[data-tool=${ tool }]` ).disabled = true
  editorTools[ editorTool ]?.deselectTool?.( )
  editorTools[ editorTool ]?.mouseCancel?.( )
  editorTool = tool
  editorTools[ editorTool ]?.selectTool?.( )
}

function setupEditor ( ) {
  let cnvs = canvases.editor
  cnvs.addEventListener( "mousedown", editorMouseDown )
  cnvs.addEventListener( "mousemove", editorMouseMove )
  cnvs.addEventListener( "mouseup", editorMouseUp )
  cnvs.addEventListener( "mouseleave", editorMouseCancel )
  const touchMouseAdaptor = fn => e => { fn( e.targetTouches.item( 0 ) ); e.preventDefault( ) }
  cnvs.addEventListener( "touchstart", touchMouseAdaptor( editorMouseDown ) )
  cnvs.addEventListener( "touchmove", touchMouseAdaptor( editorMouseMove ) )
  cnvs.addEventListener( "touchend", touchMouseAdaptor( editorMouseUp ) )
  cnvs.addEventListener( "touchcancel", touchMouseAdaptor( editorMouseCancel ) )
  cnvs.addEventListener( "wheel", editorScrollZoom )
  setInterval( saveCustomLevels, EDITORAUTOSAVETIMEOUT )
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
    shortcutKey: "p",
    mouseDown( x, y ) {
      editorTools.pan.px = x
      editorTools.pan.py = y
    },
    mouseDrag( x, y ) {
      editorCamera.x -= x - editorTools.pan.px
      editorCamera.y -= y - editorTools.pan.py
    }
  },
  zoom: {
    shortcutKey: "z",
    selectTool( ) {
      document.querySelector( ".zoomToolbar" ).style.display = ""
    },
    deselectTool( ) {
      document.querySelector( ".zoomToolbar" ).style.display = "none"
    }
  },
  adjust: {
    shortcutKey: "a",
    hoverX: -Infinity,
    hoverY: -Infinity,
    dragging: false,
    currentAnchor: null,
    mouseHover( x, y ) {
      editorTools.adjust.hoverX = x
      editorTools.adjust.hoverY = y
    },
    mouseDown( x, y ) {
      let objsArr = [ ...currentLevel.objects, spawnPointPseudoLevelObject ]
      for ( let i = 0; i < objsArr.length; i++ ) {
        let as = objsArr[ i ].getAnchors( )
        for ( let j = 0; j < as.length; j++ ) {
          let pos = as[ j ].pos
          if ( ( pos.x - x ) ** 2 + ( pos.y - y ) ** 2 <= 1 / 4 ) {
            editorTools.adjust.dragging = true
            editorTools.adjust.currentAnchor = as[ j ]
            currentLevel.markCompleted( false )
            return
          }
        }
      }
    },
    mouseDrag( x, y ) {
      if ( !editorTools.adjust.dragging ) return
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
    shortcutKey: "l",
    mouseDown( x, y ) {
      let obj = new Segment( Math.round( x ), Math.round( y ), Math.round( x ), Math.round( y ) )
      currentLevel.objects.add( obj )
      Segment.currentLevelInstances.add( obj )
      editorTools.segment.obj = obj
      currentLevel.markCompleted( false )
    },
    mouseDrag( x, y ) {
      editorTools.segment.obj.x2 = Math.round( x )
      editorTools.segment.obj.y2 = Math.round( y )
    }
  },
  polygon: {
    shortcutKey: "y",
    /* ... */
  },
  goaltape: {
    shortcutKey: "g",
    mouseDown( x, y ) {
      let obj = new GoalTape( Math.round( x ), Math.round( y ), Math.round( x ), Math.round( y ) )
      currentLevel.objects.add( obj )
      GoalTape.currentLevelInstances.add( obj )
      editorTools.goaltape.obj = obj
      currentLevel.markCompleted( false )
    },
    mouseDrag( x, y ) {
      editorTools.goaltape.obj.x2 = Math.round( x )
      editorTools.goaltape.obj.y2 = Math.round( y )
    }
  },
  eraser: {
    shortcutKey: "e",
    mouseDown( x, y ) {
      let hv = getHoveredBy( x, y )
      if ( !hv ) return
      currentLevel.objects.delete( hv )
      hv.constructor.currentLevelInstances.delete( hv )
      currentLevel.markCompleted( false )
    },
    mouseDrag( x, y ) {
      let hv = getHoveredBy( x, y )
      if ( !hv ) return
      currentLevel.objects.delete( hv )
      hv.constructor.currentLevelInstances.delete( hv )
      currentLevel.markCompleted( false )
    }
  },
  move: {
    shortcutKey: "m",
    selected: false,
    cAnchors: [ ],
    lx: 0,
    ly: 0,
    mouseDown( x, y ) {
      let hv = getHoveredBy( x, y )
      if ( !hv ) return
      editorTools.move.selected = true
      editorTools.move.cAnchors = hv.getAnchors( )
      editorTools.move.lx = x
      editorTools.move.ly = y
      currentLevel.markCompleted( false )
    },
    mouseDrag( x, y ) {
      if ( !editorTools.move.selected ) return
      let { cAnchors, lx, ly } = editorTools.move
      cAnchors.forEach( a => {
        let pos = a.pos
        a.pos = { x: pos.x + x - lx, y: pos.y + y - ly }
      } )
      editorTools.move.lx = x
      editorTools.move.ly = y
    },
    mouseUp( ) {
      editorTools.move.cAnchors.forEach( a => {
        let pos = a.pos
        a.pos = { x: Math.round( pos.x ), y: Math.round( pos.y ) }
      } )
      editorTools.move.selected = false
      editorTools.move.cAnchors = [ ]
    },
    mouseCancel( ) {
      editorTools.move.cAnchors.forEach( a => {
        let pos = a.pos
        a.pos = { x: Math.round( pos.x ), y: Math.round( pos.y ) }
      } )
      editorTools.move.selected = false
      editorTools.move.cAnchors = [ ]
    }
  },
  rotate: {
    shortcutKey: "r",
    selected: false,
    cAnchors: [ ],
    la: 0,
    mouseDown( x, y ) {
      let hv = getHoveredBy( x, y )
      if ( !hv ) return
      editorTools.rotate.selected = true
      let as = hv.getAnchors( ),
           c = CoordinateAnchor.getCenter( as ).pos
      editorTools.rotate.cAnchors = as
      editorTools.rotate.la = Math.atan2( y - c.y, x - c.x )
      currentLevel.markCompleted( false )
    },
    mouseDrag( x, y ) {
      if ( !editorTools.rotate.selected ) return
      let { cAnchors, la } = editorTools.rotate
      let c = CoordinateAnchor.getCenter( cAnchors ).pos,
          a = Math.atan2( y - c.y, x - c.x )
      CoordinateAnchor.rotate( cAnchors, a - la )
      editorTools.rotate.la = a
    },
    mouseUp( ) {
      editorTools.rotate.cAnchors.forEach( a => {
        let pos = a.pos
        a.pos = { x: Math.round( pos.x ), y: Math.round( pos.y ) }
      } )
      editorTools.rotate.selected = false
      editorTools.rotate.cAnchors = [ ]
    },
    mouseCancel( ) {
      editorTools.rotate.cAnchors.forEach( a => {
        let pos = a.pos
        a.pos = { x: Math.round( pos.x ), y: Math.round( pos.y ) }
      } )
      editorTools.rotate.selected = false
      editorTools.rotate.cAnchors = [ ]
    }
  },
  reflect: {
    shortcutKey: "f",
    selected: false,
    cAnchors: [ ],
    lx: 0,
    ly: 0,
    mouseDown( x, y ) {
      let hv = getHoveredBy( x, y )
      if ( !hv ) return
      editorTools.reflect.selected = true
      editorTools.reflect.cAnchors = hv.getAnchors( )
      editorTools.reflect.lx = x
      editorTools.reflect.ly = y
      currentLevel.markCompleted( false )
    },
    mouseDrag( x, y ) {
      if ( !editorTools.reflect.selected ) return
      let { cAnchors, lx, ly } = editorTools.reflect
      let c = CoordinateAnchor.getCenter( cAnchors ).pos
      let psx = Math.sign( editorTools.reflect.lx - c.x ),
          psy = Math.sign( editorTools.reflect.ly - c.y ),
          csx = Math.sign( x - c.x ),
          csy = Math.sign( y - c.y )
      if ( psx !== csx ) {
        CoordinateAnchor.reflect( cAnchors, "h" )
      }
      if ( psy !== csy ) {
        CoordinateAnchor.reflect( cAnchors, "v" )
      }
      editorTools.reflect.lx = x || editorTools.reflect.lx
      editorTools.reflect.ly = y || editorTools.reflect.ly
    },
    mouseUp( ) {
      editorTools.reflect.selected = false
      editorTools.reflect.cAnchors = [ ]
    },
    mouseCancel( ) {
      editorTools.reflect.selected = false
      editorTools.reflect.cAnchors = [ ]
    }
  }
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
  
  static reflect( cAnchors, dir, center = null ) {
    center ??= CoordinateAnchor.getCenter( cAnchors ).pos
    if ( dir === "v" ) {
      cAnchors.forEach( a => a.y = 2 * center.y - a.y )
    }
    if ( dir === "h" ) {
      cAnchors.forEach( a => a.x = 2 * center.x - a.x )
    }
  }
  
  static rotate( cAnchors, angle, center = null ) {
    center ??= CoordinateAnchor.getCenter( cAnchors ).pos
    cAnchors.forEach( a => {
      let pos = a.pos,
           pa = Math.atan2( pos.y - center.y, pos.x - center.x ),
          len = Math.sqrt( ( pos.x - center.x ) ** 2 + ( pos.y - center.y ) ** 2 )
      a.pos = { x: center.x + len * Math.cos( pa + angle ), y: center.y + len * Math.sin( pa + angle ) }
    } )
  }
}

const spawnPointPseudoLevelObject = {
  getAnchors( ) {
    return [ new CoordinateAnchor(
      ( ) => ( { x: currentLevel.spawnPoint.x, y: currentLevel.spawnPoint.y } ),
      ( x, y ) => { currentLevel.spawnPoint.x = x; currentLevel.spawnPoint.y = y }
    ) ]
  },
  isHoveredBy( x, y ) {
    return ( x - currentLevel.spawnPoint.x ) ** 2 + ( y - currentLevel.spawnPoint.y ) ** 2 <= 1
  }
}

function getHoveredBy( x, y ) {
  let objsArr = editorTool === "move" ? [ ...currentLevel.objects, spawnPointPseudoLevelObject ] : [ ...currentLevel.objects ]
  for ( let i = 0; i < objsArr.length; i++ ) {
    if ( objsArr[ i ].isHoveredBy( x, y ) ) return objsArr[ i ]
  }
  return false
}

function editMetadata( ) {
  EDITINGMETADATA = true
  let elem = document.querySelector( ".metaleveluielem" )
  elem.querySelector( ".leveltitle span" ).innerText = currentLevel.title
  elem.querySelector( ".leveldisc span" ).innerText = currentLevel.disc
  elem.querySelector( ".levelauthor span" ).innerText = currentLevel.author
  document.querySelector( ".metadatascreen" ).style.display = ""
}

function uneditMetadata( ) {
  EDITINGMETADATA = false
  let elem = document.querySelector( ".metaleveluielem" )
  currentLevel.title = elem.querySelector( ".leveltitle span" ).innerText
  currentLevel.disc = elem.querySelector( ".leveldisc span" ).innerText
  currentLevel.author = elem.querySelector( ".levelauthor span" ).innerText
  updateLevelUIComponent( currentLevel )
  document.querySelector( ".metadatascreen" ).style.display = "none"
}

function handleKeyPressEditor( e ) {
  if ( EDITINGMETADATA && e.key === "Escape" ) {
    uneditMetadata( )
  } else if ( !EDITINGMETADATA ) {
    if ( e.key === "Escape" ) {
      closeEditor( )
      return
    }
    if ( e.key === "Enter" ) {
      saveCustomLevels( )
      startLevel( currentLevel )
      return
    }
    if ( e.key === "\\" ) {
      editMetadata( )
      return
    }
    if ( e.key === "s" ) {
      saveCustomLevels( )
      return
    }
    // I would use editorTools.forEach here, but I want to early-exit
    let editorToolNames = Object.keys( editorTools )
    for ( let i = 0; i < editorToolNames.length; i++ ) {
      if ( editorTools[ editorToolNames[ i ] ]?.shortcutKey === e.key ) {
        editorSetTool( editorToolNames[ i ] )
        return
      }
    }
  }
}