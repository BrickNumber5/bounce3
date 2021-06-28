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
      if ( obj !== null && obj !== undefined && obj[ dotbounce.ENCODER ] ) {
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
      if ( obj === null || obj === undefined ) {
        insureAvailable( 1 )
        view.setUint8( offset, 0x0F )
        offset++
        return
      }
      if ( typeof obj === "number" ) {
        if ( Number.isSafeInteger( obj ) && !Object.is( obj, -0 ) ) {
          for ( let i = 1; i <= 8; i++ ) {
            if ( obj < 2 ** ( 8 * i - 1 ) && obj >= -( 2 ** ( 8 * i - 1 ) ) ) {
              insureAvailable( i + 1 )
              view.setUint8( offset, 0x20 + i )
              offset++
              for ( let j = 0; j < i; j++ ) {
                view.setUint8( offset + j, ( obj >> ( 8 * ( i - j - 1 ) ) ) & 0xFF )
              }
              offset += i
              return
            }
            if ( obj >= 0 && obj < 2 ** ( 8 * i ) ) {
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
        for ( let i = 1; i <= 8; i++ ) {
          if ( obj < 2 ** ( 8 * i - 1 ) && obj >= -( 2 ** ( 8 * i - 1 ) ) ) {
            insureAvailable( i + 1 )
            view.setUint8( offset, 0x20 + i )
            offset++
            for ( let j = 0; j < i; j++ ) {
              view.setUint8( offset + j, Number( ( obj >> BigInt( 8 * ( i - j - 1 ) ) ) & 0xFFn ) )
            }
            offset += i
            return
          }
          if ( obj >= 0 && obj < 2 ** ( 8 * i ) ) {
            insureAvailable( i + 1 )
            view.setUint8( offset, 0x10 + i )
            offset++
            for ( let j = 0; j < i; j++ ) {
              view.setUint8( offset + j, Number( ( obj >> BigInt( 8 * ( i - j - 1 ) ) ) & 0xFFn ) )
            }
            offset += i
            return
          }
        }
        // At this point none of the fixed-length numbers have had sufficient space, so we resort to varints
        let zigzagObj = obj >= 0 ? 2n * obj : -2n * obj - 1n
        let i = 0n
        while ( true ) {
          i++
          let ceil = 128n ** i
          if ( zigzagObj < ceil ) {
            insureAvailable( 1 + Number( i ) )
            view.setUint8( offset, 0x20 )
            offset++
            for ( let j = 0; j < i; j++ ) {
              view.setUint8( offset, Number( ( ( zigzagObj >> 7n * ( i - BigInt( j ) - 1n ) ) & 0x7Fn ) | ( j == i - 1n ? 0x00n : 0x80n ) ) )
              offset++
            }
            return
          }
          if ( obj >= 0 && obj < ceil ) {
            insureAvailable( 1 + Number( i ) )
            view.setUint8( offset, 0x10 )
            offset++
            for ( let j = 0; j < i; j++ ) {
              view.setUint8( offset, Number( ( ( obj >> 7n * ( i - BigInt( j ) - 1n ) ) & 0x7Fn ) | ( j == i - 1n ? 0x00n : 0x80n ) ) )
              offset++
            }
            return
          }
        }
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
      if ( obj instanceof Array ) {
        insureAvailable( 1 )
        view.setUint8( offset, 0xA0 )
        offset++
        for ( let i = 0; i < obj.length; i++ ) {
          addObjectToBuffer( obj[ i ] )
        }
        insureAvailable( 1 )
        view.setUint8( offset, 0x00 )
        offset++
        return
      }
      insureAvailable( 1 )
      view.setUint8( offset, 0xB0 )
      offset++
      let keys = Object.keys( obj )
      for ( let i = 0; i < keys.length; i++ ) {
        let encoded = new TextEncoder( ).encode( keys[ i ] ).subarray( 0, 255 )
        insureAvailable( 1 + encoded.length )
        view.setUint8( offset, encoded.length )
        offset++
        for ( let i = 0; i < encoded.length; i++ ) {
          view.setUint8( offset, encoded[ i ] )
          offset++
        }
        addObjectToBuffer( obj[ keys[ i ] ] )
      }
      insureAvailable( 1 )
      view.setUint8( offset, 0x00 )
      offset++
    }
    
    function addSpecialToBuffer( specialObject ) {
      if ( specialObject.integerIndex !== undefined ) {
        insureAvailable( 1 )
        view.setUint8( offset, 0x50 + specialObject.integerIndex )
        offset++
        for ( let i = 0; i < specialObject.values.length; i++ ) {
          addObjectToBuffer( specialObject.values[ i ] )
        }
        insureAvailable( 1 )
        view.setUint8( offset, 0x00 )
        offset++
      } else {
        insureAvailable( 1 )
        view.setUint8( offset, 0xF0 )
        offset++
        let encoded = new TextEncoder( ).encode( specialObject.stringIndex ).subarray( 0, 255 )
        insureAvailable( 1 + encoded.length )
        view.setUint8( offset, encoded.length )
        offset++
        for ( let i = 0; i < encoded.length; i++ ) {
          view.setUint8( offset, encoded[ i ] )
          offset++
        }
        for ( let i = 0; i < specialObject.values.length; i++ ) {
          addObjectToBuffer( specialObject.values[ i ] )
        }
        insureAvailable( 1 )
        view.setUint8( offset, 0x00 )
        offset++
      }
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
          return sObj
        }
      }
      return false
    }
  }

  dotbounce.globalSpecialDictionary = new dotbounce.SpecialDictionary
}