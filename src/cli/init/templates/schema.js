export const schema =
`
## Schema Definition

# Basic User type is defined here for convenience and some common patterns are
# illustrated below.

# @rootViewer directive associates User type with authentication system:
type User implements Node @rootViewer(field: "viewer") {
   id: ID!                    # id field is required by Node interface
   firstName: String
   lastName: String
   emails: [String]!
   profilePictureUrl: String
}

#
# Type Declarations
# =================
#
# type Todo implements Node {
#   id: ID!
#   text: String
#   complete: Boolean
#   assignees: NodeConnection(User, todos)
# }
#
# Field types can also be Float, Int, Boolean, or enum (see below)
#
# Connections between Nodes are declared as follows:
#   todos: NodeConnection(Todo, assignees)
#
# The todos field now links to Todo type and denotes "assignees" as a
# back-reference field within Todo type that points back to this type
#

# Filter Declaration
# ==================
#
# filter on NodeConnection(Todo) {
#   ACTIVE: { node: { complete: { eq: false } } }
#   COMPLETED: { node: { complete: { eq: true } } }
#   STATUS: (complete: Boolean) { node: { complete: { eq: $complete } } }
#   ALL: {}
# }
#

# Order Declaration
# =================
#
# order on NodeConnection(Todo) {
#   ID: [ { node: { id: ASCENDING }} ]
#   TEXT: [ { node: { text: ASCENDING }} ]
# }
#

# Mutation Declarations
# =====================
#
# mutation addTodo(text: String!) {
#   todoEdge: Edge(Todo)
#   viewer: User
# }
#
# mutation changeTodoStatus(id: ID!, complete: Boolean!) {
#   todo: Todo
#   viewer: User
# }
#
# mutation markAllTodos(complete: Boolean!) {
#   changedTodos: [Todo]
#   viewer: User
# }
#
# mutation removeCompletedTodos {
#   deletedTodoIds: [ID]
#   viewer: User
# }
#
# mutation removeTodo(id: ID!) {
#   deletedTodoId: ID
#   viewer: User
# }
#
# mutation renameTodo(id: ID!, text: String!) {
#   todo: Todo
# }
#

# Enum Declaration
# ================
#
# enum Month { JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC }
#

# Interface Declaration
# =====================
#
# interface Named {
#   name: String!
#   # ...other fields that types that implement interface will have to define
# }
#

# Union Declaration
# =================
#
# union AllTypes = Type1 | Type2 | Type3
#

# Input Declarations
# ==================
#
# input Date {
#   year: Int
#   day: Int
#   month: Month    # see enum declaration above
# }
#
`;
