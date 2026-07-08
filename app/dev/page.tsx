import { notFound } from "next/navigation";
import { CalendarApp } from "@/components/CalendarApp";
import type { Category } from "@/lib/types";

// Local-only UI sandbox with fixture data (no auth, no DB). 404s in production.
export default function DevSandbox() {
  if (process.env.NODE_ENV === "production") notFound();

  const categories: Category[] = [
    { id: 1, name: "Holly: David", color: "#5677BE", is_custody: true, holder: "me", sort: 1 },
    { id: 2, name: "Holly: Harriet", color: "#C46484", is_custody: true, holder: "coparent", sort: 2 },
    { id: 3, name: "Activity", color: "#4F9D7F", is_custody: false, holder: null, sort: 3 },
    { id: 4, name: "Vacation", color: "#D9A13B", is_custody: false, holder: null, sort: 4 },
    { id: 5, name: "Trip", color: "#8B6FBF", is_custody: false, holder: null, sort: 5 },
  ];

  return (
    <CalendarApp
      sandbox
      categories={categories}
      initialEvents={[
        { id: "e1", title: "Hawaii vacation", category_id: 4, start_date: "2026-08-10", end_date: "2026-08-21", notes: null },
        { id: "e2", title: "Tahoe weekend", category_id: 5, start_date: "2026-07-17", end_date: "2026-07-19", notes: null },
        { id: "e3", title: "Farmers market 5k", category_id: 3, start_date: "2026-07-25", end_date: "2026-07-25", notes: null },
      ]}
      pattern={{
        anchor_date: "2026-06-24",
        cycle: [
          { holder: "me", months: 1 },
          { holder: "coparent", months: 1 },
        ],
      }}
      initialOverrides={[]}
    />
  );
}
