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
