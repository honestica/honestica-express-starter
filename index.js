'use strict'

const merge = require('lodash.merge');
const defaults = require('merge-defaults');
const express = require('express');
const winston = require('winston');
const common = require('winston/lib/winston/common');
const cycle = require('cycle');
const expressWinston = require('express-winston');

const fs = require('fs');

function createLogFormatter(appname, lastcommit, version) {
    return function logFormatter(log) {
        const timestamp = common.timestamp();
        const logstashOutput = {
            lastcommit,
            version,
            appname
        };

        const meta = common.clone(cycle.decycle(log.meta)) || {};
        const baseLog = {
            level: log.level,
            message: log.message
        };

        let msg = log.message;

        if (typeof msg !== 'string') {
            msg = '' + msg;
        }

        if (msg !== undefined && msg !== null) {
            logstashOutput['@message'] = msg;
        }

        logstashOutput['@timestamp'] = timestamp;
        logstashOutput['@fields'] = merge(baseLog, meta);
        return JSON.stringify(logstashOutput);
    }
}


/**
 * options -> {
 *  basePath: String,
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
    let lastCommit;
    let version;

    try {
        const userConfig = require(`${options.basePath}/config.json`);
        config = merge(config, userConfig);
    } catch (e) {}

    try {
        const systemConfig = require(`/usr/local/honestica/${applicationName}/config.json`);
        config = merge(config, systemConfig);
    } catch(e) {}

    try {
        const build = require(`${options.basePath}/build.json`);
        lastCommit = build.lastcommit;
        version = build.version;
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
                timestamp: true,
                formatter: config.logs.logstash ? createLogFormatter(applicationName, lastCommit, version) : undefined,
                json: false
            })
        );
    }

    if (config.logs.file) {
        transports.push(new winston.transports.File({
            filename: config.logs.file,
            json: false,
            formatter: config.logs.logstash ? createLogFormatter(applicationName, lastCommit, version) : undefined,
        }));
    }

    const logger = new winston.Logger({
        transports: transports,
        levels: winston.config.syslog.levels
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
        }).on('error', (log) => logger.error(log));
    }


    // health check
    if (config.healthCheck) {
        const callback = function (req, res) {

            const method = req.method;
            // accept head and get
            if (!(method === 'HEAD' || method === 'GET')) {
                return res.sendStatus(405);
            }

            // read health check file
            fs.readFile(config.healthCheck, 'utf8', function (err, data) {
                if (err) {
                    logger.error('Health check file not found');
                    return res.sendStatus(500);
                }
                if (data.trim() !== 'IN') {
                    return res.sendStatus(503);;
                } else {
                    return res.send({
                        uptime: process.uptime(),
                        name: applicationName,
                        version: version,
                        app: options.healthCheckInfo()
                    });
                }
            });
        });

        app.all('/admin/health', callback);
        app.all(`${appname}/admin/health`, callback);
    }

    process.on('uncaughtException', function(err) {
      logger.crit('Fatal error, exiting : ', err);
      process.exit(1);
    });

   return { app, logger, config };
}
