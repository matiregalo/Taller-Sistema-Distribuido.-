import {
  validationErrorHandler,
  jsonSyntaxErrorHandler,
  messagingErrorHandler,
  httpErrorHandler,
  defaultErrorHandler,
} from './errorHandlers/index.js';

// Chain of Responsibility: each handler either handles the error or passes it to next
// httpErrorHandler acts as a catch-all for any HttpError subclass (OCP §3.2)
export const errorHandlerChain = [
  validationErrorHandler,
  jsonSyntaxErrorHandler,
  messagingErrorHandler,
  httpErrorHandler,         // generic fallback for future HttpError subtypes
  defaultErrorHandler,      // terminal handler — always handles
];
