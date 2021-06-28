/*
 * dotbounce.js
 * This is the library responsible for handling the .bounce file format
 */

const dotbounce = { }
{
  dotbounce.parse = ( buffer, specialDictionary = undefined ) => {
    let offset = 0, len = buffer.byteLength, view = new DataView( buffer )
    function getObjectFromBuffer( ) {
      insureAvailable( 1 )
      let typeId = view.getUint8( offset )
      offset++
      if ( typeId === 0x01 ) {
        return true
      }
      if ( typeId === 0x02 ) {
        return false
      }
      if ( typeId === 0x0F ) {
        return null
      }
      if ( typeId === 0x10 ) {
        let obj = 0n
        while( true ) {
          insureAvailable( 1 )
          let currentByte = view.getUint8( offset ),
                   topBit = currentByte >> 7,
                     rest = currentByte & 0x7F
          offset++
          obj <<= 7n
          obj |= BigInt( rest )
          if ( !topBit ) break
        }
        if ( Number.isSafeInteger( Number( obj ) ) ) {
          return Number( obj )
        }
        return obj
      }
      if ( typeId > 0x10 && typeId <= 0x18 ) {
        let len = typeId - 0x10
        insureAvailable( len )
        let obj = 0n
        for ( let i = 0; i < len; i++ ) {
          obj <<= 8n
          obj |= BigInt( view.getUint8( offset ) )
          offset++
        }
        if ( Number.isSafeInteger( Number( obj ) ) ) {
          return Number( obj )
        }
        return obj
      }
      if ( typeId === 0x20 ) {
        let zigzagObj = 0n
        while( true ) {
          insureAvailable( 1 )
          let currentByte = view.getUint8( offset ),
                   topBit = currentByte >> 7,
                     rest = currentByte & 0x7F
          offset++
          zigzagObj <<= 7n
          zigzagObj |= BigInt( rest )
          if ( !topBit ) break
        }
        let obj = zigzagObj % 2n === 0n ? zigzagObj / 2n : -( zigzagObj + 1n ) / 2n
        if ( Number.isSafeInteger( Number( obj ) ) ) {
          return Number( obj )
        }
        return obj
      }
      if ( typeId > 0x20 && typeId <= 0x28 ) {
        let len = typeId - 0x20
        insureAvailable( len )
        let obj = 0n
        for ( let i = 0; i < len; i++ ) {
          obj <<= 8n
          obj |= BigInt( i == 0 ? view.getInt8( offset ) : view.getUint8( offset ) )
          offset++
        }
        if ( Number.isSafeInteger( Number( obj ) ) ) {
          return Number( obj )
        }
        return obj
      }
      if ( typeId === 0x30 ) {
        insureAvailable( 4 )
        let obj = view.getFloat32( offset )
        offset += 4
        return obj
      }
      if ( typeId === 0x31 ) {
        insureAvailable( 8 )
        let obj = view.getFloat64( offset )
        offset += 8
        return obj
      }
      if ( typeId === 0x40 ) {
        insureAvailable( 4 )
        let length = view.getUint32( offset )
        offset += 4
        insureAvailable( length )
        let decodingBuffer = new Uint8Array( length )
        for ( let i = 0; i < length; i++ ) {
          decodingBuffer[ i ] = view.getUint8( offset )
          offset++
        }
        return new TextDecoder( ).decode( decodingBuffer )
      }
      if ( typeId === 0xA0 ) {
        let obj = [ ]
        while ( true ) {
          insureAvailable( 1 )
          if ( view.getUint8( offset ) === 0x00 ) {
            offset++
            break
          } else {
            obj.push( getObjectFromBuffer( ) )
          }
        }
        return obj
      }
      if ( typeId === 0xB0 ) {
        let obj = { }
        while ( true ) {
          insureAvailable( 1 )
          let keyLen = view.getUint8( offset )
          offset++
          if ( keyLen === 0x00 ) {
            break
          } else {
            insureAvailable( keyLen )
            let decodingBuffer = new Uint8Array( keyLen )
            for ( let i = 0; i < keyLen; i++ ) {
              decodingBuffer[ i ] = view.getUint8( offset )
              offset++
            }
            let key = new TextDecoder( ).decode( decodingBuffer )
            obj[ key ] = getObjectFromBuffer( )
          }
        }
        return obj
      }
      if ( typeId === 0xF0 ) {
        insureAvailable( 1 )
        let indexLen = view.getUint8( offset )
        offset++
        insureAvailable( indexLen )
        let decodingBuffer = new Uint8Array( indexLen )
        for ( let i = 0; i < indexLen; i++ ) {
          decodingBuffer[ i ] = view.getUint8( offset )
          offset++
        }
        let index = new TextDecoder( ).decode( decodingBuffer )
        let values = [ ]
        while ( true ) {
          insureAvailable( 1 )
          if ( view.getUint8( offset ) === 0x00 ) {
            offset++
            break
          } else {
            values.push( getObjectFromBuffer( ) )
          }
        }
        return createSpecial( { index, values } )
      }
      if ( typeId >= 0x50 && typeId <= 0x9F ) {
        let index = typeId - 0x50
        let values = [ ]
        while ( true ) {
          insureAvailable( 1 )
          if ( view.getUint8( offset ) === 0x00 ) {
            offset++
            break
          } else {
            values.push( getObjectFromBuffer( ) )
          }
        }
        return createSpecial( { index, values } )
      }
      throw new Error( `0x${ typeId.toString( 16 ).padStart( 2, 0 ) } is not a valid type-id` )
    }
    
    function createSpecial( specifierObject ) {
      if ( specialDictionary ) {
        let localParser = specialDictionary.getParser( specifierObject.index )
        if ( localParser ) {
          return localParser( ...specifierObject.values )
        }
      }
      let globalParser = dotbounce.globalSpecialDictionary.getParser( specifierObject.index )
      if ( globalParser ) {
        return globalParser( ...specifierObject.values )
      }
      return new dotbounce.UnknownSpecial( specifierObject.index, specifierObject.values )
    }
    
    function insureAvailable( length, expected ) {
      if ( offset + length > len ) {
        throw new Error( "Early EOF" )
      }
    }
    
    let obj = getObjectFromBuffer( )
    if ( offset !== len ) {
      throw new Error( "Extra data past end of root data-item" )
    }
    return obj
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
        let encoded = new TextEncoder( ).encode( obj ).subarray( 0, 4294967295 )
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
        if ( specialObject.integerIndex > 79 ) throw new Error( `A .bounce integer index may not be greater than 79, got: ${ specialObject.integerIndex }` )
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
    
    getParser( index ) {
      // Returns a parser for the index, if one is in the dictionary, otherwise returns false
      for ( let i = 0; i < this.length; i++ ) {
        let indices = [ ]
        if ( this[ i ].integerIndex ) indices.push( this[ i ].integerIndex )
        if ( this[ i ].stringIndex ) indices.push( this[ i ].stringIndex )
        if ( this[ i ].integerAliases ) indices.concat( this[ i ].integerAliases )
        if ( this[ i ].stringAliases ) indices.concat( this[ i ].stringAliases )
        for ( let j = 0; j < indices.length; j++ ) {
          if ( indices[ j ] === index ) {
            return this[ i ].parserFunction
          }
        }
      }
      return false
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