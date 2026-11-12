import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./ui/theme.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { createServices } from "./app/services";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createServices().then((services) => {
  createRoot(root).render(
    <StrictMode>
      <App services={services} />
    </StrictMode>,
  );
});
