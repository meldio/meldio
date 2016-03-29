import strip from '../../../jsutils/strip';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { throwOnErrors } from '../throwOnErrors';

const context = {
  mutation: {
    name: 'mutationName',
    clientMutationId: 'clientId',
  }
};

const hookContext = {
  mutation: {
    name: 'hookName',
    isHook: true,
  }
};

const permissionContext = {
  mutation: {
    name: 'permissionName',
    isPermission: true,
  }
};

describe('mutations / validator / throwOnErrors', () => {
  it('throwOnErrors does not throw when results are null or empty', () => {
    let call = throwOnErrors.bind(null, { context });
    expect(call).to.not.throw();

    call = throwOnErrors.bind(null, { context, results: [ ] });
    expect(call).to.not.throw();
  });

  it('throwOnErrors does throw when results are not empty', () => {
    const results = [ 'one', 'two', 'three' ];
    const expected =
      strip`Mutation "mutationName" with id "clientId" failed:
           |1. one
           |2. two
           |3. three`;

    expect(() => throwOnErrors({ context, results }))
      .to.throw(Error, expected);
  });

  it('throwOnErrors does throw for hook when results are not empty', () => {
    const results = [ 'one', 'two', 'three' ];
    const expected =
      strip`Hook "hookName" failed:
           |1. one
           |2. two
           |3. three`;

    expect(() => throwOnErrors({ context: hookContext, results }))
      .to.throw(Error, expected);
  });

  it('throwOnErrors does throw for permission when results are not empty',
  () => {
    const results = [ 'one', 'two', 'three' ];
    const expected =
      strip`Permission function "permissionName" failed:
           |1. one
           |2. two
           |3. three`;

    expect(() => throwOnErrors({ context: permissionContext, results }))
      .to.throw(Error, expected);
  });
});
