const lAExperimentNumber = new LoadingAnimation(`.experiment-number-loading-animation`, {size: 20});
const lAProteinCurve = new LoadingAnimation(`#protein-curve`);
const lAExperimentCurves = new LoadingAnimation(`#experiments-container .grid`, {size: 50});
const lARelComplexesCurves = new LoadingAnimation(`#related-complexes-container .grid`, {size: 50});
const lARelProteinsCurves = new LoadingAnimation(`#related-proteins-container .grid`, {size: 50});

let showModal = !(StorageManager.getProteins().length === 0);
const modalIdentifier = `#add-protein-modal`;
ModalService.createAddProteinToLocalStorageModalWithNoYesAddButtons(modalIdentifier);

const selectAllExperimentsButtonSelector = `#select-all-experiments-button`;
const selectAllPPIButtonSelector = `#select-all-ppi-button`;
const dropDownSelector = `#experiment-number .dropdown`;
const analyzeButtonSelector = `.analyze-button`;

const AMOUNT_OF_PPI_TO_DRAW = 20;

// grid for experiments which use this protein as well
const expWithProteinGridIdentifier = `#experiments-container .grid`;
const expWithProteinGrid = $(expWithProteinGridIdentifier).isotope({
    itemSelector: `.grid-item`,
    layoutMode: `packery`,
    packery: {
        gutter: 10
    }
});
expWithProteinGrid.on(`click`, `.grid-item`, function(){
    const data = $(this).data(`grid-item-contents`);

    if(showModal) {
        ModalService.openProteinAddModalAndWaitForAction(
            modalIdentifier,
            () => {},
            () => {
                StorageManager.clear();
                gridItemToggleDotAll(false);
                StorageManager.toggle(
                    {uniprotId: data.obj.uniprotId, experiment: data.experiment.experiment},
                    () => gridItemToggleDot(this)
                );
                showModal = true;
                enableAnalyzeButton();
            },
            () => {
                StorageManager.toggle(
                    {uniprotId: data.obj.uniprotId, experiment: data.experiment.experiment},
                    () => gridItemToggleDot(this)
                );
                showModal = true;
                enableAnalyzeButton();
            }
        );
    } else {
        StorageManager.toggle(
            {uniprotId: data.obj.uniprotId, experiment: data.experiment.experiment},
            () => gridItemToggleDot(this)
        );
        showModal = true;
        enableAnalyzeButton();
    }

});

const enableAnalyzeButton = () => {
    const l = document.querySelectorAll(analyzeButtonSelector);
    l.forEach(b => {
        b.classList.remove(`disabled`);
        b.classList.add(`green`);
    });
};

const gridItemToggleDot = (gridItem, show) => {
    let dot = $(gridItem).children(`.dot-div`);
    if(show === true) {
        dot.addClass(`selected-curve-dot`);
    } else if(show === false) {
        dot.removeClass(`selected-curve-dot`);
    } else {
        dot.toggleClass(`selected-curve-dot`);
    }
};
const gridItemToggleDotAll = (show) => {
    const targetItemList = document.querySelector(expWithProteinGridIdentifier).children;
    for(let i = 0; i < targetItemList.length; i++) {
        gridItemToggleDot(targetItemList[i], show);
    }
};

// grid for complexes
const complexesWithProteinGridIdentifier = `#related-complexes-container .grid`;
const complexesWithProteinGrid = $(complexesWithProteinGridIdentifier).isotope({
    itemSelector: `.grid-item`,
    layoutMode: `packery`,
    packery: {
        gutter: 10
    }
});
complexesWithProteinGrid.on(`click`, `.grid-item`, function(){
    const data = $(this).data(`grid-item-contents`);
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    document.location.href = `/complex?id=${data.obj.id}&experiment=${query.experiment}`;
});

