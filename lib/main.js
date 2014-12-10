/*---------------------------------------------------------------
 CONFIGURATION VARIABLES
 ---------------------------------------------------------------*/

const config = require("./config.js");

/*---------------------------------------------------------------
 DEFINITIONS
 ---------------------------------------------------------------*/


//IMPORTANT NOTE ABOUT SETTINGS: VALUES FROM THE ADDON SETTINGS CAN BE PULLED AT ANYTIME BY DOING SOMETHING LIKE:
//var val = sp.prefs['newDomain'];


const events = require("sdk/system/events");
const { Cc, Ci, Cu } = require("chrome");
const panels = require("sdk/panel");
const toggles = require('sdk/ui/button/toggle');
const windowUtils = require("sdk/window/utils");
const tabs = require("sdk/tabs");
const self = require("sdk/self");
const sp = require("sdk/simple-prefs");
const ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
const Request = require("sdk/request").Request;
const url = require("sdk/url");
const adblock_filter = require("./easylist-filter/adblock_filter.js");
const ss = require("sdk/simple-storage");
//const jquery = require("../data/js/jquery-2.1.1.min.js")
const oneDay = 24 * 60 * 60 * 1000;

/*---------------------------------------------------------------
 UTILITIES
 ---------------------------------------------------------------*/

function printDataObject() {
    printstuff(
        "Total Cruft: " + dataObject.totalCruft +
        "\nTotal Data:  " + dataObject.totalData +
        "\nJS Content   :  " + dataObject.dataHash[Type.JS][0] +
        "\nJS Cruft     :  " + dataObject.dataHash[Type.JS][1] +
        "\nCSS Content  :  " + dataObject.dataHash[Type.CSS][0] +
        "\nCSS Cruft    :  " + dataObject.dataHash[Type.CSS][1] +
        "\nIMG Content  :  " + dataObject.dataHash[Type.IMG][0] +
        "\nIMG Cruft    :  " + dataObject.dataHash[Type.IMG][1] +
        "\nVID Content  :  " + dataObject.dataHash[Type.VID][0] +
        "\nVID Cruft    :  " + dataObject.dataHash[Type.VID][1] +
        "\nFLASH Content:  " + dataObject.dataHash[Type.FLASH][0] +
        "\nFLASH Cruft  :  " + dataObject.dataHash[Type.FLASH][1] +
        "\nHTML Content :  " + dataObject.dataHash[Type.HTML][0] +
        "\nHTML Cruft   :  " + dataObject.dataHash[Type.HTML][1]
    );
}

/*---------------------------------------------------------------	
 UI ELEMENTS
 ---------------------------------------------------------------*/
//Simple panel to show stats
var panel = panels.Panel({
    position: {
        bottom: 6,
        right: 6
    },
    height: 130,
    width: 180,
    contentURL: self.data.url("overlay.html"),
    onHide: handlePanelHide,
    onShow: handlePanelShow
});

//Advanced panel that shows cruft/content breakdowns
var advPanel = panels.Panel({
    height: 400,
    width: 400,
    contentURL: self.data.url("advanced.html")
});

//Cruft definition panel, used to let the user choose cruft definitions in settings
var cruftDefPanel = panels.Panel({
    height: 225,
    width: 400,
    contentURL: self.data.url("cruftDef.html")
});

//History panel
var histPanel = panels.Panel({
    height: 400,
    width: 400,
    contentURL: self.data.url("history.html")
});

//Used to display/edit the blacklist in settings
var blacklistPanel = panels.Panel({
    height: 315,
    width: 245,
    contentURL: self.data.url("blacklist-text.html")
});

//Toggle button in the toolbar, used to show/hide the simple panel
var togglebutton = toggles.ToggleButton({
    id: "my-button",
    label: "BLT",
    icon: "./sandwich-only.png",
    onChange: handleToggleChange
});


/*---------------------------------------------------------------
 Definition of TracingListener, to listen to incoming responses
 for chunk data sizes.
 ---------------------------------------------------------------*/

function CCIN(cName, ifaceName) {
    return Cc[cName].createInstance(Ci[ifaceName]);
}
// Copy response listener implementation.
function TracingListener() {
    this.originalListener = null;
    this.receivedData = [];   // array for incoming data.
}

