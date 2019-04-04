import React, { useState, useEffect } from 'react'

const Recommended = (props) => {
  if (!props.show) {
    return null
  }
  const [books, setBooks] = useState([])

  useEffect(() => {
    const genre = props.user.data.me
    console.log(genre.favoriteGenre)
    setBooks(props.result.data.allBooks.filter(b => b.genres.includes(genre.favoriteGenre)))
  }, [])

  if(props.result.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>Recommended books:</h2>
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
    </div>
  )
}
 
export default Recommended