# Bill Barkada

Bill Barkada is a small Next.js app for splitting group bills. Add people,
enter receipt items, choose who shared each item, apply service charge, tip, or
discount adjustments, track who already paid, and copy a clean payment summary
for chat.

## Features

- Add and remove people.
- Add receipt items with prices.
- Toggle which people shared each item.
- Add bill title, date, and the person who paid.
- Split service charge, tips, and discounts proportionally.
- Choose fixed tip amount or tip percentage.
- Mark each person as paid or unpaid.
- Show who owes the payer when a paid-by person is selected.
- Save the current bill locally in the browser.
- Save, load, delete, and clear local bill history.
- Copy a shareable payment summary.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Getting Started

Install dependencies:

```bash
npm install
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
```
