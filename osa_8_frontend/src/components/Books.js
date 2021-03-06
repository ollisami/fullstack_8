import React, { useState, useEffect } from 'react'



const Books = (props) => {
  if (!props.show) {
    return null
  }
  const [books, setBooks] = useState([])

  useEffect(() => {
    setBooks(props.result.data.allBooks)
  }, [])

  if(props.result.loading) {
    return <div>loading...</div>
  }
  const genres = props.genresFetch.data.allGenres

  const filterBooks = (genre) => {
    setBooks(props.result.data.allBooks.filter(b => b.genres.includes(genre)))
  }

  return (
    <div>
      <h2>books</h2>
      <table>
          <tbody>
            <tr>
              <th></th>
              <th>
                author
              </th>
              <th>
                published
              </th>
            </tr>
            {books.map(a =>
              <tr key={a.title}>
                <td>{a.title}</td>
                <td>{a.author.name}</td>
                <td>{a.published}</td>
              </tr>
            )}
          </tbody>
        </table>
      {genres.map(g => 
      <button key={g} onClick={() => filterBooks(g)}>{g}</button>
      )}
    </div>
  )
}
 
export default Books