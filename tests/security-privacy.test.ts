import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mockLocalStorage } from './setup.ts';
import {
  isNonEssentialStorageAllowed,
  STORAGE_CONSENT_KEY,
} from '../src/lib/storage-consent.ts';

test('Cookie Consent: isNonEssentialStorageAllowed returns false when no consent record exists', () => {
  mockLocalStorage.removeItem(STORAGE_CONSENT_KEY);
  assert.strictEqual(isNonEssentialStorageAllowed(), false);
});

test('Cookie Consent: isNonEssentialStorageAllowed returns true when consent is accepted', () => {
  mockLocalStorage.setItem(
    STORAGE_CONSENT_KEY,
    JSON.stringify({ consent: 'accepted', timestamp: new Date().toISOString() }),
  );
  assert.strictEqual(isNonEssentialStorageAllowed(), true);
});

test('Cookie Consent: isNonEssentialStorageAllowed returns false when consent is rejected (essential only)', () => {
  mockLocalStorage.setItem(
    STORAGE_CONSENT_KEY,
    JSON.stringify({ consent: 'rejected', timestamp: new Date().toISOString() }),
  );
  assert.strictEqual(isNonEssentialStorageAllowed(), false);
});

test('Cookie Consent: isNonEssentialStorageAllowed returns false on corrupt localStorage payload', () => {
  mockLocalStorage.setItem(STORAGE_CONSENT_KEY, '{invalid json');
  assert.strictEqual(isNonEssentialStorageAllowed(), false);
});

test('Security Headers: index.html defines strict Content-Security-Policy and security meta tags', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  assert.ok(
    indexHtml.includes('http-equiv="Content-Security-Policy"'),
    'index.html must include Content-Security-Policy meta tag',
  );
  assert.ok(
    indexHtml.includes("default-src 'self'"),
    'CSP must specify default-src self',
  );
  assert.ok(
    indexHtml.includes('http-equiv="X-Content-Type-Options" content="nosniff"'),
    'index.html must include X-Content-Type-Options nosniff',
  );
  assert.ok(
    indexHtml.includes('name="referrer" content="strict-origin-when-cross-origin"'),
    'index.html must include strict-origin-when-cross-origin referrer',
  );
});

test('Security Headers: vite.config.ts configures security headers on server and preview', () => {
  const viteConfig = fs.readFileSync(path.resolve('vite.config.ts'), 'utf-8');
  assert.ok(
    viteConfig.includes("'X-Content-Type-Options': 'nosniff'"),
    'vite.config.ts must set X-Content-Type-Options nosniff',
  );
  assert.ok(
    viteConfig.includes("'X-Frame-Options': 'SAMEORIGIN'"),
    'vite.config.ts must set X-Frame-Options SAMEORIGIN',
  );
  assert.ok(
    viteConfig.includes("'Referrer-Policy': 'strict-origin-when-cross-origin'"),
    'vite.config.ts must set Referrer-Policy',
  );
  assert.ok(
    viteConfig.includes("'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'"),
    'vite.config.ts must set Permissions-Policy',
  );
});

test('Legacy Cleanup: artifacts/ and lib/ untracked legacy folders are cleanly removed', () => {
  assert.strictEqual(fs.existsSync(path.resolve('artifacts')), false);
  assert.strictEqual(fs.existsSync(path.resolve('lib')), false);
});

test('Design Constraints: Zero em dashes in UI copy and source code under src/', () => {
  function scanDir(dir: string, emDashFiles: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, emDashFiles);
      } else if (/\.(tsx?|jsx?|html|css)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('—')) {
          emDashFiles.push(fullPath);
        }
      }
    }
    return emDashFiles;
  }

  const violations = scanDir(path.resolve('src'));
  assert.deepStrictEqual(
    violations,
    [],
    `Found em dashes in src/ files: ${violations.join(', ')}`,
  );
});

test('Privacy Policy Page: contains required data controller and local storage disclosure without em dashes', () => {
  const privacyCode = fs.readFileSync(path.resolve('src/pages/privacy.tsx'), 'utf-8');
  assert.ok(
    privacyCode.includes('collagenmosaic@gmail.com'),
    'Privacy policy must disclose data controller email',
  );
  assert.ok(
    privacyCode.includes('collat_erp_store_v3'),
    'Privacy policy must disclose collat_erp_store_v3',
  );
  assert.ok(
    privacyCode.includes('collat_storage_consent_v1'),
    'Privacy policy must disclose collat_storage_consent_v1',
  );
  assert.ok(
    privacyCode.includes('GETFund 2.5%') &&
      privacyCode.includes('NHIL 2.5%') &&
      privacyCode.includes('GRA VAT 15.0%'),
    'Privacy policy must disclose Ghanaian statutory tax obligations',
  );
  assert.strictEqual(
    privacyCode.includes('—'),
    false,
    'Privacy policy must not contain em dashes',
  );
});
