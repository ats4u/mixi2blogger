/*
    tloop.js 
    Written by Ats Okasan (I'm a Japanese)
    http://ats.oka.nu/
    ats.creativity@gmail.com
 */
        function tloop(o) {
            var i=0;
            var count = o.count;
            var next = ( function(){
                setTimeout( function() {
                    if ( count == undefined || i<count ) {
                        if ( o.loop(i++) == undefined ) {
                            next();
                        } else {
                            if ( o.done != undefined ) {
                                o.done();
                            }
                        }
                    } else {
                        if ( o.done != undefined ) {
                            o.done();
                        }
                    }
                }, o.period || 0 );
            });
            if ( o.init != undefined ) {
                o.init();
            }
            next();
        }

    // function tloop(o) {
    //     var i=0;
    //     var count = o.count;
    //     var next = ( function(){
    //         setTimeout( function() {
    //             if ( count == undefined || i<count ) {
    //                 if ( o.loop(i++) == undefined ) {
    //                     next();
    //                 }
    //             } else {
    //                 if ( o.done != undefined ) {
    //                     o.done();
    //                 }
    //             }
    //         }, o.period || 0 );
    //     });
    //     if ( o.init != undefined ) {
    //         o.init();
    //     }
    //     next();
    // }

