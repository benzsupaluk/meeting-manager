import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../status-badge";

describe("StatusBadge", () => {
  it("renders the human readable label", () => {
    render(<StatusBadge status="confirmed" />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });
});
