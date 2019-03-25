import React, { useState } from 'react'
import { gql } from 'apollo-boost'
import { useQuery, useMutation } from 'react-apollo-hooks' 

import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'

const ALL_AUTHORS = gql`
{
  allAuthors  {
    name
    born
    bookCount
  }
}
`

const ALL_BOOKS = gql`
{
  allBooks  {
    title
    published
    author
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
    author
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

const App = () => {
  const [page, setPage] = useState('authors')

  const handleError = (error) => {
    console.log(error.graphQLErrors[0].message)
  }

  const authors  = useQuery(ALL_AUTHORS)
  const books    = useQuery(ALL_BOOKS)
  const editYear = useMutation(EDIT_YEAR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })
  const addBook  = useMutation(CREATE_BOOK, {
    onError: handleError,
    refetchQueries: [{ query: ALL_BOOKS }]
  })

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
      </div>

      <Authors
        show={page === 'authors'}
        result = {authors}
        editYear = {editYear}
      />

      <Books
        show={page === 'books'}
        result = {books}
      />

      <NewBook
        show={page === 'add'}
        addBook={addBook}
      />

    </div>
  )
}

export default App
