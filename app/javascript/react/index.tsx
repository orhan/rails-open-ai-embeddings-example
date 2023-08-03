import * as React from "react";
import * as ReactDOM from "react-dom";
import { App, AppProps } from "./app";

document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");
  const props: AppProps = rootElement?.dataset.props
    ? (JSON.parse(rootElement?.dataset.props) as AppProps)
    : {};

  ReactDOM.render(<App {...props} />, rootElement);
});
