import { Node } from './Node';
import { NodeEdge } from './NodeEdge';
import { Nodes } from './Nodes';
import { NodeEdges } from './NodeEdges';

export async function processMutationResults(results) {
  const processedResults = await Promise.all(
    Object.keys(results)
      .map(async key =>
        results[key] instanceof Node || results[key] instanceof NodeEdge ?
          { [key]: await results[key].get() } :
        results[key] instanceof Nodes || results[key] instanceof NodeEdges ?
          { [key]: await results[key].list() } :
          { [key]: results[key] } ));

  return processedResults
    .reduce( (acc, result) => ({ ...acc, ...result }), { } );
}
