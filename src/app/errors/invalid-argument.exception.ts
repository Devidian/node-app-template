export class InvalidArgumentException extends Error {
	constructor(message?: string) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = InvalidArgumentException.name;
	}
}
