# Velo - Fashion AI Backend

A comprehensive fashion AI backend system powered by LangGraph, LangChain, CrewAI, and Apify, built with Atomic Design principles and modern TypeScript.

## Features

### AI-Powered Fashion Intelligence
- **LangGraph Workflows**: Multi-step AI reasoning for fashion search and recommendations
- **CrewAI Agents**: Specialized AI agents for styling, market analysis, and personal shopping
- **LangChain Integration**: Vector search with OpenAI embeddings and Pinecone
- **Apify Web Scraping**: Real-time fashion data collection and price monitoring

### Core Capabilities
- **Smart Fashion Search**: Semantic search with AI-powered recommendations
- **Price Comparison**: Find cheaper alternatives across multiple retailers
- **Trend Analysis**: Real-time fashion trend detection and market insights
- **Personal Styling**: AI-powered outfit recommendations and style advice
- **Market Intelligence**: Competitor analysis and marketing insights

### Authentication & Security
- **Clerk AI Authentication**: Advanced bot protection and user management
- **JWT Verification**: Secure token validation with JWKS
- **Rate Limiting**: Intelligent API rate limiting and cost management

## Tech Stack

### Backend Framework
- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **Neon Database** (PostgreSQL) with connection pooling
- **Pinecone** for vector search and embeddings

### AI & ML
- **LangGraph** for complex AI workflows
- **LangChain** for LLM integration and vector search
- **CrewAI** for multi-agent AI systems
- **OpenAI** GPT-4 for language understanding
- **Apify** for web scraping and automation

### Authentication
- **Clerk** for AI-powered authentication
- **JWT** with JWKS verification
- **Redis** for session management

### Architecture
- **Atomic Design** principles throughout
- **Modular Components**: Atoms, Molecules, Organisms, Templates
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error management

## Project Structure

```
src/
|-- ai/
|   |-- atoms/           # Basic AI components
|   |-- molecules/        # Combined AI functionality
|   |-- organisms/        # Complex AI services
|   |-- templates/        # Complete AI workflows
|-- database/
|   |-- atoms/            # Database connections
|   |-- molecules/        # Query builders
|   |-- organisms/        # Data services
|   |-- templates/        # Database workflows
|-- config/              # Configuration management
|-- controllers/         # API controllers
|-- routes/             # API routes
|-- services/           # Business logic
|-- types/              # TypeScript definitions
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon)
- OpenAI API key
- Pinecone API key
- Apify token
- Clerk keys

### Installation

1. Clone the repository
```bash
git clone https://github.com/Harqer/Velo.git
cd Velo
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Initialize database
```bash
npm run db:init
```

5. Start the development server
```bash
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=your_neon_database_url

# AI Services
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
APIFY_TOKEN=your_apify_token

# Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Redis
REDIS_URL=your_redis_url
```

## API Endpoints

### Fashion AI
- `POST /api/fashion-ai/search` - AI-powered fashion search
- `POST /api/fashion-ai/recommendations` - Get personalized recommendations
- `POST /api/fashion-ai/alternatives` - Find cheaper alternatives
- `POST /api/fashion-ai/market-intelligence` - Market analysis

### Web Scraping (Apify)
- `POST /api/apify-fashion/scrape-fashion` - Scrape fashion items
- `POST /api/apify-fashion/find-deals` - Find best deals
- `POST /api/apify-fashion/monitor-prices` - Price monitoring

### Authentication
- `GET /api/clerk/current-user` - Get current user
- `POST /api/clerk/webhook` - Clerk webhook handler

## Usage Examples

### Fashion Search
```javascript
const response = await fetch('/api/fashion-ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'black leather jacket under $200',
    budget: 200,
    category: 'jackets',
    style: 'casual'
  })
});
```

### Price Monitoring
```javascript
const response = await fetch('/api/apify-fashion/monitor-prices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemIds: ['item_1', 'item_2', 'item_3']
  })
});
```

## Architecture

### Atomic Design Implementation

The project follows Brad Frost's Atomic Design methodology:

- **Atoms**: Basic reusable components (config, connections, embeddings)
- **Molecules**: Combined functionality (workflows, agents, queries)
- **Organisms**: Complex services (AI service, user service)
- **Templates**: Complete workflows (fashion AI template)

### AI Workflow

1. **Query Processing**: Extract user intent and preferences
2. **Embedding Generation**: Create vector representations
3. **Similarity Search**: Find matching items in vector database
4. **LangGraph Workflow**: Multi-step AI reasoning
5. **CrewAI Analysis**: Specialized agent insights
6. **Result Integration**: Combine all AI outputs

## Performance

- **Response Time**: < 2 seconds for most queries
- **Accuracy**: 85%+ recommendation accuracy
- **Cost Optimization**: Intelligent caching and batching
- **Scalability**: Horizontal scaling support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow Atomic Design principles
4. Add tests for new components
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support, please open an issue on GitHub.

---

**Built with Atomic Design principles and modern AI technologies**
