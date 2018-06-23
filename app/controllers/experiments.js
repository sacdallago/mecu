// External imports
const json2csv = require('json2csv').parse;
const mecuUtils = require('mecu-utils');
const fs = require('fs');
const formidable        = require('formidable');

module.exports = function(context) {

    // Imports
    const experimentsDao = context.component('daos').module('experiments');
    const temperatureReadsDao = context.component('daos').module('temperatureReads');
    const proteinReadsDao = context.component('daos').module('proteinReads');

    return {
        uploadExperiment: function(request, response) {
            if(request.is('multipart/form-data')) {
                const form = new formidable.IncomingForm();

                form.parse(request, function(error, fields, files) {
                    var data = files.data;
                    const lysate = function(){
                        if(fields.lysate !== undefined){
                            return fields.lysate == "on";
                        }
                        return false
                    }();
                    const description = fields.description;

                    if(error || data === undefined || lysate === undefined || description === undefined){
                        response.status(403).render('error', {
                            title: 'Error',
                            message: "Unable to post request",
                            error: error || "Some fields are missing!"
                        });
                        return;
                    }

                    if (data.type != 'text/plain') {
                        response.status(500).render('error', {
                            title: 'Error',
                            message: "Unable to post request",
                            error: "Allowed calls include:\n- multipart/form-data \n With attributes 'data' in text/plain format"
                        });
                        return;
                    }

                    return fs.readFile(data.path, 'utf8', function (error, data) {
                        if(error){
                            return response.status(500).render('error', {
                                title: 'Error',
                                message: "Unable to read file",
                                error: error
                            });
                        }

                        // Transform TSV into JSON data
                        data = mecuUtils.parse(data);

                        let newExperiment = {
                            lysate: lysate,
                            description: description,
                            rawData: data,
                            uploader: request.user.get('googleId')
                        };

                        return context.sequelize.transaction(function(transaction){
                            return experimentsDao.create(newExperiment, {transaction: transaction}).then(function(experiment){

                                // TODO - this can be implemented as a view if sequelize ever supports this, or once the Postgres equivalent of ON DUPLICATE IGNORE will be approved in sequelize https://github.com/sequelize/sequelize/pull/6325
//                                let proteins = data.map(function(element){
//                                    return {
//                                        uniprotId: element.uniprotId,
//                                        primaryGene: element.primaryGene
//                                    }
//                                });

                                let proteinReads = data.map(function(element){
                                     result = {
                                        uniprotId: element.uniprotId,
                                        experiment: experiment.id,
                                        peptides: element.peptides,
                                        psms: element.psms,
                                    };

                                    result.totalExpt = isNaN(element.totalExpt) ? undefined : element.totalExpt;

                                    return result;
                                });

                                return proteinReadsDao.bulkCreate(proteinReads, {transaction: transaction}).then(function(){
                                    let meltingReads = data
                                        .map(function(element){
                                            return element.reads.map(function(tempRead){
                                                tempRead.uniprotId= element.uniprotId;
                                                tempRead.experiment= experiment.id;
                                                return tempRead;
                                            });
                                        })
                                        .reduce(function(elements,element){
                                            return elements.concat(element);
                                        });

                                    return temperatureReadsDao.bulkCreate(meltingReads, {transaction: transaction}).then(function(){
                                        return true;
                                    });
                                });
                            });
                        })
                            .then(function(result){
                                return response.status(201).render('success', {
                                    title: 'Success',
                                    message: "Your data has been added to the database!"
                                });
                            })
                            .catch(function(error){
                                return response.status(500).render('error', {
                                    title: 'Error',
                                    message: "Unable to create experiment",
                                    error: error
                                });
                            });
                    });
                });
            } else {
                response.status(403).render('error', {
                    title: 'Error',
                    message: "Unable to post request",
                    error: "Allowed calls include:\n- multipart/form-data \n With attributes 'data' in text/plain format"
                });
            }
        },

        getExperiments: function(request, response) {
            experimentsDao.getExperiments()
                .then(function(experiments){
                    return response.status(200).send(experiments);
                })
                .catch(function(error){
                    console.error(error);
                    return response.status(500).send(error);
                });
        },

        getRawData: function(request, response) {
            let identifier;
            const format = request.query.format;

            try {
                identifier = request.params.id;
            } catch (error){
                console.error(error);
                return response.status(400).send(error);
            }

            experimentsDao.getRawData(identifier)
                .then(function(rawData){
                    if (rawData.constructor !== Array) {
                        rawData = [rawData];
                    }
                    rawData = rawData
                        .map(function(experiment){
                            return experiment.get('rawData').map(function(proteinData) {
                                proteinData.experiment = experiment.get('id');
                                return proteinData;
                            });
                        })
                        .reduce(function(previous, current){
                            return previous.concat(current);
                        }, []);

                    let fields = Object.keys(rawData[0]);

                    fields.splice(fields.indexOf("reads"), 1);

                    switch(format){
                        case "csv":
                            rawData = json2csv(rawData, {
                                quotes: '',
                                fields: fields
                            });
                            break;
                        case "tsv":
                            rawData = json2csv(rawData, {
                                quotes: '',
                                del: '\t',
                                fields: fields
                            });
                            break;
                        default:
                            rawData = JSON.stringify(rawData);
                            break;
                    }

                    response.set('Content-Type', 'text/plain');
                    return response.status(200).send(new Buffer(rawData));
                })
                .catch(function(error){
                    console.error(error);
                    return response.status(500).send(error);
                });
        }
    }
};
