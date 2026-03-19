/* ============================================================
   script.js – Interactive Login Page with Google OAuth
   ============================================================ */

// ─── Config ────────────────────────────────────────────────────────────────────
const STORAGE_KEY_CLIENT_ID = 'nexus_google_client_id';

// ─── Particle System ──────────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [];

  const CONFIG = {
    count: 60,
    speedMax: 0.25,
    radius: { min: 1, max: 2.5 },
    opacity: { min: 0.04, max: 0.18 },
    color: ['108,99,255', '167,139,250', '240,171,252'],
    connDist: 120,
    connOpacity: 0.06
  };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function mkParticle() {
    const color = CONFIG.color[Math.floor(Math.random() * CONFIG.color.length)];
    return {
      x:  rand(0, W), y: rand(0, H),
      vx: rand(-CONFIG.speedMax, CONFIG.speedMax),
      vy: rand(-CONFIG.speedMax, CONFIG.speedMax),
      r:  rand(CONFIG.radius.min, CONFIG.radius.max),
      o:  rand(CONFIG.opacity.min, CONFIG.opacity.max),
      color
    };
  }

  function initParticleSet() {
    particles = Array.from({ length: CONFIG.count }, mkParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONFIG.connDist) {
          const alpha = CONFIG.connOpacity * (1 - dist / CONFIG.connDist);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.o})`;
      ctx.fill();

      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); initParticleSet(); });
  resize();
  initParticleSet();
  draw();
})();


// ─── Toast System ─────────────────────────────────────────────────────────────
const toastContainer = document.getElementById('toast-container');

function showToast(msg, type = 'info', durationMs = 4000) {
  const icons = { success: '✅', error: '❌', info: '💡' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 320);
  }, durationMs);
}


// ─── DOM refs ──────────────────────────────────────────────────────────────────
const form           = document.getElementById('login-form');
const emailInput     = document.getElementById('email');
const passwordInput  = document.getElementById('password');
const togglePass     = document.getElementById('toggle-password');
const submitBtn      = document.getElementById('submit-btn');
const btnText        = submitBtn.querySelector('.btn-text');
const btnSpinner     = submitBtn.querySelector('.btn-spinner');
const btnIcon        = submitBtn.querySelector('.btn-icon');
const successOverlay = document.getElementById('success-overlay');

const groupEmail     = document.getElementById('group-email');
const groupPassword  = document.getElementById('group-password');
const emailError     = document.getElementById('email-error');
const passwordError  = document.getElementById('password-error');
const emailStatus    = document.getElementById('email-status');

// Modal / Google refs
const gsiModal        = document.getElementById('gsi-modal');
const gsiClientIdInput = document.getElementById('gsi-client-id-input');
const gsiSaveBtn      = document.getElementById('gsi-save-btn');
const gsiCancelBtn    = document.getElementById('gsi-cancel-btn');
const googleBtn       = document.getElementById('btn-google');
const githubBtn       = document.getElementById('btn-github');


// ─── Google Identity Services ─────────────────────────────────────────────────
let googleInitialized = false;
let currentClientId   = null;

/**
 * Decode a JWT without a library.
 * Returns the payload as a plain object.
 */
function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/**
 * Called by Google after a successful sign-in.
 * credential is a signed JWT with the user's profile info.
 */
function handleCredentialResponse(response) {
  const payload = decodeJwt(response.credential);
  const name    = payload.name  || payload.email || 'Usuario';
  const email   = payload.email || '';
  const picture = payload.picture || null;

  showSuccessGoogle({ name, email, picture });
}

/**
 * Initialize Google Identity Services with the given client ID.
 */
function initGoogleSignIn(clientId) {
  if (!window.google || !window.google.accounts) {
    showToast('La librería de Google aún no ha cargado. Intenta de nuevo en un momento.', 'error');
    return false;
  }

  try {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    currentClientId   = clientId;
    googleInitialized = true;
    return true;
  } catch (e) {
    console.error('Google GSI init error:', e);
    showToast('Error al inicializar Google Sign-In. Verifica el Client ID.', 'error');
    return false;
  }
}

/**
 * Trigger the Google One Tap / popup flow.
 */
function triggerGoogleSignIn() {
  if (!googleInitialized) {
    showToast('Primero configura tu Google Client ID.', 'info');
    return;
  }
  // Use prompt (One Tap + popup fallback)
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed()) {
      const reason = notification.getNotDisplayedReason();
      // Fallback: if One Tap is suppressed (e.g. already dismissed), use popup redirect
      if (['opt_out_or_no_session', 'suppressed_by_user', 'unregistered_origin', 'relationship_established'].includes(reason) || reason) {
        // Open a popup via renderButton workaround
        openGooglePopup();
      }
    }
  });
}

/**
 * Fallback: render a hidden Google button and click it programmatically.
 */
function openGooglePopup() {
  let hiddenContainer = document.getElementById('_gsi_hidden_btn');
  if (!hiddenContainer) {
    hiddenContainer = document.createElement('div');
    hiddenContainer.id = '_gsi_hidden_btn';
    hiddenContainer.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(hiddenContainer);
  }

  google.accounts.id.renderButton(hiddenContainer, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
  });

  // Wait for GSI to render the button iframe/element, then click
  setTimeout(() => {
    const btn = hiddenContainer.querySelector('div[role="button"]') || hiddenContainer.firstElementChild;
    if (btn) btn.click();
    else {
      // Last resort: redirect to oauth2 authorize endpoint
      const redirectUri = encodeURIComponent(window.location.href);
      window.open(
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(currentClientId)}&redirect_uri=${redirectUri}&response_type=token&scope=openid%20email%20profile`,
        '_blank',
        'width=500,height=600'
      );
    }
  }, 300);
}

