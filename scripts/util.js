/*
 * util.js
 * This script contains various variables and functions that are used by multiple other scripts,
 * configuration and the like, and handles setup and launching into other scripts
 */

const VERSION = {
  NUMBER      : "v3.0.0alpha006",
  NAME        : "Nonpublic Alpha Build",
  EXPERIMENTAL: true
}

//Creates strings of the form "XXXX-XXXX-XXXX-XXXX" where X is a random hex digit
let usedStringUUIDS = new Set( ) //To insure no UUID reusage is possible
function mkStringUUID( prefix = "" ) {
  let uuid = Array.from( { length: 4 }, ( ) => Array.from( { length: 4 }, ( ) => Math.floor( Math.random( ) * 16 ).toString( 16 ) ).join( "" ) ).join( "-" )
  if ( usedStringUUIDS.has( uuid ) ) {
    return mkStringUUID( prefix )
  }
  usedStringUUIDS.add( uuid )
  return prefix + uuid
}
