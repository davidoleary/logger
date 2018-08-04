import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import expressMorgan from '../src/middleware/express-morgan';
import { OptionError } from '../src/error';

describe('express morgan middleware', () => {
  it('exposes middleware as a function', () => {
    expect(expressMorgan).to.be.a('function');
  });

  it('requires winston', () => {
    expect(() => { expressMorgan(); }).to.throw(OptionError);
    expect(() => { expressMorgan(); }).to.throw('Requires winston');
  });

  it('only uses stdout when there is no stream', () => {
    const morganMock = sinon.stub();

    const middleware = proxyquire('../src/middleware/express-morgan', {
      morgan: morganMock,
    });

    middleware({ stream: { write: {} } });
    sinon.assert.calledWith(morganMock, 'combined');
  });

  it('pipes messages to winston', () => {
    const morganMock = sinon.stub();

    const middleware = proxyquire('../src/middleware/express-morgan', {
      morgan: morganMock,
    });

    middleware({ stream: { write : {} } });
    sinon.assert.calledWith(morganMock, 'combined', sinon.match.has('stream'));
  });
});
