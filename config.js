module.exports = {
    "database" : {
        "username": process.env.databaseuser,
        "password": process.env.databasepassword,
        "port": process.env.databaseport,
        "uri": process.env.databaseuri,
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
