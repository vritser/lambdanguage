import { expect } from 'chai';
import evaluate from '../src/envaluate';
import Environment from '../src/environment';
import InputStream from '../src/input_stream';
import Parser from '../src/parser';
import TokenStream from '../src/token_stream';

describe('evaluate', () => {
  const code = `sum = lambda(x, y) x + y; print(sum(2, 3)); sum(2, 3);`;

  const ast = new Parser(new TokenStream(new InputStream(code))).parse();
  const globalEnv = new Environment();
  globalEnv.def("print", console.log);

  it('sum of 2 and 3 should be 5', () => {
    const sum = evaluate(ast, globalEnv);
    expect(sum).to.eq(5);
  });

});
