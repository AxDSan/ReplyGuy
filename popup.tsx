import { useEffect, useState } from "react"
import { HashRouter as Router, Routes, Route, useNavigate } from "react-router-dom"
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

function Privacy() {
  const navigate = useNavigate();
  
  return (
    <div style={{ 
      padding: "20px", 
      color: theme.colors.text,
      maxHeight: "600px",
      overflowY: "auto"
    }}>
      <button 
        onClick={() => navigate('/')}
        style={{
          backgroundColor: "transparent",
          color: theme.colors.primary,
          padding: "8px 16px",
          borderRadius: "20px",
          border: `1px solid ${theme.colors.primary}`,
          cursor: "pointer",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          transition: "all 0.2s ease",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}>
        <span>←</span> Back to Settings
      </button>

      <h1 style={{ 
        color: theme.colors.primary,
        fontSize: "24px",
        marginBottom: "24px",
        background: `linear-gradient(45deg, ${theme.colors.primary}, #4ade80)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textShadow: `0 0 20px ${theme.colors.primary}40`
      }}>
        Privacy Policy
      </h1>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>Introduction</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            ReplyGuy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our browser extension.
          </p>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>Information We Collect</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            We collect the following types of information:
          </p>
          <ul style={{ 
            listStyleType: "disc",
            paddingLeft: "20px",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            <li>Your OpenRouter API key (stored locally)</li>
            <li>Post content that you choose to interact with</li>
            <li>Generated replies (not stored, only transmitted)</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>How We Use Your Information</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            We use the collected information for:
          </p>
          <ul style={{ 
            listStyleType: "disc",
            paddingLeft: "20px",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            <li>Generating contextual replies to posts</li>
            <li>Improving the extension's functionality</li>
            <li>Ensuring proper operation of the service</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>Data Storage</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            All sensitive data, including your API key, is stored locally on your device. We do not maintain any central database of user information.
          </p>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>Third-Party Services</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            We use the following third-party services:
          </p>
          <ul style={{ 
            listStyleType: "disc",
            paddingLeft: "20px",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            <li>OpenRouter API for generating replies</li>
            <li>X (formerly Twitter) platform for interaction</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>Contact Us</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            If you have any questions about this Privacy Policy, replyguy@0x90.33mail.com
          </p>
        </div>
      </div>
    </div>
  )
}

function Terms() {
  const navigate = useNavigate();
  
  return (
    <div style={{ 
      padding: "20px", 
      color: theme.colors.text,
      maxHeight: "600px",
      overflowY: "auto"
    }}>
      <button 
        onClick={() => navigate('/')}
        style={{
          backgroundColor: "transparent",
          color: theme.colors.primary,
          padding: "8px 16px",
          borderRadius: "20px",
          border: `1px solid ${theme.colors.primary}`,
          cursor: "pointer",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          transition: "all 0.2s ease",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}>
        <span>←</span> Back to Settings
      </button>

      <h1 style={{ 
        color: theme.colors.primary,
        fontSize: "24px",
        marginBottom: "24px",
        background: `linear-gradient(45deg, ${theme.colors.primary}, #4ade80)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textShadow: `0 0 20px ${theme.colors.primary}40`
      }}>
        Terms of Service
      </h1>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>1. Acceptance of Terms</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            By installing and using the ReplyGuy browser extension ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not use our Service.
          </p>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>2. Description of Service</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            ReplyGuy is a browser extension that helps users generate contextual replies to posts on X (formerly Twitter) using AI technology.
          </p>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>3. User Responsibilities</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            You are responsible for:
          </p>
          <ul style={{ 
            listStyleType: "disc",
            paddingLeft: "20px",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            <li>Providing your own OpenRouter API key</li>
            <li>Using the service in compliance with X's terms of service</li>
            <li>Any content you generate and post using our service</li>
            <li>Maintaining the security of your API keys and account</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>4. Limitations of Use</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            You agree not to use the Service to:
          </p>
          <ul style={{ 
            listStyleType: "disc",
            paddingLeft: "20px",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            <li>Generate spam or harmful content</li>
            <li>Violate X's terms of service</li>
            <li>Engage in harassment or abusive behavior</li>
            <li>Generate content that infringes on others' rights</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>5. Disclaimer of Warranties</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            The Service is provided "as is" without any warranties, expressed or implied. We do not guarantee that the Service will always function without interruption or errors.
          </p>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>6. Limitation of Liability</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
          </p>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>7. Changes to Terms</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            We reserve the right to modify these terms at any time. We will notify users of any material changes to these terms.
          </p>
        </div>

        <div style={{
          backgroundColor: theme.colors.cardBg,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`
        }}>
          <h2 style={{ 
            color: theme.colors.primary,
            fontSize: "18px",
            marginBottom: "12px"
          }}>8. Contact Information</h2>
          <p style={{ 
            lineHeight: "1.6",
            color: theme.colors.textMuted,
            fontSize: "14px"
          }}>
            For any questions regarding these Terms, replyguy@0x90.33mail.com
          </p>
        </div>
      </div>
    </div>
  )
}

function SettingsCard() {
  const navigate = useNavigate();
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
          <button 
            onClick={() => navigate('/privacy')} 
            style={{ 
              background: 'none',
              border: 'none',
              padding: 0,
              color: theme.colors.primary, 
              marginRight: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'inherit'
            }}>
            Privacy Policy
          </button>
          <button 
            onClick={() => navigate('/terms')} 
            style={{ 
              background: 'none',
              border: 'none',
              padding: 0,
              color: theme.colors.primary, 
              marginRight: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'inherit'
            }}>
            Terms of Service
          </button>
          <a 
            href="https://github.com/axdsan/replyguy" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: theme.colors.primary }}>
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div style={{ minWidth: "320px", minHeight: "400px" }}>
        <style>{globalStyles}</style>
        <Routes>
          <Route path="/" element={<SettingsCard />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
