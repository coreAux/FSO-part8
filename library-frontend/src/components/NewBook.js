import React, { useState } from 'react'
import { useMutation } from "@apollo/client"
import { ADD_BOOK, ALL_BOOKS, ME } from "../queries"

const NewBook = (props) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState(1999)
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])
  const [addBook] = useMutation(ADD_BOOK, {
    onError: (err) => {
      console.log("Error...", err)
    },
    update: (store, response) => {
      const dataInStore = store.readQuery({ query: ALL_BOOKS })
      const userInStore = store.readQuery({ query: ME})
      const filteredDataInStore = store.readQuery({
        query: ALL_BOOKS,
        variables: {
          genre: userInStore.me.favoriteGenre
        }
      })

      const favoriteGenre = userInStore.me.favoriteGenre

      store.writeQuery({
        query: ALL_BOOKS,
        data: {
          ...dataInStore,
          allBooks: [...dataInStore.allBooks, response.data.addBook]
        }
      })

      if (response.data.addBook.genres.includes(favoriteGenre)) {
        console.log("Should update Recommend")
        store.writeQuery({
          query: ALL_BOOKS,
          variables: {
            genre: favoriteGenre
          },
          data: {
            ...filteredDataInStore,
            allBooks: [...filteredDataInStore.allBooks, response.data.addBook]
          }
        })
      } else  {
        console.log("Should not update recommend")
      }
    }
  })

  if (!props.show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()

    addBook({ variables: { title, author, published: parseInt(published), genres }})

    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type='number'
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">add genre</button>
        </div>
        <div>
          genres: {genres.join(' ')}
        </div>
        <button type='submit'>create book</button>
      </form>
    </div>
  )
}

export default NewBook
