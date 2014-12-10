//TYPES
const Type = {
    JS: 1,
    CSS: 2,
    IMG: 3,
    VID: 4,
    FLASH: 5,
    HTML: 6,
    OTHER: 7
};

//DOMAINS
const Domain = {
    FIRST: 0,
    THIRD: 1,
    ADS: 2
};

var cruftDef;
var curType;
var curDomain;
var curValue;

var jsF = document.getElementById('jsF');
var jsT = document.getElementById('jsT');
var jsA = document.getElementById('jsA');
var cssF = document.getElementById('cssF');
var cssT = document.getElementById('cssT');
var cssA = document.getElementById('cssA');
var imgF = document.getElementById('imgF');
var imgT = document.getElementById('imgT');
var imgA = document.getElementById('imgA');
var vidF = document.getElementById('vidF');
var vidT = document.getElementById('vidT');
var vidA = document.getElementById('vidA');
var flashF = document.getElementById('flashF');
var flashT = document.getElementById('flashT');
var flashA = document.getElementById('flashA');
var htmlF = document.getElementById('htmlF');
var htmlT = document.getElementById('htmlT');
var htmlA = document.getElementById('htmlA');
var otherF = document.getElementById('otherF');
var otherT = document.getElementById('otherT');
var otherA = document.getElementById('otherA');

addon.port.on('prepareCruftDef', function (cruftMatrix) {
    if (!cruftDef) {
        setCruftDef(cruftMatrix);
    }
    addon.port.emit('cruftDefReady');
});

function setCruftDef(cruftMatrix) {
    cruftDef = cruftMatrix;
    jsF.checked = cruftDef[Type.JS][Domain.FIRST];
    jsT.checked = cruftDef[Type.JS][Domain.THIRD];
    jsA.checked = cruftDef[Type.JS][Domain.ADS];
    cssF.checked = cruftDef[Type.CSS][Domain.FIRST];
    cssT.checked = cruftDef[Type.CSS][Domain.THIRD];
    cssA.checked = cruftDef[Type.CSS][Domain.ADS];
    imgF.checked = cruftDef[Type.IMG][Domain.FIRST];
    imgT.checked = cruftDef[Type.IMG][Domain.THIRD];
    imgA.checked = cruftDef[Type.IMG][Domain.ADS];
    vidF.checked = cruftDef[Type.VID][Domain.FIRST];
    vidT.checked = cruftDef[Type.VID][Domain.THIRD];
    vidA.checked = cruftDef[Type.VID][Domain.ADS];
    flashF.checked = cruftDef[Type.FLASH][Domain.FIRST];
    flashT.checked = cruftDef[Type.FLASH][Domain.THIRD];
    flashA.checked = cruftDef[Type.FLASH][Domain.ADS];
    htmlF.checked = cruftDef[Type.HTML][Domain.FIRST];
    htmlT.checked = cruftDef[Type.HTML][Domain.THIRD];
    htmlA.checked = cruftDef[Type.HTML][Domain.ADS];
    otherF.checked = cruftDef[Type.OTHER][Domain.FIRST];
    otherT.checked = cruftDef[Type.OTHER][Domain.THIRD];
    otherA.checked = cruftDef[Type.OTHER][Domain.ADS];
}


function updateCruftDef(type, domain, cb) {
    cruftDef[type][domain] = cb.checked;
    addon.port.emit('cruftChange', {t: type, d: domain, val: cb.checked});
}