// grid for interactions
const interactionsGridIdentifier = `#related-proteins-container .grid`;
const interactionsGrid = $(interactionsGridIdentifier).isotope({
    itemSelector: `.grid-item`,
    layoutMode: `packery`,
    packery: {
        gutter: 10
    }
});
interactionsGrid.on(`click`, `.grid-item`, function(){
    const data = $(this).data(`grid-item-contents`);
    console.log(`data`, data);
    if(data && data.obj.experiments.length > 0) {
        document.location.href = `/protein?protein=${data.obj.uniprotId}&experiment=${data.obj.experimentId}`;
    }
});


/**
 * [drawProteinData description]
 * @param  {experiment: number, uniprotId: string, reads: {r:number, t:number}[] } data [description]
 */
const drawProtein = (data) => {
    return Promise.all([
        drawProteinCurve(data),
        writeProteinMetaData(data)
    ]);
};

const drawProteinCurve = ({uniprotId, experiment, reads}) => {
    return new Promise((resolve) => {
        // creating data series for highcharts
        let series = [];
        series.push({
            name: uniprotId+` `+experiment,
            data: reads.map(r => [r.t, r.r]),
            color: HelperFunctions.stringToColor(uniprotId+`-E`+experiment),
            marker: {symbol: `circle`}
        });

        // configuring and plotting highcharts
        highChartsCurvesConfigObject[`title.text`] = `TPCA melting curve`;
        highChartsCurvesConfigObject[`yAxis.title.text`] = `% alive`;
        highChartsCurvesConfigObject[`xAxis.title.text`] = `Temperature`;
        highChartsCurvesConfigObject[`series`] = series;
        highChartsCurvesConfigObject[`tooltip`] = {
            split: true,
            distance: 30,
            padding: 5
        };
        highChartsCurvesConfigObject[`legend`] = {enabled: false};
        lAProteinCurve.stop();

        Highcharts.chart(`protein-curve`, highChartsCurvesConfigObject);

        resolve(true);
    });
};

const writeProteinMetaData = ({
    uniprotId, peptides, psms, p_createdAt, p_updatedAt, name, description,
    lysate, e_createdAt, e_updatedAt, uploader
}) => {
    return new Promise((resolve) => {
        $(`#protein-data .uniprot-id .value`)
            .attr({'target':`_blank`, 'href':`https://www.uniprot.org/uniprot/${uniprotId}`})
            .text(uniprotId);
        $(`#protein-data .peptides .value`).text(peptides);
        $(`#protein-data .psms .value`).text(psms);
        $(`#protein-data .created .value`).text(HelperFunctions.dateTimeStringPrettify(p_createdAt));
        $(`#protein-data .updated .value`).text(HelperFunctions.dateTimeStringPrettify(p_updatedAt));

        $(`#experiment-data .name .value`).text(name);
        $(`#experiment-data .description .value`).text(description);
        $(`#experiment-data .lysate .value`).text(lysate);
        $(`#experiment-data .created .value`).text(HelperFunctions.dateTimeStringPrettify(e_createdAt));
        $(`#experiment-data .updated .value`).text(HelperFunctions.dateTimeStringPrettify(e_updatedAt));
        $(`#experiment-data .uploader .value`).attr({'href':`https://plus.google.com/`+uploader})
            .text(`Google Plus Profile`);
        resolve(true);
    });
};

const drawOtherExperimentsSelect = (experiments, uniprotId, actualExperiment) => {
    return new Promise((resolve) => {

        const dropDownContainer = $(dropDownSelector).addClass([`ui`, `search`, `dropdown`]);
        dropDownContainer.dropdown({});
        $(`#experiment-number .dropdown .search`).css({'padding': `11 20px`});

        const menuContainer = $(`#experiment-number .dropdown .menu`);
        const otherExperiments = [];
        experiments.forEach(experiment => {
            if(experiment.experimentId != actualExperiment) {
                otherExperiments.push(
                    $(`<a />`)
                        .addClass(`item`)
                        .attr({'data-value':experiment.name, 'href':`/protein?protein=${uniprotId}&experiment=${experiment.experimentId}`})
                        .text(experiment.name.slice(0,255))
                );
            } else {
                otherExperiments.push(
                    $(`<a />`)
                        .addClass(`item`)
                        .attr({'data-value':`default`})
                        .text(experiment.name.slice(0,255))
                );
            }
        });
        menuContainer.append(otherExperiments);

        lAExperimentNumber.stop();

        $(dropDownSelector).dropdown({
            match: `both`,
            fullTextSearch: true,
            glyphWidth: 3.0
        });

        resolve(true);
    });
};

