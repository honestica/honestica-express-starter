# honestica-express-node
Prepare an express app with config + logging + healthcheck 

## Default config
```
{
  "port": 3001, // port of the app
  "logs": {
    "console": true, // display logs to the console
    "file": false // write logs to a file (Boolean or absolute path)
  },
  "healthCheck": false // boolean or file where the healthcheck file is present (containing IN when service is UP)
}
```

## To use it, set your .npmrc with the following
```
registry="http://nexus.technical.honestica.com:18081/nexus/content/groups/npm-all/""
email="youremail"
always-auth="true"
_auth="yourauthstring"
```

Your auth string can be obtained by `base64` the string 'username:password' of your `nexus` account