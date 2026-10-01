import { fireEvent, render, screen, within } from "@testing-library/react";
import { domAnimation, LazyMotion } from "framer-motion";
import { describe, expect, it } from "vitest";
import App from "./App";

const renderApp = () =>
  render(
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>,
  );

describe("App smoke test", () => {
  it("renders the name, every section and no private details", () => {
    const { container } = renderApp();
    expect(screen.getByRole("heading", { level: 1, name: "Paing Min Htet" })).toBeInTheDocument();
    for (const name of [/Hi, I'm Min/, /event-driven order pipeline/i, /Where I've worked/, /Things I've built/, /Let's talk/]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    expect(container.textContent).not.toMatch(/Continental/);
    // No phone numbers anywhere on the page (generic SG pattern; never hard-code the real one)
    expect(container.textContent).not.toMatch(/\+65|\b[3689]\d{3}[\s-]?\d{4}\b/);
  });

  it("shows the job history from the résumé", () => {
    renderApp();
    const exp = document.getElementById("experience");
    for (const org of ["TikTok / ByteDance", "SAP", "Nanyang Technological University"]) {
      expect(within(exp).getByText(org)).toBeInTheDocument();
    }
  });

  it("filters projects by skill and reflects it in the URL", () => {
    renderApp();
    const projects = document.getElementById("projects");
    fireEvent.click(within(projects).getByRole("button", { name: "Java" }));
    expect(location.search).toBe("?skill=java");
    expect(within(projects).getByText(/1 of 7 projects use Java/)).toBeInTheDocument();
    fireEvent.click(within(projects).getByRole("button", { name: "Clear filter" }));
    expect(location.search).toBe("");
  });

  it("opens a project dialog with a deep link", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /World Cup 2026 Scoreboard/ }));
    expect(location.hash).toBe("#project/world-cup-2026");
    const dialog = screen.getByRole("dialog", { name: "World Cup 2026 Scoreboard" });
    expect(within(dialog).getByRole("link", { name: /Live demo/ })).toHaveAttribute(
      "href",
      "https://philipleemintar.github.io/world_cup_scoreboard_2026/",
    );
  });
});
