//Called by myFile.html
console.log('displayStats listener attached!');

//TYPES for data object
const Type = {
    JS: 1,
    CSS: 2,
    IMG: 3,
    VID: 4,
    FLASH: 5,
    HTML: 6,
    OTHER: 7
};

//HTML elements that we retrieve from myFile.html to place data from main.js into.
var contentBar = document.getElementById("contentBar");
var cruftBar = document.getElementById("cruftBar");
var cacheDiv = document.getElementById("cachedContent");
var contentBarData = document.getElementById("left-bar-data");
var cruftBarData = document.getElementById("right-bar-data");
var stats = document.getElementById("stats");
var statBool = false;

//Intialize a new object to store the data from the object sent from main.js
var savedStats = new Object();
savedStats.dataHash = new Object();
savedStats.dataHash[Type.JS] = [0.0, 0.0];
savedStats.dataHash[Type.CSS] = [0.0, 0.0];
savedStats.dataHash[Type.IMG] = [0.0, 0.0];
savedStats.dataHash[Type.VID] = [0.0, 0.0];
savedStats.dataHash[Type.FLASH] = [0.0, 0.0];
savedStats.dataHash[Type.HTML] = [0.0, 0.0];
savedStats.dataHash[Type.OTHER] = [0.0, 0.0];

//Event received whenever main.js is ready to display stats for a newly loaded page
addon.port.on('displayStats', function (dataObject) {
    addon.port.emit("showPanel");
});

//Event received whenever web page loads more data, main.js sends the updated data.
addon.port.on('updateStats', function (dataObject) {
    calculateStats(dataObject);
});

//Event received whenever user has opted into sharing data results
addon.port.on('checkShare', function (share) {
    statBool = share;
    if (statBool)
        stats.style.display = "inline";
    else
        stats.style.display = "none";
});

function calculateStats(dataObject) {
    //Clone the data so that it persists
    saveData(dataObject);

    var content = 0;
    var cruft = 0;
    var contentData = 0;
    var cruftData = 0;
    var cached = 0;

    //Display public statistics button to website
    if (statBool)
        stats.style.display = "inline";
    else
        stats.style.display = "none";

    //Calculate percentages of cruft, content, and cached
    if (savedStats.totalData > 0) {
        cruft = parseInt((savedStats.totalCruft / savedStats.totalData) * 100);
        content = 100 - cruft;
        cached = parseInt(savedStats.totalCached / savedStats.totalData * 100);
    }


    //Content HTML element to display content percentage
    contentBar.style = "width: " + content + "%";
    while (contentBar.firstChild) {
        contentBar.removeChild(contentBar.firstChild);
    }
    contentBar.appendChild(document.createTextNode(content + "%"));
    while (contentBarData.firstChild) {
        contentBarData.removeChild(contentBarData.firstChild);
    }
    contentBarData.appendChild(document.createTextNode(bytesToSize(savedStats.totalData - savedStats.totalCruft, 2)));

    //contentBar.innerHTML = content + "%";
    //contentBarData.innerHTML = bytesToSize(savedStats.totalData - savedStats.totalCruft, 2);

    //Cruft HTML Element to display cruft percentage
    cruftBar.style = "width: " + cruft + "%";
    while (cruftBar.firstChild) {
        cruftBar.removeChild(cruftBar.firstChild);
    }
    cruftBar.appendChild(document.createTextNode(cruft + "%"));
    while (cruftBarData.firstChild) {
        cruftBarData.removeChild(cruftBarData.firstChild);
    }
    cruftBarData.appendChild(document.createTextNode(bytesToSize(savedStats.totalCruft, 2)));

    //cruftBar.innerHTML = cruft + "%";
    //cruftBarData.innerHTML = bytesToSize(savedStats.totalCruft, 2);

    //Cache HTML element to display cached percentage
    while (cacheDiv.firstChild) {
        cacheDiv.removeChild(cacheDiv.firstChild);
    }
    cacheDiv.appendChild(document.createTextNode("From Cache: " + cached + "%"));
    //cacheDiv.innerHTML = "From Cache: " + cached + "%";
}

//Event sent to main.js to display advanced panel, sending the saved data object
function onClickAdvanced() {
    addon.port.emit('displayAdvancedStats', savedStats);
}

//Event sent to main.js to open website data collected.
function onClickStats() {
    addon.port.emit('displayWebsiteStats');
}

//Event sent to main.js to display history panel
function onClickHistory() {
    addon.port.emit('displayHistoryStats');
}

//clone a dataObject
function saveData(data) {
    // All in bytes
    savedStats.totalData = data.totalData;
    savedStats.totalCruft = data.totalCruft;
    savedStats.totalCached = data.totalCached;

    // Content types
    // Key: Content type (as Type enum)
    // Value: Array[Total size in bytes, % cruft]
    savedStats.dataHash[Type.JS][0] = data.dataHash[Type.JS][0];
    savedStats.dataHash[Type.JS][1] = data.dataHash[Type.JS][1];
    savedStats.dataHash[Type.CSS][0] = data.dataHash[Type.CSS][0];
    savedStats.dataHash[Type.CSS][1] = data.dataHash[Type.CSS][1];
    savedStats.dataHash[Type.IMG][0] = data.dataHash[Type.IMG][0];
    savedStats.dataHash[Type.IMG][1] = data.dataHash[Type.IMG][1];
    savedStats.dataHash[Type.VID][0] = data.dataHash[Type.VID][0];
    savedStats.dataHash[Type.VID][1] = data.dataHash[Type.VID][1];
    savedStats.dataHash[Type.FLASH][0] = data.dataHash[Type.FLASH][0];
    savedStats.dataHash[Type.FLASH][1] = data.dataHash[Type.FLASH][1];
    savedStats.dataHash[Type.HTML][0] = data.dataHash[Type.HTML][0];
    savedStats.dataHash[Type.HTML][1] = data.dataHash[Type.HTML][1];
    savedStats.dataHash[Type.OTHER][0] = data.dataHash[Type.OTHER][0];
    savedStats.dataHash[Type.OTHER][1] = data.dataHash[Type.OTHER][1];
}

// Convert bytes to human readable format
function bytesToSize(bytes, precision) {
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;

    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';

    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';

    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' MB';

    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';

    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';

    } else {
        return bytes + ' B';
    }
}