TracingListener.prototype =
{
    onDataAvailable: function (request, context, inputStream, offset, count) {
        var binaryInputStream = CCIN("@mozilla.org/binaryinputstream;1",
            "nsIBinaryInputStream");
        var storageStream = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
        var binaryOutputStream = CCIN("@mozilla.org/binaryoutputstream;1",
            "nsIBinaryOutputStream");

        binaryInputStream.setInputStream(inputStream);
        storageStream.init(8192, count, null);
        binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

        // Copy received data as they come.
        var data = binaryInputStream.readBytes(count);
        chunk_size = count;

        binaryOutputStream.writeBytes(data, count);

        this.originalListener.onDataAvailable(request, context,
            storageStream.newInputStream(0), offset, count);
    },

    onStartRequest: function (request, context) {
        this.originalListener.onStartRequest(request, context);
    },

    onStopRequest: function (request, context, statusCode) {
        // Get entire response
        var responseSource = this.receivedData.join();
        this.originalListener.onStopRequest(request, context, statusCode);
    },

    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIStreamListener) ||
            aIID.equals(Ci.nsISupports)) {
            return this;
        }
        //throw Components.results.NS_NOINTERFACE;
    }
}


/*---------------------------------------------------------------
 SETTINGS EVENT HANDLES
 ---------------------------------------------------------------*/

/*
 WEBSITE HYPERLINK
 */

//show/hide the hyperlink button depending on the anonymous data sharing setting
sp.on('shareData', function (share) {
    panel.port.emit('checkShare', share);
    advPanel.port.emit('checkShare', share);
});
panel.port.emit('checkShare', sp.prefs['shareData']);
advPanel.port.emit('checkShare', sp.prefs['shareData']);


/*
 BLACKLIST SETTINGS
 */

//insert a domain into the blacklist if it's valid
function insertDomainBlacklist(domain) {
    domain = formatDomain(domain);
    if (domain.length < 3)
        return;
    if (ss.storage.blacklist.indexOf(domain) === -1)
        ss.storage.blacklist.push(domain);
}
//make sure the domain is in the proper format
function formatDomain(domain) {
    domain = domain.trim();
    if (domain.indexOf("www.") == 0) {
        domain = domain.substring(4, domain.length);
    }
    return domain;
}

//When the user hits the "editList" button, display the blacklist in the blacklistPanel.
sp.on("editList", function () {
    blacklistPanel.port.emit("prepareBlacklist", ss.storage.blacklist);
});
blacklistPanel.port.on("showBlacklist", function () {
    blacklistPanel.show();
});

//In the panel, when the user hits the "update blacklist" button, update the blacklist in storage. Right now it's just deleting the old and replacing it with the new list. This could definitely be optimized better.
blacklistPanel.port.on("text-entered", function (text) {
    var updatedBlacklist = splitTextDomains(text);
    ss.storage.blacklist = [];
    for (var i = 0; i < updatedBlacklist.length; i++) {
        insertDomainBlacklist(updatedBlacklist[i]);
    }
});
//Turn a string into an array of strings
function splitTextDomains(text) {
    return text.split(/(\s|,)+/);
}
//Domains are added/deleted when the user presses the "updateBlacklist" button in the addon options page. See my-addon/package.json for the button definition.
sp.on("updateBlacklist", function () {
    addDomains();
    removeDomains();
});
function addDomains() {
    var newDomains = splitTextDomains(sp.prefs['newDomain']);
    for (var i = 0; i < newDomains.length; i++) {
        insertDomainBlacklist(newDomains[i]);
    }
    sp.prefs['newDomain'] = '';
}
function removeDomains() {
    var domainsToRemove = splitTextDomains(sp.prefs['domainToRemove']);
    for (var i = 0; i < domainsToRemove.length; i++) {
        var domainToRemove = formatDomain(domainsToRemove[i]);
        var index = ss.storage.blacklist.indexOf(domainToRemove);
        if (index != -1) {
            ss.storage.blacklist.splice(index, 1);
        }
    }
    sp.prefs['domainToRemove'] = '';
}


