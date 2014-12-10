var textArea = document.getElementById("edit-box");

function onClickUpdate() {
    addon.port.emit("text-entered", textArea.value);
}

addon.port.on("prepareBlacklist", function (blacklist) {
    var str = "";
    for (var i = 0; i < blacklist.length; i++) {
        str += (blacklist[i] + "\n");
    }

    textArea.value = str;

    addon.port.emit("showBlacklist");
});
