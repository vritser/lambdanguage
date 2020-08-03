export default class Environment {
  private parent: Environment;
  private vars: { [key: string]: any };

  constructor(parent?: Environment) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
  }

  // Create a subscope.
  extend() {
    return new Environment(this);
  }

  // Find the scope where the variable with the given name is defined.
  lookup(name: string): Environment {
    let scope: Environment = this;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.vars, name))
        return scope;
      scope = scope.parent;
    }
  }

  // Get the current value of a variable. Throws an error if the variable is not defined.
  get(name: string) {
    if (name in this.vars) {
      return this.vars[name];
    }
    throw new Error(`Undefined variable ${name}`);
  }

  // Set the value of a variable. This needs to lookup the actual scope where the variable is defined.
  // If it's not found and we're not in the global scope, throws an error.
  set(name: string, value: any) {
    const scope = this.lookup(name);

    if (!scope && this.parent)
      throw new Error("Undefined variable ${name}");

    (scope || this).vars[name] = value;
  }

  // Creates (or shadows, or overwrites) a variable in the current scope.
  def(name: string, value: any) {
    this.vars[name] = value;
  }

}
