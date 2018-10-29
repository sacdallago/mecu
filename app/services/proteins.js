module.exports = function(context) {
    const proteinsController = context.component(`controllers`).module(`proteins`);
    context.api
        .post(`/protein/search/exp/`, proteinsController.getProteinsFromExp)
        .post(`/protein/experimentcombinations`, proteinsController.getProteinExperimentCombinations)
        .post(`/protein/proteinxproteindistances`, proteinsController.getProteinXProteinDistances)
        .get(`/protein/:name/experiment/:expid`, proteinsController.getSpecProt)
        .get(`/protein/interactions/:uniprotId/exp/:expId`, proteinsController.getProteinInteractions)
    ;
};
