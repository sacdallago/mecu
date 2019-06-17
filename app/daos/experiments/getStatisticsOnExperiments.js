module.exports = {
    query: (requester) => {
        return `
            SELECT
                id, proteins
            FROM
                 experiments e, ( SELECT COUNT('uniprotId') AS "proteins", "experimentId"
                                  FROM protein_experiments AS protein_experiment
                                  GROUP BY protein_experiment."experimentId"
                                ) as eps
            WHERE
                eps."experimentId" = e.id and (e.private = ${false} or e.uploader = :uploader);
        `;
    }
};
