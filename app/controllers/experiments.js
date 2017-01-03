module.exports = function(context) {

    // Imports
    const experimentsDao = context.component('daos').module('experiments');

    return {
        uploadExperiment: function(request, response) {
            if(request.is('multipart/form-data')) {
                const formidable = context.formidable;
                const form = new formidable.IncomingForm();
                // Need to implement the storage of file xyz and then render home

                form.parse(request, function(error, fields, files) {
                    var data = files.data;
                    const inVivo = fields.in_vivo;
                    const cellLine = fields.cellLine;

                    if(error || data === undefined || experiment === undefined || inVivo === undefined || cellLine === undefined){
                        response.render('error', {
                            title: 'Error',
                            message: "Unable to post request",
                            error: error || "Some fields were missing!"
                        });
                        return;
                    }

                    if (data.type != 'text/plain') {
                        response.status(500).render('error', {
                            title: 'Error',
                            message: "Unable to post request",
                            error: "Allowed calls include:\n - multipart/form-data\n With attributes 'data' in text/plain format"
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
                        
                        let newExperiment = {
                            inVivo: inVivo,
                            cellLine: cellLine
                        }
                        
                        return experimentsDao.create(newExperiment)
                            .then(function(experiment){
                                data = context.mecuParser.parse(data);
                        
                                let proteins = data.map(function(element){
                                    return {
                                        uniprotId: element.uniprotId,
                                        primaryGene: element.primaryGene
                                    }
                                });

                                let proteinReads = data.map(function(element){
                                    return {
                                        uniprotId: element.uniprotId,
                                        experiment: experiment._id,
                                        peptides: element.peptides,
                                        psms: element.psms,
                                        totalExpt: element.totalExpt
                                    }
                                });
                                
                                let meltingReads = data
                                    .map(function(element){
                                        return element.reads.map(function(tempRead){
                                            tempRead.uniprotId= element.uniprotId;
                                        tempRead.experiment= experiment._id;
                                            return tempRead;
                                        });
                                    })
                                    .reduce(function(elements,element){
                                        return elements.concat(element);
                                    });


                                return response.status(201).send(data);
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
                    error: "Allowed calls include:\n - multipart/form-data\n With attributes 'data' in text/plain format"
                });
            }
        }
    }
}