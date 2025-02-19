# 🤖 ReplyGuy

A browser extension that adds AI-powered reply capabilities to your 𝕏 experience. Built with [Plasmo](https://www.plasmo.com/) and powered by [OpenRouter](https://openrouter.ai/).

![ReplyGuy](https://fal.media/files/rabbit/9jKCne1JZQne7SbpHkJrp.png)

Support me!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y7189H2F)

## ✨ Features

- 🤖 One-click AI-generated replies to posts
- 🎯 Context-aware responses that maintain conversation flow
- 🎨 Modern, clean UI that integrates seamlessly with 𝕏
- 🔄 Real-time post detection and button injection
- 🎛️ Support for multiple AI models through OpenRouter
- 🔒 Enterprise-grade API key security

## 🔐 API Key Security

ReplyGuy ensures API key security through:

* AES-GCM 256-bit encryption with unique salt and IV, and PBKDF2 key derivation
* Secure storage in the browser's protected local storage area with extension-specific encryption keys
* Access control measures, including context-specific access, memory-safe handling, and automatic cleanup
* Implementation of best practices, such as zero trust architecture, principle of least privilege, secure error handling, and no external key transmission

## 🚀 Local Development

1. Clone this repository:

```bash
git clone https://github.com/axdsan/replyguy.git
cd replyguy
```

2. Install dependencies:

```bash
pnpm install
```

3. Run in development mode:

```bash
pnpm dev
```

4. Build for production:

```bash
pnpm build
```

## 📦 Browser Installation

### Chrome/Chromium-based browsers

1. Build the extension using the steps above
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the `build/chrome-mv3-dev` directory from your build output

### Firefox

1. Build the extension using the steps above
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to your build directory and select the `build/firefox-mv2-dev/manifest.json` file

### Edge

1. Build the extension using the steps above
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" using the toggle on the left sidebar
4. Click "Load unpacked"
5. Select the `build/chrome-mv3-dev` directory from your build output

Note: The extension needs to be rebuilt and reloaded when you make changes to the code.

## 🔧 Configuration
![ReplyGuy](https://i.imgur.com/jlCiWoT.png)

1. Get your API key from [OpenRouter](https://openrouter.ai/settings/keys)
2. Click the ReplyGuy extension icon in your browser
3. Enter your OpenRouter API key
4. Select your preferred AI model
5. Enable auto-reply
6. Save settings

## 🎮 Usage

1. Navigate to 𝕏
2. Look for the 🤖 button next to the reply button on any post
3. Click the button to generate and submit an AI-powered reply
4. The extension will automatically generate and post a contextually relevant reply

## 🧩 Supported Models

ReplyGuy supports all models available through OpenRouter, including:

- Mistral-7B
- Claude
- GPT-4
- And many more!

## 🛠️ Development

This extension is built with:

- [Plasmo Framework](https://www.plasmo.com/) - Browser extension framework
- [React](https://reactjs.org/) - UI library
- [OpenRouter](https://openrouter.ai/) - AI model provider
- TypeScript - Programming language

### Project Structure

```
replyguy/
├── .github/
│   └── workflows/       # CI/CD workflow configurations
├── assets/             # Static assets
│   └── icon.png
├── contents/
│   ├── components/     # React components
│   │   └── ReplyGuyButton.tsx
│   ├── styles/        # Styling configurations
│   │   └── buttonStyles.ts
│   ├── utils/         # Utility functions
│   │   ├── handlers/  # Event handlers
│   │   ├── services/  # Service integrations
│   │   └── types.ts   # TypeScript type definitions
│   └── content.tsx    # Main content script
├── background.ts      # Background service worker
├── popup.tsx         # Extension popup UI
└── package.json      # Project configuration
```

## 🔍 Selector Monitoring

ReplyGuy uses Plasmo's selector monitoring system to ensure reliability:

- Automatic detection of broken selectors
- Email notifications when 𝕏 DOM structure changes
- Easy maintenance and updates

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This extension is not affiliated with 𝕏 or OpenRouter. Use it responsibly and in accordance with 𝕏 terms of service. By using this extension, you agree to release the author and contributors from any issues, problems, or responsibilities that may arise from its use or misuse.