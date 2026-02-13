import { validationErrorHandler } from './errorHandlers/validationErrorHandler.js';
import { jsonSyntaxErrorHandler } from './errorHandlers/jsonSyntaxErrorHandler.js';
import { messagingErrorHandler } from './errorHandlers/messagingErrorHandler.js';
import { httpErrorHandler } from './errorHandlers/httpErrorHandler.js';
import { defaultErrorHandler } from './errorHandlers/defaultErrorHandler.js';

// Chain of Responsibility: each handler either handles the error or passes it to next
// httpErrorHandler acts as a catch-all for any HttpError subclass (OCP §3.2)
export const errorHandlerChain = [
  validationErrorHandler,
  jsonSyntaxErrorHandler,
  messagingErrorHandler,
  httpErrorHandler,         // generic fallback for future HttpError subtypes
  defaultErrorHandler,      // terminal handler — always handles
];