/**
 * [drawExperimentsWhichHaveProtein description]
 * @param  {[type]} const [description]
 * @return {[type]}       [description]
 */
const drawExperimentsWhichHaveProtein = (arr, actualExperiment) => {
    return new Promise((resolve) => {

        const proteinExperimentObject = [];
        arr[0].experiments.forEach((experiment, i) => {
            proteinExperimentObject.push({
                uniprotId: arr[0].uniprotId,
                experiments: [experiment],
                index: i
            });
        });

        const alreadyInStorage = StorageManager.getProteins();

        const toAppend = (obj, exp) => {
            return [
                $(`<p />`)
                    .addClass(`grid-item-text`)
                    .css({
                        'position': `absolute`,
                        'text-align': `center`,
                        'width': `100%`,
                        'line-height': `35px`,
                        'font-size': `1.2rem`
                    })
                    .text(obj.uniprotId),
                $(`<div />`)
                    .addClass([`experimentNumber`, `grid-item-text`])
                    .text(exp.experiment === parseInt(actualExperiment) ?
                        `Experiment ${actualExperiment} (Actual)`:
                        `Experiment ${exp.experiment}`
                    ),
                $(`<div />`)
                    .addClass(
                        `dot-div`+
                        (
                            alreadyInStorage.find(p =>
                                p.uniprotId === obj.uniprotId &&
                                p.experiment.find(e => e === obj.experiments[0].experiment)
                            ) ? ` selected-curve-dot` : ``
                        )
                    )
            ];
        };

        lAExperimentCurves.stop();

        HelperFunctions.drawItemForEveryExperiment(expWithProteinGridIdentifier, proteinExperimentObject, toAppend);

        // add functionality to select all button
        document.querySelector(selectAllExperimentsButtonSelector).addEventListener(
            `click`,
            () => {
                if(showModal) {
                    ModalService.openProteinAddModalAndWaitForAction(
                        modalIdentifier,
                        () => {},
                        () => {
                            StorageManager.clear();
                            StorageManager.add(
                                arr[0].experiments.map(e => ({uniprotId: arr[0].uniprotId, experiment: e.experiment})),
                                () => {
                                    document.querySelector(selectAllExperimentsButtonSelector).classList.add(`green`);
                                    document.querySelector(selectAllExperimentsButtonSelector).classList.add(`disabled`);
                                    gridItemToggleDotAll(true);
                                    enableAnalyzeButton();
                                }
                            );
                        },
                        () => {
                            StorageManager.add(
                                arr[0].experiments.map(e => ({uniprotId: arr[0].uniprotId, experiment: e.experiment})),
                                () => {
                                    document.querySelector(selectAllExperimentsButtonSelector).classList.add(`green`);
                                    document.querySelector(selectAllExperimentsButtonSelector).classList.add(`disabled`);
                                    gridItemToggleDotAll(true);
                                    enableAnalyzeButton();
                                }
                            );
                        }
                    );
                } else {
                    showModal = true;
                    StorageManager.add(
                        arr[0].experiments.map(e => ({uniprotId: arr[0].uniprotId, experiment: e.experiment})),
                        () => {
                            document.querySelector(selectAllExperimentsButtonSelector).classList.add(`green`);
                            document.querySelector(selectAllExperimentsButtonSelector).classList.add(`disabled`);
                            gridItemToggleDotAll(true);
                            enableAnalyzeButton();
                        }
                    );
                }
            }
        );

        resolve(true);
    });

};

