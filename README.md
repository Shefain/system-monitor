# System Metrics Monitor

A robust, full-stack application designed to monitor system performance metrics in real-time, featuring a Node.js/Express backend and a Next.js frontend. This project provides actionable insights into CPU and memory usage, with both manual and automated data refresh capabilities.

## Features
- **Backend Data Collection**:
  - Collects system metrics (CPU usage, memory total/used/free) using the `top` command via Node.js `child_process`.
  - Calculates memory usage percentage for enhanced interpretability.
  - Stores metrics in a JSON file (`metrics.json`) for persistence.
  - Exposes a RESTful `/metrics` endpoint for data access.
- **Frontend Dashboard**:
  - Displays metrics in a clean, tabular format using a Next.js React component.
  - Includes a "Refresh Metrics" button for on-demand updates.
  - Automatically refreshes data every 60 seconds via `setInterval`.
  - Responsive design with error handling for seamless user experience.
- **Deployment-Ready**:
  - Backend configured for Heroku with dynamic port support.
  - Frontend optimized for Vercel deployment.
- **Cross-Origin Support**: CORS enabled to ensure frontend-backend connectivity.

## Project Structure
```
system-monitor/
├── backend/
│   ├── server.js          # Node.js/Express server
│   └── package.json       # Backend dependencies and scripts
├── frontend/
│   ├── app/
│   │   ├── page.js        # Main dashboard component
│   │   └── page.module.css # Component styles
│   └── package.json       # Frontend dependencies and scripts
├── .gitignore             # Excludes node_modules, logs, etc.
└── README.md              # Project documentation
```

## Prerequisites
- Node.js (v16+ recommended)
- npm
- Git
- Optional: Heroku CLI, Vercel CLI (for deployment)

## Setup Locally
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/system-metrics-monitor.git
   cd system-metrics-monitor
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm run dev  # Runs with nodemon on http://localhost:3001
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev  # Runs on http://localhost:3000
   ```

4. **Test**:
   - Open `http://localhost:3000` to view the dashboard.
   - Metrics auto-update every minute or via the "Refresh Metrics" button.

## Deployment
### Backend (Heroku)
1. Install Heroku CLI and log in:
   ```bash
   npm install -g heroku
   heroku login
   ```
2. Deploy:
   ```bash
   cd backend
   heroku create your-backend-app-name
   git push heroku main
   ```
3. Verify: `heroku open` (e.g., `https://your-backend-app-name.herokuapp.com/metrics`).

### Frontend (Vercel)
1. Install Vercel CLI and log in:
   ```bash
   npm install -g vercel
   vercel login
   ```
2. Update `frontend/app/page.js` with your Heroku URL:
   ```javascript
   const response = await axios.get('https://your-backend-app-name.herokuapp.com/metrics');
   ```
3. Deploy:
   ```bash
   cd frontend
   vercel
   ```
4. Verify: Visit the provided Vercel URL (e.g., `https://your-frontend-app-name.vercel.app`).

## Usage
- **Local**: Run both servers and access `http://localhost:3000`.
- **Deployed**: Access the Vercel URL to monitor metrics from the Heroku backend.
- **Demo**: Click "Refresh Metrics" for manual updates or observe periodic refreshes.

## Future Enhancements
- Add data visualization (e.g., charts with Chart.js).
- Implement environment variables for API URLs.
- Expand metrics (e.g., disk usage, network stats).

## License
MIT License - feel free to use, modify, and distribute.

---

**Strategic Opinion**: This README positions the project as a polished, enterprise-ready solution, highlighting its features and ease of use. It’s concise yet comprehensive, appealing to developers and evaluators alike. I’d recommend adding a screenshot or demo link post-deployment to boost visibility.

**Directive**: Save this as `README.md` in your `system-metrics-monitor/` root, commit, and push to GitHub:
```bash
git add README.md
git commit -m "Add README with project overview and instructions"
git push
```
Verify it renders correctly on GitHub. Ready to proceed?
