import React, { useState } from "react"
import { useQuery } from "@apollo/client"
import { ALL_BOOKS } from "../queries"

const Books = (props) => {
  const [genres, setGenres] = useState([])
  const [activeGenre, setActiveGenre] = useState("all genres")
  const { loading, error, data } = useQuery(ALL_BOOKS, {
    onCompleted: (data) => {
      // console.log("Completed!", data)
      data.allBooks.forEach((b) => {
        // console.log(b.genres)
        b.genres.forEach((g) => {
          // console.log(g)
          setGenres((genres) => genres.includes(g) ? genres : [...genres, g])
        })
      })
    },
  })

  if (!props.show) {
    return null
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error!</div>
  }

  const filter = activeGenre === "all genres" ? data.allBooks : data.allBooks.filter((b) => b.genres.includes(activeGenre))
  // console.log("Filter: " , filter)

  return (
    <div>
      <h2>books</h2>

      <p>in genre <strong>{activeGenre}</strong></p>

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
          {filter.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div>
        {genres.map(g => (
          <button
            key={g}
            onClick={() => setActiveGenre(g)}
          >
            {g}
          </button>
        ))}
        <button
          onClick={() => setActiveGenre("all genres")}
        >
          all genres
        </button>
      </div>
    </div>
  )
}

export default Books
