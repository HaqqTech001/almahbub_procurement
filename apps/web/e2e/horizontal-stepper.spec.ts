import { expect, test, type Locator } from "@playwright/test";

// Opt in against Vite dev; the normal production-preview suite has no test fixtures.
test.skip(!process.env.HAMD_STEPPER_DEV_URL, "Set HAMD_STEPPER_DEV_URL to the Vite development server.");
test.use({ baseURL: process.env.HAMD_STEPPER_DEV_URL ?? "http://127.0.0.1:4175" });
async function aligned(stepper: Locator, scrolling = false) {
  const geometry = await stepper.evaluate((root) => {
    const circles = [
      ...root.querySelectorAll(".hamd-horizontal-stepper__circle"),
    ].map((el) => el.getBoundingClientRect());
    const lines = [
      ...root.querySelectorAll(".hamd-horizontal-stepper__connector"),
    ].map((el) => el.getBoundingClientRect());
    const labels = [
      ...root.querySelectorAll(".hamd-horizontal-stepper__label"),
    ];
    return {
      centers: circles.map((box) => box.y + box.height / 2),
      aligned: lines.every(
        (line, i) =>
          Math.abs(
            line.y + line.height / 2 - (circles[i]!.y + circles[i]!.height / 2),
          ) < 1 &&
          Math.abs(line.x - (circles[i]!.x + circles[i]!.width / 2)) < 1 &&
          Math.abs(
            line.right - (circles[i + 1]!.x + circles[i + 1]!.width / 2),
          ) < 1,
      ),
      above: labels.every(
        (label, i) => label.getBoundingClientRect().bottom < circles[i]!.top,
      ),
      fits: root.scrollWidth <= root.clientWidth + 1,
      readable: labels.every(
        (label) => label.scrollWidth <= label.clientWidth + 1,
      ),
    };
  });
  expect(
    Math.max(...geometry.centers) - Math.min(...geometry.centers),
  ).toBeLessThan(1);
  expect(geometry.aligned).toBe(true);
  expect(geometry.above).toBe(true);
  expect(geometry.readable).toBe(true);
  expect(geometry.fits).toBe(!scrolling);
}

for (const width of [320, 360, 375, 390, 430, 768, 1280]) {
  test(`horizontal wizard and registration at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/e2e/fixtures/stepper.html", {
      waitUntil: "domcontentloaded",
    });
    const stepper = page.locator(".hamd-horizontal-stepper");
    await expect(stepper).toBeVisible();
    await aligned(stepper);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await expect(stepper.getByRole("button")).toHaveCount(0);
    for (let i = 0; i < 2; i++)
      await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(stepper.locator('[data-state="completed"]')).toHaveCount(2);
    await aligned(stepper);
    await stepper.screenshot({
      path: testInfo.outputPath(`wizard-${width}.png`),
    });
    for (let i = 0; i < 2; i++)
      await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "title", exact: true }),
    ).toBeFocused();
    await expect(stepper.locator('[aria-current="step"]')).toHaveAttribute(
      "data-state",
      "error",
    );
    await expect(stepper.getByRole("button", { name: /Review/ })).toHaveCount(
      0,
    );
    await aligned(stepper);
    await stepper.screenshot({
      path: testInfo.outputPath(`wizard-error-${width}.png`),
    });

    await page.goto("/e2e/fixtures/stepper.html?mode=register");
    await aligned(stepper);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(stepper.locator('[aria-current="step"]')).toHaveAttribute(
      "data-state",
      "error",
    );
    await expect(
      page.getByRole("textbox", { name: /first name/i }),
    ).toBeFocused();
    await stepper.screenshot({
      path: testInfo.outputPath(`registration-${width}.png`),
    });

    await page.goto("/e2e/fixtures/stepper.html?mode=many");
    if (width < 792) await aligned(stepper, true);
    await page.getByRole("button", { name: "Last stage" }).click();
    await expect(stepper.locator('[aria-current="step"]')).toHaveText(
      /Stage 9/,
    );
    expect(
      await stepper.evaluate((root) => {
        const current = root
          .querySelector('[aria-current="step"]')!
          .getBoundingClientRect();
        const box = root.getBoundingClientRect();
        return current.left >= box.left - 1 && current.right <= box.right + 1;
      }),
    ).toBe(true);
  });
}
