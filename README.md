# 🤖 ReplyGuy

A browser extension that adds AI-powered reply capabilities to your 𝕏 experience. Built with [Plasmo](https://www.plasmo.com/) and powered by [OpenRouter](https://openrouter.ai/).

![ReplyGuy](https://i.imgur.com/jlCiWoT.png)

Support me!
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y7189H2F)

## ✨ Features

- 🤖 One-click AI-generated replies to posts
- 🎯 Context-aware responses that maintain conversation flow
- 🎨 Modern, clean UI that integrates seamlessly with 𝕏
- 🔄 Real-time post detection and button injection
- 🎛️ Support for multiple AI models through OpenRouter
- 🔒 Enterprise-grade API key security

## 🔐 Security

ReplyGuy implements multiple layers of security to protect your API key:

1. **Encryption**:

   - AES-GCM 256-bit encryption for API key storage
   - Unique salt and IV for each encryption
   - PBKDF2 key derivation with 100,000 iterations

2. **Secure Storage**:

   - Keys stored in browser's protected local storage area
   - Extension-specific encryption keys derived from extension ID
   - No plaintext storage of sensitive data

3. **Access Control**:

   - API keys are only accessible within the extension context
   - Memory-safe handling of sensitive data
   - Automatic cleanup of decrypted data

4. **Best Practices**:
   - Zero trust architecture
   - Principle of least privilege
   - Secure error handling
   - No external transmission of keys

## 🚀 Installation

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

## 🔧 Configuration

1. Get your API key from [OpenRouter](https://openrouter.ai/)
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
├── contents/          # Content scripts
│   └── content.tsx    # Main content script
├── popup.tsx          # Extension popup UI
├── background.ts      # Background service worker
└── assets/           # Static assets
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