import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

// Create a storage instance
const storage = new Storage()

interface Model {
  id: string
  name: string
  description: string
  pricing: {
    prompt: string
    completion: string
    request: string
  }
  context_length: number
  top_provider: {
    context_length: number
    max_completion_tokens: number
    is_moderated: boolean
  }
  architecture: {
    modality: string
  }
}

// Modern theme constants
const theme = {
  colors: {
    background: "#1a1b1e",
    cardBg: "#25262b",
    primary: "#00ff9d",
    secondary: "#0ea5e9",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    border: "#2d2e33",
    success: "#22c55e"
  }
}

// Add global styles
const globalStyles = `
  body {
    margin: 0;
    background-color: ${theme.colors.background};
    min-width: 320px;
    min-height: 400px;
    color: ${theme.colors.text};
  }

  * {
    box-sizing: border-box;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.background};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.textMuted};
  }
`

function ModelCard({
  model,
  isSelected,
  onClick
}: {
  model: Model
  isSelected: boolean
  onClick: () => void
}) {
  // Helper function to format numbers safely
  const formatNumber = (value: number | null | undefined) => {
    return value ? value.toLocaleString() : "N/A"
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        cursor: "pointer",
        backgroundColor: isSelected
          ? `${theme.colors.primary}15`
          : "transparent",
        borderRadius: 4,
        marginBottom: 8,
        transition: "all 0.2s ease",
        border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
        "&:hover": {
          backgroundColor: `${theme.colors.primary}10`,
          borderColor: theme.colors.primary
        }
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: theme.colors.primary
          }}>
          {model.name || "Unknown Model"}
        </div>
        <div
          style={{
            fontSize: 11,
            color: theme.colors.textMuted,
            backgroundColor: theme.colors.background,
            padding: "2px 6px",
            borderRadius: 4
          }}>
          {model.architecture?.modality || "text"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: 8,
          fontSize: 12
        }}>
        <div
          style={{
            color: theme.colors.textMuted,
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}>
          <div>
            🔤 {formatNumber(model.top_provider?.context_length)} tokens max
          </div>
          <div>
            📝 {formatNumber(model.top_provider?.max_completion_tokens)}{" "}
            completion
          </div>
        </div>
        <div
          style={{
            color: theme.colors.textMuted,
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}>
          <div>💰 {model.pricing?.prompt || "N/A"}/1K prompt</div>
          <div>💰 {model.pricing?.completion || "N/A"}/1K completion</div>
        </div>
      </div>
    </div>
  )
}

