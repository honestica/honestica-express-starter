# honestica-express-starter
Prepare an express app with config + logging + healthcheck 

## Default config file
```
{
  "port": 3001, // port of the app
  "logs": {
    "console": true, // display logs to the console
    "file": false // write logs to a file (Boolean or absolute path),
    "logstash": false // if logstash format should be used
  },
  "healthCheck": false // boolean or file where the healthcheck file is present (containing IN when service is UP)
}
```

## To use it ->

```
const honesticaStarter = require('honestica-express-starter');
const { app, logger, config } = honesticaStarter('myname', {
  baseConfigPath: String,
  heatlhCheckInfo: Function,
  autoStart: Boolean
});
```

## To install it, set your .npmrc with the following
```
registry="http://nexus.technical.honestica.com:18081/nexus/content/groups/npm-all/"
email="youremail"
//registry.npmjs.org/:always-auth=false
//nexus.technical.honestica.com:18081/:always-auth=true
//nexus.technical.honestica.com:18081/:_auth="yourauthstring"
```

Your auth string can be obtained by `base64` the string 'username:password' of your `nexus` account

## Config levels

There are 3 levels of config

```
- defaults (on this package)
    ^
    | Override
- local (defined with baseConfigPath)
    ^
    | Override
- system (in /usr/local/honestica/${applicationName}/config.json
```
