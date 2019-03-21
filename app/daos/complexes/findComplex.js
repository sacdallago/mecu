module.exports = {
    getFirstValidExperimentQuery: () => `
        select id
        from experiments e
        where e.private = false or e.uploader = :uploader
        limit 1;
    `,
    query: (sortBy, order, subCount) => {
        return `
            select distinct on (complexes.id) *, count(*) over() as total
            from (
                    (
                        select id,
                              name,
                              proteins,
                              count(*) over ()
                        from complexes
                        where name like :searchTerm
                    )
                union
                    (
                        select
                          id,
                          name,
                          proteins,
                          count(*) over ()
                        from
                          complexes c,
                          (
                            select "complexId", count(*)
                            from protein_complexes
                            where "uniprotId" like :searchTerm
                            group by "complexId"
                          ) sub
                        where
                            sub."complexId" = c.id and
                            sub.count >= ${subCount}
                    )
                ) as tmp,
                complexes
            where complexes.id = tmp.id
            order by complexes.${sortBy} ${order}
            offset :offset
            limit :limit;
        `;
    }
};
