import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import winstonWrapper from '../src/winston-wrapper';

describe('winston wrapper', () => {
  let options;
  let loggingRequireMock;
  let winston;
  let addMock;
  let infoMock;
  let removeMock;
  let loggerConstuctorMock;
  let consoleMock;

  beforeEach(() => {
    options = {};
    addMock = sinon.stub();
    infoMock = sinon.stub();
    removeMock = sinon.stub();
    consoleMock = sinon.stub();

    loggerConstuctorMock = sinon.stub().returns({
      add: addMock,
      info: infoMock,
      transports: {
        logstash: {
          on: () => {},
        },
      },
    });
    winston = {
      remove: removeMock,
      Logger: loggerConstuctorMock,
      transports: {
        Console: consoleMock,
      },
    };

    loggingRequireMock = proxyquire('../src/winston-wrapper', {
      winston,
      'winston-logstash': {},
    });
  });

  it('requires appName for logstash when logstash is enabled', () => {
    const opts = {
      logStash: {},
    };
    expect(() => winstonWrapper(opts)).to.throw('Requires appName');
  });

  it('requires env', () => {
    const opts = {
      logStash: { },
      appName: 'myApp',
    };
    expect(() => winstonWrapper(opts)).to.throw('Requires env');
  });

  it('will not setup logstash intergration when isEnabled is false', () => {
    winston.transports.Logstash = 'logstash';

    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {
        isEnabled: false,
      },
    };

    loggingRequireMock(options);
    sinon.assert.notCalled(addMock);
  });

  it('will not setup logstash intergration when isEnabled is undefined', () => {
    winston.transports.Logstash = 'logstash';

    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {},
    };

    loggingRequireMock(options);
    sinon.assert.notCalled(addMock);
  });


  it('will setup logstash intergration with valid config', () => {
    winston.transports.Logstash = 'logstash';

    options = {
      appName: 'app name',
      env: 'dev',
      isEnabled: true,
      logStash: {},
    };

    loggingRequireMock(options);
    sinon.assert.calledWith(addMock, 'logstash');
  });

  it('will not setup logstash intergration if disabled', () => {
    winston.transports.Logstash = 'logstash';

    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {},
      isEnabled: false,
    };

    loggingRequireMock(options);
    sinon.assert.notCalled(addMock);
  });

  it('will setup logstash to retry reconnects indefinitely', () => {
    winston.transports.Logstash = 'logstash';

    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {
        isEnabled: true,
      },
      isEnabled: true,
    };

    loggingRequireMock(options);
    sinon.assert.calledWith(addMock, 'logstash', sinon.match({
      max_connect_retries: -1, // keep retrying
      timeout_connect_retries: 60000, //every minute
    }));
  });

  it('has a default winston logging level', () => {
    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {},
    };
    loggingRequireMock(options);
    expect(winston.level).to.equal('info');
  });

  it('can set winston logging level', () => {
    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {},
    };
    options.level = 'debug';
    loggingRequireMock(options);
    expect(winston.level).to.equal('debug');

    options.level = 'info';
    loggingRequireMock(options);
    expect(winston.level).to.equal('info');
  });

  it('sets winston to stream', () => {
    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {},
      isEnabled: true,
    };

    const logger = loggingRequireMock(options);
    expect(logger.stream.write).to.be.a('function');
  });

  it('stream messages to winston.info', () => {
    options = {
      appName: 'app name',
      env: 'dev',
      logStash: {},
      isEnabled: true,
    };

    const logger = loggingRequireMock(options);
    logger.stream.write('test');
    sinon.assert.calledWith(infoMock, 'test');
  });
});
