import { defineManifest } from '@crxjs/vite-plugin';

/**
 * Manifest V3. No remote code, no remote fonts, no analytics, and the only
 * host the extension talks to is the record service: fetching public records
 * by id without credentials, creating sign orders, and, when the reader opts
 * in, sighting reports. `<all_urls>` for the content script is what "verify a
 * Mark on any page" costs; the script reads text nodes and draws badges and
 * sends nothing about the page anywhere.
 */
export default defineManifest({
  manifest_version: 3,
  name: 'ZOREAL Mark',
  short_name: 'ZOREAL Mark',
  version: '0.1.0',
  description: 'Verify that a real human, verified by ZOREAL, vouched for what you are reading. Sign what you post. Works on any site.',
  minimum_chrome_version: '116',
  icons: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'ZOREAL Mark',
    default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' },
  },
  options_ui: { page: 'src/options/index.html', open_in_tab: true },
  background: { service_worker: 'src/background/service-worker.ts', type: 'module' },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content.ts'],
      run_at: 'document_idle',
      // Frames too: a dashboard that embeds its editor in an iframe, a chat
      // widget, a comment box served from another origin. Each frame scans
      // itself and answers for its own boxes; the worker remembers which frame
      // last held the cursor so the popup asks the right one.
      all_frames: true,
    },
  ],
  permissions: ['storage', 'activeTab', 'contextMenus', 'scripting', 'alarms'],
  // Every page, the same grant the content script above already implies, so
  // that after an extension reload the script can be put back into the tabs
  // that are already open, and so the worker can see a tab's URL when a Mark
  // sits inside a frame on any site. The record service hosts stay listed
  // for the CSP connect-src below.
  host_permissions: ['<all_urls>'],
  web_accessible_resources: [
    { resources: ['fonts/*', 'icons/*'], matches: ['<all_urls>'] },
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; connect-src https://zoreal.com https://api.zoreal.com http://localhost:4820 http://localhost:3000; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'",
  },
});
