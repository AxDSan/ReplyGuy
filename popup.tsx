import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import Swal from 'sweetalert2'

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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  body {
    margin: 0;
    background-color: ${theme.colors.background};
    min-width: 320px;
    min-height: 400px;
    color: ${theme.colors.text};
    font-family: 'Inter', sans-serif;
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

  /* SweetAlert2 Custom Styles */
  .replyguy-swal {
    font-family: 'Inter', sans-serif !important;
  }

  .replyguy-swal .swal2-title {
    font-family: 'Inter', sans-serif !important;
    font-weight: 600;
  }

  .replyguy-swal .swal2-html-container {
    font-family: 'Inter', sans-serif !important;
    font-weight: 400;
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

function SettingsCard() {
  const [apiKey, setApiKey] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [modelError, setModelError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadSettings = async () => {
      const storedApiKey = await storage.get<string>("openRouterApiKey")
      const storedModel = await storage.get<string>("selectedModel")
      const isEnabled = await storage.get<boolean>("autoReplyEnabled")
      setApiKey(storedApiKey || "")
      setSelectedModel(storedModel || "mistralai/mistral-7b-instruct")
      setEnabled(isEnabled === undefined ? false : isEnabled)
    }
    loadSettings()
  }, [])

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true)
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setModels(data.data)
      } catch (error: any) {
        console.error("Failed to fetch models:", error)
        setModelError("Failed to load models. Please check your connection.")
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchModels()
  }, [])

  const saveSettings = async () => {
    await storage.set("openRouterApiKey", apiKey)
    await storage.set("selectedModel", selectedModel)
    await storage.set("autoReplyEnabled", enabled)
    Swal.fire({
      icon: 'success',
      title: 'Settings Saved!',
      showConfirmButton: false,
      timer: 1500,
      customClass: {
        popup: 'replyguy-swal'
      }
    })
  }

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
      <style>{globalStyles}</style>
      <div style={{ 
        fontSize: 24, 
        fontWeight: "bold", 
        marginBottom: 16,
        background: `linear-gradient(45deg, 
          ${theme.colors.primary}, 
          #4ade80, 
          #2dd4bf, 
          #0ea5e9, 
          #a855f7, 
          ${theme.colors.primary})`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "glow 2s ease-in-out infinite alternate, gradient 3s linear infinite",
        textShadow: `0 0 20px ${theme.colors.primary}40`
      }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>ReplyGuy <span style={{ fontSize: 10, fontWeight: 700 }}>v0.2.0</span></span>
      </div>

      <style>{`
        @keyframes glow {
          from {
            filter: drop-shadow(0 0 2px ${theme.colors.primary}40);
          }
          to {
            filter: drop-shadow(0 0 6px ${theme.colors.primary}60);
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>

      <input
        type="password"
        placeholder="OpenRouter API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: 6,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.cardBg,
          color: theme.colors.text
        }}
      />

      <div>
        <label
          style={{
            marginBottom: 8,
            display: "block",
            fontSize: 14,
            color: theme.colors.textMuted
          }}>
          Select Model
        </label>

        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 6,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.cardBg,
            color: theme.colors.text,
            marginBottom: 8
          }}
        />

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

      <button
        onClick={saveSettings}
        style={{
          backgroundColor: theme.colors.primary,
          color: theme.colors.background,
          padding: "10px",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
          fontWeight: "500",
          marginTop: 16
        }}>
        Save Settings
      </button>

      <div style={{ 
        marginTop: 24,
        padding: "16px",
        backgroundColor: theme.colors.cardBg,
        borderRadius: 6,
        fontSize: 12,
        color: theme.colors.textMuted,
        lineHeight: "1.5"
      }}>
        <div style={{ marginBottom: 12 }}>
          <strong>Current Model:</strong> <span style={{ color: theme.colors.primary, textShadow: '0 0 1.5px lime' }}>{selectedModel || "None selected"}</span>
          <br />
          <strong>Fallback Model:</strong> <span style={{ color: theme.colors.primary, textShadow: '0 0 1.5px lime' }}>mistralai/mistral-7b-instruct</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: theme.colors.text }}>Need an API Key?</strong>
          <br />
          Get one from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>OpenRouter.ai</a>
        </div>

        <div>
          <a href="/privacy" style={{ color: theme.colors.primary, marginRight: 12 }}>Privacy Policy</a>
          <a href="/terms" style={{ color: theme.colors.primary, marginRight: 12 }}>Terms of Service</a>
          <a href="https://github.com/axdsan/replyguy" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>GitHub</a>
        </div>
      </div>
    </div>
  )
}

export default SettingsCard
