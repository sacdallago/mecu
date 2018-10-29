module.exports = function(context) {

    // core relations
    const experimentsModel = context.component(`models`).module(`experiments`);
    const proteinsModel = context.component(`models`).module(`proteins`);
    const proteinReadsModel = context.component(`models`).module(`proteinReads`);
    const complexesModel = context.component(`models`).module(`complexes`);
    const temperatureReadsModel = context.component(`models`).module(`temperatureReads`);

    // m-to-n relations
    const proteinXProteinModel = context.component(`models`).module(`proteinXprotein`);
    const proteinXProteinReadModel = context.component(`models`).module(`proteinXproteinReads`);
    const proteinXComplexModel = context.component(`models`).module(`proteinXcomplex`);
    const proteinXExperimentModel = context.component(`models`).module(`proteinXexperiments`);
    const proteinXTemperatureReadModel = context.component(`models`).module(`proteinXtemperatureReads`);
    const experimentXProteinReadModel = context.component(`models`).module(`experimentXproteinReads`);
    const experimentXTemperatureReadModel = context.component(`models`).module(`experimentXtemperatureReads`);

    // m-to-n: protein and complex
    proteinsModel.belongsToMany(complexesModel, {
        as: `proteinM`,
        through: {
            model: proteinXComplexModel,
            unique: false
        },
        foreignKey: `uniprotId`,
        constraints: false
    });
    complexesModel.belongsToMany(proteinsModel, {
        as: `complexM`,
        through: {
            model: proteinXComplexModel,
            unique: false
        },
        foreignKey: `complexId`,
        constraints: false
    });

    // m-to-n: protein and protein
    proteinsModel.belongsToMany(proteinsModel, {
        as: `proteinXprotein1`,
        through: {
            model: proteinXProteinModel,
            unique: false
        },
        foreignKey: `interactor1`,
        constraints: false
    });
    proteinsModel.belongsToMany(proteinsModel, {
        as: `proteinXprotein2`,
        through: {
            model: proteinXProteinModel,
            unique: false
        },
        foreignKey: `interactor2`,
        constraints: false
    });

    // m-to-n: protein and experiment
    proteinsModel.belongsToMany(experimentsModel, {
        as: `proteinXexperiment1`,
        through: {
            model: proteinXExperimentModel,
            unique: false
        },
        foreignKey: `uniprotId`,
        constraints: false
    });
    experimentsModel.belongsToMany(proteinsModel, {
        as: `proteinXexperiment2`,
        through: {
            model: proteinXExperimentModel,
            unique: false
        },
        foreignKey: `experimentId`,
        constraints: false
    });

    // m-to-n: protein and proteinRead
    proteinsModel.belongsToMany(proteinReadsModel, {
        as: `proteinXproteinReads1`,
        through: {
            model: proteinXProteinReadModel,
            unique: false
        },
        foreignKey: `uniprotId`,
        constraints: false
    });
    proteinReadsModel.belongsToMany(proteinsModel, {
        as: `proteinXproteinReads2`,
        through: {
            model: proteinXProteinReadModel,
            unique: false
        },
        foreignKey: `proteinReadId`,
        constraints: false
    });

    // m-to-n: protein and temperatureReads
    proteinsModel.belongsToMany(temperatureReadsModel, {
        as: `proteinXtemperatureRead1`,
        through: {
            model: proteinXTemperatureReadModel,
            unique: false
        },
        foreignKey: `uniprotId`,
        constraints: false
    });
    temperatureReadsModel.belongsToMany(proteinsModel, {
        as: `proteinXtemperatureRead2`,
        through: {
            model: proteinXTemperatureReadModel,
            unique: false
        },
        foreignKey: `temperatureReadId`,
        constraints: false
    });

    // m-to-n: experiment and proteinRead
    experimentsModel.belongsToMany(proteinReadsModel, {
        as: `experimentXproteinRead1`,
        through: {
            model: experimentXProteinReadModel,
            unique: false
        },
        foreignKey: `experimentId`,
        constraints: false
    });
    proteinReadsModel.belongsToMany(experimentsModel, {
        as: `experimentXproteinRead2`,
        through: {
            model: experimentXProteinReadModel,
            unique: false
        },
        foreignKey: `proteinReadId`,
        constraints: false
    });

    // m-to-n: experiment and temperatureRead
    experimentsModel.belongsToMany(temperatureReadsModel, {
        as: `experimentXtemperatureRead1`,
        through: {
            model: experimentXTemperatureReadModel,
            unique: false
        },
        foreignKey: `experimentId`,
        constraints: false
    });
    temperatureReadsModel.belongsToMany(experimentsModel, {
        as: `experimentXtemperatureRead2`,
        through: {
            model: experimentXTemperatureReadModel,
            unique: false
        },
        foreignKey: `temperatureReadId`,
        constraints: false
    });

};
