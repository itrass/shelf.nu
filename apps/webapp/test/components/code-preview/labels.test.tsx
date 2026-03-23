import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("lottie-react", () => ({
  default: () => null,
}));

import { BarcodeLabel, QrLabel } from "~/components/code-preview/code-preview";

describe("QrLabel", () => {
  const baseProps = {
    title: "Camera",
    data: {
      qr: {
        id: "qr-123",
        src: "data:image/png;base64,AAA",
        size: "small",
      },
    },
  } as const;

  it("shows organization logo when branding is enabled and logo URL is provided", () => {
    render(
      <QrLabel
        {...({
          ...baseProps,
          showShelfBranding: true,
          organizationLogoUrl: "/api/image/org-logo-123",
        } as any)}
      />
    );

    const logo = screen.getByAltText("Organization logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/api/image/org-logo-123");
  });

  it("hides organization logo when branding is disabled", () => {
    render(
      <QrLabel
        {...({
          ...baseProps,
          showShelfBranding: false,
          organizationLogoUrl: "/api/image/org-logo-123",
        } as any)}
      />
    );

    expect(screen.queryByAltText("Organization logo")).not.toBeInTheDocument();
  });

  it("hides organization logo when no logo URL is provided", () => {
    render(
      <QrLabel
        {...({
          ...baseProps,
          showShelfBranding: true,
          organizationLogoUrl: null,
        } as any)}
      />
    );

    expect(screen.queryByAltText("Organization logo")).not.toBeInTheDocument();
  });
});

describe("BarcodeLabel", () => {
  const baseProps = {
    title: "Camera",
    data: {
      type: "EAN13",
      value: "1234567890123",
    },
  } as const;

  it("shows organization logo when branding is enabled and logo URL is provided", () => {
    render(
      <BarcodeLabel
        {...({
          ...baseProps,
          showShelfBranding: true,
          organizationLogoUrl: "/api/image/org-logo-123",
        } as any)}
      />
    );

    const logo = screen.getByAltText("Organization logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/api/image/org-logo-123");
  });

  it("hides organization logo when branding is disabled", () => {
    render(
      <BarcodeLabel
        {...({
          ...baseProps,
          showShelfBranding: false,
          organizationLogoUrl: "/api/image/org-logo-123",
        } as any)}
      />
    );

    expect(screen.queryByAltText("Organization logo")).not.toBeInTheDocument();
  });

  it("hides organization logo when no logo URL is provided", () => {
    render(
      <BarcodeLabel
        {...({
          ...baseProps,
          showShelfBranding: true,
          organizationLogoUrl: null,
        } as any)}
      />
    );

    expect(screen.queryByAltText("Organization logo")).not.toBeInTheDocument();
  });
});
