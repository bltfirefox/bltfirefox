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

//HTML elements that we retrieve from advanced.html to place data from panel.js into.
var htmlCruft = document.getElementById("htmlCruft");
var cssCruft = document.getElementById("cssCruft");
var jsCruft = document.getElementById("jsCruft");
var imgCruft = document.getElementById("imgCruft");
var vidCruft = document.getElementById("vidCruft");
var flashCruft = document.getElementById("flashCruft");
var otherCruft = document.getElementById("otherCruft");

var htmlContent = document.getElementById("htmlContent");
var cssContent = document.getElementById("cssContent");
var jsContent = document.getElementById("jsContent");
var imgContent = document.getElementById("imgContent");
var vidContent = document.getElementById("vidContent");
var flashContent = document.getElementById("flashContent");
var otherContent = document.getElementById("otherContent");

var stats = document.getElementById("stats");
var statBool = false;

//Event received whenever panel.js is ready to display stats
addon.port.on('updateAdvancedStats', function (savedStats) {

    //variables of data to display in html
    var pjsCruft = 0.0;
    var pcssCruft = 0.0;
    var pimgCruft = 0.0;
    var pvidCruft = 0.0;
    var pflashCruft = 0.0;
    var phtmlCruft = 0.0;
    var potherCruft = 0.0;

    var pjsContent = 0.0;
    var pcssContent = 0.0;
    var pimgContent = 0.0;
    var pvidContent = 0.0;
    var pflashContent = 0.0;
    var phtmlContent = 0.0;
    var potherContent = 0.0;

    //Cruft

    if (savedStats.totalCruft > 0) {
        if (savedStats.dataHash[Type.JS][1] > 0)
            pjsCruft = ((savedStats.dataHash[Type.JS][1] / savedStats.totalCruft) * 100).toFixed(1);
        if (savedStats.dataHash[Type.CSS][1] > 0)
            pcssCruft = ((savedStats.dataHash[Type.CSS][1] / savedStats.totalCruft) * 100).toFixed(1);
        if (savedStats.dataHash[Type.IMG][1] > 0)
            pimgCruft = ((savedStats.dataHash[Type.IMG][1] / savedStats.totalCruft) * 100).toFixed(1);
        if (savedStats.dataHash[Type.VID][1] > 0)
            pvidCruft = ((savedStats.dataHash[Type.VID][1] / savedStats.totalCruft) * 100).toFixed(1);
        if (savedStats.dataHash[Type.FLASH][1] > 0)
            pflashCruft = ((savedStats.dataHash[Type.FLASH][1] / savedStats.totalCruft) * 100).toFixed(1);
        if (savedStats.dataHash[Type.HTML][1] > 0)
            phtmlCruft = ((savedStats.dataHash[Type.HTML][1] / savedStats.totalCruft) * 100).toFixed(1);
        if (savedStats.dataHash[Type.OTHER][1] > 0)
            potherCruft = ((savedStats.dataHash[Type.OTHER][1] / savedStats.totalCruft) * 100).toFixed(1);
    }

    while (jsCruft.firstChild) {
        jsCruft.removeChild(jsCruft.firstChild);
    }
    while (cssCruft.firstChild) {
        cssCruft.removeChild(cssCruft.firstChild);
    }
    while (imgCruft.firstChild) {
        imgCruft.removeChild(imgCruft.firstChild);
    }
    while (vidCruft.firstChild) {
        vidCruft.removeChild(vidCruft.firstChild);
    }
    while (flashCruft.firstChild) {
        flashCruft.removeChild(flashCruft.firstChild);
    }
    while (htmlCruft.firstChild) {
        htmlCruft.removeChild(htmlCruft.firstChild);
    }
    while (otherCruft.firstChild) {
        otherCruft.removeChild(otherCruft.firstChild);
    }

    jsCruft.appendChild(document.createTextNode(pjsCruft + "%"));
    cssCruft.appendChild(document.createTextNode(pcssCruft + "%"));
    imgCruft.appendChild(document.createTextNode(pimgCruft + "%"));
    vidCruft.appendChild(document.createTextNode(pvidCruft + "%"));
    flashCruft.appendChild(document.createTextNode(pflashCruft + "%"));
    htmlCruft.appendChild(document.createTextNode(phtmlCruft + "%"));
    otherCruft.appendChild(document.createTextNode(potherCruft + "%"));

    /*
     jsCruft.innerHTML = pjsCruft + "%";
     cssCruft.innerHTML = pcssCruft + "%";
     imgCruft.innerHTML = pimgCruft + "%";
     vidCruft.innerHTML = pvidCruft + "%";
     flashCruft.innerHTML = pflashCruft + "%";
     htmlCruft.innerHTML = phtmlCruft + "%";
     otherCruft.innerHTML = potherCruft + "%";
     */

    //Content


    var totalContent = savedStats.totalData - savedStats.totalCruft;
    if (totalContent > 0) {
        if (savedStats.dataHash[Type.JS][0] > 0)
            pjsContent = ((savedStats.dataHash[Type.JS][0] / totalContent) * 100).toFixed(1);
        if (savedStats.dataHash[Type.CSS][0] > 0)
            pcssContent = ((savedStats.dataHash[Type.CSS][0] / totalContent) * 100).toFixed(1);
        if (savedStats.dataHash[Type.IMG][0] > 0)
            pimgContent = ((savedStats.dataHash[Type.IMG][0] / totalContent) * 100).toFixed(1);
        if (savedStats.dataHash[Type.VID][0] > 0)
            pvidContent = ((savedStats.dataHash[Type.VID][0] / totalContent) * 100).toFixed(1);
        if (savedStats.dataHash[Type.FLASH][0] > 0)
            pflashContent = ((savedStats.dataHash[Type.FLASH][0] / totalContent) * 100).toFixed(1);
        if (savedStats.dataHash[Type.HTML][0] > 0)
            phtmlContent = ((savedStats.dataHash[Type.HTML][0] / totalContent) * 100).toFixed(1);
        if (savedStats.dataHash[Type.OTHER][0] > 0)
            potherContent = ((savedStats.dataHash[Type.OTHER][0] / totalContent) * 100).toFixed(1);
    }


    while (jsContent.firstChild) {
        jsContent.removeChild(jsContent.firstChild);
    }
    while (cssContent.firstChild) {
        cssContent.removeChild(cssContent.firstChild);
    }
    while (imgContent.firstChild) {
        imgContent.removeChild(imgContent.firstChild);
    }
    while (vidContent.firstChild) {
        vidContent.removeChild(vidContent.firstChild);
    }
    while (flashContent.firstChild) {
        flashContent.removeChild(flashContent.firstChild);
    }
    while (htmlContent.firstChild) {
        htmlContent.removeChild(htmlContent.firstChild);
    }
    while (otherContent.firstChild) {
        otherContent.removeChild(otherContent.firstChild);
    }

    jsContent.appendChild(document.createTextNode(pjsContent + "%"));
    cssContent.appendChild(document.createTextNode(pcssContent + "%"));
    imgContent.appendChild(document.createTextNode(pimgContent + "%"));
    vidContent.appendChild(document.createTextNode(pvidContent + "%"));
    flashContent.appendChild(document.createTextNode(pflashContent + "%"));
    htmlContent.appendChild(document.createTextNode(phtmlContent + "%"));
    otherContent.appendChild(document.createTextNode(potherContent + "%"));

    /*
     jsContent.innerHTML = pjsContent + "%";
     cssContent.innerHTML = pcssContent + "%";
     imgContent.innerHTML = pimgContent + "%";
     vidContent.innerHTML = pvidContent + "%";
     flashContent.innerHTML = pflashContent + "%";
     htmlContent.innerHTML = phtmlContent + "%";
     otherContent.innerHTML = potherContent + "%";
     */


    if (statBool)
        stats.style.display = "inline";
    else
        stats.style.display = "none";

    addon.port.emit("showAdvanced");
});

//Event received whenever user has opted into sharing data results
addon.port.on('checkShare', function (share) {
    statBool = share;
    if (statBool)
        stats.style.display = "inline";
    else
        stats.style.display = "none";
});

//Event sent to main.js to open website data collected.
function onClickStats() {
    addon.port.emit('displayWebsiteStats');
}
