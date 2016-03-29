import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { TypeIsValid as rule } from '../TypeIsValid';

const defs = `
  type TokenNodeDef implements Node { id: ID! }
  enum Enum { ONE, TWO, THREE }
  type EdgeProps { distance: [Float] }
  type Obj { cost: [Float] }
`;


describe('Schema Validation: Order / TypeMustBeDefined: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Order cannot reference an object connection without scalars', () => {
    const test = `
      order on ObjectConnection(Obj) { }
      order on ObjectConnection(Obj, EdgeProps) { }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(2);
    expect(errors).to.deep.match(
      /Order cannot be defined on ObjectConnection\(Obj\)/);
    expect(errors).to.deep.match(
      /Order cannot be defined on ObjectConnection\(Obj, EdgeProps\)/);
  });

  it('Order cannot reference a list of scalars or list of obj without scalars',
  () => {
    const test = `
      order on [Obj] { }
      order on [String] { }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(2);
    expect(errors).to.deep.match(/Order cannot be defined on \[Obj\]/);
    expect(errors).to.deep.match(/Order cannot be defined on \[String\]/);
  });
});
