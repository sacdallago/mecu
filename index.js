/**
 * Entry point
 *
 * Created by Christian Dallago on 20160416 .
 */


var context;

module.exports = {
    start: function(callback) {
        callback = callback || function(){};

        // Imports
        const pg                = require('pg');
        const fs                = require('fs');
        const path              = require('path');
        const q                 = require('q');
        const formidable        = require('formidable');
        const Sequelize         = require('sequelize');
        const mecuParser        = require('mecu-parser');

        // Initialize the context
        context = {
            fs              : fs,
            pg              : pg,
            path            : path,
            promises        : q,
            formidable      : formidable,
            Sequelize       : Sequelize,
            mecuParser      : mecuParser,
            constants       : {}
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


        if (databaseParams.username && databaseParams.password  && databaseParams.username.length > 0 && databaseParams.password.length > 0) {
            dbConnection += databaseParams.username + ":" + databaseParams.password + "@";

            configDB.user = databaseParams.username;
            configDB.password = databaseParams.password;
        }
        dbConnection += databaseParams.uri + ":" + databaseParams.port + "/" + databaseParams.collection;

        context.pgConnectionString = dbConnection;
        context.sequelize = new context.Sequelize(dbConnection, {
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            },
            omitNull: true
        });

        return context.sequelize
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
