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

createServices().then(
  (services) => {
    createRoot(root).render(
      <StrictMode>
        <App services={services} />
      </StrictMode>,
    );
  },
  (error: unknown) => {
    console.error(error);
    createRoot(root).render(
      <main className="screen">
        <h1 className="title-sm">MovieStars is not set up yet</h1>
        <p className="lead">
          This copy of the app has no connection to The Movie Database configured. If you run it,
          add your TMDB token and rebuild.
        </p>
      </main>,
    );
  },
);
