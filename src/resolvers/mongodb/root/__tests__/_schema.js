export const schema = `
  enum Review { A B C }
  enum Month { JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC }

  type MaintenanceRecord {
    description: String
    partsReplaced: [String]
  }

  type DateInfo {
    month: Month
    day: Int
    year: Int
  }

  interface Person {
    name: String!
    email: String!
    birthDate: DateInfo
  }

  type Employee implements Node, Person
    @rootConnection(field: "allEmployees") {
    id: ID!
    name: String!
    email: String!  @rootPluralId(field: "employeeByEmail")
    birthDate: DateInfo
    employmentStartDate: DateInfo
    reviews: [Review]
  }

  type Contractor implements Node, Person
    @rootConnection(field: "allContractors") {
    id: ID!
    name: String!
    email: String!
    birthDate: DateInfo
    contractStartDate: DateInfo
    rates: [Float]
  }

  type Bot implements Node @rootConnection(field: "allBots") {
    id: ID!
    model: String
    skynetAddress: String
    assemblyDate: DateInfo
    serviceStartDate: DateInfo
    maintenanceRecords: [MaintenanceRecord]
  }

  union Team = Employee | Contractor | Bot
`;
