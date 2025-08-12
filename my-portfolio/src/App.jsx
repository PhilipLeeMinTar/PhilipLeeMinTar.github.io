import { useState } from "react";
import { motion } from "framer-motion";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Hero />

      {/* About Me */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-semibold mb-4">About Me</h2>
        <p className="text-gray-700">
          Min is a Computer Science graduate from NTU with a strong passion for
          building scalable applications, UI/UX design, and solving real-world
          problems with code. Currently working in ByteDance under the Tiktok
          E-Commerce Logistics Team, he currently builds interactive application
          that helps to optimize the efficiency of package pickups and
          deliveries. In his free time, he enjoys hitting the gym or playing
          board games with friends.
        </p>
      </motion.section>

      {/* Past Experience */}
      <motion.section
        id="experience"
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
              <img
                src="/sap-logo.svg"
                alt="SAP logo"
                loading="lazy"
                className="h-5 w-auto"
              />
              SAP
            </h3>
            <p>
              Working with AI Core which helps business leverage SAP's AI
              Resources as needed
            </p>
          </li>
          <li className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">
              <img
                src="/continental-logo.svg"
                alt="Continental logo"
                loading="lazy"
                className="h-5 w-auto"
              />
              Continental
            </h3>
            <p>Helping to build interactive software for motorcar ecosystem</p>
          </li>
        </ul>
      </motion.section>

      {/* Projects */}
      <motion.section
        id="projects"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-3xl mx-auto border-l-4 border-blue-400 bg-white shadow-md m-1"
      >
        <h2 className="text-2xl font-semibold mb-4">Projects</h2>
        <ul className="space-y-4">
          <li className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg">
              Real-Time Restaurant Cart System
            </h3>
            <p>
              Collaborative ordering system using WebSockets and Redis cache.
              Supports live updates across devices.
            </p>
          </li>
          <li className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg">AI Tutor Chatbot</h3>
            <p>
              React + Flask-based tutor bot that helps students understand
              computer science concepts interactively.
            </p>
          </li>
        </ul>
      </motion.section>

      {/* Contact */}
      <motion.section
        id="contact"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p>
          Connect with me on{" "}
          <a
            href="https://www.linkedin.com/in/paing-min-htet/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
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
  );
}

export default App;

function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl"
            >
              Paing Min Htet
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0"
            >
              Software Engineer crafting scalable, user-centric web products. I
              build reliable systems end-to-end and care about clean UX,
              performance, and impact.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <a
                href="#projects"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 !text-white shadow hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                View Projects
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2.5 text-blue-700 hover:bg-blue-50"
              >
                Contact Me
              </a>
            </motion.div>
          </div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <span
                aria-hidden="true"
                className="absolute -inset-2 rounded-full bg-blue-200/40 blur-2xl"
              />
              <img
                src="/spongebob_police.jpg"
                alt="Portrait of Paing Min Htet"
                loading="eager"
                className="relative z-10 h-40 w-40 rounded-full border-4 border-white shadow-lg ring-2 ring-blue-200 sm:h-48 sm:w-48 lg:h-56 lg:w-56"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
