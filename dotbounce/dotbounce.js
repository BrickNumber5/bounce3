/*
 * dotbounce.js
 * This is the library responsible for handling the .bounce file format
 */

const dotbounce = { }
{
  dotbounce.parse = ( buffer, specialDictionary = undefined ) => {
    
  }

  dotbounce.encode = ( object, specialDictionary = undefined ) => {
    
  }

  dotbounce.ENCODER = Symbol( "dotbounce.ENCODER" )

  dotbounce.UnknownSpecial = class {
    constructor( index, values ) {
      if ( typeof index == "number" ) {
        this.integerIndex = index
      } else {
        this.stringIndex = index
      }
      this.values = values
    }
    
    [dotbounce.ENCODER]( ) {
      return this
    }
  }

  dotbounce.SpecialDictionary = class extends Array {
    constructor( ...args ) {
      super( ...args )
    }
  }

  dotbounce.globalSpecialDictionary = new dotbounce.SpecialDictionary
}