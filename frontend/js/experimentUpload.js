if (window.File && window.FileReader && window.FileList && window.Blob) {
    console.log(`The File APIs are fully supported by your browser.`);
} else {
    console.log(`The File APIs are not fully supported by your browser.`);
    alert(`Sorry. Your browser is not compatible with this application. Please change browser.`);
    window.location.replace(`/`);
}

let previewDiv = document.getElementById(`preview`);

function readMultipleFiles(evt) {
    //Retrieve all the files from the FileList object
    var files = evt.target.files;

    if (files !== undefined && files.length > 0) {
        let file = files[0];
        let fileReader = new FileReader();
        fileReader.onload = function(element) {
            let contents = element.target.result;
            let jsonRepresentation = MecuUtils.parse(contents);
            previewDiv.innerHTML = JSON.stringify(jsonRepresentation[0]) + `\n and ` + (jsonRepresentation.length -1) + ` more...`;
        };
        fileReader.readAsText(file);
    } else {
        alert(`Failed to load file`);
    }
}

document.getElementById(`data`).addEventListener(`change`, readMultipleFiles, false);

$(`.ui.form`).form({
    fields: {
        description : `empty`,
        data     : `empty`
    }
});

$(`.ui.checkbox`).checkbox();
