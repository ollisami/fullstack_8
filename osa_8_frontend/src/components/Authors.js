import React, { useState } from 'react'
import Select from 'react-select';

const Authors = (props) => {
  if (!props.show || !props.result) {
    return null
  }

  if(props.result.loading) {
    return <div>loading...</div>
  }

  const [author, setAuthor] = useState('')
  const [year, setYear] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    await props.editYear({
      variables: { name:author.selectedOption.label, setBornTo:+year }
    })

    setAuthor('')
    setYear('')
  }

  const authors = props.result.data.allAuthors
  const options = authors.map(
    (a) => ({ 'value': a.name, 'label': a.name}), {}
  )

  const getAuthor = () => {
    return author.label
  }

  const handleChange = (selectedOption) => {
    setAuthor({ selectedOption })
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <div>
          name <Select
            value={getAuthor()}
            onChange={handleChange}
            options={options}
          />
        </div>
        <div>
          year <input
            value={year}
            onChange={({ target }) => setYear(target.value)}
          />
        </div>
        <button type='submit'>Update author</button>
      </form>
    </div>
  )
}

export default Authors