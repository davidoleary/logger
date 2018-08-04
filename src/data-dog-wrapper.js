import { StatsD } from 'hot-shots';

export default (options) => {
  const datadog = new StatsD(options);
  return datadog;
};
