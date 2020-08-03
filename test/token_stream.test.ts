import { expect } from 'chai';
import InputStream from '../src/input_stream';
import TokenStream from '../src/token_stream';

describe('token stream', () => {

  const input = new InputStream(`sum = lambda(a, b) {
  a + b;
};
print(sum(1, 2));`);

  const token = new TokenStream(input)

  it('TokenStream#peek() should return the current token that has type IToken', () => {
    const _var = token.peek();
    expect(_var.type).to.eq("var");
    expect(_var.value).to.eq("sum");
  });

  it('TokenStream#next() should return next token', () => {
    token.next();
    const op = token.next();
    expect(op.type).to.eq("op");
    expect(op.value).to.eq("=");

    const id = token.next();
    expect(id.type).to.eq("kw");
    expect(id.value).to.eq("lambda");

    const open_parenthese = token.next();
    expect(open_parenthese.type).to.eq("punc");
    expect(open_parenthese.value).to.eq("(");

    const var_a = token.next();
    expect(var_a.type).to.eq("var");
    expect(var_a.value).to.eq("a");

    const punc_comma = token.next();
    expect(punc_comma.type).to.eq("punc");
    expect(punc_comma.value).to.eq(",");

    const var_b = token.next();
    expect(var_b.type).to.eq("var");
    expect(var_b.value).to.eq("b");

    const close_parenthese = token.next();
    expect(close_parenthese.type).to.eq("punc");
    expect(close_parenthese.value).to.eq(")");

  });

  it('TokenStream#eof() should be true', () => {
    while (!token.eof()) {
      token.next();
    }

    expect(token.eof()).to.eq(true);
    expect(token.next()).to.eq(null);
  });

  it('TokenStream#croak() should throw an error', () => {
    expect(() => token.croak("Syntax Error")).to.throws()
  })

})
