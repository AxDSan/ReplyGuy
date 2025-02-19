export const buttonStyles = {
  backgroundColor: "transparent",
  color: "rgb(113, 118, 123)",
  border: "none",
  padding: "0",
  borderRadius: "9999px",
  fontSize: "13px",
  fontWeight: "400",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  transition: "color 0.2s ease",
  marginLeft: "0",
  height: "20px",
  position: "relative",
  minWidth: "20px",
  justifyContent: "center",
  fontFamily: "TwitterChirp, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  ':hover': {
    color: "#1d9bf0",
    backgroundColor: "rgba(29, 155, 240, 0.1)"
  }
}

export const loadingStyles = {
  ...buttonStyles,
  backgroundColor: "#00ff9d30",
  cursor: "not-allowed"
}