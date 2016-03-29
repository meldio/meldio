/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoAmbiguousConnectionNames: Rule = ({ connections }) => {
  const connectionMap = { };
  const errors = [ ];

  connections
    .forEach(conn => {
      if (connectionMap[conn.name]) {
        const [ type, edgeType ] = connectionMap[conn.name];
        if (type !== conn.type || type.edgeType !== conn.edgeType) {
          errors.push(error`Connection name ${conn.name} is ambiguous.
            ~ It refers to a connection on
            ~ ${conn.type}${conn.edgeType ? ` with ${conn.edgeType} edge` : ``}
            ~ and a connection on
            ~ ${type}${edgeType ? ` with ${edgeType} edge` : ``}.`);
        }
      } else {
        connectionMap[conn.name] = [ conn.type, conn.edgeType ];
      }
    });

  return errors;
};
