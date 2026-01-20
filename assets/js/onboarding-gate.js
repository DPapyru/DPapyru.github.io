// Onboarding gate: redirect first-time visitors to onboarding.html (skippable).
// Style: semicolons, 4-space indent, IIFE.
(function () {
    'use strict';

    var PROFILE_KEY = 'learningProfile';
    var DISMISSED_KEY = 'learningOnboardingDismissed';

    function isOnboardingPage() {
        var path = String(window.location.pathname || '');
        return /\/onboarding\.html$/i.test(path);
    }

    function getOnboardingUrl() {
        var inDocs = String(window.location.pathname || '').indexOf('/docs/') !== -1;
        return inDocs ? '../onboarding.html' : 'onboarding.html';
    }

    function shouldRedirect() {
        try {
            var profile = window.localStorage.getItem(PROFILE_KEY);
            if (profile) return false;
            var dismissed = window.localStorage.getItem(DISMISSED_KEY);
            return dismissed !== 'true';
        } catch (e) {
            return false;
        }
    }

    if (isOnboardingPage()) return;
    if (!shouldRedirect()) return;

    window.location.replace(getOnboardingUrl());
}());

