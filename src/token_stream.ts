import InputStream from "./input_stream";

export default class TokenStream {
  private input: InputStream;
  private current: IToken;

  constructor(input: InputStream) {
    this.input = input;
    this.current = null;
  }

  next(): IToken {
    const tok = this.current;
    this.current = null;
    return tok || this.read_next();
  }

  peek(): IToken {
    return this.current || (this.current = this.read_next());
  }

  eof(): boolean {
    return this.peek() == null;
  }

  croak(msg: string) {
    this.input.croak(msg);
  }

  private read_next(): IToken {
    this.read_while(this.is_whitespace);
    if (this.input.eof()) return null;

    const ch = this.input.peek();
    if (ch == "#") {
      this.skip_comment();
      return this.read_next();
    }

    if (ch == '"') return this.read_string();
    if (this.is_digit(ch)) return this.read_number();
    if (this.is_id_start(ch)) return this.read_ident();
    if (this.is_punc(ch)) return {
      type: "punc",
      value: this.input.next()
    }

    if (this.is_op_char(ch)) return {
      type: "op",
      value: this.read_while(this.is_op_char)
    }

    this.input.croak("Can't handle character: " + ch);
  }

  private read_while(predicate: (ch: string) => boolean): string {
    let str = "";
    while (!this.input.eof() && predicate(this.input.peek())) {
      str += this.input.next();
    }

    return str;
  }
  private read_ident(): IToken {
    const id = this.read_while(ch => this.is_id(ch));
    return {
      type: this.is_keyword(id) ? "kw" : "var",
      value: id
    }
  }

  private read_number(): IToken {
    let has_dot = false;
    const num = this.read_while(ch => {
      if (ch == ".") {
        if (has_dot) return false;
        has_dot = true;
        return true;
      }

      return this.is_digit(ch);
    });

    return {
      type: "num",
      value: parseFloat(num)
    }
  }

  private read_string(): IToken {
    return {
      type: "str",
      value: this.read_escaped('"')
    }
  }

  private read_escaped(end: string): string {
    let str = "", escaped = false;
    this.input.next();

    while (!this.input.eof()) {
      const ch = this.input.next();
      if (escaped) {
        str += ch;
        escaped = false;
      } else if (ch == "\\") {
        escaped = true;
      } else {
        str += ch;
      }
    }

    return str;
  }

  private skip_comment() {
    this.read_while(ch => ch != "\n");
    this.input.next();
  }

  private is_op_char(ch: string) {
    return "+-*/%=&|<>!".indexOf(ch) >= 0;
  }

  private is_punc(ch: string) {
    return ",;[]{}()".indexOf(ch) >= 0;
  }

  private is_keyword(id: string) {
    return KEYWORDS.indexOf(` ${id} `) >= 0;
  }

  private is_id(ch: string) {
    return this.is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
  }

  private is_id_start(ch: string) {
    return /[a-z_]/i.test(ch);
  }

  private is_digit(ch: string): boolean {
    return /[0-9]/i.test(ch);
  }

  private is_whitespace(ch: string) {
    return " \t\n".indexOf(ch) >= 0;
  }

}

const KEYWORDS = ` if then else lambda true false `;

export interface IToken {
  type: string;
  value: string | number;
}
