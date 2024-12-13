# Figma File Extractor

This project extracts Figma layers from a Figma file URL sent by the frontend to the backend. It uses Node.js, TypeScript, and Express to handle the backend logic, including extracting and processing Figma file layers through the Figma API.

## Project Flow

1. The user sends a Figma file URL from the frontend.
2. The backend receives the Figma file URL and uses the Figma API to extract layers from the Figma file.
3. The extracted layers are returned to the frontend for further processing or display.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/get-npm) (v6 or higher)
- A Figma API token (needed to access the Figma API)

## Getting Started

### 1. Clone the repository

```
git clone https://github.com/your-repository-url.git
```

### 2. Install Dependencies

Navigate to the project directory and run:
```
npm install
```
### 3. Set Up Environment Variables

Create a .env file in the root of the project and add the following environment variables:

```
FIGMA_TOKEN=your_figma_api_token

```
### 4. Running the Application

```
npm start
```

### 5. Building the Application

```
npm run build
```