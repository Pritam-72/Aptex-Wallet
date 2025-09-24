# 3D Background Animation Setup with Unicorn Studio

This guide shows how to implement the interactive 3D background animation used in the landing page using Unicorn Studio.

## Overview

The 3D background uses Unicorn Studio, a web-based 3D animation platform that provides interactive backgrounds through a simple JavaScript API.

## Prerequisites

- Next.js project (or any React project)
- Unicorn Studio account (free tier available)

## Implementation Steps

### 1. Load Unicorn Studio Script

Add the Unicorn Studio script to your HTML head or layout component:

```tsx
// In your layout.tsx (Next.js) or index.html
import Script from 'next/script';

// Add this inside your <head> or layout
<Script
  src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.25/dist/unicornStudio.umd.js"
  strategy="beforeInteractive"
/>
```

### 2. Create the Background Component

Create a component that initializes and displays the 3D background:

```tsx
'use client'
import React, { useEffect } from 'react'

declare global {
  interface Window {
    UnicornStudio: {
      init: () => Promise<any>;
      addScene: (config: any) => Promise<any>;
      destroy: () => void;
      isInitialized?: boolean;
    };
  }
}

export default function AnimatedBackground() {
  useEffect(() => {
    const initUnicornStudio = () => {
      if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
        window.UnicornStudio.init()
          .then((scenes) => {
            console.log('Unicorn Studio scenes initialized:', scenes);
            window.UnicornStudio.isInitialized = true;
          })
          .catch((err) => {
            console.error('Unicorn Studio initialization error:', err);
          });
      }
    };

    // Check if UnicornStudio is already loaded
    if (window.UnicornStudio) {
      initUnicornStudio();
    } else {
      // Wait for the script to load
      const checkForUnicornStudio = setInterval(() => {
        if (window.UnicornStudio) {
          clearInterval(checkForUnicornStudio);
          initUnicornStudio();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => {
        clearInterval(checkForUnicornStudio);
      }, 10000);
    }

    // Cleanup on unmount
    return () => {
      if (window.UnicornStudio && window.UnicornStudio.isInitialized) {
        try {
          window.UnicornStudio.destroy();
          window.UnicornStudio.isInitialized = false;
        } catch (err) {
          console.warn('UnicornStudio cleanup warning:', err);
        }
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 px-6 lg:px-8 pt-24 pb-0">
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10">
          {/* Replace with your own Unicorn Studio project ID */}
          <div
            data-us-project="YOUR_PROJECT_ID_HERE"
            data-us-scale="1"
            data-us-dpi="1.5"
            data-us-lazyload="false"
            data-us-disablemobile="false"
            data-us-alttext="Interactive background animation"
            data-us-arialabel="Dynamic background scene"
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
          {/* Optional overlay for better text readability */}
          <div className="absolute inset-0 bg-black/15" />
        </div>
      </div>
    </div>
  );
}
```

### 3. Use the Component in Your Page

Import and use the background component in your main page:

```tsx
import AnimatedBackground from '@/components/animated-background';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      {/* Your content goes here */}
      <div className="relative z-10">
        {/* Hero content, etc. */}
      </div>
    </main>
  );
}
```

## Configuration Options

The `data-us-*` attributes control various aspects of the animation:

- `data-us-project`: Your Unicorn Studio project ID (required)
- `data-us-scale`: Scale factor for the animation (default: 1)
- `data-us-dpi`: Device pixel ratio for rendering (default: 1.5)
- `data-us-lazyload`: Whether to lazy load the animation (default: false)
- `data-us-disablemobile`: Disable on mobile devices (default: false)
- `data-us-alttext`: Alt text for accessibility
- `data-us-arialabel`: ARIA label for screen readers

## Enhanced Rounded Container Styling

To match the hero section's polished look, use responsive rounded corners and proper spacing:

### Updated Background Component with Rounded Container:

```tsx
return (
  <div className="fixed inset-0 -z-10">
    {/* Enhanced responsive padding for different screen sizes */}
    <div className="absolute inset-0 px-1 xs:px-2 sm:px-6 lg:px-8 pt-20 xs:pt-24 sm:pt-20 lg:pt-24 pb-2 xs:pb-2 sm:pb-0 lg:pb-0">
      <div className="relative h-full w-full overflow-hidden rounded-xl xs:rounded-2xl sm:rounded-3xl border border-white/10">
        {/* Replace with your own Unicorn Studio project ID */}
        <div
          data-us-project="YOUR_PROJECT_ID_HERE"
          data-us-scale="1"
          data-us-dpi="1.5"
          data-us-lazyload="false"
          data-us-disablemobile="false"
          data-us-alttext="Interactive background animation"
          data-us-arialabel="Dynamic background scene"
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
        {/* Enhanced overlay with responsive opacity for better text readability */}
        <div className="absolute inset-0 bg-black/30 xs:bg-black/25 sm:bg-black/15" />
      </div>
    </div>
  </div>
);
```

### CSS Classes Breakdown:

**Container Padding (responsive):**
- `px-1 xs:px-2 sm:px-6 lg:px-8`: Horizontal padding that increases with screen size
- `pt-20 xs:pt-24 sm:pt-20 lg:pt-24`: Top padding with responsive adjustments
- `pb-2 xs:pb-2 sm:pb-0 lg:pb-0`: Bottom padding that reduces to 0 on larger screens

**Rounded Corners (responsive):**
- `rounded-xl`: Base rounded corners (0.75rem)
- `xs:rounded-2xl`: Extra small screens and up (1rem)
- `sm:rounded-3xl`: Small screens and up (1.5rem)

**Border:**
- `border border-white/10`: Subtle white border with 10% opacity

**Overlay:**
- `bg-black/30 xs:bg-black/25 sm:bg-black/15`: Dark overlay that lightens on larger screens for better contrast

### Tailwind Configuration

Make sure your `tailwind.config.js` includes the responsive breakpoints used:

```js
module.exports = {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
  },
}
```

This creates a sophisticated, mobile-first rounded container that adapts beautifully across all device sizes, just like in the hero section.
