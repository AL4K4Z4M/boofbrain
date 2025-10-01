# boofbrain
The new boof

## Project Structure

```
boofbrain/
├── server.js              # Main Node.js server file
├── package.json           # Node.js dependencies and scripts
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── public/               # Static files served to clients
│   ├── index.html        # Main homepage
│   ├── about.html        # About page
│   ├── contact.html      # Contact page
│   ├── 404.html          # 404 error page
│   ├── css/              # Stylesheets
│   │   └── styles.css    # Main stylesheet
│   ├── js/               # Client-side JavaScript
│   │   └── main.js       # Main JavaScript file
│   └── images/           # Images and media files
└── README.md             # This file
```

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AL4K4Z4M/boofbrain.git
cd boofbrain
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration (optional):
```
PORT=3000
NODE_ENV=development
```

### Running the Application

#### Development mode (with auto-restart):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your .env file).

## Features

- Express.js server setup
- Static file serving
- Multiple HTML pages (Home, About, Contact, 404)
- Responsive CSS design
- Client-side JavaScript with form handling
- API endpoint example (`/api/health`)
- Environment variable configuration

## API Endpoints

- `GET /` - Homepage
- `GET /about.html` - About page
- `GET /contact.html` - Contact page
- `GET /api/health` - Health check endpoint

## Development

### Adding New Pages
1. Create a new HTML file in the `public/` directory
2. Link to it from existing pages
3. Add styles in `public/css/styles.css`
4. Add JavaScript functionality in `public/js/main.js`

### Adding New API Endpoints
Add new routes in `server.js`:
```javascript
app.get('/api/your-endpoint', (req, res) => {
  res.json({ message: 'Your response' });
});
```

## License
ISC
