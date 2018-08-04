import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import koaMorgan from '../src/middleware/koa-morgan';
import { OptionError } from '../src/error';


describe('koa morgan middleware', () => {
  it('exposes middleware as a function', () => {
    expect(koaMorgan).to.be.a('function');
  });

  it('thows OptionError for missing options', async () => {
    expect(() => { koaMorgan(); }).to.throw(OptionError);
  });

  it('requires winston', () => {
    expect(() => { koaMorgan(); }).to.throw('Requires winston');
  });

  it('only uses stdout when there is no stream', () => {
    const morganMock = sinon.stub();

    const middleware = proxyquire('../src/middleware/koa-morgan', {
      'koa-morgan': morganMock,
    });

    middleware({ stream: {} });
    sinon.assert.calledWith(morganMock, 'combined');
  });

  it('pipes messages to winston', () => {
    const morganMock = sinon.stub();

    const middleware = proxyquire('../src/middleware/koa-morgan', {
      'koa-morgan': morganMock,
    });

    middleware({ stream: { write: {}} });
    sinon.assert.calledWith(morganMock, 'combined', sinon.match.has('stream'));
  });
});
