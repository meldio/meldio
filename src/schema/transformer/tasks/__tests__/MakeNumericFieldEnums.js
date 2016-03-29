import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakeNumericFieldEnums: ', () => {
  it('Creates basic enum definitions', () => {
    const result = runTest(`
      interface Location {
        long: Float
        lat: Float
        altitude: Int
        visitors: NodeConnection(Visitor, visited, EdgeProps)
      }
      type EdgeProps {
        date: String
        travelDistance: Float
        cost: Int
      }
      type City implements Node, Location {
        id: ID!
        name: String
        long: Float
        lat: Float
        altitude: Int
        visitors: NodeConnection(Visitor, visited, EdgeProps)
      }
      type Visitor implements Node {
        id: ID!
        name: String
        visited: NodeConnection(Location, visitors, EdgeProps)
        luggage: ObjectConnection(Luggage)
      }
      type Luggage {
        identifier: String
        numberOfPieces: Int
        weight: Float
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |enum _EdgeProps_NumericFields {
        |  travelDistance
        |  cost
        |}`).and
      .to.contain(stripMargin`
        |enum _Location_NumericFields {
        |  long
        |  lat
        |  altitude
        |}`).and
      .to.contain(stripMargin`
        |enum _Luggage_NumericFields {
        |  numberOfPieces
        |  weight
        |}`);
  });
});
