

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
};

const drawError = () => {
    document.querySelector(`#experiment-form`).style.display = `none`;
    document.querySelector(`#not-allowed-form`).style.display = `block`;
    document.querySelector(`#not-allowed-form`).classList.add(`error`);
};


$(`#experiment-form`).form({
    fields: {
        'experiment-name': `minLength[10]`
    },
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
                description: fields[`description`]
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
        event.preventDefault();
    },
    onValid: function () {
        document.querySelector(`#experiment-form`).classList.remove(`error`, `success`);
        console.log(`removing success error`);
    }
});

$(`.ui.checkbox`).checkbox();

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
                }
            });
    }
});
