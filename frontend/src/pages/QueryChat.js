import React from 'react'

export default function QueryChat() {
  return (
    <div>
        <h1>Query Chat Page</h1>
        <button onClick={async () => {
          console.log("response")
        }}>Send Query</button>
      
    </div>
  )
}
