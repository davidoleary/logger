import { StatsD } from 'hot-shots';
import { OptionError } from '../error';

export default function koaMetrics(options) {
  // koa compatible implementation of connect_datadog middleware
  // https://github.com/AppPress/node-connect-datadog
  // using hot-shots StatsD implementation as its better maintained
  if (!options) {
    throw (new OptionError('Requires options'));
  }

  const datadog = new StatsD();
  const stat = options.stat || '';
  const tags = options.tags || [];
  const base_url = options.baseUrl || options.base_url || false;
  const path = options.path || false;
  const responseCode = options.responseCode || options.response_code || false;

  const middeware = async (ctx, next) => {
    const startTime = Date.now();

    if (!ctx) {
      throw (new OptionError('Requires context'));
    }

    if (!next) {
      throw (new OptionError('Requires next'));
    }

    ctx.ReqStartTime = startTime;
    await next();

    const baseUrl = (base_url !== false) ? ctx.baseUrl || '' : '';
    const statTags = [
      `route:${baseUrl + ctx.request.url}`,
    ].concat(tags);

    if (options.method) {
      statTags.push(`method:${ctx.request.method.toLowerCase()}`);
    }

    if (options.protocol && ctx.protocol) {
      statTags.push(`protocol:${ctx.protocol}`);
    }


    if (path !== false) {
      statTags.push(`path:${baseUrl + ctx.path}`);
    }

    if (responseCode) {
      statTags.push(`response_code:${ctx.status}`);
      datadog.increment(`${stat}.response_code.${ctx.status}`, 1, statTags);
      datadog.increment(`${stat}.response_code.all`, 1, statTags);
    }

    datadog.histogram(`${stat}.response_time`, (new Date() - ctx.ReqStartTime), 1, statTags);
  };

  return middeware;
}
