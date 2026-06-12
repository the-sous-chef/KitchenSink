// CommonJS (.cjs) because this package is "type": "module"; Metro's getSentryExpoConfig is CJS.
// Stamps unique Debug IDs onto bundles + source maps so EAS uploads symbolicate (U10 / U11).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
