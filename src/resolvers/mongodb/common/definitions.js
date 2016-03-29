
export const EDGE_COLLECTION = '_Edge';
export const AUTH_PROVIDER_COLLECTION = '_AuthProvider';

export const MAJORITY_READ_OPTIONS = {
  readConcern: { level: 'majority' }
};

export const LOCAL_READ_OPTIONS = {
  readConcern: { level: 'local' }
};

export const DEFAULT_WRITE_OPTIONS = {
  writeConcern: { w: 'majority', j: true }
};
