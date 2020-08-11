import TokenStream, { IToken } from "./token_stream";

export default class Parser {
  input: TokenStream;

  constructor(input: TokenStream) {
    this.input = input;
  }

  parse() {
    return this.parse_toplevel();
  }

  private parse_toplevel() {
    const prog = [];
    while (!this.input.eof()) {
      prog.push(this.parse_expression());
      if (!this.input.eof()) this.skip_punc(";");
    }

    return { type: "prog", prog }
  }

  private parse_lambda() {
    return {
      type: "lambda",
      vars: this.delimited("(", ")", ",", () => this.parse_varname()),
      body: this.parse_expression()
    }
  }

  private parse_varname(): string {
    const name = this.input.next();
    if (name.type != "var") this.input.croak("Expecting variable name");
    return name.value as string;
  }

  private parse_if() {
    this.skip_kw("if");
    const cond = this.parse_expression();
    if (!this.is_punc("{")) this.skip_kw("then")
    const then = this.parse_expression();
    const ret: IF = { type: "if", cond, then };
    if (this.is_kw("else")) {
      this.input.next();
      ret.else = this.parse_expression();
    }
    return ret;
  }

  private parse_atom() {
    return this.maybe_call(() => {
      if (this.is_punc("(")) {
        this.input.next();
        const exp = this.parse_expression();
        this.skip_punc(")");
        return exp;
      }

      if (this.is_punc("{")) return this.parse_prog();
      if (this.is_kw("if")) return this.parse_if();
      if (this.is_kw("true") || this.is_kw("false")) return this.parse_bool();
      if (this.is_kw("lambda") || this.is_kw("λ")) {
        this.input.next();
        return this.parse_lambda();
      }
      if (this.is_kw("let")) return this.parse_let();

      const tok = this.input.next();
      if (["var", "num", "str"].indexOf(tok.type) >= 0)
        return tok;

      this.unexpected();
    });
  }

  private parse_let(): any {
    this.skip_kw("let");
    return {
      type: "let",
      vars: this.delimited("(", ")", ",", () => this.parse_def()),
      body: this.parse_prog()
    };
  }

  private parse_def(): any {
    const left = this.input.next();
    const tok = this.is_op();
    if (tok) {
      this.input.next();
      const right = this.maybe_binary(this.parse_atom(), 0);

      return {
        name: left.value,
        def: right
      };
    }

    return {
      name: left.value
    };
  }

  private parse_call(func: string): any {
    return {
      type: "call",
      func,
      args: this.delimited("(", ")", ",", () => this.parse_expression())
    };
  }

  private parse_bool(): any {
    return {
      type: "bool",
      value: this.input.next().value == "true"
    };
  }

  private parse_prog(): any {
    const prog = this.delimited("{", "}", ";", () => this.parse_expression());
    if (prog.length == 0) return { type: "bool", value: false };
    if (prog.length == 1) return prog[0];
    return { type: "prog", prog };
  }

  private unexpected() {
    this.input.croak(`Unexpected token: ${JSON.stringify(this.input.peek())}`);
  }

  private maybe_call(expr: () => string): any {
    const e = expr();
    return this.is_punc("(") ? this.parse_call(e) : e;
  }

  private parse_expression(): string {
    return this.maybe_call(() => this.maybe_binary(this.parse_atom(), 0));
  }

  private maybe_binary(left: any, my_prec: number): any {
    const tok = this.is_op();
    if (tok) {
      const his_prec = PRECEDENCE[tok.value as string];
      if (his_prec > my_prec) {
        this.input.next();
        const right = this.maybe_binary(this.parse_atom(), his_prec);
        const binary = {
          type: tok.value == "=" ? "assign" : "binary",
          operator: tok.value,
          left,
          right
        };

        return this.maybe_binary(binary, my_prec);
      }
    }

    return left;
  }

  private delimited(start: string, end: string, separator: string, parser: any) {
    const a = [];
    let first = true;

    this.skip_punc(start);
    while (!this.input.eof()) {
      if (this.is_punc(end)) break;
      if (first) first = false
      else this.skip_punc(separator);

      if (this.is_punc(end)) break;
      a.push(parser());
    }

    this.skip_punc(end);
    return a;
  }

  private is_kw(kw?: string): IToken {
    const tok = this.input.peek();
    return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
  }

  private is_op(op?: string): IToken {
    const tok = this.input.peek();
    return tok && tok.type == "op" && (!op || tok.value == op) && tok;
  }

  private is_punc(ch?: string): IToken {
    const tok = this.input.peek();
    return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
  }

  private skip_punc(ch: string) {
    if (this.is_punc(ch)) this.input.next();
    else this.input.croak(`Expecting punctuation: "${ch}"`);
  }

  private skip_kw(kw: string) {
    if (this.is_kw(kw)) this.input.next();
    else this.input.croak(`Expecting keyword: "${kw}"`);
  }

  private skip_op(op: string) {
    if (this.is_op(op)) this.input.next();
    else this.input.croak(`Expecting operator: "${op}"`);
  }
}

export interface IF {
  type: string;
  cond: string,
  then: string,
  else?: string;
}

const PRECEDENCE: { [key: string]: number } = {
  "=": 1,
  "||": 2,
  "&&": 3,
  "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
  "+": 10, "-": 10,
  "*": 20, "/": 20, "%": 20,
};
