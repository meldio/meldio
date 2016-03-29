import invariant from '../jsutils/invariant';
import { typeFromGlobalId } from '../jsutils/globalId';
import { validateEdgeUpdate, throwOnErrors } from './validator';
import { NodeObject } from './NodeObject';
import { NodeEdge } from './NodeEdge';
import { addTypeAnnotationsToUpdateExp } from './annotations';

export function NodeEdgeObject(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to NodeEdgeObject.');
  const { schema, crud, nodeId, field, relatedId, data } = context;
  invariant(schema, 'Must pass schema to NodeEdgeObject context.');
  invariant(crud, 'Must pass crud resolvers to NodeEdgeObject context.');
  invariant(nodeId, 'Must pass nodeId to NodeEdgeObject context.');
  invariant(field, 'Must pass field object to NodeEdgeObject context.');
  invariant(field.isNodeConnection,
    'Must pass NodeConnection field object to NodeEdgeObject context.');
  invariant(relatedId, 'Must pass relatedId to NodeEdgeObject context.');
  invariant(data, 'Must pass data to NodeEdge NodeEdgeObject.');

  if ( !(this instanceof NodeEdgeObject) ) {
    return new NodeEdgeObject(context);
  }

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

    if (isUpdated) {
      const nodeEdgeContext = { ...context };
      delete nodeEdgeContext.data;
      return new NodeEdge(nodeEdgeContext);
    }
    return null;
  };

  const edgeFields =
    field.edgeType ?
      schema[field.edgeType]
        .fields
        .map(f => ({
          [f.name]: {
            get() {
              return data[f.name] !== undefined ? data[f.name] : null;
            }
          } }))
        .reduce( (acc, edgeField) => ({ ...acc, ...edgeField }), { }) :
      { };

  Object.defineProperties(this, {
    type: { get() {
      return {
        edgeType: field.edgeType,
        nodeType: field.type,
        type: typeFromGlobalId(data.node.id)
      };
    } },
    ...edgeFields,
    node: {
      get() {
        const nodeObjectContext = {
          ...context,
          type: typeFromGlobalId(data.node.id),
          data: data.node
        };
        delete nodeObjectContext.field;
        delete nodeObjectContext.nodeId;
        delete nodeObjectContext.relatedId;
        return new NodeObject(nodeObjectContext);
      }
    },
  });
  Object.freeze(this);
}
