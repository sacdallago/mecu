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


// multiple files: https://stackoverflow.com/questions/36067767/how-do-i-upload-a-file-with-the-js-fetch-api
$(`#experiment-upload-form`).form({
    fields: {
        description : `minLength[10]`,
        data        : `empty`
    },
    inline: true,
    on: `change`,
    revalidate: true,
    onSuccess: function(event, fields) {

        const file = $(`#data`)[0];

        const formData = new FormData();
        formData.append(`description`, fields.description);
        formData.append(`data`, file.files[0]);
        formData.append(`lysate`, fields.lysate);

        document.querySelector(`#experiment-upload-form`).classList.add(`loading`);
        document.querySelector(`#upload-info`).style.display = `block`;
        ExperimentService.uploadExperiment(formData)
            .then(result => {
                console.log(`result`, result);
                if(result.error) {
                    document.querySelector(`#experiment-upload-form`).classList.remove(`loading`);
                    document.querySelector(`#experiment-upload-form`).classList.add(`error`);
                    document.querySelector(`#error-message`).textContent = result.error;
                } else {
                    document.location.href = `/success`;
                }
            });

        event.preventDefault();
    },
    onFailure: function(formErrors, fields) {
        console.log(`onFailure fields`, fields);
        return false;
    },
    onValid: function () {
        document.querySelector(`#upload-info`).style.display = `none`;
    }
});

$(`.ui.checkbox`).checkbox();
