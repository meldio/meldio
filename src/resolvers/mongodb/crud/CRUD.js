import invariant from '../../../jsutils/invariant';
import { typeFromGlobalId } from '../../../jsutils/globalId';
import {
  Filters,
  Updates,
  EDGE_COLLECTION,
  AUTH_PROVIDER_COLLECTION,
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
  DEFAULT_WRITE_OPTIONS,
} from '../common';

export function CRUD(context) {
  const { db, schema, config } = context;
  invariant(schema, 'Must pass schema to CRUD context.');
  invariant(db, 'Must pass database connection to CRUD context.');
  invariant(config, 'Must pass config to CRUD context.');

  const { objectFilter } = Filters({ schema });
  const { updateNode, updateObject } = Updates({ schema });

  const hasEdgeFilter = filter =>
    Object.keys(filter)
      .filter(key => key !== 'node')
      .length !== 0;

  const filterTransformer = (type, filter) =>
    ({ $and: [ ...objectFilter(filter, type, ''), { } ] });

  const updateTransformer = (type, update) =>
    updateNode(update, type, '');

  const nodeEdgeFilterTransformer = (nodeType, edgeType, filter) => ({
    $and: [
      ...filter.node ?
        objectFilter(filter.node, nodeType, 'node') :
        [ ],
      ...hasEdgeFilter(filter) ?
        objectFilter(filter, edgeType, 'edgeProps') :
        [ ],
      { }
    ] });
  const nodeEdgeUpdateTransformer = (edgeType, update) =>
    updateObject(update, edgeType, 'edgeProps');

  const readOptions = config.committedReads ?
    MAJORITY_READ_OPTIONS :
    LOCAL_READ_OPTIONS;
  const writeOptions = DEFAULT_WRITE_OPTIONS;

  const mongoToNodeId = mongoObject => {
    const node = { id: mongoObject._id, ...mongoObject };
    delete node._id;
    return node;
  };

  const nodeToMongoId = node => {
    const mongoObject = { _id: node.id, ...node };
    delete mongoObject.id;
    return mongoObject;
  };

  const filteredIds = async (type, mongoFilter) =>
    db.collection(type, readOptions)
      .find(mongoFilter, { _id: true })
      .map(doc => doc._id)
      .toArray();

  const edgesAggregationStages =
    (nodeId, nodeField, nodeType, edgeType, filter) => {
      const typeNames =
        schema[nodeType].kind === 'type' ?
          [ nodeType ] :
        schema[nodeType].kind === 'union' ?
          schema[nodeType].typeNames :
        schema[nodeType].kind === 'interface' ?
          schema[nodeType].implementations :
          [ ];
      return [
        {
          $match:
            { $or: [ { nodeId, nodeField },
                     { relatedId: nodeId, relatedField: nodeField } ] }
        },
        {
          $project: {
            edgeProps: true,
            joinId: { $cond: {
              if: { $eq: [ '$nodeId', nodeId ] },
              then: '$relatedId',
              else: '$nodeId' } } }
        },
        ...typeNames.map(typeName => ({
          $lookup: {
            from: typeName,
            localField: 'joinId',
            foreignField: '_id',
            as: typeName
          }}) ),
        {
          $project: {
            _id: false,
            edgeProps: true,
            node: {
              $arrayElemAt:
                [ { $concatArrays: typeNames.map(tn => '$' + tn) }, 0 ]
            }
          }
        },
        {
          $match: {
            $and: [
              { node: { $ne: null } },
              Array.isArray(filter) ?
                { 'node._id': { $in: filter } } :
                nodeEdgeFilterTransformer(nodeType, edgeType, filter)
            ]
          }
        }
      ];
    };


  // preserve edge invariant that nodeId < relatedId
  const edgeInvariant = edge =>
    edge.nodeId < edge.relatedId ?
      edge :
      {
        ...edge,
        nodeId: edge.relatedId,
        nodeField: edge.relatedField,
        relatedId: edge.nodeId,
        relatedField: edge.nodeField
      };

  return {
    EDGE_COLLECTION,
    AUTH_PROVIDER_COLLECTION,

    async startMutation() {
      // nothing to see here for MongoDB, but could be used to
      // begin transaction
    },

    async finishMutation() {
      // nothing to see here for MongoDB, but could be used to
      // commit transaction
    },

    async abortMutation() {
      // nothing to see here for MongoDB, but could be used to
      // rollback transaction
    },

    async addNode(type, node) {
      invariant(node, 'Must pass node to addNode resolver.');
      invariant(node.id, 'Must pass node with an id to addNode resolver.');

      const object = nodeToMongoId(node);
      const result = await db.collection(type).insertOne(object, writeOptions);

      return result.insertedId === node.id;
    },

    async existsNode(type, id) {
      const count = await db
        .collection(type, readOptions)
        .find({ _id: id }, { _id: true })
        .count();

      return count !== 0;
    },

    async getNode(type, id) {
      const result = await db
        .collection(type, readOptions)
        .find({ _id: id })
        .map(mongoToNodeId)
        .toArray();

      if (result.length) {
        return result[0];
      }
      return null;
    },

    async deleteNode(type, id) {
      const result = await db
        .collection(type)
        .deleteOne({ _id: id }, writeOptions);

      if (result.deletedCount === 1) {
        // delete related edges
        await db
          .collection(EDGE_COLLECTION)
          .deleteMany(
            { $or: [ { nodeId: id }, { relatedId: id } ] },
            writeOptions);
      }
      return result.deletedCount === 1;
    },

    async updateNode(type, id, update) {
      const mongoUpdate = updateTransformer(type, update);

      const result = await db
        .collection(type)
        .updateOne({ _id: id }, mongoUpdate, writeOptions);

      return result.result &&
             result.result.ok === 1 &&
             result.matchedCount === 1;
    },

    async deleteNodes(type, filter) {
      const ids = Array.isArray(filter) ?
        filter :
        await filteredIds(type, filterTransformer(type, filter));

      const result = await db
        .collection(type)
        .deleteMany({ _id: { $in: ids } }, writeOptions);

      if (result.deletedCount) {
        await db
          .collection(EDGE_COLLECTION)
          .deleteMany(
            { $or: [ { nodeId: { $in: ids } },
                     { relatedId: { $in: ids } } ] }, writeOptions);
      }

      return ids;
    },

    async updateNodes(type, filter, update) {
      const ids = Array.isArray(filter) ?
        filter :
        await filteredIds(type, filterTransformer(type, filter));
      const mongoUpdate = updateTransformer(type, update);

      await db
        .collection(type)
        .updateMany({ _id: { $in: ids } }, mongoUpdate, writeOptions);

      return ids;
    },

    async listNodes(type, filter) {
      const collection = db.collection(type, readOptions);
      const mongoFilter = Array.isArray(filter) ?
        { _id: { $in: filter } } :
        filterTransformer(type, filter);

      return collection.find(mongoFilter).map(mongoToNodeId).toArray();
    },

    NodeConnection: {
      async listRelatedNodeIds(nodeId, nodeField) {
        return db
          .collection(EDGE_COLLECTION, readOptions)
          .aggregate([
            {$match:
              { $or: [ { nodeId, nodeField },
                       { relatedId: nodeId, relatedField: nodeField } ] } },
            {$project: {
              _id: false,
              relatedNodeId: { $cond: {
                if: { $eq: [ '$nodeId', nodeId ] },
                then: '$relatedId',
                else: '$nodeId' } } } } ])
          .map(doc => doc.relatedNodeId)
          .toArray();
      },

      async addEdge(id, nodeId, nodeField, relatedId, relatedField, edgeProps) {
        const result = await db
          .collection(EDGE_COLLECTION)
          .insertOne(
            edgeInvariant({
              _id: id,
              nodeId,
              nodeField,
              relatedId,
              relatedField,
              edgeProps: edgeProps || { },
            }), writeOptions);

        return result.insertedId === id;
      },

      async existsEdge(nodeId, nodeField, relatedId, relatedField) {
        const count = await db
          .collection(EDGE_COLLECTION, readOptions)
          .find(
            edgeInvariant({ nodeId, nodeField, relatedId, relatedField }),
            { _id: true })
          .count();

        return count !== 0;
      },

      async getEdge(nodeId, nodeField, relatedId, relatedField) {
        const edgeResult = await db
          .collection(EDGE_COLLECTION, readOptions)
          .find(
            edgeInvariant({ nodeId, nodeField, relatedId, relatedField }),
            { _id: true, edgeProps: true })
          .toArray();

        if (edgeResult.length) {
          const type = typeFromGlobalId(relatedId);
          const edgeProps = edgeResult[0].edgeProps || { };

          const nodeResult = await db
            .collection(type, readOptions)
            .find({ _id: relatedId })
            .toArray();

          if (nodeResult.length) {
            const node = mongoToNodeId(nodeResult[0]);
            return { ...edgeProps, node };
          }
          return null;
        }
        return null;
      },

      async deleteEdge(nodeId, nodeField, relatedId, relatedField) {
        const result = await db
          .collection(EDGE_COLLECTION)
          .deleteOne(
            edgeInvariant({ nodeId, nodeField, relatedId, relatedField }),
            writeOptions);

        return result.deletedCount !== 0;
      },

      async updateEdge(
        nodeId,
        nodeField,
        relatedId,
        relatedField,
        nodeType,
        edgeType,
        update
      ) {
        const mongoUpdate = nodeEdgeUpdateTransformer(edgeType, update);

        const result = await db
          .collection(EDGE_COLLECTION)
          .updateOne(
            edgeInvariant({ nodeId, nodeField, relatedId, relatedField }),
            mongoUpdate,
            writeOptions);

        return result.result.ok === 1;
      },

      async listEdges(nodeId, nodeField, nodeType, edgeType, filter) {
        const stages =
          edgesAggregationStages(nodeId, nodeField, nodeType, edgeType, filter);

        return db
          .collection(EDGE_COLLECTION, readOptions)
          .aggregate(stages)
          .map(edge => {
            edge.node.id = edge.node._id;
            delete edge.node._id;
            return {
              ...edge.edgeProps || { },
              node: edge.node,
            };
          })
          .toArray();
      },

      async deleteEdges(nodeId, nodeField, nodeType, edgeType, filter) {
        const ids = Array.isArray(filter) ?
          filter :
          await db
            .collection(EDGE_COLLECTION, readOptions)
            .aggregate(edgesAggregationStages(
              nodeId, nodeField, nodeType, edgeType, filter))
            .map(edge => edge.node._id)
            .toArray();

        const result = await db
          .collection(EDGE_COLLECTION)
          .deleteMany({
            $or: [
                {nodeId, nodeField, relatedId: {$in: ids}},
                {relatedId: nodeId, relatedField: nodeField, nodeId: {$in: ids}}
            ] }, writeOptions);

        if (result.deletedCount) {
          await db
            .collection(EDGE_COLLECTION)
            .deleteMany(
              { $or: [ { nodeId: { $in: ids } },
                       { relatedId: { $in: ids } } ] }, writeOptions);
        }

        return ids;
      },

      async updateEdges(nodeId, nodeField, nodeType, edgeType, filter, update) {
        const ids = Array.isArray(filter) ?
          filter :
          await db
            .collection(EDGE_COLLECTION, readOptions)
            .aggregate(edgesAggregationStages(
              nodeId, nodeField, nodeType, edgeType, filter))
            .map(edge => edge.node._id)
            .toArray();
        const mongoUpdate = nodeEdgeUpdateTransformer(edgeType, update);

        await db
          .collection(EDGE_COLLECTION)
          .updateMany({
            $or: [
                {nodeId, nodeField, relatedId: {$in: ids}},
                {relatedId: nodeId, relatedField: nodeField, nodeId: {$in: ids}}
            ] }, mongoUpdate, writeOptions);

        return ids;
      }
    }
  };
}
