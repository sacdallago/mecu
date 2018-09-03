module.exports = function(context) {
    const usersModel = context.component('models').module('users');
    const proteinsModel = context.component('models').module('proteins');
    const experimentsModel = context.component('models').module('experiments');
    const temperatureReadsModel = context.component('models').module('temperatureReads');
    const complexesModel = context.component('models').module('complexes');
    const proteinXcomplexModel = context.component('models').module('proteinXcomplex');
    const proteinXProteinModel = context.component('models').module('proteinXprotein');

    // m-to-n between complex and protein
    proteinsModel.belongsToMany(complexesModel, {
        as: 'proteinM',
        through: {
            model: proteinXcomplexModel,
            unique: false
        },
        foreignKey: 'uniprotId',
        constraints: false
    });
    complexesModel.belongsToMany(proteinsModel, {
        as: 'complexM',
        through: {
            model: proteinXcomplexModel,
            unique: false
        },
        foreignKey: 'complexId',
        constraints: false
    });

    // m-to-n between protein and protein
    proteinsModel.belongsToMany(proteinsModel, {
        as: 'proteinXprotein1',
        through: {
            model: proteinXProteinModel,
            unique: false
        },
        foreignKey: 'interactor1',
        constraints: false
    });
    proteinsModel.belongsToMany(proteinsModel, {
        as: 'proteinXprotein2',
        through: {
            model: proteinXProteinModel,
            unique: false
        },
        foreignKey: 'interactor2',
        constraints: false
    });
}
