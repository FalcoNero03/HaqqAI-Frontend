import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import TestUI from "./TestUI";
import "./index.css";

function RootSwitcher() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");

  if (view === "test") {
    return <TestUI />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootSwitcher />
  </React.StrictMode>,
);
