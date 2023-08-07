import React, {
  useState,
  useCallback,
  FC,
  ReactNode,
  CSSProperties,
  useRef,
  useEffect,
} from "react";
import { createConsumer } from "@rails/actioncable";
import { TrainAI } from "./train-ai";

export interface AppProps {
  screen: "train" | "ask";
  book?: {
    title: string;
    author: string;
    cover: string;
    link: string;
  };
  redirect?: string;
  answer?: {
    question: string;
    answer: string;
  };
  authenticityToken?: string;
}

export const Button: FC<{
  children: ReactNode;
  style?: CSSProperties;
  hoverStyle?: CSSProperties;
  onClick: () => void;
}> = (props) => {
  const { children, style, hoverStyle, onClick } = props;

  const [hovered, setHovered] = useState(false);
  const onHoverIn = () => setHovered(true);
  const onHoverOut = () => setHovered(false);

  return (
    <div
      style={{
        ...styles.button,
        ...style,
        ...(hovered && styles.buttonHovered),
        ...(hovered && hoverStyle),
      }}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const App = (props: AppProps) => {
  const { screen, book, redirect, answer, authenticityToken } = props;

  if (redirect) {
    window.location.replace(redirect);
  }

  if (screen === "train") {
    return <TrainAI {...props} />;
  }

  const [answerPartial, setAnswerPartial] = useState("");
  useEffect(() => {
    if (!answer) {
      return;
    }

    const answerText = answer.answer;
    const answerTextLength = answerText.length;

    let i = 0;
    const interval = setInterval(() => {
      setAnswerPartial(answerText.substring(0, i));
      i++;

      if (i > answerTextLength) {
        clearInterval(interval);
      }
    }, 25);

    return () => {
      clearInterval(interval);
    };
  }, [answer]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [askingQuestion, setAskingQuestion] = useState(false);
  const askQuestion = (question: string) => {
    setAskingQuestion(true);

    fetch("/ask_question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authenticity_token: authenticityToken,
        question,
      }),
    })
      .then((responseData) => {
        responseData.json().then((response) => {
          if (response.ok) {
            if (response.redirect) {
              setTimeout(() => {
                window.location.href = response.redirect;
                setAskingQuestion(false);
              }, 100);
            } else if (response.url) {
              setTimeout(() => {
                window.location.href = response.url;
                setAskingQuestion(false);
              }, 100);
            }
          } else {
            alert("Error asking question: " + response.statusText);
            setAskingQuestion(false);
          }
        });
      })
      .catch((error) => {
        alert("Error asking question: " + error);
        setAskingQuestion(false);
      });
  };

  const onAskQuestionClick = useCallback(() => {
    askQuestion(
      inputRef.current?.value || "What is The Minimalist Entrepreneur about?"
    );
  }, []);

  const onRandomQuestionClick = useCallback(() => {
    const questions = [
      "What is a minimalist entrepreneur?",
      "What is your definition of community?",
      "How do I decide what kind of business I should start?",
    ];

    const randomQuestion =
      questions[Math.floor(Math.random() * questions.length)];
    askQuestion(randomQuestion);
  }, []);

  const onAskAnotherQuestionClick = useCallback(() => {
    window.location.href = "/";
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>Ask my book</h1>

      <div style={styles.content}>
        <div style={styles.table}>
          <a href={book?.link} target="_blank">
            <img style={styles.cover} src={book?.cover} />
          </a>

          <div style={styles.info}>
            <p>
              <span style={styles.label}>Title</span>
              <a href={book?.link} target="_blank">
                <span style={styles.value}>{book?.title}</span>
              </a>
            </p>

            <p>
              <span style={styles.label}>Author</span>
              <span style={{ ...styles.value }}>{book?.author}</span>
            </p>
          </div>
        </div>
      </div>

      <h2 style={styles.title}>
        This is an experiment in using AI to make a book's content more
        accessible.
        <br />
        Ask a question and AI will answer it in real-time:
      </h2>

      {!answer ? (
        <>
          <textarea
            ref={inputRef}
            style={styles.input}
            placeholder={"What is The Minimalist Entrepreneur about?"}
            rows={3}
            cols={100}
          ></textarea>

          <div style={styles.buttonContainer}>
            <Button
              style={{
                backgroundColor: "#000",
                color: "white",
                opacity: !askingQuestion ? 1 : 0.4,
                pointerEvents: !askingQuestion ? "all" : "none",
              }}
              hoverStyle={{
                backgroundColor: "rgb(255, 219, 144)",
                color: "black",
              }}
              onClick={onAskQuestionClick}
            >
              {askingQuestion ? "Asking ..." : "Ask question"}
            </Button>

            <Button
              style={{
                opacity: !askingQuestion ? 1 : 0.4,
                pointerEvents: !askingQuestion ? "all" : "none",
              }}
              onClick={onRandomQuestionClick}
            >
              {"I'm feeling lucky"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ width: 600 }}>
            <p style={{ ...styles.label, textAlign: "center" }}>Answer</p>

            <div style={styles.answer}>
              <div style={{ opacity: 0 }}>{answer.answer}d</div>
              <div
                style={{
                  position: "absolute",
                  left: 20,
                  right: 20,
                  top: 18,
                  bottom: 20,
                }}
              >
                {answerPartial}
              </div>
            </div>
          </div>

          <div style={styles.buttonContainer}>
            <Button
              style={{
                backgroundColor: "#000",
                color: "white",
              }}
              hoverStyle={{
                backgroundColor: "rgb(255, 219, 144)",
                color: "black",
              }}
              onClick={onAskAnotherQuestionClick}
            >
              {"Ask another question"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "REM",
    fontWeight: 300,
  },

  logo: {
    fontFamily: "Permanent Marker",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 10,
    cursor: "default",
  },

  content: {
    display: "flex",
    flexDirection: "column",
    width: 600,
    justifyContent: "center",
    alignItems: "center",

    marginTop: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000000",
  },

  title: {
    width: 600,
    alignSelf: "center",
    fontSize: 16,
    fontWeight: 300,
    textAlign: "left",
    marginTop: 100,
    marginBottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
    boxSizing: "border-box",
  },

  cover: {
    margin: 20,
    width: "auto",
    height: 100,
  },

  table: {
    display: "flex",
    flexDirection: "row",
    alignSelf: "stretch",
    margin: 0,
  },

  info: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    borderLeft: "1px solid #000",
  },

  inputs: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 10,
    textTransform: "uppercase",
    display: "block",
  },

  value: {
    display: "block",
    marginBottom: 25,
    fontFamily: "Roboto Slab",
    fontSize: 16,
  },

  input: {
    display: "block",
    width: 600,
    padding: 15,
    fontFamily: "Roboto Slab",
    fontSize: 18,
    borderRadius: 8,
    resize: "none",
    border: "1px solid #000",
    backgroundColor: "#FFF",
    boxSizing: "border-box",
  },

  warningBox: {
    alignSelf: "stretch",
    marginRight: 20,
    padding: 15,
    border: "1px solid rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 219, 144)",
  },

  warning: {
    fontSize: 16,
    lineHeight: "24px",
  },

  code: {
    fontFamily: "Roboto Slab",
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 2,
    border: "1px solid rgba(0, 0, 0, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },

  answer: {
    position: "relative",
    width: 600,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderRadius: 8,
    fontFamily: "Roboto Slab",
    fontSize: 18,
    lineHeight: "28px",
    color: "rgb(80, 80, 80)",
    border: "1px solid #000",
    backgroundColor: "#F5F5F5",
    boxSizing: "border-box",
  },

  buttonContainer: {
    width: 600,
    display: "flex",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "center",
    padding: 30,
  },

  button: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 15,
    paddingRight: 15,
    marginLeft: 20,
    marginRight: 20,
    fontSize: 18,
    border: "solid 1px #000",
    borderRadius: "0.25rem",
    transition: "all 0.14s",
    boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
    cursor: "pointer",
  },

  buttonHovered: {
    transform: "translate(-.25rem,-.25rem)",
    boxShadow: ".25rem .25rem 0 #000",
  },

  progressContainer: {
    flex: 1,

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  progressBar: {
    width: 300,
    height: 20,
    border: "1px solid #000",
    borderRadius: 4,
  },

  progress: {
    width: "0%",
    height: "100%",
    backgroundColor: "#000",
  },
};
