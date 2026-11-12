import { HashRouter, Navigate, Route, Routes } from "react-router";
import { AboutScreen } from "../ui/AboutScreen";
import { FilmsScreen } from "../ui/FilmsScreen";
import { HomeScreen } from "../ui/HomeScreen";
import { PlaceholderScreen } from "../ui/PlaceholderScreen";
import { SessionScreen } from "../ui/session/SessionScreen";
import { useAsync } from "../ui/useAsync";
import { WelcomeScreen } from "../ui/WelcomeScreen";
import type { Services } from "./services";
import { ServicesContext, useServices } from "./ServicesContext";

/** Home on later launches; the Welcome screen on the very first one. */
function StartRoute() {
  const { learning } = useServices();
  const [profile] = useAsync(() => learning.profile(), [learning]);
  if (profile.status !== "ready") return null;
  return profile.value.welcomed ? <HomeScreen /> : <Navigate to="/welcome" replace />;
}

export function App({ services }: { services: Services }) {
  return (
    <ServicesContext.Provider value={services}>
      <HashRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<StartRoute />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/films" element={<FilmsScreen />} />
            <Route path="/session" element={<SessionScreen />} />
            <Route path="/people" element={<PlaceholderScreen title="My people" task="T10" />} />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </ServicesContext.Provider>
  );
}
