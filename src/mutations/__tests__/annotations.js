import { newGlobalId } from '../../jsutils/globalId';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  parse,
  analyzeAST
} from '../../schema';
import {
  addTypeAnnotations,
  addTypeAnnotationsToUpdateExp,
} from '../annotations';

const testDefs = `
  interface Person {
    name: String!
    age: Int!
  }
  type ProgrammingLanguage {
    name: String!
    family: String
    isStronglyTyped: Boolean
    isCompiled: Boolean
  }
  type Programmer implements Person {
    name: String!
    age: Int!
    languages: [ProgrammingLanguage]
  }
  type Carpenter implements Person {
    name: String!
    age: Int!
    tools: [String]
  }

  enum Status { COMPLETED, IN_PROGRESS, BACK_BURNER }

  interface Artifact {
    cost: Float
  }
  type ProjectArtifact implements Artifact {
    description: String
    cost: Float
  }

  union WoodWorker = Carpenter

  type Project implements Node {
    id: ID!
    name: String
    budget: Float
    status: Status
    manager: Person
    leadProgrammer: Programmer
    otherProgrammers: [Programmer]
    leadWoodWorker: WoodWorker
    otherPeople: [Person]
    artifacts: [Artifact]
  }

  type Foo implements Node {
    id: ID!
    foo: String
    bar: Int
  }

  type DeeplyNestedTypeMess {
    head: Int
    tail: [DeeplyNestedTypeMess]
  }

  interface DeeplyNestedInterfaceMess {
    head: Int
    tail: [DeeplyNestedInterfaceMess]
  }

  type DeeplyNestedImplementation implements DeeplyNestedInterfaceMess {
    head: Int
    tail: [DeeplyNestedInterfaceMess]
  }

  type DeeplyNestedMemberMess {
    head: Int
    tail: [DeeplyNestedUnionMess]
  }

  union DeeplyNestedUnionMess = DeeplyNestedMemberMess

  type Messy implements Node {
    id: ID!
    deepMess: DeeplyNestedTypeMess
    deepIntMess: DeeplyNestedInterfaceMess
    deepUnionMess: DeeplyNestedUnionMess
  }

  interface HiddenTestInterface {
    name: String
  }

  type HiddenTestType implements HiddenTestInterface {
    name: String
    woodworkers: [WoodWorker]
  }

  type HiddenTest implements Node {
    id: ID!
    hidden: HiddenTestInterface
  }
`;

const ast = parse(testDefs);
const schema = analyzeAST(ast);
const context = { schema };