const drawRelatedComplexes = (complexes) => {
    return new Promise((resolve) => {

        if(complexes.length === 0) {
            lARelComplexesCurves.stop();
            document.querySelector(complexesWithProteinGridIdentifier).textContent = `No complexes containing this protein found.`;
            resolve(true);
            return;
        }

        // split up protein/experiments pairs into protein/experiment(single) pairs
        const proteinExperimentObject = [];
        let index = 0;
        complexes.forEach(complex => {
            const obj = {
                uniprotId: complex.name,
                id: complex.id,
                index: index,
                proteins: [],
                experiments: [],
                total: 0,
                present: 0
            };
            index++;

            complex.proteins.forEach(protein => {
                if(protein.experiments) {
                    protein.experiments.forEach(experiment => {
                        if(obj.experiments) {
                            obj.experiments.push({
                                experiment: protein.uniprotId,
                                uniprotId: protein.uniprotId,
                                reads: experiment.reads
                            });
                        } else {
                            obj.experiments = [{
                                experiment: protein.uniprotId,
                                uniprotId: protein.uniprotId,
                                reads: experiment.reads
                            }];
                        }
                    });
                    obj.present++;
                }
                obj.total++;
            });
            proteinExperimentObject.push(obj);
        });

        const toAppend = (obj) => {
            return [
                $(`<p />`)
                    .addClass(`grid-item-text`)
                    .css({
                        'position': `absolute`,
                        'text-align': `center`,
                        'width': `100%`,
                        'line-height': `35px`,
                        'font-size': `1.2rem`,
                        'z-index': 100
                    })
                    .text(obj.uniprotId),
                $(`<div />`)
                    .addClass([`experimentNumber`, `grid-item-text`])
                    .text(obj.present+`/`+obj.total)
            ];
        };

        HelperFunctions.drawItemsAllExperimentsInOneItem(complexesWithProteinGridIdentifier, proteinExperimentObject, toAppend);

        resolve(true);
    });
};

const drawProteinInteractions = (proteinInteractions, proteinsContainedInExperiment, experimentId) => {
    return new Promise((resolve) => {

        if(proteinInteractions.length === 0) {
            lARelProteinsCurves.stop();
            document.querySelector(interactionsGridIdentifier).textContent = `No protein interactions for this protein in the database.`;
            resolve(true);
            return;
        }

        // split up protein/experiments pairs into protein/experiment(single) pairs
        const proteinExperimentObject = [];
        let index = 0;
        proteinInteractions.forEach(interaction => {
            const obj = {
                experimentId: experimentId,
                interactor1: interaction.interactor1.uniprotId,
                uniprotId: interaction.interactor2.uniprotId,
                index: index,
                correlation: interaction.correlation,
                experiments: [],
                total: 2,
                present: 1
            };
            index++;

            if(interaction.interactor2.experiments) {
                obj.experiments.push({
                    reads: interaction.interactor2.experiments[0].reads,
                    experiment: interaction.interactor2.uniprotId,
                    uniprotId: interaction.interactor2.uniprotId
                });
                obj.present++;
            }

            proteinExperimentObject.push(obj);
        });

        const toAppend = (obj) => {
            const ret = [
                $(`<p />`)
                    .addClass(`grid-item-text`)
                    .css({
                        'position': `absolute`,
                        'text-align': `center`,
                        'width': `100%`,
                        'line-height': `35px`,
                        'font-size': `1.2rem`
                    })
                    .text(obj.uniprotId)
            ];

            if(obj.present === 1) {
                ret.push(
                    $(`<div />`)
                        .addClass([`cube-text-middle`, `grid-item-text`])
                        .text(`No data for this experiment`)
                );
            }

            ret.push(
                $(`<div />`)
                    .addClass([`correlation`, `grid-item-text`])
                    .text(obj.correlation)
            );

            return ret;
        };

        HelperFunctions.drawItemsAllExperimentsInOneItem(interactionsGridIdentifier, proteinExperimentObject, toAppend, AMOUNT_OF_PPI_TO_DRAW);


        // add functionality to select all button
        const toAdd = proteinInteractions.map(int => {
            if(int.interactor2 && int.interactor2.experiments) {
                return ({uniprotId: int.interactor2.uniprotId, experiment: parseInt(experimentId)});
            }
        }).filter(x => !!x);
        document.querySelector(selectAllPPIButtonSelector).addEventListener(
            `click`,
            () => {
                ModalService.openProteinAddModalAndWaitForAction(
                    modalIdentifier,
                    () => {},
                    () => {
                        StorageManager.clear();
                        StorageManager.add(
                            toAdd,
                            () => {
                                document.querySelector(selectAllPPIButtonSelector).classList.add(`green`);
                                document.querySelector(selectAllPPIButtonSelector).classList.add(`disabled`);
                                // gridItemToggleDotAll(true);
                                enableAnalyzeButton();
                            }
                        );
                    },
                    () => {
                        StorageManager.add(
                            toAdd,
                            () => {
                                document.querySelector(selectAllPPIButtonSelector).classList.add(`green`);
                                document.querySelector(selectAllPPIButtonSelector).classList.add(`disabled`);
                                // gridItemToggleDotAll(true);
                                enableAnalyzeButton();
                            }
                        );
                    }
                );
            }
        );

        resolve(true);
    });
};


