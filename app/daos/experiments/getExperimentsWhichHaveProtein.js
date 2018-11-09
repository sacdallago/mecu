module.exports = {
    query: () => {
        return `
            SELECT "experimentId", name
            FROM protein_experiments pe, experiments e
            WHERE
                pe."uniprotId" = :uniprotId and
                pe."experimentId" = e.id and
                (e.private = false or e.uploader = :uploader);
        `;
    }
};
