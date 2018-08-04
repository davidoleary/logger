import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import koaMetrics from '../src/middleware/koa-metrics';
import { OptionError } from '../src/error';

describe('koa middleware', () => {
  it('exposes koaMetrics function', () => {
    expect(koaMetrics).to.be.a('function');
  });

  it('thows OptionError for missing options', async () => {
    expect(() => { koaMetrics(); }).to.throw(OptionError);
  });

  it('requires options', async () => {
    expect(() => { koaMetrics(); }).to.throw('Requires options');
  });

  it('requires a context', async () => {
    const options = {};
    try {
      const middleware = koaMetrics(options);
      await middleware();
    } catch (err) {
      expect(err.message).to.equal('Requires context');
    }
  });

  it('requires a next', async () => {
    const options = {};
    const context = {};
    try {
      const middleware = koaMetrics(options);
      await middleware(context);
    } catch (err) {
      expect(err.message).to.equal('Requires next');
    }
  });

  describe('datadog metric logging', () => {
    let histogramMock;
    let incrementMock;
    let loggingRequireMock;
    beforeEach(() => {
      histogramMock = sinon.stub();
      incrementMock = sinon.stub();
      loggingRequireMock = proxyquire('../src/middleware/koa-metrics', {
        'hot-shots': {
          StatsD: () => ({
            histogram: histogramMock,
            increment: incrementMock,
          }),
        },
      });
    });

    it('requires a next to be called', async () => {
      const mockContext = {
        request: {
          url: '/test2',
        },
      };

      const options = {};
      const nextMock = sinon.stub();

      const middleware = loggingRequireMock(options);
      await middleware(mockContext, nextMock);
      sinon.assert.calledOnce(nextMock);
    });

    it('calls datadog histogram to log metrics', async () => {
      const mockContext = {
        request: {
          url: '/test3',
        },
      };
      const options = {};

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledOnce(histogramMock);
    });

    it('logs response time in histogram ', async () => {
      const mockContext = {
        request: {
          url: '/test4',
        },
      };
      const options = {};

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, '.response_time', sinon.match.number, 1, ['route:/test4']);
    });

    it('has response time prefixed with stats identifier', async () => {
      const mockContext = {
        request: {
          url: '/test5',
        },
      };
      const options = {
        stat: 'mystats',
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/test5']);
    });

    it('has a route tag on response times', async () => {
      const mockContext = {
        request: {
          url: '/test6',
        },
      };
      const options = {
        stat: 'mystats',
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/test6']);
    });

    it('has a route tag prefixed with baseUrl when supplied', async () => {
      const mockContext = {
        request: {
          url: '/test7',
        },
        baseUrl: '/myapp',
      };
      const options = {
        stat: 'mystats',
        baseUrl: true,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/myapp/test7']);
    });

    it('has a route tag without baseurl when supplied base_url option is false', async () => {
      const mockContext = {
        request: {
          url: '/test8',
        },
        baseUrl: '/myapp',
      };
      const options = {
        stat: 'mystats',
        base_url: false,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/test8']);
    });


    it('has a route tag without baseurl when supplied base_url option is true but non is available', async () => {
      const mockContext = {
        request: {
          url: '/test9',
        },
      };
      const options = {
        stat: 'mystats',
        base_url: true,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/test9']);
    });

    it('has a method tag when option is set to true', async () => {
      const mockContext = {
        request: {
          url: '/test10',
          method: 'GET',
        },
        baseUrl: '/myapp',
      };
      const options = {
        stat: 'mystats',
        method: true,
        baseUrl: true,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/myapp/test10', 'method:get']);
    });

    it('has a protocal tag when option is set to true', async () => {
      const mockContext = {
        request: {
          url: '/test11',
          method: 'GET',
        },
        protocol: 'http',
        baseUrl: '/myapp',
      };
      const options = {
        stat: 'mystats',
        method: true,
        protocol: true,
        baseUrl: true,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/myapp/test11', 'method:get', 'protocol:http']);
    });

    it('has a path tag when option is set to true', async () => {
      const mockContext = {
        request: {
          url: '/test12',
          method: 'GET',
        },
        protocol: 'http',
        path: '/requestpath',
        baseUrl: '/myapp',
      };
      const options = {
        stat: 'mystats',
        method: true,
        protocol: true,
        path: true,
        baseUrl: true,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/myapp/test12', 'method:get', 'protocol:http', 'path:/myapp/requestpath']);
    });

    it('has a responseCode tag when option is set to true', async () => {
      const mockContext = {
        request: {
          url: '/test13',
          method: 'GET',
        },
        protocol: 'http',
        path: '/requestpath',
        status: 200,
        baseUrl: '/myapp',
      };
      const options = {
        stat: 'mystats',
        method: true,
        protocol: true,
        path: true,
        responseCode: true,
        baseUrl: true,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledWith(histogramMock, 'mystats.response_time', sinon.match.number, 1, ['route:/myapp/test13', 'method:get', 'protocol:http', 'path:/myapp/requestpath', 'response_code:200']);
    });

    it('increments a response_code counts when response_code is true', async () => {
      const mockContext = {
        request: {
          url: '/test14',
          method: 'GET',
        },
        protocol: 'http',
        path: '/requestpath',
        status: 200,
      };
      const options = {
        stat: 'mystats',
        base_url: '/myapp',
        method: true,
        protocol: true,
        path: true,
        responseCode: true,
      };

      const middleware = loggingRequireMock(options);
      const nextNoop = () => {};
      await middleware(mockContext, nextNoop);

      sinon.assert.calledTwice(incrementMock);
      sinon.assert.calledWith(incrementMock.firstCall, 'mystats.response_code.200');
      sinon.assert.calledWith(incrementMock.secondCall, 'mystats.response_code.all');
    });
  });
});
