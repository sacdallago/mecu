module.exports = {
    query: (nameWhereQuery, proteinWhereQuery, sortBy, order, subCount) => {
        return `
            select
                id,
                name,
                proteins,
                count(*) over() as total
            from
                complexes c,
                (select "complexId", count(*) from protein_complexes ${proteinWhereQuery} group by "complexId") sub
            where
                sub."complexId" = c.id and
                sub.count >= ${subCount}
                ${nameWhereQuery}
            order by ${sortBy} ${order}
            offset :offset
            limit :limit;
        `;
    }
};
