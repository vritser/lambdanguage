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

  globalEnv.def("CallCC", (cb: any, func: Function) => {
    func(cb, function CC(_: any, ret: any) {
      cb(ret);
    });
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

  it('print string', () => {
    const code = `print("hello world");`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (sum: boolean) => expect(sum).to.false]);
  });

  it('infinite recursion', () => {
    const code = `fib = λ(n) if n < 2 then n else fib(n - 1) + fib(n - 2); fib(30);`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (sum: number) => expect(sum).to.eq(832040)]);
  });

  it('intercept the current continuation', () => {
    const code = `
foo = λ(return) {
  print("foo");
  return("DONE");
  print("bar");
};

CallCC(foo);
  `;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (done: string) => expect(done).to.eq("DONE")]);
  });

  it('let block', () => {
    const code = `
let (a = 10, b = a + 5, c = b * 2, d) {
  d = c * 5;
  d * 2;
};
`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (product: number) => expect(product).to.eq(300)]);
  });

  it('backtracing', () => {
    const code = `
fail = lambda() false;
guess = lambda(current) {
  CallCC(lambda(k) {
    let (prevFail = fail) {
      fail = lambda() {
        current = current + 1;
        if current > 100 {
          fail = prevFail;
          fail();
        } else {
          k(current);
        };
      };
      k(current);
    };
  });
};

a = guess(1);
b = guess(a);
if a * b == 84 {
  print(a, " x ", b);
};
fail();
`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    Execute(evaluate, [ast, globalEnv, (result: boolean) => expect(result).to.false]);
  });

});
