<div align="center">

# NexusPortal — Login Page

**A sleek, fully interactive authentication UI built with pure HTML, CSS & JavaScript.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

---

## Overview

NexusPortal is a production-quality login page template featuring a dark glassmorphism design, animated particle canvas, real-time form validation, and Google OAuth 2.0 integration — all without frameworks or build tools.

---

## Features

| Feature | Description |
|---|---|
| **Glassmorphism UI** | Dark theme with frosted-glass card, gradient blobs, and depth layering |
| **Particle System** | Canvas-based animated particle network drawn on every frame |
| **Google Sign-In** | Full Google Identity Services (GIS) OAuth 2.0 integration with persistent Client ID |
| **Real-time Validation** | Inline email/password validation with animated error states |
| **Toast Notifications** | Non-blocking toast system with success, error, and info variants |
| **Micro-animations** | Ripple on submit, 3D tilt on social buttons, shake on invalid submit |
| **Success Overlay** | SVG stroke-animated checkmark overlay on successful authentication |
| **Fully Responsive** | Adapts cleanly from desktop (split-panel) to mobile (single-column) |
| **Accessible** | `aria-label` attributes, live region for toasts, keyboard navigation |

---

## Project Structure

```
login-page/
├── index.html      # Semantic HTML structure & SVG assets
├── style.css       # Design system, animations, and responsive layout
└── script.js       # Particle engine, validation, Google OAuth, toast & effects
```

---

## Getting Started

### Quick Start

No build step required. Simply open `index.html` in any modern browser:

```bash
# Clone the repository
git clone https://github.com/your-username/nexus-login-page.git

# Open in browser
open login-page/index.html
```

### Enabling Google Sign-In

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** for a *Web application*
3. Add your domain to **Authorized JavaScript origins** (e.g. `http://localhost`)
4. Click the **Google** button on the page and paste your Client ID into the setup modal
5. The credential is persisted in `localStorage` for future sessions

> **Note:** The GitHub OAuth button requires a backend server to complete the token exchange flow. A toast notification explains this to the user.

---

## Tech Stack

- **HTML5** — Semantic markup with inline SVG icons
- **CSS3** — Custom properties, `backdrop-filter`, `@keyframes`, CSS Grid/Flexbox
- **JavaScript ES2020+** — Canvas API, `async/await`, Google Identity Services
- **Google Fonts** — [Inter](https://fonts.google.com/specimen/Inter) for clean typography

---

## Color System

```css
--primary:       #6c63ff   /* Brand violet */
--primary-light: #a78bfa   /* Accents & gradients */
--accent:        #f0abfc   /* Heading gradient */
--bg:            #0a0a1a   /* Page background */
--success:       #10b981   /* Valid state */
--error:         #f87171   /* Error state */
```

---

## Customization

To connect a real backend, replace the simulated delay in `script.js`:

```js
// script.js — form submit handler
form.addEventListener('submit', async (e) => {
  // ...validation...

  // Replace this block with your actual API call:
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) showSuccessOverlay();
});
```

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Edge 90+ | ✅ Full |

> `backdrop-filter` requires Safari 15+ or Chrome 76+ for glassmorphism effect.

