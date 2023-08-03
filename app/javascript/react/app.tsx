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

export interface AppProps {
  book?: {
    title: string;
    author: string;
    cover: string;
    link: string;
  };
  authenticityToken?: string;
}

const Button: FC<{
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
  const { book, authenticityToken } = props;

  const bookInfo = useRef(book);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const [nextButtonEnabled, setNextButtonEnabled] = useState(true);
  const onNextButtonClick = useCallback(() => {
    setNextButtonEnabled(false);

    const newBook = {
      title: titleInputRef.current?.value || "",
      author: authorInputRef.current?.value || "",
      cover: coverInputRef.current?.value || "",
      link: linkInputRef.current?.value || "",
    };

    fetch("train_ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        book: newBook,
        authenticity_token: authenticityToken,
      }),
    })
      .then((response) => {
        if (response.ok) {
          bookInfo.current = newBook;
          setNextButtonEnabled(true);
          setShowNewBookForm(false);
        }
      })
      .catch((error) => {
        alert("Error training AI: " + error);
      });
  }, []);

  const [showNewBookForm, setShowNewBookForm] = useState(book === undefined);
  const onShowNewFormClick = useCallback(() => {
    setShowNewBookForm(true);
  }, []);

  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);
  const [finishedTraining, setFinishedTraining] = useState(false);
  const onGenerateEmbeddingsClick = useCallback(() => {
    setGeneratingEmbeddings(true);

    fetch("train_ai/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authenticity_token: authenticityToken,
      }),
    })
      .then((response) => {
        if (response.ok) {
          setFinishedTraining(true);
        }
      })
      .catch((error) => {
        alert("Error training AI: " + error);
      });
  }, []);

  const [progress, setProgress] = useState({ page: 0, total: -1 });
  useEffect(() => {
    const cable = createConsumer("/cable");
    cable.subscriptions.create(
      { channel: "AiProgressChannel" },
      {
        received(data: { page: number; total_pages: number }) {
          const { page, total_pages } = data;
          setProgress({ page: page, total: total_pages });
        },
      }
    );
  }, []);

  const onGoToAskPageClick = useCallback(() => {
    window.location.href = "/";
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>Ask my book</h1>

      <div style={styles.content}>
        {showNewBookForm ? (
          <>
            <h2 style={styles.title}>
              Which book should the AI be trained on?
            </h2>

            <div style={styles.table}>
              <div style={styles.inputs}>
                <p>
                  <span style={styles.label}>Title</span>
                  <input
                    ref={titleInputRef}
                    style={styles.input}
                    placeholder="Book title"
                  />
                </p>

                <p>
                  <span style={styles.label}>Author</span>
                  <input
                    ref={authorInputRef}
                    style={styles.input}
                    placeholder="Author"
                  />
                </p>

                <p>
                  <span style={styles.label}>Cover image</span>
                  <input
                    ref={coverInputRef}
                    style={styles.input}
                    placeholder="Cover image URL"
                  />
                </p>

                <p>
                  <span style={styles.label}>Link to purchase</span>
                  <input
                    ref={linkInputRef}
                    style={styles.input}
                    placeholder="Amazon Link"
                  />
                </p>
              </div>
            </div>

            <div style={styles.bottomContainer}>
              <div style={{ flex: 1 }}></div>

              <Button
                style={{
                  backgroundColor: "#000",
                  color: "white",
                  opacity: nextButtonEnabled ? 1 : 0.4,
                  pointerEvents: nextButtonEnabled ? "all" : "none",
                }}
                hoverStyle={{
                  backgroundColor: "rgb(255, 144, 232)",
                  color: "black",
                }}
                onClick={onNextButtonClick}
              >
                {nextButtonEnabled ? "Next" : "Loading..."}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Train AI on this book?</h2>

            <div style={styles.table}>
              <img style={styles.cover} src={bookInfo.current?.cover} />

              <div style={styles.info}>
                <p>
                  <span style={styles.label}>Title</span>
                  <span style={styles.value}>{bookInfo.current?.title}</span>
                </p>

                <p>
                  <span style={styles.label}>Author</span>
                  <span style={{ ...styles.value, fontSize: 24 }}>
                    {bookInfo.current?.author}
                  </span>
                </p>

                <p>
                  <span style={styles.label}>Link</span>
                  <a href={bookInfo.current?.link} target="_blank">
                    <span style={{ ...styles.value, fontSize: 16 }}>
                      {bookInfo.current?.link}
                    </span>
                  </a>
                </p>

                <div style={styles.warningBox}>
                  <span
                    style={{
                      ...styles.label,
                      textAlign: "center",
                      marginBottom: 10,
                    }}
                  >
                    Attention
                  </span>
                  <span style={styles.warning}>
                    Make sure to place the PDF you want to train the AI on in
                    the <span style={styles.code}>training_data/</span> folder
                    as <span style={styles.code}>book.pdf</span> before
                    continuing!
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.bottomContainer}>
              {generatingEmbeddings ? (
                finishedTraining ? (
                  <div style={styles.progressContainer}>
                    <div style={styles.label}>
                      Done, you can now starting asking question to your PDF! ✨
                    </div>

                    <Button
                      style={{
                        marginTop: 10,
                        backgroundColor: "#000",
                        color: "white",
                      }}
                      hoverStyle={{
                        backgroundColor: "rgb(255, 144, 232)",
                        color: "black",
                      }}
                      onClick={onGoToAskPageClick}
                    >
                      {"Ask my book now"}
                    </Button>
                  </div>
                ) : (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progress,
                          width:
                            Math.round((progress.page / progress.total) * 100) +
                            "%",
                        }}
                      ></div>
                    </div>

                    <div style={{ ...styles.label, marginTop: 10 }}>
                      {progress.total !== -1
                        ? progress.total === progress.page
                          ? "Finalizing things..."
                          : "Training page " +
                            progress.page +
                            " of " +
                            progress.total
                        : "Starting AI training..."}
                    </div>
                  </div>
                )
              ) : (
                <>
                  <Button onClick={onShowNewFormClick}>
                    {"Train on a different book"}
                  </Button>

                  <Button
                    style={{ backgroundColor: "#000", color: "white" }}
                    hoverStyle={{
                      backgroundColor: "rgb(255, 144, 232)",
                      color: "black",
                    }}
                    onClick={onGenerateEmbeddingsClick}
                  >
                    {"Start AI training"}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
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
    width: 800,
    justifyContent: "center",
    alignItems: "center",

    marginBottom: 100,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000000",
  },

  title: {
    width: 800,
    alignSelf: "center",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 5,
    paddingBottom: 17,
    marginBottom: 0,
    borderBottom: "1px solid #000",
  },

  cover: {
    margin: 20,
    width: "auto",
    height: "auto",
  },

  table: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
    margin: 0,
    borderBottom: "1px solid #000",
  },

  info: {
    paddingLeft: 20,
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
    fontSize: 12,
    textTransform: "uppercase",
    display: "block",
  },

  value: {
    display: "block",
    marginBottom: 25,
    fontFamily: "Roboto Slab",
    fontSize: 32,
  },

  input: {
    display: "block",
    marginTop: 5,
    padding: 5,
    fontFamily: "Roboto Slab",
    fontSize: 18,
  },

  warningBox: {
    alignSelf: "stretch",
    marginRight: 20,
    padding: 15,
    border: "1px solid rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 144, 232)",
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

  bottomContainer: {
    display: "flex",
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 30,
  },

  button: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 15,
    paddingRight: 15,
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
