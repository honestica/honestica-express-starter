const merge = require('lodash.merge');
const defaults = require('merge-defaults');
const express = require('express');
const winston = require('winston');
const expressWinston = require('express-winston');
const fs = require('fs');

/**
 * options -> {
 *  baseConfigPath: String,
 *  heatlhCheckInfo: Function,
 *  autoStart: Boolean
 * }
 * 
 * Returns base app + configured logger
 */
module.exports = function(applicationName, opts) {
    const app = express();
    const options = defaults(opts, {
        healthCheckInfo: function() {},
        autoStart: true
    });
    
    const config = require('./config.json');
    
    try {
        const userConfig = require(options.baseConfigPath);
        config = merge(config, userConfig);
    } catch (e) {}
    
    try {
        const systemConfig = require(`/usr/local/honestica/${applicationName}/config.json`);
        config = merge(config, systemConfig);
    } catch(e) {}    
    
    // setup logs
    if (!config.logs) {
        throw new Error('Need logs params in config');
    }

    const transports = [ ];
    if (config.logs.console) {
        transports.push(
            new winston.transports.Console({
                colorize: true,
                timestamp: true
            })
        );
    }

    if (config.logs.file) {
        transports.push(new winston.transports.File({
            filename: config.logs.file,
        }));
    }

    const logger = new winston.Logger({
        transports: transports
    });

    app.use(expressWinston.logger({
        transports: transports,
        meta: true, 
        msg: "HTTP {{req.method}} {{req.url}}", 
        expressFormat: true, 
        colorStatus: true 
    }));


    //start server
    if (!config.port) {
        throw new Error('No port found in config file');
    }
    
    if (options.autoStart) {
        app.listen(config.port, function () {
            logger.info(`${applicationName} started on port ${config.port}`);
        });
    }
    
    
    // health check
    if (config.healthCheck) {
        
        app.all('/admin/health', function (req, res) {
            
            const method = req.method;
            // accept head and get
            if (!(method === 'HEAD' || method === 'GET')) {
                return res.sendStatus(405);
            }
            
            // read health check file
            fs.readFile(config.healthCheck, 'utf8', function (err, data) {
                if (err) {
                    logger.error('Health check file not found');
                }
                if (data !== 'IN') {
                    return res.sendStatus(503);;
                } else {
                    return res.send({
                        uptime: process.uptime(),
                        name: applicationName,
                        app: options.healthCheckInfo()
                    });
                }
            });
        });
    }
    
    
   return { app, logger, config };
}