// Show the Client ID setup modal
function openGsiModal() {
  const saved = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (saved) gsiClientIdInput.value = saved;
  gsiModal.classList.remove('hidden');
  setTimeout(() => gsiClientIdInput.focus(), 100);
}

function closeGsiModal() {
  gsiModal.classList.add('hidden');
}

// Google button click
googleBtn.addEventListener('click', () => {
  const savedClientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);

  if (savedClientId && !googleInitialized) {
    // Try to auto-init with saved ID
    if (window.google && window.google.accounts) {
      initGoogleSignIn(savedClientId);
    }
  }

  if (googleInitialized) {
    triggerGoogleSignIn();
  } else {
    // Need to configure first
    openGsiModal();
  }
});

// Save Client ID
gsiSaveBtn.addEventListener('click', () => {
  const clientId = gsiClientIdInput.value.trim();
  if (!clientId) {
    gsiClientIdInput.style.borderColor = 'rgba(248,113,113,0.6)';
    setTimeout(() => gsiClientIdInput.style.borderColor = '', 1200);
    showToast('Por favor ingresa tu Client ID.', 'error');
    return;
  }

  if (!clientId.includes('.apps.googleusercontent.com')) {
    showToast('El Client ID parece incorrecto. Debe terminar en .apps.googleusercontent.com', 'error', 5000);
    return;
  }

  localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);

  if (initGoogleSignIn(clientId)) {
    closeGsiModal();
    showToast('¡Google Sign-In configurado! Haz clic en el botón de Google para entrar.', 'success', 5000);
    // Immediately trigger sign-in
    setTimeout(triggerGoogleSignIn, 400);
  }
});

gsiCancelBtn.addEventListener('click', closeGsiModal);

// Close modal on overlay click
gsiModal.addEventListener('click', (e) => {
  if (e.target === gsiModal) closeGsiModal();
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !gsiModal.classList.contains('hidden')) closeGsiModal();
});

// Auto-init if Client ID is already stored
window.addEventListener('load', () => {
  const savedClientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (savedClientId && window.google && window.google.accounts) {
    initGoogleSignIn(savedClientId);
    // Show a subtle badge on the Google button
    googleBtn.title = `Conectado con Client ID: ${savedClientId.slice(0, 18)}...`;
  }
});

// Also try after GSI script loads (async)
document.querySelector('script[src*="gsi/client"]').addEventListener('load', () => {
  const savedClientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (savedClientId && !googleInitialized) {
    initGoogleSignIn(savedClientId);
  }
});


// ─── Show Google success overlay ───────────────────────────────────────────────
function showSuccessGoogle({ name, email, picture }) {
  // Build avatar element
  const successOverlayContent = successOverlay;
  successOverlayContent.innerHTML = ''; // clear

  // Avatar
  const avatarWrap = document.createElement('div');
  if (picture) {
    const img = document.createElement('img');
    img.src = picture;
    img.alt = name;
    img.className = 'success-avatar';
    avatarWrap.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'success-avatar-placeholder';
    placeholder.textContent = name.charAt(0).toUpperCase();
    avatarWrap.appendChild(placeholder);
  }

  const h3 = document.createElement('h3');
  h3.textContent = `¡Bienvenido, ${name.split(' ')[0]}!`;

  const p = document.createElement('p');
  p.textContent = email || 'Autenticado con Google';

  const sub = document.createElement('p');
  sub.style.cssText = 'font-size:0.75rem;color:var(--text-muted);margin-top:4px;';
  sub.textContent = 'Redirigiendo...';

  successOverlayContent.append(avatarWrap, h3, p, sub);
  successOverlayContent.classList.remove('hidden');

  // Reset after 3.5 seconds
  setTimeout(() => {
    successOverlayContent.classList.add('hidden');
    // Restore default overlay content
    successOverlayContent.innerHTML = `
      <div class="success-icon">
        <svg viewBox="0 0 52 52">
          <circle class="success-circle" cx="26" cy="26" r="25" fill="none" stroke="#6c63ff" stroke-width="2"/>
          <path class="success-check" fill="none" stroke="#6c63ff" stroke-width="3" d="M14 27 l8 8 l16-16"/>
        </svg>
      </div>
      <h3>¡Bienvenido de vuelta!</h3>
      <p>Redirigiendo...</p>
    `;
  }, 3500);
}


