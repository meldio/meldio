import invariant from '../jsutils/invariant';
import { validateUpdate, throwOnErrors } from './validator';
import { NodeObject } from './NodeObject';
import { addTypeAnnotationsToUpdateExp } from './annotations';

export function Nodes(context) {
  invariant(context && typeof context === 'object',
    'Must pass context to Nodes.');
  const { schema, crud, type, filter } = context;
  invariant(schema, 'Must pass schema to Nodes context.');
  invariant(crud, 'Must pass crud resolvers to Nodes context.');
  invariant(schema[type] && schema[type].kind === 'type',
    'Must pass a valid type name to Nodes context.');
  invariant(schema[type].implementsNode,
    'Must pass a type that implements Nodes to Node context.');
  invariant(filter, 'Must pass filter to Nodes context.');

  // filter can be either array of globalIds or filtering expression.

  if ( !(this instanceof Nodes) ) {
    return new Nodes(context);
  }

  this.list = async () => {
    const nodeObjectContext = { ...context };
    delete nodeObjectContext.filter;

    return ( await crud.listNodes(type, filter) )
      .map(data => new NodeObject({ ...nodeObjectContext, data }));
  };

  this.delete = async () => crud.deleteNodes(type, filter);

  this.update = async update => {
    throwOnErrors(validateUpdate({...context, function: 'update'}, update));

    const typeAnnotatedUpdate = addTypeAnnotationsToUpdateExp(
      context,
      type,
      update);

    const ids = await crud.updateNodes(type, filter, typeAnnotatedUpdate);
    return new Nodes({ ...context, filter: ids });
  };

  Object.defineProperties(this, {
    type: { get() { return type; } },
    filter: { get() { return filter; } }
  });
  Object.freeze(this);
}
