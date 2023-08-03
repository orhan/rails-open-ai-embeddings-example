import * as React from "react";
import { createRoot } from "react-dom/client";
import { App, AppProps } from "./app";

document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");
  const props: AppProps = rootElement?.dataset.props
    ? (JSON.parse(rootElement?.dataset.props) as AppProps)
    : {};

  const root = createRoot(rootElement!);
  root.render(<App {...props} />);
});
