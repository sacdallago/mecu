const fs = require('fs');
const FILE_TO_CREATE_NAME = 'COHESIONINDEX.sql';

fs.writeFileSync(
    'scripts/'+FILE_TO_CREATE_NAME,
    `
    /*
    RUNTIME: 3h
     */

    create function vec_sub(arr1 double precision[], arr2 double precision[]) returns double precision[]
    immutable
    strict
    language sql
    as $$
    SELECT array_agg(result)
        FROM (SELECT (tuple.val1 - tuple.val2)*(tuple.val1 - tuple.val2)
            AS result
            FROM (SELECT UNNEST($1) AS val1
                   ,UNNEST($2) AS val2
                   ,generate_subscripts($1, 1) AS ix) tuple
        ORDER BY ix) inn;
    $$;

    create function euclidian(arr1 double precision[], arr2 double precision[]) returns double precision
    immutable
    strict
    language sql
    as $$
    select sqrt(SUM(tab.v)) as euclidian from (SELECT
         UNNEST(vec_sub(arr1,arr2)) as v) as tab;
    $$;


    DROP VIEW IF EXISTS protein_vectors;
    CREATE OR REPLACE VIEW protein_vectors AS
      SELECT "uniprotId", "experiment", array_agg(ratio) as "vector"
      FROM mecu.public."temperatureReads"
      GROUP BY "uniprotId", "experiment";


    DROP VIEW IF EXISTS ppi_distances;
    CREATE OR REPLACE VIEW ppi_distances AS
      SELECT inter1.interactor1,
             inter1.vector as "vector1",
             inter2.interactor2,
             inter2.vector as "vector2",
             inter1.experiment,
             euclidian(inter1.vector, inter2.vector) as "distance",
             inter1.correlation as correlation -- as correlation --is same as inter2.correlation
      FROM (
           SELECT protein_proteins.interactor1,
                  protein_proteins.interactor2,
                  protein_proteins.correlation,
                  protein_vectors.experiment,
                  protein_vectors.vector
           FROM protein_proteins, protein_vectors
           WHERE
               protein_proteins.interactor1 != protein_proteins.interactor2 AND
               protein_proteins.interactor1 = protein_vectors."uniprotId"
       ) as inter1,
       (
           SELECT protein_proteins.interactor1,
                  protein_proteins.interactor2,
                  protein_proteins.correlation,
                  protein_vectors.experiment,
                  protein_vectors.vector
           FROM protein_proteins, protein_vectors
           WHERE
               protein_proteins.interactor1 != protein_proteins.interactor2 AND
               protein_proteins.interactor2 = protein_vectors."uniprotId"
       ) AS inter2
      WHERE
          inter1.interactor1 = inter2.interactor1 AND
          inter1.interactor2 = inter2.interactor2 AND
          inter1.experiment = inter2.experiment;


    -- Average per experiment could be an indicator of how good an experiment is.
    DROP VIEW IF EXISTS average_ppi_distance_per_experiment;
    CREATE MATERIALIZED VIEW average_ppi_distance_per_experiment AS
    SELECT experiment, SUM(distance)/COUNT(*) as "average_distance"
    FROM ppi_distances
    GROUP BY experiment;
    -- REFRESH MATERIALIZED VIEW average_ppi_distance_per_experiment;


    -- Average of interaction across experiments could be an indicator of how likely an interaction is.
    DROP VIEW IF EXISTS average_ppi_distance_per_ppi;
    CREATE MATERIALIZED VIEW average_ppi_distance_per_ppi AS
    SELECT interactor1, interactor2, SUM(distance)/COUNT(*) as "average_distance", array_agg(experiment) as "experiments"
    FROM ppi_distances
    GROUP BY interactor1, interactor2;
    -- REFRESH MATERIALIZED VIEW average_ppi_distance_per_ppi;


    DROP VIEW IF EXISTS pairwaise_complex_interactions;
    CREATE OR REPLACE VIEW pairwaise_complex_interactions AS
    SELECT protein_proteins.interactor1, protein_proteins.interactor2, complex_protein_pairs."complexId"
    FROM protein_proteins
           JOIN (
                SELECT A."uniprotId" AS interactor1, B."uniprotId" AS interactor2, A."complexId"
                FROM protein_complexes as A
                       LEFT JOIN protein_complexes as B
                         ON A."complexId" = B."complexId" AND A."uniprotId" != B."uniprotId"
                ) AS complex_protein_pairs
             ON protein_proteins.interactor1 = complex_protein_pairs.interactor1 AND
                protein_proteins.interactor2 = complex_protein_pairs.interactor2;


    DROP VIEW IF EXISTS average_complex_distance_per_experiment;
    CREATE MATERIALIZED VIEW average_complex_distance_per_experiment AS
    SELECT experiment, "complexId", AVG(distance)
    FROM ppi_distances
    JOIN pairwaise_complex_interactions
        ON ppi_distances.interactor1 = pairwaise_complex_interactions.interactor1 AND
           ppi_distances.interactor2 = pairwaise_complex_interactions.interactor2
    GROUP BY experiment, "complexId";


    drop view if exists ppi_scores_distances_correlations;
    create view ppi_scores_distances_correlations as
    SELECT bins.bins, ppi_distances.experiment, corr(ppi_distances.distance, ppi_distances.correlation) AS corr
    FROM ppi_distances, unnest(ARRAY[(0)::numeric, 0.25, 0.5, 0.75, 0.8, 0.9]) bins(bins)
    WHERE (ppi_distances.distance > (bins.bins)::double precision)
    GROUP BY bins.bins, ppi_distances.experiment;

    drop view if exists ppi_scores_distances_covariance;
    create view ppi_scores_distances_covariance as
    SELECT bins.bins, ppi_distances.experiment, covar_samp(ppi_distances.distance, ppi_distances.correlation) AS corr
    FROM ppi_distances, unnest(ARRAY[(0)::numeric, 0.25, 0.5, 0.75, 0.8, 0.9]) bins(bins)
    WHERE (ppi_distances.distance > (bins.bins)::double precision)
    GROUP BY bins.bins, ppi_distances.experiment;
    `,
    {flag: 'w'},
    function (err) {
        if (err) {
            console.log('appending error', err)
        }
    }
);