/*---------------------------------------------------------------
 PROGRAM UI COMPONENTS
 ---------------------------------------------------------------*/

/*
 SIMPLE PANEL
 */

// Show/hide the panel when the user clicks toggle the button.
function handleToggleChange(state) {
    if (state.checked) {
        panel.show();
    } else {
        panel.hide();
    }
}
//Check/Uncheck the button when the panel is shown/hidden
//Note that no state object is passed by the 'panel.onHide' and 'panel.onShow' events.
function handlePanelShow(state) {
    togglebutton.state('window', {checked: true});
}
function handlePanelHide(state) {
    togglebutton.state('window', {checked: false});
}

//When the panel stats are ready to be displayed, then show the panel.
panel.port.on("showPanel", function () {
    panel.show();
});

//when a tab is completely loaded (all images, stylesheets, etc)
//NOTE: can switch to 'ready' if we want to only wait for the DOM to finish loading before displaying the panel.
//Bring up the panel for the tab if that tab is the currently active tab.
tabs.on("load", function (tab) {
    if (tabs.activeTab == tab) {

        updateHistory(dataObject.totalCruft, dataObject.totalData);

        if (tabs.activeTab == tab) {
            // panel.port.emit('displayStats', dataObject);

            var jsonObj = getJSONObject(dataObject, false);

            // Send initial post to db after page load
            if (sp.prefs['shareData'] === true) {
                Request({
                    url: "https://bltfirefox.org/record.php",
                    content: {'request': jsonObj},
                    onComplete: function (response) {
                        pageDoneLoading = true;
                        idReturned = response.text;
                    }
                }).post();
            }
        }
    }
});


/*
 ADVANCED PANEL
 */

//When the advanced panel stats are ready to be displayed, then show the advanced panel.
advPanel.port.on("showAdvanced", function () {
    advPanel.show();
});

//When the user clicks the "advanced" button, display the advanced stats that correspond to the simple stats that were already in the panel
panel.port.on('displayAdvancedStats', function (savedStats) {
    advPanel.port.emit('updateAdvancedStats', savedStats);
});


/*
 WEBSITE HYPERLINK
 */

//open a new tab to the BLT website that shows stats for the current domain.
panel.port.on('displayWebsiteStats', function () {
    if (sp.prefs['shareData']) {
        var domain = url.URL(tabs.activeTab.url).hostname;
        domain = domain.replace(new RegExp(/^www\./i), "");
        tabs.open("bltfirefox.org/site.php?domain=" + domain);
    }
});
panel.port.on('displayWebsiteStats', displayWebsiteStats);
advPanel.port.on('displayWebsiteStats', displayWebsiteStats);

function displayWebsiteStats() {
    if (sp.prefs['shareData']) {
        var domain = url.URL(tabs.activeTab.url).hostname;
        domain = domain.replace(new RegExp(/^www\./i), "");
        tabs.open("bltfirefox.org/site.php?domain=" + domain);
    }
};


/*
 PAGE LOADS/UNLOAD RESETS
 */

//When the user navigates away from the current page
function pageReset() {
    resetDataObject();
    pageDoneLoading = false;
    idReturned = -1;
};


/*---------------------------------------------------------------
 LOCAL HISTORY
 ---------------------------------------------------------------*/

//When the history panel stats are ready to be displayed, then show the history panel.
histPanel.port.on("showHistory", function () {
    histPanel.show();
});

//When the user clicks the "history" button, prepare and display the history stats
panel.port.on('displayHistoryStats', function () {
    var hist = ss.storage.history;
    histPanel.port.emit('updateHistory', hist);
});


//called to update the history array every time a new http request is parsed. 
function updateHistory(cruft, total) {
    checkHistory();
    ss.storage.history[0][1] += cruft;
    ss.storage.history[0][2] += total;
}

