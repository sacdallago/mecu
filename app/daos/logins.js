/**
 * logins DAO
 *
 * Created by Christian Dallago on 20160626 .
 */

module.exports = function(context) {

    // Imports
    var loginsModel = context.component('models').module('logins');

    return {
        login: function(userId) {
            var deferred = context.promises.defer();

            loginsModel.findOne({"ref": userId}, function(error, login) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                } else {
                    if(login == null || login == undefined){
                        loginsModel.create({ref: userId}, function(error, login){
                            if (error) {
                                console.error(error);
                                deferred.reject(error);
                            } else {
                                deferred.resolve(login._id);
                            }
                        });
                    } else {
                        loginsModel.findOneAndRemove({"_id": login._id}, function(error, result){
                            if(error){
                                console.error(error);
                                deferred.reject(error);
                            } else {
                                loginsModel.create({ref: userId}, function(error, login){
                                    if (error) {
                                        console.error(error);
                                        deferred.reject(error);
                                    } else {
                                        deferred.resolve(login._id);
                                    }
                                });
                            }
                        });
                    }
                }
            });

            return deferred.promise;
        },

        findById: function(id) {
            var deferred = context.promises.defer();

            loginsModel.findById(id, function(error, login) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                } else {
                    if(login == null){
                        deferred.reject("No open session");
                    } else {
                        deferred.resolve(login.ref);
                    }
                }
            });

            return deferred.promise;
        },
        
        findByRef: function(ref) {
            var deferred = context.promises.defer();

            loginsModel.findOne({"ref": ref}, function(error, login) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                } else {
                    if(login == null){
                        deferred.reject("No open session");
                    } else {
                        deferred.resolve(login._id);
                    }
                }
            });

            return deferred.promise;
        },

        logout: function(userId) {
            var deferred = context.promises.defer();

            loginsModel.findOneAndRemove({"ref": userId}, function(error, result){
                if(error){
                    console.error(error);
                    deferred.reject(error);
                } else {
                    deferred.resolve();
                }
            });

            return deferred.promise;
        }
    };
};