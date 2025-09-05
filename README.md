# Focus Guard - Productivity Extension

A modern Chrome extension built with TypeScript for managing website access and improving focus.

## Features

- 🚫 Unlimited website filtering
- 📦 Import/Export filter lists
- ⚡ Real-time filter toggling
- 🎨 Modern, responsive UI
- 💾 Local storage persistence
- 🔒 Privacy-focused (no external data)

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Build for development (watch mode)
npm run dev

# Build for production
npm run build
```

### Installation

1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Architecture

```
src/
├── core/          # Background service worker
│   └── service.ts # Main filtering logic
├── interface/     # Options page
│   ├── dashboard.html
│   ├── dashboard.ts
│   └── dashboard.css
└── pages/         # Interceptor page
    ├── interceptor.html
    ├── interceptor.ts
    └── interceptor.css
```

## Technologies

- TypeScript
- Webpack
- Chrome Extension Manifest V3
- Declarative Net Request API

## License

MIT