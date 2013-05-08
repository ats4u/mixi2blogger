/*
* LTYPE - Very Simple Non-Prototype-Based Type Management System
* Author : ats.creativity@gmail.com 
* Date : Mar/2013
* Licence : BSD licence
*/
    var __lconsole_of_dummy = {
        trace:function(){},
        log:function(){},
        warn:function(){},
        error:function(){},
        group:function(){},
        groupEnd:function(){},
    };
    function __lconsole() {
        if ( content != null && content.console != null ) {
            var console = content.console;
            if ( console.group == undefined ) {
                console.group = console.log;
            }
            if ( console.groupEnd == undefined ) {
                console.groupEnd = function() {
                };
            }
            return console;
        } else {
            return __lconsole_of_dummy;
        }
    }

    // function eq( o1, o2 ) {
    //     var result = _eq(o1,o2);
    //     console.log( "eq(o1=",o1, ", o2=",o2, ")=", result );
    //     return result;
    // }

    // "isNaN is broken"
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/isNaN#Description
    // (o1!=o1)==true if and only if o1 is NaN
    function eq( o1, o2 ) {
        if ( o1===o2 ) {
            return true;
        } else if ( ( typeof o1==='number' && (o1!=o1) ) && ( typeof o2==='number' && (o2!=o2) ) ) {
            return true;
        } else if ( o1==null || o2 == null ) {
            return false;
        } else if ( (typeof o1) ===  'object' && (typeof o2) === 'object' ) {
            var p1=[];
            var p2=[];
            // var p1=Object.keys(o1);
            // var p2=Object.keys(o2);
            for ( var i in o1 ) {
                if ( i != 'LTYPE' && i != 'LWHEN' ) {
                    p1.push( i );
                }
            }
            for ( var i in o2 ) {
                if ( i != 'LTYPE' && i != 'LWHEN' ) {
                    p2.push( i );
                }
            }
            if ( p1.length != p2.length ) {
                return false;
            } else {
                p1 = p1.sort();
                p2 = p2.sort();
                var len = p1.length;
                for ( var i=0; i<len; i++ ) {
                    if ( p1[i]!=p2[i] ) { return false }
                    if ( ! eq(o1[p1[i]],o2[p2[i]]) ) { return false }
                }
                return true;
            }
        } else {
            return false;
        }
    }

    function _lisArray(object){
        return (
            ( typeof object==='object' ) && 
            ( object!=null ) && 
            ( object.constructor == Array || ( object.length != undefined && object.slice != undefined ) )
        );
    }

    function _lisObject(object){
        return object==null ? false : (typeof object)==='object';
    }

    function _lclone(object){ 
        if ( typeof object === 'object' ) {
            return JSON.parse( JSON.stringify( object ) );
        } else {
            return object;
        }
    }

    // eq( {a:"hello",b:"world"}, {b:"world", a:"hello" } )
    function _lmerge() {
        for ( var i=0; i<arguments.length; i++ ) {
            var o = arguments[i];
            for ( var i in o ) {
                this[i] = o[i];
            }
        }
        return this;
    }
    function _liskeyword( p ) {
        return p=='LTYPEOF' ||p == 'LWHEN' || p =='LTYPE' || p=='LIS' || p=='NAME' || p=='EXTENDS' || p=='ONEOF' || p=='NONEOF' || p=='EXPRESSION' || p=='REGEXP' || p=='FIELDS' || p == 'toString';
    }

    var _LError = {
        toString : function(){
            return JSON.stringify( this, function(k,v) {
                if ( k !='toString' ) {
                    return v;
                }
            });
        },
    };

    function ltypeBasic() {
        return [
            {NAME:'any',       LTYPEOF:'any',       },
            {NAME:'null',      LTYPEOF:'null',      },
            {NAME:'array',     LTYPEOF:'array',     },
            {NAME:'undefined', LTYPEOF:'undefined'  },
            {NAME:'function',  LTYPEOF:'function'   },
            {NAME:'object',    LTYPEOF:'object',    },
            {NAME:'boolean',   LTYPEOF:'boolean',   },
            {NAME:'string',    LTYPEOF:'string',    },
            {NAME:'number',    LTYPEOF:'number',    },
        ];
    }

    var LTYPE_TEST_MODE = false;
    var LTYPE_LAST_OUTPUT = null;
    function lcompile( _ltypes_arr ) {
        if ( arguments.length == 0 ) {
            _ltypes_arr = [];
        }
        if ( ! _lisArray( _ltypes_arr ) ) {
            throw new Error( "Illegal Argument (malformed parameter object) : " + JSON.stringify( _ltypes_arr ) );
        }
        if ( _ltypes_arr === null || ( typeof _ltypes_arr !== 'object' ) || _ltypes_arr.length === undefined ) {
            throw new Error( "Illegal Argument (malformed parameter object) : " + JSON.stringify( _ltypes_arr ) );
        }
        var ltypes_arr = ltypeBasic().concat( _ltypes_arr );
        var map_ltypes = {};
        for ( var i=0; i<ltypes_arr.length; i++ ) {
            if ( ltypes_arr[i].NAME == undefined ) {
                throw new Error( "Illegal Argument (found an object which has no NAME) : " + JSON.stringify( _ltypes_arr ) );
            }
            // 2013/4/28 MODIFIED
            // if ( ltypes_arr[i].LTYPEOF == undefined ) {
            //     throw new Error( "Illegal Argument (found an object which has no LTYPEOF) : " + JSON.stringify( _ltypes_arr ) );
            // }
            map_ltypes[ ltypes_arr[i].NAME ] = ltypes_arr[i];
        }

        var lcast = function lcast( type, object, name ) {
            // __lconsole().trace();
            if ( name == undefined ) {
                name = 'arg0';
            }
            var llog = [];
            var lresult = _lcast( map_ltypes, llog, /*boolean*/ true, /*string||object*/ type , name, /*object*/ object );
            var status  = { 
                result : lresult ? 'NORMAL' : 'ERROR',
                log : llog,
            };
            lcast.status = status;
            if ( LTYPE_TEST_MODE ) {
                LTYPE_LAST_OUTPUT.push( status );
            }
            // for ( var i=0; i<lcast.__ondone.length; i++ ) {
            //     lcast.__ondone[i]( status );
            // }
            if ( ! lresult ) {
                // __lconsole().error( "Type Mismatch", new Error().stack.split("\n"), type, JSON.stringify( llog,undefined, 4 ) );
                // throw { __proto__:_LError, message:"Type Mismatch",stack:new Error().stack.split("\n"), object:object, type:type, log:llog }
                throw { __proto__:_LError, message:"Type Mismatch",stack:new Error().stack, object:object, type:type, log:llog }
            }
            return object;
        };
        // lcast.__ondone = [];
        return lcast;
    }
    
    function _larrmerge() {
        var result=[];
        for ( var pidx=0; pidx<arguments.length; pidx++ ) {
            var arr = arguments[pidx];
            for ( var aidx=0; aidx<arr.length; aidx++ ) {
                var found = false;
                for ( var ridx=0; ridx<result.length; ridx++ ) {
                    if ( result[ridx] == arr[aidx] ) {
                        found = true;
                        break;
                    }
                }
                if ( ! found ) {
                    result.push( arr[aidx] );
                }
            }
        }
        return result;
    }

    function _lstackToString( stack ) {
        if ( stack === undefined ) {
            __lconsole().trace();
        }
        if ( 0<stack.length ) {
            return "[" + stack.join( "][" ) + "]";
        } else {
            return "";
        }
    }

    function _ldimToStr(dim) {
        var s = "";
        for ( var i=0; i<dim; i++ ) {
            s+="[]";
        }
        return s;
    }

    function _llogNotifyStatus( sectionName, result, typedefVariation, typedefScript, targetName, sublog ) {
        if ( result ) {
            return ( { type:"OK",                   reason : "[" + sectionName + "] the " + typedefVariation + " '" + typedefScript + "' with the value specified by '"+targetName+"' was evaluated as true. / see $sublog", sublog:sublog } );
        } else { 
            return ( { type:"Object Type Mismatch", reason : "[" + sectionName + "] the " + typedefVariation + " '" + typedefScript + "' with the value specified by '"+targetName+"' was evaluated as false. / see $sublog",sublog:sublog } );
        }
    }

    function _llogNotifyPrimitive( result, objectValue, typedefObject ) {
        var objectPrimitiveType = _ltypeof( objectValue );
        if ( result ) {
            return ( { type:"OK",                      reason : 
                "[LTYPEOF] '"+typedefObject.NAME+"' requires ltypeof value '" + typedefObject.LTYPEOF + "' and the ltypeof value of $objectValue is '" + objectPrimitiveType +"'.", objectValue : objectValue } );
        } else {
            return ( { type:"Primitive Type Mismatch", reason : 
                "[LTYPEOF] '"+typedefObject.NAME+"' requires ltypeof value '" + typedefObject.LTYPEOF + "' and the ltypeof value of $objectValue is '" + objectPrimitiveType +"'.", objectValue : objectValue } );
        }
    }

    /*
    * a wildcard class name 'any' matches every type but undefined. 
    * a wildcard class name 'array' matches array object. 
    */
    function _ltypeofCheck( ltypeof, objectValue ) {
        if ( ltypeof === 'any' ) {
            return objectValue !== undefined;
        } else if ( ltypeof==='null' ) {
            return objectValue === null;
        } else if ( ltypeof==='object' ) {
            return ( typeof objectValue==='object' ) && ( objectValue !== null ) && ! _lisArray( objectValue );
        } else if ( ltypeof==='array' ) {
            return ( typeof objectValue==='object' ) && ( objectValue !== null ) &&   _lisArray( objectValue );
        } else {
           return typeof objectValue === ltypeof;
        }
        // return ( 
        //        ( ltypeof==='any'    && objectValue !== undefined ) || 
        //        ( ltypeof==='null'   && objectValue === null ) ||
        //        ( ltypeof==='object' && ( objectPrimitiveType==='object' ) && ( objectValue !== null ) && ! _lisArray( objectValue ) ) ||
        //        ( ltypeof==='array'  && ( objectPrimitiveType==='object' ) && ( objectValue !== null ) &&   _lisArray( objectValue ) ) ||
        //        ( ltypeof!=='object' && ( ltypeof=== objectPrimitiveType ) )
        // );
    }
    function _ltypeof( objectValue ) {
        var typeofValue = typeof objectValue;
        if ( typeofValue==='object' ) { 
            if ( objectValue === null ) { 
                return 'null';
            } else if ( _lisArray( objectValue ) ) {
                return 'array';
            } else {
                return 'object';
            }
        } else {
            return typeofValue;
        }
    }

    /*
    * _lget_RTTI
    *     check RTTI object
    */
    function _lget_RTTI( objectValue ) {
        return objectValue == null ? null : ( objectValue.LTYPE == undefined ? null : objectValue.LTYPE );
    }

    /**
    * _lembed()
    *     This embeds RTTI information to an object.
    */

    function _lembed( object, typeStringList ) {
        if ( ! LTYPE_TEST_MODE ) {
            object.LWHEN = new Error().stack.split("\n").slice(2);
        }
        object.LTYPE = _larrmerge( object.LTYPE == undefined ? [] : object.LTYPE, typeStringList );
        // object.toString = function() {
        //     return "[object " + this.LTYPE.join(",") +"]\n" + this.LWHEN;
        // };
        return object;
    }

    function _lname( typedefObject ) { 
        return typedefObject.NAME != undefined ? typedefObject.NAME : 'ANONYMOUS';
    }


    function _lcast( ltypes, llog, /*boolean*/ doembedRTTI, /*string||object*/ typedef, objectName, /*object*/ objectValue ) {
        if ( typedef == undefined ) {
            llog.push( { type:'Illegal Argument Error', reason: "typedef was '" + typedef + "'." } );
            return false;
        } else if ( typeof typedef === 'string' ) {
            return _lcast_typedefScript( ltypes, llog, doembedRTTI, typedef, objectName, objectValue, [] );
        } else if ( typeof typedef === 'object' ) {
            return _lcast_typedefObject2( ltypes, llog, false, doembedRTTI, _lname(typedef), typedef, objectName, objectValue, 0, [] );
        } else {
            llog.push( { type:'Illegal Argument Error', reason: "typedef was '" + typedef + "'." } );
            return false;
        }
    }


    /*
    * _lcast_typedefScript
    */
    function _lcast_typedefScript( ltypes, llog, /*boolean*/doembedRTTI, /*string*/ typedefScript, objectName, /*object||undefined*/ objectValue, arrayIndexStack1 ) {
        var objectName1 = objectName+_lstackToString(arrayIndexStack1);
        if ( typedefScript.startsWith( "array of " ) ) {
            var sublog = [];
            var result = _lcast_arrayof_typedefString(ltypes, sublog, doembedRTTI, typedefScript, objectName, objectName1, objectValue, arrayIndexStack1 );
            llog.push( _llogNotifyStatus( 'ARRAYOF', result, 'SCRIPT', typedefScript, objectName1, sublog ) );
            return result;
        } else {
            var sublog = [];
            var result = _lcast_eval_typedefString(ltypes, sublog, doembedRTTI, objectName1, objectValue, typedefScript );
            llog.push( _llogNotifyStatus( 'EVALSTR', result, 'SCRIPT', typedefScript, objectName1, sublog ) );
            return result;
        }
    }

    function _lcast_arrayof_typedefString( ltypes, llog, /*boolean*/doembedRTTI, /*string*/ typedefScript, objectName, objectName1,/*object||undefined*/ objectValue, arrayIndexStack1 ) {
        if ( objectValue ==null || (! _lisArray( objectValue ) ) ) {
            llog.push( { type:"Not Array", reason : "'"+objectName1+"' is not an array." } );
            return false;
        }
        arrayIndexStack1.push(null);
        var arrIdxPos = arrayIndexStack1.length-1;
        var result = true;
        for ( var i=0; i<objectValue.length; i++ ) {
            arrayIndexStack1[arrIdxPos] = i;
            if ( ! _lcast_typedefScript( ltypes, llog, doembedRTTI, typedefScript.substring(9), objectName, objectValue[i], arrayIndexStack1 ) ) {
                result = false;
                // break;
            }
        }
        arrayIndexStack1.pop();
        return result;
    }

    var _lregexp1 = /([\*]*)([_$a-zA-Z0-9\xA0-\uFFFF]+)((\[\])*)/g;
    function _lcast_eval_typedefString( ltypes, llog, doembedRTTI, objectName1, objectValue, typedefScript ) {
        var typeValueScript = typedefScript.replace( _lregexp1, function(s0,prefix, identifier, array) {
            return "fn('"+prefix+"','" + identifier +"',"+(array.length /2)+")";
        });
        function fn( prefix, typedefID, arrayDim ) {
            // __lconsole().log( "fn()",prefix, typedefID, arrayDim );
            var doFastTypeCheck = ( 0<=prefix.indexOf("*" ) );
            return _lcast_eval_typedefID( ltypes, llog, doembedRTTI, doFastTypeCheck, typedefID, objectName1, objectValue, arrayDim, [] );
        }
        var result = eval( typeValueScript );
        return result;
    }

    function _lcast_eval_typedefID( ltypes, llog, doembedRTTI, doFastTypeCheck, /*string*/ typedefID, objectName1, objectValue, arrayIndexStack2Max, arrayIndexStack2 ) {
        var objectName2 = objectName1 +_lstackToString(arrayIndexStack2);
        if ( 0<arrayIndexStack2Max ) {
            if ( objectValue.length === undefined ) {
                llog.push( { type:"Not Array", reason : "'"+objectName2+"' is not array."  } );
                return false;
            } else {
                var result=true; 
                var subsublog = [];
                for ( var i=0; i<objectValue.length; i++ ) {
                    arrayIndexStack2.push(i);
                    if ( ! _lcast_eval_typedefID( ltypes, subsublog, doembedRTTI, doFastTypeCheck, typedefID, objectName1, objectValue[i], arrayIndexStack2Max-1, arrayIndexStack2) ) {
                        result = false;
                    }
                    arrayIndexStack2.pop();
                }
                llog.push( _llogNotifyStatus( 'ARRAY', result, 'OBJECTID', typedefID+_ldimToStr(arrayIndexStack2Max), objectName2, subsublog ) );
                return result;
            }
        } else {
            var typedefObject = ltypes[ typedefID ];
            if ( typedefObject == undefined ) {
                llog.push( { type:'Undefined Type', reason:"the specified type '"+typedefID+"' is not defined." } );
                return false;
            } else {
                return _lcast_typedefObject2( ltypes, llog, doFastTypeCheck, doembedRTTI, typedefID, typedefObject, objectName2, objectValue,arrayIndexStack2Max, arrayIndexStack2 );
            }
        }
    }

    function _lcast_restore_prefix( doFastTypeCheck, typedefObject ) {
        if ( typedefObject != null && typedefObject.LTYPEOF != undefined && typedefObject.LTYPEOF=='object' ) {
            return doFastTypeCheck ? "*" : "";
        } else {
            return "";
        }
    }
    function _lcast_typedefObject2( ltypes, llog, doFastTypeCheck, doembedRTTI, /*string*/ typedefID, /*object*/typedefObject, objectName2, objectValue, arrayIndexStack2Max, arrayIndexStack2 ) {
        var lsublog = [];
        var result = _lcast_typedefObject3( ltypes, lsublog, doFastTypeCheck, doembedRTTI, typedefID, typedefObject, objectName2, objectValue, arrayIndexStack2Max, arrayIndexStack2 );
        llog.push( _llogNotifyStatus( 'EVALOBJ', result, 'OBJECTID', typedefID + _ldimToStr(arrayIndexStack2Max), objectName2, lsublog ) );
        return result;
    }
    function _lcast_typedefObject3( ltypes, llog, doFastTypeCheck, doembedRTTI, /*string*/ typedefID, /*object*/typedefObject, objectName2, objectValue, arrayIndexStack2Max, arrayIndexStack2 ) {
        if ( typedefObject === undefined ) {
            llog.push( { type:"Undefined Type", reason : "the type '"+ typedefID+ "' is not defined." } );
            return false;
        // } else if (typedefObject.LTYPEOF==undefined ) {
        //     llog.push( { type:"Malformed Type Definition", reason : "the type '"+ typedefID + "' has no LTYPEOF property." } );
        //     return false;
        } else {
            if ( doFastTypeCheck ) {
                var grandResult = (function() {
                    // CONDITION1 (NEW)
                    var typeLIS = [];
                    if ( typedefObject.LIS != undefined  ){
                        typeLIS = typeLIS.concat( typedefObject.LIS );
                    }
                    if ( typedefObject.NAME != undefined ) {
                        var found = false;
                        for ( var i=0; i<typeLIS.length; i++ ) {
                            if ( typeLIS[i] == typedefObject.NAME ) {
                                found=true;
                                break;
                            }
                        }
                        if ( ! found ) {
                            typeLIS.unshift( typedefObject.NAME );
                        }
                    }
                    
                    // CONDITION 2
                    var objectRTTI /*string[]*/ = _lget_RTTI( objectValue );
                    if ( objectRTTI == null ) {
                        llog.push( { type:"Unqualified Object", reason : "[FASTCHECK] RTTI checking was performed. the type '" + typedefID + "' has type restriction ["+ typeLIS.join(",") + "] but the value has no RTTI information.", objectValue:objectValue } );
                        return false;
                    } 

                    // CONDITION 3 (LOOP)

                    // (AND operation)
                    var outerFound = true;
                    for ( var aidx=0; aidx<typeLIS.length; aidx++ ) {
                        var atype = typeLIS[aidx];
                        // (OR operation)
                        var found=false;
                        for ( var oidx=0; oidx<objectRTTI.length; oidx++ ) {
                            if (objectRTTI[oidx]===atype ) {
                                found=true;
                                break;
                            }
                        }
                        if ( ! found  ) {
                            outerFound = false;
                            break;
                        }
                    }

                    if ( outerFound ) {
                        llog.push( { type:"OK",                        reason : "[FASTCHECK] RTTI checking was performed. the type '" + typedefID + "' has type requirement ["+ typeLIS.join(",")  + "] and the value has type [" + objectRTTI.join(",") +"]." } );
                    } else {
                        llog.push( { type:"Type Information Mismatch", reason : "[FASTCHECK] RTTI checking was performed. the type '" + typedefID + "' has type requirement ["+ typeLIS.join(",")  + "] and the value has type [" + objectRTTI.join(",") +"]." } );
                    }
                    return outerFound;
                })();
                return grandResult;
            } else {
                var patcheck = (function(section,patterns,result) {
                    if ( patterns == undefined ) {
                        llog.push( { type:"OK", reason : "["+section+"] '"+typedefID+ "' has no value restriction." } );
                        return true;
                    } else {
                        // llog.push( { type:"Log", reason :  [] } );
                        for ( var i=0; i<patterns.length; i++ ) {
                            if ( eq( patterns[i], objectValue ) ) {
                                llog.push( { type:(result?"OK":"Value Matched"), reason : "["+section+"] '"+typedefID+ "' the pattern restriction($pattern) matched with the value($objectValue).", pattern: patterns[i], objectValue:objectValue } );
                                return result;
                            }
                        }
                        llog.push( { type:(result?"Value Unmatched":"OK"), reason : "["+section+"] '"+typedefID+ "' none of the pattern restrictions($patterns) matched with the value($objectValue).", patterns:patterns, objectValue:objectValue } );
                        return ! result;
                    }
                });

                var grandResult = (function() {
                    if ( typedefObject.EXTENDS === undefined ) { 
                        llog.push( { type:"OK", reason:"[EXTENDS] '" + typedefID + "' has no EXTENDS restriction." } );
                        return true;
                    } else if ( typeof typedefObject.EXTENDS ==='string' ) {
                        var lsublog = [];
                        var result =  _lcast_typedefScript( ltypes, lsublog, doembedRTTI, typedefObject.EXTENDS, objectName2, objectValue, [] );
                        llog.push( _llogNotifyStatus( 'EXTENDS', result, 'SCRIPT', typedefObject.EXTENDS, objectName2, lsublog ) );
                        return result;
                    } else {
                        llog.push( { type:"Malformed Type Definition", reason:"[EXTENDS] the content of EXTENDS must be a string value but '" (+ typeof typedefObject.EXTENDS ) + "'" } );
                        return false;
                    }
                })() && (function() {
                    if ( typedefObject.LTYPEOF === undefined ) { 
                        llog.push( { type:"OK", reason:"[LTYPEOF] '" + typedefID + "' has no LTYPEOF restriction." } );
                        return true;
                    } else {
                        var result = _ltypeofCheck( typedefObject.LTYPEOF, objectValue );
                        llog.push( _llogNotifyPrimitive( result, objectValue, typedefObject ) );
                        return result;
                    }
                })() && (function() {
                    if ( typedefObject.FIELDS == undefined  ) {
                        llog.push( { type:"OK", reason:"[FIELDS] '" + typedefID + "' has no field." } );
                        return true;
                    }
                    if ( objectValue === null || objectValue === undefined ) {
                        llog.push( { type:"Field Mismatch", reason:"[FIELDS] '" + typedefID + "' attempted to check field restriction with the value '"+objectValue+"'." } );
                        return false;
                    }

                    var lsubsublog = [];
                    var result = true;
                    for ( var fieldName in typedefObject.FIELDS ) {
                        if ( _liskeyword( fieldName ) ) {
                            continue;
                        }
                        var argSubType /* object||string */ = typedefObject.FIELDS[ fieldName ];
                        var objectValue2 /* any||undefined */ = objectValue[ fieldName ];
                        if ( ! _lcast( ltypes, lsubsublog, doembedRTTI, argSubType, objectName2+"."+fieldName, /*object*/ objectValue2 ) ) {
                            result = false;
                        }
                    }

                    // llog.push( _llogNotifyStatus( 'L300',result, 'the type', typedefID, objectName2, lsubsublog ) );
                    if ( result ) {
                        llog.push( { type:"OK",             reason: "[FIELDS] '"+typedefID+ "' the fields of the object '"+objectName2+"' are fullfilled with the type '"    +typedefID+ "'. / see $sublog", sublog:lsubsublog, } );
                    } else {
                        llog.push( { type:"Field Mismatch", reason: "[FIELDS] '"+typedefID+ "' the fields of the object '"+objectName2+"' are not fullfilled with the type '"+typedefID+ "'. / see $sublog", sublog:lsubsublog, } );
                    }

                    return result;
                })() && patcheck('ONEOF',typedefObject.ONEOF, true ) && patcheck('NONEOF',typedefObject.NONEOF, false ) && (function() {
                    var condition = typedefObject.EXPRESSION;
                    if ( condition == undefined ) {
                        llog.push( { type:"OK", reason : "[EXPRESSION] '"+typedefID+ "' has no condition." } );
                        return true;
                    } else if ( typeof condition =='string' ) {
                        var result = ( function(value) {
                            // return eval( '(function() {' + condition + '})()' );
                            return eval( condition );
                        } )( objectValue );
                        if ( result ) {
                            llog.push( { type:"OK",              reason : "[EXPRESSION] '"+typedefID+ "' value($objectValue) is fullfilled with the condition($condition). ",     condition:condition, objectValue:objectValue } );
                        } else {
                            llog.push( { type:"Value Unmatched", reason : "[EXPRESSION] '"+typedefID+ "' value($objectValue) is not fullfilled with the condition($condition). ", condition:condition, objectValue:objectValue } );
                        }
                        return result;
                    } else {
                        llog.push( { type:"Malformed Type Definition", reason:"[EXPRESSION] the content of EXPRESSION must be a string value but '" (+ typeof condition ) + "'" } );
                    }
                })() && (function() {
                    // if ( doFastTypeCheck ) {
                    //     llog.push( { type:"OK", reason:"pattern match was not performed because Fast Run Time Type Checking is enabled." } );
                    //     return true;
                    // }
                    // llog.push( { type:"Log", reason : [] } );
                    var lpatValues = typedefObject.REGEXP;
                    if ( lpatValues == undefined ) {
                        // llog.push( { type:"Log", reason :[] } );
                        llog.push( { type:"OK", reason : "[REGEXP] '" + typedefID+ "' has no pattern restriction." } );
                        return true;
                    } else {
                        // llog.push( { type:"Log", reason : [] } );
                        for ( var i=0; i<lpatValues.length; i++ ) {
                            if ( new RegExp( lpatValues[i] ,'g' ).test( objectValue ) ) {
                                llog.push( { type:"OK", reason : "'[REGEXP] '" + typedefID+ "' the pattern '" + lpatValues[i] + "' matched to the value($objectValue)" ,lpatValues:_lclone(lpatValues), objectValue:_lclone(objectValue) } );
                                return true;
                            }
                            // llog.push( { type:"Log", reason : [] } );
                        }
                        llog.push( { type:"Pattern Unmatched", reason : "[REGEXP] '" + typedefID+ "' the patterns ($lpatValues) do not match with the value($objectValue).", lpatValues:_lclone(lpatValues), objectValue:_lclone(objectValue) } );
                        return false;
                    }
                })();

                function embedRTTI() {
                    if ( doembedRTTI && (! doFastTypeCheck ) && typedefObject.NAME != null ) {
                        //if ( objectValue == null || typeof objectValue!='object' ) {
                        if ( ! _ltypeofCheck( 'object',  objectValue ) ) {
                            llog.push( { type:"OK", reason: "[EMBEDDING_RTTI] unable to add the value '"+typedefID+"' to the Run Time Type Information object of the current value so ignored. typeof(" + objectValue + ")=='" + (_ltypeof( objectValue ) ) + "'" } );
                            return;
                        }
                        var before=[],after=[];
                        if ( objectValue.LTYPE != undefined ) {
                            before =  before.concat( objectValue.LTYPE );
                        }
                        _lembed( objectValue, [ typedefObject.NAME ] );
                        if ( objectValue.LTYPE != undefined ) {
                            after  = after.concat( objectValue.LTYPE );
                        }
                        llog.push( { type:"OK", reason: "[EMBEDDING_RTTI] successfully add the value '"+typedefID+"' to the Run Time Type Information object of the current value. See $before and $after.", before:before,after:after  } );
                    }
                }
                if ( grandResult ) {
                    embedRTTI();
                }
                return grandResult;
            }
        }
    }

