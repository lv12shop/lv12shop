@echo off
echo Building LV12 Shop Mobile App...

REM Install Cordova if not installed
npm install -g cordova

REM Create Cordova project
cordova create lv12-mobile com.lv12shop.app "LV12 Shop"

REM Copy files to www folder
xcopy /E /I /Y *.html lv12-mobile\www\
xcopy /E /I /Y *.css lv12-mobile\www\
xcopy /E /I /Y *.js lv12-mobile\www\
xcopy /E /I /Y *.png lv12-mobile\www\
xcopy /E /I /Y *.jpg lv12-mobile\www\
xcopy /E /I /Y *.ico lv12-mobile\www\
xcopy /E /I /Y manifest.json lv12-mobile\www\

REM Copy config.xml
copy config.xml lv12-mobile\

cd lv12-mobile

REM Add Android platform
cordova platform add android

REM Build APK
cordova build android

echo APK created in: platforms\android\app\build\outputs\apk\debug\app-debug.apk
pause