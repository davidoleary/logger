import connectDataDog from 'connect-datadog';
import { StatsD } from 'hot-shots';
import { OptionError } from '../error';

export default function expressMetrics(options) {
  const opts = options || {};
  if (!options) {
    throw (new OptionError('Requires options'));
  }

  opts.base_url = options.baseUrl || options.base_url;
  opts.response_code = options.responseCode || options.response_code || false;

  // use hot-shots as the statsD logger instead of node-dogstatsd
  // that connect-datadog used internally
  opts.dogstatsd = new StatsD();
  const middleware = connectDataDog(opts);
  return middleware;
}
