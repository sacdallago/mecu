

const drawExperiment = (experiment) => {
    document.querySelector(`#experiment-form`).classList.remove(`loading`);
    if(experiment.isUploader === true) {
        drawExperimentMutable(experiment);
    } else {
        drawExperimentConstant(experiment);
    }
};

const drawExperimentConstant = (experiment) => {
    const expName = document.querySelector(`#experiment-name`);
    expName.setAttribute(`readonly`, ``);
    expName.value = experiment.name;
    const uploader = document.querySelector(`#uploader`);
    uploader.setAttribute(`target`, `_blank`);
    uploader.setAttribute(`href`, `https://plus.google.com/`+experiment.uploader);
    uploader.text = experiment.uploader;
    const cbPrivate = document.querySelector(`#cb-private`);
    cbPrivate.checked = experiment.private === true;
    cbPrivate.setAttribute(`disabled`, `disabled`);
    const description = document.querySelector(`#description`);
    description.setAttribute(`readonly`, ``);
    description.value = experiment.metaData.description;
    const cbLysate = document.querySelector(`#cb-lysate`);
    cbPrivate.checked = experiment.private === true;
    cbLysate.setAttribute(`disabled`, `disabled`);

    Object.keys(experiment.metaData.additionalFields || {}).forEach(key => {
        drawNewAdditionalField(false, key, experiment.metaData.additionalFields[key]);
    });

    document.querySelector('.additional-fields-container .additional-fields .new-field-button')
        .remove()

    document.querySelector(`#submit-button`).style.display = `none`;
};

const drawExperimentMutable = (experiment) => {
    const expName = document.querySelector(`#experiment-name`);
    expName.value = experiment.name;
    const uploader = document.querySelector(`#uploader`);
    uploader.setAttribute(`target`, `_blank`);
    uploader.setAttribute(`href`, `https://plus.google.com/`+experiment.uploader);
    uploader.text = experiment.uploader;
    const cbPrivate = document.querySelector(`#cb-private`);
    cbPrivate.checked = experiment.private === true;
    const description = document.querySelector(`#description`);
    description.value = experiment.metaData.description;
    const cbLysate = document.querySelector(`#cb-lysate`);
    cbLysate.checked = experiment.metaData.lysate === true;

    Object.keys(experiment.metaData.additionalFields || {}).forEach(key => {
        drawNewAdditionalField(true, key, experiment.metaData.additionalFields[key]);
    })
};

const drawNewAdditionalField = (mutable = true, key, value) => {
    const container = document.querySelector('.additional-fields .fields');

    const row = document.createElement('div');
    row.classList.add('additional-field-row');

    const keyField = document.createElement('input');
    keyField.setAttribute('name', 'key');
    keyField.setAttribute('type', 'text');
    keyField.setAttribute('placeholder', 'Key');
    if (!!key) keyField.setAttribute('value', key);

    const valueField = document.createElement('input');
    valueField.setAttribute('name', 'value');
    valueField.setAttribute('type', 'text');
    valueField.setAttribute('placeholder', 'Value');
    if (!!value) valueField.setAttribute('value', value);

    const removeRowButton = document.createElement('input');
    removeRowButton.setAttribute('type', 'button');
    removeRowButton.setAttribute('value', 'Remove Entry');
    removeRowButton.classList.add('remove-button');
    removeRowButton.addEventListener('click', event => { row.remove(); });

    row.appendChild(keyField);
    row.appendChild(valueField);

    if (!mutable) {
        keyField.setAttribute(`disabled`, `disabled`);
        valueField.setAttribute(`disabled`, `disabled`);
    } else {
        row.appendChild(removeRowButton);
    }

    container.appendChild(row);
}

const extractKeyValues = () => {
    const returnMap = {};
    const listOfRows = document.querySelectorAll('.additional-fields .fields .additional-field-row');
    listOfRows.forEach(row => {
        if (row.children[0].value.length != 0) {
            returnMap[row.children[0].value] = row.children[1].value;
        }
    })
    return returnMap;
}

const drawError = () => {
    document.querySelector(`#experiment-form`).style.display = `none`;
    document.querySelector(`#not-allowed-form`).style.display = `block`;
    document.querySelector(`#not-allowed-form`).classList.add(`error`);
};


$(`#experiment-form`).form({
    fields: { 'experiment-name': `minLength[10]` },
    on: `change`,
    revalidate: true,
    inline: true,
    onSuccess: function (event, fields) {

        const id = $(`#experiment-id`).text();
        const experimentNew = {
            name: fields[`experiment-name`],
            private: fields[`cb-private`] === `on`,
            metaData: {
                lysate: fields[`cb-lysate`] === `on`,
                description: fields[`description`],
                additionalFields: extractKeyValues()
            }
        };

        console.log(id, experimentNew);
        document.querySelector(`#experiment-form`).classList.add(`loading`);
        ExperimentService.updateExperiment(id, experimentNew)
            .then(updated => {
                if(updated.message) {
                    console.error(`error updating the experiment:`, updated);
                    document.querySelector(`#experiment-form`).classList.remove(`loading`, `success`);
                    document.querySelector(`#experiment-form`).classList.add(`error`);
                } else {
                    console.log(`updated`, updated);
                    // drawExperimentMutable(updated); // not necessary, only makes the page flicker
                    document.querySelector(`#experiment-form`).classList.remove(`loading`, `error`);
                    document.querySelector(`#experiment-form`).classList.add(`success`);
                }
            });
        event.preventDefault();
    },
    onFailure: function (formErrors, fields) {
        console.log(fields);
        return false;
    },
    onValid: function () {
        document.querySelector(`#experiment-form`).classList.remove(`error`, `success`);
        console.log(`removing success error`);
    }
});

$(`.ui.checkbox`).checkbox();

const setDownloadButtonLink = (experiment) => {
    $('.download-all-button .json').attr({
        'href': `/api/reads/temperatures/raw/?e=${experiment.id}`,
        'download': `${experiment.name}.json`
    });

    $('.download-all-button .tsv').attr({
        'href': `/api/reads/temperatures/raw/?e=${experiment.id}&f=tsv`,
        'download': `${experiment.name}.tsv`
    });

    $('.download-all-button .csv').attr({
        'href': `/api/reads/temperatures/raw/?e=${experiment.id}&f=csv`,
        'download': `${experiment.name}.tsv`
    });
}

$('#add-new-field').on('click', function() {
    drawNewAdditionalField();
});

$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    if(query.id) {

        $(`#experiment-id`).text(query.id);

        document.querySelector(`#experiment-form`).classList.add(`loading`);

        ExperimentService.getExperiment(query.id)
            .then(experiment => {
                console.log(`data`, experiment);
                if(experiment.error) {
                    drawError(experiment.error);
                } else {
                    drawExperiment(experiment);
                    setDownloadButtonLink(experiment);
                }
            });
    }
});
