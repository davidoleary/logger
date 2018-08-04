import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import dataDogAPI from '../src/data-dog-wrapper';

describe('Datadog wrapper', () => {
  it('exposes function to enable recording of custom metrics', () => {
    expect(dataDogAPI).to.be.a('function');
  });

  it('creates an instance of StatsD', () => {
    const hotShotsMock = {
      StatsD: sinon.stub(),
    };

    const middleware = proxyquire('../src/data-dog-wrapper', {
      'hot-shots': hotShotsMock,
    });

    middleware({ stream: {} });
    sinon.assert.called(hotShotsMock.StatsD);
  });
});
