import { CONTEXT } from './constants';
import { ContextConsumer } from './Context';

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
  constructor(public context: ContextConsumer<any>) {
    super(
      `Cannot find context ${context.name}${context[CONTEXT].help ?? '\n' + context[CONTEXT].help}`
    );
    this.help = context[CONTEXT].help;
  }
}

MiidError.InvalidMiddleware = InvalidMiddleware;
MiidError.MissingContext = MissingContext;
