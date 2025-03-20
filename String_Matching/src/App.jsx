import { useState } from "react";
import reactLogo from "./assets/react.svg";
import StringMatch from "./StringMatch";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <StringMatch />
    </>
  );
}

export default App;
