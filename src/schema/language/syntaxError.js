/* @ flow */

import { getLocation } from './location';
import type { Source } from './source';
import { GraphQLError } from 'graphql';

export class SyntaxError extends Error {
  name: string;
  message: string;
  description: string;
  line: number;
  column: number;
  source: Source;

  constructor(
    message: string,
    description: string,
    line: number,
    column: number,
    source: Source
  ) {
    super(message);
    this.message = message;

    Object.defineProperty(this, 'name', ({
      get() { return 'Syntax Error'; }
    }: any));

    Object.defineProperty(this, 'description', ({
      get() { return description; }
    }: any));

    Object.defineProperty(this, 'line', ({
      get() { return line; }
    }: any));

    Object.defineProperty(this, 'column', ({
      get() { return column; }
    }: any));

    Object.defineProperty(this, 'source', ({
      get() { return source; }
    }: any));
  }
}

/**
 * Produces a GraphQLError representing a syntax error, containing useful
 * descriptive information about the syntax error's position in the source.
 */
export function syntaxError(
  source: Source,
  position: number,
  description: string
): GraphQLError {
  const location = getLocation(source, position);
  const error = new SyntaxError(
    `Syntax Error ${source.name} (${location.line}:${location.column}) ` +
    description + '\n\n' + highlightSourceAtLocation(source, location),
    description,
    location.line,
    location.column,
    source
  );
  return error;
}

/**
 * Render a helpful description of the location of the error in the GraphQL
 * Source document.
 */
function highlightSourceAtLocation(source, location) {
  const line = location.line;
  const prevLineNum = (line - 1).toString();
  const lineNum = line.toString();
  const nextLineNum = (line + 1).toString();
  const padLen = nextLineNum.length;
  const lines = source.body.split(/\r\n|[\n\r]/g);
  return (
    (line >= 2 ?
      lpad(padLen, prevLineNum) + ': ' + lines[line - 2] + '\n' : '') +
    lpad(padLen, lineNum) + ': ' + lines[line - 1] + '\n' +
    Array(2 + padLen + location.column).join(' ') + '^\n' +
    (line < lines.length ?
      lpad(padLen, nextLineNum) + ': ' + lines[line] + '\n' : '')
  );
}

function lpad(len, str) {
  return Array(len - str.length + 1).join(' ') + str;
}
