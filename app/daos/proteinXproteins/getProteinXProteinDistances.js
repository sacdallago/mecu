module.exports = {
    query: (proteinWhereClause, experimentWhereClause) => {
        return `
        select t.*, pp.correlation as correlation
        from (
            select
               t1."uniprotId" as interactor1,
               t2."uniprotId" as interactor2,
               t1.experiment as interactor1_experiment,
               t2.experiment as interactor2_experiment,
               euclidian(t1.vector, t2.vector) as "distance"
            from
                 (
                      SELECT "uniprotId", "experiment", array_agg(ratio order by temperature asc) as "vector"
                      FROM "temperatureReads" tr, experiments e
                      WHERE
                          ${proteinWhereClause} and ${experimentWhereClause} and
                          e.id = tr.experiment and (e.private = false or e.uploader = :uploader)
                      GROUP BY "uniprotId", "experiment"
                 ) t1
            right join
                 (
                      SELECT "uniprotId", "experiment", array_agg(ratio order by temperature asc) as "vector"
                      FROM "temperatureReads" tr, experiments e
                      WHERE
                          ${proteinWhereClause} and ${experimentWhereClause} and
                          e.id = tr.experiment and (e.private = false or e.uploader = :uploader)
                      GROUP BY "uniprotId", "experiment"
                 ) t2
            on
                t1."uniprotId" = t2."uniprotId" or
                t1."uniprotId" != t2."uniprotId"
            order by interactor1, interactor2
            ) t
        left join
            protein_proteins as pp
        on (t.interactor1 = pp.interactor1 and t.interactor2 = pp.interactor2) or
            (t.interactor1 = pp.interactor2 and t.interactor2 = pp.interactor1)
        ;`;
    }
};
