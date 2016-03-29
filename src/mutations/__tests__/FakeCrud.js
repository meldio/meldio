
export const /* istanbul ignore next */ FakeCrud = () => ({
  EDGE_COLLECTION: '_Edge',
  AUTH_PROVIDER_COLLECTION: '_AuthProvider',

  async startMutation() {
    throw new Error('Unexpected invocation from fake crud: startMutation');
  },

  async finishMutation() {
    throw new Error('Unexpected invocation from fake crud: finishMutation');
  },

  async abortMutation() {
    throw new Error('Unexpected invocation from fake crud: abortMutation');
  },

  /* type, node => boolean */
  async addNode() {
    throw new Error('Unexpected invocation from fake crud: addNode');
  },

  /* type, id => boolean */
  async existsNode() {
    throw new Error('Unexpected invocation from fake crud: existsNode');
  },

  /* type, id => { node object } or null */
  async getNode() {
    throw new Error('Unexpected invocation from fake crud: getNode');
  },

  /* type, id => boolean */
  async deleteNode() {
    throw new Error('Unexpected invocation from fake crud: deleteNode');
  },

  /* type, id, update => boolean */
  async updateNode() {
    throw new Error('Unexpected invocation from fake crud: updateNode');
  },

  /* type, filter => [ IDs ] */
  async deleteNodes() {
    throw new Error('Unexpected invocation from fake crud: deleteNodes');
  },

  /* type, filter, update => [ IDs ] */
  async updateNodes() {
    throw new Error('Unexpected invocation from fake crud: updateNodes');
  },

  /* type, filter => [ nodes ] */
  async listNodes() {
    throw new Error('Unexpected invocation from fake crud: listNodes');
  },

  NodeConnection: {
    /* nodeId, nodeField => [ Node IDs ] */
    async listRelatedNodeIds() {
      throw new Error(
        'Unexpected invocation from fake crud: listRelatedNodeIds');
    },

    /* id, nodeId, nodeField, relatedId, relatedField, edgeProps => boolean */
    async addEdge() {
      throw new Error('Unexpected invocation from fake crud: addEdge');
    },

    /* nodeId, nodeField, relatedId, relatedField => boolean */
    async existsEdge() {
      throw new Error('Unexpected invocation from fake crud: existsEdge');
    },

    /* nodeId, nodeField, relatedId, relatedField => EdgeObj or null */
    async getEdge() {
      throw new Error('Unexpected invocation from fake crud: getEdge');
    },

    /* nodeId, nodeField, relatedId, relatedField => boolean */
    async deleteEdge() {
      throw new Error('Unexpected invocation from fake crud: deleteEdge');
    },

    /* nodeId,nodeField,relatedId,relatedField,nodeType,edgeType,update=>bool */
    async updateEdge() {
      throw new Error('Unexpected invocation from fake crud: updateEdge');
    },

    /* nodeId, nodeField, nodeType, edgeType, filter => [ EdgeObj ] */
    async listEdges() {
      throw new Error('Unexpected invocation from fake crud: listEdges');
    },

    /* nodeId, nodeField, nodeType, edgeType, filter => [ Node IDs ] */
    async deleteEdges() {
      throw new Error('Unexpected invocation from fake crud: deleteEdges');
    },

    /* nodeId, nodeField, nodeType, edgeType, filter, update => [ Node IDs] */
    async updateEdges() {
      throw new Error('Unexpected invocation from fake crud: updateEdges');
    }
  }
});
