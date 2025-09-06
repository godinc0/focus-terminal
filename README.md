# Focus terminal - Chrome Productivity Extension

I created this small plugin for my own use, since most extensions track or collect data. This is a lightweight open-source extension designed to quickly block and unblock websites.

  Contributions are welcome. The extension is simple, with no data collection and no tracking. It really doesn’t get any simpler.

  Privacy-focused Chrome extension built with TypeScript for managing website access and improving focus.

  Absolutely no tracking or data collection.

![Focus Terminal Dashboard](public/images/dash.png)
![Denied page](public/images/denied.png)

## Features

- 🚫 Unlimited website filtering
- 📦 Import/Export filter lists
- ⚡ Real-time filter toggling
- 💾 Local storage persistence
- 🔒 Privacy-focused (no external data)

## Development

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
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

- **TypeScript** - Type-safe development
- **Vite** - Modern build tool with instant HMR
- **@crxjs/vite-plugin** - Chrome extension development
- **Chrome Extension Manifest V3** - Latest extension API
- **Declarative Net Request API** - Website filtering

## License

MIT