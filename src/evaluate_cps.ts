import Environment from "./environment";

let MAX_STACK_LEN = 0;

export default function evaluate(exp: any, env: Environment, callback: any): any {
  switch (exp.type) {
    case "num":
    case "str":
    case "bool":
      callback(exp.value);
      return;

    case "var":
      callback(env.get(exp.value));
      return;

    case "assign":
      if (exp.left.type != "var")
        throw new Error(`Cannot assign to ${JSON.stringify(exp.left)}`);
      evaluate(exp.right, env, function CC(right: any) {
        GUARD(CC, arguments);
        const ret = env.set(exp.left.value, right);
        callback(ret);
      })
      return;

    case "binary":
      evaluate(exp.left, env, function CC(left: any) {
        GUARD(CC, arguments);
        evaluate(exp.right, env, function CC(right: any) {
          GUARD(CC, arguments);
          callback(apply_op(exp.operator, left, right));
        });
      });
      return;

    case "let":
      (function loop(env: Environment, i: number) {
        GUARD(loop, arguments);
        if (i < exp.vars.length) {
          const _var = exp.vars[i];
          if (_var.def) {
            evaluate(_var.def, env, function CC(value: any) {
              GUARD(CC, arguments);
              const scope = env.extend();
              scope.def(_var.name, value);
              loop(scope, i + 1);
            })
          } else {
            const scope = env.extend();
            scope.def(_var.name, false);
            loop(scope, i + 1);
          }
        } else {
          evaluate(exp.body, env, callback);
        }
      })(env, 0);
      return;

    case "lambda":
      callback(make_lambda(exp, env));
      return;

    case "if":
      evaluate(exp.cond, env, function CC(cond: any) {
        GUARD(CC, arguments);
        if (cond) evaluate(exp.then, env, callback);
        else if (exp.else) evaluate(exp.else, env, callback);
        else callback(false);
      });
      return;

    case "prog":
      (function loop(z: any, i: number) {
        GUARD(loop, arguments);
        if (i < exp.prog.length) {
          evaluate(exp.prog[i], env, function CC(x: any) {
            GUARD(CC, arguments);
            loop(x, i + 1);
          });
        } else {
          callback(z);
        }
      })(false, 0);
      return;

    case "call":
      evaluate(exp.func, env, function CC(func: any) {
        GUARD(CC, arguments);
        (function loop(args: any[], i: number) {
          GUARD(loop, arguments);
          if (i < exp.args.length) {
            evaluate(exp.args[i], env, function CC(arg: any) {
              GUARD(CC, arguments);
              args[i + 1] = arg;
              loop(args, i + 1);
            });
          } else {
            func.apply(null, args);
          }
        })([callback], 0);
      });
      return;

    default:
      throw new Error(`I don't know how to evaluate ${exp.type}`);
  }


  function apply_op(op: string, a: any, b: any): any {
    switch (op) {
      case "+": return num(a) + num(b);
      case "-": return num(a) - num(b);
      case "*": return num(a) * num(b);
      case "/": return num(a) / div(b);
      case "%": return num(a) % div(b);
      case "&&": return a !== false && b;
      case "||": return a !== false ? a : b;
      case "<": return num(a) < num(b);
      case ">": return num(a) > num(b);
      case "<=": return num(a) <= num(b);
      case ">=": return num(a) >= num(b);
      case "==": return a === b;
      case "!=": return a !== b;
    }

    throw new Error("Can't apply operator " + op);

    function num(x: number): number {
      if (typeof x != "number") {
        throw new Error(`Expected number but got ${x}`);
      }
      return x;
    }

    function div(x: number): number {
      if (num(x) == 0)
        throw new Error("Divide by zero");

      return x;
    }
  }

  function make_lambda(exp: any, env: Environment) {
    if (exp.name) {
      env = env.extend();
      env.def(exp.name, lambda);
    }

    function lambda(callback: any, ...args: any[]) {
      GUARD(lambda, arguments);
      const params = exp.vars;
      const scope = env.extend();
      for (let i = 0; i < params.length; ++i) {
        scope.def(params[i], i < args.length ? args[i] : false);
      }

      evaluate(exp.body, scope, callback);
    }

    return lambda;
  }

  function GUARD(func: Function, args: any) {
    if (--MAX_STACK_LEN < 0) throw new Continuation(func, args);
  }

}

export function Execute(func: Function, args: any[]) {
  while (true) try {
    MAX_STACK_LEN = 200;
    return func.apply(null, args);
  } catch (ex) {
    if (ex instanceof Continuation)
      func = ex.func, args = ex.args;
    else throw ex;
  }
}

class Continuation {
  func: Function;
  args: any[];

  constructor(func: Function, args: any[]) {
    this.func = func;
    this.args = args;
  }
}
