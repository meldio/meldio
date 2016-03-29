import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  unionedTypes
} from '../../../__tests__/setup';

import { NameInSentenceCase as rule } from '../NameInSentenceCase';

describe('Schema Validation: Union / NameInSentenceCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Union name SentanceCase is okay', () => {
    const test = ` ${unionedTypes}
      union SentanceCase = Foo | Bar ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(0);
  });

  it('Union name camelCase gives a warning', () => {
    const test = ` ${unionedTypes}
      union camelCase = Foo | Bar ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

  it('Union name Underscore_ gives a warning', () => {
    const test = ` ${unionedTypes}
      union Underscore_ = Foo | Bar ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

  it('Union name Mid_Underscore gives a warning', () => {
    const test = ` ${unionedTypes}
      union Mid_Underscore = Foo | Bar ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

});
