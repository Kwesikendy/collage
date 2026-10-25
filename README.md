# Collat · Collage Workspace

Collat is the Collage ERP workspace for managing client relationships, multi-day equipment rental & branding quotations, statutory Ghanaian tax invoicing (GETFund 2.5%, NHIL 2.5%, VAT 15%), and payment collections.

## Features

- **Operations Overview (`/dashboard`)**: Live metrics for active clients, pending quotations, open invoices, monthly collections, accounts receivable, and recent activity feed.
- **Clients CRM (`/clients`, `/clients/:id`)**: Searchable directory of leads, active corporate clients, and archived accounts with linked sales documents.
- **Quotations (`/quotations`, `/quotations/:id`)**: Multi-line proposals supporting quantity, rental days (`quantity × days × unitPrice`), discounts, and automatic Ghanaian statutory tax calculation, plus one-click conversion into invoices.
- **Invoices & Payments (`/invoices`, `/invoices/:id`)**: Print-ready invoice layouts modeled on authentic Collage Ghana billing documents, with partial and full payment recording across bank transfer, mobile money, cash, and card.

## Running Locally

```bash
npm install
npm run dev
```

The development server listens on `http://0.0.0.0:3000`.
