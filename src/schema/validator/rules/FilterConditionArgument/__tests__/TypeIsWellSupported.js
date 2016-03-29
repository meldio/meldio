import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { TypeIsWellSupported as rule } from '../TypeIsWellSupported';

const defs = `
  enum Enum { ONE, TWO, THREE }
  input Test { one: String }

  type User implements Node {
    id: ID!
    todos: NodeConnection(Todo, users)
  }

  type Todo implements Node {
    id: ID!
    text: String
    complete: Boolean
    users: NodeConnection(User, todos)
  }
`;

describe('Schema Validation: FilterConditionArgument / TypeIsWellSupported: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it(`Filter is okay with well-supported scalar and enum arguments`, () => {
    const test = `
      filter on NodeConnection(Todo) {
        INT: (intStatus: Int) { node: { complete: { eq: $intStatus } } }
        FLOAT: (floatStatus: Float) { node: { complete: { eq: $floatStatus } } }
        STR: (strStatus: String) { node: { complete: { eq: $strStatus } } }
        BOOL: (boolStatus: Boolean) { node: { complete: { eq: $boolStatus } } }
        ID: (idStatus: ID) { node: { complete: { eq: $idStatus } } }
        ENUM: (eStatus: Enum) { node: { complete: { eq: $eStatus } } }
      }
      ${defs}`;

    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it(`Warning if filter has an argument that is not well supported`, () => {
    const test = `
      filter on NodeConnection(Todo) {
        ARG_1: (arg1: [Int]) { node: { complete: { eq: $arg1 } } }
        ARG_2: (arg2: Test) { node: { complete: { eq: $arg2 } } }
        ARG_3: (arg3: [Test]) { node: { complete: { eq: $arg3 } } }
        ARG_4: (arg4: [ID]) { node: { complete: { eq: $arg4 } } }
      }
      ${defs}`;

    const result = runTest(test);
    const { errors, warnings } = separateResults(result);
    expect(errors).to.have.length(0);
    expect(warnings).to.have.length(4);
    expect(warnings).to.deep.match(/type that is not well supported by Relay/);
  });
});
