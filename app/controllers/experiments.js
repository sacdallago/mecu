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
                    const data = files.data;
                    const experiment = fields.experiment;
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
                            response.status(500).render('error', {
                                title: 'Error',
                                message: "Unable to read file",
                                error: error
                            });
                            return;
                        }
                        
                        data = context.mecuParser.parse(data)
                        var entries = mecu.parse(data);
                        
                        return response.status(201).send(entries);
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