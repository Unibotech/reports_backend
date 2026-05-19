// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import path from "path";
// import { fileURLToPath } from "url";
// import authRoutes from "./routes/authRoutes.js";
// import departmentRoutes from "./routes/departmentRoutes.js";
// import employeeRoutes from "./routes/employeeRoutes.js";
// import taskRoutes from "./routes/taskRoutes.js";
// import reportRoutes from "./routes/reportsRoutes.js";


// const app = express();

// // Middleware
// app.use(helmet());
// app.use(cors());
// app.use(express.json());  // to parse  json data

// app.use("/api/auth", authRoutes);
// app.use("/api/departments", departmentRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/tasks", taskRoutes);
// app.use("/api/reports", reportRoutes);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Serve React frontend (keep at the very end)
// app.use(express.static(path.join(__dirname, "dist")));
// app.get("/*splat", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });
// // Test route
// app.get("/", (req, res) => {
//   res.send("Backend is running 🚀");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import 'dotenv/config'

import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import reportRoutes from "./routes/reportsRoutes.js";

const app = express();
const port = 5001;
app.use(express.json());
// app.use(cors());
app.use(
  cors({
    origin: "*", // React or Next.js frontend
    credentials: true,
  })
);

app.use(helmet());


app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);


app.get("/", (req, res) => {
  res.send(
    "Hello from backend.lets look forward building this project, UnibotechTaskReports"
  );
});

app.get("/test-db", async (req, res) => {
  try {
    const data = await prisma.product.findMany(); // change model if needed
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }});





const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));