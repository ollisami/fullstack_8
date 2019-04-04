import React, { useState, useEffect } from 'react'
import { gql } from 'apollo-boost'
import { useQuery, useMutation } from 'react-apollo-hooks' 
import { useApolloClient } from 'react-apollo-hooks'
import { Subscription } from 'react-apollo'

import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Recommended from './components/Recommended'

const BOOK_ADDED = gql`
subscription {
  bookAdded {
    title
    published
    author {
      name
      born
      bookCount
    }
    genres
  }
}
`

const ALL_AUTHORS = gql`
{
  allAuthors  {
    name
    born
    bookCount
  }
}
`

const ALL_GENRES = gql`
{
  allGenres
}
`

const ME = gql`
{
  me {
    favoriteGenre
  }
}
`

const ALL_BOOKS = gql`
{
  allBooks  {
    title
    published
    author {
      name
      born
      bookCount
    }
    genres
  }
}
`

const CREATE_BOOK = gql`
mutation createBook($title: String!, $author: String!, $published: Int!, $genres: [String!]!) {
  addBook(
    title: $title,
    author: $author,
    published: $published,
    genres: $genres
  ) {
    title
    published
    author {
      name
      born
      bookCount
    }
    genres
  }
}
`

const EDIT_YEAR = gql`
mutation editYear($name: String!, $setBornTo: Int!) {
  editAuthor(name: $name, setBornTo: $setBornTo)  {
    name
    born
    bookCount
  }
}
`

const LOGIN = gql`
mutation login($username: String!, $password: String!) {
  login(username: $username, password: $password)  {
    value
  }
}
`

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)

  const client = useApolloClient()

  useEffect(() => {
    setToken(localStorage.getItem('library-user-token', token))
  }, [])

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  const handleError = (error) => {
    console.log(error.graphQLErrors[0].message)
  }

  const onLogin = () => {
    console.log("Login succeeded")
    setPage('authors')
  }

  const includedIn = (set, object) => 
    set.map(p => p.id).includes(object.id)  

  const authors       = useQuery(ALL_AUTHORS)
  const genres        = useQuery(ALL_GENRES)
  const books         = useQuery(ALL_BOOKS)
  const user          = useQuery(ME)
  const editYear      = useMutation(EDIT_YEAR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })
  const addBook  = useMutation(CREATE_BOOK, {
    onError: handleError,
    refetchQueries: [{ query: ALL_BOOKS }],
    update: (store, response) => {
      const dataInStore = store.readQuery({ query: ALL_BOOKS })
      const addedBook = response.data.addBook
      
      if (!includedIn(dataInStore.allBooks, addedBook)) {
        dataInStore.allBooks.push(addedBook)
        client.writeQuery({
          query: ALL_BOOKS,
          data: dataInStore
        })
      }
    }
  })
  const login = useMutation(LOGIN)

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {!token && <button onClick={() => setPage('login')}>login</button>}
        {token && <button onClick ={() => setPage('add')}>add book</button>}
        {token && <button onClick ={() => setPage('recommended')}>recommended</button>}
        {token && <button onClick ={logout}>logout</button>}
      </div>

      <LoginForm
          show={page === 'login'}
          login={login}
          setToken={(token) => setToken(token)}
          handleError={handleError}
          onLoginSucceed={onLogin}
      />

      <Authors
        show={page === 'authors'}
        result   = {authors}
        editYear = {editYear}
        token    = {token}
      />
      
      <Books
        show={page === 'books'}
        result = {books}
        genresFetch = {genres}
      />

      <Recommended
        show={page === 'recommended'}
        result = {books}
        user = {user}
      />

      <NewBook
        show={page === 'add'}
        addBook={addBook}
      />

      <Subscription
        subscription={BOOK_ADDED}
        onSubscriptionData={({subscriptionData}) => {
          const addedBook = subscriptionData.data.bookAdded
 
          window.alert(`${addedBook.title} added`)

          const dataInStore = client.readQuery({ query: ALL_BOOKS })
          if (!includedIn(dataInStore.allBooks, addedBook)) {
            dataInStore.allBooks.push(addedBook)
            client.writeQuery({
              query: ALL_BOOKS,
              data: dataInStore
            })
          }
        }}
      > 
        {() => null}
      </Subscription>

    </div>
  )
}

export default App
