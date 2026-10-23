module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      maxAutodiscoverUrls: 0,
      autodiscoverUrlBlocklist: ['/404.html'],
      settings: {
        chromeFlags: '--headless=new --no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median' },
        ],
        'categories:accessibility': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median' },
        ],
        'categories:best-practices': [
          'error',
          { minScore: 0.95, aggregationMethod: 'median' },
        ],
        'categories:seo': [
          'error',
          { minScore: 0.95, aggregationMethod: 'median' },
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
