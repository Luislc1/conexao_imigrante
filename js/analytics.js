/**
 * Conexão Imigrante — analytics.js
 * Consent mode v2 & GA4 loader
 */
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied'
});

window.grantAnalyticsConsent = function() {
  localStorage.setItem('cookie_consent', 'granted');
  gtag('consent', 'update', {
    'analytics_storage': 'granted'
  });
};

window.denyAnalyticsConsent = function() {
  localStorage.setItem('cookie_consent', 'denied');
  gtag('consent', 'update', {
    'analytics_storage': 'denied'
  });
};

if (localStorage.getItem('cookie_consent') === 'granted') {
  window.grantAnalyticsConsent();
}
