
const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

mongoose.set('useFindAndModify', false)

const MONGODB_URI = 'mongodb://fullstack:test1234@ds127376.mlab.com:27376/fullstack_8'
const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'

console.log('commecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type Token {
    value: String!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Author {
    name: String!
    born: String
    bookCount: Int!
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ) : Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User 
    login(
      username: String!
      password: String!      
    ): Token  
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      let b = await Book.find({});
      if (args.author) {
        const author = await Author.findOne({name: args.author})
        const byAuthor = (book) =>
          String(book.author) === String(author._id)
        b = b.filter(byAuthor)
      }

      if (args.genre) {
        const byGenre = (book) =>
          book.genres.includes(args.genre)
        b = b.filter(byGenre)
      }
      return b
    },
    allAuthors: () => Author.find({}),
    me: (root, args, context) => {
      return context.currentUser
    }
  },

  Author: {
    name: (root) => root.name,
    born: (root) => root.born,
    bookCount: async (root) => {
      let books    = await Book.find({})
      const author = await Author.findOne({name: root.name})
      books        = books.filter(b => String(author._id) === String(b.author))
      return books ? books.length : 0
    }
  },

  Mutation: {
    addBook: async (root, args, context) => {
      const book = new Book({...args})
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      try {
        let author = await Author.findOne({name: args.author})
        if (!author) {
          author = new Author({name: args.author, bookCount: 1})
          await author.save()
        }
        book.author = author
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      return book
    },

    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      const author = await Author.findOne({name: args.name})
      if (!author) {
        return null
      }

      author.born = args.setBornTo
      await author.save()
      return author
    }, 
    createUser: (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if ( !user || args.password !== 'secred' ) {
        throw new UserInputError("wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },  
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const authorization = req ? req.headers.authorization : null
    
   if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
     const decodedToken = jwt.verify(authorization.substring(7), JWT_SECRET)
     const currentUser  = await User.findById(decodedToken.id)

     return { currentUser }
   }
 }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})