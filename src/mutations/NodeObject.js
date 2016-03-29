import invariant from '../jsutils/invariant';
import { validateUpdate, throwOnErrors } from './validator';
import { NodeConnection } from './NodeConnection';
import { Node } from './Node';
import { addTypeAnnotationsToUpdateExp } from './annotations';

export function NodeObject(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to NodeObject.');

  const { schema, crud, mutation, type, data } = context;
  const { id } = data;

  invariant(schema, 'Must pass schema to NodeObject context.');
  invariant(crud, 'Must pass crud resolvers to NodeObject context.');
  invariant(mutation, 'Must pass mutation object to NodeObject context.');
  invariant(schema[type] && schema[type].kind === 'type',
    'Must pass a valid type name to NodeObject context.');
  invariant(schema[type].implementsNode,
    'Must pass a type that implements Node to NodeObject context.');
  invariant(data, 'Must pass data to NodeObject context.');
  invariant(id, 'Must pass data with id to NodeObject context.');

  if ( !(this instanceof NodeObject) ) {
    return new NodeObject(context);
  }

  this.delete = async () => {
    const isDeleted = await crud.deleteNode(type, id);
    return isDeleted ? id : null;
  };

  this.update = async update => {
    throwOnErrors(validateUpdate({...context, function: 'update'}, update));

    const typeAnnotatedUpdate = addTypeAnnotationsToUpdateExp(
      context,
      type,
      update);

    const isUpdated = await crud.updateNode(type, id, typeAnnotatedUpdate);
    if (isUpdated) {
      const nodeContext = { ...context, id };
      delete nodeContext.data;
      return new Node(nodeContext);
    }

    return null;
  };

  const fields = schema[type]
    .fields
    .filter(field =>
      !field.isNodeConnection &&
      !field.isObjectConnection &&
      !field.isScalarConnection )
    .map(field => ({
      [field.name]: {
        get() {
          return data[field.name] !== undefined ? data[field.name] : null;
        }
      } }))
    .reduce( (acc, field) => ({ ...acc, ...field }), { });

  const nodeConnections = schema[type]
    .fields
    .filter(field => field.isNodeConnection)
    .map(field => ({
      [field.name]: {
        get() {
          const nodeConnectionContext = { ...context, nodeId: id, field };
          delete nodeConnectionContext.data;
          return new NodeConnection(nodeConnectionContext);
        }
      } }))
    .reduce( (acc, conn) => ({ ...acc, ...conn }), { });

  Object.defineProperties(this, {
    type: { get() { return type; } },
    ...fields,
    ...nodeConnections,
  });
  Object.freeze(this);
}
