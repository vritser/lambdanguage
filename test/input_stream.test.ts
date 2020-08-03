import { expect } from 'chai';
import InputStream from '../src/input_stream';

describe('input stream', () => {

  const input = new InputStream(`sum = lambda(a, b) {
  a + b;
};
print(sum(1, 2));`)

  it('InputStream#peek() should ok', () => {
    expect(input.peek()).to.equal("s");
  });

  it('InputStream#next() should ok', () => {
    expect(input.next()).to.eq("s");
    expect(input.eof()).to.eq(false);
  });

  it('InputStream#eof() should be true', () => {
    while (!input.eof()) {
      input.next();
    }

    expect(input.eof()).to.eq(true);
    expect(input.next()).to.eq("");
  });

  it('InputStream#croak() should throw an error', () => {
    expect(() => input.croak("Syntax Error")).to.throws()
  })

})
