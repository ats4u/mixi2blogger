/*
    dstorage.js 
    Alternative object of 'localStorage' for Firefox
    localStorage class which stores its data to file.

    Author :  Ats Oka (I'm from Japan)
    Website : http://ats.oka.nu/  https://github.com/ats4u
    mailto : ats.creativity@gmail.com
*/
Components.utils.import("resource://gre/modules/FileUtils.jsm");
var PERM777 = parseInt("0777",8);
DirectoryLocalStorage.prototype.nameToPath = DirectoryLocalStorage_nameToPath;
function DirectoryLocalStorage_nameToPath( name ) {
    // var file = FileUtils.getFile("Home", ["mixitrans"], true);
    // var file = FileUtils.getFile("ProfD", ["mixitrans"], true);
    var file = FileUtils.getFile( this.storagePathID, this.storagePathArray, true );
    var arr = encodeURIComponent( name ).split('.')
    for ( var i=0; i<arr.length; i++ ) {
        file.append( "_" + arr[i] );
    }
    if ( ! file.exists() ) {
        file.create(1,PERM777);
    }
    file.append( "DATA");
    return file;
}

function DirectoryLocalStorage( storagePathID, storagePathArray ) {
    if ( storagePathID == null || storagePathArray == null ) { 
        throw new Error( "Null Pointer Exception" );
    }
    this.storagePathID = storagePathID;
    this.storagePathArray = storagePathArray;
}

DirectoryLocalStorage.prototype.setItem = DirectoryLocalStorage_setItem;
function DirectoryLocalStorage_setItem(name,value) {
    // content.console.log( "setItem","name",name ,"value", value );
    var file = this.nameToPath( name );
    // var file = FileUtils.getFile("Home", ["mixitrans"], true);
    // var file = FileUtils.getFile("ProfD", ["mixitrans"], true);
    // file.append( "data_"+encodeURIComponent( name ) );
//    file.create(0, parseInt( '0555' ) );
    
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
    converter.writeString(value);  
    converter.close(); // this closes foStream  
}

DirectoryLocalStorage.prototype.getItem = DirectoryLocalStorage_getItem;
function DirectoryLocalStorage_getItem(name) {
    // content.console.log( "getItem","name",name );
    var file = this.nameToPath( name );
    // var file = FileUtils.getDir("Home", ["mixitrans"], true);
    // file.append( "data_"+encodeURIComponent( name ) );
    if ( ! file.exists() ) {
        return null;
    }

    var data = "";
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Components.interfaces.nsIFileInputStream);
    var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                  createInstance(Components.interfaces.nsIConverterInputStream);
    fstream.init(file, -1, 0, 0);
    cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
     
      var read = 0;
      var str = {};
      do {
        read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
        data += str.value;
      } while (read != 0);
    cstream.close(); // this closes fstream
    return data;
}
