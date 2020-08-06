import { expect } from 'chai';
import Environment from '../src/environment';
import evaluate, { Execute } from '../src/evaluate_cps';
import InputStream from '../src/input_stream';
import Parser from '../src/parser';
import TokenStream from '../src/token_stream';

describe('evaluate cps', () => {

  const globalEnv = new Environment();
  globalEnv.def("print", (cb: any, ...text: any) => {
    console.log(...text);
    cb(false);
  });

  it('sum of 2 and 3 should be 5', () => {
    const code = `sum = λ(x, y) x + y; print(sum(2, 3)); sum(2, 3);`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (sum: number) => expect(sum).to.eq(5)]);
  });

  it('closure', () => {
    const code = `sum = λ(x) λ(y) x + y; sum(2)(3);`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (sum: number) => expect(sum).to.eq(5)]);
  });

  it('infinite recursion', () => {
    const code = `fib = λ(n) if n < 2 then n else fib(n - 1) + fib(n - 2); fib(30);`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (sum: number) => expect(sum).to.eq(832040)]);
  });

});
