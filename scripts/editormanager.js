/*
 * editormanager.js
 * Handles editor logic
 */

let editorTool = "adjust"

function editLevel( levellike ) {
  if ( levellike instanceof Level ) {
    currentLevel = levellike
    generalState.mode = "editor"
    editorSetTool( "adjust" )
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