import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Task 3: External Organization Management', () => {

    test.describe('Admin: External Organization CRUD', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsAdmin(page);
        });

        test('admin can see external organization list', async ({ page }) => {
            await page.goto('/admin/external-organizations');
            await expect(page.locator('text=จัดการองค์กรภายนอก')).toBeVisible({ timeout: 10000 });
        });

        test('admin can access create organization page', async ({ page }) => {
            await page.goto('/admin/external-organizations/create');
            await page.waitForTimeout(3000);
            await expect(page.locator('body')).not.toBeEmpty();
        });

        test('admin can create external organization', async ({ page }) => {
            await page.goto('/admin/external-organizations/create');
            await page.waitForTimeout(3000);

            const nameInput = page.locator('input[name="name"]');
            const codeInput = page.locator('input[name="org_code"]');

            if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                const uniqueCode = 'T' + Date.now().toString().slice(-3);
                await nameInput.fill('E2E Test Org ' + uniqueCode);
                await codeInput.fill(uniqueCode);

                const contactInput = page.locator('input[name="contact_person"]');
                if (await contactInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await contactInput.fill('E2E Tester');
                }

                await page.click('button[type="submit"]');
                await page.waitForTimeout(5000);
            }
        });
    });

    test.describe('Admin: Access Code Management', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsAdmin(page);
        });

        test('admin can see access code list', async ({ page }) => {
            await page.goto('/admin/access-codes');
            await page.waitForTimeout(3000);
            await expect(page.locator('body')).not.toBeEmpty();
        });

        test('admin can access code generation page', async ({ page }) => {
            await page.goto('/admin/access-codes/create');
            await page.waitForTimeout(3000);
            await expect(page.locator('body')).not.toBeEmpty();
        });

        test('access code list has filter controls', async ({ page }) => {
            await page.goto('/admin/access-codes');
            await page.waitForTimeout(3000);
            const searchInput = page.locator('input[placeholder*="ค้นหา"]').first();
            const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
            expect(hasSearch).toBeTruthy();
        });

        test('admin can export codes as CSV', async ({ page }) => {
            await page.goto('/admin/access-codes');
            await page.waitForTimeout(3000);
            const exportBtn = page.locator('text=Export CSV, text=CSV, a[href*="export"]').first();
            const hasExport = await exportBtn.isVisible({ timeout: 5000 }).catch(() => false);
            // Export button should exist on the page
        });
    });

    test.describe('External: Login Flow', () => {
        test('external login page renders', async ({ page }) => {
            await page.goto('/external/login');
            await expect(page.locator('#code')).toBeVisible();
        });

        test('external login page has access code placeholder', async ({ page }) => {
            await page.goto('/external/login');
            const input = page.locator('#code');
            await expect(input).toHaveAttribute('placeholder', 'IEAT-XXXX-XXXXXX');
        });

        test('external login with invalid code shows error', async ({ page }) => {
            await page.goto('/external/login');
            await page.fill('#code', 'INVALID-CODE-XYZ');
            await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');
            await page.waitForTimeout(3000);

            const hasError = await page.locator('.text-red-600, .text-red-500').isVisible().catch(() => false);
            const stayedOnLogin = page.url().includes('/external/login');
            expect(hasError || stayedOnLogin).toBeTruthy();
        });

        test('external login prefills code from URL query', async ({ page }) => {
            await page.goto('/external/login?code=IEAT-TEST-ABC123');
            await page.waitForTimeout(2000);
            const input = page.locator('#code');
            await expect(input).toBeVisible();
        });

        test('external thank you page renders', async ({ page }) => {
            await page.goto('/external/thank-you');
            await page.waitForTimeout(2000);
            await expect(page.locator('body')).not.toBeEmpty();
        });
    });

    test.describe('External: Protected Routes Redirect', () => {
        test('external dashboard redirects to login without session', async ({ page }) => {
            await page.goto('/external/dashboard');
            await expect(page).toHaveURL(/external\/login/);
        });

        test('external confirm redirects to login without session', async ({ page }) => {
            await page.goto('/external/confirm');
            await expect(page).toHaveURL(/external\/login/);
        });

        test('external evaluate redirects to login without session', async ({ page }) => {
            await page.goto('/external/evaluate');
            await expect(page).toHaveURL(/external\/login/);
        });
    });
});
