module.exports = {
    query: () => {
        return `
            select interactor1, interactor2, correlation, experiments, species
                from protein_proteins
                where interactor1 = :interactor1

            union

            select interactor2 as interactor1, interactor1 as interactor2, correlation, experiments, species
                from protein_proteins
                where interactor2 = :interactor2

            order by correlation desc;`;
    }
};
