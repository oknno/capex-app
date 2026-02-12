import "./index.css";
import { ProjectsPage } from "./app/pages/ProjectsPage/ProjectsPage";
import { ToastProvider } from "./app/components/notifications/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <div className="capex-app">
        <main className="capex-container">
          <ProjectsPage />
        </main>
      </div>
    </ToastProvider>
  );
}
