# GetMyTaps Delivery System Security Policy

This application handles customer delivery-note data. Security and privacy are mandatory.

## Rules for the AI-enabled version

- Never place API keys, database credentials, private keys, or tokens in browser JavaScript, HTML, GitHub Pages, screenshots, or source control.
- Store secrets only as encrypted server-side environment variables on the deployment platform.
- Send delivery-note files only to authenticated HTTPS server endpoints.
- Restrict accepted file types and enforce strict file-size and page-count limits.
- Never make uploaded delivery notes publicly addressable.
- Do not log customer names, addresses, phone numbers, email addresses, uploaded document contents, or extracted line-item data.
- Delete temporary document data after extraction unless the user explicitly saves it.
- Require user authentication before accessing shared suppliers, saved deliveries, or AI extraction.
- Enforce authorization on the server, not just in the browser.
- Use least-privilege credentials and managed encryption at rest.
- Rate-limit document-analysis endpoints.
- Validate all incoming data and validate model output against a strict schema before using it.
- Restrict CORS to the production site.
- Use secure, HttpOnly, SameSite session cookies if cookie authentication is added.
- Keep dependencies updated and enable dependency/security scanning.
- Back up the supplier database and provide deletion for saved customer deliveries.
- Keep customer data only as long as needed.

## Source-control exclusions

Never commit `.env`, `.env.*`, API keys, service-account files, exported customer delivery data, or uploaded delivery-note files.

## Current architecture

The existing GitHub Pages prototype is static. The secure automatic-reading version uses a server-side API route. The browser sends selected delivery-note pages to that route, the server sends them to the AI service using a server-only environment variable, and only structured extracted data is returned to the browser.
