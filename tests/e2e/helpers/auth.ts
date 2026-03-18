import { Page, expect } from '@playwright/test';

const PASSWORDS = ['01012568', '13112541', 'password123'];

export async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto('/login');

    // Handle announcement modal if present
    const announcementBtn = page.locator('button:has-text("อ่านประกาศ")');
    if (await announcementBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await announcementBtn.click();
        await page.waitForTimeout(1000);
    }

    await page.fill('#emid', '999999');

    for (const pwd of PASSWORDS) {
        await page.fill('#password', pwd);
        await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');

        const redirected = await page.waitForURL('**/dashboardadmin**', { timeout: 5000 }).then(() => true).catch(() => false);
        if (redirected) return;
        if (page.url().includes('dashboard')) return;
    }

    throw new Error('Could not login as admin with any known password');
}

export async function loginAsUser(page: Page, emid: string = '000000'): Promise<void> {
    await page.goto('/login');

    const announcementBtn = page.locator('button:has-text("อ่านประกาศ")');
    if (await announcementBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await announcementBtn.click();
        await page.waitForTimeout(1000);
    }

    await page.fill('#emid', emid);

    for (const pwd of PASSWORDS) {
        await page.fill('#password', pwd);
        await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');

        const redirected = await page.waitForURL('**/dashboard**', { timeout: 5000 }).then(() => true).catch(() => false);
        if (redirected) return;
        if (page.url().includes('dashboard')) return;
    }

    throw new Error(`Could not login as user ${emid}`);
}

export async function loginAsExternal(page: Page, code: string): Promise<void> {
    await page.goto('/external/login');
    await page.fill('#code', code);
    await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');
    await expect(page).not.toHaveURL(/\/external\/login$/);
}

export async function logout(page: Page): Promise<void> {
    const logoutBtn = page.locator('button:has-text("ออกจากระบบ"), a:has-text("ออกจากระบบ")').first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutBtn.click();
    } else {
        await page.goto('/logout', { waitUntil: 'networkidle' });
    }
}
