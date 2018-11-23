# MECU

Protein, Protein-Protein and Complex Webpage

## Getting Started

1. docker-compose up -d (to just run the app)
2.

### Prerequisites

* npm: 6.4.1
* node: v8.11.3
* psql: 10.3

### Installing

Check Prerequisites
```
1. pull the repo
2. npm install
3. npm run start
```


#### Example private/config.js
Consists of the configuration options to get the app running.

Default *config.js* if *private/config.js* does not exist:
```js
module.exports = {
    "database" : {
        "username": process.env.databaseuser,
        "password": process.env.databasepassword,
        "port": process.env.databaseport || `5432`,
        "uri": process.env.databaseuri || `localhost`,
        "collection": process.env.databasecollection || `mecu`,
        "logging": process.env.databaselogging || false
    },
    "passport" : {
        "google" : {
            "clientId": process.env.googleclientid,
            "clientSecret": process.env.googleclientsecret
        }
    },
    "application" : {
        "hostname" : process.env.applicationhostname,
        "protocol": process.env.applicationprotocol,
        "port": process.env.applicationport || `3000`
    },
    "analytics" : {
        "google" : {
            "trackingId": process.env.googletrackingid
        }
    },
    "sessionSecret" : process.env.sessionsecret
};
```

Overwrite these environment-parameters when starting the docker container.

## Deployment

TODO

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

* [**Christian Dallago** - *Initial work*](https://github.com/sacdallago)
* [**Klaus Niedermair** - *Continues work*](https://github.com/KlausNie)

See also the list of [contributors](https://github.com/sacdallago/mecu/graphs/contributors) who participated in this project.

## License

TODO

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc

# Additional

## UML Diagram
![UML Diagram](https://github.com/sacdallago/mecu/tree/master/docs/public.png "UML Diagram")

## Upload Experiment format:

### Current
.txt file accepted format (!! table is only for better visualization !!):

|   **Header**  |   Accession   |   Description	|   GeneName	|   Peptides	|   PSMs	|   AAs	|   MW.kDA	|   pI	|   QuantifyingPSMs	|   T37	|   T40	|   T43	|   T46	|   T49	|   T52	|   T55	|   T58	|   T61	|   T64	|
|---    |---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|   **Example Line**    |   A0A023T672	|   RNA-binding protein 8A OS=Mus musculus GN=RBM8 PE=1 SV=1	|   RBM8	|   10	|   32	|   174	|   19.877	|   5.72	|   11	|   1.000	|   0.958	|   0.976	|   0.922	|   8.100	|   0.830	|   0.612	|   0.386	|   0.284	|   0.256	|

Lines are one dataset (tab spaced). Header line is included in the file.
