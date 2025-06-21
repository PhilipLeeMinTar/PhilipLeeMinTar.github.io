import { useState } from 'react'
import profilePic from '/spongebob_police.jpg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="text-center py-8 bg-white shadow-md">
        <img src={profilePic} alt="Profile" className="w-32 h-32 mx-auto rounded-full border-4 border-blue-400" />
        <h1 className="text-3xl font-bold mt-4">Paing Min Htet</h1>
        <p className="text-gray-600">Software Engineer | Full Stack Developer</p>
      </header>

      {/* About Me */}
      <section className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">About Me</h2>
        <p className="text-gray-700">
          I'm a Computer Science graduate from NTU with a strong passion for building scalable applications,
          UI/UX design, and solving real-world problems with code. I've interned at SAP and Continental, and enjoy working across the stack.
        </p>
      </section>

      {/* Projects */}
      <section className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Projects</h2>
        <ul className="space-y-4">
          <li className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg">Real-Time Restaurant Cart System</h3>
            <p>Collaborative ordering system using WebSockets and Redis cache. Supports live updates across devices.</p>
          </li>
          <li className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg">AI Tutor Chatbot</h3>
            <p>React + Flask-based tutor bot that helps students understand computer science concepts interactively.</p>
          </li>
        </ul>
      </section>

      {/* Contact */}
      <section className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p>
          Connect with me on{' '}
          <a href="https://www.linkedin.com/in/paing-min-htet/" target="_blank" rel="noreferrer" className="text-blue-600 underline">
            LinkedIn
          </a>
          , or reach out via email at <strong>philiplee98@gmail.com</strong>.
        </p>
      </section>

      {/* Easter Egg Button */}
      <footer className="text-center py-8 bg-white mt-8 shadow-inner">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition"
          onClick={() => setCount((count) => count + 1)}
        >
          Blessing Counter ✨: {count}
        </button>
      </footer>
    </div>
  )
}

export default App
