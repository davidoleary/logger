import sinon from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('logger', () => {
  it('continues to log to stdout for pm2 if logstash is disabled', () => {
    const options = {
      env: 'dev',
      logger: {
        isEnabled: false,
      },
      dataDog: {},
    };

    const winstonWrapperMock = sinon.stub().returns({ stream: {} });
    const LoggingMock = proxyquire('../src/index.js', {
      './winston-wrapper': winstonWrapperMock,
    });

    LoggingMock.configure(options);
    sinon.assert.calledOnce(winstonWrapperMock);
  });

  it('does log to logstash if logging is enabled', () => {
    const options = {
      env: 'test',
      logger: {
        appName: 'test',
        isEnabled: true,
      },
      dataDog: {},
    };

    const winstonWrapperMock = sinon.stub().returns({ stream: {} });
    const LoggingMock = proxyquire('../src/index.js', {
      './winston-wrapper': winstonWrapperMock,
    });
    LoggingMock.configure(options);
    sinon.assert.calledOnce(winstonWrapperMock);
  });

  it('does not log to dataDog if logging is not enabled', () => {
    const options = {
      env: 'test',
      logger: {
        isEnabled: false,
      },
      dataDog: {
        isEnabled: false,
      },
    };

    const dataDogMock = sinon.stub();
    const winstonWrapperMock = sinon.stub().returns({ stream: {} });
    const LoggingMock = proxyquire('../src/index.js', {
      './data-dog-wrapper': dataDogMock,
      './winston-wrapper': winstonWrapperMock,
    });

    LoggingMock.configure(options);
    sinon.assert.calledWith(dataDogMock, sinon.match({ mock: true }));
  });

  it('requires env', () => {
    const options = {
      logger: {
        isEnabled: false,
      },
      dataDog: {
        stat: 'myApp',
        isEnabled: true,
      },
    };

    const koaMetricsMock = sinon.stub();
    const LoggingMock = proxyquire('../src/index.js', {
      './middleware/koa-metrics': koaMetricsMock,
    });

    expect(() => { LoggingMock.configure(options); }).to.throw('Requires env');
  });

  it('prepends env to datadog', () => {
    const options = {
      env: 'dev',
      logger: {
        appName: 'myApp',
        isEnabled: false,
      },
      dataDog: {
        stat: 'myApp',
        isEnabled: true,
      },
    };

    const koaMetricsMock = sinon.stub();
    const winstonWrapperMock = sinon.stub().returns({ stream: {}});
    const LoggingMock = proxyquire('../src/index.js', {
      './middleware/koa-metrics': koaMetricsMock,
      './winston-wrapper': winstonWrapperMock,
    });

    LoggingMock.configure(options);
    sinon.assert.calledWith(koaMetricsMock, sinon.match({ stat: 'dev.myApp', tags: ['env:dev'] }));
  });

  it('prepends env to lockstash logs', () => {
    const options = {
      env: 'dev',
      logger: {
        appName: 'anApp',
        isEnabled: true,
      },
      dataDog: {
        isEnabled: false,
      },
    };

    const noop = () => {};
    const winstonWrapperMock = sinon.stub().returns({
      debug: () => noop,
    });
    const LoggingMock = proxyquire('../src/index.js', {
      './winston-wrapper': winstonWrapperMock,
      './logging': noop,
      './middleware/express-morgan': noop,
      './middleware/koa-morgan': noop,
    });

    LoggingMock.configure(options);
    sinon.assert.calledWith(winstonWrapperMock, sinon.match({ appName: 'anApp', env: 'dev' }));
  });
});

describe('winston functions', () => {
  let winstonWrapperMock;
  let LoggingMock;

  beforeEach(() => {
    winstonWrapperMock = sinon.stub();
    LoggingMock = proxyquire('../src/index.js', {
      './winston-wrapper': winstonWrapperMock,
    });
  });

  it('exposes to info debug', () => {
    expect(LoggingMock.debug).to.be.a('function');
  });

  it('exposes to info logs', () => {
    expect(LoggingMock.info).to.be.a('function');
  });

  it('exposes to warb logs', () => {
    expect(LoggingMock.warn).to.be.a('function');
  });

  it('exposes to warb error', () => {
    expect(LoggingMock.error).to.be.a('function');
  });
});
