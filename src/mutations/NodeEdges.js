import invariant from '../jsutils/invariant';
import { NodeEdgeObject } from './NodeEdgeObject';
import { validateEdgeUpdate, throwOnErrors } from './validator';
import { addTypeAnnotationsToUpdateExp } from './annotations';

export function NodeEdges(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to NodeEdges.');
  const { schema, crud, nodeId, field, filter } = context;
  invariant(schema, 'Must pass schema to NodeEdges context.');
  invariant(crud, 'Must pass crud resolvers to NodeEdges context.');
  invariant(nodeId, 'Must pass nodeId to NodeEdges context.');
  invariant(field, 'Must pass field object to NodeEdges context.');
  invariant(field.isNodeConnection,
    'Must pass NodeConnection field object to NodeEdges context.');
  invariant(filter, 'Must pass filter to NodeEdges context.');

  if ( !(this instanceof NodeEdges) ) {
    return new NodeEdges(context);
  }

  this.list = async () => {
    const nodeEdgeObjectContext = { ...context };
    delete nodeEdgeObjectContext.filter;

    const edges = await crud.NodeConnection.listEdges(
      nodeId,
      field.name,
      field.type,
      field.edgeType,
      filter);

    return edges
      .map(data => new NodeEdgeObject({
        ...nodeEdgeObjectContext,
        relatedId: data.node.id,
        data
      }));
  };

  this.delete = async () => crud.NodeConnection
    .deleteEdges(nodeId, field.name, field.type, field.edgeType, filter);

  this.update = async update => {
    throwOnErrors(validateEdgeUpdate({...context, function: 'update'}, update));
    invariant(field.edgeType, 'Cannot update edge without props');

    const annotatedPropsUpdate =
      addTypeAnnotationsToUpdateExp(context, field.edgeType, update);

    delete annotatedPropsUpdate._type;

    const ids = await crud.NodeConnection.updateEdges(
      nodeId,
      field.name,
      field.type,
      field.edgeType,
      filter,
      annotatedPropsUpdate);

    return new NodeEdges({ ...context, filter: ids });
  };

  Object.defineProperties(this, {
    nodeId: { get() { return nodeId; } },
    nodeField: { get() { return field.name; }},
    relatedField: { get() { return field.relatedField; }},
    filter: { get() { return filter; } },
    nodeType: { get() { return field.type; } },
    edgeType: { get() { return field.edgeType; } },
  });
  Object.freeze(this);
}
