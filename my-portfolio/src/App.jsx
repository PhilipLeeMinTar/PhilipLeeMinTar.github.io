import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [count, setCount] = useState(0);
  const [expandedProjects, setExpandedProjects] = useState({});

  const toggleProject = (projectId) => {
    console.log("Before toggle:", projectId, expandedProjects);
    setExpandedProjects((prev) => {
      const newState = {
        ...prev,
        [projectId]: !prev[projectId],
      };
      console.log("After toggle:", projectId, newState);
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Hero />

      {/* About Me */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-semibold mb-6 text-gray-900 text-center">
          About Me
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
          Min is a Computer Science graduate from NTU with a strong passion for
          building scalable applications and solving real-world problems with
          code. Currently working in ByteDance under the Tiktok E-Commerce
          Logistics Team, he currently builds interactive application that helps
          to optimize the efficiency of package pickups and deliveries. In his
          free time, he enjoys hitting the gym or playing board games with
          friends.
        </p>
      </motion.section>

      {/* Past Experience */}
      <motion.section
        id="experience"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-semibold mb-6 text-gray-900 text-center">
          Past Experience
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
            <h3 className="font-semibold text-xl flex items-center justify-center gap-3 text-gray-900 mb-3">
              <img
                src="/sap-logo.svg"
                alt="SAP logo"
                loading="lazy"
                className="h-6 w-auto"
              />
              SAP
            </h3>
            <p className="text-gray-600 text-center">
              Working with AI Core which helps business leverage SAP's AI
              Resources as needed
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
            <h3 className="font-semibold text-xl flex items-center justify-center gap-3 text-gray-900 mb-3">
              <img
                src="/continental-logo.svg"
                alt="Continental logo"
                loading="lazy"
                className="h-6 w-auto"
              />
              Continental
            </h3>
            <p className="text-gray-600 text-center">
              Helping to build interactive software for motorcar ecosystem
            </p>
          </div>
        </div>
      </motion.section>

      {/* Projects */}
      <motion.section
        id="projects"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-6xl mx-auto"
      >
        <h2 className="text-3xl font-semibold mb-6 text-gray-900 text-center">
          Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="project-card bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
            <button
              onClick={() => toggleProject("task-app")}
              className="w-full p-4 text-left hover:bg-gray-100 transition-colors duration-200"
            >
              <h3 className="font-semibold text-lg text-gray-900 flex items-center justify-between">
                Task Scheduling App
                <motion.div
                  animate={{ rotate: expandedProjects["task-app"] ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400"
                >
                  ▼
                </motion.div>
              </h3>
            </button>
            <AnimatePresence>
              {expandedProjects["task-app"] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden project-content"
                >
                  <div className="px-4 pb-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>
                        Developed a Android task management application for
                        taking care of elderly
                      </li>
                      <li>
                        Implemented drag-and-drop functionality for task
                        prioritization
                      </li>
                      <li>
                        Utilise public API provided by LTA to display real-time
                        bus arrival information
                      </li>
                      <li>
                        Leveraged the power of Firebase for storage whereby
                        users can create, edit and delete tasks
                      </li>
                      <li>
                        Used Google Calendar which allows for scheduling of
                        tasks
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="project-card bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
            <button
              onClick={() => toggleProject("mdp")}
              className="w-full p-4 text-left hover:bg-gray-100 transition-colors duration-200"
            >
              <h3 className="font-semibold text-lg text-gray-900 flex items-center justify-between">
                Multidisciplinary Project (Robot Car)
                <motion.div
                  animate={{ rotate: expandedProjects["mdp"] ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400"
                >
                  ▼
                </motion.div>
              </h3>
            </button>
            <AnimatePresence>
              {expandedProjects["mdp"] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden project-content"
                >
                  <div className="px-4 pb-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>
                        Spearheaded the creation a smart robot car which
                        incorporates machine learning techniques, android app
                        development, RPI set up with algorithms to navigate
                        through an obstacle course
                      </li>
                      <li>
                        Trained a Yolov5 model with image recognition techniques
                        such as data augmentation
                      </li>
                      <li>
                        Worked in a RPI sub-team to set up multi-processing with
                        multiple threads, in order for RPI to work with many IO
                        devices such as Android tablet and PC station
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="project-card bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
            <button
              onClick={() => toggleProject("quiz-generator")}
              className="w-full p-4 text-left hover:bg-gray-100 transition-colors duration-200"
            >
              <h3 className="font-semibold text-lg text-gray-900 flex items-center justify-between">
                Quiz Generator Website with GPT3
                <motion.div
                  animate={{
                    rotate: expandedProjects["quiz-generator"] ? 180 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400"
                >
                  ▼
                </motion.div>
              </h3>
            </button>
            <AnimatePresence>
              {expandedProjects["quiz-generator"] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden project-content"
                >
                  <div className="px-4 pb-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>
                        Spearheaded the development of a dynamic quiz generator
                        website using React, Vite and ExpressJS
                      </li>
                      <li>
                        Incorporated OpenAI's GPT-3.5 to automate the generation
                        of quiz questions and answers on any topic
                      </li>
                      <li>
                        Designed with HTML5 and CSS3, focusing on responsive
                        design principles to ensure a compelling and accessible
                        interface across all devices
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="project-card bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
            <button
              onClick={() => toggleProject("covid-bot")}
              className="w-full p-4 text-left hover:bg-gray-100 transition-colors duration-200"
            >
              <h3 className="font-semibold text-lg text-gray-900 flex items-center justify-between">
                Covid-19 Telegram Bot
                <motion.div
                  animate={{ rotate: expandedProjects["covid-bot"] ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400"
                >
                  ▼
                </motion.div>
              </h3>
            </button>
            <AnimatePresence>
              {expandedProjects["covid-bot"] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden project-content"
                >
                  <div className="px-4 pb-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>
                        Built a Telegram bot for automated ART test result
                        submissions
                      </li>
                      <li>
                        Utilised Google Sheets and its Apps Script to store
                        user's data and results temporarily
                      </li>
                      <li>
                        Used Machine Learning tools such as TensorFlow to detect
                        images which displays positive ART results
                      </li>
                      <li>Won Champions in the MSD Healthcare Track</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* Contact */}
      <motion.section
        id="contact"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="p-8 max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-semibold mb-6 text-gray-900 text-center">
          Contact
        </h2>
        <p className="text-lg text-gray-600 text-center">
          Connect with me on{" "}
          <a
            href="https://www.linkedin.com/in/paing-min-htet/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline transition-colors duration-300"
          >
            LinkedIn
          </a>
          , or reach out via email at{" "}
          <strong className="text-gray-900">philiplee98@gmail.com</strong>.
        </p>
      </motion.section>

      {/* Easter Egg Button */}
      <footer className="text-center py-12 bg-gray-50 mt-16">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
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
      className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20"
    >
      {/* Subtle geometric background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gray-100 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-gray-100 rounded-full"></div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
            >
              Paing Min Htet
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Software Engineer crafting scalable, user-centric web products. I
              build reliable systems end-to-end and care about clean UX,
              performance, and impact.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
            >
              <a
                href="#projects"
                className="inline-flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-800 px-8 py-4 text-white shadow-lg hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-all duration-300 font-medium"
              >
                View Projects
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 px-8 py-4 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium"
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
              {/* Subtle shadow */}
              <div className="absolute -inset-4 rounded-full bg-gray-100 blur-2xl"></div>

              <img
                src="/spongebob_police.jpg"
                alt="Portrait of Paing Min Htet"
                loading="eager"
                className="relative z-10 h-48 w-48 rounded-full border-4 border-white shadow-2xl ring-1 ring-gray-200 sm:h-56 sm:w-56 lg:h-64 lg:w-64"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
