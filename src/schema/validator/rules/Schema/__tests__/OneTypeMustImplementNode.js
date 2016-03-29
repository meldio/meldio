import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

describe('Schema Validation: Schema / OneTypeMustImplementNode: ', () => {
  it('At least one type must implement Node interface', () => {
    const test = ` type SentanceCase { id: ID! } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/must implement Node interface/);
  });
});
