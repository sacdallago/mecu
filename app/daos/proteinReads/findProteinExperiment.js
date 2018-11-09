module.exports = {
    query: () => {
        return `
            SELECT pr."uniprotId", pr.experiment, pr.peptides, pr.psms, pr."createdAt", pr."updatedAt"
            FROM "proteinReads" pr, "experiment_proteinReads" e_pr, experiments e
            WHERE
                pr."uniprotId" = :uniprotId AND
                pr.id = e_pr."proteinReadId" AND
                e_pr."experimentId" = e.id AND
                e.id = :experimentId AND
                (e.private = false or e.uploader = :uploader);
        `;
    }
};
