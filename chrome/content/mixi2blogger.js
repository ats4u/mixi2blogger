/* READ_URI */

function readURI(uriString) {
    var charset = 'utf8'
    var ioService=Components.classes["@mozilla.org/network/io-service;1"]
        .getService(Components.interfaces.nsIIOService);

    var scriptableStream=Components
        .classes["@mozilla.org/scriptableinputstream;1"]
        .getService(Components.interfaces.nsIScriptableInputStream);

    var unicodeConverter = Components
        .classes["@mozilla.org/intl/scriptableunicodeconverter"]
        .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    
    unicodeConverter.charset = charset;

    var channel=ioService.newChannel(uriString,null,null);
    var input=channel.open();
    scriptableStream.init(input);
    var str=scriptableStream.read( input.available() );
    scriptableStream.close();
    input.close();
    return unicodeConverter.ConvertToUnicode( str );
}
// var contents = readURI( "chrome://mixitrans-diary/content/a.txt" );

/* READ_URI */


/*
 * A tool for migration from mixi to blogger
 * Wed, 30 Jan 2013 06:48:19 +0700
 * Author Atsushi Oka ats.creativity@gmail.com
 * http://ats.oka.nu/
 */

/*
* ********************************* CONSTANTS ***************************************************
*/

function mixitransTest() {
    alert( "HELLO" );
}
// var MIXI_DIARY_INDEX_ENTRY_PER_PAGE=0;
var MIXI_DIARY_INDEX_ENTRY_PER_PAGE=30;
var MIXI_DOWNLOAD_THREASHOLD = 3000;
var CLOSE_DELAY = 1;
var START_DELAY = 1500;
// var LOGIN_URL = "https://accounts.google.com/o/oauth2/auth?scope=https%3A%2F%2Fpicasaweb.google.com%2Fdata%2F%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fblogger&redirect_uri=http%3A%2F%2Foka-ats.blogspot.com%2F2013%2F01%2Fmixi-evacuator.html&response_type=token&client_id=28285487441.apps.googleusercontent.com";
var LOGIN_URL = "https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fpicasaweb.google.com%2Fdata%2F%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fblogger&redirect_uri=http%3A%2F%2Foka-ats.blogspot.com%2F2013%2F01%2Fmixi-evacuator.html&response_type=code&client_id=28285487441.apps.googleusercontent.com";

var client_id     = "28285487441.apps.googleusercontent.com";
var client_secret = "XP_kjnWlD9v4-XcpxOdPsWgc"
var redirect_uri  = "http://oka-ats.blogspot.com/2013/01/mixi-evacuator.html";

