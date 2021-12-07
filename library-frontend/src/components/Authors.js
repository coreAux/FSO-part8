import React, { useState } from "react"
import { useQuery, useMutation } from "@apollo/client"
import { ALL_AUTHORS, EDIT_AUTHOR } from "../queries"

const Authors = ({token, ...props}) => {
  const [name, setName] = useState("-")
  const [born, setBorn] = useState(1890)
  const [editAuthor] = useMutation(EDIT_AUTHOR)
  const result = useQuery(ALL_AUTHORS, {
    pollInterval: 2000
  })

  if (!props.show) {
    return null
  }

  if (result.loading) {
    return <div>Loading...</div>
  }

  const handleSetBirthyear = (event) => {
    event.preventDefault()

    editAuthor({ variables: { name, setBornTo: parseInt(born) }})
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
          {result.data.allAuthors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      {token &&
        <>
          <h3>Set birthyear</h3>
          <form onSubmit={handleSetBirthyear}>
            <div>
              <label>
                name
                <select
                  value={name}
                  onChange={({ target }) => setName(target.value)}
                >
                  <option value="-">-</option>
                  {result.data.allAuthors.map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label>
                born
                <input
                  type="number"
                  value={born}
                  onChange={({ target }) => setBorn(target.value)}
                />
              </label>
            </div>
          <button type="submit">
            update author
          </button>
          </form>
        </>
      }

    </div>
  )
}

export default Authors
