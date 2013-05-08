/*
 * reprogress.js 
 * Recursively Re-entrant Progress Manager
 *
 * Written by Ats Okasan (I'm a Japanese)
 * http://ats.oka.nu/
 * ats.creativity@gmail.com
 * (20130331.043702+0700.ZVV7i4XU1o61cPX0qwQQYg)
 */

function Pro( set_value ) {
    this.set_value = set_value;
    this.pro_stack = [];
}
Pro.prototype.enter = __Pro_enter;
function __Pro_enter(pro_max) {
    if ( pro_max == undefined ) {
        pro_max = 1;
    }
    this.pro_stack.push( {pro_max:pro_max,pro_val:0} );
}
Pro.prototype.max = __Pro_max;
function __Pro_max(pro_max) {
    var e = this.pro_stack[ this.pro_stack.length -1 ];
    if ( pro_max == undefined ) {
        return e.pro_max;
    } else {
        if ( 0<pro_max ) {
            e.pro_max = pro_max;
            if ( e.pro_max < e.pro_val ) {
                e.pro_val = e.pro_max;
            }
            // this.set_value( __pro_calc( this.pro_stack ) );
        } else {
            // __console().warn( 'illegal value ignored. max=', pro_max );
        }
    }
}
Pro.prototype.leave= __Pro_leave;
function __Pro_leave() {
//    var e = this.pro_stack[ this.pro_stack.length -1 ];
//    e.pro_val = e.pro_max -1;
//    this.set_value( __pro_calc( this.pro_stack ) );
    this.pro_stack.pop();
}
Pro.prototype.value= __Pro_value;
function __Pro_value(pro_val) {
    var e = this.pro_stack[ this.pro_stack.length -1 ];
    if ( pro_val == undefined ) {
        return e.pro_val;
    } else {
        e.pro_val = pro_val < e.pro_max ? pro_val : e.pro_max; 
        if ( 0<e.pro_val ) {
            this.set_value( __pro_calc( this.pro_stack ) );
        }
    }
}
Pro.prototype.state= __Pro_state;
function __Pro_state() {
    return [].concat( this.pro_stack );
}
function __pro_calc(arr){
//    console.log( "__pro_calc",JSON.stringify( arr ) );
    var v=0;
    var denominator = 1;
    for ( var i=0; i<arr.length; i++ ) {
        denominator *= arr[i].pro_max;
    }
    var numerator=0;
    for ( var i=0; i<arr.length; i++ ) {
        var v = arr[i].pro_val;
        for ( var j=i+1; j<arr.length; j++ ) {
            v *= arr[j].pro_max;
        }
        numerator += v;
    }
//    console.log( numerator,denominator );
    return numerator/denominator;
}

// var pro = new Pro( function(v){ console.log(v) });
// pro.enter(10);
// for ( var i=0; i<10; i++ ) {
//     pro.value(i);
//     pro.enter(10);
//     for ( var j=0; j<10; j++ ) {
//         pro.value(j);
//     }
//     pro.leave();
// }
// pro.value(10);
// pro.leave();
// 
