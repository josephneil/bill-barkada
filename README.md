# Bill Barkada

Bill Barkada is a small Next.js app for splitting group bills. Add people,
enter receipt items, choose who shared each item, apply service charge, tip, or
discount adjustments, track who already paid, and share a clean receipt-style
summary.

## Features

- Add and remove people.
- Add receipt items with prices.
- Toggle which people shared each item.
- Add bill title, date, and the person who paid.
- Split service charge, tips, and discounts proportionally.
- Choose fixed tip amount or tip percentage.
- Mark each person as paid or unpaid.
- Show who owes the payer when a paid-by person is selected.
- Review a receipt-style summary with per-person breakdowns.
- Export the receipt summary as a PNG image.
- Create compressed share links for frontend-only bill sharing.
- Save bills online with PostgreSQL-backed public view and secret edit links.
- Check non-blocking validation warnings before sharing.
- Save the current bill locally in the browser.
- Save, load, delete, and clear local bill history.
- Copy a shareable payment summary.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL

## Getting Started

Install dependencies:

```bash
npm install
```

Configure PostgreSQL:

```bash
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npm run build
npm run prisma:generate
```