// ─── GitHub button ────────────────────────────────────────────────────────────
githubBtn.addEventListener('click', () => {
  showToast('GitHub OAuth requiere un servidor backend para el flujo de autorización.', 'info', 5000);
});


// ─── Validation helpers ───────────────────────────────────────────────────────
const validators = {
  email(val) {
    if (!val) return 'El correo es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Ingresa un correo válido.';
    return null;
  },
  password(val) {
    if (!val) return 'La contraseña es obligatoria.';
    if (val.length < 6) return 'Mínimo 6 caracteres.';
    return null;
  }
};

function setFieldState(group, errorEl, statusEl, errorMsg, isBlurred) {
  const input = group.querySelector('input');
  group.classList.remove('focused', 'valid', 'invalid');

  if (document.activeElement === input) group.classList.add('focused');

  if (errorMsg && isBlurred) {
    group.classList.add('invalid');
    errorEl.textContent = errorMsg;
    errorEl.classList.add('show');
    if (statusEl) statusEl.innerHTML = '❌';
  } else if (!errorMsg && input.value) {
    group.classList.add('valid');
    errorEl.classList.remove('show');
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--success);">✓</span>';
  } else {
    errorEl.classList.remove('show');
    if (statusEl) statusEl.innerHTML = '';
  }
}

emailInput.addEventListener('input', () => {
  const err = validators.email(emailInput.value.trim());
  setFieldState(groupEmail, emailError, emailStatus, err, !!emailInput.value);
});

passwordInput.addEventListener('input', () => {
  const err = validators.password(passwordInput.value);
  setFieldState(groupPassword, passwordError, null, err, !!passwordInput.value);
});

[emailInput, passwordInput].forEach(inp => {
  inp.addEventListener('focus', () => inp.closest('.form-group').classList.add('focused'));
  inp.addEventListener('blur', () => {
    inp.closest('.form-group').classList.remove('focused');
    if (inp === emailInput) {
      setFieldState(groupEmail, emailError, emailStatus, validators.email(inp.value.trim()), true);
    } else {
      setFieldState(groupPassword, passwordError, null, validators.password(inp.value), true);
    }
  });
});


// ─── Password toggle ───────────────────────────────────────────────────────────
togglePass.addEventListener('click', () => {
  const isPass = passwordInput.type === 'password';
  passwordInput.type = isPass ? 'text' : 'password';
  document.getElementById('eye-icon').innerHTML = isPass
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
       <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
       <line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
       <circle cx="12" cy="12" r="3"/>`;
});


// ─── Shake animation ───────────────────────────────────────────────────────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shakeX {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
  @keyframes ripple { to { transform:scale(2.5); opacity:0; } }
`;
document.head.appendChild(shakeStyle);

function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shakeX 0.4s ease';
}


// ─── Email/password form submit ────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailErr = validators.email(emailInput.value.trim());
  const passErr  = validators.password(passwordInput.value);

  setFieldState(groupEmail,    emailError,    emailStatus, emailErr, true);
  setFieldState(groupPassword, passwordError, null,        passErr,  true);

  if (emailErr || passErr) {
    shake(submitBtn);
    return;
  }

  // Loading state
  submitBtn.disabled = true;
  btnText.classList.add('hidden');
  btnIcon.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  submitBtn.style.cursor = 'not-allowed';

  await delay(1800);

  // Success (reset to default overlay)
  btnSpinner.classList.add('hidden');
  successOverlay.classList.remove('hidden');

  await delay(3000);
  successOverlay.classList.add('hidden');
  submitBtn.disabled = false;
  btnText.classList.remove('hidden');
  btnIcon.classList.remove('hidden');
  submitBtn.style.cursor = '';
  form.reset();
  setFieldState(groupEmail,    emailError,    emailStatus, null, false);
  setFieldState(groupPassword, passwordError, null,        null, false);
});


// ─── Ripple effect ─────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', function (e) {
  if (this.disabled) return;
  const ripple = document.createElement('span');
  const rect   = this.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  ripple.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    top:${e.clientY - rect.top - size/2}px;
    left:${e.clientX - rect.left - size/2}px;
    background:rgba(255,255,255,0.18);
    border-radius:50%;
    transform:scale(0);
    animation:ripple 0.6s linear;
    pointer-events:none;
    z-index:0;
  `;
  this.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
});


// ─── Social button hover tilt ──────────────────────────────────────────────────
document.querySelectorAll('.social-btn').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    btn.style.transform = `translateY(-2px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});


// ─── Utility ───────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