// on page drawing finished, start requests
$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log(`query`, query);
    if(query.protein && query.experiment) {

        // data for protein curve and meta data
        const proteinCurveAndMetaData = ProteinService.getSpecificProtein(query.protein, query.experiment)
            .then(proteinData => {
                console.log(`proteinCurveData`, proteinData);
                if(Object.keys(proteinData).length > 0) {
                    return drawProtein(proteinData);
                } else {
                    return Promise.resolve(true);
                }
            });

            // list of experiments which have this protein
        const otherExperimentsAndSelect = ExperimentService.experimentsWhichHaveProtein(query.protein)
            .then(exps => {
                console.log(`exps`, exps);
                return Promise.all([
                    // list of experiments, which ahve this protein, but not the actual experiment
                    drawOtherExperimentsSelect(exps, query.protein, query.experiment),
                    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(
                        exps.map(exp =>
                            ({
                                uniprotId: query.protein,
                                experiment: exp.experimentId
                            })
                        )
                    )
                        .then(reads => {
                            console.log(`reads`, reads);
                            // protein curves of other experiments
                            return drawExperimentsWhichHaveProtein(reads, query.experiment);
                        })
                ]);
            });

            // list of complexes which have this protein
        const complexes = ComplexService.getAllComplexesWhichContainProtein(query.protein, query.experiment)
            .then(complexes => {
                console.log(`complexes`, complexes);
                return drawRelatedComplexes(complexes);
            });

            // list of protein interactions, which have this protein
        const ppi = Promise.all([
            ProteinService.getProteinInteractions(query.protein, query.experiment),
            ExperimentService.allProteinsContainedInExperiment(query.experiment)
        ])
            .then(([proteinInteractions, proteinsContainedInExperiment]) => {
                console.log(`proteinInteractions`, proteinInteractions);
                console.log(`proteinsContainedInExperiment`, proteinsContainedInExperiment);
                return drawProteinInteractions(proteinInteractions, proteinsContainedInExperiment, query.experiment);
            });

        lAExperimentNumber.start();
        lAProteinCurve.start();
        lAExperimentCurves.start();
        lARelComplexesCurves.start();
        lARelProteinsCurves.start();

        proteinCurveAndMetaData
            .then(() => console.log(`proteinCurveAndMetaData`))
            .then(() => otherExperimentsAndSelect)
            .then(() => console.log(`otherExperimentsAndSelect`))
            .then(() => complexes)
            .then(() => console.log(`complexes`))
            .then(() => ppi)
            .then(() => console.log(`ppi`))
            .then(() => {
                console.log(`done`);
            })
            .catch(error => {
                console.error(`loading error`, error);
            });

    }
});