var ltypeDef = [];

    /*
    ****************************************** UTILLITY FUNCTIONS *********************************************************
    */

    function openNew() {
        var __window ;
        if ( window.content != undefined ) {
            __window = window.content;
        } else {
            __window = window;
        }
        __console().trace();
        __console().log( arguments[0] );
        return __window.open.apply( __window, arguments );
    }

    function utf8_to_b64( str ) {
        return controlPanel.btoa(unescape(encodeURIComponent( str )));
    }
     
    function b64_to_utf8( str ) {
        return decodeURIComponent(escape(controlPanel.atob( str )));
    }

    function fetchImage( src, callback ) {
        var xhr;
        xhr = new XMLHttpRequest();
        xhr.open( "GET", src , true );
        xhr.addEventListener( "readystatechange",  loadProc01, false );
        xhr.responseType= "blob";
        xhr.send();
        function loadProc01() {
            if ( xhr.readyState == 4 ) { if ( xhr.status == 200 ) { foundProc() } else { errorProc() } }
            function errorProc() { __console().trace(); __console().error( "fetchImage.error", xhr.responseText ); throw new Error( xhr.responseText ) }
            function foundProc() {
                 callback( xhr.response );
            }
        }
    }

    function generatePostID() {
        return (Math.floor( Math.random() * 0xffffffff ) ).toString(10) + (Math.floor( Math.random() * 0xffffffff ) ).toString(10);
    }

    function mixiDateToDate(s) {
        return new Date( s.replace( /[年月]/g, "/" ).replace( /日/g, " " ) + ":00 +9:00" );
    }
    // __JSON.stringify( mixiDateToDate( "2013年01月21日18:17" ) )

    function formatDateToISO8601( date ) {
        // return __JSON.stringify( new Date( "2010/1/1 10:10:10 +9:00" ) );
        return __JSON.stringify( date ).replace(/^\"|\"$/g,"" );
    }

    var replaceURL = ( function() {
        // var urlRegexp = /(https?:\/\/[^]+)/g;
        var urlRegexp = /(https?:\/\/[\u0020-\u007F]+)/g;
        return function( text ) {
            return text.replace(urlRegexp, function(url) {
                url = url.trim();
                return '<a target="_blank" href="' + url + '">' + url + '</a>';
            })
        }
    } )();
    var replaceCommentNo = ( function() {
        var commentNoRegex = /^>>\[([0-9]+)\]/g;
        return function ( text ) {
            return text.replace(commentNoRegex, function(s,s0) {
                return "<a href='#comment_"+s0+"'>"+s+"</a>";
            })
        };

    })();

    var escapeHTML = ( function () {
        var tagsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        var tagsToReplaceRegexp = (function() {
            var a = [];
            for ( var i in tagsToReplace ) {
                a.push( i );
            }
            return new RegExp( "[" + a.join() + "]","g" );
        })();
        function replaceTag(tag) {
            return tagsToReplace[tag] || tag;
        }
        function escapeHTML(s) {
            return s.replace(tagsToReplaceRegexp, replaceTag);
        }
        return escapeHTML;
    })();

    // escapeHTML( "<html><body><a href=\"http\">hello</a></body></html>" )

        //<category scheme="http://www.blogger.com/atom/ns#" term="空気読み分析"/>

    function blobToDataURL( blob, callback ) {
        var r = new FileReader();
        r.addEventListener( 'load', done, false );
        r.readAsDataURL( blob );
        function done(e) {
            callback( e.target.result );
        }
    }

    /* window.location.search を分解する。 */
    function searchToObject(s) {
        var i = s.indexOf( "?" );
        if ( 0<=i ) {
            s = s.substring(i+1);
        }
        // __console().log( "searchToObject", s );
        var o={},a=s.split(/&/);
        for(var i=0;i<a.length;i++){
            var e=a[i].split(/=/);
            o[e[0].trim()]=e[1].trim();
        }
        return o;
    };

    function objectToSearch(o) {
        var a=[];
        for (var i in o) {
            a.push( i + "=" + o[i] );
        }
        return "?"+ a.join( "&" );
    };
    /* __console().log( objectToSearch( { a:5, b:3, id:"222223234", oid:"sdafassd" } ) ); */
    function toDataURL(d,img) {
        var canvas = d.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var url = canvas.toDataURL("image/png");
        return url;
    }
    function dataURLToBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var arr = [];
        for(var i = 0; i < binary.length; i++) {
            arr.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(arr)], {type: 'image/png'});
    }
    
    function selectByID( sel, func ) {
        __console().log( "selectByID : " +  func );
        __console().log( "sel : " +  sel );
        if ( func == null ) {
            return;
        }
        for ( var i=0; i<sel.options.length;i++ ) {
            if ( func( String(sel.options[i].value) ) ) {
                sel.selectedIndex = i;
                return;
            }
        }
        sel.selectedIndex = 0;

        return ;
    }

    /*
     * ************ WORKING WITH LOCAL STORAGE **************************************************************************************
     */
    // var LS_MIXI_DIARY_INDEX = 'ats.mixi.diaryList';
    // var LS_MIXI_DIARY_DOWNLOADED_INDEX = "ats.mixi.downloadedDiary.all";
    // var LS_MIXI_DIARY_DOWNLOADED_ITEMS     = "ats.mixi.downloadedDiary.item";

    var LS_GOOGLE_REFRESH_TOKEN = "ats.refreshToken";
    var LS_PICASA_ALBUM_ID      = "ats.picasaAlbumID";
    var LS_BLOGGER_BLOG_ID      = "ats.bloggerBlogID";
    var LS_ACCESS_TOKEN         = "ats.accessToken";
    var MIXI_USER_ID                                  = /<ID>/g;
    var LS_MIXI_DIARY_INDEX            = "ats.mixi.diary.<ID>_INDEX";
    var LS_MIXI_DIARY_DOWNLOADED_INDEX = "ats.mixi.diary.downloaded.<ID>_INDEX";
    var LS_MIXI_DIARY_DOWNLOADED_ITEMS = "ats.mixi.diary.downloaded.";
    var LS_MIXI_DIARY_TEMPLATE         = "ats.mixi.diary.<ID>_TEMPLATE";

    var LS_MIXI_USER_ID         = "ats.mixi.userID";
    var LS_MIXI_USER_NAME       = "ats.mixi.userName";
    var LS_MIXI_BBS_LIST        = "ats.mixi.bbsList.";
    var LS_MIXI_SELECTED_BBS    = "ats.mixi.bbs";
    
    var LS_MIXI_LIST_FRIEND = "ats.mixi.listFriend.";

    // a special id that indicates mixi diary in the bbs list.
    var BBS_MIXI_DIARY = "__BBS_MIXI_DIARY__"; 
    var BBS_EMPTY = "__BBS_EMPTY__"; 

    /*
        var CMixiUserType = enum( "mixiuser" , "mixicommunity" );
    */
    function mixiUserTypeToID( mixiUserType ) {
        __console().trace()
        __console().log( "mixiUserType", mixiUserType );
        if (mixiUserType == undefined || mixiUserType == 'mixiuser' ) {
            return 'u';
        } else if (mixiUserType == 'mixicommunity' ) {
            return 'c';
        } else {
            __console().trace();
            __console().error( "unknown mixiUserType","value=", mixiUserType );
            throw new Error( "could not convert the mixiUserInfo object" );
        }
    }
    var _idmap = {
        'd': 'mixiuser', // for the sake of lower compatibility
        'u': 'mixiuser',
        'c': 'mixicommunity',
    };
    function idToMixiUserType( id ) {
        var result = _idmap[id];
        if ( result == null ) {
            result = 'u';
        }
        return result;
    }

    function lsMixiDiaryIndex( mixiUserType, mixiUserID ) { 
        var id = LS_MIXI_DIARY_INDEX.replace( MIXI_USER_ID, mixiUserTypeToID( mixiUserType ) + mixiUserID );
        __console().log( "lsMixiDiaryIndex", "mixiUserType", mixiUserType, "mixiUserID", mixiUserID, "id", id );
        return id;
    }
    function lsMixiDiaryDownloadedIndex( mixiUserType, mixiUserID ){ 
        var id = LS_MIXI_DIARY_DOWNLOADED_INDEX.replace( MIXI_USER_ID, mixiUserTypeToID( mixiUserType ) + mixiUserID );
        __console().log( "lsMixiDiaryDownloadedIndex", "mixiUserType", mixiUserType, "mixiUserID", mixiUserID, "id", id );
        return id;
    }
    function lsMixiDiaryDownloadedItems( diaryID ){ 
        var pdata = parseDiaryID( diaryID )
        var id = LS_MIXI_DIARY_DOWNLOADED_ITEMS + pdata.cid + pdata.oid +"_INDEX."+diaryID;
        // __console().log( "lsMixiDiaryDownloadedItems", "input(diaryID)",diaryID, "output(lsid)", id  );
        return id;
    }

    /*
        CDiaryID : "([uc])([0-9]+)_([0-9]+)"
            $1 cid (category id) : u=user / c=community
            $2 oid (owner id)    : user/community id 
            $3 pid (post id)     : diary/bbs id
    */
    // ltypeDef.push({
    //     LNAME:"CDiaryID",
    //     LTYPEOF:"string",
    //     LPAT:[ "([uc])([0-9]+)_([0-9]+)" ],
    // });
    function urlToDiaryID( /*string*/ url ) /* : CDiaryID */ {
        // __console().trace();
        // __console().log( url );
        var obj = searchToObject( url );
        var cid = '';
        var oid = ''; 
        var pid = '';
        if ( 0<= url.indexOf( "view_bbs.pl" ) ) { 
            // http://mixi.jp/view_bbs.pl?id=58739968&comm_id=987254
            cid = 'c';
            oid = obj['comm_id'];
            pid = obj['id'];
        } else if ( 0<= url.indexOf( "view_diary.pl" ) ) { 
            // http://mixi.jp/view_diary.pl?id=1890276608&owner_id=459989
            cid = 'u';
            oid = obj['owner_id'];
            pid = obj['id'];
        } else {
            __console().trace();
            __console().error("URL [" , url , "] cannot properly be converted to a valid diary id." );
            throw new Error( "URL [" + url + "] cannot properly be converted to a valid diary id." );
        }
        return cid+oid+"_"+pid;
    }
    function parseDiaryID( diaryID ) {
        if ( CDiaryID_REGEXP.test( diaryID ) ) {
            return {
                cid:RegExp.$1,
                oid:RegExp.$2,
                pid:RegExp.$3,
                mixiUserType : idToMixiUserType( RegExp.$1 ),
                mixiUserID : RegExp.$2,
                mixiPostID : RegExp.$3,
            };
        } else {
            __console().trace();
            __console().error( "Illegal Argument Exception : " , diaryID );
            throw new Error( "Illegal Argument Exception : " + __JSON.stringify( diaryID ) + "\n" + new Error().stack.split("\n") );
        }
    }

    // /*
    //     diaryObj : {
    //         CTYPE : [ "CDiaryInfo" ]
    //         owner_id : "diary owner's user-id on mixi", 
    //         id :       "the diary's id", 
    //     }
    // */
    // function urlToDiaryObj( url ) /*: CDiaryInfo*/ {
    //     var i = url.indexOf( "?" );
    //     if ( i<0 ) {
    //         i=0;
    //     }
    //     var diaryObj = searchToObject( url.substring(i) );
    //     return { CTYPE : [ "CDiaryInfo" ], owner_id : diaryObj.owner_id, id : diaryObj.id }
    // }
    // function diaryObjToURL( diaryObj ) {
    //     return 'http://mixi.jp/view_diary.pl?owner_id='+diaryObj.owner_id+'&id='+diaryObj.id+ '&full=1';
    // }
    // function diaryObjToDiaryID( diary ) {
    //     return diary.owner_id + "_" + diary.id;
    // }

    function parseDiaryList( listStr ) {
        if ( listStr == null ) {
            listStr = "";
        }
        listStr = listStr.trim();
        var list = listStr == "" ? [] : listStr.split(",");
        return list;
    }
    function getMixiDiaryIndexOnStorage( mixiUserType, mixiUserID ) /*:CDiaryID[]*/ {
        return __JSON.parse( __localStorage.getItem( lsMixiDiaryDownloadedIndex( mixiUserType, mixiUserID ) ) || "[]" );
    }
    function putMixiDiaryOnStorage( /*CMixiDiary*/ diary ) {
        __console().trace();
        // __console().log( diary );
        // var diaryID = diaryObjToDiaryID( diary );
        var diaryID = diary.diaryID;
        if ( diaryID == null ) {
            __console().trace(); __console().error(diary);
            throw new Error( "the diaryID is null" );
        }
        // var mixiUserID = diary.owner_id;
        var o = parseDiaryID( diary.diaryID );
        var list /*CDiaryID*/ = getMixiDiaryIndexOnStorage( o.mixiUserType , o.mixiUserID );

        var found = false;
        for ( var i=0; i<list.length; i++ ) {
            if ( list[i]  == diaryID ) {
                found = true;
                break;
            }
        }
        if ( found ) {
            __console().log( "found an old diary. overwrite on it. id :" + diaryID );
        } else {
            __console().log( "new diary was saved. id :" + diaryID );
            list.push( diaryID );
        }
        // __localStorage.setItem( LS_MIXI_DIARY_DOWNLOADED_INDEX.replace( MIXI_USER_ID, o.mixiUserID ), __JSON.stringify( list ) );
        __localStorage.setItem( lsMixiDiaryDownloadedIndex( o.mixiUserType, o.mixiUserID ), __JSON.stringify( list ) );
        // __localStorage.setItem( LS_MIXI_DIARY_DOWNLOADED_ITEMS +diaryID, __JSON.stringify( diary ) );
        __localStorage.setItem( lsMixiDiaryDownloadedItems( diaryID ), __JSON.stringify( diary ) );
    }
    /* TODO */
    function removeMixiDiaryOnStorage( /*CMixiDiary*/ diary ) {
    }
    
    function diaryHeaderListToDiaryIDList( diaryHeaderList ) {
        var result = [];
        for ( var i=0; i<diaryHeaderList.length; i++ ) {
            var diaryID  = diaryHeaderList[i].diaryID;
            if ( diaryID == undefined ) {
                throw new Error( "diaryHeaderListToDiaryIDList malformed parameter : " + __JSON.stringify( diaryHeaderList ) );
            }
            result.push( diaryID );
        }
        return result;
    }
    function getMixiDiaryFromStorage( diaryID ) {
        var result = getMixiDiaryFromStorageMulti( diaryID )[ diaryID ];
        return  result;
    }
    function getMixiDiaryFromStorageMulti( diaryIDList ) /*CMixiDiary[]*/ {
        diaryIDList = [].concat( diaryIDList );
        // __console().trace();
        // __console().log( "getMixiDiaryFromStorageMulti", "diaryIDList=",diaryIDList );
        var result = {};
        for ( var i=0; i<diaryIDList.length; i++ ) {
            // var diaryData = __localStorage.getItem( LS_MIXI_DIARY_DOWNLOADED_ITEMS + diaryIDList[i] );
            var diaryData = __localStorage.getItem( lsMixiDiaryDownloadedItems( diaryIDList[i] )  );
            
            if ( diaryData == null ) {
                // __console().trace();
                // __console().error( "diaryData is null" , "id", LS_MIXI_DIARY_DOWNLOADED_ITEMS , diaryIDList[i] );
                // __console().error( "diaryData is null" , "id", lsMixiDiaryDownloadedItems( diaryIDList[i] ) );
                result[ diaryIDList[i] ] = null;
                continue;
            }

            // *** HARD CODING *** modifying old data to adopt it as new format
            var obj = __JSON.parse( diaryData );
            // __console().log( "obj(after)", obj );
            if ( obj.url == undefined ) {
                obj.url = "http://mixi.jp/view_diary.pl?id="+ obj.id + "&owner_id=" + obj.owner_id + "&full=1";
            }
            if ( obj.diaryID == undefined ) {
                obj.diaryID = urlToDiaryID( obj.url );
            }
            // __console().log( "obj(before)", obj );

            result[ diaryIDList[i] ] = obj;
        }
        // __console().log( "getMixiDiaryFromStorageMulti end", "result=",result );
        return result;
    }

    // ltypeDef.push( 
    //     {
    //         CTYPE : [ "CMixiDiaryHeader" ],
    //         type  : 'CMixiUserType' ,
    //         title : 'string', // "diary's title",
    //         date  : 'string', // "diary's date in Japanese",
    //         url   : "url", // URL to the diary
    //         diaryID : urlToDiaryID( url ),
    //     },(...)
    // );
    function getMixiDiaryHeaderList( /*CMixiUserInfo*/ mixiUserInfo ) {
        __console().trace();
        __console().log( mixiUserInfo );
        __console().log( lsMixiDiaryIndex( mixiUserInfo.mixiUserType, mixiUserInfo.mixiUserID ) );
        var jsonString = __localStorage.getItem( lsMixiDiaryIndex( mixiUserInfo.mixiUserType, mixiUserInfo.mixiUserID ) ); 
        if ( jsonString == null ) {
            return null;
        }
        var diaryHeaderList = __JSON.parse( jsonString );
        // diaryHeaderList.sort( function(a,b) {
        //     // var aa = getMixiDiaryFromStorage( a.diaryID );
        //     // if ( aa != null ) {
        //     //     a = aa;
        //     // }
        //     // var bb = getMixiDiaryFromStorage( b.diaryID );
        //     // if ( bb != null ) {
        //     //     b = bb;
        //     // }
        //     var aa = a.timeCreated || a.timeModified;
        //     var bb = b.timeCreated || b.timeModified;
        //     return aa<bb ? -1 : bb<aa ? 1 : 0;
        // });
        return diaryHeaderList;
    }
    function setMixiDiaryHeaderList( /*CMixiUserInfo*/ mixiUserInfo, diaryHeaderList ) {
        // __console().log( __JSON.stringify( diaryHeaderList ) );
        __localStorage.setItem( lsMixiDiaryIndex( mixiUserInfo.mixiUserType, mixiUserInfo.mixiUserID ), __JSON.stringify( diaryHeaderList ) );
    }

    // function getMixiDiaryIndex( /*CMixiDiary*/ diary, diaryList ) {
    //     // __console().log( "getMixiDiaryIndex(diary)" );
    //     for ( var i=0; i<diaryList.length; i++ ) {
    //         var diaryListElement = diaryList[i]; 
    //         var diaryObject = urlToDiaryObj( diaryListElement.url );
    //         // __console().log( "getMixiDiaryIndex("+i+")" ) 
    //         // __console().log( diaryObject );
    //         if ( ( diaryObject.owner_id == diary.owner_id ) && ( diaryObject.id == diary.id ) ) {
    //             return i;
    //         }
    //     }
    //     return -1;
    // }

    function getMixiDiaryIndex( /*CMixiDiary*/ diary, diaryHeaderList ) {
        // __console().log( "getMixiDiaryIndex(diary)" );
        for ( var i=0; i<diaryHeaderList.length; i++ ) {
            if ( diary.diaryID == diaryHeaderList[i].diaryID ) {
                return i;
            }
        }
        return -1;
    }


    function getMixiListFriends( /*string*/ mixiUserID ) /* : CMixiUser&CMixiUserInfo[] */ {
        __console().log( "getMixiListFriends(): " + mixiUserID );
        var friendsStr = __localStorage.getItem( LS_MIXI_LIST_FRIEND + mixiUserID );
        if ( friendsStr == null ) {
            return null;
        } else {
            return __JSON.parse( friendsStr );
        }
    }
    function setMixiListFriends( /*string*/ mixiUserID, /* CMixiUser&CMixiUserInfo[] */ friends ) {
        __console().log( "setMixiListFriends(): " + mixiUserID );
        __localStorage.setItem( LS_MIXI_LIST_FRIEND + mixiUserID, __JSON.stringify( friends ) );
    }

    /*
     * ************ WORKING WITH MIXI DIARY **************************************************************************************
     */
    function createImageFilenameListener( diary ) {
        var o = parseDiaryID( diary.diaryID );
        return function ( imageIndex ){
            /* delete all non-numeric characters in the string */
            var sdate = ( getTimeCreated(diary) ).replace( /[^0-9]*/gm, "" ) ;
            // return "mixi-" + sdate + "-" + diary.owner_id + "-" + diary.id + "-" + String(imageIndex) + ".png";
            return "mixi-" + sdate + "-" + o.mixiUserID + "-" + o.mixiPostID + "-" + String(imageIndex) + ".png";
        };
    }

    function parseMonthDay( mixiDate ) {
        var publishedDate;
        if ( typeof mixiDate  == 'string' ) {
            publishedDate = mixiDateToDate( mixiDate );
        } else if ( typeof mixiDate  == 'object' ) {
            // treat as a Date object.
            publishedDate = mixiDate;
        } else {
            throw new Error('illegal argument exception ' + mixiDate );
        }
        var yearStr =  "" + publishedDate.getFullYear();
        var monthStr =  ( "0" + ( publishedDate.getMonth() + 1 ) ).slice( -2 );
        return yearStr + "/" + monthStr;
    }

    function createDiaryFullFilename( baseURL, diaryID, mixiDate, filenamePrefix, filenamePostfix ){
        return baseURL + parseMonthDay( mixiDate ) + "/" + createDiaryFilename( diaryID, mixiDate, filenamePrefix, filenamePostfix ) ;
    }
    function createDiaryFilename( diaryID, mixiDate, filenamePrefix, filenamePostfix ){
        var o = parseDiaryID( diaryID );
        var dateStr = mixiDate.replace( /[^0-9]/g, "" );
        return ( filenamePrefix+o.cid + o.oid + "-" + dateStr + filenamePostfix );
    }

    function createDiaryFilenameListener01( baseURL, filenamePrefix, filenamePostfix ) {
        return function( diaryHeader ) {
            // the date property of CDiaryHeaderObject objects contains the newest date of these post comments.
            var diary = getMixiDiaryFromStorage( diaryHeader.diaryID );
            return createDiaryFullFilename( baseURL, diary.diaryID, getTimeCreated( diary ), filenamePrefix, filenamePostfix );
        }
    }
    function createDiaryFilenameListener02( filenamePrefix, filenamePostfix ) {
        return function( diaryHeader ) {
            console.trace();
            console.log( diaryHeader );
            // the date property of CDiaryHeaderObject objects contains the newest date of these post comments.
            var diary = getMixiDiaryFromStorage( diaryHeader.diaryID );
            return createDiaryFilename( diary.diaryID, getTimeCreated( diary ) , filenamePrefix, filenamePostfix );
        }
    }



    // function diaryToFileName( diary ) {
    //     var o = parseDiaryID( diary.diaryID );
    //     var dateStr = diary.date.replace( /[^0-9]/g, "" );
    //     return 'post_'+o.cid + o.oid + "_" + dateStr;
    // }
    // function createDiaryFilename( diary ){
    //     return "diary-" + diary.date.replace(/[^0-9]/g, "" );
    //     // var sdate = diary.date.replace( /[^0-9]*/gm, "" ) ;
    //     // return "archive-" + sdate + "-" + diary.owner_id + "-" + diary.id;
    // }

    function fetchMixiDiaryHeader( /*CMixiUserInfo*/ mixiUserInfo, callback ){
        __console().trace();
        __console().log( mixiUserInfo );
        var typeString =mixiUserInfo.mixiUserType || 'mixiuser';
        if ( typeString == 'mixiuser' ) {
            fetchMixiDiaryHeader02( mixiUserInfo, callback );
        } else if ( typeString == 'mixicommunity' ) { 
            fetchMixiCommunityHeader( mixiUserInfo, callback );
        } else {
            __console().trace();
            __console().error( 'fetchMixiDiaryHeader unknown mixiUserType',  mixiUserInfo );
            throw 'fetchMixiDiaryHeader unknown mixiUserType' + __JSON.sgtringify( mixiUserInfo );
        }
    }

    // http://mixi.jp/view_bbs.pl?id=58739968&comm_id=987254&page=all
    function fetchMixiCommunityHeader( /* CMixiUserInfo*/ mixiUser, /* function ( boolean status, CMixiDiaryHeader[] headerList ) */ callback ) {
        progressEnter();
        __console().trace();
        var mixiUserID = mixiUser.mixiUserID;
        __console().log( 'mixiUserID', mixiUserID );
        var urlList = [];
        var headerList = [];
        var time;
        proc1(1);
        function proc1(pageNum) {
            progressValue(pageNum-1);
            var method = "GET";
            var url = "http://mixi.jp/list_bbs.pl?page="+pageNum+"&type=bbs&id="+mixiUserID;
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onreadystatechange = function(e) {
                if ( xhr.readyState ==4 ) {
                    __console().log( xhr.status );
                    if ( xhr.status != 200 ) {
                        progressLeave();
                        callback( false );
                        return;
                    }
                    var d = new DOMParser().parseFromString( xhr.responseText, "text/html" );
                    proc2( d, pageNum);
                }
            }
            xhr.send();
        }
        function proc2( d, pageNum ) {
            __console().trace();
            var es = d.getElementsByClassName( "bbsTitle" );
            __console().log( "lookup bbsTitel :",es );
            for ( var i=0; i<es.length; i++ ) {
                var e = es[i];
                var date = e.getElementsByClassName( "date" )[0].textContent;
                var href  = e.getElementsByClassName( "title" )[0].attributes.href.value;
                var title = e.getElementsByClassName( "title" )[0].textContent;

                // look up next 'bbsContent' element;
                var c = 50;
                for(;;) {
                    if ( c-- < 0 ) {
                        break;
                    }
                    e = e.nextSibling;
                    if ( e == null ) {
                        break;
                    } else if ( e.classList == undefined ) {
                        continue;
                    }
                    var found = false;
                    for ( var j=0; j<e.classList.length; j++ ) {
                        if ( e.classList[j] == 'bbsContent' ) {
                            found=true;
                            break;
                        }
                    }
                    if ( found ) {
                        break;
                    }
                }

                // look up <a> of show_friend.pl 
                var authorID = null;
                var authorName = null;
                var alist  = e.getElementsByTagName( "a" );
                for ( var j=0; j<alist.length; j++  ){
                    if ( 0<=alist[j].href.search( /show_friend\.pl/ ) ) {
                        authorID = searchToObject( alist[j].href ).id;
                        console.log( 'authorName', authorName );
                        authorName = alist[j].textContent;
                        if ( authorID == undefined ) {
                            __console().warn( "CANNOT find id from alist[j] ", alist[j].href );
                            authorID = null;
                        }
                        break;
                    }
                }

                headerList.push( {
                    CTYPE : ["CMixiDiaryHeader"],
                    timeCreated : null,
                    timeModified : date,
                    url : "http://mixi.jp/"+href+"&page=all",
                    title: title,
                    diaryID : urlToDiaryID( href ),
                    authorID : authorID,
                    authorName : authorName,
                });
            }
            if ( 0<es.length ) {
                proc4( pageNum +1 );
            } else {
                progressLeave();
                callback( true, headerList );
            }
        }
        var lastTime  = new Date().getTime();
        function proc4( nextPageNum ) {
            var now  = new Date().getTime();
            var t = MIXI_DOWNLOAD_THREASHOLD - ( now - lastTime );
            if ( t < 0 ) { t = 0 }
            setTimeout( function() { proc1(nextPageNum) }, t );
            lastTime  = new Date().getTime();
        }
    }

    // fetchMixiCommunityHeader( { mixiUserID: 987254 }, function( /*boolean*/ status,/*CMixiDiaryHeader[]*/ headerList ) {
    //     __console().log( status, headerList );    
    // }); 


    function fetchMixiDiaryHeader02( /* CMixiUserInfo*/ mixiUser, /* function ( boolean status, CMixiDiaryHeader[] headerList ) */ callback ) {
        progressEnter();
        __console().trace();
        var mixiUserID = mixiUser.mixiUserID;
        var mixiUserName = mixiUser.mixiUserName;
        var urlList = [];
        var headerList = [];
        __console().trace();
        __console().log( 'mixiUserID', mixiUserID );
        proc1();
        function proc1() {
            var method = "GET";
            var url = "http://mixi.jp/list_diary.pl?page=1&id="+mixiUserID;
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onreadystatechange = function(e) {
                if ( xhr.readyState ==4 ) {
                    __console().log( xhr.status );
                    // __console().log( xhr.responseText );
                    if ( xhr.status != 200 ) {
                        progressLeave();
                        callback( false );
                        return;
                    }
                    var d = new DOMParser().parseFromString( xhr.responseText, "text/html" );
                    proc2( d );
                }
            }
            xhr.send();
        }
        function proc2( d ) {
            var dh = d.getElementsByClassName( "diaryHistory" );
            var es= dh.length == 0 ? [] : dh.item(0).getElementsByTagName("a") ;
            for ( var i=0; i<es.length; i++ ) {
                var e = es[i];
                var href = e.attributes.href.value;
                if ( 0<=href.indexOf( "year" ) && 0<=href.indexOf( "month" ) ) {
                    urlList.push( "http://mixi.jp/" + e.attributes.href.value ); 
                }
            }
            progressMax( urlList.length );
            proc3(0,1);
        }
        function proc3(urlIdx,pageIdx) {
            progressValue(urlIdx);
            if ( urlIdx <urlList.length ) {
            } else {
                __console().trace();
                __console().log( "headerList", headerList );
                progressLeave();
                callback( true , headerList );
                return;
            }
            var method = "GET";
            var url = urlList[urlIdx]+"&page="+pageIdx;
            // __console().log( "url:" + url, "urlList",urlList, "urlIdx",urlIdx , "urlList[urlIdx]",urlList[urlIdx]);
            __console().log( "url:" + url, "urlList.length",urlList.length, "urlIdx",urlIdx );
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onreadystatechange = function(e) {
                if ( xhr.readyState ==4 ) {
                    __console().log( "HTTPStatus:" + xhr.status );
                    if ( xhr.status != 200 ) {
                        progressLeave();
                        callback( false );
                        return;
                    }
                    // __console().log( xhr.responseText );
                    var d = new DOMParser().parseFromString( xhr.responseText, "text/html" );
                    var es = d.getElementsByClassName( "listDiaryTitle" );
                    __console().log( es.length );
                    for ( var i=0; i<es.length; i++ ) {
                        var e = es[i];
                        var a = e.getElementsByTagName("a")[0];
                        var title = a.textContent;
                        var href = "http://mixi.jp/" + a.attributes.href.value + "&full=1"; // 2013/3/22
                        var dd = e.getElementsByTagName("dd")[0];
                        var date = dd.textContent.replace( /\s/," " );
                        headerList.push( {
                            CTYPE : ["CMixiDiaryHeader"],
                            timeCreated : date,
                            timeModified : null,
                            url : href,
                            title: title,
                            diaryID : urlToDiaryID( href ),
                            authorID : mixiUserID,
                            authorName : mixiUserName,
                        });
                    }
                    // ************* BE CAREFUL *******************
                    if ( ( MIXI_DIARY_INDEX_ENTRY_PER_PAGE == 0 && es.length == 0 ) || ( es.length < MIXI_DIARY_INDEX_ENTRY_PER_PAGE ) ) {
                    // if ( es.length == 0 ) 
                    // if ( es.length < 30)  // ************* BE CAREFUL *******************
                        urlIdx=urlIdx+1;
                        proc4( urlIdx, 1 );
                    } else {
                        proc4( urlIdx, pageIdx +1 );
                    }
                }
            }
            var lastTime  = new Date().getTime();
            function proc4( urlIdx, pageIdx ) {
                var now  = new Date().getTime();
                var t = MIXI_DOWNLOAD_THREASHOLD - ( now - lastTime );
                if ( t < 0 ) { t = 0 }
                setTimeout( function() { proc3(urlIdx,pageIdx) }, t );
                lastTime  = new Date().getTime();
            }
            xhr.send();
        }
    }

    // fetchMixiDiaryHeader02( "7114594", function(status,headerList) {
    //     __console().log( headerList );
    // });

    /*
        mixi日記の一覧をダウンロードする。
    */
    function fetchMixiDiaryHeader01( baseWin, mixiUserID, /* function ( boolean status, CMixiDiaryHeader[] result ) */ callback ) {
        var diaryHeaderList = [];
        var cancelled = false;
        loadProc( 0 );
        return {
            cancel : function () {
                cancelled = true;
                __console().log( "fetching mixi diary list was cancelled." );
            },
        };
        function readProc( baseDoc, arrayOffset ) {
            var es = baseDoc.getElementsByClassName( "listDiaryTitle" );
            for ( var i=0; i<es.length;i++ ) {
                var e = es.item(i);
                var date = e.getElementsByTagName( "dd" ).item(0).textContent;
                var url  = e.getElementsByTagName( "a" ).item(0).href + "&full=1";
                var title = e.getElementsByTagName( "a" ).item(0).textContent;
                __console().log( date + " / " + title + " / " + url );
                diaryHeaderList[ arrayOffset + i ] = {
                    CTYPE : [ "CMixiDiaryHeader" ],
                    timeCreated : date,
                    timeModified : null,
                    url:url,
                    title:title,
                    diaryID : urlToDiaryID( url ),
                };
            }
            return es.length;
        }
        function loadProc( index ) {
            var w = baseWin.open("");
            w.addEventListener( 'load', function() {
                __console().log( "load" );
                var count = readProc( w.document, index * 30 );
                if ( cancelled ) {
                    callback( false, diaryHeaderList );
                    setTimeout( function() {w.close()}, 100 );
                } else if ( count == 0 ) {
                    callback( true, diaryHeaderList );
                    setTimeout( function() {w.close()}, 100 );
                } else {
                    loadProc( index + 1 );
                    setTimeout( function() {w.close()}, 100 );
                }
            });
            setTimeout( function () {
                w.location = "http://mixi.jp/list_diary.pl?page="+(index+1);
            },500 );
        }
    }

    function updateMixiDiaryList(fid) {
        // target select elment
        var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );

        //var mixiUser = getSelectedMixiUser();
        var mixiUser = getSelectedMixiBBS();

        __console().trace();
        __console().log( 'fid', fid, 'mixiUser', mixiUser );

        if ( mixiUser == null ) {
            __console().trace();
            __console().warn( "no bbs is selected. abort." );
            // remove all child elements
            while ( sel.firstChild ){
                sel.removeChild(sel.firstChild);
            }
            return;
        }


        // a function to update the current selection.
        function updateProc(url) {
            for ( var i=0; i<sel.options.length; i++ ) {
                if ( __JSON.parse( sel.options[i].value ).url == url  ) {
                    sel.selectedIndex = i;
                    break;
                }
            }
        }

        // 'selected' is special process. it does not update the list but remove every unselected options.
        if ( fid == 'selected' ) {
            for ( var i=sel.options.length-1; 0<=i; i-- ) {
                if ( ! sel.options[i].selected ) {
                    sel.remove(i);
                }
            }
            updateProc();
            return ;
        }

        // remove all child elements
        while ( sel.firstChild ){
            sel.removeChild(sel.firstChild);
        }

        // get __JSON
        var diaryHeaderList /*:CMixiDiaryHeader[]*/ = getMixiDiaryHeaderList( mixiUser );
        if ( diaryHeaderList == null ) {
            __console().warn( "no data" );
            return;
        }
        // Store total count of all headers.
        var totalCount = diaryHeaderList.length;

        // this is not necessary any more.
        // var calcDiaryID = function(){
        //     // calculate diary id of all diary URLs and temporarily store them on the side of their URLs;
        //     for ( var i=0; i<diaryHeaderList.length; i++ ) {
        //         // diaryHeaderList[i] .__diaryID = diaryObjToDiaryID( urlToDiaryObj( diaryHeaderList[i].url ) );
        //         diaryHeaderList[i] .__diaryID = urlToDiaryID( diaryHeaderList[i].url );
        //     }
        // };

        // delete unnecessary elements to implement diary list's filter function.
        if ( fid == 'all' ) {
            // do nothing.
        } else if ( fid == 'yet' ) {
            // calcDiaryID();
            var list = getMixiDiaryIndexOnStorage( mixiUser.mixiUserType, mixiUser.mixiUserID );
            __console().log( "diaryHeaderList",diaryHeaderList, "list",list );

            // loop in order to knock out all found diaryID
            for ( var i=diaryHeaderList.length-1; 0<=i; i-- ) {
                var found = false;
                for ( var j=0; j<list.length; j++ ) {
                    if ( diaryHeaderList[i].diaryID == list[j] ) {
                        found = true;
                    }
                }
                if ( found ) {
                    diaryHeaderList.splice(i,1);
                }
            }
        } else if ( fid == 'ready' ) {
            // calcDiaryID();
            var downloadedDiaryIndex = getMixiDiaryIndexOnStorage( mixiUser.mixiUserType, mixiUser.mixiUserID );

            // log
            // __console().log( "diaryHeaderList",diaryHeaderList, "downloadedDiaryIndex",downloadedDiaryIndex );

            // loop in order to delete all inexistent diaryID.
            for ( var i=diaryHeaderList.length-1; 0<=i; i-- ) {
                var found = false;
                for ( var j=0; j<downloadedDiaryIndex.length; j++ ) {
                    // __console().log( 'diaryHeaderList[i]',diaryHeaderList[i], 'downloadedDiaryIndex[j]',downloadedDiaryIndex[j] );
                    if ( diaryHeaderList[i].diaryID == downloadedDiaryIndex[j] ) {
                        found=true;
                        break;
                    }
                }
                if ( ! found ) {
                    diaryHeaderList.splice(i,1);
                }
            }

        } else {
            __console().trace();
            __console().error( "illegal id (fid=", fid, ")" );
            throw new Error( "aa" );
        }

        for ( var i=0; i<diaryHeaderList.length; i++ ) {
            var op= controlPanel.document.createElement( "option" );
            op.text = ( getTimeCreated( diaryHeaderList[i] ) ) + " " + diaryHeaderList[i].title;
            op.value = __JSON.stringify( diaryHeaderList[i] );
            sel.appendChild( op );
        }

        // var statusBox = controlPanel.document.getElementById( "mixiDiaryIDListStatus" );
        // statusBox.value = "日記数:全" + totalCount + "件中 / " +diaryHeaderList.length +  "件" ;
        updateCountStatuxBox( totalCount, diaryHeaderList.length );

        //
        updateProc();
    }

    var __totalCount=null;
    var __count=null;
    var __selectionCount=null;
    function updateCountStatuxBox( totalCount, count, selectionCount ) {
        if ( totalCount == undefined ) { 
            totalCount = __totalCount;
        } else {
            __totalCount = totalCount;
        }
        if ( count == undefined ) { 
            count = __count;
        } else {
            __count = count ;
        }
        if ( selectionCount == undefined ) { 
            selectionCount = 0;
        } else {
            __selectionCount = selectionCount;
        }
        var statusBox = controlPanel.document.getElementById( "mixiDiaryIDListStatus" );
        statusBox.value = "日記数:全" + totalCount + "件中 / 表示" + count +  "件 / 選択" + selectionCount + "件" ;
    }

    function fetchBBS( bbsID, callback ) {
        var result =[];
        proc1(1);
        function proc1(pidx) {
            var method = "GET";
            var url = "http://mixi.jp/list_bbs.pl?page="+pidx+"&type=bbs&id="+bbsID;
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onreadystatechange = function(e) {
                if ( xhr.readyState ==4 ) {
                    __console().log( xhr.status );
                    if ( xhr.status == 200 ) {
                        var d = new DOMParser().parseFromString( xhr.responseText, "text/html" );
                        var titles = getBBSTitle( d );
                        if ( 0<titles.length ){
                            result = result.concat( titles );
                            proc1(pidx+1);
                        } else {
                            callback( true, result );
                        }
                    } else {
                        callback( false, result );
                    }
                } 
            }
            xhr.send();
        }
        function getBBSTitle( d ) {
            var result = [];
            var bbsTitles= d.getElementsByClassName( "bbsTitle" );
            for ( var i=0; i<bbsjTitles.length; i++ ) {
                var bbsTitle = bbsTitles[i];
                var a = bbsTitle.getElementsByClassName( "title" )[0];
                var title = a.text;
                var url = a.href;
                var date = bbsTitle.getElementsByClassName( "date" )[0].textContent;
                result.push( {
                    title : title,
                    url : url,
                    date : date,
                });
            }
            return result ;
        }
    }
    // (function() {
    //     fetchBBS( 987254, function( status, result ) {
    //         __console().log( result );
    //     });
    // })();




    



    // fetchMixiDiaryHeader01( window, function( diaryHeaderList, status ) {
    //     __console().log( __JSON.stringify( diaryList ) )
    // });

    // mixi日記から日記本文を抽出する。
    function extractMixiDiaryText( d ) {
        __console().log( "extractMixiDiaryText" );
        return d.getElementById( "diary_body" ).textContent;
    }
    // __console().log( extractMixiDiaryText(document) );
    
    // mixi日記から画像を抽出する。
    // function extractMixiDiaryImages( d, imageFilenameListener, ondone ){
    //     __console().log( "extractMixiDiaryImages" );
    //     var lst /*:string[]*/ = [];
    //
    //     var diaryPhotoElement = d.getElementsByClassName( "diaryPhoto" );
    //     if ( diaryPhotoElement.length == 0 ) {
    //         setTimeout( function(){ondone([])},1 );
    //         return;
    //     }
    //     var a = diaryPhotoElement.item(0).getElementsByTagName( "a" );
    //
    //     for ( var i=0; i<a.length; i++ ) {
    //         if ( a.item(i).attributes.onclick.nodeValue.search( new RegExp("'([^']*)'","g") ) ) {
    //             lst.push( RegExp.$1 );
    //         } else {
    //             __console().log( "could not get img src value from javascript." );
    //             __console().log( a.item(i) );
    //         }
    //     }
    //     _extractMixiDiaryImages( lst, imageFilenameListener, ondone );
    // }
    function extractMixiDiaryImages( d, imageFilenameListener, ondone ){
        __console().log( "extractMixiDiaryImages" );
        var a = [];
        try {
            var a = d.getElementsByClassName( "diaryPhoto" )[0].getElementsByTagName( "a" );
        } catch ( e ) {
            __console().warn( "ignored a safe error : ", e );
        }

        var lst /*:string[]*/ = [];
        for ( var i=0; i<a.length; i++ ) {
            if ( a.item(i).attributes.onclick.nodeValue.search( new RegExp("'([^']*)'","g") ) ) {
                lst.push( "http://mixi.jp/"+RegExp.$1 );
            } else {
                __console().log( "could not get img src value from javascript." );
                __console().log( a.item(i) );
            }
        }

        _extractMixiDiaryImages( lst, imageFilenameListener, ondone );
    }

    /*
    * CImageData
    *  { LTYPE:["CImageData"], src : img.src, data: null, filename : imageFilenameListener(i), uploaded:null  };
    *
    */

    function _extractMixiDiaryImages( /*string[]*/lst, imageFilenameListener, /* function( CImageData[] ) */ ondone ){
        __console().trace();
        __console().log( lst );
        var result = new Array( lst.length );
        var errorOccured = null;
        var done = false;

        progressEnter( lst.length );

        loadProc1(0);

        // if ( 0<lst.length ) {
        //     for ( var i=0; i<lst.length; i++ ) {
        //         loadProc1( i, lst[i] );
        //     }
        // } else {
        //     setTimeout( function(){ondone([])},1000 );
        // }

        // function chk(){
        //     if ( errorOccured != null ) {
        //         ondone( [], errorOccured );
        //         return;
        //     }
        //     __console().trace();
        //     __console().info( "result", result );
        //     for ( var i=0; i<result.length; i++ ) {
        //         if ( result[i] == null ) {
        //             return false;
        //         }
        //         // if ( result[i].uploaded == null ) {
        //         //     return false;
        //         // }
        //         if ( result[i].imageDataURI == null ) {
        //             return false;
        //         }
        //     }
        //     if ( ! done ) {
        //         done = true;
        //         ondone(result);
        //     }
        // };

        function loadProc1( idx ){
            progressValue( idx );
            if ( idx<result.length ) {
                // var src = "http://mixi.jp/" + filename;
                var src = lst[idx];
                /* this xhr must be a shared var. */
                var xhr = new XMLHttpRequest();
                xhr.open( "GET", src , true );
                __console().log( "loadProc1(" , idx , src , ")" );
                xhr.addEventListener( "readystatechange",  loadProc02, false );
                try {
                    xhr.send();
                } catch ( e ) {
                    __console().trace();
                    __console().error( "erro occured", "src=",src,"error", e );
                    progressLeave();
                    throw e;
                }
            } else {
                setTimeout( function() {
                    progressLeave();
                    ondone(result);
                },10 );
            }
            // fetch picture's pop-up windows
            function loadProc02() {
                if ( xhr.readyState == 4 ) { if ( xhr.status == 200 ) { foundProc() } else { errorProc() } }
                function errorProc() {
                    __console().trace();
                    __console().error( "loadProc2.errorProc", "status",xhr.status,"src=",src );
                    progressLeave();
                    throw new Error( xhr.responseText );
                }
                function foundProc() {
                    __console().log( "loadProc2.foundProc ",src );
                    var d = new DOMParser().parseFromString( xhr.responseText, "text/html" );
                    var imgs =d.getElementsByTagName("img" );
                    // __console().log( src, xhr.responseText );
                    __console().log(  "imgs", src , imgs );
                    var img=null;
                    // look up the main image file:
                    for ( var i=0;i<imgs.length; i++ ) {
                        __console().log( "loadProc2.foundProc.trace", imgs[i].src );
                        if ( 0< String(imgs[i].src).indexOf( "ic.mixi.jp" ) ) {
                            img = imgs[i];
                        }
                    }
                    __console().trace();
                    __console().log( "loadProc02.foundProc",img );

                    // var base64 = toDataURL( w.document, img )
                    var image = { LTYPE:["CImageData"], src : img.src, imageDataURI: null, filename : imageFilenameListener(idx), uploaded:null,uploadedImages:null };
                    result[idx] = image; 

                    __console().log( "loadProc2.foundProc image.src" , image.src );
                    // fetch images
                    /* var CAUTION ... see above */ 
                    var xhr2 = new XMLHttpRequest();
                    xhr2.open( "GET", image.src, true );
                    xhr2.responseType = "blob";
                    xhr2.addEventListener( "readystatechange", loadProc03, false );
                    xhr2.send();
                    function loadProc03() {
                        if ( xhr2.readyState == 4 ) { if ( xhr2.status == 200 ) { foundProc3() } else { errorProc3() } }
                        function errorProc3() {
                            __console().trace();
                            __console().error( "loadProc3.errorProc3" , xhr2.responseText );
                            throw new Error( xhr2.responseText );
                        }
                        function foundProc3() {
                            __console().log( "loadProc3.foundProc3" );
                            __console().log( xhr2.readyState + " / " + xhr2.status );
                            var r = new FileReader();
                            r.addEventListener( 'load', loadProc04, false );
                            r.readAsDataURL( xhr2.response );
                            function loadProc04(e) {
                                __console().log( "loadProc4" );
                                image.imageDataURI = ( e.target.result );
                                // __console().log( "src:" , image.src , "="  , { imageDataURI: image.imageDataURI } );

                                if ( __DONT_UPLOAD_IMAGES_TO_PICASA ) {
                                    __console().trace();
                                    setTimeout( loadProc03_2, 10 );
                                } else {
                                    __console().trace();
                                    uploadPicasaImage( xhr2.response, getSelectedPicasaAlbum(), image.filename, loadProc05 );
                                }
                                function loadProc03_2() {
                                    __console().trace();
                                    // w.close();
                                    // chk();
                                    loadProc1( idx+1 );
                                }
                                function loadProc05( succeeded, msg, uploadedImages ) {
                                    __console().log( "loadProc5" );
                                    if ( succeeded ) {
                                        image.uploaded = "ok";
                                        image.uploadedImages = uploadedImages;
                                    } else {
                                        image.uploaded = "err";
                                        __console().trace();
                                        __console().error( msg );
                                    }
                                    loadProc1( idx+1 );
                                    // chk();
                                }
                            }                   
                        }
                    }
                }
            } 
        };
    };
    // extractMixiDiaryImages( document, function(i,base64){return ""+i}, function(result){__console().dir(result)});
    
    // コメントを抽出する。
    function extractMixiDiaryComments( d,callback ) {
        __console().log( "extractMixiDiaryComments" );
        var result =[];
        var comments = d.getElementsByClassName( "commentRow" );
        if ( comments.length == 0 ) {
            callback( result );
            return;
        }
        var result = new Array( comments.length );
        function chk() {
            for ( var i=0; i<result.length; i++ ) {
                if ( result[i].iconData == null ) {
                    return;
                }
            }
            callback( result );
        }
        for ( var i=0; i<comments.length; i++ ) {
            var comment  = comments.item(i);
            result[ i ] = {
                commentNo : i+1,
                date     : ( comment.getElementsByClassName( "date" ).item(0).textContent ),
                userName : ( comment.getElementsByTagName( "a" ).item(1).textContent ),
                userURL  : ( comment.getElementsByTagName( "a" ).item(1).href ),
                text     : ( comment.getElementsByTagName( "dd" ).item(0).textContent ),
                iconURL  : ( comment.getElementsByTagName( "img" ).item(0).src ),
                iconData : null,
                images   : [],
                // iconData : ( toDataURL( d, comment.getElementsByTagName( "img" ).item(0) ) ),
            };
            fetch( i );
        }
        function fetch( i ) {
            __console().log( "extractMixiDiaryComments.fetch" );
            fetchImage( result[i].iconURL, callback1 );
            function callback1(blob) {
                __console().log( "extractMixiDiaryComments.fetch.fetchImage.callback1" );
                blobToDataURL( blob, callback2 );
                function callback2( url ) {
                    __console().log( "extractMixiDiaryComments.fetch.fetchImage.callback1.callback2" );
                    if ( url == null ) {
                        __console().trace();
                        __console().error( "could not fetch icon image" );
                        result[i].iconData = "ERROR";
                        // openNew( url );
                        chk();
                    } else {
                        result[i].iconData = url;
                        // openNew( url );
                        chk();
                    }
                }
            }
        }

        return result;
    }
    // __console().log( extractMixiDiaryComments(document) );
    
    // 次の日記へのリンクを取る。
    function extractMixiDiaryDirection(d){
        __console().log( "extractMixiDiaryDirection" );
        var result = {};
        var a = d.getElementsByClassName( "diaryPagingRight" ).item(0).getElementsByTagName( "a" );
        for ( var i=0; i<a.length; i++ ) {
            var o={};
            (a.item(i).href+"").replace( /([a-zA-Z0-9_]+)=([a-zA-Z0-9_]+)/mg, function(s,s1,s2) {
                o[s1] = s2;
            } );
            result[ o.direction ] = a.item(i).href+"";
        }
        return result;
    }
    // __console().log( extractMixiDiaryDirection(document) );

    function extractMixiDiaryDate(d) {
        __console().log( "extractMixiDiaryDate" );
        var div1= d.getElementsByClassName( "listDiaryTitle" ).item(0);
        return div1.getElementsByTagName( 'dd' ).item(0).textContent;
    };
    // __console().log( extractMixiDiaryDate(document) );
    
    function extractMixiDiaryTitle(d) {
        __console().log( "extractMixiDiaryTitle" );
        return d.title.replace( "[mixi]","" ).trim();
    };
    // __console().log( extractMixiDiaryTitle(document) );

    function extractMixiDiary(/*CMixiDiaryHeader*/ diaryHeader,/*Document*/ d, /* (function( CMixiDiary )) */ ondone ) {
        __console().log( "extractMixiDiary" );
        var diary = {
            CTYPE : [ "CMixiDiary" ],
            url : diaryHeader.url,
            diaryID : diaryHeader.diaryID,
            timeCreated : extractMixiDiaryDate(d),
            timeModified : null,
            title : extractMixiDiaryTitle(d),
            authorID : diaryHeader.authorID,
            authorName : diaryHeader.authorName,

            owner_id: diaryHeader.owner_id,
            id : diaryHeader.id,
            direction:extractMixiDiaryDirection(d),
            text : extractMixiDiaryText(d),
            images : null,
            comments : null,
        };
        progressEnter(2);
        extractMixiDiaryComments(d,callbackComments);
        function callbackComments( comments ) {
            diary.comments = comments;
            if ( diary.comments.length != 0 ) {
                var lastComments = diary.comments[ diary.comments.length -1 ];
                diary.timeModified = lastComments.date;
            } else {
                diary.timeModified = diary.timeCreated;
            }

            progressValue(1);
            extractMixiDiaryImages(d, createImageFilenameListener( diary ), diaryImageCallback );
            function diaryImageCallback( images ) {
                diary.images = images;
                /* for ( var i=0;i<images.length; i++ ) {
                    openNew( "http://www.musiic.net/picasa/upload.php5?firefoxplugin=1&img_url=" + encodeURIComponent( images[i] )  );
                }
                img_cap=&img_tags=&album=
                */
                progressLeave();
                if ( ondone!=undefined ) {
                    ondone( diary );
                }
            }
        }
    }

    function extractMixiImageSrcFromListA( a ) /*:string[]*/ {
        var lst /*:string[]*/ = [];
        for ( var i=0; i<a.length; i++ ) {
            var img = extractMixiImageSrcFromMM( a.item(i) );
            if ( img != null ) {
                lst.push( "http://mixi.jp/" +img );
            } else {
                __console().warn( "could not get img src value from javascript. ignored.",  a.item(i) );
            }
        }
        return lst;
    }
    function extractMixiImageSrcFromMM( a ) {
        try {
            var s = a.attributes.onclick.nodeValue;
            __console().log( "a.attributes.onclick.nodeValue",s );
            if ( s.search( new RegExp("'([^']*)'","g") ) ) {
                return RegExp.$1;
            } else {
                return null;
            }
        } catch ( e ) {
            __console().trace();
            __console().warn( "error occured.ignored.","error=",e, "a=",a );
            return null;
        }
    }

    /* COMMUNITY BEGIN*/

    function extractMixiCommunityPostDate(d) {
        __console().log( "extractMixiCommunityPostDate" );
        return d.getElementsByClassName( "bbsTitle" )[0].getElementsByClassName( "date" )[0].textContent;
    }
    function extractMixiCommunityPostTitle(d) {
        __console().log( "extractMixiCommunityPostTitle" );
        return d.getElementsByClassName( "bbsTitle" )[0].getElementsByClassName( "title" )[0].textContent;
    }
    function extractMixiCommunityPostText( d ) {
        __console().log( "extractMixiCommunityPostText" );
        return d.getElementsByClassName( "bbsContent" )[0].getElementsByTagName("dd")[0].textContent;
    }
    
    function extractMixiCommunityPostImages( d, imageFilenameListener, ondone ){
        __console().log( "extractMixiCommunityPostImages" );
        var a = [];
        try {
            var a = d.getElementsByClassName( "communityPhoto" )[0].getElementsByTagName( "a" );
        } catch ( e ) {
            __console().warn( "ignored a safe error : ", e );
        }
        var lst = extractMixiImageSrcFromListA( a );
        __console().trace();
        __console().log( lst );
        _extractMixiDiaryImages( lst, imageFilenameListener, ondone );
    }

    
    function extractMixiCommunityPostComments( diary, d, callback ) {
        __console().log( "extractMixiCommunityPostComments" );
        var result =[];
        var commentList = d.getElementsByClassName( "commentList01" );
        if ( commentList.length == 0 ) {
            callback( result );
            return;
        }
        var comments = commentList[0].getElementsByClassName("commentDate");
        if ( comments.length == 0 ) {
            callback( result );
            return;
        }
        var result = new Array( comments.length );

        var done = false;
        s(0);
        function s( i ) {
            __console().trace();
            __console().log( "extractMixiCommunityPostComments.s(i)", "i=", i, "comments.length=", comments.length );
            if ( i < comments.length ) {
                var comment  = comments.item(i);
                var comment2=comment;
                while( comment2.tagName != 'DD' ) {
                    comment2 = comment2.nextSibling;
                }
                // comment2.getElementsByClassName( "communityPhoto" )[0].getElementsByTagName("a").length;
                //
                var h = comment2.getElementsByTagName( "a" ).item(0).href
                var userURL = h.substring( 0, h.indexOf("?") ) + objectToSearch( { id: searchToObject( h ).id } )

                result[ i ] = {
                    commentNo: Number( comment.getElementsByClassName("senderId")[0].textContent.trim().replace(/[^0-9]*/g,'') ),
                    date     : ( comment.getElementsByClassName("date")[0].textContent.trim() ),
                    userName : ( comment2.getElementsByTagName( "a" ).item(0).textContent.trim() ),
                    userURL  : ( userURL ),
                    text     : ( comment2.getElementsByTagName( "dd" ).item(0).textContent.trim().replace(/返信$/g,'' ).trim() ),
                    iconURL  : null,
                    iconData : null,
                    images   : null,
                };

                var imgs= comment2.getElementsByTagName( "dd" ).item(0).getElementsByTagName( "a" );
                var lst = extractMixiImageSrcFromListA( imgs );
                // __console().trace();
                // for ( var j=0; j<imgs.length; j++ ) {
                //     __console().log( imgs[j].src );
                //     lst.push( imgs[j].src );
                // }
                (function( obj ) {
                    _extractMixiDiaryImages( lst, createImageFilenameListener( diary ), ondone );
                    function ondone(images) {
                        obj.images = images;
                        setTimeout( function() {
                            s(i+1);
                        },0 );
                    }
                })(result[i]);
                // fetch( i );
            } else if ( i == comments.length ) {
                if ( ! done )  {
                    done = true;
                    __console().trace();
                    __console().log( "extractMixiCommunityPostComments.done" );
                    callback( result );
                } else {
                    __console().trace();
                    __console().warn( "duplicate call of callback procedure" );
                }
            }
        }

        // *** this function is currently not used any more ***
        function fetch( i ) {
            __console().log( "extractMixiDiaryComments.fetch" );
            if ( result[i].iconURL == null ) {
            }
            fetchImage( result[i].iconURL, callback1 );
            function callback1(blob) {
                __console().log( "extractMixiDiaryComments.fetch.fetchImage.callback1" );
                blobToDataURL( blob, callback2 );
                function callback2( url ) {
                    __console().log( "extractMixiDiaryComments.fetch.fetchImage.callback1.callback2" );
                    if ( url == null ) {
                        __console().trace();
                        __console().error( "could not fetch icon image" );
                        result[i].iconData = "ERROR";
                        // openNew( url );
                        chk();
                    } else {
                        result[i].iconData = url;
                        // openNew( url );
                        chk();
                    }
                }
            }
        }

        return result;
    }

    function extractMixiCommunity(/*CMixiDiaryHeader*/ diaryHeader,/*Document*/ d, /* (function( CMixiDiary )) */ ondone ) {
        __console().log( "extractMixiCommunity" );
        var diary = {
            CTYPE : [ "CMixiDiary" ],
            url : diaryHeader.url,
            diaryID : diaryHeader.diaryID,
            timeCreated : extractMixiCommunityPostDate(d),
            timeModified : null,
            title : extractMixiCommunityPostTitle(d).trim(),
            authorID : diaryHeader.authorID,
            authorName : diaryHeader.authorName,

            // direction:extractMixiDiaryDirection(d),
            text : extractMixiCommunityPostText(d).trim(),
            images : null,
            comments : null,
        };
        extractMixiCommunityPostComments( diary, d, callbackComments );

        function callbackComments( comments ) {
            diary.comments = comments;
            if ( 0 < diary.comments.length ) {
                diary.timeModified = diary.comments[ diary.comments.length -1 ].date;
            } else {
                diary.timeModified = diary.timeCreated;
            }
            // ondone( diary );

            extractMixiCommunityPostImages(d, createImageFilenameListener( diary ), diaryImageCallback );
            function diaryImageCallback( images ) {
                __console().trace();
                diary.images = images;
                if ( ondone!=undefined ) {
                    ondone( diary );
                }
            }
        }
    }


    /* COMMUNITY END */




    function fetchMixiDiary( /*CMixiDiaryHeader*/ diaryHeader, /* (function( CMixiDiary )) */ callback ) {
        __console().log( "fetchMixiDiary" );
        __console().log( diaryHeader );
        var o = parseDiaryID( diaryHeader.diaryID );
        if ( o.mixiUserType == 'mixiuser' ) {
        } else if ( o.mixiUserType == 'mixicommunity' ) {
        } else {
            __console().trace();
            __console().error( 'Illegal Argument Exception : diaryHeader=', diaryHeader );
            throw new Error( 'Illegal Argument Exception : diaryHeader=' + __JSON.stringify( diaryHeader ) );
        }

        var xhr= new XMLHttpRequest();
        xhr.open( "GET", diaryHeader.url, true );
        xhr.addEventListener( "readystatechange", proc1, false );
        xhr.send();
        function proc1() {
            if ( xhr.readyState == 4 ) { if ( xhr.status == 200 ) { foundProc() } else { errorProc() } }
            function errorProc() { __console().trace(); __console().error( xhr.responseText ); throw new Error( xhr.responseText ) }
            function foundProc() {
                var d = new DOMParser().parseFromString( xhr.responseText , "text/html" );
                if ( o.mixiUserType == 'mixiuser' ) {
                    extractMixiDiary( diaryHeader, d, proc2 );
                } else if ( o.mixiUserType == 'mixicommunity' ) {
                    extractMixiCommunity( diaryHeader, d, proc2 );
                } else {
                    __console().trace();
                    __console().error( 'Illegal Argument Exception : diaryHeader=', diaryHeader );
                    throw new Error( 'Illegal Argument Exception : diaryHeader=' + __JSON.stringify( diaryHeader ) );
                }
                function proc2( diary ){
                    if ( callback!=undefined ) {
                        callback( diary );
                    }
                }
            }
        } 
    }
    
    // function fetchMixiDiary( /*TODO*/ diaryObj, /* (function( CMixiDiary )) */ callback ) {
    //     __console().log( "fetchMixiDiary" );
    //     __console().log( diaryObj );
    //
    //     var xhr;
    //     xhr = new XMLHttpRequest();
    //     xhr.open( "GET", "http://mixi.jp/view_diary.pl" + objectToSearch( { owner_id : diaryObj.owner_id, id : diaryObj.id, full : 1 } ), true );
    //     xhr.addEventListener( "readystatechange", proc1, false );
    //     xhr.send();
    //     function proc1() {
    //         if ( xhr.readyState == 4 ) { if ( xhr.status == 200 ) { foundProc() } else { errorProc() } }
    //         function errorProc() { throw new Error( xhr.responseText ) }
    //         function foundProc() {
    //             var d = new DOMParser().parseFromString( xhr.responseText , "text/html" );
    //             extractMixiDiary( diaryObj.owner_id, diaryObj.id, d, proc2 );
    //             function proc2( diary ){
    //                 if ( callback!=undefined ) {
    //                     callback( diary );
    //                 }
    //             }
    //         }
    //     } 
    // }

    function setMixiBBSList( /*string*/ userID, /* CMixiUserInfo[]*/ bbsList ) {
        __localStorage.setItem( LS_MIXI_BBS_LIST + userID, __JSON.stringify( bbsList ) );
    }
    function getMixiBBSList( /*string*/ userID ) {
        lcast( 'string', userID );
        var str = __localStorage.getItem( LS_MIXI_BBS_LIST + userID );
        if ( str == null ) {
            return null;
        } else {
            return __JSON.parse( str );
        }
    }


    /*
        callback : function( boolean status, (function( CMixiUserInfo[] arg0 )) callback  );
     */
    function fetchMixiBBSList( userID, callback ) {
        progressEnter();
        var result=[];
        var exec = function(pidx) {
            progressValue( pidx-1);
            var xhr = new XMLHttpRequest();
            var action = "http://mixi.jp/list_community.pl?page="+pidx+"&id="+userID+"&tag_id=";
            __console().log( "fetchMixiBBSList():" + action );
            xhr.open( "GET", action, true );
            xhr.onreadystatechange = function(e) {
                // __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                __console().log( e+ " / " + xhr.readyState + " / " + xhr.status  );
                if ( xhr.readyState == 4 ) {
                    if( xhr.status == 200 ) {
                        // __console().log( e+ " / " + xhr.readyState + " / " + xhr.status  );
                        var d = new DOMParser().parseFromString( xhr.responseText, "text/html" );
                        
                        var pageCount = d.getElementsByClassName( "pageList01" ).length == 0 ? 0 : d.getElementsByClassName( "pageList01" )[0].getElementsByTagName("a").length + 1;
                        if ( pageCount != 0 ) {
                            progressMax( pageCount );
                        }

                        var icons = d.getElementsByClassName( "iconTitle" );
                        __console().log( "icons.length=" + icons.length );
                        if ( icons.length == 0 ) {
                            progressLeave();
                            callback( true, result );
                        } else {
                            tloop({ 
                                count:icons.length, 
                                init:function() {
                                    progressEnter(icons.length);
                                },
                                loop:function (i) {
                                    __console().trace( );
                                    __console().log( i );
                                    progressValue(i);
                                    var icon = icons[i];
                                    var href= icon.attributes.href.value;
                                    var obj = searchToObject( href );
                                    // var id = obj.comm_id;
                                    var id = obj.id || obj.comm_id;
                                    var name = icon.textContent.replace(/の写真$/g,"");
                                    __console().log( href,obj );

                                    result.push( lcast("*CMixiUserInfo", {
                                        mixiUserType : "mixicommunity",
                                        mixiUserID   : id,
                                        mixiUserName : name,
                                    }));
                                }, 
                                done : function() {
                                    progressLeave();
                                    exec(pidx+1);
                                }, 
                            });
                        }
                    } else {
                        __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                        progressLeave();
                        callback( false, result );
                    }
                }
            };
            xhr.send();
        };
        exec(1);
    }

    /* 
        function fetchMixiListFriends() : usage

        function start() {
            fetchMixiListFriends( function(result,friends) {
                __console().log( "status:" + result );
                __console().log( friends );
            });
        }
        start()

        {
            CTYPE : [ "CMixiUserInfo" ],
            mixiUserType : "mixiuser" or "mixicommunity"
            mixiUserName : "<name>",
            mixiUserID : "<userID>",
        }

        {
            CTYPE : [ "CMixiUser", "CMixiUserInfo" ], 
            new_friend_diary:null,
            nickname:"",
            photo:"(url.jpg)", 
            member_count:"34", 
            photo_width:"57", 
            relation_id:null, 
            photo_height:"76",
            last_name:"",
            tag_ids:null,
            lastlogin_level:"3",
            buddy:"0",
            member_id:"30892955",
            first_name:""
        }, (...)
    */
    function fetchMixiListFriends( callback ) {
        progressEnter(2);
        proc1();
        function proc1() {
            progressValue(0);
            var method = "GET";
            var url = "http://mixi.jp/list_friend.pl";
            var xhr = new XMLHttpRequest();
        
            xhr.open(method, url, true);
            xhr.onreadystatechange = function(e) {
                if ( xhr.readyState ==4 ) {
                    __console().log( xhr.status );
                    if ( xhr.status == 200 ) {
                        var d = new DOMParser().parseFromString( xhr.responseText, "text/html");
                        proc2(d);
                    } else {
                        progressLeave();
                        callback( false );
                    }
                }
            }
            xhr.send();
        }

        function proc2(d) {
            var post_key = getMixiPostKey( d );
            fetchFriendListProc( post_key, proc3 );
        }

        /* retrieve "post_key" value from "http://mixi.jp/list_friend.pl" document */
        function getMixiPostKey(d) {
            var forms = d.getElementById( "bodyArea" ).getElementsByTagName( "form" );
            for ( var i=0; i<forms.length; i++ ) {
                var f = forms[i];
                var inputs = f.getElementsByTagName( "input" );
                for ( var j=0; j<inputs.length;j ++ ) {
                    if ( inputs[j].name == "post_key" ) {
                        return inputs[j].value;
                    }
                }
            }
        }

        function fetchFriendListProc( post_key, callback ) {
            progressValue(1);
            progressEnter();
            var friends = [];
            var baseCount = null;
            run( 1 );
            function run( page ) {
                progressValue( page-1 );
                var method = "POST";
                var url = "http://mixi.jp/system/ajax_friend_setting.pl?type=thumbnail&mode=get_friends&page="+page+"&sort=lastlogin";
                var xhr = new XMLHttpRequest();
                var formData = new FormData();
                formData.append( "post_key", post_key );
            
                xhr.open(method, url, true);
                xhr.onreadystatechange = function(e) {
                    if ( xhr.readyState ==4 ) {
                        __console().log( xhr.status );
                        var json = __JSON.parse( xhr.responseText );
                        __console().log( json );
                        if ( baseCount == null ) {
                            baseCount = ( Number(json.result.member_count) + Number(json.result.per_page) - 1 ) / Number(json.result.per_page);
                            progressMax( baseCount );
                        }
                        var mixiUser = getMixiLoginUser();
                        if ( json.result.friends == undefined ) {
                            callback(true, friends );
                        } else {
                            friends = friends.concat( json.result.friends );
                            run( page + 1 );
                        }
                    }
                }
                xhr.send( formData );
            }
        }

        function proc3( result, friends ) {
            for ( var i=0; i<friends.length; i++ ) {
                friends[i].CTYPE = [ "CMixiUser", "CMixiUserInfo" ];
                friends[i].mixiUserType = "mixiuser";
                friends[i].mixiUserID = friends[i].member_id;
                friends[i].mixiUserName = friends[i].nickname;
            }
            progressLeave();
            progressLeave();
            callback( result, friends );
        }
    }

    /*
     * ************ CONSOLE **************************************************************************************
     */
    function validColor( e , valid ){ 
        if ( valid ) {
            e.style.backgroundColor = "#55F";
            e.style.color = "#FFF";
            e.style.fontWeight = "bolder";
        } else {
            e.style.backgroundColor = "#FFF";
            e.style.color = "#000";
            e.style.fontWeight = "normal";
        }
    }
    var pro = new Pro( function(value) {
        __console().trace();
        __console().log( "progress=", value );
        // controlPanel.document.getElementById( "pbar" ).value = value*100;
        controlPanel.document.getElementById( "pbar_meter" ).style.width = (100*value ) + '%';
    });
    function progressEnter(total){ 
        if ( pro.state().length == 0 ) {
            controlPanel.document.getElementById( "throbber" ).style.display = "inline";
            controlPanel.document.getElementById( "pbar" ).style.display = "block";
            controlPanel.document.getElementById( "pbarPane" ).style.display = "block";
        }
        return pro.enter(total);
    }
    function progressMax( value ) { 
        return pro.max( value );
    }
    function progressValue( value ) { 
        if ( progressMax() < value ) {
            progressMax( progressMax() * 2 );
        }
        return pro.value( value );
        // controlPanel.document.getElementById( "pbar" ).value = value*100;
    }
    function progressLeave(){ 
        if ( pro.state().length == 1 ) {
            controlPanel.document.getElementById( "throbber" ).style.display = "none";
            controlPanel.document.getElementById( "pbar" ).style.display = "none";
            controlPanel.document.getElementById( "pbarPane" ).style.display = "none";
        }
        return pro.leave();
    }
    
    function setGoogleRefreshToken( refreshToken ) {
        __console().log( "setGoogleRefreshToken" + refreshToken );
        if ( refreshToken != null  ) {
            __localStorage.setItem( LS_GOOGLE_REFRESH_TOKEN, refreshToken );
            __console().log( "setGoogleRefreshToken" + refreshToken  + " was set!" );
        }
    }
    function getGoogleRefreshToken() {
        // return __localStorage.getItem( "ats.refreshToken" );
        return __localStorage.getItem( LS_GOOGLE_REFRESH_TOKEN );
    }

    var __accessToken=null;
    function getGoogleAccessToken() {
        return __accessToken;
        // __console().log( controlPanel.document.getElementById("accessToken").value ); 
        // return controlPanel.document.getElementById("accessToken").value;
    }
    function setGoogleAccessToken( accessToken ) {
        __accessToken = accessToken;
        // var e = controlPanel.document.getElementById("accessToken");
        // validColor( e, true );
        // e.value = accessToken;
        // setAccessTokenUpdate();
    }

    function setAccessTokenUpdate() {
        if ( __accessToken !="" ) {
            fetchGoogleUserID(
                function(ok){
                    if ( ok ) {
                        fetchBloggerBlogs(
                            function(ok) {
                                fetchPicasaAlbums(function() {
                                    restoreGoogleSelectionStatus();
                                });
                            }
                        );
                    } else {
                        // recursive call
                        setGoogleAccessToken( "" );
                        setAccessTokenUpdate();
                    }
                }
            );
        } else {
            // validColor( null, false );
        }
    }

    function updateAccessToken( callback ) {
        __console().log( "updateAccessToken:refreshToken=" + getGoogleRefreshToken() );
        // var code = "4/7-nZ-yx4txesBTG5NOhjtw3eaP5v.EmwHUmhfysgSgrKXntQAax3ir0hteQI";

        var formData = new FormData();
        // formData.append( "code" , code );
        formData.append( "client_id" , client_id );
        formData.append( "refresh_token" , getGoogleRefreshToken() );
        formData.append( "client_secret" , client_secret );
        formData.append( "grant_type", "refresh_token" );

        var xhr;
        xhr = new XMLHttpRequest();
        xhr.open( "POST",  "https://accounts.google.com/o/oauth2/token" , true );
        xhr.addEventListener( "readystatechange",  loadProc01, false );
        xhr.send(formData);
        function loadProc01() {
            __console().log( xhr.readyState );
            if ( xhr.readyState == 4 ) { if ( xhr.status == 200 ) { foundProc() } else { errorProc() } }
            function errorProc() {  __console().log( xhr.responseText ); callback(null)}
            function foundProc() {
                var o= __JSON.parse( xhr.responseText );
                __console().log( "updateAccessToken.foundProc" );
                __console().log( o );
                setGoogleAccessToken( o.access_token );
                // setAccessTokenUpdate()
                callback( o );
            }
        }
    }

    function codeToToken( code, callback ){
        __console().log( "codeToToken:code=" + code );
        // var code = "4/7-nZ-yx4txesBTG5NOhjtw3eaP5v.EmwHUmhfysgSgrKXntQAax3ir0hteQI";

        var formData = new FormData();
        formData.append( "code" , code );
        formData.append( "client_id" , client_id );
        formData.append( "client_secret" , client_secret );
        formData.append( "redirect_uri" , redirect_uri );
        formData.append( "grant_type", "authorization_code" );

        var xhr;
        xhr = new XMLHttpRequest();
        xhr.open( "POST",  "https://accounts.google.com/o/oauth2/token" , true );
        // xhr.setRequestHeader( "Content-Type", "application/x-www-form-urlencoded" );
        xhr.addEventListener( "readystatechange",  loadProc01, false );
        xhr.send(formData);
        function loadProc01() {
            __console().log( xhr.readyState );
            if ( xhr.readyState == 4 ) { if ( xhr.status == 200 ) { foundProc() } else { errorProc() } }
            function errorProc() { __console().log( xhr.responseText ); }
            function foundProc() {
                var o= __JSON.parse( xhr.responseText );
                __console().log( "codeToToken.foundProc" );
                __console().log( o );
                callback( o );
            }
        }
    }

    function startRefreshToken( callback ) {
        updateAccessToken( callback01 );
        function callback01( o ) {
            if ( o != null ) {
                setGoogleAccessToken( o.access_token );
            }
            if ( callback != null ) {
                callback( o );
            }
        }
    }

    function startRefresh( callback ) {
        setUserID("","");
        clearPicasaAlbums();
        clearBloggerBlogs();
        // updateMixiDiaryList('all');

        var refreshToken =  getGoogleRefreshToken();
        if ( refreshToken == null || refreshToken == "" ) {
            //
        } else {
            updateAccessToken( callback01 );
        }
        function callback01( o ) {
            if ( o != null ) {
                setGoogleAccessToken( o.access_token );
            }
            setAccessTokenUpdate();
            // updateMixiDiaryList('all');
            if ( callback != null ) {
                callback( o );
            }
        }
    }
    
    function startLogin() {
        setUserID("","");
        clearPicasaAlbums();
        clearBloggerBlogs();
        var ww = openNew();
        ww.location = LOGIN_URL;
        function chk() {
            __console().log( "startLogin.chk" );
            if ( ww.location.host.match( "oka-ats.blogspot.com" ) ) {
                // var o = searchToObject( ww.location.hash );
                // setGoogleAccessToken( o.access_token );
                var o = searchToObject( ww.location.search );
                __console().log( o );
                codeToToken( o.code, callback01 );
                ww.close();
                return;
            } else if ( ww.closed ) {
                return ;
            } else {
                setTimeout( chk, 1000 );
            }
            function callback01( o ) {
                __console().trace();
                __console().log( "startLogin.callback01", o );
                // setGoogleRefreshToken( o.id_token );
                if ( o.refresh_token != null ) {
                    setGoogleRefreshToken( o.refresh_token );
                }
                setGoogleAccessToken( o.access_token );
                setAccessTokenUpdate();
            }
        }
        chk();
    }

    function updateEditTemplateButton() {
        var sel = controlPanel.document.getElementById("selectBBS");
        var o = sel.options[ sel.selectedIndex ];
        if ( o != null ) {
            controlPanel.document.getElementById( "editTemplate" ).value = o.text + 'を整形するテンプレートを編集';
        }
    }

    function updateMixiBBSList( /*CMixiUserInfo[]*/ bbsList, /* CMixiUser&CMixiUserInfo */ mixiUser ) {
        __console().log( "updateMixiBBSList" );
        __console().log( bbsList );
        __console().log( mixiUser );
        // lcast( 'null || object[]', bbsList );
        // lcast( 'object', mixiUser );

        // GET SELECT ELEMENT
        var sel = controlPanel.document.getElementById( "selectBBS" );

        // __console().log( "1" + sel );

        // CLEAR ALL OPTIONS
        while (sel.firstChild ){
            sel.removeChild(sel.firstChild);
        }

        // if the specified list is null, leave it blank.
        if ( bbsList == null ) {
            var op = controlPanel.document.createElement( "option" );
            op.text = "(未ダウンロード - 更新ボタンを押して下さい)";
            op.value = 'null';
            sel.appendChild( op );
            return;
        }

        // *** SPECIAL_MIXI_ID ***
        var op = controlPanel.document.createElement( "option" );
        op.text = mixiUser.mixiUserName + "さんのミクシ日記";
        op.value = __JSON.stringify( mixiUser );
        sel.appendChild( op );
        // *** SPECIAL_MIXI_ID ***

        // __console().log( "2" + sel );
        // ADD OPTIONS TO THE SELECT
        for ( var i=0; i<bbsList.length; i++ ) {
            var op= controlPanel.document.createElement( "option" );
            op.text = bbsList[i].name || bbsList[i].mixiUserName;
            op.value = __JSON.stringify( bbsList[i] );
            sel.appendChild( op );
            // __console().log( "3" + op );
        }
        // __console().log( "4" + sel );
    }
    /* 
       document.getElementsByClassName("iconTitle").item(0).textContent
       getCommunities( "459989", function(result,data) {
           __console().log( result );
           __console().log( data );
       });
    */

    function displayMixiListFriends( /* CMixiUser&CMixiUserInfo[] */ friends ) {
        var sel = controlPanel.document.getElementById( "selectMixiUser" );
        // clear all
        while (sel.firstChild ){
            sel.removeChild(sel.firstChild);
        }

        // *** SPECIAL_MIXI_ID *** add self id object ***
        var mixiUser = getMixiLoginUser();
        var op = controlPanel.document.createElement( "option" );
        op.text = mixiUser.mixiUserName;
        op.value = __JSON.stringify( mixiUser );
        sel.appendChild( op );
        // ***  SPECIAL_MIXI_ID ***  end ***
 
        for ( var i=0; i<friends.length; i++ ) {
            // DYNAMICALLY APPEND OPTIONS
            var op = controlPanel.document.createElement( "option" );
            op.text = friends[i].nickname;
            op.value = __JSON.stringify( friends[i] );
            sel.appendChild( op );
        }
    }
    /*
        {
            mixiUserID : opt.value,
            mixiUserName : opt.text,
        }   
    */
    function getSelectedMixiUser() /* : CMixiUser&CMixiUserInfo */ {
        var sel = controlPanel.document.getElementById( "selectMixiUser" );
        if ( sel.selectedIndex < 0 ) 
            return null;
        return __JSON.parse( sel.options[ sel.selectedIndex ].value );
    }

    function restoreGoogleSelectionStatus(){
        var picasaAlbumID = __localStorage.getItem( LS_PICASA_ALBUM_ID ) ;
        if ( picasaAlbumID != null ) {
            setSelectedPicasaAlbum( picasaAlbumID );
        }
        var bloggerBlogID = __localStorage.getItem( LS_BLOGGER_BLOG_ID ) ;
        if ( bloggerBlogID != null ) {
            setSelectedBlogID( bloggerBlogID );
        }
    }

    function restoreMixiSelectionStatus() {
        start();
        function start() {
            fetchMixiUserID( onDoneMixiUserID );
        }
        function onDoneMixiUserID( status, mixiUserID, mixiUserName ) {
            __console().log( "restoreMixiSelectionStatus status=", status,  "mixiUserID=" , mixiUserID + ", mixiUserName=" , mixiUserName );
            if ( ! status  ) {
                alert( "mixiにログインしていません。mixiにログインした状態で、もう一度mixitransを実行して下さい。" );
                openNew().location.replace( "http://mixi.jp/" );
                return;
            }

            setMixiLoginUser( { CTYPE:["CMixiUserInfo"], mixiUserType:'mixiuser', mixiUserID:mixiUserID, mixiUserName:mixiUserName } );

            var friends = getMixiListFriends( mixiUserID )
            if ( friends != null ) {
                displayMixiListFriends( friends );
                onSelectMixiUserChange();
                return;
            } else {
                fetchMixiListFriends( onDoneFetchMixiListFriend );
            }
        }
        function onDoneFetchMixiListFriend( result, /* CMixiUserInfo[] */ friends ) {
            __console().log( friends );
            displayMixiListFriends( friends );
            onSelectMixiUserChange();
            setMixiListFriends( getMixiLoginUser().mixiUserID, friends );
        }
    }

    function setMixiLoginUser( /* CMixiUserInfo */ obj ) {
        __localStorage.setItem( LS_MIXI_USER_ID, obj.mixiUserID );
        __localStorage.setItem( LS_MIXI_USER_NAME, obj.mixiUserName );
        controlPanel.document.getElementById( "mixiUserIDInput" ).value = obj.mixiUserName + "さん (id:"+ obj.mixiUserID + ")";
    }
    function getMixiLoginUser()/* : CMixiUserInfo */ {
        return {
            CTYPE : ["CMixiUserInfo"],
            mixiUserType : 'mixiuser',
            mixiUserID : __localStorage.getItem( LS_MIXI_USER_ID ),
            mixiUserName : __localStorage.getItem( LS_MIXI_USER_NAME ),
        };
    }

    /*
     * ************ WORKING WITH GOOGLE **************************************************************************************
     */
    function setUserID( id,name ) {
        controlPanel.document.getElementById("googleUserIDInput").value = id;
        controlPanel.document.getElementById("googleUserNameInput").value = name ;
        validColor( controlPanel.document.getElementById("googleUserIDInput"), id != "" );
        validColor( controlPanel.document.getElementById("googleUserNameInput"), id != "" );
    }
    function getUserID() {
        __console().log( controlPanel.document.getElementById("googleUserIDInput").value );
        return controlPanel.document.getElementById("googleUserIDInput").value;
    }
    function fetchGoogleUserID( callback ) {
        var xhr = new XMLHttpRequest();
        xhr.open( "GET", "https://www.googleapis.com/oauth2/v1/userinfo", true );
        // xhr.setRequestHeader( "GData-Version", '3.0' );
        xhr.setRequestHeader( "Authorization", "Bearer " + getGoogleAccessToken() );
        xhr.onreadystatechange = function(e) {
            if ( xhr.readyState == 4 ) {
                if( xhr.status == 200 ) {
                    __console().log( "userinfo " + e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    var r = __JSON.parse( xhr.responseText );
                    setUserID( r.id, r.name );
                    callback(true);
                } else {
                    callback(false);
                    __console().log( "userinfo " + e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                }
            }
        };
        xhr.send();
    }

    /*
     * ************ WORKING WITH PICASA **************************************************************************************
     */

    function nsResolver(prefix) {
        __console().log( prefix )
        var ns = {
           'atom' : 'http://www.w3.org/2005/Atom',
           'xhtml' : 'http://www.w3.org/1999/xhtml',
           'mathml': 'http://www.w3.org/1998/Math/MathML'
        };
        return ns[prefix] || null;
    }
    // document.evaluate( "count(//feed:id)", document,  nsResolver, XPathResult.ANY_TYPE, null ).numberValue
    // document.evaluate( "//atom:id", document,  nsResolver, XPathResult.ANY_TYPE, null ).iterateNext()
    /*
    for ( var i = document.evaluate( "//p", document,  nsResolver, XPathResult.ANY_TYPE, null );; ) {
        var e =i.iterateNext();
        if ( e == null ) break;
        __console().log( e.nodeName +"/"+ e.textContent );
    }
    */
    function getSelectedPicasaAlbum() {
        var se = controlPanel.document.getElementById( "picasaAlbumID" );
        var selectedElement = se.options[se.selectedIndex];
        return selectedElement.value;
    }
    function setSelectedPicasaAlbum( id ) {
        __console().log( "setSelectedPicasaAlbum " +id );
        try {
            selectByID( controlPanel.document.getElementById( "picasaAlbumID" ), function(value) { return value == id } );
        } catch ( e ) {
            __console().trace();
            __console().error(e);
        }
    }
    function clearPicasaAlbums(sel) {
        var sel = sel == undefined ? controlPanel.document.getElementById( "picasaAlbumID" ) : sel;
        while ( sel.firstChild ) {
            sel.removeChild( sel.firstChild )
        }
    }
    function fetchPicasaAlbums(callback) {
        var xhr = new XMLHttpRequest();
        // xhr.open( "GET","https://picasaweb.google.com/data/feed/api/user/default", true );
        xhr.open( "GET","https://picasaweb.google.com/data/feed/api/user/"+getUserID(), true );
        xhr.setRequestHeader( "Authorization", "Bearer " + getGoogleAccessToken() );
        xhr.addEventListener( "readystatechange", function(e) {
            if ( xhr.readyState == 4 ) {
                // __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                __console().log( xhr.status );
                if ( xhr.status == 200 ) {
                    var cdoc = controlPanel.document;
                    var sel = cdoc.getElementById( "picasaAlbumID" );
                    clearPicasaAlbums( sel );
                    var xml = new DOMParser().parseFromString( xhr.responseText, "text/xml" );
                    var e = xml.getElementsByTagName( "entry" );
                    __console().log( "e.length : " + e.length );
                    for ( var i=0; i<e.length; i++ ) {
                        var entry = e.item(i);
                        __console().log( "entry : " + entry );
                        var title = entry.getElementsByTagName( "title" ).item(0).textContent;
                        var id= entry.getElementsByTagName( "gphoto:id" ).item(0).textContent;

                        __console().log( "entry : " + id + "=" + title );
                        var o = cdoc.createElement( "option" );
                        o.text = title;
                        o.value= id;
                        sel.add( o, null );
                    }
                }
                if ( callback != null ) {
                    callback(xhr.status, xhr.responseText );
                }
            }
        } );
        xhr.send();
    }

    /*
        var xml = get();
        __console().log( xml.getElementsByTagName("entry").item(0).childNodes.item(0) )
        var s = new XMLSerializer().serializeToString( xml )
        window.open( "data:text/xml,"+ encodeURIComponent( s )  )
    */
    function createPicasaAlbum( param ) {
        // POST https://picasaweb.google.com/data/feed/api/user/userID
        with( { title:"default",summary:"", location:"Thailand", access:"public", timestamp:new Date().getTime(), keywords:"", } ) {
            with(param) {
                var s ="\
                <entry xmlns='http://www.w3.org/2005/Atom' xmlns:media='http://search.yahoo.com/mrss/' xmlns:gphoto='http://schemas.google.com/photos/2007'>\n\
                  <title type='text'>"+ title +"</title>\n\
                  <summary type='text'>"+summary+"</summary>\n\
                  <gphoto:location>"+location+"</gphoto:location>\n\
                  <gphoto:access>public</gphoto:access>\n\
                  <gphoto:timestamp>" + timestamp + "</gphoto:timestamp>\n\
                  <media:group>\n\
                    <media:keywords>"+keywords+"</media:keywords>\n\
                  </media:group>\n\
                  <category scheme='http://schemas.google.com/g/2005#kind'\n\
                    term='http://schemas.google.com/photos/2007#album'></category>\n\
                </entry>\n\
                ";
            }
            s=s.replace(/^\s*/gm,"");
            __console().log( s );
        }
        var xhr = new XMLHttpRequest();
        xhr.open( "POST","https://picasaweb.google.com/data/feed/api/user/default", true );
        xhr.setRequestHeader( "Content-Type", "application/atom+xml" );
        xhr.setRequestHeader( "Authorization", "Bearer " + getGoogleAccessToken() );
        xhr.addEventListener( "readystatechange", function(e) {
            if ( xhr.readyState == 4 ) {
                __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                __console().log( xhr.status );
                if ( xhr.status == 201 ) {
                    __console().log( "successfully created " + param.title );
                }
                // var xml = new DOMParser().parseFromString( xhr.responseText, "text/xml" );
                // window.open( "data:text:xml," + xhr.responseText );
            }
        } );
        xhr.send(s);
    }
    function uploadPicasaImage(file, albumid, filename, callback ) {
        var method = 'POST';
        // var url = 'https://picasaweb.google.com/data/media/api/user/default/albumid/'+albumid+'/';
        var url = 'https://picasaweb.google.com/data/feed/api/user/default/albumid/'+encodeURIComponent( albumid )+'';

        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader("GData-Version", '3.0');
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader("Slug", filename );
        // xhr.setRequestHeader("Authorization", oauth.getAuthorizationHeader(url, method, ''));
        xhr.setRequestHeader("Authorization", 'Bearer ' + getGoogleAccessToken() );
        xhr.onreadystatechange = function(e) {
            if ( xhr.readyState == 4 ) {
                __console().log( xhr.status );
                __console().log( xhr.responseText );
                if ( xhr.status == 201 ) {
                    __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    var images= [];
                    var xml = new DOMParser().parseFromString( xhr.responseText, "text/xml" );
                    with(xml.getElementsByTagName( "media:group" ).item(0).getElementsByTagName( "media:content" ).item(0) ) {
                        images.push( {
                            url  : getAttribute( "url" ),
                            height : getAttribute( "height" ),
                            width : getAttribute( "width" ),
                        })
                    }
                    var es = xml.getElementsByTagName( "media:group" ).item(0).getElementsByTagName( "media:thumbnail" )
                    for ( var i=0; i<es.length; i++ ) {
                        with ( es.item(i) ) {
                            images.push( {
                                url : getAttribute( "url" ),
                                height : getAttribute( "height" ),
                                width : getAttribute( "width" ),
                            })
                        }
                    }
                    callback(true,"",images);
                } else {
                    callback(false, xhr.responseText,null );
                }
            } else {
                // __console().log( e, " / " , xhr.readyState , " / " , xhr.status , " / " , xhr.responseText );
            }
        };
        xhr.send(file);
    }

    /*
     * ************ WORKING WITH BLOGGER **************************************************************************************
     */
    function clearBloggerBlogs(sel) {
        sel = sel == undefined ? controlPanel.document.getElementById( "bloggerBlogID" ) : sel;
        while ( sel.firstChild ) {
            sel.removeChild( sel.firstChild )
        }
    }

    function fetchBloggerBlogs( callback ) {
        var id = getUserID();
        var xhr = new XMLHttpRequest();
        xhr.open( "GET", "https://www.googleapis.com/blogger/v3/users/self/blogs", true );
        // xhr.setRequestHeader( "GData-Version", '3.0' );
        xhr.setRequestHeader( "Authorization", "Bearer " + getGoogleAccessToken() );
        xhr.onreadystatechange = function(e) {
            if ( xhr.readyState == 4 ) {
                if( xhr.status == 200 ) {
                    __console().log( "fetchBloggerBlogs:" + e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );

                    var cdoc = controlPanel.document;
                    var sel = cdoc.getElementById( "bloggerBlogID" );
                    clearBloggerBlogs(sel);

                    var r = __JSON.parse( xhr.responseText );
                    for ( var i=0; i<r.items.length; i++ ) {
                        var item = r.items[i];

                        var o = cdoc.createElement( "option" );
                        o.text = item.name + "(" + item.posts.totalItems + ")";
                        o.value= __JSON.stringify( item );
                        sel.add( o, null );
                    }
                    callback( true );
                } else {
                    __console().log( "fetchBloggerBlogs:" +e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    callback( false );
                }
            }
        };
        xhr.send();
    }

    function formatDiaryIndex( /*CMixiDiaryHeader[]*/ diaryHeaderList ) /* string */ {
            // type  : 'CMixiUserType' ,
            // title : 'string', // "diary's title",
            // date  : 'string', // "diary's date in Japanese",
            // url   : "url", // URL to the diary
            // diaryID : 'CDiaryID', // urlToDiaryID( url ),
            // authorID : 'string', // this value is same as mixiUserID when it is a diary post, when it is a community post, the value is mixiUserID of user who opened the post.
            // authorName : 'string', // this value is same as mixiUserID when it is a diary post, when it is a community post, the value is mixiUserID of user who opened the post.
        var s =[];
        for ( var i=0; i<diaryHeaderList.length; i++ ){
            var diaryHeader = diaryHeaderList[i];
            var diaryURL = diaryHeader.diaryID;
            s.push( '<a name="'+diaryHeader.diaryID+'"></a><a href="'+diaryURL+'">' + diaryHeader.title + "</a>" );
        }
        return s.join( "\n" );
    }

    /*
    * Append 'outputURL' to the header objects so that let the passed diary headers inherit CMixiDiaryOutputURL.
    */
    function initiateDiaryHeaderList( f, diaryHeaderList ) {
        for ( var i=0; i<diaryHeaderList.length; i++ ) {
            diaryHeaderList[i].outputURL = f( diaryHeaderList[i] );
        }
    }

    function extractFilename( f, removeFileExtention ) {
        var file = f;
        if ( true ) {
            var i=file.lastIndexOf( '/' );
            if ( 0<=i ) {
                file = file.substring(i+1);
            }
        }
        if ( removeFileExtention ) {
            var i=file.lastIndexOf( '.' );
            if ( 0<=i ) {
                file = file.substring(0,i);
            }
        }
        return file;
    }


    /*
        // See definition of 'function extractMixiDiary()'
        // DIARY OBJECT DATA FORMAT 
        var diary = {
            CTYPE     : [ "CMixiDiary", "CMixiDiaryHeader" ] // CTYPEDEF
            title     : "diary's title",
            date      : "diary's date in Japanese",
            url       : "url",
            diaryID   : oneOf( CDiaryID ),
            owner_id  : "owner_id"
            id        : "id",
            direction :  { // obsolete
                next : "url",
                prev : "url",
            }
            images : [
                { 
                    src : img.src, 
                    data: "dataURI", 
                    filename : "filename", 
                    uploaded:null,
                    uploadedImages: [ // the first element is always the largest full-size image file in the list and others are thumbnails.
                        {
                            url  : getAttribute( "url" ),
                            height : getAttribute( "height" ),
                            width : getAttribute( "width" ),
                        }, // (...)
                    ],
                }, // (...)
            ],
            text : "text",
            comments :[
                date     : "post date",
                userName : "the post user's name",
                userURL  : "URL to the user's profile",
                text     : "comment text",
                iconURL  : "URL to the user's icon file",
                iconData : "dataURL to the user's icon file",
            ],
        };
    */
    function formatDiary( /*CMixiDiary*/ diary, /*CMixiDiaryOutputURL*/ diaryHeaderList, delimitor, settingObject, indexFileCaption, indexFileURL ) {
        // __console().log( diary );

        var getMixiDiaryByRelativeIndex = (function() {
            var idx = getMixiDiaryIndex( diary, diaryHeaderList );
            // __console().log( "formatDiary.generateLink=" + idx );
            function get(diff) {
                var diaryHeader = diaryHeaderList[ idx+diff ];
                // __console().log( "get(diff) diaryHeader",diaryHeader );
                if ( diaryHeader == undefined ) {
                    return null;
                }
                return diaryHeader;
                // var diaryID  = diaryHeader.diaryID;
                // if ( diaryID == null ) {
                //     return null;
                // }
                // var diary = getMixiDiaryFromStorage( diaryID );
                // if ( diary == null ) {
                //     return null;
                // } else {
                //     return diary;
                // }
            }
            return get;
        })();

        var neighborDiary = null;
        var arr=[];
        arr.push( "<div class='diary'>" );

        function pushPrevNext(prefix) {
            arr.push( "<div class='"+prefix+"DiaryLinkIndex'>" );
            if ( indexFileURL && indexFileCaption ) {
                arr.push( "<a href='" + ( indexFileURL ) + "#"+diary.diaryID+"'>"+indexFileCaption+"</a>" );
            }
            arr.push( "</div>" );

            arr.push( "<div class='"+prefix+"DiaryLinkPrev'>" );

            neighborDiary = getMixiDiaryByRelativeIndex(-1);
            if ( neighborDiary ) {
                arr.push( "<a href='" + ( neighborDiary.outputURL ) + "'>前へ ("+neighborDiary.title+")</a>" );
            }
            arr.push( "</div>" );

            arr.push( "<div class='"+prefix+"DiaryLinkNext'>" );
            neighborDiary = getMixiDiaryByRelativeIndex(+1);
            if ( neighborDiary ) {
                arr.push( "<a href='" + ( neighborDiary.outputURL ) + "'>次へ ("+neighborDiary.title+")</a>" );
            }
            arr.push( "</div>" );
        }
        pushPrevNext('header');

        arr.push( "<div class='diaryHeader'>" );
        arr.push( "<div class='diaryTitle'>" );
        arr.push( diary.title );
        var diaryCategory = parseDiaryID( diary.diaryID ).cid;
        if ( diaryCategory =='c' ) {
            arr.push( " ("+diary.authorName +")" );
        }
        arr.push( "</div>" );
        arr.push( "<div class='diaryDate'>" );
        arr.push( getTimeCreated( diary ) );
        arr.push( "</div>" );
        arr.push( "</div>" );

        arr.push( "<div class='diaryText'>" );

        arr.push( "<div class='diaryImages'>" );
        for ( var i=0; i<diary.images.length; i++ ) {
            if ( diary.images[i].uploadedImages != null ) {
                var url = diary.images[i].uploadedImages[0].url;
                arr.push( "<img src='"+url+"' class='diaryImage' onclick=\"window.open('"+url+"')\" />" );
            } else if ( diary.images[i].imageDataURI != null ) {
                var imageDataURI = diary.images[i].imageDataURI
                arr.push( "<img src='"+imageDataURI+"' class='diaryImage' onclick=\"window.open('"+imageDataURI+"')\" />" );
            }
        }
        arr.push( "</div>" );

        var diaryText = diary.text;
        diaryText = replaceURL( diaryText );
        var darr = diaryText.split( /[\n]/ );
        for ( var i=0; i<darr.length; i++ ) {
            if ( i == 3 ) {
                arr.push( "<!--more-->" ); 
            }
            arr.push( darr[i] + "<br/>" );
        }
        arr.push( "</div>" );
        arr.push( "<div class='diaryComment' >" );
        arr.push( "<div class='diaryCommentHeader' >コメント一覧</div>" );
        for ( var i=0; i<diary.comments.length; i++ ) {
            var comment=diary.comments[i];
            if ( i!=0 ) {
                arr.push( "<div class='diaryCommentSeparator' ></div>" );
            }
            // arr.push( "<div class='commentUserIcon' ><img src='" + diary.comments[i].icon + "' /></div>" );
            arr.push( "<div class='diaryCommentRow' >" );

            var commentNo;
            if ( diaryCategory == 'c' ) { 
                commentNo = "<a name='comment_"+Number(comment.commentNo)+"'>[" + Number(comment.commentNo) + "]</a> &nbsp; ";
            } else {
                commentNo = "";
            }
            var userName = comment.userName == '' ? "---" : comment.userName ;
            arr.push( "<div class='diaryCommentTitle' >" + commentNo + userName + " &nbsp; " + comment.date + "</div>" );

            arr.push( "<div class='diaryCommentImages' >"  );
            for ( var j=0; j<comment.images.length; j++ ) {
                if ( comment.images[j].uploadedImages != null ) {
                    var url = comment.images[j].uploadedImages[0].url;
                    arr.push( "<img src='"+url+"' class='commentImage' onclick=\"window.open('"+url+"')\" />" );
                } else if ( comment.images[j].imageDataURI != null ) {
                    var imageDataURI = comment.images[j].imageDataURI
                    arr.push( "<img src='"+imageDataURI+"' class='commentImage' onclick=\"window.open('"+imageDataURI+"')\" />" );
                }
            }
            arr.push( "</div>"  );
            // var userName = comment.userName == '' ? "---" : comment.userName ;
            // arr.push( "<div class='diaryCommentTitle' >" + userName + " &nbsp; " + comment.date + "</div>" );
            arr.push( "<div class='diaryCommentText' >" + replaceCommentNo( replaceURL( comment.text ) ).replace( /\n/gm, "<br/>" ) + "</div>" );
            arr.push( "</div>" );
        }
        arr.push( "<div class='diaryCommentFooter' >&nbsp;</div>" );
        arr.push( "</div>" );

        pushPrevNext('footer');

        // arr.push( "<a id='diaryOrigin' target='_blank' href='"+diaryObjToURL(diary)+"'>出展 "+diary.date+" 『" + diary.title + "』</a>" );
        arr.push( "<a id='diaryOrigin' target='_blank' href='"+(diary.url)+"'>出展 "+getTimeCreated( diary )+" 『" + diary.title + "』</a>" );
        arr.push( "</div>" );

        if ( delimitor != undefined ) {
            return arr.join(delimitor);
        } else {
            return arr.join("\n");
        }
    }

    // var idstr = ' <span style="display:none">(' + createDiaryFilename( diary ) + ')</span>';
    // return titlePrefix +"" + h2z( diary.title +" - "+ diary.date ) + idstr;
    function formatTitle( titlePrefix, /*CMixiDiaryOutputURL*/ diaryHeader ) {
        return titlePrefix +"" + h2z( diaryHeader.title ) + ' (' + extractFilename( diaryHeader.outputURL, true ) + ')';
    }
    function formatTitleIndex( titlePrefix, id ) {
        return titlePrefix +"" + h2z( diaryHeader.title ) + ' (' + extractFilename( diaryHeader.outputURL, true ) + ')';
    }

    function formatIndex( /*CMixiDiaryOutputURL[]*/ diaryHeaderList ) {
        console.log( __JSON.stringify( diaryHeaderList ) );

        // phase 1
        var s='';
        var yearArray= [];
        var lastYear=null;
        for ( var i=0; i<diaryHeaderList.length; i++ ) {
            var diaryHeader = diaryHeaderList[i];
            var diary = getMixiDiaryFromStorage( diaryHeader.diaryID )
            var dateString = getTimeCreated( diary );
            var date = mixiDateToDate( dateString );
            var year = date.getFullYear();
            if ( lastYear != year ) {
                if ( lastYear !=null ) {
                    s+= '<br/>';
                    s+= '<a href="#index">もどる</a><br/>';
                    s+= '<br/>';
                }
                s+= '<a name="'+year+'"></a><h3>'+h2z(year+'年')+'</h3>';
                lastYear = year;
                yearArray.push( year );
            }
            s+='<a name="'+diaryHeader.diaryID+'"></a><a id="'+diaryHeader.diaryID+'"href="'+(diaryHeader.outputURL)+'">'+ dateString + " - " + diary.title + '</a><br/>';
        }

        // phase 2
        var ss = '';
        ss+= '<a name="index"></a><b>もくじ</b><br/>';
        for ( var i=0; i<yearArray.length; i++ ) {
            ss += '<div class="index-year-element"><a href="#'+yearArray[i]+'">'+yearArray[i]+'年</a></div>';
        }
        ss+="<br/>";

        // phase 3
        var css = "<style>";
        css+=".index-year-element {";
        css+="display:inline;";
        css+="margin:4px;";
        css +="}";
        css+="</style>";

        // This page is linked from every diary page. When the user comes to this page,
        // make the link where the user come from flashing.
        css+="<script>                                                                                        ".trim();
        css+="    function getOffset( el ) { ".trim();
        css+="        var left = 0; ".trim();
        css+="        var top = 0; ".trim();
        css+="        while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) { ".trim();
        // css+="            left += el.offsetLeft - el.scrollLeft; ".trim();
        // css+="            top += el.offsetTop - el.scrollTop; ".trim();
        css+="            left += el.offsetLeft; ".trim();
        css+="            top += el.offsetTop; ".trim();
        css+="            el = el.offsetParent; ".trim();
        css+="        } ".trim();
        css+="        return { top: top, left: left }; ".trim();
        css+="    } ".trim();
        css+="    window.addEventListener( 'load' , function() {                                              ".trim();
        css+="        if ( document.location.hash != '' ) {                                                   ".trim();
        css+="            var a = document.getElementById( document.location.hash.substring(1) );             ".trim();
        css+="            window.scrollTo( 0, 0 );";
        css+="            window.scrollBy(0, getOffset(a).top - window.pageYOffset - window.innerHeight / 2 );; ";
        css+="            a.style.backgroundColor = 'rgba(0,0,255,0.2)';                                      ".trim();
        css+="            a.style.borderRadius = '5px';                                                       ".trim();
        css+="            a.style.color='red';                                                                ".trim();
        css+="            a.style.fontWeight='bolder';                                                        ".trim();
        css+="            var c=0;                                                                            ".trim();
        css+="            var vc =10;                                                                         ".trim();
        css+="            var f = function(){                                                                 ".trim();
        css+="                c=c+vc;                                                                         ".trim();
        css+="                if ( c == 0 ) {                                                                 ".trim();
        css+="                    vc =10;                                                                     ".trim();
        css+="                } else if ( c == 100 ) {                                                        ".trim();
        css+="                    vc =-10;                                                                    ".trim();
        css+="                }                                                                               ".trim();
        css+="                a.style.backgroundColor = 'rgba(0,0,255,'+c/400+')';                            ".trim();
        css+="                setTimeout( f, 100 );                                                           ".trim();
        css+="            };                                                                                  ".trim();
        css+="            f();                                                                                ".trim();
        css+="        }                                                                                       ".trim();
        css+="    } );                                                                                        ".trim();
        css+="</script>                                                                                       ".trim();

        return css+ss+s;
    }


    function uploadDiary2( callback, blogID, postID, diary, diaryHeaderList /*:CMixiDiaryHeader[]*/ ) {
        var id = getUserID();
        var xhr = new XMLHttpRequest();
        xhr.open( "PUT", "https://www.googleapis.com/blogger/v3/blogs/"+blogID+"/posts/"+postID, true );
        xhr.setRequestHeader( "Content-Type", "application/json" );
        xhr.setRequestHeader( "Authorization", "Bearer " + getGoogleAccessToken() );
        xhr.onreadystatechange = function(e) {
            if ( xhr.readyState == 4 ) {
                if( xhr.status == 200 ) {
                    // __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    __console().log( e+ " / " + xhr.readyState + " / " + xhr.status  );
                    var data = __JSON.parse( xhr.responseText );
                    __console().log( data );
                    callback( true, data );
                } else {
                    __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    callback( false, data );
                }
            }
        };

        var data = {
          "kind": "blogger#post",
          "id" : postID,
          "blog": {
            "id": blogID,
          },
          /* "customMetaData" : __JSON.stringify( { "description":"HELLO WORLD!", "permalink":"helloWorld!", } ), */
          "title": formatTitle( "mixi日記 - ", diary /*TODO*/ ),
          "content": formatDiary( diary, diaryHeaderList, "\n", null, null, null ),
          /* "content": "With <b>exciting</b> content...", */
          /* "url": "http://oka-ats-archive.blogspot.com/2013/02/hello-world.html", */
        }
        var stringData = __JSON.stringify( data );
        __console().log( "uploadDiary2" );
        __console().log( stringData )
        xhr.send( stringData );
    }

    function uploadDiary( diaryHeader, /*array of CMixiDiaryHeader&&CMixiDiaryOutputURL*/ diaryHeaderList , /* (function( boolean status, CBloggerAtom data )) */ callback, blogID ) {
        // var diaryID = diaryObjToDiaryID( diaryHeader );
        // var diaryID = urlToDiaryID( diaryHeader.url );
        var settingObject = exportDialogSetting();
        var filenamePrefix = settingObject.prefix;

        var diaryID = diaryHeader.diaryID;
        var diary = getMixiDiaryFromStorage( diaryID );
        var id = getUserID();
        var xhr = new XMLHttpRequest();
        xhr.open( "POST", "https://www.googleapis.com/blogger/v3/blogs/"+blogID+"/posts/", true );
        xhr.setRequestHeader( "Content-Type", "application/json" );
        xhr.setRequestHeader( "Authorization", "Bearer " + getGoogleAccessToken() );
        xhr.onreadystatechange = function(e) {
            if ( xhr.readyState == 4 ) {
                if( xhr.status == 200 ) {
                    // __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    __console().log( e+ " / " + xhr.readyState + " / " + xhr.status  );
                    var data = __JSON.parse( xhr.responseText );
                    __console().log( data );
                    uploadDiary2( callback, blogID, data.id, diary, diaryHeaderList, filenamePrefix );
                } else {
                    __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    callback( false, data );
                }
            }
        };
        var data = {
          "kind": "blogger#post",
          "blog": {
            "id": blogID,
          },
          "title": createDiaryFilename( diary.diaryID, getTimeCreated( diary ) , filenamePrefix, '' ),
          "content": ".",
          /* "url": "http://oka-ats-archive.blogspot.com/2013/02/hello-world.html", */
        }
        __console().log( blogID );
        var stringData = __JSON.stringify( data );
        __console().log( "uploadDiary1" );
        __console().log( stringData )
        xhr.send( stringData );
    }

    function fetchMixiUserID( callback ) {
        var xhr = new XMLHttpRequest();
        xhr.open( "GET", "https://mixi.jp/" );
        xhr.onreadystatechange = function(e) {
            // __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
            if ( xhr.readyState == 4 ) {
                if( xhr.status == 200 ) {
                    __console().log( e+ " / " + xhr.readyState + " / " + xhr.status  );
                    var d = new DOMParser().parseFromString( xhr.responseText, "text/html" );
                    var pn = d.getElementsByClassName( "personalNavigation" );

                    // not logged in
                    if ( pn.length == 0 ) {
                        callback( false );
                        return;
                    }
                    var url = pn[0].getElementsByClassName("profile")[0].firstChild.href;
                    __console().log( "url",url );
                    var sobj = searchToObject( url );
                    var mixiUserID = sobj.id;
                    // search user name.
                    var mixiUserName = d.getElementById("myArea").getElementsByClassName( "name" )[0].firstChild.firstChild.textContent.replace( /さん[(0-9)]*$/g, "" );
                    __console().log( "mixiUserID=" + mixiUserID + " mixiUserName=" + mixiUserName );
                    callback( true, mixiUserID, mixiUserName );
                } else {
                    __console().log( e+ " / " + xhr.readyState + " / " + xhr.status + " / " + xhr.responseText );
                    callback( false, null );
                }
            }
        };
        xhr.send();
    };

    function getSelectedMixiBBS() /* : CMixiUserInfo */ {
        var sel = controlPanel.document.getElementById( "selectBBS" );
        if (sel.selectedIndex < 0 ) {
            return null;
        }
        var val = sel.options[ sel.selectedIndex ].value || 'null';
        try {
            return __JSON.parse( val );
        } catch ( e ) {
            __console().error(e,val);
            throw e;
        }
    }
    function setSelectedMixiBBS( /* CMixiUserInfo */ mixiUserInfo ) {
        try {
            // selectByID( controlPanel.document.getElementById( "selectBBS" ), function( value ) { return __JSON.parse( value ).url == mixiUserInfo.url } );
            selectByID( controlPanel.document.getElementById( "selectBBS" ), function( value ) { return __JSON.parse( value ).mixiUserID == mixiUserInfo.mixiUserID } );
        } catch (e) {
            __console().trace();
            __console().error(e);
        }
    }

    function getSelectedMixiDiaryHeader() {
        var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
        return __JSON.parse( sel.options[ sel.selectedIndex ].value );
    }

    function getSelectedBlog() {
        var sel = controlPanel.document.getElementById( "bloggerBlogID" );
        return __JSON.parse( sel.options[ sel.selectedIndex ].value );
    }
    function getSelectedBlogID() {
        var sel = controlPanel.document.getElementById( "bloggerBlogID" );
        return __JSON.parse( sel.options[ sel.selectedIndex ].value ).id;
    }
    function setSelectedBlogID( id ) {
        __console().log( "setSelectedBlogID : " +  id );
        if ( id == null ) {
            return;
        }
        var sel = controlPanel.document.getElementById( "bloggerBlogID" );
        for ( var i=0; i<sel.options.length;i++ ) {
            if ( __JSON.parse(sel.options[i].value).id == String(id) ) {
                sel.selectedIndex = i;
                return;
            }
        }
        sel.selectedIndex = 0;
        return sel.options[ sel.selectedIndex ].value;
    }

    function updateDiaryHeaderList( diaryHeaderList ) {
        for ( var i=0; i< diaryHeaderList.length; i++ ) {
            if ( false ) { // diaryHeaderList[i].timeModified != null && diaryHeaderList[i].timeCreated != null ) {
                continue;
            } else {
                var diary = getMixiDiaryFromStorage( diaryHeaderList[i].diaryID );
                if ( diary != null ) {
                    diaryHeaderList[i].timeCreated  = getTimeCreated( diary );
                    diaryHeaderList[i].timeModified = getTimeModified( diary );
                }
            }
        }
    }
    function sortHeader( mixiUserInfo, value ) {
        __console().log( value );
        var diaryHeaderList = getMixiDiaryHeaderList( mixiUserInfo );
        updateDiaryHeaderList( diaryHeaderList );

        var sortFunc = null;
        if ( value.sort == 'created' ) {
            if ( value.order == 'pastNow' ) {
                sortFunc = function(a,b) {
                    var aa = getTimeCreated( a );
                    var bb = getTimeCreated( b );
                    return aa<bb ? -1 : bb<aa ? 1 : 0;
                };
            } else /* if ( value.order == 'nowPast' ) */ {
                sortFunc = function(a,b) {
                    var aa = getTimeCreated( a );
                    var bb = getTimeCreated( b );
                    return aa<bb ? 1 : bb<aa ? -1 : 0;
                };
            }
        } else if ( value.sort == 'modified' ) {
            if ( value.order == 'pastNow' ) {
                sortFunc = function(a,b) {
                    var aa = getTimeModified( a );
                    var bb = getTimeModified( b );
                    return aa<bb ? -1 : bb<aa ? 1 : 0;
                };
            } else /* if ( value.order == 'nowPast' ) */ {
                sortFunc = function(a,b) {
                    var aa = getTimeModified( a );
                    var bb = getTimeModified( b );
                    return aa<bb ? 1 : bb<aa ? -1 : 0;
                };
            }
        } else {
            throw new Error();
        }
        // __console().log( sortFunc );
        diaryHeaderList.sort( sortFunc );
        setMixiDiaryHeaderList( mixiUserInfo, diaryHeaderList );
        updateMixiDiaryList('all');
    }

    /* EXPORT_DIALOG START */
    function exportDialogScreenToObject(){
        var settingObject = {
            showCommentUserName : controlPanel.document.getElementById( "dialogPaneShowCommentUserName" ).checked,
            showCommentUserURL  : controlPanel.document.getElementById( "dialogPaneShowCommentUserURL" ).checked,
            template            : controlPanel.document.getElementById( "dialogPaneTemplateString" ).value,
            prefix              : controlPanel.document.getElementById( "dialogPanePrefixFileName" ).value,
        };
        return settingObject;
    }
    function exportDialogObjectToScreen( settingObject ){
        controlPanel.document.getElementById( "dialogPaneShowCommentUserName" ).checked = settingObject.showCommentUserName;
        controlPanel.document.getElementById( "dialogPaneShowCommentUserURL" ).checked  = settingObject.showCommentUserURL ;
        controlPanel.document.getElementById( "dialogPaneTemplateString" ).value        = settingObject.template ;
        controlPanel.document.getElementById( "dialogPanePrefixFileName" ).value        = settingObject.prefix;
    }
    function exportDialogShow() {
        controlPanel.document.getElementById( "dialogPane" ).style.display = 'block';
        controlPanel.document.getElementById( "pbarPane" ).style.display = 'block';
    }
    function exportDialogHide() {
        controlPanel.document.getElementById( "dialogPane" ).style.display = 'none';
        controlPanel.document.getElementById( "pbarPane" ).style.display = 'none';
    }
    function exportDialogSetting( mixiUser, settingObject ) {
        if ( mixiUser == undefined ) {
            var sel = controlPanel.document.getElementById("selectBBS");
            mixiUser  /*CMixiUserInfo*/ = __JSON.parse( sel.options[ sel.selectedIndex ].value );
        }

        var exportDialogCurrentID = LS_MIXI_DIARY_TEMPLATE.replace( MIXI_USER_ID, mixiUserTypeToID( mixiUser.mixiUserType ) + mixiUser.mixiUserID ) ;
        if ( settingObject == undefined ) { 
            settingObject =  __JSON.parse( __localStorage.getItem( exportDialogCurrentID ) || 'null' );
            if ( settingObject == null ) {
                settingObject = {
                    showCommentUserName : false,
                    showCommentUserURL : true,
                    template : "<DIARYTEXT/>", 
                    prefix : "diary-",
                };
            }
            return settingObject;
        } else {
            __localStorage.setItem( exportDialogCurrentID , __JSON.stringify( settingObject ) );
        }
    }
    function exportDialogOpen() {
        var sel = controlPanel.document.getElementById("selectBBS");
        var mixiUser  /*CMixiUserInfo*/ = __JSON.parse( sel.options[ sel.selectedIndex ].value );
        var settingObject = exportDialogSetting( mixiUser );
        exportDialogObjectToScreen( settingObject );
        exportDialogShow();
    }
    function exportDialogOKProc() {
        var sel = controlPanel.document.getElementById("selectBBS");
        var mixiUser  /*CMixiUserInfo*/ = __JSON.parse( sel.options[ sel.selectedIndex ].value );
        exportDialogSetting( mixiUser, exportDialogScreenToObject() ); 
        exportDialogHide();
    }
    function exportDialogCancelProc() {
        exportDialogHide();
    }
    /* EXPORT_DIALOG END */



    var defaultStyle = [
        '.body { width : 800px;}                              ',
        '.diary {                                             ',
        '    width : 500px;                                   ',
        ' }                                                   ',
        ' #diaryOrigin {                                      ',
        '     margin : 0px 0px 0px 0px;                       ',
        '     display: block;                                 ',
        ' }                                                   ',
        ' .diaryHeader {                                      ',
        '     border : 1px solid rgb(255,195,86);             ',
        '     background : rgb(255,237,199);                  ',
        '     border-bottom : 0px;                            ',
        '     padding : 5px;                                  ',
        '     font-size : smaller;                            ',
        ' }                                                   ',
        ' .diaryTitle {                                       ',
        '     display : inline;                               ',
        '     float : left;                                   ',
        '     font-size : normal;                             ',
        ' }                                                   ',
        ' .diaryDate {                                        ',
        '     text-align:right;                               ',
        '     font-size : normal;                             ',
        ' }                                                   ',
        '.diaryImages {                                       ',
        '    border : 0px;                                    ',
        '    padding : 0px;                                   ',
        '    margin : 0px;                                    ',
        '    text-align : center;                             ',
        '}                                                    ',
        '.diaryImage {                                        ',
        '    max-width : 120px;                               ',
        '    max-height : 120px;                              ',
        '    margin : 5px 20px 20px 5px;                      ',
        '    cursor : pointer;                                ',
        '}                                                    ',
        '.diaryCommentImages {                                ',
        '    border : 0px;                                    ',
        '    padding : 0px;                                   ',
        '    margin : 0px;                                    ',
        '    text-align : center;                             ',
        '}                                                    ',
        '.commentImage {                                      ',
        '    max-width : 120px;                               ',
        '    max-height : 120px;                              ',
        '    margin : 5px 20px 20px 5px;                      ',
        '    cursor : pointer;                                ',
        '}                                                    ',
        '.diaryText {                                         ',
        '    border : 1px solid rgb(255,195,86);              ',
        '    margin : 0px;                                    ',
        '    padding : 15px;                                  ',
        '    font-size : smaller;                             ',
        '}                                                    ',
        '.diaryComment {                                      ',
        '    border : 1px solid rgb(255,195,86);              ',
        '    padding : 0px;                                   ',
        '    margin : 20px 0px 0px 0px;                       ',
        '}                                                    ',
        '.diaryCommentHeader {                                ',
        '    border : 0px;                                    ',
        // '    padding : 3px 20px 3px 20px;                     ',
        '    padding : 4px 10px 4px 10px;                      ',
        '    margin : 0px 0px 0px 0px;                        ',
        '    font-size : smaller;                             ',
        '    font-weight : bolder;                            ',
        '    background-color : rgb( 255,209,122 );           ',
        '}                                                    ',
        '.diaryCommentRow {                                   ',
        '    border : 1px solid #eee;                         ',
        '    border-bottom : 0px;                             ',
        '    border-top : 0px;                                ',
        '    padding : 0px 0px 20px 0px;                      ',
        '    margin : 0px;                                    ',
        '    font-size : smaller;                             ',
        '    font-weight : normal;                            ',
        '}                                                    ',
        '.diaryCommentTitle {                                 ',
        '    border : 0px;                                    ',
        '    padding : 4px 10px 4px 10px;                     ',
        '    margin : 0px 0px 0px 0px;                        ',
        '    font-size : normal;                              ',
        '    font-weight : normal;                            ',
        '    border-top : 1px solid rgb(255,195,86);          ',
        // '    background-color : rgb( 255,209,122 );        ',
        '    background-color : rgb( 255,239,182 );           ',
        '}                                                    ',
        '.diaryCommentText {                                  ',
        '    border : 0px;                                    ',
        '    border-top : 0px solid #eee;                     ',
        '    padding : 5px 0px 0px 5px;                       ',
        '    margin : 0px 0px 0px 0px;                        ',
        '    font-size : normal;                              ',
        '    font-weight : normal;                            ',
        '    background-color : #fff;                         ',
        '}                                                    ',
        '.diaryCommentSeparator {                             ',
        // '    border-bottom : 1px dashed #888;                 ',
        // '    border-bottom : 1px solid rgb(255,195,86);       ',
        '    margin : 10px 50x 10px 0px;                      ',
        '}                                                    ',
        '.diaryCommentFooter {                                ',
        '}                                                    ',
    ];
    for ( var i=0; i<defaultStyle.length; i++ ) {
        defaultStyle[i] = defaultStyle[i].trim();
    }
    defaultStyle = defaultStyle.join( "\n" );

    /*
     * *********** CREATE THE MAIN CONTROL PANEL **********************************************************************************************
     */
    function onSelectMixiUserChange() {
        var mixiUser = getSelectedMixiUser(); 
        var bbsList = getMixiBBSList( mixiUser.mixiUserID );
        updateMixiBBSList( bbsList, mixiUser );
        var bbsInfo /*CMixiUserInfo*/ = getSelectedMixiBBS();
        if ( bbsInfo != null ) {
            setSelectedMixiBBS( bbsInfo );
        }
        controlPanel.document.getElementById( "selectBBS" ).selectedIndex = 0;
        updateMixiDiaryList('all');
        updateEditTemplateButton();
    }

    function initControlPanel(__controlPanel) {
        controlPanel = __controlPanel;
        controlPanel.document.getElementById( "selectMixiUser" ).addEventListener( "change", function() {
            onSelectMixiUserChange();
        });
        controlPanel.document.getElementById("reloadMixiUserButton").addEventListener( "click", function() {
            if ( confirm( "マイミク一覧をリロードします" ) ) {
                (function() {
                    fetchMixiListFriends( function( status, friends ) {
                        displayMixiListFriends( friends );
                        setMixiListFriends( getMixiLoginUser().mixiUserID, friends );
                    });
                })();
            } else {
            }
        });

        var fetchMixiDiaryListCancel=null;;
        controlPanel.document.getElementById("fetchBbsListButton").addEventListener( "click", function() {
            // if ( confirm( "コミュ／日記筆者の一覧をダウンロードします。" ) ) 
            if ( true ) {
                (function() {
                    start();
                    function start() {
                        var mixiUser =  getSelectedMixiUser();
                        var mixiUserID = mixiUser.mixiUserID;
                        var mixiUserName = mixiUser.mixiUserName;
                        fetchMixiBBSList( mixiUserID, onDoneFetchBbsList );
                    }
                    function onDoneFetchBbsList( status, /*CMixiUserInfo[]*/ bbsList ) {
                        __console().log( "bbsList" );
                        __console().log( bbsList );

                        var mixiUser =  getSelectedMixiUser();
                        setMixiBBSList( mixiUser.mixiUserID, bbsList );
                        updateMixiBBSList( bbsList, mixiUser );
                        // updateMixiDiaryList('all');
                        // fetchMixiDiaryListCancel = null;
                    }
                })();
            } else {
            }
        });
        controlPanel.document.getElementById("selectBBS").addEventListener( "change", function(){
            // var sel = controlPanel.document.getElementById("selectBBS");
            // __console().log( sel.options[ sel.selectedIndex ] );
            updateMixiDiaryList('all');
            updateEditTemplateButton();
        });


        controlPanel.document.getElementById("editTemplate").addEventListener( "click", function(){
            exportDialogOpen();
        });
        controlPanel.document.getElementById("dialogPaneOKButton").addEventListener( "click", function(){
            exportDialogOKProc();
        });
        controlPanel.document.getElementById("dialogPaneCancelButton").addEventListener( "click", function(){
            exportDialogCancelProc();
        });
        controlPanel.document.getElementById("fetchMixiDiaryHeaderButton").addEventListener( "click", function() {
            if ( confirm( "日記一覧をダウンロードします。" ) ) {
                // var mixiUser = getMixiLoginUser();
                // fetchMixiDiaryListCancel = fetchMixiDiaryHeader01( controlPanel, mixiUser.mixiUserID, function( status, diaryHeaderList ) {
                //     setMixiDiaryHeaderList( mixiUser.mixiUserID, diaryHeaderList );
                //     updateMixiDiaryList('all');
                //     fetchMixiDiaryListCancel = null;
                // });
                // var mixiUser = getSelectedMixiUser();

                var mixiUserInfo = getSelectedMixiBBS();
                fetchMixiDiaryListCancel = fetchMixiDiaryHeader( mixiUserInfo, function( status, diaryHeaderList ) {
                    __console().trace();
                    __console().log("fetchMixiDiaryHeader.callback","status=",status, "diaryHeaderList", diaryHeaderList );
                    __console().log( "fetchMixiDiaryHeader.callback(1)" );
                    setMixiDiaryHeaderList( mixiUserInfo, diaryHeaderList );
                    __console().log( "fetchMixiDiaryHeader.callback(2)" );
                    updateMixiDiaryList('all');
                    __console().log( "fetchMixiDiaryHeader.callback(3)" );
                    fetchMixiDiaryListCancel = null;
                    __console().log( "fetchMixiDiaryHeader.callback(4)" );
                });
            } else {
            }
        });
        // controlPanel.document.getElementById("interruptButton").addEventListener( "click", function() {
        //     controlPanel.cont=false;
        //     if ( fetchMixiDiaryListCancel != null ) {
        //         fetchMixiDiaryListCancel.cancel();
        //     }
        // });
        controlPanel.document.getElementById("mixiDiaryIDListFilter").addEventListener( "change", function() {
            var sel = controlPanel.document.getElementById( "mixiDiaryIDListFilter" );
            updateMixiDiaryList( sel.options[ sel.selectedIndex ].value );
        });
        function countSelection(){
            var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
            var c = 0;
            for ( var i=0; i<sel.options.length; i++ ) {
                if ( sel.options[i].selected ) {
                    c++;
                }
            }
            updateCountStatuxBox(undefined,undefined,c);
        }
        controlPanel.document.getElementById("selectMixiDiaryList").addEventListener( "change", function() {
            countSelection();
        });
        controlPanel.document.getElementById("selectAll").addEventListener( "click", function() {
            var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
            for ( var i=0; i<sel.options.length; i++ ) {
                sel.options[i].selected = true;
            }
            countSelection();
        });
        controlPanel.document.getElementById("inverseSelection").addEventListener( "click", function() {
            var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
            for ( var i=0; i<sel.options.length; i++ ) {
                sel.options[i].selected = ! sel.options[i].selected;
            }
            countSelection();
        });
        // controlPanel.document.getElementById("countSelection").addEventListener( "click", function() {
        //     var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
        //     var c = 0;
        //     for ( var i=0; i<sel.options.length; i++ ) {
        //         if ( sel.options[i].selected ) {
        //             c++;
        //         }
        //     }
        //     alert( "選択数:" +c );
        // });

        // controlPanel.document.getElementById("testButton").addEventListener( "click", function() {
        //     // var smpleImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABOklEQVQ4jZ2QTWoCMRiGsyi6GbxGV+LKe4z0HiPBI/QAQWeRM1iINR/0DlFRmoDpCYTSLuKihdm9XdiEjmNhdPEsQt7v+X4YAJALeA3fV0EuAAAYuYDPr+omyIWT4O2juonWAnIBl3JJ8Hev83uQC+iOpuiOphBkG3+MjMPqUGF1qCCNR1Zo9LmGNB6rQ4U+1+hNFuiM18gKDUE25ck4sBiMZIXG/eMGWaGRl5v0jgzLHQRZkAuQxp8EL+9VgiuL3mRRKzrn7uEZguxlgTQew3L3b3GcIGaZND4dL8KVTeFzuLIpVxPk5SbR5xqd8RqD+b5G/rSvNZLGg8WDxM7DctcoHMz3KJbHxqSC7Ekgja8x2wYUyyMmJmC2DY3/iCALxlVT0BaufgVxn2uIKzMA4MqCKwtB7Yh5APgBDCs2BKDmlEkAAAAASUVORK5CYII="
        //     // var img = dataURLToBlob( smpleImage );
        //     // uploadPicasaImage( img, "5840429833590676961" );
        //     // createPicasaAlbum( { title:"hello"} );
        //     // fetchPicasaAlbums();
        // });
        controlPanel.document.getElementById("login").addEventListener( "click", function() {
            startLogin();
        });
        controlPanel.document.getElementById("loginRefresh").addEventListener( "click", function() {
            startRefresh( function() {
            });
        });
        controlPanel.document.getElementById("clearButton").addEventListener( "click", function() {
            if ( confirm( "日記一覧を全て削除します。宜しいですか？" ) ) {
                if ( confirm( "間違いはありませんか？ これまでダウンロードした日記データは、全て削除されます。本当に、宜しいですか？" ) ) {
                    alert( "まだ実装されていません。処理は実行されませんでした。" );
                }
            }
        });
        // controlPanel.document.getElementById("interruptButton").addEventListener( "click", function(){
        // });

        /* Usage : diaryLoop( executeMethod, additionalArgument0, additionalArgument1, ... ) */
        function diaryLoop(
            executeDiary /*:function( diaryHeader:CMixiDiaryHeader, callback:function(diary:CMixiDiary) )*/,
            doneDiary    /*:function(CMixiDiary)*/,
            doneLoop     /*:function()*/ ) 
        {
            progressEnter();

            var index = -1;
            var diaryHeaderList /*CMixiDiaryHeader[]*/ = [];
            var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
            for ( var i=0; i<sel.options.length; i++ ) {
                if ( sel.options[i].selected ) { 
                    // diaryObj : urlToDiaryObj( sel.options[i].value ),
                    diaryHeaderList.push( __JSON.parse( sel.options[i].value ) );
                }
            }


            __console().log('diaryHeaderList' );
            __console().log( diaryHeaderList );
            var donelist = {};
            progressMax( diaryHeaderList.length );

            var lastTime  = new Date().getTime();
            loop();
            function loop() {
                index++;
                __console().log( 'index=' + index + " / diaryHeaderList.length= " + diaryHeaderList.length );
                if ( index < diaryHeaderList.length ) {
                    execLoop();
                } else if ( index == diaryHeaderList.length ) {
                    __console().trace();
                    __console().log( 'done loop', 'index', index, 'diaryHeaderList.length', diaryHeaderList.length );
                    progressLeave();
                    doneLoop();
                }
                function execLoop() {
                    if ( index % 16 == 0 ) {
                        callDiaryAfterRefresh();
                    } else {
                        callDiary();
                    }
                }
                function callDiaryAfterRefresh() {
                    __console().log( "starting periodical refresh...(" + index + ")" );
                    startRefreshToken( function () { __console().log( "end periodical refresh.(" + index + ")" ) ; callDiary() } );
                }
                function callDiary() {
                    updateSelect();
                    executeDiary( diaryHeaderList[ index ] ,diaryHeaderList,  callback );
                }
                function updateSelect() {
                    progressValue( index );
                    var url = diaryHeaderList[index].url;
                    for ( var i=0; i<sel.options.length; i++ ) {
                        if ( __JSON.parse( sel.options[i].value ).url == url ) {
                            sel.selectedIndex = i;
                            break;
                        }
                    }
                }
                function callback( /*CMixiDiary*/ diary ) {
                    if ( donelist[ diary.diaryID ] == true ) {
                        return;
                    }
                    donelist[ diary.diaryID ] = true;
                    var now  = new Date().getTime();
                    var t = MIXI_DOWNLOAD_THREASHOLD - ( now - lastTime );
                    if ( t < 0 ) { t = 0 }
                    __console().log( "callback t=" , t );
                    setTimeout( function() {
                        // __console().log( diary );
                        doneDiary( diary );
                        loop();
                    }, t );
                    lastTime  = new Date().getTime();
                };
            }
        }

        // controlPanel.document.getElementById("uploadSelected").addEventListener( "click", function(){
        //     var blogID = getSelectedBlogID();
        //     var diaryFilenameListener = createDiaryFilenameListener01( getSelectedBlog().url );
        //     updateMixiDiaryList('selected');
        //     diaryLoop( executeDiary, doneDiary , doneLoop );
        //     function executeDiary( diaryHeader/*:CMixiDiaryHeader*/, diaryHeaderList/*:CMixiDiaryHeader[]*/, callback/*:function(diary:CMixiDiary)*/  ) {
        //         uploadDiary( diaryHeader, diaryHeaderList, callback, blogID, blogURL );
        //     }
        //     function doneDiary( /*CMixiDiary*/diary ) {
        //     }
        //     function doneLoop() {
        //         setTimeout( function() {
        //             alert( "終了しました。" );
        //             // updateMixiDiaryList('yet');
        //             updateMixiDiaryList('ready');
        //         }, 100 );
        //     }
        // });

        controlPanel.document.getElementById("selectSort").addEventListener( "change", function() {
            var sel = controlPanel.document.getElementById("selectSort");
            var value = __JSON.parse( sel.options[ sel.selectedIndex ].value );
            setTimeout( function() {
                sel.selectedIndex = 0;
                sortHeader( getSelectedMixiBBS(), value );
            }, 1000  );
        });
        controlPanel.document.getElementById("downloadSelected").addEventListener( "click", function() {
            updateMixiDiaryList('selected');
            diaryLoop( executeDiary, doneDiary, doneLoop );
            function executeDiary( diaryHeader, diaryHeaderList, callback ) {
                fetchMixiDiary( diaryHeader, callback );
            }
            function doneDiary( diary ) { 
                putMixiDiaryOnStorage( diary ); 
            }
            function doneLoop() {
                setTimeout( function() {
                    alert( "終了しました。" );
                    updateMixiDiaryList('ready');
                }, 100 );
            }
        });

        // Components.utils.import("resource://gre/modules/FileUtils.jsm");
        // function nameToPath( name ) {
        //     return file;
        // }

        // new
        controlPanel.document.getElementById("viewSelectedAsFile").addEventListener( "click", function(){
            var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
            var diaryHeaderList = [];
            for ( var i=0; i<sel.options.length; i++ ) {
                if ( sel.options[i].selected ) { 
                    // diaryHeaderList.push( diaryObjToDiaryID( urlToDiaryObj( sel.options[i].value ) ) );
                    __console().log( "sel.options["+i+"].value" , sel.options[i].value );
                    diaryHeaderList.push( __JSON.parse( sel.options[i].value ) );
                    // break;
                }
            }
            __console().log( "getMixiDiaryFromStorage(1)", diaryHeaderList );

            if ( diaryHeaderList.length == 0 ) {
                alert( "日記を選択して下さい。" );
                return;
            }

            var mixiUser = getSelectedMixiBBS();

            // if ( 1 < diaryHeaderList.length ) {
            //     if ( ! confirm( "複数の日記が選択されています。表示しても宜しいですか？" ) ) {
            //         return;
            //     }
            // }

            var settingObject = exportDialogSetting();
            var filenamePrefix = settingObject.prefix;

            var diaryFilenameListener = createDiaryFilenameListener02( filenamePrefix, '.html' );

            // initialize diary header list
            initiateDiaryHeaderList( diaryFilenameListener, diaryHeaderList );

            var pathToIndexFile=null;
            var indexFileName = filenamePrefix + "index.html";
            {
                var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance( Components.interfaces.nsIFileOutputStream );
                // var file = FileUtils.getFile( "Home", ["mixitrans"], true );
                var file = FileUtils.getFile( "ProfD", ["mixitrans"], true );
                file.append( indexFileName );
                // use 0x02 | 0x10 to open file for appending.  
                foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);   
                var coStream = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance( Components.interfaces.nsIConverterOutputStream );
                coStream.init(foStream, "UTF-8", 0, 0);  
                coStream.writeString( "<html>" );
                coStream.writeString( "<head>" );
                coStream.writeString( "<title>" );
                coStream.writeString( mixiUser.mixiUserName + " もくじ" );
                coStream.writeString( "</title>" );
                coStream.writeString( "<style>" );
                coStream.writeString( "</style>" );
                coStream.writeString( "</head>" );
                coStream.writeString( "<body>" );
                coStream.writeString( "<div class='body'>" );
                coStream.writeString( formatIndex( diaryHeaderList ) );
                coStream.writeString( "</div>" );
                coStream.writeString( "</body>" );
                coStream.writeString( "</html>" );
                coStream.close(); // this closes foStream  

                var w = openNew();
                w.location.replace( "file://"+file.path );
                pathToIndexFile = './'+ indexFileName;
            }


            for ( var i=0; i<diaryHeaderList.length; i++ ) {
                try {
                    var diary = getMixiDiaryFromStorage( diaryHeaderList[i].diaryID )
                    if ( diary == null ) {
                        // __console().error( "could not find specified diary",diaryHeaderList[i], "diaryHeaderList",diaryHeaderList  );
                        throw "could not find specified diary "+ __JSON.stringify( diaryHeaderList[i] );
                    }
                    var fileName = extractFilename( diaryHeaderList[i].outputURL, false );

                    // file is nsIFile, data is a string  
                    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance( Components.interfaces.nsIFileOutputStream );
                    // var file = FileUtils.getFile( "Home", ["mixitrans"], true );
                    var file = FileUtils.getFile( "ProfD", ["mixitrans"], true );
                    file.append( fileName );
                    // use 0x02 | 0x10 to open file for appending.  
                    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);   
                    var coStream = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance( Components.interfaces.nsIConverterOutputStream );
                    coStream.init(foStream, "UTF-8", 0, 0);  

                    var formattedDiary = formatDiary( diary, diaryHeaderList, "" , settingObject, "もくじ", pathToIndexFile );
                    formattedDiary = settingObject.template.replace( /<DIARYTEXT\/>/g,  formattedDiary );
                    
                    coStream.writeString( "<html>" );
                    coStream.writeString( "<head>" );
                    coStream.writeString( "<title>" );
                    coStream.writeString( formatTitle( "mixi日記 - ", diaryHeaderList[i] ) );
                    coStream.writeString( "</title>" );
                    coStream.writeString( "<style>" );
                    coStream.writeString( defaultStyle );
                    coStream.writeString( "</style>" );
                    coStream.writeString( "</head>" );
                    coStream.writeString( "<body>" );
                    coStream.writeString( "<div class='body'>" );
                    coStream.writeString( formattedDiary );
                    coStream.writeString( "</div>" );
                    coStream.writeString( "</body>" );
                    coStream.writeString( "</html>" );
                    coStream.close(); // this closes foStream  

                    //var w = openNew();
                    //w.location.replace( "file://"+file.path );
                } catch ( e ) {
                    __console().error( e, e.stack );
                    if ( ! confirm( "エラーが発生しました。[" + e + "] 続行しますか？" ) ) {
                        return;
                    }
                }
            }

        });

        function selectSaveFile() {
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
            fp.init(window, "保存ファイルを選択", nsIFilePicker.modeSave);
            fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
            var rv = fp.show();
            if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
                var file = fp.file;
                // Get the path as string. Note that you usually won't 
                // need to work with the string paths.
                var path = fp.file.path;
                // work with returned nsILocalFile...
                return file;
            } else {
                return null;
            }
        }

        function test( data ){
            var file = selectSaveFile();

            // file is nsIFile, data is a string  
            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].  
                           createInstance(Components.interfaces.nsIFileOutputStream);  
              
            // use 0x02 | 0x10 to open file for appending.  
            foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);   

            // write, create, truncate  
            // In a c file operation, we have no need to set file mode with or operation,  
            // directly using "r" or "w" usually.  
              
            // if you are sure there will never ever be any non-ascii text in data you can   
            // also call foStream.write(data, data.length) directly  
            var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].  
                            createInstance(Components.interfaces.nsIConverterOutputStream);  
            converter.init(foStream, "UTF-8", 0, 0);  
            converter.writeString(data);  
            converter.close(); // this closes foStream  
        }



        controlPanel.document.getElementById("exportSelectedToBloggerAsFile").addEventListener( "click", function() {
            var sel = controlPanel.document.getElementById( "selectMixiDiaryList" );
            var diaryHeaderList = [];
            for ( var i=0; i<sel.options.length; i++ ) {
                if ( sel.options[i].selected ) { 
                    // diaryHeaderList.push( diaryObjToDiaryID( urlToDiaryObj( sel.options[i].value ) ) );
                    diaryHeaderList.push( __JSON.parse( sel.options[i].value ) );
                }
            }
            if ( diaryHeaderList.length == 0 ) {
                alert( "日記を選択して下さい。" );
                return;
            }


            __console().log( diaryHeaderList );
            // var titleHeader = prompt( "タイトルを入力して下さい。", "" );
            var titleHeader = "";
            var defaultCategory = "";
            if ( getSelectedMixiBBS().mixiUserType == 'mixiuser' ) {
                defaultCategory = getSelectedMixiBBS().mixiUserName + "のミクシ日記";
            } else {
                defaultCategory = getSelectedMixiBBS().mixiUserName;
            }

            var category = prompt( "カテゴリを入力して下さい。", defaultCategory );

            var baseURL = getSelectedBlog().url;
            if ( confirm( "対象となるサイト:\n" + baseURL + "\n" + "このサイトに対してデータを作成してもよろしいですか？" ) ) {
                console.log( "OK" );
            } else {
                alert( "中止しました。" );
                return;
            }

            var settingObject = exportDialogSetting();
            var filenamePrefix = settingObject.prefix;
            var diaryFilenameListener = createDiaryFilenameListener01( baseURL, filenamePrefix, '.html' );
            var file = selectSaveFile();

            if ( file == null ) {
                alert( "中止しました。" );
                return;
            }

            // file is nsIFile, data is a string  
            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].  
                           createInstance(Components.interfaces.nsIFileOutputStream);  
              
            // use 0x02 | 0x10 to open file for appending.  
            foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);   

            // write, create, truncate  
            // In a c file operation, we have no need to set file mode with or operation,  
            // directly using "r" or "w" usually.  
              
            // if you are sure there will never ever be any non-ascii text in data you can   
            // also call foStream.write(data, data.length) directly  
            var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].  
                            createInstance(Components.interfaces.nsIConverterOutputStream);  

            converter.init(foStream, "UTF-8", 0, 0);  
            // converter.writeString(data);  
            try {
                converter.writeString( [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
                    '<?xml-stylesheet href="http://www.blogger.com/styles/atom.css" type="text/css"?>',
                    '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:gd="http://schemas.google.com/g/2005" xmlns:georss="http://www.georss.org/georss" xmlns:openSearch="http://a9.com/-/spec/opensearchrss/1.0/" xmlns:thr="http://purl.org/syndication/thread/1.0">',
                        '<generator uri="http://www.blogger.com" version="7.00">Blogger</generator>',
                ].join("\n"));

                var arr2=[];
                var blogID = getSelectedBlogID();

                // initialize headers
                initiateDiaryHeaderList( diaryFilenameListener, diaryHeaderList );

                // create index page
                var pathToIndexFile=null;
                {
                    var postID = generatePostID();
                    var filename = filenamePrefix + "index";
                    var title = "もくじ (" + filename + ")";
                    var currentDate = new Date();
                    var publishedDate = currentDate;
                    var formattedDiary = formatIndex( diaryHeaderList ) ;

                    pathToIndexFile = baseURL + parseMonthDay( publishedDate ) + "/" + filename + ".html";

                    converter.writeString( [
                        '<entry>',
                            '<id>tag:blogger.com,1999:blog-'+blogID+'.post-'+postID+'</id>',
                            '<published>' + formatDateToISO8601( publishedDate ) + '</published>',
                            '<updated>' + formatDateToISO8601( publishedDate ) + '</updated>',
                            '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/blogger/2008/kind#post"/>',
                            '<category scheme="http://www.blogger.com/atom/ns#" term="'+category+'"/>',
                            '<title type="text">' + escapeHTML( title )+ '</title>',
                            '<content type="html">' + escapeHTML( formattedDiary ) + '</content>',
                            // '<internalFilename>' + filename + ".html" + '</internalFilename>',
                            '<link href="http://www.blogger.com/feeds/'+blogID+'/posts/default/'+postID+'" rel="edit" type="application/atom+xml"/>',
                            '<link href="http://www.blogger.com/feeds/'+blogID+'/posts/default/'+postID+'" rel="self" type="application/atom+xml"/>',
                            '<link href="'+ pathToIndexFile +'" rel="alternate" title="'+escapeHTML( title )+'" type="text/html"/>',
                            // '<thr:total>0</thr:total>',
                        '</entry>',
                        '',
                    ].join("\n") );
                }


                // create diary pages
                for ( var i=0; i<diaryHeaderList.length; i++ ) {
                    var postID = generatePostID();
                    var diary = getMixiDiaryFromStorage( diaryHeaderList[i].diaryID )
                    var filename = extractFilename( diaryHeaderList[i].outputURL, false );
                    var title = formatTitle( titleHeader, diaryHeaderList[i] );
                    var publishedDate = mixiDateToDate( getTimeCreated( diary ) );

                    var formattedDiary = formatDiary( diary, diaryHeaderList, "" ,settingObject , 'もくじ', pathToIndexFile );
                    formattedDiary = settingObject.template.replace( /<DIARYTEXT\/>/g,  formattedDiary );

                    converter.writeString( [
                        '<entry>',
                            '<id>tag:blogger.com,1999:blog-'+blogID+'.post-'+postID+'</id>',
                            '<published>' + formatDateToISO8601( publishedDate ) + '</published>',
                            '<updated>' + formatDateToISO8601( publishedDate ) + '</updated>',
                            '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/blogger/2008/kind#post"/>',
                            '<category scheme="http://www.blogger.com/atom/ns#" term="'+category+'"/>',
                            '<title type="text">' + escapeHTML( title )+ '</title>',
                            '<content type="html">' + escapeHTML( formattedDiary ) + '</content>',
                            // '<internalFilename>' + createDiaryFilename( diary.diaryID, diary.date, filenamePrefix,'' ) + ".html" + '</internalFilename>',
                            '<link href="http://www.blogger.com/feeds/'+blogID+'/posts/default/'+postID+'" rel="edit" type="application/atom+xml"/>',
                            '<link href="http://www.blogger.com/feeds/'+blogID+'/posts/default/'+postID+'" rel="self" type="application/atom+xml"/>',
                            '<link href="'+ diaryHeaderList[i].outputURL +'" rel="alternate" title="'+escapeHTML( title )+'" type="text/html"/>',
                            // '<thr:total>0</thr:total>',
                        '</entry>',
                        '',
                    ].join("\n") );
                }



                converter.writeString( [ 
                    '</feed>',
                ].join("\n") );
                alert( "保存しました。" );
            } catch (e){
                __console().trace();
                __console().error(e);
                __console().error(e.stack);
                alert( "エラーが発生しました。[" + e + "]" );
            }
            converter.close(); // this closes foStream  
        });

        controlPanel.document.getElementById("viewSelectedOnMixi").addEventListener( "click", function(){
            openNew( getSelectedMixiDiaryHeader().url );
        });
        controlPanel.document.getElementById("picasaAlbumID").addEventListener( "change", function(){
            // alert( getSelectedPicasaAlbum() );
        });

        // Preserve form status.
        controlPanel.addEventListener( 'beforeunload', function(e) {
            // __localStorage.setItem( "ats.accessToken", getGoogleAccessToken() );
            __localStorage.setItem( LS_ACCESS_TOKEN, getGoogleAccessToken() );
            // __localStorage.setItem( "ats.picasaAlbumID", getSelectedPicasaAlbum() );
            __localStorage.setItem( LS_PICASA_ALBUM_ID, getSelectedPicasaAlbum() );
            __localStorage.setItem( LS_BLOGGER_BLOG_ID, getSelectedBlogID() );
            __localStorage.setItem( LS_MIXI_SELECTED_BBS, __JSON.stringify( getSelectedMixiBBS() ) );

            __console().log( "save getSelectedPicasaAlbum: " + getSelectedPicasaAlbum() );
            __console().log( "save getSelectedBlogID: " + getSelectedBlogID() );
            // alert( getSelectedPicasaAlbum());
            // alert("aa");
        });

        // Restore form status.
        startRefresh( function() {
        });
        restoreMixiSelectionStatus();

        // var accessToken = __localStorage.getItem( LS_ACCESS_TOKEN );
        // // var accessToken = __localStorage.getItem( "ats.accessToken" );
        // __console().log( "accessToken: " + accessToken );
        // if ( accessToken == null ) {
        //     setGoogleAccessToken( "" );
        // } else {
        //     setGoogleAccessToken( accessToken );
        //     updateMixiDiaryList('all');
        // }
        updateMixiDiaryList('all');
    }

    function bootup() {
        var wm;
        if ( content.location.hostname == "mixi.jp" ) {
            wm = content;
            initMixiEvacuator( wm );
        } else  {
            wm = content.open("");
            setTimeout( function() {
                initMixiEvacuator( wm );
                wtmp.close();
            },5000 );
            // wm.addEventListener( 'load', function() {
            //     initMixiEvacuator( wm );
            //     wtmp.close();
            // })
            wm.location.replace( "http://mixi.jp/" );

            var wtmp = window.open(
                "data:text/html,<html><body><div style='position:absolute;text-align:center;border:0px solid silver; width:400px;height:50px; margin:-25px 0px 0px -200px; left:50%;top:50%'>mixiをロードしています。<br/>ロード完了までしばらくお待ちください。</div></body></html>",
                "",
                "status=no,location=no,menubar=no,innerWidth=400,innerHeight=300,resizable=no,");
        }
    }

    function getTimeModified( a ) {
        return a.timeModified || ( ( a.comments == null || a.comments.length == 0 ) ? ( a.timeCreated || a.date ) : a.comments[a.comments.length-1].date );
    }
    function getTimeCreated( a ) {
        return a.timeCreated || a.timeModified  || a.date;
    }


    /**
     * TYPE
     */
    var ltypes = [];

    /**
     * CDiaryID
     */
    // $1 cid (category id) : u=user / c=community
    // $2 oid (owner id)    : user/community id 
    // $3 pid (post id)     : diary/bbs id
    var CDiaryID_REGEXPSTR = '([uc])([0-9]+)_([0-9]+)';
    var CDiaryID_REGEXP = new RegExp( CDiaryID_REGEXPSTR, "" );
    ltypes.push({
        LNAME:'CDiaryID',
        LTYPEOF:'string',
        LPAT : CDiaryID_REGEXP,
    });


    /**
     * CMixiDiaryHeader
     */
    ltypes.push({
        LNAME : "CMixiDiaryHeader", 
        LTYPEOF:'object',
        LIS:["CMixiDiaryHeader"],
        LFIELDS : {
            type  : 'CMixiUserType' ,
            title : 'string', // "diary's title",
            timeCreated  : 'string||null', // "diary's date in Japanese",
            timeModified  : 'string||null', // "diary's date in Japanese",
            url   : "url", // URL to the diary
            diaryID : 'CDiaryID', // urlToDiaryID( url ),
            authorID : 'string', // this value is same as mixiUserID when it is a diary post, when it is a community post, the value is mixiUserID of user who opened the post.
            authorName : 'string', // this value is same as mixiUserID when it is a diary post, when it is a community post, the value is mixiUserID of user who opened the post.
            // owner_id  : 'any', // "owner_id/comm_id"
            // id        : 'any', // "id",
        },
    });

    /**
     * CMixiDiaryHeader
     */
    ltypes.push({
        LNAME : "CMixiDiaryOutputURL", 
        LTYPEOF:'object',
        LIS:["CMixiDiaryOutputURL","CMixiDiaryHeader"],
        LFIELDS : {
            outputURL:'string',
        },
    });


    ltypes.push({
        LNAME: "CMixiUserType",
        LTYPEOF: "string",
        LPAT : "^(mixiuser|mixicommunity)$",
    });

    ltypes.push({
        LNAME : "CMixiUserInfo",
        LTYPEOF:'object',
        LIS:[ 'CMixiUserInfo' ],
        LFIELDS : {
            mixiUserType : "CMixiUserType",
            mixiUserName : "string",
            mixiUserID   : "string",
        },
    });

    ltypes.push({
        LNAME : "CMixiUser",
        LTYPEOF:'object',
        LIS:[ 'CMixiUser', 'CMixiUserInfo' ],
        LFIELDS: {
            new_friend_diary:'null',
            nickname:"string",
            photo:"string", //"(url.jpg)", 
            member_count:"null||string||number", // "34", 
            photo_width:"null||string||number", // "57", 
            relation_id: "null||string||number", // null, 
            photo_height:"null||string||number",// "76",
            last_name:"any",
            tag_ids:"any",// null,
            lastlogin_level:"any",// "3",
            buddy:"any",// "0",
            member_id:"any", // "30892955",
            first_name:"any", // 
        },
    });

    ltypes.push({
        LNAME     : "CMixiDiary", 
        LIS       : [ "CMixiDiary", "CMixiDiaryHeader" ],
        LTYPEOF:'object',
        LFIELDS : {
            title     : 'any', // "diary's title",
            timeCreated  : 'string||null', // "diary's date in Japanese",
            timeModified  : 'string||null', // "diary's date in Japanese",
            url       : 'any', // "url",
            diaryID   : 'CDiaryID', // oneOf( CDiaryID ),
            // owner_id  : 'any', // "owner_id"
            // id        : 'any', // "id",
            direction :  { // obsolete
                next : 'string', // "url",
                prev : 'string', // "url",
            },
            images : "array of CMixiDiaryImage",
            text : 'any', //  "text",
            comments : {
                commentNo: 'any',
                date     : 'any', // "post date",
                userName : 'any', // "the post user's name",
                userURL  : 'any', // "URL to the user's profile",
                text     : 'any', // "comment text",
                iconURL  : 'any', // "URL to the user's icon file",
                iconData : 'any', // "dataURL to the user's icon file",
            },
        },
    });
    ltypes.push({
        LNAME     : "CMixiDiaryImage", 
        LIS       : [ "CMixiDiaryImage" ],
        LTYPEOF:'object',
        LFIELDS : {
            src : 'any',// img.src, 
            data: "any", // dataURI
            filename : "any", 
            uploaded:'any',
            uploadedImages:"array of CMixiDiaryUploadedImage",  // the first element is always the largest full-size image file in the list and others are thumbnails.
        }
    });
    ltypes.push({
        LNAME     : "CMixiDiaryUploadedImage", 
        LTYPEOF   : 'object',
        LIS       : [ "CMixiDiaryUploadedImage", ],
        LFIELDS : {
            url  : 'any',// getAttribute( "url" ),
            height : 'any', // getAttribute( "height" ),
            width : 'any', // getAttribute( "width" ),
        },
    });

    // var lcast = lcompile( ltypes );
    var lcast = function( ltypedef, value ) {
        return value;
    };

    /*
    * ********************************* MAIN ***************************************************
    */
    var __DONT_UPLOAD_IMAGES_TO_PICASA = false;
    // var __window;
    var __localStorage = new DirectoryLocalStorage( 'ProfD', ['mixitrans'] );
    var controlPanel = null;
    // var console = content.console;
    var __JSON = {
        stringify:JSON_stringify,
        parse:JSON_parse,
    };
    function JSON_stringify(o) {
        try {
            return JSON.stringify(o,undefined,4);
        } catch ( e ) {
            __console().trace();
            __console().error(e);
        }
    }
    function JSON_parse(s) {
        try {
            return JSON.parse(s);
        } catch ( e ) {
            __console().trace();
            __console().error(e);
        }
    }

    var __console_of_dummy = {
        trace:function(){},
        log:function(){},
        warn:function(){},
        error:function(){},
        group:function(){},
        groupEnd:function(){},
    };
    function __console() {
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
            return __console_of_dummy;
        }
    }

    // var IS_EXTENSION = true;
    if ( (0,eval)( '(function() { try { return IS_EXTENSION } catch ( e ) { return null } })()') ) {
        __console().log( "true" );
    } else {
        __console().log( "false" );
        // mixitrans_start_bootup();
    }














// extractMixiCommunity( {
//     url : "",
//     diaryID : "c00000_00000",
// },content.document, function(d) {
//     content.console.log( __JSON.stringify( d, undefined, 4) );
// });




