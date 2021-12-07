import React, { useEffect } from "react"
import { useQuery, useLazyQuery } from "@apollo/client"
import { ME, ALL_BOOKS } from "../queries"

const Recommend = (props) => {
  const { loading: userLoading, error: userError, data: userData } = useQuery(ME)
  const [allBooks, { loading, error, data }] = useLazyQuery(ALL_BOOKS)

  useEffect(() => {
    if (userData) {
      const favoriteGenre = userData.me.favoriteGenre
      allBooks({ variables: { genre: favoriteGenre } })
    }
  }, [userLoading, allBooks, userData])

  if (!props.show) {
    return null
  }

  if (userLoading || loading) {
    return (<div>Loading...</div>)
  }

  if (userError || error ) {
    return (<div>Error!</div>)
  }

  return (
    <div>
      <h2>recommendations</h2>

      <p>books in your favorite genre <strong>{userData.me.favoriteGenre}</strong></p>

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
          {data && data.allBooks.map(a =>
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

export default Recommend
