/*
 * dotbounce.js
 * This is the library responsible for handling the .bounce file format
 */

const dotbounce = { }
{
  dotbounce.parse = ( buffer, specialDictionary = undefined ) => {
    
  }

  dotbounce.encode = ( object, specialDictionary = undefined ) => {
    let buffer = new ArrayBuffer( 64 ), offset = 0, len = 64, view = new DataView( buffer )
    function addObjectToBuffer( obj ) {
      if ( obj !== null && obj[ dotbounce.ENCODER ] ) {
        addSpecialToBuffer( obj[ dotbounce.ENCODER ]( ) )
        return
      }
      if ( specialDictionary ) {
        let res = specialDictionary.tryEncode( obj )
        if ( res ) {
          addSpecialToBuffer( res )
          return
        }
      }
      let res = dotbounce.globalSpecialDictionary.tryEncode( obj )
      if ( res ) {
        addSpecialToBuffer( res )
        return
      }
      if ( typeof obj === "boolean" ) {
        insureAvailable( 1 )
        view.setUint8( offset, obj ? 0x01 : 0x02 )
        offset++
        return
      }
      if ( obj === null ) {
        insureAvailable( 1 )
        view.setUint8( offset, 0x0F )
        offset++
        return
      }
      if ( typeof obj === "number" ) {
        if ( Number.isSafeInteger( obj ) && !Object.is( -0 ) ) {
          for ( let i = 1; i <= 8; i++ ) {
            if ( i < 2 ** ( 8 * i - 1 ) && i >= -( 2 ** ( 8 * i - 1 ) ) ) {
              insureAvailable( i + 1 )
              view.setUint8( offset, 0x20 + i )
              offset++
              obj &= ( 1 << 8 * j - 1 ) - 1
              if ( Math.sign( obj ) == -1 ) {
                obj |= 1 << 8 * j
              }
              for ( let j = 0; j < i; j++ ) {
                view.setUint8( offset + j, ( obj >> ( 8 * ( i - j - 1 ) ) ) & 0xFF )
              }
              offset += i
              return
            }
            if ( i >= 0 && i < 2 ** ( 8 * i ) ) {
              insureAvailable( i + 1 )
              view.setUint8( offset, 0x10 + i )
              offset++
              for ( let j = 0; j < i; j++ ) {
                view.setUint8( offset + j, ( obj >> ( 8 * ( i - j - 1 ) ) ) & 0xFF )
              }
              offset += i
              return
            }
          }
        }
        // This is to check if crushing to a 32-bit float loses precision
        let test = new Float32Array( 1 )
        test[ 0 ] = obj
        if ( test[ 0 ] == obj ) {
          insureAvailable( 5 )
          view.setUint8( offset, 0x30 )
          offset++
          view.setFloat32( offset, obj )
          offset += 4
          return
        }
        insureAvailable( 8 )
        view.setUint8( offset, 0x31 )
        offset++
        view.setFloat64( offset, obj )
        offset += 8
        return
      }
      if ( typeof obj === "bigint" ) {
        
      }
      if ( typeof obj === "string" ) {
        let encoded = new TextEncoder( ).encode( obj )
        insureAvailable( 5 + encoded.length )
        view.setUint8( offset, 0x40 )
        offset++
        view.setUint32( offset, encoded.length )
        offset += 4
        for ( let i = 0; i < encoded.length; i++ ) {
          view.setUint8( offset, encoded[ i ] )
          offset++
        }
        return
      }
      
    }
    
    function addSpecialToBuffer( specialObject ) {
      
    }
    
    function doubleBuffer( ) {
      let newBuffer = new ArrayBuffer( len * 2 ),
          newView = new DataView( newBuffer )
      for ( let i = 0; i < len; i++ ) {
        newView.setUint8( i, view.getUint8( i ) )
      }
      len *= 2
      buffer = newBuffer
      view = newView
    }
    
    function insureAvailable( length ) {
      while ( len - offset < length ) {
        doubleBuffer( )
      }
    }
    
    addObjectToBuffer( object )
    if ( len !== offset ) {
      let newBuffer = new ArrayBuffer( offset ),
          newView = new DataView( newBuffer )
      for ( let i = 0; i < offset; i++ ) {
        newView.setUint8( i, view.getUint8( i ) )
      }
      buffer = newBuffer
    }
    return buffer
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
    
    tryEncode( obj ) {
      // Returns an encoded object, if a special rule is in place, otherwise returns false
      for ( let i = 0; i < this.length; i++ ) {
        if ( this[ i ].test( obj ) ) {
          let sObj = { }
          if ( this[ i ].integerIndex ) {
            sObj.integerIndex = this[ i ].integerIndex
          } else {
            sObj.stringIndex = this[ i ].stringIndex
          }
          sObj.values = this[ i ].getValues( obj )
        }
      }
      return false
    }
  }

  dotbounce.globalSpecialDictionary = new dotbounce.SpecialDictionary
}