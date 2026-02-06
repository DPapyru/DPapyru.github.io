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

    function isDocsContentPage() {
        var path = String(window.location.pathname || '');
        return /\/site\/pages\/(viewer|folder|anim-renderer|shader-playground)\.html$/i.test(path);
    }

    function getOnboardingUrl() {
        return '/site/onboarding.html';
    }

    function shouldRedirect() {
        var profile;
        var dismissed;
        try {
            profile = window.localStorage.getItem(PROFILE_KEY);
            if (profile) return false;
            dismissed = window.localStorage.getItem(DISMISSED_KEY);
            return dismissed !== 'true';
        } catch (e) {
            return false;
        }
    }

    if (isOnboardingPage()) return;
    if (isDocsContentPage()) return;
    if (!shouldRedirect()) return;

    window.location.replace(getOnboardingUrl());
}());
