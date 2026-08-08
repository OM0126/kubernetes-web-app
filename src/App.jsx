import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState([]);

  const calculate = (a, b, op) => {
    switch (op) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? null : a / b;
      default:
        return b;
    }
  };

  const format = (num) => {
    if (!Number.isFinite(num)) return "Error";

    return Number(num.toFixed(10)).toLocaleString("en-US", {
      maximumFractionDigits: 10,
    });
  };

  const number = (value) => {
    if (display === "Error") {
      setDisplay(value);
      return;
    }

    if (waiting) {
      setDisplay(value);
      setWaiting(false);
      return;
    }

    setDisplay(display === "0" ? value : display + value);
  };

  const decimal = () => {
    if (waiting) {
      setDisplay("0.");
      setWaiting(false);
      return;
    }

    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setStoredValue(null);
    setOperator(null);
    setWaiting(false);
  };

  const backspace = () => {
    if (waiting || display === "Error") return;

    setDisplay(
      display.length > 1 ? display.slice(0, -1) : "0"
    );
  };

  const percentage = () => {
    if (display === "Error") return;

    setDisplay(String(Number(display) / 100));
  };

  const plusMinus = () => {
    if (display === "0" || display === "Error") return;

    setDisplay(
      display.startsWith("-")
        ? display.slice(1)
        : `-${display}`
    );
  };

  const selectOperator = (op) => {
    const current = Number(display);

    if (storedValue !== null && operator && !waiting) {
      const result = calculate(
        storedValue,
        current,
        operator
      );

      if (result === null) {
        setDisplay("Error");
        clear();
        return;
      }

      setStoredValue(result);
      setDisplay(format(result));
    } else {
      setStoredValue(current);
    }

    setOperator(op);
    setWaiting(true);
  };

  const equals = () => {
    if (storedValue === null || !operator) return;

    const current = Number(display);

    const result = calculate(
      storedValue,
      current,
      operator
    );

    if (result === null) {
      setDisplay("Error");
      setStoredValue(null);
      setOperator(null);
      return;
    }

    const expression = `${format(storedValue)} ${operator} ${format(current)}`;

    setHistory((old) => [
      {
        expression,
        result: format(result),
      },
      ...old,
    ].slice(0, 6));

    setDisplay(format(result));
    setStoredValue(null);
    setOperator(null);
    setWaiting(true);
  };

  const keyboard = (event) => {
    const key = event.key;

    if (key >= "0" && key <= "9") number(key);
    else if (key === ".") decimal();
    else if (key === "+") selectOperator("+");
    else if (key === "-") selectOperator("−");
    else if (key === "*") selectOperator("×");
    else if (key === "/") selectOperator("÷");
    else if (key === "%") percentage();
    else if (key === "Enter" || key === "=") equals();
    else if (key === "Backspace") backspace();
    else if (key === "Escape") clear();
  };

  useEffect(() => {
    window.addEventListener("keydown", keyboard);

    return () => {
      window.removeEventListener("keydown", keyboard);
    };
  });

  return (
    <div className="app">

      <div className="calculator">

        <header className="header">
          <div className="logo">
            <span></span>
            CALC
          </div>

          <div className="status">
            <span className="status-dot"></span>
            Ready
          </div>
        </header>

        <section className="display">

          <div className="small-display">
            {storedValue !== null && operator
              ? `${format(storedValue)} ${operator}`
              : ""}
          </div>

          <div className="main-display">
            {display}
          </div>

        </section>

        <section className="keypad">

          <button
            className="special"
            onClick={clear}
          >
            AC
          </button>

          <button
            className="special"
            onClick={plusMinus}
          >
            ±
          </button>

          <button
            className="special"
            onClick={percentage}
          >
            %
          </button>

          <button
            className="operator"
            onClick={() => selectOperator("÷")}
          >
            ÷
          </button>

          <button onClick={() => number("7")}>7</button>
          <button onClick={() => number("8")}>8</button>
          <button onClick={() => number("9")}>9</button>

          <button
            className="operator"
            onClick={() => selectOperator("×")}
          >
            ×
          </button>

          <button onClick={() => number("4")}>4</button>
          <button onClick={() => number("5")}>5</button>
          <button onClick={() => number("6")}>6</button>

          <button
            className="operator"
            onClick={() => selectOperator("−")}
          >
            −
          </button>

          <button onClick={() => number("1")}>1</button>
          <button onClick={() => number("2")}>2</button>
          <button onClick={() => number("3")}>3</button>

          <button
            className="operator"
            onClick={() => selectOperator("+")}
          >
            +
          </button>

          <button
            className="zero"
            onClick={() => number("0")}
          >
            0
          </button>

          <button onClick={decimal}>
            .
          </button>

          <button
            className="delete"
            onClick={backspace}
          >
            ⌫
          </button>

          <button
            className="equals"
            onClick={equals}
          >
            =
          </button>

        </section>

        <section className="history">

          <div className="history-header">
            <span>History</span>

            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
              >
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="empty">
              No calculations yet
            </div>
          ) : (
            history.map((item, index) => (
              <div
                className="history-row"
                key={index}
              >
                <span>{item.expression}</span>
                <strong>{item.result}</strong>
              </div>
            ))
          )}

        </section>

        <footer>
          <span>⌨ Keyboard enabled</span>
          <span>ESC to clear</span>
        </footer>

      </div>

    </div>
  );
}

export default App;