//called by history.html

//TYPES
const Period = {
    DAY: 1,
    WEEK: 7,
    MONTH: 30
};

var content1 = document.getElementById("content1");
var cruft1 = document.getElementById("cruft1");
var content2 = document.getElementById("content2");
var cruft2 = document.getElementById("cruft2");
var content3 = document.getElementById("content3");
var cruft3 = document.getElementById("cruft3");

//Event received whenever main.js is ready to display stats for a newly loaded page
addon.port.on('updateHistory', function (history) {

    //Compute aggregate content/cruft percentages
    var cruftDay = aggregateCruftPercent(history, Period.DAY);
    var contentDay = 100 - cruftDay;
    var cruftWeek = aggregateCruftPercent(history, Period.WEEK);
    var contentWeek = 100 - cruftWeek;
    var cruftMonth = aggregateCruftPercent(history, Period.MONTH);
    var contentMonth = 100 - cruftMonth;


    //Propagate the changes to the HTML DOM
    //DAY
    //Content
    content1.style = "width: " + contentDay + "%";
    while (content1.firstChild) {
        content1.removeChild(content1.firstChild);
    }
    content1.appendChild(document.createTextNode(contentDay + "%"));
    //content1.innerHTML = contentDay + "%";
    //Cruft
    cruft1.style = "width: " + cruftDay + "%";
    while (cruft1.firstChild) {
        cruft1.removeChild(cruft1.firstChild);
    }
    cruft1.appendChild(document.createTextNode(cruftDay + "%"));
    //cruft1.innerHTML = cruftDay + "%";

    //WEEK
    //Content
    content2.style = "width: " + contentWeek + "%";
    while (content2.firstChild) {
        content2.removeChild(content2.firstChild);
    }
    content2.appendChild(document.createTextNode(contentWeek + "%"));
    //content2.innerHTML = contentWeek + "%";
    //Cruft
    cruft2.style = "width: " + cruftWeek + "%";
    while (cruft2.firstChild) {
        cruft2.removeChild(cruft2.firstChild);
    }
    cruft2.appendChild(document.createTextNode(cruftWeek + "%"));
    //cruft2.innerHTML = cruftWeek + "%";

    //MONTH
    //Content
    content3.style = "width: " + contentMonth + "%";
    while (content3.firstChild) {
        content3.removeChild(content3.firstChild);
    }
    content3.appendChild(document.createTextNode(contentMonth + "%"));
    //content3.innerHTML = contentMonth + "%";
    //Cruft
    cruft3.style = "width: " + cruftMonth + "%";
    while (cruft3.firstChild) {
        cruft3.removeChild(cruft3.firstChild);
    }
    cruft3.appendChild(document.createTextNode(cruftMonth + "%"));
    //cruft3.innerHTML = cruftMonth + "%";

    addon.port.emit("showHistory");

});
console.log('history listener attached!');


function aggregateCruftPercent(history, days) {
    var totalCruft = 0;
    var totalData = 0;
    for (var i = 0; i < days; i++) {
        totalCruft += history[i][1];
        totalData += history[i][2];
    }
    return parseInt((totalCruft / totalData) * 100);
}