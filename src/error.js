class OptionError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, OptionError.prototype);
    this.name = this.constructor.name;
  }
}

export default { OptionError };
