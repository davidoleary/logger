import morgan from 'koa-morgan';
import { OptionError } from '../error';

export default (winston) => {
  if (!winston) {
    throw new OptionError('Requires winston');
  }

  if (winston.stream.write) {
    return morgan('combined', {
      stream: winston.stream,
    });
  }

  return morgan('combined');
};