describe('mutations / annotations', () => {
  it('addTypeAnnotations throws when context is not passed', () => {
    expect(addTypeAnnotations).to.throw(Error, /must pass context/);
  });
  it('addTypeAnnotations throws when typeName is not passed', () => {
    expect(addTypeAnnotations.bind(null, { }))
      .to.throw(Error, /must pass typeName/);
  });
  it('addTypeAnnotations throws when object is not passed', () => {
    expect(addTypeAnnotations.bind(null, { }, 'foo'))
      .to.throw(Error, /must pass obj/);
  });

  it('addTypeAnnotations returns object as-is if type is not in schema', () => {
    const input = {
      id: newGlobalId('Foo'),
      foo: 'Foos',
      bar: 21,
    };
    const output = addTypeAnnotations(context, 'Blah', input);
    expect(output).to.equal(input);
  });

  it('addTypeAnnotations keeps object as-is if no need for annotations', () => {
    const input = {
      id: newGlobalId('Foo'),
      foo: 'Foos',
      bar: 21,
    };
    const output = addTypeAnnotations(context, 'Foo', input);
    expect(output).to.equal(input);
  });

  it('addTypeAnnotations keeps object as-is if it has annotations', () => {
    const input = {
      id: newGlobalId('Project'),
      name: 'Make The World a Better Place',
      budget: 21.12,
      status: 'IN_PROGRESS',
      manager: {
        _type: 'Carpenter',
        name: 'JC',
        age: 33,
        tools: [ 'Hammer', 'Nail', 'Saw' ]
      },
      leadProgrammer: {
        _type: 'Programmer',
        name: 'NS',
        age: 36,
        languages: [ {
          _type: 'ProgrammingLanguage',
          name: 'ES6',
          family: 'C, JavaScript',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      },
      otherProgrammers: [],
      leadWoodWorker: {
        _type: 'Carpenter',
        name: 'MD',
        age: 44,
        tools: [ 'Drill' ]
      },
      otherPeople: [],
      artifacts: [ {
        _type: 'ProjectArtifact',
        description: 'Smart Chair',
        cost: 12345.6,
      } ],
    };
    const output = addTypeAnnotations(context, 'Project', input);
    expect(output).to.deep.equal(input);
  });

  it('addTypeAnnotations adds annotations to objs and lists of objs', () => {
    const input = {
      id: newGlobalId('Project'),
      name: 'Make The World a Better Place',
      budget: 21.12,
      status: 'IN_PROGRESS',
      manager: {
        _type: 'Carpenter',
        name: 'JC',
        age: 33,
        tools: [ 'Hammer', 'Nail', 'Saw' ]
      },
      leadProgrammer: {
        // Should add: _type: 'Programmer',
        name: 'NS',
        age: 36,
        languages: [ {
          // Should add: _type: 'ProgrammingLanguage',
          name: 'ES6',
          family: 'C, JavaScript',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      },
      otherProgrammers: [ {
        // Should add: _type: 'Programmer'
        name: 'IS',
        age: 3,
        languages: [ {
          // Should add: _type: 'ProgrammingLanguage',
          name: 'Sketch',
          family: 'Lisp',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      } ],
      leadWoodWorker: {
        // Should add: _type: 'Carpenter',
        name: 'MD',
        age: 44,
        tools: [ 'Drill' ]
      },
      otherPeople: [],
      artifacts: [ {
        // Should add: _type: 'ProjectArtifact',
        description: 'Smart Chair',
        cost: 12345.6,
      } ],
    };

    const expectedOutput = {
      id: input.id,
      name: 'Make The World a Better Place',
      budget: 21.12,
      status: 'IN_PROGRESS',
      manager: {
        _type: 'Carpenter',
        name: 'JC',
        age: 33,
        tools: [ 'Hammer', 'Nail', 'Saw' ]
      },
      leadProgrammer: {
        _type: 'Programmer',
        name: 'NS',
        age: 36,
        languages: [ {
          _type: 'ProgrammingLanguage',
          name: 'ES6',
          family: 'C, JavaScript',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      },
      otherProgrammers: [ {
        _type: 'Programmer',
        name: 'IS',
        age: 3,
        languages: [ {
          _type: 'ProgrammingLanguage',
          name: 'Sketch',
          family: 'Lisp',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      } ],
      leadWoodWorker: {
        _type: 'Carpenter',
        name: 'MD',
        age: 44,
        tools: [ 'Drill' ]
      },
      otherPeople: [ ],
      artifacts: [ {
        _type: 'ProjectArtifact',
        description: 'Smart Chair',
        cost: 12345.6,
      } ],
    };
    const output = addTypeAnnotations(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('addTypeAnnotations handles deeply nested types', () => {
    const input = {
      id: newGlobalId('Messy'),
      deepMess: {
        head: 1,
        tail: [
          { head: 11, tail: [ { head: 111 }, { head: 112 } ] },
          { head: 12, tail: [ { head: 121 }, { head: 122, tail: [ ] } ] },
          { head: 13, tail: [ { head: 131, tail: [ { head: 1311 } ] } ] },
        ]
      }
    };
    const _type = 'DeeplyNestedTypeMess';
    const expectedOutput = {
      id: input.id,
      deepMess: {
        _type,
        head: 1,
        tail: [
          {
            _type,
            head: 11,
            tail: [ { _type, head: 111 }, { _type, head: 112 } ]
          },
          {
            _type,
            head: 12,
            tail: [ { _type, head: 121 }, { _type, head: 122, tail: [ ] } ]
          },
          {
            _type,
            head: 13,
            tail: [ { _type, head: 131, tail: [ { _type, head: 1311 } ] } ]
          },
        ]
      }
    };
    const output = addTypeAnnotations(context, 'Messy', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('addTypeAnnotations handles deeply nested interfaces', () => {
    const input = {
      id: newGlobalId('Messy'),
      deepIntMess: {
        head: 1,
        tail: [
          { head: 11, tail: [ { head: 111 }, { head: 112 } ] },
          { head: 12, tail: [ { head: 121 }, { head: 122, tail: [ ] } ] },
          { head: 13, tail: [ { head: 131, tail: [ { head: 1311 } ] } ] },
        ]
      }
    };
    const _type = 'DeeplyNestedImplementation';
    const expectedOutput = {
      id: input.id,
      deepIntMess: {
        _type,
        head: 1,
        tail: [
          {
            _type,
            head: 11,
            tail: [ { _type, head: 111 }, { _type, head: 112 } ]
          },
          {
            _type,
            head: 12,
            tail: [ { _type, head: 121 }, { _type, head: 122, tail: [ ] } ]
          },
          {
            _type,
            head: 13,
            tail: [ { _type, head: 131, tail: [ { _type, head: 1311 } ] } ]
          },
        ]
      }
    };
    const output = addTypeAnnotations(context, 'Messy', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('addTypeAnnotations handles deeply nested unions', () => {
    const input = {
      id: newGlobalId('Messy'),
      deepUnionMess: {
        head: 1,
        tail: [
          { head: 11, tail: [ { head: 111 }, { head: 112 } ] },
          { head: 12, tail: [ { head: 121 }, { head: 122, tail: [ ] } ] },
          { head: 13, tail: [ { head: 131, tail: [ { head: 1311 } ] } ] },
        ]
      }
    };
    const _type = 'DeeplyNestedMemberMess';
    const expectedOutput = {
      id: input.id,
      deepUnionMess: {
        _type,
        head: 1,
        tail: [
          {
            _type,
            head: 11,
            tail: [ { _type, head: 111 }, { _type, head: 112 } ]
          },
          {
            _type,
            head: 12,
            tail: [ { _type, head: 121 }, { _type, head: 122, tail: [ ] } ]
          },
          {
            _type,
            head: 13,
            tail: [ { _type, head: 131, tail: [ { _type, head: 1311 } ] } ]
          },
        ]
      }
    };
    const output = addTypeAnnotations(context, 'Messy', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('addTypeAnnotations recurses on the fields in actual type', () => {
    const input = {
      id: newGlobalId('HiddenTest'),
      hidden: {
        name: 'Foo',
        woodworkers: [
          { name: 'JS', age: 33 },
          { name: 'NS', age: 36 },
        ]
      }
    };
    const expectedOutput = {
      id: input.id,
      hidden: {
        _type: 'HiddenTestType',
        name: 'Foo',
        woodworkers: [
          { _type: 'Carpenter', name: 'JS', age: 33 },
          { _type: 'Carpenter', name: 'NS', age: 36 },
        ]
      }
    };
    const output = addTypeAnnotations(context, 'HiddenTest', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  const fn = 'addTypeAnnotationsToUpdateExp';

  it(`${fn} throws when context is not passed`, () => {
    expect(addTypeAnnotationsToUpdateExp).to.throw(Error, /must pass context/);
  });
  it(`${fn} throws when typeName is not passed`, () => {
    expect(addTypeAnnotationsToUpdateExp.bind(null, { }))
      .to.throw(Error, /must pass typeName/);
  });
  it('addTypeAnnotationsToUpdateExp throws when object is not passed', () => {
    expect(addTypeAnnotationsToUpdateExp.bind(null, { }, 'foo'))
      .to.throw(Error, /must pass obj/);
  });

  it(`${fn} returns object as-is if type is not in schema`, () => {
    const input = {
      foo: 'Foos',
      bar: 21,
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Blah', input);
    expect(output).to.equal(input);
  });

  it(`${fn} keeps object as-is if no need for annotations`, () => {
    const input = {
      foo: 'Foos',
      bar: 21,
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Foo', input);
    expect(output).to.equal(input);
  });

  it(`${fn} keeps object as-is if it has annotations`, () => {
    const input = {
      name: 'Make The World a Better Place',
      budget: 21.12,
      status: 'IN_PROGRESS',
      manager: {
        _type: 'Carpenter',
        name: 'JC',
        age: 33,
        tools: [ 'Hammer', 'Nail', 'Saw' ]
      },
      leadProgrammer: {
        _type: 'Programmer',
        name: 'NS',
        age: 36,
        languages: [ {
          _type: 'ProgrammingLanguage',
          name: 'ES6',
          family: 'C, JavaScript',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      },
      otherProgrammers: [],
      leadWoodWorker: {
        _type: 'Carpenter',
        name: 'MD',
        age: 44,
        tools: [ 'Drill' ]
      },
      otherPeople: [],
      artifacts: [ {
        _type: 'ProjectArtifact',
        description: 'Smart Chair',
        cost: 12345.6,
      } ],
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(input);
  });


  it(`${fn} adds annotations to objs and lists of objs`, () => {
    const input = {
      name: 'Make The World a Better Place',
      budget: 21.12,
      status: 'IN_PROGRESS',
      manager: {
        _type: 'Carpenter',
        name: 'JC',
        age: 33,
        tools: [ 'Hammer', 'Nail', 'Saw' ]
      },
      leadProgrammer: {
        // Should add: _type: 'Programmer',
        name: 'NS',
        age: 36,
        languages: [ {
          // Should add: _type: 'ProgrammingLanguage',
          name: 'ES6',
          family: 'C, JavaScript',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      },
      otherProgrammers: [ {
        // Should add: _type: 'Programmer'
        name: 'IS',
        age: 3,
        languages: [ {
          // Should add: _type: 'ProgrammingLanguage',
          name: 'Sketch',
          family: 'Lisp',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      } ],
      leadWoodWorker: {
        // Should add: _type: 'Carpenter',
        name: 'MD',
        age: 44,
        tools: [ 'Drill' ]
      },
      otherPeople: [],
      artifacts: [ {
        // Should add: _type: 'ProjectArtifact',
        description: 'Smart Chair',
        cost: 12345.6,
      } ],
    };

    const expectedOutput = {
      name: 'Make The World a Better Place',
      budget: 21.12,
      status: 'IN_PROGRESS',
      manager: {
        _type: 'Carpenter',
        name: 'JC',
        age: 33,
        tools: [ 'Hammer', 'Nail', 'Saw' ]
      },
      leadProgrammer: {
        _type: 'Programmer',
        name: 'NS',
        age: 36,
        languages: [ {
          _type: 'ProgrammingLanguage',
          name: 'ES6',
          family: 'C, JavaScript',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      },
      otherProgrammers: [ {
        _type: 'Programmer',
        name: 'IS',
        age: 3,
        languages: [ {
          _type: 'ProgrammingLanguage',
          name: 'Sketch',
          family: 'Lisp',
          isStronglyTyped: false,
          isCompiled: false,
        } ],
      } ],
      leadWoodWorker: {
        _type: 'Carpenter',
        name: 'MD',
        age: 44,
        tools: [ 'Drill' ]
      },
      otherPeople: [],
      artifacts: [ {
        _type: 'ProjectArtifact',
        description: 'Smart Chair',
        cost: 12345.6,
      } ],
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles deeply nested types`, () => {
    const input = {
      deepMess: {
        head: 1,
        tail: [
          { head: 11, tail: [ { head: 111 }, { head: 112 } ] },
          { head: 12, tail: [ { head: 121 }, { head: 122, tail: [ ] } ] },
          { head: 13, tail: [ { head: 131, tail: [ { head: 1311 } ] } ] },
        ]
      }
    };
    const _type = 'DeeplyNestedTypeMess';
    const expectedOutput = {
      deepMess: {
        _type,
        head: 1,
        tail: [
          {
            _type,
            head: 11,
            tail: [ { _type, head: 111 }, { _type, head: 112 } ]
          },
          {
            _type,
            head: 12,
            tail: [ { _type, head: 121 }, { _type, head: 122, tail: [ ] } ]
          },
          {
            _type,
            head: 13,
            tail: [ { _type, head: 131, tail: [ { _type, head: 1311 } ] } ]
          },
        ]
      }
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Messy', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles deeply nested interfaces`, () => {
    const input = {
      deepIntMess: {
        head: 1,
        tail: [
          { head: 11, tail: [ { head: 111 }, { head: 112 } ] },
          { head: 12, tail: [ { head: 121 }, { head: 122, tail: [ ] } ] },
          { head: 13, tail: [ { head: 131, tail: [ { head: 1311 } ] } ] },
        ]
      }
    };
    const _type = 'DeeplyNestedImplementation';
    const expectedOutput = {
      deepIntMess: {
        _type,
        head: 1,
        tail: [
          {
            _type,
            head: 11,
            tail: [ { _type, head: 111 }, { _type, head: 112 } ]
          },
          {
            _type,
            head: 12,
            tail: [ { _type, head: 121 }, { _type, head: 122, tail: [ ] } ]
          },
          {
            _type,
            head: 13,
            tail: [ { _type, head: 131, tail: [ { _type, head: 1311 } ] } ]
          },
        ]
      }
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Messy', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles deeply nested unions`, () => {
    const input = {
      deepUnionMess: {
        head: 1,
        tail: [
          { head: 11, tail: [ { head: 111 }, { head: 112 } ] },
          { head: 12, tail: [ { head: 121 }, { head: 122, tail: [ ] } ] },
          { head: 13, tail: [ { head: 131, tail: [ { head: 1311 } ] } ] },
        ]
      }
    };
    const _type = 'DeeplyNestedMemberMess';
    const expectedOutput = {
      deepUnionMess: {
        _type,
        head: 1,
        tail: [
          {
            _type,
            head: 11,
            tail: [ { _type, head: 111 }, { _type, head: 112 } ]
          },
          {
            _type,
            head: 12,
            tail: [ { _type, head: 121 }, { _type, head: 122, tail: [ ] } ]
          },
          {
            _type,
            head: 13,
            tail: [ { _type, head: 131, tail: [ { _type, head: 1311 } ] } ]
          },
        ]
      }
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Messy', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} recurses on the fields in actual type`, () => {
    const input = {
      hidden: {
        name: 'Foo',
        woodworkers: [
          { name: 'JS', age: 33 },
          { name: 'NS', age: 36 },
        ]
      }
    };
    const expectedOutput = {
      hidden: {
        _type: 'HiddenTestType',
        name: 'Foo',
        woodworkers: [
          { _type: 'Carpenter', name: 'JS', age: 33 },
          { _type: 'Carpenter', name: 'NS', age: 36 },
        ]
      }
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'HiddenTest', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles insert with single object`, () => {
    const input = {
      otherProgrammers: {
        insert: {
          // Should add: _type: 'Programmer'
          name: 'IS',
          age: 3,
          languages: [ {
            // Should add: _type: 'ProgrammingLanguage',
            name: 'Sketch',
            family: 'Lisp',
            isStronglyTyped: false,
            isCompiled: false,
          } ],
        },
        ascending: 'name',
      },
      name: 'Foobar!',
    };
    const expectedOutput = {
      otherProgrammers: {
        insert: {
          _type: 'Programmer',
          name: 'IS',
          age: 3,
          languages: [ {
            _type: 'ProgrammingLanguage',
            name: 'Sketch',
            family: 'Lisp',
            isStronglyTyped: false,
            isCompiled: false,
          } ],
        },
        ascending: 'name',
      },
      name: 'Foobar!',
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles insert on a nested object`, () => {
    const input = {
      leadProgrammer: {
        // should add _type: 'Programmer',
        languages: {
          insert: {
            // should add _type: 'ProgrammingLanguage',
            name: 'C++',
            family: 'C',
            isStronglyTyped: true,
            isCompiled: true,
          },
          at: 0,
          keepFirst: 10,
        }
      },
      name: 'Foobar!',
    };
    const expectedOutput = {
      leadProgrammer: {
        _type: 'Programmer',
        languages: {
          insert: {
            _type: 'ProgrammingLanguage',
            name: 'C++',
            family: 'C',
            isStronglyTyped: true,
            isCompiled: true,
          },
          at: 0,
          keepFirst: 10,
        }
      },
      name: 'Foobar!',
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles insert with object list`, () => {
    const input = {
      otherProgrammers: {
        insert: [
          {
            // Should add: _type: 'Programmer'
            name: 'IS',
            age: 3,
            languages: [ {
              // Should add: _type: 'ProgrammingLanguage',
              name: 'Sketch',
              family: 'Lisp',
              isStronglyTyped: false,
              isCompiled: false,
            } ],
          },
          {
            // Should add: _type: 'Programmer'
            name: 'XY',
            age: 22,
            languages: [ {
              // Should add: _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            } ],
          },
        ],
        ascending: 'name',
      },
      name: 'Foobar!',
    };
    const expectedOutput = {
      otherProgrammers: {
        insert: [
          {
            _type: 'Programmer',
            name: 'IS',
            age: 3,
            languages: [ {
              _type: 'ProgrammingLanguage',
              name: 'Sketch',
              family: 'Lisp',
              isStronglyTyped: false,
              isCompiled: false,
            } ],
          },
          {
            _type: 'Programmer',
            name: 'XY',
            age: 22,
            languages: [ {
              _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            } ],
          },
        ],
        ascending: 'name',
      },
      name: 'Foobar!',
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles insert with object list on a nested object`, () => {
    const input = {
      leadProgrammer: {
        // should add _type: 'Programmer',
        languages: {
          insert: [
            {
              // should add _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
            {
              // should add _type: 'ProgrammingLanguage',
              name: 'Java',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
          ],
          at: 0,
          keepFirst: 10,
        }
      },
      name: 'Foobar!',
    };
    const expectedOutput = {
      leadProgrammer: {
        _type: 'Programmer',
        languages: {
          insert: [
            {
              _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
            {
              _type: 'ProgrammingLanguage',
              name: 'Java',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
          ],
          at: 0,
          keepFirst: 10,
        }
      },
      name: 'Foobar!',
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles delete`, () => {
    const input = {
      otherProgrammers: {
        delete: [
          {
            // Should add: _type: 'Programmer'
            name: 'IS',
            age: 3,
            languages: [ {
              // Should add: _type: 'ProgrammingLanguage',
              name: 'Sketch',
              family: 'Lisp',
              isStronglyTyped: false,
              isCompiled: false,
            } ],
          },
          {
            // Should add: _type: 'Programmer'
            name: 'XY',
            age: 22,
            languages: [ {
              // Should add: _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            } ],
          },
        ]
      },
      name: 'Foobar!',
    };
    const expectedOutput = {
      otherProgrammers: {
        delete: [
          {
            _type: 'Programmer',
            name: 'IS',
            age: 3,
            languages: [ {
              _type: 'ProgrammingLanguage',
              name: 'Sketch',
              family: 'Lisp',
              isStronglyTyped: false,
              isCompiled: false,
            } ],
          },
          {
            _type: 'Programmer',
            name: 'XY',
            age: 22,
            languages: [ {
              _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            } ],
          },
        ]
      },
      name: 'Foobar!',
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it(`${fn} handles delete on a nested object`, () => {
    const input = {
      leadProgrammer: {
        // should add _type: 'Programmer',
        languages: {
          delete: [
            {
              // should add _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
            {
              // should add _type: 'ProgrammingLanguage',
              name: 'Java',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
          ]
        }
      },
      name: 'Foobar!',
    };
    const expectedOutput = {
      leadProgrammer: {
        _type: 'Programmer',
        languages: {
          delete: [
            {
              _type: 'ProgrammingLanguage',
              name: 'C++',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
            {
              _type: 'ProgrammingLanguage',
              name: 'Java',
              family: 'C',
              isStronglyTyped: true,
              isCompiled: true,
            },
          ]
        }
      },
      name: 'Foobar!',
    };
    const output = addTypeAnnotationsToUpdateExp(context, 'Project', input);
    expect(output).to.deep.equal(expectedOutput);
  });

});
