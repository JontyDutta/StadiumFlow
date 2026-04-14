# StadiumFlow

**Vertical: Physical Event Experience**

StadiumFlow is a dynamic, single-page web application built to enhance the attendee experience at large-scale sporting venues. By leveraging real-time data visualization and an intuitive interface, attendees can seamlessly navigate crowded events, monitor wait times, and find their optimal amenities quickly.

## Core Features

1. **Smart Queues**: Real-time simulation of wait times at various food and restroom facilities. Indicates load via color-coded tags ("Low Wait", "Med Wait", "High Wait").
2. **Find Best Option Logic**: Input your current section (e.g., 105) and instantly receive the closest recommended amenity and which zone to follow, reducing unnecessary cross-stadium traffic.
3. **Interactive Venue Map**: A fast, responsive SVG breakdown of the stands. Includes a mobile-first "Expand" modal incorporating a mock Google Map integration.
4. **Global Stadium Search**: Find stadiums globally and get live weather updates for the venue.

## UI / UX Architecture

- **Mobile First & Dark Mode**: Engineered for users on-the-go at outdoor or dimly-lit indoor events. Uses deep slate blues (`#0f172a`), contrasting primary colors (`#3b82f6`), and Google Material Symbols.
- **Glassmorphism**: Subtle blur effects over navigation nodes and modal backgrounds deliver a premium, native-app feel directly within the browser.

## Tech Stack Overview

Built strictly to be lightweight and fast.
- **HTML5**: Semantic document structure.
- **Tailwind CSS (via CDN)**: Rapid, utility-first styling without node dependencies.
- **Vanilla JavaScript**: Pure DOM manipulation, logic handling, simulation loops, and modal switching.
- **Node.js**: Minimal express server for cloud deployment.
- **Docker**: Containerized for easy deployment to Cloud Run.

## Getting Started (Local Development)

1. Clone or download this repository.
2. Run `npm install` and `npm start` to launch the server.
3. Open `http://localhost:8080` in your browser.

## Repository Structure

```text
StadiumFlow/
│
├── index.html     # Main application layout.
├── style.css      # Custom animations and modal overrides.
├── main.js        # Logic for queuing simulation and pathfinding.
├── app.js         # Node.js server for deployment.
├── stadiums.js    # Mock database of global stadiums.
├── Dockerfile     # Container configuration.
└── README.md      # Project documentation.
```
