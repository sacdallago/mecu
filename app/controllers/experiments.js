module.exports = function(context) {

    // Imports
    const experimentsDao = context.component('daos').module('experiments');
    const temperatureReadsDao = context.component('daos').module('temperatureReads');
    const proteinReadsDao = context.component('daos').module('proteinReads');

    return {
        uploadExperiment: function(request, response) {
            if(request.is('multipart/form-data')) {
                const formidable = context.formidable;
                const form = new formidable.IncomingForm();

                form.parse(request, function(error, fields, files) {
                    var data = files.data;
                    const inVivo = function(){
                        if(fields.inVivo !== undefined){
                            return fields.inVivo == "on";
                        }
                        return false
                    }();
                    const cellLine = fields.cellLine;

                    if(error || data === undefined || inVivo === undefined || cellLine === undefined){
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

                    return context.fs.readFile(data.path, 'utf8', function (error, data) {
                        if(error){
                            return response.status(500).render('error', {
                                title: 'Error',
                                message: "Unable to read file",
                                error: error
                            });
                        }

                        // Transform TSV into JSON data
                        data = context.mecuUtils.parse(data);

                        let newExperiment = {
                            inVivo: inVivo,
                            cellLine: cellLine,
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
                                    return {
                                        uniprotId: element.uniprotId,
                                        experiment: experiment.id,
                                        peptides: element.peptides,
                                        psms: element.psms,
                                        totalExpt: element.totalExpt
                                    }
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
        }
    }
};