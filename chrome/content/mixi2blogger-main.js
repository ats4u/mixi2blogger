
function openAndReuseOneTabPerURL(url) {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
  var browserEnumerator = wm.getEnumerator("navigator:browser");
 
  // Check each browser instance for our URL
  var found = false;
  while (!found && browserEnumerator.hasMoreElements()) {
    var browserWin = browserEnumerator.getNext();
    var tabbrowser = browserWin.gBrowser;
 
    // Check each tab of this browser instance
    var numTabs = tabbrowser.browsers.length;
    for (var index = 0; index < numTabs; index++) {
      var currentBrowser = tabbrowser.getBrowserAtIndex(index);
      if (url == currentBrowser.currentURI.spec) {
 
        // The URL is already opened. Select this tab.
        tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];
 
        // Focus *this* browser-window
        browserWin.focus();
 
        found = true;
        break;
      }
    }
  }
 
  // Our URL isn't open. Open it now.
  if (!found) {
    var recentWindow = wm.getMostRecentWindow("navigator:browser");
    if (recentWindow) {
      // Use an existing browser window
      recentWindow.delayedOpenTab(url, null, null, null, null);
    }
    else {
      // No browser windows are open, so open a new one.
      window.open(url);
    }
  }
}

function mixitrans_start_bootup() {
    // window.content.open( "chrome://mixi2blogger/content/mixi2blogger.html");
    openAndReuseOneTabPerURL( "chrome://mixi2blogger/content/mixi2blogger.html" );
}
function mixitrans_init() {
}
window.addEventListener( "load", mixitrans_init, false );

// var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
// init : function () {
//     gBrowser.addEventListener("load", function () {
//         var autoRun = prefManager.getBoolPref("extensions.linktargetfinder.autorun");
//         if (autoRun) {
//             linkTargetFinder.run();
//         }
//     }, false);
// },
