import winston from 'winston';
import 'winston-logstash';
import { OptionError } from './error';

export default (options) => {
  if (!options.appName) {
    throw new OptionError('Requires appName');
  }

  if (!options.env) {
    throw new OptionError('Requires env');
  }

  winston.level = options.level || winston.level;

  const consoleTransport = new winston.transports.Console({
    level: winston.level,
    json: true,
    stringify: (obj) => {
      // we use messageLevel instead of level due to a conflict in kibana which has its own "level"
      const level = obj.level;
      obj.messageLevel = level;
      delete obj.level;
      obj.timestamp = new Date().toISOString();
      return JSON.stringify(obj);
    },
  });

  const logger = new winston.Logger({
    transports: [consoleTransport],
  });

  if (options.isEnabled) {
    logger.stream = {
      write: (message) => {
        const meta = {
          type: 'httpLog',
          appType: 'nodejs',
        };
        logger.info(message, meta);
      },
    };

    logger.add(winston.transports.Logstash, {
      port: options.logStash.port || 6200,
      node_name: `${options.env}.${options.appName}`,
      host: options.logStash.host || '10.0.2.127',
      max_connect_retries: -1, // keep retrying
      timeout_connect_retries: 60000, //every minute
    });

    logger.transports.logstash.on('error', (err) => {
      console.log(err);
    });
  }

  return logger;
};
