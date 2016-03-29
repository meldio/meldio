import { expect } from 'chai';
import { describe, it } from 'mocha';
import { transformAST } from '../transformAST';

describe('AST Transformer', () => {
  it('Throws when ast is not passed', () => {
    expect(transformAST)
      .to.throw(Error, /must pass ast and schema metadata/);
  });

  it('Throws when schemaDescription is not passed', () => {
    expect(transformAST.bind(this, {}))
      .to.throw(Error, /must pass ast and schema metadata/);
  });
});