TourHelper.attachTour('#help-menu-item', [
    {
        target: '#spacedText',
        content: 'This page shows you protein-centric information.',
        placement: ['bottom']
    },
    {
        target: '#experiment-number',
        content: 'Here you can select which experiment to use for the given protein (this is useful for the sections below).',
        placement: ['left', 'right', 'top', 'bottom']
    },
    {
        before: () => {
            $('#experiment-number input.search').focus();
            return new Promise((res, rej) => {
                setTimeout(() => {res();}, 200);
            });
        },
        target: '#experiment-number > div > .menu',
        content: 'These are the experiments in which this protein was measured.',
        placement: ['bottom'],
        after: () => {
            $('#experiment-number input.search').focus();
            return Promise.resolve();
        }
    },
    {
        // before: () => { // doesnt work
        //     $('path.highcharts-point:nth-child(3)').trigger('mouseenter');
        //     return Promise.resolve();
        // },
        target: '#protein-curve',
        content: 'The proteins melting curve. Hovering over it gives you the discrete values for the specific degree.',
        placement: ['right', 'top', 'bottom', 'left']
    },
    {
        target: '.meta-data-container',
        content: 'This table displays additional data for the selected protein in the given experiment.',
        placement: ['right', 'top', 'bottom', 'left']
    },

    // experiments with this protein
    {
        target: '#experiments-container',
        content: 'This section shows you the TPCA curves for the given protein in other experiments.',
        placement: ['bottom', 'left', 'right', 'top']
    },
    {
        target: '#experiments-container .grid',
        content: 'Clicking a box will add the protein to the visualization tools in the Analyze page.',
        placement: ['bottom', 'left', 'right', 'top']
    },
    {
        target: '.buttons .select-all-button',
        content: 'If you want to select all of the proteins listed here, click here!',
        placement: ['top', 'bottom', 'left', 'right']
    },
    {
        target: '.buttons .analyze-button',
        content: 'If you select some of these proteins, this button allows you to transition right into the Analyze page.',
        placement: ['top', 'bottom', 'left', 'right']
    },

    // related complexes
    {
        target: '#related-complexes-container',
        content: 'This section shows the complexes, which contain this protein',
        placement: ['bottom', 'left', 'right', 'top']
    },
    {
        target: '#related-complexes-container .grid .grid-item:nth-child(1)',
        content: 'Each of the items is clickable and redirects you to the respective complex page. There you can find more information about the complex.',
        placement: ['bottom', 'left', 'right', 'top']
    },
    {
        target: '#related-complexes-container .grid .grid-item:nth-child(1) .grid-item-text',
        content: 'The top displays the complex name.',
        placement: ['top', 'bottom', 'left', 'right']
    },
    {
        target: '#related-complexes-container .grid .grid-item:nth-child(1) .experimentNumber.grid-item-text',
        content: 'The bottom right shows how many of the proteins in the complex are found in the selected experiment. Remember: you can switch experiment anytime in the top right of this page!',
        placement: ['top', 'bottom', 'left', 'right']
    },

    // protein interactions
    {
        target: '#related-proteins-container',
        content: 'This section shows the interactions of this protein with other proteins as from HIPPIE data.',
        placement: ['top', 'bottom', 'left', 'right']
    },
    {
        target: '#related-proteins-container .grid .grid-item:nth-child(1)',
        content: 'Each of the items is clickable and redirects you to the respective protein page.',
        placement: ['bottom', 'left', 'right', 'top']
    },
    {
        target: '#related-proteins-container .grid .grid-item:nth-child(1) .grid-item-text',
        content: 'The top displays the name of the interacting protein.',
        placement: ['top', 'bottom', 'left', 'right']
    },
    {
        target: '#related-proteins-container .grid .grid-item:nth-child(1) .correlation.grid-item-text',
        content: 'The bottom right shows the HIPPIE score.',
        placement: ['top', 'bottom', 'left', 'right']
    },
]);
