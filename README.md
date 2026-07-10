# Desktop Overlay & Hardware Monitor

![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

A customizable Windows desktop overlay that combines real-time hardware monitoring, application shortcuts, and dynamic backgrounds in one lightweight application.

The overlay runs directly on the desktop and allows you to display useful information and customize your workspace without interfering with your normal Windows usage.

---

## Design

![Home Design 1](https://raw.githubusercontent.com/graiess073029/desktop-overlay/refs/heads/main/design/Capture%20d'écran%202026-07-10%20162537.png)
![Per Core Monitoring Design](https://raw.githubusercontent.com/graiess073029/desktop-overlay/refs/heads/main/design/Capture%20d'écran%202026-07-10%20162559.png)

## Features

## Real-Time Hardware Monitoring

The application connects to **HWiNFO64 Shared Memory** to display live hardware information.

Supported data includes:

* CPU usage, temperature, clock speed, and power
* GPU usage, temperature, clock speed, and power
* RAM usage
* Storage information
* Other available HWiNFO sensors

The first setup includes an AI-assisted sensor detection system that automatically identifies and organizes your hardware sensors, reducing the need for manual configuration.

---

## Custom Application Launcher

Add shortcuts directly to your desktop overlay and launch your favorite applications, games, or scripts.

Supported formats:

* `.exe`
* `.lnk`
* `.bat`
* `.cmd`
* `.ps1`

---

## Dynamic Backgrounds

Customize your desktop with static or animated backgrounds.

Supported formats:

Images:

* `.jpg`
* `.png`
* `.webp`

Videos:

* `.mp4`
* `.webm`

Video backgrounds are processed to balance quality and performance.

---

## Desktop Overlay

The application uses a custom Windows desktop integration system to display the overlay while keeping normal desktop interactions available.

Features:

* Works behind desktop icons
* Does not block normal Windows interaction
* Supports multiple displays
* Automatically adjusts to your monitor setup

---

## Multi-Monitor Support

The application automatically detects connected monitors and creates the appropriate overlay environment for each display.

The main monitor provides the full interface, while secondary monitors can display a cleaner layout focused on information and aesthetics.

---

## Performance Optimization

The application includes several optimizations to reduce resource usage:

* Limits update frequency for hardware monitoring
* Reduces background processing when the overlay is inactive
* Adjusts behavior when fullscreen applications are detected

The goal is to keep the overlay lightweight while still providing real-time information.

---

# Requirements

## Operating System

* Windows 10 or Windows 11 (64-bit)

## HWiNFO64

Hardware monitoring requires **HWiNFO64** with Shared Memory enabled.

Setup:

1. Install and run HWiNFO64.
2. Open HWiNFO settings.
3. Enable **Shared Memory Support**.
4. Keep HWiNFO running in the background.

> The free version of HWiNFO may require periodically restarting or re-enabling shared memory support.

---

# Installation

1. Download and extract the release files.
2. Start HWiNFO64 with Shared Memory enabled.
3. Launch `DesktopOverlay.exe`.
4. The application will start in the background and appear in the Windows system tray.

From the system tray menu you can:

* Open settings
* Refresh the overlay
* Restart desktop integration
* Exit the application

---

# Usage

## Main Monitor

The primary monitor contains the main interface:

* Hardware monitoring widgets
* Background management
* Application shortcuts
* Customization options

## Secondary Monitors

Additional monitors automatically receive their own overlay instance with settings adapted for multi-display setups.

---

# Troubleshooting

## The overlay is not displayed correctly

Use the system tray menu and select:

**Refresh Windows**

This rebuilds the desktop integration without requiring a full system restart.

---

## Hardware sensors show missing values

Make sure:

* HWiNFO64 is running
* Shared Memory Support is enabled
* HWiNFO is still providing sensor data

---

## Video backgrounds are using too many resources

Check that your graphics drivers are updated.

The application uses hardware acceleration when available to keep video playback efficient.

---

# License

This application is distributed as-is.

Third-party software included with this project remains the property of its respective owners.
