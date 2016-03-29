import invariant from '../../jsutils/invariant';
import strip from '../../jsutils/strip';
import isNullish from '../../jsutils/isNullish';
import { Node } from '../Node';
import { NodeObject } from '../NodeObject';
import { validateEdgeNodeId } from './validateEdgeNodeId';

// node can be Node, NodeObject or a string with id
export function validateEdgeNode(context, node) {
  invariant(context, 'must pass context to validateEdgeNode.');
  invariant(
    context.function &&
    context.field &&
    context.field.type &&
    context.schema &&
    context.schema[context.field.type] && (
      context.schema[context.field.type].kind === 'type' ||
      context.schema[context.field.type].kind === 'interface' ||
      context.schema[context.field.type].kind === 'union'
    ), 'must pass correct context to validateEdgeNode.');

  const { function: func, schema, field: { type: typeName } } = context;
  const type = schema[typeName];

  const validateType = givenTypeName =>
    type.kind === 'type' && givenTypeName !== typeName ?
      [ strip`Node or NodeObject passed to ${func} must be of type
             ~ "${typeName}".` ] :
    type.kind === 'interface' && !type.implementations.includes(givenTypeName) ?
      [ strip`Node or NodeObject passed to ${func} must be implementation of
             ~ "${typeName}" interface.` ] :
    type.kind === 'union' && !type.typeNames.includes(givenTypeName) ?
      [ strip`Node or NodeObject passed to ${func} must be member of
             ~ "${typeName}" union.` ] :
    [ ];

  const results =
    isNullish(node) ?
      [ `Must pass node to ${func}.` ] :
    node instanceof Node || node instanceof NodeObject ?
      validateType(node.type) :
    typeof node === 'string' ?
      validateEdgeNodeId(context, node).results :
    [ `Must pass a node id or an instance of Node or NodeObject to ${func}.` ];

  return { context, results };
}
