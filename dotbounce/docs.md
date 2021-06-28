# An Explanation of the .bounce file format designed for the game Bounce

## Motivation

Previous versions of Bounce, before the 3.X.X rewrite used a json based save system with the .blvl and .blpk extensions. This format was, being json-based, pretty inefficient space-wise. The .bounce file format is a binary file format which should decrease its size immensly

## Description

( All bytes are 8 bits long, and all fixed-length numbers are big-endian )

A bounce file consists of a single root `data-item`, usually of type complex.

A `data-item` starts with a 1-byte `type-id`, which specifies the type of data this item represents, what follows is determined by the `type-id`

### A complete list of `type-id`s ( Ids written in hex )

|     Id      | Name    | Additional Bytes Read | Interpretation                                                                                                                                       |
| :---------: | ------- | :-------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `00`        | N/A     | N/A                   | Non-Id, The ID `00` is not a valid ID because it is instead used as an end-of-section indicator in some contexts                                     |
| `01`&nbsp;&&nbsp;`02` | bool    | 0                     | `true` and `false`, repsectively                                                                                                                     |
| `0F`        | null    | 0                     | `null`                                                                                                                                               |
| `10`        | varuint | Variable              | Unsigned var-int                                                                                                                                     |
| `11` - `18` | uint    | Variable              | Fixed-length unsigned integer, of lengths 1 byte - 8 bytes, respectivly                                                                              |
| `20`        | varint  | Variable              | Signed var-int, signed numbers encoded via zig-zag coding                                                                                            |
| `21` - `28` | int     | Variable              | Fixed-length signed integer, of lengths 1 byte - 8 bytes, respectivly                                                                                |
| `30` & `31` | float   | 4 & 8                 | 32-bit float, and 64-bit float respectivly )                                                                                                         |
| `40`        | string  | Variable              | A UTF-8 encoded string, preceded by a 4-byte unsigned integer indicating its length in bytes                                                         |
| `A0`        | list    | Variable              | A list of `data-items`, terminated with a null byte                                                                                                  |
| `B0`        | complex | Variable              | A list of key value pairs, where the keys are strings ( with a 1-byte length prefix ) and the values are `data-items`, terminated with a null byte   |
| `F0`        | special | Variable              | A 1-byte length prefixed string, then the same as type list, this series of elements is passed as arguments to a function determined by the string   |

Ids `50` - `9F` are also used for type special, using the exact same encoding as type list, the function to pass to is now indexed by the id minus `50`instead of a preceeding string for any special functions with this shorthand. A special type can have a string index, a numeric index, or both.

## Using dotbounce.js to read and write .bounce files

The dotbounce.js file creates a single constant: `dotbounce` which has a couple of useful functions, classes and symbols.

The function `dotbounce.parse( buffer, specialDictionary? )` takes an ArrayBuffer and returns a parsed object, it also optionally takes in a `dotbounce.SpecialDictionary` object for handling specials.

The function `dotbounce.encode( object, specialDictionary? )` takes a Javascript object, and returns an ArrayBuffer, it also optionally takes in a `dotbounce.SpecialDictionary` object for handling specials.

The class `dotbounce.UnknownSpecial` represents a special object that didn't have an associated `dotbounce.SpecialDictionary` entry when it was parsed, it contains either a `.stringIndex` or a `.integerIndex` property for what indexing method and index was used, and a `.values` array with all of the special's contents.

The class `dotbounce.SpecialDictionary` object represents a dictionary of special indices and handling functions to operate with specials, the class is constructed with a series of objects, one for each type of special, with the following properties:

> An entry should contain a `stringIndex` or a `integerIndex` or both, representing the desired indexing value for this type of special, it additionally may contain a `stringAliases` and/or a `integerAliases` array of additional index values if those are desired. ( Aliases will be read as valid, but never written ) An entry should contain a `parserFunction` function which is the function passed the arguments in the buffer after they are parsed. An entry can contain an addition pair of functions `test` and `getValues` which should test an object for if it should be encoded as this type of special and retrieve a series of values to store to the buffer repectively.

`dotbounce.SpecialDictionary` extends Array so all the usual Array functions are available to it

Below is an example of a `dotbounce.SpecialDictionary` encoding a custom class `Test`:

```javascript
class Test {
  constructor( a, b, c ) {
    this.a = a
    this.b = b
    this.c = c
  }
  
  /* ... */
}

let dict = new dotbounce.SpecialDictionary( {
  stringIndex: "Test",
  stringAliases: [ "test", "Class_Test" ],
  test: obj => obj instanceof Test,
  getValues: obj => [ obj.a, obj.b, obj.c ],
  parserFunction: values => new Test( ...values )
} )
```

The symbol `dotbounce.ENCODER` can be used as the key of an object property to set a function that encodes that object as a symbol, the function should return an object with a `stringIndex` or an `integerIndex` property ( not both ) and a `values` property

The property `dotbounce.globalSpecialDictionary` is an instance of `dotbounce.SpecialDictionary` that is used in all calls to `dotbounce.parse` and `dotbounce.encode` in addition to any dictionary passed to the function

For parsing specials, first the `dotbounce.specialDictionary` passed to function is checked, if there is one, if there isn't or it doesn't have a matching entry, the `dotbounce.globalSpecialDictionary` is checked, if it doesn't have a matching entry, a `dotbounce.UnknownSpecial` is created

For encoding specials, first the object's `dotbounce.ENCODER` property is used, if it exists, otherwise, the `dotbounce.specialDictionary` passed to the function is checked and if it has a matching entry used, if it doesn't exist, or doesn't have a matching entry, the `dotbounce.globalSpecialDictionary` is checked and if it has a matching entry used, if it doesn't have a matching entry, the object is encoded as a non-special, if it can be, otherwise an error is thrown.  
