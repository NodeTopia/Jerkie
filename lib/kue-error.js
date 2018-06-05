class KueError extends Error {
    constructor(message, stack) {
        super(message);

        this.name = this.constructor.name;
        this.message = message;

        this.stack = stack;
    }

    get stack() {
        return "extended " + this._stack;
    }

    set stack(stack) {
        this._stack = stack;
    }
}

module.exports = KueError