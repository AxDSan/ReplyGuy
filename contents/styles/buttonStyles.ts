export const buttonStyles = {
  backgroundColor: "#00ff9d15",
  color: "#00ff9d",
  border: "1px solid #00ff9d50",
  padding: "8px 12px",
  borderRadius: "20px",
  fontSize: "15px",
  fontWeight: "500",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.2s ease",
  marginLeft: "0",
  height: "36px",
  position: "relative",
  zIndex: "1000",
  minWidth: "36px",
  justifyContent: "center",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
}

export const loadingStyles = {
  ...buttonStyles,
  backgroundColor: "#00ff9d30",
  cursor: "not-allowed"
}