#!/usr/bin/env node

/* eslint spaced-comment: 0 */

try {
  require('babel/polyfill');
} catch (e) {
  // Babel polyfill can be included only once and babel-node already includes
  // polyfill by default, so the require above throws when this code is executed
  // through babel-node
}

import { cli } from './cli';

cli(process.argv, process.env);
