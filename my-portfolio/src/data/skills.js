// Single source of truth for skill labels. Projects and experience reference these ids in `tags`.
export const skillGroups = [
  {
    name: "Languages",
    skills: [
      { id: "go", label: "Go" },
      { id: "python", label: "Python" },
      { id: "kotlin", label: "Kotlin" },
      { id: "java", label: "Java" },
      { id: "typescript", label: "TypeScript" },
      { id: "javascript", label: "JavaScript" },
    ],
  },
  {
    name: "Backend & APIs",
    skills: [
      { id: "rest", label: "REST APIs" },
      { id: "rpc", label: "RPC" },
      { id: "microservices", label: "Microservices" },
      { id: "mq", label: "Message queues (RocketMQ)" },
      { id: "auth", label: "Auth & access control" },
      { id: "express", label: "Express" },
      { id: "hono", label: "Hono" },
      { id: "concurrency", label: "Concurrency" },
    ],
  },
  {
    name: "Data",
    skills: [
      { id: "mysql", label: "MySQL" },
      { id: "redis", label: "Redis" },
      { id: "sqlite", label: "SQLite" },
      { id: "firebase", label: "Firebase" },
    ],
  },
  {
    name: "Cloud & Infra",
    skills: [
      { id: "docker", label: "Docker" },
      { id: "kubernetes", label: "Kubernetes" },
      { id: "aws", label: "AWS" },
      { id: "cicd", label: "CI/CD" },
      { id: "testing", label: "Testing" },
    ],
  },
  {
    name: "Also",
    skills: [
      { id: "react", label: "React" },
      { id: "android", label: "Android" },
      { id: "openai", label: "OpenAI API" },
      { id: "tensorflow", label: "TensorFlow" },
      { id: "yolov5", label: "YOLOv5" },
      { id: "raspberry-pi", label: "Raspberry Pi" },
      { id: "apps-script", label: "Apps Script" },
      { id: "oop", label: "OOP" },
    ],
  },
];

export const skillLabel = Object.fromEntries(
  skillGroups.flatMap((g) => g.skills.map((s) => [s.id, s.label])),
);
