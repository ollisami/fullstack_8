
const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

mongoose.set('useFindAndModify', false)

const MONGODB_URI = 'mongodb://fullstack:test1234@ds127376.mlab.com:27376/fullstack_8'
const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'

console.log('connecting to', MONGODB_URI)

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
    allGenres: [String]!
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

  type Subscription {
    bookAdded: Book!
  } 
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      let b = await Book.find({})
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
    allGenres: async (root, args) => {
      let b = await Book.find({})
      let genres = []
      b.map(book => genres = Array.from(new Set(genres.concat(book.genres))))
      return genres
    },
    me: (root, args, context) => {
      console.log('here')
      return context.currentUser
    }
  },

  Book: {
    author: async (root) => {
      author = await Author.findOne({_id: root.author})
      return {
        name: author.name,
        born: author.born,
        bookCount: author.bookCount
      }
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
        let bookArgs = {...args}
        bookArgs.author = author.id
        const book = new Book({...bookArgs})
        await book.save()
        pubsub.publish('BOOK_ADDED', { bookAdded: book })
        return book
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
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

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})