//ensure that the history array exists and is up to date.
function checkHistory() {
    var maxDays = 30;
    var curDate = new Date();
    curDate = new Date(curDate.getYear(), curDate.getMonth(), curDate.getDate());

    //if the storage array does not exist, then create it.
    if (!ss.storage.history) {
        ss.storage.history = new Array(maxDays);
        var date = new Date();
        date = curDate;
        for (var i = 0; i < maxDays; i++) {
            ss.storage.history[i] = [date, 0, 0];
            date = dateMod(date, 'd', -1);
        }
    }

    //Check how many days it has been since the last time this extension was used. Discard old history entries.
    var daysBehind = dateDaysDiff(curDate, new Date(ss.storage.history[0]));
    if (daysBehind > 0) {
        //discard old entries and shift everything to the right.
        for (var i = maxDays - 1; i >= daysBehind; i--) {
            ss.storage.history[i + daysBehind] = ss.storage.history[i];
        }

        //replace the discarded entries with new entries.
        date = curDate;
        for (var i = 0; i < daysBehind; i++) {
            ss.storage.history[i] = [date, 0, 0];
            date = dateMod(date, 'd', -1);
        }
    }
}

//get the number of days between 2 dates
function dateDaysDiff(firstDate, secondDate) {
    return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
}

//add/subtract either days, months, or years from a date
function dateMod(date, type, amount) {
    var y = date.getFullYear(),
        m = date.getMonth(),
        d = date.getDate();
    if (type === 'y') {
        y += amount;
    }
    ;
    if (type === 'm') {
        m += amount;
    }
    ;
    if (type === 'd') {
        d += amount;
    }
    ;
    return new Date(y, m, d);
}

/*---------------------------------------------------------------
 CRUFT FILTER DEFINITIONS (JS, CSS, etc)
 ---------------------------------------------------------------*/


/*
 The format of the cruft defintion matrix

 cruftDef = 8x3 2d array of booleans, representing what is considered cruft.

 1st Party[0]		3rd Party[1]		Ads[2]
 JS[1]		true				false				true
 CSS[2]		false				false				false
 Images[3]	etc
 Vids[4]
 Flash[5]
 HTML[6]
 Other[7]

 Access 1rst Party JS is cruftDef[Type.JS][Domain.FIRST];
 */

//TYPES
const Type = {
    JS: 1,
    CSS: 2,
    IMG: 3,
    VID: 4,
    FLASH: 5,
    HTML: 6,
    OTHER: 7
}
//DOMAINS
const Domain = {
    FIRST: 0,
    THIRD: 1,
    ADS: 2
}
//DOMAIN COMBINATIONS
//Just a warning, firefox throws a hissyfit and spews errors if we use integers (e.g. "value" : "1") in the options of menulists/radiobuttons in our JSON
const DomainCombo = {
    N: "N",
    A: "A",
    AT: "AT",
    ATF: "ATF",
    AF: "AF",
    F: "F",
    T: "T",
    TF: "TF"
}

function generateDefaultCruftDef() {
    var cruftDef = new Array(8);
    for (var i = 1; i < 8; i++) {
        cruftDef[i] = new Array(3);
        cruftDef[i][Domain.FIRST] = false;
        cruftDef[i][Domain.THIRD] = false;
        cruftDef[i][Domain.ADS] = true;
    }
    return cruftDef;
}

sp.on('editCruftDef', function () {
    cruftDefPanel.port.emit('prepareCruftDef', ss.storage.cruftDef);
});

cruftDefPanel.port.on('cruftDefReady', function () {
    cruftDefPanel.show();
});

cruftDefPanel.port.on('cruftChange', function (obj) {
    ss.storage.cruftDef[obj.t][obj.d] = obj.val;
});

// Instantiation of default cruft definiton matrix
var defaultCruftDef = new Array(8);
for (var i = 0; i < 8; i++) {
    defaultCruftDef[i] = new Array(3);
    defaultCruftDef[i][Domain.FIRST] = false;
    defaultCruftDef[i][Domain.THIRD] = false;
    defaultCruftDef[i][Domain.ADS] = true;
}


/*---------------------------------------------------------------
 TRACK ALL THE DATA - uncomment to see data flow in the console
 ---------------------------------------------------------------*/

var dataObject = new Object();

