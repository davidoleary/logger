import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import expressMetrics from '../src/middleware/express-metrics';

describe('module metric functions', () => {
  it('exposes expressMetrics function', () => {
    expect(expressMetrics).to.be.a('function');
  });

  it('expressMetrics function requires options', () => {
    expect(() => { expressMetrics(); }).to.throw('Requires options');
  });

  it('expressMetrics returns a middleware function', () => {
    const options = {};
    expect(expressMetrics(options)).to.be.a('function');
  });

  it('expressMetrics must use hot-shots implementation of statsD', () => {
    const datadogMock = sinon.stub();
    const hotshotsMock = {
      StatsD: sinon.stub(),
    };

    const options = {
      dummy: 'dummyoption',
    };
    const loggingRequireMock = proxyquire('../src/middleware/express-metrics', {
      'connect-datadog': datadogMock,
      'hot-shots': hotshotsMock,
    });

    const metrics = loggingRequireMock;
    metrics(options);
    sinon.assert.calledOnce(hotshotsMock.StatsD);
    sinon.assert.calledWith(datadogMock, sinon.match({ dummy: 'dummyoption' }));
    sinon.assert.calledWith(datadogMock, sinon.match.has('dogstatsd'));
  });

  it('expressMetrics sets up DataDog middleware', () => {
    const datadogMock = sinon.stub();
    const options = {
      dummy: 'dummyoption',
    };
    const loggingRequireMock = proxyquire('../src/middleware/express-metrics', {
      'connect-datadog': datadogMock,
    });

    const metrics = loggingRequireMock;
    metrics(options);
    sinon.assert.calledWith(datadogMock, sinon.match(options));
  });
});
