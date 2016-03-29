import invariant from '../jsutils/invariant';
import { NodeEdgeObject } from './NodeEdgeObject';
import { validateEdgeUpdate, throwOnErrors } from './validator';
import { addTypeAnnotationsToUpdateExp } from './annotations';

export function NodeEdge(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to NodeEdge.');
  const { schema, crud, nodeId, field, relatedId } = context;
  invariant(schema, 'Must pass schema to NodeEdge context.');
  invariant(crud, 'Must pass crud resolvers to NodeEdge context.');
  invariant(nodeId, 'Must pass nodeId to NodeEdge context.');
  invariant(field, 'Must pass field object to NodeEdge context.');
  invariant(field.isNodeConnection,
    'Must pass NodeConnection field object to NodeEdge context.');
  invariant(relatedId, 'Must pass relatedId to NodeEdge context.');

  if ( !(this instanceof NodeEdge) ) {
    return new NodeEdge(context);
  }

  this.exists = async () => crud.NodeConnection
    .existsEdge(nodeId, field.name, relatedId, field.relatedField);

  this.get = async () => {
    const data = await crud.NodeConnection
      .getEdge(nodeId, field.name, relatedId, field.relatedField);

    if (data) {
      return new NodeEdgeObject({ ...context, data });
    }

    return null;
  };

  this.delete = async () => {
    const isDeleted = await crud.NodeConnection
      .deleteEdge(nodeId, field.name, relatedId, field.relatedField);
    return isDeleted ? relatedId : null;
  };

  this.update = async update => {
    throwOnErrors(validateEdgeUpdate({...context, function: 'update'}, update));
    invariant(field.edgeType, 'Cannot update edge without props');

    const annotatedPropsUpdate =
      addTypeAnnotationsToUpdateExp(context, field.edgeType, update);

    delete annotatedPropsUpdate._type;

    const isUpdated = await crud.NodeConnection.updateEdge(
      nodeId,
      field.name,
      relatedId,
      field.relatedField,
      field.type,
      field.edgeType,
      annotatedPropsUpdate);

    return isUpdated ? this : null;
  };

  Object.defineProperties(this, {
    nodeId: { get() { return nodeId; } },
    nodeField: { get() { return field.name; }},
    relatedField: { get() { return field.relatedField; }},
    relatedId: { get() { return relatedId; } },
    nodeType: { get() { return field.type; } },
    edgeType: { get() { return field.edgeType; } },
  });
  Object.freeze(this);
}
