import { render, screen } from "@testing-library/react";
import React from "react";

import DashboardPage from "@/app/dashboard/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(() => new Promise(() => {})),
}));

describe("DashboardPage", () => {
  it("renders loading skeleton while dashboard data is not yet loaded", () => {
    render(<DashboardPage />);
    const skeletonCards = document.querySelectorAll(
      "#dashboard-container .animate-pulse",
    );
    expect(skeletonCards.length).toBeGreaterThanOrEqual(1);
  });
});
