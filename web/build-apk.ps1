# Builds the StatGoal Android debug APK with the JDK and SDK installed in the user profile.
# Usage (from anywhere):  powershell -ExecutionPolicy Bypass -File D:\StatGoal\web\build-apk.ps1
$ErrorActionPreference = 'Stop'
$web = $PSScriptRoot
$jdk = Get-ChildItem "$env:LOCALAPPDATA\Programs\Microsoft" -Directory | Where-Object Name -like 'jdk-21*' | Sort-Object Name | Select-Object -Last 1
if (-not $jdk) { throw 'JDK 21 not found in %LOCALAPPDATA%\Programs\Microsoft' }
$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# Gradle needs to know where the SDK is.
"sdk.dir=$($env:ANDROID_HOME -replace '\\', '\\')" | Set-Content -Encoding ascii "$web\android\local.properties"

Push-Location $web
try {
  npm run build:mobile
  if ($LASTEXITCODE) { throw 'web build failed' }
  npx cap sync android
  if ($LASTEXITCODE) { throw 'cap sync failed' }
  Push-Location android
  .\gradlew.bat assembleDebug --no-daemon
  if ($LASTEXITCODE) { throw 'gradle build failed' }
  Pop-Location
  $apk = "$web\android\app\build\outputs\apk\debug\app-debug.apk"
  Copy-Item $apk "$web\..\StatGoal.apk" -Force
  Write-Host "APK ready: $((Resolve-Path "$web\..\StatGoal.apk").Path)"
} finally {
  Pop-Location
}
