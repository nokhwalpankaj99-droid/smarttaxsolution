# Smart Tax Solution Android App

Native Android WebView shell for the existing Smart Tax Solution website.

## Build
- Android Studio Ladybug or newer
- JDK 17
- Android SDK Platform 35
- Open this `android` folder in Android Studio, wait for Gradle sync, then Build > Build Bundle(s) / APK(s) > Build APK(s).

Application ID: `site.smarttaxsolution.app`
Website loaded: https://smarttaxsolution.site/

The app uses the existing website for live course, student portal, certificate, grievance and contact features. Website changes are reflected in the app when online. Offline support is provided separately by the website service worker for cached shell assets.


## Automated APK build
The GitHub Actions workflow `.github/workflows/android-apk.yml` builds a debug APK when Android project files change and uploads it as the `Smart-Tax-Solution-debug-APK` artifact.


APK builds are published to the android-latest GitHub release for the website download button.
