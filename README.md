# Logging  Module
This module provides a common way to log metrics and events accross apps.
It provides:
- Middleware for logging common metrics to datadog for express and koa.
- Middleware for logging request information to logstash
- Functions for logging information to logstash (info, debug, warn, error)
- Ability to log custom metrics when required
- Ability to log metrics via Datadogs API when the Datadog agent cannot be run on host machines

### Simple express usage
```js
import logger from 'logger';

const options = {
    env: process.env.NODE_ENV //'development|production...',required
    logger: {
      isEnabled: false, // default false this actually means the logging to the console will work but not logging to any external service
      level: 'debug'|'info'|'warn'|'error' // default 'info'
      appName: 'myapp', // require
      logStash: { 
        port: 6200, // elk listens for tcp traffic on 6200 
        host: '10.0.XX.XXX',
      }
   },
    dataDog: {
      isEnabled: true, // default false
      stat: 'myapp' // prefix name of the metrics recorded
      tags: [] // any tags to be added to every metric, default empty 
      path: true | false // record req path in metrics, default false
      baseUrl: true | false // record base url in metrics
      responseCode: true | false // record the response code in metrics
    }
};

logger.configure(options);

// use both middleware
app.use(logger.express.metrics); // request metrics -> datadog
app.use(logger.express.logger); // request logging -> logstash
```

### Simple Koa app usage
```js
import logger from 'logger';

const options = {
    logger: {
        isEnabled: true, // default false
        level: (debug|info|warn|error) // default info
        appName: 'myapp', // required
        logStash: { 
            port: // default 28777
            host: // default '127.0.0.1'
        }
    },
    dataDog: {
      isEnabled: true, // default false
      stat: 'myapp' // prefix name of the metrics recorded
      tags: [] // any tags to be added to every metric, default empty 
      path: true | false // record req path in metrics, default false
      base_url: true | false // record base url in metrics
	  response_code: true | false // record the response code in metrics
    }
};

logger.configure(options);

// use both middleware
app.use(logger.koa.metrics); // request metrics -> datadog
app.use(logger.koa.logger); // request logging -> logstash
```

### Example of custom event logging -> logstash
```js
import logger from 'logger';

router.get('/', () => {
  logger.info('some info')
  logger.debug('some debug')
  logger.warn('some warn')
  logger.error('some error')
  logger.error('some error with a callback', () => {
      console.log('this is the callback')
  })
  logger.info('number one %d template word %s', 1, 'a word') // see winston formatting
  logger.on('logged', (info) => {
    console.log('listening to events')
  })
});
```

### Custom metrics
If you want to gather metrics around a particular part of your app
you can use the underlining datadog module
```js
logger.dataDog().[increment|histogram etc] 
// see metric functions in https://github.com/brightcove/hot-shots 
```

### DataDog Api - Only use when agent is not available
Needs to be initialised by developer as we don't want it setup by default. This function should be avoided where possible as it is not as performant as using the datadog agent.
```js
const ddAPIOpts = {
  apiKey: // process.env.DATADOG_API_KEY || options.apiKey
  hostname: // hostname reported with each metric, required
  stat: 'koaAPI', // prefix name of the metrics recorded
  tags: ['app: koaAPI'], // any tags to be added to every metric, default empty 
  flushIntervalSeconds: 15, // how often to send the metrics to datadog, default 15,
  env: 'myCustomEnv', //environment name to prepend to each metric, required
};
const ddAPI = logger.dataDogAPI(ddAPIOpts)
ddAPI.increment('development.mykoaTestapp.customAPI');
// ddAPIOpts see https://github.com/dbader/node-datadog-metrics
```

### Logstash
We connect to logstash using [winston-logstash](https://github.com/jaakkos/winston-logstash)
* It connects over TCP.
* If the connection fails or logstash is down the module will retry to send events every minute


# Module Development and maintenance notes
use docker instructions from:
https://oliverveits.wordpress.com/2016/11/17/logstash-hello-world/
#### Example logstash config
This will: 
* Pass events through to elastic search.
* Filter http request logs and then forward to elastic search.
* Output filtered data to the console for testing
**node-pipeline.conf**

``` js
input { 
	tcp { 
		port => 28777 
		codec => "json"
	} 
} 

output {
	elasticsearch {
		hosts => ["http://elk5.remote.com:9200"] 
	} 
	stdout { codec => rubydebug }
} 
filter {
	
  if ([type] == "httpLog") {
  	grok {
	  match => { "message" => "%{COMBINEDAPACHELOG}" }
	  remove_field => ["message", "timestamp"]
	}
	date {
	  match => [ "timestamp" , "dd/MMM/yyyy:HH:mm:ss Z" ]
	}
  }
}
```

#### Run logstash in docker for local testing
In termal navigate to the directory of the your logstash config (see example above)
This command maps your host directoy via PWD to a dictory in the docker instance `conf-dir` when logstash tries to run with the config file it will read your local directory.
```
docker run  -p 9600:9600 -p 28777:28777 -it --rm -v "$PWD:/conf-dir" logstash -f /conf-dir/node-pipeline.conf
```