# GetMyTaps Delivery Note System

A browser-based delivery note and supplier-order workflow for GetMyTaps.

## Included
- Multi-page delivery note file selection and image previews
- Customer/order details
- Editable delivery-note items
- IN STOCK / READY TO COLLECT and ORDER statuses
- Product-code to supplier matching
- Supplier shown on both stock and order lists
- Duplicate item consolidation
- Supplier database saved in browser
- Supplier database JSON import/export
- Saved delivery history in browser
- Printable full delivery sheet / Save as PDF
- Tim RS example data

## Publish externally with GitHub Pages
In the repository on GitHub, open **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then Save. GitHub will provide the public site URL.

## Important current limitation
This first deployed version does not send uploaded delivery-note images to an AI service. Uploads are previewed locally and line items can be entered/checked in the app. Automatic extraction of customer details, products and handwritten stock ticks requires a secure server-side AI/API integration; API keys must not be placed in this public front-end repository.

## Data
Supplier mappings and saved deliveries currently use browser localStorage. Export the supplier database regularly for backup or transfer to another computer.
