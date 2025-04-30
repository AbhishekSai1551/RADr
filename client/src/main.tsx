import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Load environment variables into window.ENV
import "./env-config";

createRoot(document.getElementById("root")!).render(<App />);
