import { validationErrorHandler } from './errorHandlers/validationErrorHandler.js';
import { jsonSyntaxErrorHandler } from './errorHandlers/jsonSyntaxErrorHandler.js';
import { messagingErrorHandler } from './errorHandlers/messagingErrorHandler.js';
import { defaultErrorHandler } from './errorHandlers/defaultErrorHandler.js';

// Chain of Responsibility: each handler either handles the error or passes it to next
export const errorHandlerChain = [
  validationErrorHandler,
  jsonSyntaxErrorHandler,
  messagingErrorHandler,
  defaultErrorHandler,  // terminal handler — always handles
];
