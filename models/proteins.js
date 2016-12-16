/**
 * protein model
 *
 * Created by Christian Dallago on 20160711 .
 */

module.exports = function(context) {

    // Imports
    const mongoose = context.mongoose;

    const localizationsSchema = new mongoose.Schema({
        localizations: {
            type: [String],
            required: true
        },
        notes: {
            type: String
        }
    }, {
        strict: true
    });

    const interactionSchema = new mongoose.Schema({
        interactor: {
            type: String,
            required: true
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        }
    }, {
        strict: true
    });

    const interactionsSchema = new mongoose.Schema({
        partners: [interactionSchema],
        notes: {
            type: String
        }
    }, {
        strict: true
    });

    return mongoose.model('proteins', mongoose.Schema({
        uniprotId : {
            type: String,
            required: true
        },
        origin: {
            type: String,
            required: true
        },
        entryName:{
            type: String
        },
        proteinName: {
            type: String
        },
        geneName:{
            type: String
        },
        localizations: localizationsSchema,
        interactions: interactionsSchema,
        createdAt : {
            type: Date,
            default: Date.now
        },
        updatedAt : {
            type: Date,
            default: Date.now
        }
    }, {
        strict: true
    }));
};