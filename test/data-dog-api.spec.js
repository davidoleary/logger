import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import dataDogAPI from '../src/data-dog-api';

describe('Datadog API', () => {
  it('exposes function to enable logging via API', () => {
    expect(dataDogAPI).to.be.a('function');
  });

  it('requires a hostname ', () => {
    const metricsMock = {
      init: sinon.stub(),
    };

    const apiModule = proxyquire('../src/data-dog-api', {
      'datadog-metrics': metricsMock,
    });

    const api = apiModule({ isEnabled: true });
    expect(() => { api(); }).to.throw('Requires options');
  });

  it('requires a hostname ', () => {
    const metricsMock = {
      init: sinon.stub(),
    };

    const apiModule = proxyquire('../src/data-dog-api', {
      'datadog-metrics': metricsMock,
    });

    const api = apiModule({ isEnabled: true });
    expect(() => { api({}); }).to.throw('Requires hostname');
  });

  it('requires a env ', () => {
    const metricsMock = {
      init: sinon.stub(),
    };

    const apiModule = proxyquire('../src/data-dog-api', {
      'datadog-metrics': metricsMock,
    });

    const api = apiModule({ isEnabled: true });
    expect(() => { api({ hostname: 'myserver' }); }).to.throw('Requires env');
  });

  it('initialises the api when datadog api is enabled', () => {
    const metricsMock = {
      init: sinon.stub(),
    };

    const apiModule = proxyquire('../src/data-dog-api', {
      'datadog-metrics': metricsMock,
    });

    const api = apiModule({ isEnabled: true });
    api({ hostname: 'myserver', env: 'dev' });
    sinon.assert.calledWith(metricsMock.init, sinon.match({ host: 'myserver' }));
  });

  it('does not initialises the api when datadog api is disabled', () => {
    const metricsMock = {
      init: sinon.stub(),
    };

    const apiModule = proxyquire('../src/data-dog-api', {
      'datadog-metrics': metricsMock,
    });

    const api = apiModule({ isEnabled: false });
    api({ hostname: 'myserver' });
    sinon.assert.notCalled(metricsMock.init);
  });
});
