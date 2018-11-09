module.exports = {
    query: () => {
        return `
            SELECT DISTINCT e.id, e.name
            FROM
                experiments e,
                protein_experiments pe,
                (SELECT "uniprotId" FROM protein_complexes pc WHERE pc."complexId" = :complexId) proteins
            WHERE
                pe."uniprotId" = proteins."uniprotId" AND
                pe."experimentId" = e.id AND
                (e.private = false or e.uploader = :uploader);
        `;
    }
};
