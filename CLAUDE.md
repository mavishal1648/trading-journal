# Trading Journal

## Stack
- Next.js 15 (App Router, Server Components, Server Actions)
- TypeScript (strict mode)
- Tailwind CSS v4 + shadcn/ui (all UI components)
- Supabase (Postgres DB + Storage for screenshot WebP files)
- Prisma (ORM)
- Recharts via shadcn charts
- browser-image-compression (client-side WebP conversion)

## Project Structure
```
src/
├── app/              # Next.js App Router pages
│   ├── dashboard/    # Home page with stats & charts
│   ├── trades/       # Trade CRUD (list, new, [id], [id]/edit)
│   ├── analytics/    # Monthly analytics & performance
│   └── import/       # MT5 CSV import
├── components/
│   ├── ui/           # shadcn/ui primitives (DO NOT edit directly)
│   └── *.tsx         # App-specific components
└── lib/
    ├── constants.ts  # SSOT: instruments, tick values, correlated groups, enums
    ├── types.ts      # Shared TypeScript types (derived from Prisma)
    ├── prisma.ts     # Prisma client singleton
    ├── supabase.ts   # Supabase client
    ├── actions/      # Server actions (all DB mutations)
    ├── queries/      # Read queries (reused across pages)
    └── utils/        # Helpers: format, pnl, image conversion
```

## Conventions
- **SSOT:** All constants in `src/lib/constants.ts`. Never hardcode instrument names, tick values, or enum values elsewhere.
- **No duplication:** One `TradeForm` component for both create & edit. Shared query functions in `lib/queries/`.
- **Server actions** for all mutations. Pages never import Prisma directly.
- **shadcn/ui** for all UI components. Don't create custom components when shadcn has one.
- **Types** from `src/lib/types.ts`. Don't redeclare types that exist there.
- **Formatters** from `src/lib/utils/format.ts` for currency, dates, percentages.

## Commands
- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npx prisma migrate dev` — Run migrations
- `npx prisma generate` — Regenerate Prisma client
- `npx prisma studio` — Open Prisma Studio (DB GUI)

## Instruments
- NQ: E-mini Nasdaq 100 (tick: 0.25, value: $5.00)
- ES: E-mini S&P 500 (tick: 0.25, value: $12.50)
- Correlated group: "Index Futures" = [NQ, ES]

## Screenshots
- Max 2 per trade
- Converted to WebP client-side before upload
- Stored in Supabase Storage bucket `screenshots`
- Only URL stored in DB
