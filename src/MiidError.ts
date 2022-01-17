import { INTERNAL } from './constants';
import { KeyConsumer } from './Key';

export class MiidError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public static InvalidMiddleware: typeof InvalidMiddleware;
  public static MissingContext: typeof MissingContext;
}

class InvalidMiddleware extends MiidError {
  constructor(public middleware: any, infos: string) {
    super(`Invalid middleware: ${infos}`);
  }
}

class MissingContext extends MiidError {
  public readonly help?: string;
  constructor(public context: KeyConsumer<any>) {
    super(
      `Cannot find context ${context.name}${
        context[INTERNAL].help ?? '\n' + context[INTERNAL].help
      }`
    );
    this.help = context[INTERNAL].help;
  }
}

MiidError.InvalidMiddleware = InvalidMiddleware;
MiidError.MissingContext = MissingContext;
