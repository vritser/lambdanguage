import Environment from "./environment";

export default function evaluate(exp: any, env: Environment): any {
  switch (exp.type) {
    case "num":
    case "str":
    case "bool":
      return exp.value;

    case "var":
      return env.get(exp.value);

    case "assign":
      if (exp.left.type != "var")
        throw new Error(`Cannot assign to ${JSON.stringify(exp.left)}`);
      return env.set(exp.left.value, evaluate(exp.right, env));

    case "binary":
      return apply_op(exp.operator,
        evaluate(exp.left, env),
        evaluate(exp.right, env));

    case "lambda":
      return make_lambda(exp, env);

    case "if":
      const cond = evaluate(exp.cond, env);
      if (cond) return evaluate(exp.then, env);

      return exp.else ? evaluate(exp.else, env) : false;

    case "prog":
      return exp.prog.reduce((_: boolean, x: any) => evaluate(x, env), false);

    case "call":
      const func = evaluate(exp.func, env);
      return func.apply(null, exp.args.map((arg: any) => evaluate(arg, env)));

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
    return function() {
      const args = arguments;
      const params = exp.vars;
      const scope = env.extend();
      for (let i = 0; i < params.length; i++) {
        scope.def(params[i], args[i] || false);
      }

      return evaluate(exp.body, scope);
    }
  }
}
