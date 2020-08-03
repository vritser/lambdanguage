export default class InputStream {
  private input: string;
  private pos: number;
  private line: number;
  private col: number;

  constructor(input: string) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.col = 0;
  }

  next(): string {
    const ch = this.input.charAt(this.pos++);
    if (ch == "\n")
      this.line++;
    else
      this.col++;
    return ch;
  }

  peek(): string {
    return this.input.charAt(this.pos);
  }

  eof(): boolean {
    return this.peek() == "";
  }

  croak(msg: string): void {
    throw new Error(`${msg} (${this.line}:${this.col})`);
  }
}
