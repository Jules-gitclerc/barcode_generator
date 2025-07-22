# Barcode & QR Code Generator

This project is a React + TypeScript web application that lets you create QR codes and barcodes (EAN-13 or Code128) from any text or URL. It uses Vite and Tailwind CSS for a fast development experience and modern styling.

## Features

- Generate QR codes, EAN-13 and Code128 barcodes
- Live preview while typing
- Download generated code as PNG (for QR codes) or SVG (for barcodes)
- Light and dark theme toggle
- Works entirely in the browser with no server needed

## Local development

```bash
cd app
npm install
npm run dev
```

This starts Vite in development mode and opens the app at `http://localhost:5173` by default.

## Deployment

Because the site is a Vite project, it can be deployed easily on platforms like **Vercel**, **Netlify**, or **Render**.

1. Push the contents of this repository to your Git provider.
2. Create a new project on the chosen platform and select this repository.
3. Set the build command to `npm run build` and the publish directory to `app/dist`.
4. Deploy.

After deployment, you will get a public URL where the generator is accessible.

## License

This project is released under the MIT License.
