import invariant from '../jsutils/invariant';
import isNullish from '../jsutils/isNullish';
import strip from '../jsutils/strip';
import { newGlobalId } from '../jsutils/globalId';
import { Node } from './Node';
import { Nodes } from './Nodes';
import { validateId, validateFilter, validateNode } from './validator';
import { throwOnErrors } from './validator';
import { addTypeAnnotations } from './annotations';

const AddNodeFailedError = context => ({
  context,
  results: [ strip`Failed to add node of "${context.type}" type.` ]
});

export function NodeType(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to NodeType.');
  const { schema, crud, mutation, type } = context;
  invariant(schema, 'Must pass schema to NodeType context.');
  invariant(crud, 'Must pass crud resolvers to NodeType context.');
  invariant(mutation, 'Must pass mutation object to NodeType context.');
  invariant(schema[type] && schema[type].kind === 'type',
    'Must pass a valid type to NodeType context.');
  invariant(schema[type].implementsNode,
    'Must pass a type that implements Node to NodeType context.');

  if ( !(this instanceof NodeType) ) {
    return new NodeType(context);
  }

  this.node = id => {
    throwOnErrors(validateId({ ...context, function: 'node' }, id));

    return new Node({ ...context, id });
  };

  this.filter = filter => {
    throwOnErrors(validateFilter({...context, function: 'filter'}, filter));

    return new Nodes({ ...context, filter });
  };

  this.addNode = async node => {
    const id = node && node.id ? node.id : newGlobalId(type);
    const nodeWithId =
      isNullish(node) || typeof node !== 'object' || Array.isArray(node) ?
        undefined :
        node.id ? node : { id, ...node };

    throwOnErrors(validateNode({...context, function: 'addNode'}, nodeWithId));

    const typeAnnotatedNode = addTypeAnnotations(context, type, nodeWithId);

    const isAdded = await crud.addNode(type, typeAnnotatedNode);
    if (isAdded) {
      if (!node || !node.id) {
        mutation.globalIds.push(id);
      }
      return new Node({ ...context, id });
    }
    throwOnErrors(AddNodeFailedError(context));
  };

  Object.defineProperties(this, { type: { get() { return type; } } });
  Object.freeze(this);
}
