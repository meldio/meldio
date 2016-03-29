import invariant from '../jsutils/invariant';
import { NodeType } from './NodeType';

export function Model(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to Model.');
  const { schema, crud, mutation } = context;
  invariant(schema, 'Must pass schema to Model context.');
  invariant(crud, 'Must pass crud resolvers to Model context.');
  invariant(mutation, 'Must pass mutation object to Model context.');

  if ( !(this instanceof Model) ) {
    return new Model(context);
  }

  const nodeTypeGetters =
    Object.keys(schema)
      .map(key => schema[key])
      .filter(type => type.kind === 'type' && type.implementsNode)
      .map(type => ({
        [type.name]: {
          get() {
            return new NodeType({ ...context, type: type.name });
          }
        } }))
      .reduce( (acc, getter) => ({ ...acc, ...getter }), { });

  Object.defineProperties(this, nodeTypeGetters);
  Object.freeze(this);
}
