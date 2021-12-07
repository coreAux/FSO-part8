import React, { useEffect, useState } from 'react'
import { useApolloClient, useSubscription } from "@apollo/client"

import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from "./components/LoginForm"
import Recommend from "./components/Recommend"

import { BOOK_ADDED, ALL_BOOKS } from "./queries"

const App = () => {
  const [token, setToken] = useState(null)
  const [page, setPage] = useState('authors')
  const client = useApolloClient()

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) =>  set.map(b => b.id).includes(object.id)

    const dataInStore = client.readQuery({ query: ALL_BOOKS })
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks: dataInStore.allBooks.concat(addedBook) }
      })
    }
  }

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded
      updateCacheWith(addedBook)
      window.alert(`${addedBook.title} added!`)
    }
  })

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
    setPage("authors")
  }

  useEffect(() => {
    const token = localStorage.getItem("library-app-user-token")
    if (token) {
      setToken(token)
    }
  }, [])

  useEffect(() => {
    if (token) {
      setPage("authors")
    }
  }, [token])

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token &&
          <>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={() => setPage("recommend")}>recommend</button>
            <button onClick={logout}>logout</button>
          </>
        }
        {!token &&
          <button onClick={() => setPage("login")}>login</button>
        }
      </div>

      <Authors
        token={token}
        show={page === 'authors'}
      />

      <Books
        show={page === 'books'}
      />

      {token &&
        <>
          <NewBook
            show={page === 'add'}
          />

          <Recommend
            show={page === "recommend"}
          />
        </>
      }

      <LoginForm
        show={page === "login"}
        setToken={setToken}
      />

    </div>
  )
}

export default App
