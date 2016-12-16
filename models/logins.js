/**
 * logins model
 *
 * Created by Christian Dallago on 20160626 .
 */

module.exports = function(context) {

    // Imports
    const mongoose = context.mongoose;

    return mongoose.model('login', mongoose.Schema({
        ref : {
            type: String,
            required: true,
            unique: true
        },
        createdAt : {
            type: Date,
            default: Date.now,
            required: true,
            // 1 week
            expires: 7 * 24 * 60 * 60 * 1000
        }
    }, {
        strict: true
    }));
};