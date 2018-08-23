module.exports = function(context) {
    const usersModel = context.component('models').module('users');
    const proteinsModel = context.component('models').module('proteins');
    const experimentsModel = context.component('models').module('experiments');
    const temperatureReadsModel = context.component('models').module('temperatureReads');
    const complexesModel = context.component('models').module('complexes');
    const proteinXcomplexModel = context.component('models').module('proteinXcomplex');

    proteinsModel.belongsToMany(complexesModel, {
        as: 'proteinM',
        through: {
            model: proteinXcomplexModel,
            unique: false
        },
        foreignKey: 'uniprodId',
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
}
