import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser, logout } from './helpers/auth';

test.describe('Authentication', () => {

    test('login page renders correctly', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('#emid')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('text=รหัสพนักงาน')).toBeVisible();
    });

    test('admin login redirects to admin dashboard', async ({ page }) => {
        await loginAsAdmin(page);
        expect(page.url()).toContain('dashboard');
    });

    test('login with wrong password shows error or stays on login', async ({ page }) => {
        await page.goto('/login');

        const announcementBtn = page.locator('button:has-text("อ่านประกาศ")');
        if (await announcementBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await announcementBtn.click();
            await page.waitForTimeout(1000);
        }

        await page.fill('#emid', '999999');
        await page.fill('#password', 'wrongpassword999');
        await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');
        await page.waitForTimeout(3000);

        const hasError = await page.locator('.text-red-500, .text-red-600, [class*="error"]').isVisible().catch(() => false);
        const stayedOnLogin = page.url().includes('login');
        expect(hasError || stayedOnLogin).toBeTruthy();
    });

    test('protected page redirects to login without auth', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/login/);
    });

    test('logout redirects away from protected area', async ({ page }) => {
        await loginAsAdmin(page);
        await logout(page);
        await page.waitForTimeout(1000);
        await page.goto('/dashboardadmin');
        await expect(page).toHaveURL(/login/);
    });
});
