module.exports = {
    query: () => {
        return `
            SELECT tr.experiment, tr."uniprotId", json_agg(json_build_object('t', tr.temperature, 'r', tr.ratio)) as reads
            FROM experiments e, "experiment_temperatureReads" e_tr, "temperatureReads" tr, proteins p, "protein_temperatureReads" p_tr
            where
                e.id = :experimentId and
                (e.private = :isPrivate or e.uploader = :uploader) AND
                e.id = e_tr."experimentId" and
                e_tr."temperatureReadId" = tr.id and
                p."uniprotId" = :proteinName and
                p_tr."uniprotId" = p."uniprotId" and
                p_tr."temperatureReadId" = tr.id
            GROUP BY tr."experiment", tr."uniprotId";
        `;
    }
};
