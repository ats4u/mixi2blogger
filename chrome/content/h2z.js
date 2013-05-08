/*
    h2z.js 
    Half-width to Japanese Double-Width Converter
    Author :  Ats Oka (I'm from Japan)
    Website : http://ats.oka.nu/  https://github.com/ats4u
    mailto : ats.creativity@gmail.com
*/
var _h2zRegex = /[\u0020-\u007F]/g;
var _h2zMap ={};
for ( var i=0x20; i<0x7f; i++ ) {
    _h2zMap[  String.fromCharCode( i ) ] = String.fromCharCode( i + 0xfee0 );
}
_h2zMap[' '] = ' ';
_h2zMap['~'] = '〜';
// _h2zMap[' '] = '　';
// _h2zMap['~'] = '〜';
function h2z( s ) {
    return s.replace( _h2zRegex, function( s ) {
        if ( _h2zMap[s] !== undefined ) {
            return _h2zMap[s];
        } else {
            return s;
        }
    });
}

