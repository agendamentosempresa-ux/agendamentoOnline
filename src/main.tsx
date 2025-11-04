import "./assets/Dir.css";
/* Import do seu CSS externo */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";


createRoot(document.getElementById("root")!).render(<App />);
