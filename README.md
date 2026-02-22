# Annual Savings Tracker

A full-stack application to track your yearly expenses, import data from Excel, and automatically categorize transactions using AI.

## Features

- **Excel/CSV Import:** Seamlessly import transactions without headers; the system automatically detects debit/credit columns and assumes mappings.
- **AI Auto-Categorization:** Uses the Vercel AI SDK (`@ai-sdk/google` with Gemini API) to automatically categorize uncategorized transactions based on descriptions, with a local fallback to Ollama.
- **Dashboard & Statistics:** View comprehensive expense statistics and track spending patterns.
- **Transaction Management:** Filter transactions by type and utilize bulk delete capabilities.
- **Accessible UI:** Built with semantic HTML and modern CSS methodologies, ensuring accessibility compliance.
- **Code Quality:** Configured with BiomeJS for fast, reliable linting and formatting.

## Tech Stack

### Frontend
- **React 18** & **Vite**
- **TailwindCSS** & **PostCSS** (for styling)
- **Lucide React** (icons)

### Backend
- **Node.js** & **Express**
- **SQLite 3** (Database)

### AI & Tools
- **Vercel AI SDK** (`ai`, `@ai-sdk/google`)
- **Ollama** (`ollama-ai-provider-v2`) fallback for local AI processing.

### Testing & Linting
- **Vitest** (Unit Testing)
- **Playwright** (End-to-End Testing)
- **BiomeJS** (Linting & Formatting)

## Prerequisites

Before running the project locally, ensure you have the following installed:

- Node.js (v18 or v20 recommended)
- [Yarn](https://yarnpkg.com/) (Preferred package manager for this project; avoid using `npm`)
- [Ollama](https://ollama.com/) (If you plan to use local AI fallback models)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/abrjagad/annual-savings-tracker.git
   cd annual-savings-tracker
   ```

2. **Install dependencies**
   Ensure you use `yarn` to install dependencies and respect the `yarn.lock` file.
   ```bash
   yarn install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your required keys (e.g., Gemini API key):
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

4. **Start the Development Servers**
   This single command concurrently runs both the Express backend (Nodemon) and the Vite frontend client:
   ```bash
   yarn dev
   ```

## Available Scripts

In the project directory, you can run the following Yarn commands:

- `yarn dev`: Concurrently starts the backend server and frontend Vite development server.
- `yarn build`: Builds the client application for production using Vite.
- `yarn test`: Runs the Vitest test suite (excludes Playwright `tests/` directory).
- `yarn test:e2e`: Runs Playwright end-to-end tests in headless mode.
- `yarn test:e2e:ui`: Opens the Playwright UI mode for interactive E2E testing.
- `yarn lint`: Runs BiomeJS to lint the codebase.
- `yarn format`: Automatically formats the codebase using BiomeJS.
- `yarn biome:check`: Runs BiomeJS to check both formatting and linting rules.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
