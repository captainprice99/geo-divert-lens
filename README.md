# Geo-Divert Lens

A powerful visualization platform that analyzes and visualizes global flight traffic changes during geopolitical conflicts. The platform provides insights into flight density changes, route diversions, delays, and environmental impact during times of airspace restrictions.

## 🌟 Features

- **Real-time Flight Tracking**: Monitor live flight data from the OpenSky Network
- **Conflict Zone Analysis**: Visualize flight patterns around geopolitical conflict zones
- **Heatmap Visualization**: Interactive heatmaps showing flight density changes
- **Route Diversion Analysis**: Compare normal vs. diverted flight paths
- **Environmental Impact**: Calculate additional fuel consumption and CO2 emissions from detours
- **Historical Data**: Analyze flight pattern changes over time
- **Interactive Map**: Built with modern web mapping technologies for smooth user experience

## 🛠 Tech Stack

### Backend
- **Platform**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with PostGIS extension
- **Storage**: Supabase Storage for static assets
- **Edge Functions**: For serverless API endpoints

### Frontend
- **Framework**: React.js
- **State Management**: React Query + Zustand
- **Mapping**: Mapbox GL JS
- **UI Components**: Tailwind CSS + Headless UI
- **Data Fetching**: Supabase JS Client

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Supabase account
- Mapbox Access Token
- OpenSky Network API Credentials

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd geo-divert-lens
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
   OPENSKY_USERNAME=your-opensky-username
   OPENSKY_PASSWORD=your-opensky-password
   ```

4. **Set up Supabase**
   - Create a new project in the Supabase dashboard
   - Enable the PostGIS extension in the SQL editor:
     ```sql
     create extension if not exists postgis;
     ```
   - Set up database tables using the SQL from `supabase/migrations`

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app should now be running at http://localhost:3000

## 📂 Project Structure

```
geo-divert-lens/
├── public/                   # Static files
├── src/
│   ├── components/           # Reusable UI components
│   ├── features/             # Feature-based modules
│   │   ├── auth/            # Authentication
│   │   ├── flights/         # Flight tracking
│   │   ├── maps/            # Map components
│   │   └── analysis/        # Data analysis components
│   ├── lib/                 # Utility functions
│   │   ├── supabase/        # Supabase client
│   │   └── opensky/         # OpenSky API client
│   ├── pages/               # Next.js pages
│   ├── styles/              # Global styles
│   └── types/               # TypeScript type definitions
├── supabase/
│   ├── migrations/          # Database migrations
│   └── seed.sql             # Sample data
├── .env.local.example       # Example environment variables
└── package.json
```

## 🌍 API Integration

This project uses:
- **Supabase JS Client** for database operations and authentication
- **OpenSky Network API** for real-time flight data
- **Mapbox GL JS** for mapping and visualization

## 🔧 Development

### Running Tests

```bash
# Run tests
npm test
# or
yarn test
```

### Code Style
- We use ESLint and Prettier for code consistency
- TypeScript for type safety

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to a GitHub/GitLab repository
2. Import the repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Supabase Production

1. Link your local project to your Supabase project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
2. Push database migrations:
   ```bash
   npx supabase db push
   ```

## 📈 Future Enhancements

- [ ] Implement machine learning for predictive route analysis
- [ ] Add more detailed environmental impact metrics
- [ ] Support for additional data sources (e.g., FlightAware, FlightRadar24)
- [ ] Enhanced visualization of airspace restrictions
- [ ] Mobile application for on-the-go monitoring
- [ ] User accounts and saved searches
- [ ] Advanced filtering and comparison tools
- [ ] Integration with weather data
- [ ] Automated report generation

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenSky Network for providing flight data
- Supabase for the backend infrastructure
- Mapbox for mapping services
- All open-source libraries and tools used in this project
