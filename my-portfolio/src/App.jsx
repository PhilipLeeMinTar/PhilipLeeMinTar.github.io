import { useState } from 'react'
import { motion } from 'framer-motion'
import profilePic from '/spongebob_police.jpg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="text-center py-8 bg-white shadow-md">
      <motion.img
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          src={profilePic}
          alt="Profile"
          className="w-32 h-32 mx-auto rounded-full border-4 border-blue-400"
        />
      <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl font-bold mt-4"
        >
          Paing Min Htet
        </motion.h1>       
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-gray-600"
        >
          Software Engineer | Full Stack Developer
        </motion.p>      
        </header>

      {/* About Me */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-semibold mb-4">About Me</h2>
        <p className="text-gray-700">
          Min is a Computer Science graduate from NTU with a strong passion for building scalable applications,
          UI/UX design, and solving real-world problems with code. Currently working in ByteDance under the Tiktok E-Commerce Logistics 
          Team, he currently builds interactive application that helps to optimize the efficiency of package pickups and deliveries.
          In his free time, he enjoys hitting the gym or playing board games with friends.
        </p>
      </motion.section>

      {/* Past Experience */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-3xl mx-auto border-l-4 border-blue-400 bg-white shadow-md m-1"
        >
        <h2 className="text-2xl font-semibold mb-4">Past Experience</h2>
        <ul className="space-y-4">
          <li className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">
            <img src="/sap-logo.svg" className="h-5 w-auto" />
              SAP
              </h3>
            <p>Working with AI Core which helps business leverage SAP's AI Resources as needed</p>
          </li>
          <li className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">
            <img src="/continental-logo.svg" className="h-5 w-auto" />
              Continental
              </h3>
            <p>Helping to build interactive software for motorcar ecosystem</p>
          </li>
        </ul>
      </motion.section>

      {/* Projects */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-3xl mx-auto border-l-4 border-blue-400 bg-white shadow-md m-1"
        >        
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
      </motion.section>

      {/* Contact */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-3xl mx-auto"
      >        
      <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p>
          Connect with me on{' '}
          <a href="https://www.linkedin.com/in/paing-min-htet/" target="_blank" rel="noreferrer" className="text-blue-600 underline">
            LinkedIn
          </a>
          , or reach out via email at <strong>philiplee98@gmail.com</strong>.
        </p>
      </motion.section>

      {/* Easter Egg Button */}
      <footer className="text-center py-8 bg-white mt-8 shadow-inner">
      <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition"
          onClick={() => setCount((count) => count + 1)}
        >
          Blessing Counter ✨: {count}
        </motion.button>
      </footer>
    </div>
  )
}

export default App
