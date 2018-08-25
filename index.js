/**
 * Entry point
 *
 * Created by Christian Dallago on 20160416 .
 */

const Sequelize = require('sequelize');
const path = require('path');


var context;

module.exports = {
    start: function(callback) {
        callback = callback || function(){};

        // Initialize the context
        context = {
            constants: {
                seedComplexes: process.env.SEED_COMPLEXES || false
            }
        };

        // Function to load all components from the respective folders (models, controllers, services, daos, utils)
        context.component = function(componentName) {
            if (!context[componentName]) {
                context[componentName] = {};
            }

            return {
                module: function(moduleName) {
                    if (!context[componentName][moduleName]) {
                        console.log('Loading component ' + componentName);
                        context[componentName][moduleName] = require(path.join(__dirname, "app", componentName, moduleName))(context,
                            componentName, moduleName);
                        console.log('LOADED ' + componentName + '.' + moduleName);
                    }

                    return context[componentName][moduleName];
                }
            }
        };

        callback(context);
        return context;
    },
    connect: function(callback){
        const context   = this.start();
        const config    = require(__dirname + "/config");

        context.config  = config;

        //Create the DB connection string
        var databaseParams = config.database;
        var dbConnection = "postgres://";

        var configDB = {
            database: databaseParams.collection, //env var: PGDATABASE
            host: databaseParams.uri, // Server hosting the postgres database
            port: databaseParams.port, //env var: PGPORT
            max: 10, // max number of clients in the pool
            idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        };


        if(databaseParams.username  && databaseParams.username.length > 0){
            dbConnection += databaseParams.username;
            configDB.user = databaseParams.username;
        }

        if (databaseParams.username  && databaseParams.username.length > 0 && databaseParams.password && databaseParams.password.length > 0) {
            dbConnection += ":" + databaseParams.password;
            configDB.password = databaseParams.password;
        }

        if (databaseParams.username  && databaseParams.username.length > 0) {
            dbConnection += "@";
        }

        dbConnection += databaseParams.uri;

        if(databaseParams.port !== undefined && databaseParams.port !== ""){

            dbConnection += ":" + databaseParams.port;
        }

        if(databaseParams.collection !== undefined && databaseParams.collection !== ""){

            dbConnection += "/" + databaseParams.collection;
        }

        context.pgConnectionString = dbConnection;
        console.log("CONNECTING TO " + dbConnection);
        context.dbConnection = new Sequelize(dbConnection, {
            pool: {
                max: 5,
                min: 0,
                idle: 5000,
                acquire: 20000
            },
            logging: config.database.logging !== false ? console.log : false
            // TODO - omitNull will avoid passing NULL values in create, but it doesn't fix the problem: how to assign default values?
            //omitNull: true
        });

        return context.dbConnection
            .authenticate()
            .then(function(err) {
                console.log('Connection has been established successfully.');
                return callback(context);
            })
            .catch(function (err) {
                // Logs all application errors that happen after succesful db test OR error in connecting to DB

                console.error(err.code);
                console.error(err);
                return process.exit(1);
            });
    }
}
