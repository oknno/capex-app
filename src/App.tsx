import "./index.css";
import { ProjectsPage } from "./app/pages/ProjectsPage/ProjectsPage";

export default function App() {
  return (
    <div className="capex-app">
      <main className="capex-container">
        <ProjectsPage />
      </main>
    </div>
  );
}
