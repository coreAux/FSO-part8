const { ApolloServer, UserInputError, AuthenticationError, gql } = require("apollo-server-express")
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core")
const express = require("express")

const http = require("http")

// Imports for subscriptions...
const { subscribe, execute } = require("graphql")
const { SubscriptionServer } = require("subscriptions-transport-ws")
const gqltools = require("@graphql-tools/schema")
const { makeExecutableSchema } = require("@graphql-tools/schema")

const { PubSub } = require("graphql-subscriptions")

const { v1: uuid} = require("uuid")
const jwt = require("jsonwebtoken")

const mongoose = require("mongoose")
const User = require("./models/user")
const Author = require("./models/author")
const Book = require("./models/book")

const JWT_SECRET = "SUPER_SECRET_KEY"
const MONGODB_URI = "mongodb+srv://fullstack:fullstackopen2020@cluster0.kbbvk.mongodb.net/library-app?retryWrites=true"

const pubsub = new PubSub()

console.log("Connecting to", MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((err) => {
    console.error("Error connecting to MondoDB: ", error.message)
  })

// mongoose.set("debug", true)

/*
let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]
*/
/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
*/
/*
let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]
*/

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]
    id: ID!
  }

  type Query {
    me: User
    allBooks(author: String, genre: String): [Book!]!
    bookCount: Int!
    allAuthors: [Author!]!
    authorCount: Int!
  }

  type Mutation {
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
    addBook(
      title: String!
      published: Int
      author: String!
      genres: [String!]
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }

  type Subscription {
    bookAdded: Book!
  }
`

const resolvers = {
  Book: {
    author: async (root) => await Author.findOne({ _id: root.author })
  },
  Author: {
    bookCount: (root) => {
      // console.log("root: ", root)
      // console.log("bookCount: ", root.books.length)
      //
      // const author = await Author.findOne({ name: root.name})
      // console.log("book.find.countDocs");
      // return await Book.find({ author: author._id }).countDocuments()
      return root.books.length
    }
  },
  Query: {
    me: (root, args, context) => {
      return context.currentUser
    },
    allBooks: async (obj, args, context, info) => {

      // AUTHOR
      if (args.author && !args.genre) {
        const author = await Author.findOne({ name: args.author })
        return await Book.find({ author: author._id })
        // returnedBooks = books.filter(b => b.author === args.author)
      }

      // GENRE
      if (!args.author && args.genre) {

        return await Book.find({ genres: args.genre })
        // returnedBooks = books.filter(b => b.genres.includes(args.genre))
      }

      // AUTHOR AND GENRE
      if (args.author && args.genre) {
        const author = await Author.findOne({ name: args.author })
        return await Book.find({ author: author._id, genres: args.genre })
        // returnedBooks = books.filter(b => b.author === args.author).filter(b => b.genres.includes(args.genre))
      }

      // NO AUTHOR OR GENRE
      if (!args.author && !args.genre) {
        // console.log("No author or genre");
        return await Book.find({})
      }

      return await Book.find({})
    },
    bookCount: async () => await Book.collection.countDocuments(),
    allAuthors: async () => {
      return await Author.find({}).populate("books")
    },
    authorCount: async () => await Author.collection.countDocuments()
  },
  Mutation: {
    createUser: (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      return user.save()
        .catch((err) => {
          throw new UserInputError(err.message, {
            invalidArgs: args
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== "secret") {
        throw new UserInputError("Wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
    addBook: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError("Not authenticated")
      }

      const authorExists = await Author.findOne({ name: args.author })

      const author = authorExists ? authorExists : new Author({ name: args.author })

      const book = new Book({ ...args, author: author._id})
      author.books.push(book._id)

      try {
        await book.save()
        await author.save()
        pubsub.publish("BOOK_ADDED", { bookAdded: book })
        return book
      } catch (err) {
        throw new UserInputError(err.message, {
          invalidArgs: args
        })
      }
    },
    editAuthor: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError("Not authenticated")
      }

      const author = await Author.findOne({ name: args.name })

      if (!author) {
        return null
      }

      author.born = args.setBornTo

      try {
        await author.save()
        return author
      } catch (err) {
        throw new UserInputError(err.message, {
          invalidArgs: args
        })
      }

    }
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"])
    }
  }
}
//
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   context: async ({ req }) => {
//     const auth = req ? req.headers.authorization : null
//     if (auth && auth.toLowerCase().startsWith('bearer ')) {
//       const decodedToken = jwt.verify(
//         auth.substring(7), JWT_SECRET
//       )
//       const currentUser = await User.findById(decodedToken.id)
//       return { currentUser }
//     }
//   }
// })
//
// server.listen().then(({ url }) => {
//   console.log(`Server ready at ${url}`)
// })

async function startServer () {

  const app = express()
  const httpServer = http.createServer(app)

      const schema = makeExecutableSchema({ typeDefs, resolvers })

      const subscriptionServer = SubscriptionServer.create({
        schema,
        execute,
        subscribe
      }, {
        server: httpServer,
        path: "/graphql"
      })

  const server = new ApolloServer({
    // typeDefs,
    // resolvers,
    schema,
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null
      if (auth && auth.toLowerCase().startsWith('bearer ')) {
        const decodedToken = jwt.verify(
          auth.substring(7), JWT_SECRET
        )
        const currentUser = await User.findById(decodedToken.id)
        return { currentUser }
      }
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close()
            }
          }
        }
      }
    ],
  })

  await server.start()
  server.applyMiddleware({ app, path: "/"})

  const PORT = 4000
  httpServer.listen(PORT, () => {
    console.log("Server ready at http://localhost:4000/ 🚀")
  })


}

startServer()
