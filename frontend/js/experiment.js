const experimentContainerIdentifier = `#experiment-container`;
const metaDataContaierIdentifier = `#meta-data`;
const saveExperimentButtonContainerIdentifier = `#save-experiment-button-container`;
const experimentsStatisticsContainerIdentifier = `#experiment-statistics`;
const errorContainerIdentifier = `#error-container`;

const drawError = (error) => {
    $(experimentContainerIdentifier).css({'display':`none`});
    $(metaDataContaierIdentifier).css({'display':`none`});
    $(errorContainerIdentifier).append($(`<div />`).text(error));
    $(saveExperimentButtonContainerIdentifier).removeClass(`data-container`);
    $(experimentsStatisticsContainerIdentifier).removeClass(`data-container`);
};

const drawExperiment = (experiment) => {
    if(experiment.isUploader === true) {
        drawExperimentMutable(experiment);
    } else {
        drawExperimentConstant(experiment);
    }
};

const drawExperimentConstant = (experiment) => {
    $(experimentContainerIdentifier+` .name .value`).text(experiment.name);
    $(experimentContainerIdentifier+` .uploader .value`).append(
        $(`<a />`)
            .attr({'target':`_blank`,'href':`https://plus.google.com/`+experiment.uploader})
            .text(experiment.uploader)
    );
    $(experimentContainerIdentifier+` .is-private`).removeAttr(`hidden`);
    $(experimentContainerIdentifier+` .is-private .value`).text(experiment.private === true ? `yes` : `no`);

    // meta-data
    $(metaDataContaierIdentifier+` .description .value`).text(experiment.metaData.description);
    $(metaDataContaierIdentifier+` .lysate .value`).text(experiment.metaData.lysate === true ? `yes` : `no`);

    $(saveExperimentButtonContainerIdentifier).removeClass(`data-container`);
    $(experimentsStatisticsContainerIdentifier).removeClass(`data-container`);
    $(errorContainerIdentifier).removeClass(`data-container`);
};

const drawExperimentMutable = (experiment) => {
    $(experimentContainerIdentifier+` .name .value`).append(
        $(`<input>`).attr({id: `name`}).val(experiment.name)
    );
    $(experimentContainerIdentifier+` .uploader .value`).append(
        $(`<a />`)
            .attr({'target':`_blank`,'href':`https://plus.google.com/`+experiment.uploader})
            .text(experiment.uploader)
    );
    const yesOption = $(`<option>`).text(`yes`);
    const noOption = $(`<option>`).text(`no`);
    experiment.private === true ? yesOption.attr({'selected':`selected`}) : noOption.attr({'selected':`selected`});
    $(experimentContainerIdentifier+` .is-private .value`).append(
        $(`<select>`).attr({id:`private-select`}).append([yesOption.clone(),noOption.clone()])
    );

    // meta-data
    $(metaDataContaierIdentifier+` .description .value`).append($(`<textarea>`).attr({id:`description`}).val(experiment.metaData.description));
    yesOption.removeAttr(`selected`);
    noOption.removeAttr(`selected`);
    experiment.metaData.lysate === `yes` ? yesOption.attr({'selected':`selected`}) : noOption.attr({'selected':`selected`});
    $(metaDataContaierIdentifier+` .lysate .value`).append(
        $(`<select>`).attr({id:`lysate-select`}).append([yesOption.clone(),noOption.clone()])
    );

    drawSaveButton();

    $(experimentsStatisticsContainerIdentifier).removeClass(`data-container`);
    $(errorContainerIdentifier).removeClass(`data-container`);
};

const drawSaveButton = () => {
    $(saveExperimentButtonContainerIdentifier).append(
        $(`<button>`).attr({id:`save-button`}).text(`Save`)
    );

    $(`#save-button`).on(`click`, () => {
        const id = $(`#experiment-id`).text();
        const experimentNew = {
            name: $(`#name`).val(),
            private: $(`#private-select`).find(`:selected`).text(),
            metaData: {
                lysate: $(`#lysate-select`).find(`:selected`).text() === `yes` ? true : false,
                description: $(`#description`).val()
            }
        };

        console.log(id, experimentNew);
        ExperimentService.updateExperiment(id, experimentNew)
            .then(updated => console.log(`updated`, updated))
            .catch(e => console.error(`error updating the experiment`, e));
    });
};

$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    if(query.id) {

        $(`#experiment-id`).text(query.id);

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
