import expressMorgan from './middleware/express-morgan';
import koaMorgan from './middleware/koa-morgan';
import winstonWrapper from './winston-wrapper';
import expressMetrics from './middleware/express-metrics';
import koaMetrics from './middleware/koa-metrics';
import dataDogWrapper from './data-dog-wrapper';
import dataDogAPI from './data-dog-api';

const commonEventTags = { appType: 'nodejs' };
const noop = () => {};

const noopKoaMiddleware = async (ctx, next) => {
  await next();
};

const noopExpressMiddleware = async (req, res, next) => {
  next();
};

let winstonLogger = {
  info: noop,
  debug: noop,
  warn: noop,
  error: noop,
  on: noop,
};

let koaLogger = noopKoaMiddleware;
let koaMet = noopKoaMiddleware;
let expressLogger = noopExpressMiddleware;
let expressMet = noopExpressMiddleware;
let dataDog;
let ddAPI;

const configure = (options) => {
  const opts = options || { logger: {}, dataDog: {} };

  if (!opts.env) {
    throw new Error('Requires env');
  }

  const env = opts.env;

  if (env) {
    opts.logger.env = env;
    opts.dataDog.env = env;
    opts.dataDog.tags = opts.dataDog.tags || [];
    opts.dataDog.tags.push(`env:${opts.dataDog.env}`);
    opts.dataDog.stat = `${opts.dataDog.env}.${opts.dataDog.stat}`;
  }

  winstonLogger = winstonWrapper(options.logger);
  expressLogger = expressMorgan(winstonLogger);
  koaLogger = koaMorgan(winstonLogger);

  if (opts.dataDog.isEnabled) {
    koaMet = koaMetrics(opts.dataDog);
    expressMet = expressMetrics(opts.dataDog);
    dataDog = dataDogWrapper(opts.dataDog);
    ddAPI = dataDogAPI(opts.dataDog); // only use if agent is not available
  } else {
    opts.dataDog.mock = true;
    dataDog = dataDogWrapper(opts.dataDog);
    ddAPI = dataDogAPI(opts.dataDog);
  }
};

export default {
  koa: {
    logger(ctx, next) {
      koaLogger(ctx, next);
    },
    metrics(ctx, next) {
      koaMet(ctx, next);
    },
  },
  express: {
    logger(req, res, next) {
      expressLogger(req, res, next);
    },
    metrics(req, res, next) {
      expressMet(req, res, next);
    },
  },
  /** log debug info
   * @param {String} msg - message to log
   * @param {...*} args - format strings
   */
  debug: (msg, ...args) => {
    winstonLogger.debug(msg, commonEventTags, ...args);
  },
  /** log info info
   * @param {string} msg - message to log
   * @param {...*} args - format strings
   */
  info: (msg, ...args) => {
    winstonLogger.info(msg, commonEventTags, ...args);
  },
  /** log warn info
   * @param {string} msg - message to log
   * @param {...*} args - format strings
   */
  warn: (msg, ...args) => {
    winstonLogger.warn(msg, commonEventTags, ...args);
  },
  /** log error info
   * @param {string} msg - message to log
   * @param {...*} args - format strings
   */
  error: (msg, ...args) => {
    winstonLogger.error(msg, commonEventTags, ...args);
  },
  /** add event listener
   * @param {string} event - event to listen for
   * @callback cb - callback that handles event
   */
  on: (event, cb) => {
    winstonLogger.on(event, cb);
  },
  dataDog: () => dataDog,
  dataDogAPI: (apiOpts) => {
    let api;
    if (typeof ddAPI === 'function') {
      api = ddAPI(apiOpts);
    }

    return api;
  },
  configure,
};
