import invariant from '../jsutils/invariant';
import strip from '../jsutils/strip';
import { newGlobalId } from '../jsutils/globalId';
import { NodeEdge } from './NodeEdge';
import { NodeEdges } from './NodeEdges';
import {
  validateEdgeNodeId,
  validateEdgeFilter,
  validateEdgeNode,
  validateEdgeProps,
  throwOnErrors,
  mergeResults,
} from './validator';
import { addTypeAnnotations } from './annotations';

const AddEdgeFailedError = context => ({
  context,
  results: [ strip`Failed to add "${context.field.name}" connection edge from
                 ~ node "${context.nodeId}" to node "${context.relatedId}".` ]
});

export function NodeConnection(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to NodeConnection.');
  const { schema, crud, mutation, nodeId, field } = context;
  invariant(schema, 'Must pass schema to NodeConnection context.');
  invariant(crud, 'Must pass crud resolvers to NodeConnection context.');
  invariant(mutation, 'Must pass mutation object to NodeConnection context.');
  invariant(nodeId, 'Must pass nodeId to NodeConnection context.');
  invariant(field, 'Must pass field object to NodeConnection context.');
  invariant(field.isNodeConnection,
    'Must pass NodeConnection field object to NodeConnection context.');

  if ( !(this instanceof NodeConnection) ) {
    return new NodeConnection(context);
  }

  this.edge = relatedId => {
    throwOnErrors(
      validateEdgeNodeId({...context, function: 'edge'}, relatedId));

    return new NodeEdge({ ...context, relatedId });
  };

  this.filter = filter => {
    throwOnErrors(validateEdgeFilter({...context, function: 'filter'}, filter));

    return new NodeEdges({ ...context, filter });
  };

  this.nodeIds = async () =>
    crud.NodeConnection.listRelatedNodeIds(nodeId, field.name);

  this.addEdge = async (node, props) => {
    const addEdgeContext = { ...context, function: 'addEdge' };
    throwOnErrors(mergeResults(
      validateEdgeNode(addEdgeContext, node),
      validateEdgeProps(addEdgeContext, props) ));

    // node can be Node, NodeObject or a string with id
    const relatedId = node.id || node;
    const id = newGlobalId(crud.EDGE_COLLECTION);
    const nodeField = field.name;
    const relatedField = field.relatedField;
    const annotatedProps = field.edgeType ?
      addTypeAnnotations(context, field.edgeType, props) :
      undefined;
    if (annotatedProps) {
      delete annotatedProps._type;
    }

    const isAdded = await crud.NodeConnection
      .addEdge(id, nodeId, nodeField, relatedId, relatedField, annotatedProps);

    if (isAdded) {
      mutation.globalIds.push(id);
      return new NodeEdge({ ...context, nodeId, relatedId });
    }
    throwOnErrors(AddEdgeFailedError({ ...context, nodeId, relatedId }));
  };

  Object.defineProperties(this, {
    nodeId: { get() { return nodeId; } },
    nodeField: { get() { return field.name; }},
    relatedField: { get() { return field.relatedField; }},
    nodeType: { get() { return field.type; } },
    edgeType: { get() { return field.edgeType; } },
  });
  Object.freeze(this);
}
