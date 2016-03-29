import invariant from '../jsutils/invariant';
import { NodeConnection } from './NodeConnection';
import { NodeObject } from './NodeObject';
import { validateUpdate, throwOnErrors } from './validator';
import { addTypeAnnotationsToUpdateExp } from './annotations';

export function Node(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to Node.');
  const { schema, crud, mutation, type, id } = context;
  invariant(schema, 'Must pass schema to Node context.');
  invariant(crud, 'Must pass crud resolvers to Node context.');
  invariant(mutation, 'Must pass mutation object to NodeObject context.');
  invariant(schema[type] && schema[type].kind === 'type',
    'Must pass a valid type name to Node context.');
  invariant(schema[type].implementsNode,
    'Must pass a type that implements Node to Node context.');
  invariant(id, 'Must pass id to Node context.');

  if ( !(this instanceof Node) ) {
    return new Node(context);
  }

  this.exists = async () => crud.existsNode(type, id);

  this.get = async () => {
    const data = await crud.getNode(type, id);
    if (data) {
      const nodeObjectContext = { ...context, data };
      delete nodeObjectContext.id;
      return new NodeObject(nodeObjectContext);
    }
    return null;
  };

  this.delete = async () => {
    const isDeleted = await crud.deleteNode(type, id);
    return isDeleted ? id : null;
  };

  this.update = async update => {
    throwOnErrors(validateUpdate({ ...context, function: 'update' }, update));

    const typeAnnotatedUpdate = addTypeAnnotationsToUpdateExp(
      context,
      type,
      update);

    const isUpdated = await crud.updateNode(type, id, typeAnnotatedUpdate);
    return isUpdated ? this : null;
  };

  const nodeConnections = schema[type]
    .fields
    .filter(field => field.isNodeConnection)
    .map(field => ({
      [field.name]: {
        get() {
          const nodeConnectionContext = { ...context, nodeId: id, field };
          delete nodeConnectionContext.id;
          return new NodeConnection(nodeConnectionContext);
        } } }))
    .reduce( (acc, conn) => ({ ...acc, ...conn }), { });

  Object.defineProperties(this, {
    type: { get() { return type; } },
    id: { get() { return id; } },
    ...nodeConnections,
  });
  Object.freeze(this);
}
