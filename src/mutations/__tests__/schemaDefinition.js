export const schemaDefinition = `
  type ActionProps {
    timestamp: Int
  }

  type User implements Node {
    id: ID!
    actions: NodeConnection(Action, actionBy, ActionProps)
  }

  type Comment implements Node {
    id: ID!
    text: String
    timestamp: Int
    actionBy: NodeConnection(User, actions, ActionProps)
    commentOn: NodeConnection(Commentable, comments)
  }

  type Like implements Node {
    id: ID!
    timestamp: Int
    actionBy: NodeConnection(User, actions, ActionProps)
    likeOn: NodeConnection(Likable, likes)
  }

  union Action = Comment | Like

  interface Commentable {
    comments: NodeConnection(Comment, commentOn)
  }

  interface Likable {
    likes: NodeConnection(Like, likeOn)
  }

  type Post implements Node, Commentable, Likable {
    id: ID!
    text: String
    # ... other stuff
    comments: NodeConnection(Comment, commentOn)
    likes: NodeConnection(Like, likeOn)
  }

  type ShouldNotBeInModel {
    count: Int
  }
`;