function resetDataObject() {
    // All in bytes
    dataObject.totalData = 0;
    dataObject.totalCruft = 0;
    dataObject.totalCached = 0;

    dataObject.dataHash = new Object();

    // Content types
    // Key: Content type (as Type enum)
    // Value: Array[bytes of content, bytes of cruft]
    dataObject.dataHash[Type.JS] = [0, 0];
    dataObject.dataHash[Type.CSS] = [0, 0];
    dataObject.dataHash[Type.IMG] = [0, 0];
    dataObject.dataHash[Type.VID] = [0, 0];
    dataObject.dataHash[Type.FLASH] = [0, 0];
    dataObject.dataHash[Type.HTML] = [0, 0];
    dataObject.dataHash[Type.OTHER] = [0, 0];
}

function listener(event) {
    analyzeRequest(event, false);
}

function cacheListener(event) {
    analyzeRequest(event, true);
}

var chunk_size = 0;
var pageDoneLoading = false;
var idReturned = -1;
var currentURL = "";

function getJSONObject(dataObject, update) {
    // Create JSON object
    var obj = new Object();
    var date = new Date();
    obj.domain = url.URL(tabs.activeTab.url).host; // Full URL

    if (!update) {
        obj.datetime = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2) + ' ' +
        ('00' + date.getUTCHours()).slice(-2) + ':' +
        ('00' + date.getUTCMinutes()).slice(-2) + ':' +
        ('00' + date.getUTCSeconds()).slice(-2);
    }
    else
        obj.id = idReturned;
    //set the JSON object's fields
    obj.content = dataObject.totalData - dataObject.totalCruft;
    obj.html = dataObject.dataHash[Type.HTML][0];
    obj.script = dataObject.dataHash[Type.JS][0];
    obj.style = dataObject.dataHash[Type.CSS][0];
    obj.image = dataObject.dataHash[Type.IMG][0];
    obj.video = dataObject.dataHash[Type.VID][0];
    obj.flash = dataObject.dataHash[Type.FLASH][0];
    obj.other = dataObject.dataHash[Type.OTHER][0];
    obj.cruft = dataObject.totalCruft;

    return JSON.stringify(obj);
}

function analyzeRequest(event, isCached) {
    var channel = event.subject.QueryInterface(Ci.nsIHttpChannel);

    // For debug purposes only
    if (config.showDebugMessages)
        printEvent(event);

    try {
        // If the user has navigated to a new page, reset everything
        if (url.URL(tabs.activeTab.url).host !== currentURL) {
            currentURL = url.URL(tabs.activeTab.url).host;
            pageReset();
            panel.port.emit('displayStats', dataObject);
        }

        var contentLength;
        if (event.subject.contentLength == -1) {
            var newListener = new TracingListener();
            event.subject.QueryInterface(Ci.nsITraceableChannel);
            newListener.originalListener = event.subject.setNewListener(newListener);
            contentLength = chunk_size;
        } else {
            contentLength = event.subject.getResponseHeader("content-length");
        }
        // Create a new request object
        var reqObj = new RequestObject(
            event.subject.referrer.asciiSpec, // Referer URI
            event.subject.URI.spec, // This URI
            new Date(event.subject.getResponseHeader("date")), // Date object
            getDomainType(event.subject.URI.spec), // Type of domain
            contentLength, // Size in bytes
            getContentType(event.subject.getResponseHeader("content-type")) // Type of the response
        );

        // Populate local variables
        var contentSize = parseInt(reqObj.contentSize);
        dataObject.totalData += contentSize;
        //check if request object is content/cruft/cached and update totals for those values.
        if (isCruft(reqObj.contentType, reqObj.domainType)) {
            dataObject.totalCruft += contentSize;
            dataObject.dataHash[reqObj.contentType][1] += contentSize;
        } else {
            dataObject.dataHash[reqObj.contentType][0] += contentSize;
        }

        if (isCached)
            dataObject.totalCached += contentSize;

        // Update the stats on the UI after every response
        panel.port.emit('updateStats', dataObject);


        // Keep updating the database after page finishes loading
        if (sp.prefs['shareData'] === true && pageDoneLoading && idReturned !== -1) {
            var jsonObj = getJSONObject(dataObject, true);

            Request({
                url: "https://bltfirefox.org/record.php",
                content: {'request': jsonObj},
                onComplete: function (response) {
                    if (config.showDebugMessages)
                        console.log(response.text);
                }
            }).post();
        }

    } catch (err) {

    }
}