function IndexPopup() {
  const [apiKey, setApiKey] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState("")
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [modelFilter, setModelFilter] = useState("")
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelError, setModelError] = useState("")

  useEffect(() => {
    // Apply global styles
    const style = document.createElement("style")
    style.textContent = globalStyles
    document.head.appendChild(style)

    // Load settings
    const loadSettings = async () => {
      try {
        const [savedApiKey, savedEnabled, savedModel] = await Promise.all([
          storage.get("openRouterApiKey"),
          storage.get("enabled"),
          storage.get("selectedModel")
        ])

        if (savedApiKey) setApiKey(savedApiKey)
        if (savedEnabled) setEnabled(savedEnabled)
        if (savedModel) setSelectedModel(savedModel)
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    loadSettings()

    // Cleanup styles on unmount
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    const fetchModels = async () => {
      if (!apiKey) return

      setIsLoadingModels(true)
      setModelError("")

      try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "ReplyGuy"
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch models")
        }

        const data = await response.json()
        setModels(data.data || [])
      } catch (error) {
        console.error("Error fetching models:", error)
        setModelError("Failed to load models. Please check your API key.")
      } finally {
        setIsLoadingModels(false)
      }
    }

    if (apiKey) {
      fetchModels()
    }
  }, [apiKey])

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(modelFilter.toLowerCase())
  )

  const saveSettings = async () => {
    try {
      await Promise.all([
        storage.set("openRouterApiKey", apiKey),
        storage.set("enabled", enabled),
        storage.set("selectedModel", selectedModel)
      ])
      setStatus("Settings saved successfully!")
      setTimeout(() => setStatus(""), 2000)
    } catch (error) {
      setStatus("Error saving settings. Please try again.")
      setTimeout(() => setStatus(""), 3000)
    }
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        padding: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
        minHeight: "100vh"
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
          gap: 12,
          justifyContent: "space-between"
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: "bold",
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
            ReplyGuy
          </div>
          <div
            style={{
              fontSize: 12,
              color: theme.colors.textMuted,
              backgroundColor: theme.colors.cardBg,
              padding: "4px 8px",
              borderRadius: 12
            }}>
            v0.0.1
          </div>
        </div>
        <a
          href="https://ko-fi.com/Y8Y7189H2F"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            transition: "transform 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)"
            }
          }}>
          <img
            src="https://ko-fi.com/img/githubbutton_sm.svg"
            alt="Support me on Ko-fi"
            style={{
              height: "28px",
              borderRadius: "4px"
            }}
          />
        </a>
      </div>

      <div
        style={{
          backgroundColor: theme.colors.cardBg,
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          border: `1px solid ${theme.colors.border}`
        }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
          OpenRouter API Key
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            style={{
              width: "100%",
              padding: "10px 12px",
              marginTop: 8,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              color: theme.colors.text,
              fontSize: 14,
              outline: "none",
              transition: "all 0.2s ease",
              "&:focus": {
                borderColor: theme.colors.primary,
                boxShadow: `0 0 0 2px ${theme.colors.primary}25`
              }
            }}
          />
        </label>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
            Model Selection
            <input
              type="text"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              placeholder="Search models..."
              style={{
                width: "100%",
                padding: "10px 12px",
                marginTop: 8,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 6,
                color: theme.colors.text,
                fontSize: 14,
                outline: "none",
                marginBottom: 8
              }}
            />
          </label>

          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              padding: 8
            }}>
            {isLoadingModels ? (
              <div
                style={{
                  padding: 12,
                  textAlign: "center",
                  color: theme.colors.textMuted
                }}>
                Loading models...
              </div>
            ) : modelError ? (
              <div
                style={{ padding: 12, textAlign: "center", color: "#ef4444" }}>
                {modelError}
              </div>
            ) : (
              filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel === model.id}
                  onClick={() => setSelectedModel(model.id)}
                />
              ))
            )}
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 16,
            cursor: "pointer"
          }}>
          <div
            style={{
              width: 42,
              height: 24,
              backgroundColor: enabled
                ? theme.colors.primary
                : theme.colors.border,
              borderRadius: 12,
              position: "relative",
              transition: "background-color 0.2s ease",
              marginRight: 12
            }}>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                top: 2,
                left: enabled ? 20 : 2,
                transition: "left 0.2s ease"
              }}
            />
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{
                opacity: 0,
                position: "absolute",
                width: "100%",
                height: "100%",
                cursor: "pointer"
              }}
            />
          </div>
          <span style={{ fontSize: 14 }}>Enable Auto-Reply</span>
        </label>
      </div>

      <button
        onClick={saveSettings}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: theme.colors.primary,
          color: "#000",
          border: "none",
          borderRadius: 6,
          fontWeight: "600",
          cursor: "pointer",
          transition: "transform 0.1s ease, opacity 0.1s ease",
          "&:hover": {
            opacity: 0.9,
            transform: "translateY(-1px)"
          },
          "&:active": {
            transform: "translateY(0)"
          }
        }}>
        Save Settings
      </button>

      {status && (
        <div
          style={{
            marginTop: 16,
            padding: "10px",
            backgroundColor: `${theme.colors.success}15`,
            color: theme.colors.success,
            borderRadius: 6,
            fontSize: 14,
            textAlign: "center",
            animation: "fadeIn 0.3s ease"
          }}>
          {status}
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          padding: "12px",
          backgroundColor: theme.colors.cardBg,
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
          fontSize: 12,
          color: theme.colors.textMuted,
          lineHeight: 1.5
        }}>
        <div style={{ marginBottom: 8, color: theme.colors.secondary }}>
          Quick Tips:
        </div>
        • Get your API key from{" "}
        <a
          href="https://openrouter.ai/"
          target="_blank"
          style={{
            color: theme.colors.primary,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" }
          }}>
          OpenRouter
        </a>
        <br />
        • Enable auto-reply to start responding
        <br />• Responses are powered by{" "}
        <span style={{ color: theme.colors.primary }}>
          {models.find((m) => m.id === selectedModel)?.name || "Mistral-7B"}
        </span>
      </div>
    </div>
  )
}

export default IndexPopup
