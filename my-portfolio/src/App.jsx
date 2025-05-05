import { useState } from 'react'
import profilePic from '/spongebob_police.jpg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://www.linkedin.com/in/paing-min-htet/" target="_blank">
          <img src={profilePic} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Paing Min Htet's Portfolio</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Click to Increase Your Blessings: {count}
        </button>
      </div>
    </>
  )
}

export default App
