export default class Stack<T> {
  private stack: T[];
  
  constructor(...items: T[]) {
    this.stack = [];
    this.push(...items);
  }

  push(...items: T[]) {
    this.stack.push(...items);
  }

  pop() {
    if (this.isEmpty()) {
      throw new Error('Empty stack');
    }
    return this.stack.pop() as T;
  }

  peek() {
    if (this.isEmpty()) {
      throw new Error('Empty stack');
    }
    return this.stack.at(-1) as T;
  }

  isEmpty() {
    return this.stack.length === 0;
  }
}