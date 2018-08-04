import metrics from 'datadog-metrics';
import { OptionError } from './error';

const noop = () => {};
// only use this module when the Data dog agent cannot be run
// on the host machine eg amazon.

export default (options) => {
  if (!options.isEnabled) {
    return () => {
      // return an initialisation function that does nothing
      // but does not break api functions
      return {
        gauge: noop,
        increment: noop,
        histogram: noop,
        flush: noop,
      };
    };
  }

  return (apiOptions) => {
    const opts = apiOptions;
    if (!opts) {
      throw (new OptionError('Requires options'));
    }

    if (!opts.hostname) {
      throw (new OptionError('Requires hostname'));
    }

    if (!opts.env) {
      throw (new OptionError('Requires env'));
    }
    opts.env = opts.env;
    metrics.init({
      apiKey: process.env.DATADOG_API_KEY || opts.apiKey,
      host: opts.hostname,
      prefix: `${opts.env}.${opts.stat}`,
      defaultTags: opts.tags,
    });

    return metrics;
  };
};
