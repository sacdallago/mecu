'use strict';

// Parallelize
const numCPUs           = require('os').cpus().length;
const cluster           = require('cluster');
const consoleStamp      = require('console-stamp');
const path              = require('path');

if (cluster.isMaster) {
    
    // TODO - Implement webpack bundle of globals!
    // Build frontend js dependencies and look for changes to rebuild
    // Run on master to avoid doing this x times
//    let webpack = require("webpack");
//
//    let compiler = webpack({
//        entry: path.join(__dirname, 'frontend', 'libs', '*.js'),
//        output: {
//             path: path.join(__dirname, 'frontend', 'public'),
//             filename: 'app.js',
//             libraryTarget: 'var',
//             library: 'mecu'
//        }
//    });
//
//    compiler.watch({ // watch options:
//        aggregateTimeout: 300, // wait so long for more changes
//        poll: true // use polling instead of native watchers
//        // pass a number to set the polling interval
//    }, function(err, stats) {
//        // ...
//    });
//
//    compiler.run(function(err, stats) {
//    });
//// or
//    compiler.watch({ // watch options:
//        aggregateTimeout: 300, // wait so long for more changes
//        poll: true // use polling instead of native watchers
//        // pass a number to set the polling interval
//    }, function(err, stats) {
//        // ...
//    });

    // Setup timestamps for logging
    consoleStamp(console,{
        metadata: function () {
            return ("[MASTER]");
        },
        colors: {
            stamp: "yellow",
            label: "white",
            metadata: "red"
        }
    } );

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        var worker = cluster.fork();
        console.log("Spwaning worker " + worker.id);
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log("worker " + worker.process.pid + " died");
        var newWorker = cluster.fork();
        console.log("Spwaning worker " + newWorker.id);
    });

} else {
    // Spawn various workers to listen and answer requests
    const express           = require('express');
    const cookieParser      = require('cookie-parser');
    const compression       = require('compression');
    const watch             = require('node-watch');
    const passport          = require('passport');
    const googleStrategy    = require('passport-google-oauth2').Strategy;
    const universalAnalytics= require('universal-analytics');
    const session           = require('express-session');
    const SequelizeStore    = require('connect-session-sequelize')(session.Store);
    const favicon           = require('serve-favicon');


    consoleStamp(console, {
        metadata: function () {
            return ("[Worker " + cluster.worker.id + "]");
        },
        colors: {
            stamp: "yellow",
            label: "white",
            metadata: "green"
        }
    } );

    // Make each worker connect to mongoose and startup the controllers
    require(path.join(__dirname, "index.js")).connect(function(context){

        // Define application address
        const address = function(config){
            var address = "";

            if(config.application){
                address    += config.application.protocol || "http";
                address    += "://";
                address    += config.application.hostname || "localhost";
                address    += config.application.port !== undefined ? ":" : "";
                address    += config.application.port || "";
            } else {
                address    += "http://localhost:3000";
            }

            return address;
        }(context.config);

        // Define application
        const app = express();

        // Express configuration
        app.set('port', process.env.PORT || 3000);
        app.set('views', path.join(__dirname, "frontend", "views"));
        app.set('view engine', 'pug');

        // Use
        app.use(compression());

        // Export static folders
        app.use("/public/js", express.static(path.join(__dirname, "frontend", "js")));
        app.use("/public/css", express.static(path.join(__dirname, "frontend", "css")));
        app.use("/public/libs/mecu-viz", express.static(require.resolve("mecu-viz")));
        app.use("/public/libs", express.static(path.join(__dirname, "frontend", "libs")));
        app.use("/public", express.static(path.join(__dirname, "frontend", "public")));
        app.use(favicon(path.join(__dirname, "frontend", "public", "images", "cell.ico")));

        app.use(cookieParser());
        
        // TODO - session and user management
        app.use(session({
            secret: context.config.sessionSecret || 'mecuSecret',
            store: new SequelizeStore({
                db: context.sequelize,
                //table: 'logins',
            }),
            resave: true,
            saveUninitialized: true,
            checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
            expiration: 7 * 24 * 60 * 60 * 1000  // The maximum age (in milliseconds) of a valid session.
        }));
        // Append google analytics user id. Will track both page visits as well as API calls.
        if(context.config.analytics && context.config.analytics.google && context.config.analytics.google.trackingId){
            app.use(universalAnalytics.middleware(context.config.analytics.google.trackingId, {cookieName: 'gauid'}));
        }
        app.use(passport.initialize());
        app.use(passport.session());

        // Configure passport
        const usersDao = context.component('daos').module('users');
        const loginsDao = context.component('daos').module('logins');

        const google = new googleStrategy({
            clientID            : context.config.passport.google.clientId,
            clientSecret        : context.config.passport.google.clientSecret,
            callbackURL         : address + "/auth/google/callback",
            passReqToCallback   : true
        }, function(request, accessToken, refreshToken, profile, done) {
            usersDao.findOrCreate({ googleId: profile.id, displayName: profile.displayName })
                .then(function(user){
                loginsDao.login(user._id).then(function(loginId){
                    return done(null, loginId);
                }, function(error){
                    return done(error, null);
                });
            }, function(error){
                return done(error, null);
            });
        });

        passport.use(google);

        app.get('/auth/logout', function(request, response){
            loginsDao.logout(request.user._id).then(function(){
                request.logout();
                return response.redirect('/');
            });
        });

        passport.deserializeUser(function(loginId, done) {
            loginsDao.findById(loginId)
                .then(function(userId){
                usersDao.findById(userId).then(function(user){
                    return done(null, user);
                }, function(error){
                    return done(error, null);
                });
            }, function(error){
                // Means login has expired!
                if(error == "No open session"){
                    done(null, null);
                } else {
                    return done(error, null);
                }
            });
        });

        passport.serializeUser(function(loginId, done) {
            done(null, loginId);
        });

        app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

        app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/error' }), function(request, response) {
            // Successful authentication, redirect home.
            response.redirect('/');
        });

        // Create routers
        context.router = new express.Router();
        context.api = new express.Router();

        // TODO - implement security layer
        if(process.env.NODE_ENV == 'production'){
            app.use(function(request, response, next) {
                if (request.method === 'GET') {
                    return next();
                } else {
                    response.status(403).render('error', {
                        title: 'Error',
                        message: "Can only GET",
                        error: "Can only GET"
                    });
                }
            });
        }

        // Router listens on / and /api
        app.use('/api', function(request, response, next) {
            // Send API request to google analytics
            request.visitor.pageview(request.path).send();
            return next();
        }, context.api);

        app.use('/', function(request, response, next) {
            if(request.user){
                response.locals.displayName = request.user.displayName;
            }

            if(context.config.analytics && context.config.analytics.google && context.config.analytics.google.trackingId){
                response.locals.analytics = context.config.analytics.google.trackingId;
            }


            return next();
        }, context.router);

        if(process.env.NODE_ENV != 'production'){
            context.router.use(function(request, response, next) {
                // Log each request to the console if in dev mode
                console.log("Method:", request.method, "Path", request.path, "Query", request.query);

                return next();
            });
        }

        // Load all routes
        context.component('.').module('routes');
        
        // Sync the database --> Write table definitions
        context.sequelize.sync().then(function() {
            // Make the process listen to incoming requests
            app.listen(app.get('port'), function(){
                console.log("Express server listening on port ", app.get('port'));
                console.log("According to your configuration, the webapp is reachable at", address);
            });
        }).catch(function(error) {
            console.error("There was an error while syncronizing the tables between the application and the database.");
            console.error(error);
            process.exit(2);
        });
    });

    // Watch in case of file changes, restart worker (basically can keep up server running forever)
    watch([
        //path.join(__dirname, "views"),
        path.join(__dirname, "app/*/*.js"),
        path.join(__dirname, "app/*.js"),
        path.join(__dirname, "app.js"),
        path.join(__dirname, "index.js")
    ], function(filename) {
        console.log('File changed. Worker is gonna perform harakiri.');
        cluster.worker.kill(0);
    });
}