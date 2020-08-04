import { expect } from 'chai';
import Environment from '../src/environment';
import evaluate from '../src/evaluate';
import InputStream from '../src/input_stream';
import Parser from '../src/parser';
import TokenStream from '../src/token_stream';

describe('evaluate', () => {

  const globalEnv = new Environment();
  globalEnv.def("print", console.log);

  it('sum of 2 and 3 should be 5', () => {
    const code = `sum = λ(x, y) x + y; print(sum(2, 3)); sum(2, 3);`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    const sum = evaluate(ast, globalEnv);
    expect(sum).to.eq(5);
  });

  it('constructs list', () => {
    const code = `

cons = λ(a, b) λ(f) f(a, b);
car = λ(cell) cell(λ(a, b) a);
cdr = λ(cell) cell(λ(a, b) b);
NIL = λ(f) f(NIL, NIL);

x = cons(1, cons(2, cons(3, cons(4, cons(5, NIL)))));
print(car(x));
print(car(cdr(cdr(x))));
print(car(cdr(cdr(cdr(cdr(x))))));

`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    evaluate(ast, globalEnv);
  });


  it('closure', () => {
    const code = `sum = λ(x) λ(y) x + y; sum(2)(3);`;
    const ast = new Parser(new TokenStream(new InputStream(code))).parse();
    const sum = evaluate(ast, globalEnv);
    expect(sum).to.eq(5);
  });


});