function printEvent(event) {

    console.log("------------------------");
    console.log("URI: " + event.subject.URI.spec);
    console.log("content type: " + event.subject.getResponseHeader("content-type"));
    console.log("content length (in octets): " + event.subject.getResponseHeader("content-length"));
    //console.log("referer: " + event.subject.referrer.asciiSpec);
}

/*---------------------------------------------------------------
 Formatting the data from the listener defined directly above.
 ---------------------------------------------------------------*/

// A "class" representing a nicely packaged HTTP request
// String, String, Number, Domain, Number, Type
function RequestObject(originURI, thisURI, timestamp, domainType, contentSize, contentType) {
    this.originURI = originURI,
        this.thisURI = thisURI,
        this.timestamp = timestamp,
        this.domainType = domainType,
        this.contentSize = contentSize,
        this.contentType = contentType,
        this.toString = function () {
            return "Origin URI: " + this.originURI + "\n"
                + "This URI: " + this.thisURI + "\n"
                + "Domain Type: " + this.domainType + "\n"
                + "Content Size: " + this.contentSize + "\n"
                + "Content Type: " + this.contentType + "\n";
        }
}

function getContentType(type) {
    if (type.indexOf("image") === 0)
        return Type.IMG;
    else if (type.indexOf("video") === 0)
        return Type.VID;
    else if (type.indexOf("javascript") !== -1)
        return Type.JS;
    else if (type.indexOf("text/html") === 0 || type.indexOf("application/json") === 0 || type.indexOf("text/plain") === 0)
        return Type.HTML;
    else if (type.indexOf("text/css") === 0)
        return Type.CSS;
    else if (type.indexOf("application/x-shockwave-flash") === 0)
        return Type.FLASH;
    else
        return Type.OTHER;
}

function isFirstOrThirdStrict(referrerURL) {
    var origin = url.URL(tabs.activeTab.url);
    var referrer = url.URL(referrerURL);
    if (origin.hostname == referrer.hostname)
        return Domain.FIRST;
    else
        return Domain.THIRD;
}

function isFirstOrThirdRelaxed(referrerURL) {
    var origin = url.URL(tabs.activeTab.url);
    var referrer = url.URL(referrerURL);
    originParts = origin.hostname.split(".");
    if (originParts[originParts.length - 2] == referrerParts[referrerParts.length - 2])
        return Domain.FIRST;
    else
        return Domain.THIRD;
}

// Determine if a URI is on the EasyList
function isAd(uri) {
    //return true;
    return adblock_filter.is_Ad(uri);
}

function getDomainType(referrerURL) {
    if (sp.prefs['filterAds'] && isAd(referrerURL))
        return Domain.ADS;
    else
        return isFirstOrThirdStrict(referrerURL);
}

// Filter content by type. We have a 'cruftDef' matrix defined above that is updated live as settings are changed. But before checking, we need to check if "sp.prefs['cruftFilter'] === true". Only if it's true will we apply the filter that is stored in cruftDef, otherwise we default to only ads being cruft.
function isCruft(contentType, domainType) {
    if (sp.prefs['cruftFilter'] === false)
        return defaultCruftDef[contentType][domainType];
    else
        return ss.storage.cruftDef[contentType][domainType];
}

/*---------------------------------------------------------------
 Main
 ---------------------------------------------------------------*/

// Main function
exports.main = function () {

    events.on("http-on-examine-response", listener);
    events.on("http-on-examine-cached-response", cacheListener);
    events.on("http-on-examine-merged-response", cacheListener);


    //initialize easylist in memory
    if (!ss.storage.blacklist)
        ss.storage.blacklist = [];


    // Use this for loading Easylist from online.
    adblock_filter.load_list();

    // Use this for loading the Easylist from file.
    // adblock_filter.categorize(adblock_filter.load_list());

    //Bring the history array up to date
    checkHistory();

    //initialize the cruft definition matrix
    if (!ss.storage.cruftDef) {
        ss.storage.cruftDef = generateDefaultCruftDef();
    }

    //initialize the data object that is used to store cruft/content statistics for webpages
    resetDataObject();

}

/*---------------------------------------------------------------
 FIN
 ---------------------------------------------------------------*/



