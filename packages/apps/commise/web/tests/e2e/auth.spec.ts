import { test, expect } from '@playwright/test';

test.describe('auth pages', () => {
    test('sign-in page renders', async ({ page }) => {
        await page.goto('/sign-in');

        await expect(page).toHaveTitle(/Commise/);
        await expect(page.locator('text=Sign in')).toBeVisible();
    });

    test('sign-up page renders', async ({ page }) => {
        await page.goto('/sign-up');

        await expect(page).toHaveTitle(/Commise/);
        await expect(page.locator('text=Sign up')).toBeVisible();
    });
});

test.describe('route protection', () => {
    test('protected route redirects to sign-in', async ({ page }) => {
        await page.goto('/profile');

        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('public routes are accessible', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Commise')).toBeVisible();
    });
});
