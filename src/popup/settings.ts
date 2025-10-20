const settings = document.querySelector('#settings') as HTMLElement;
const advanced = document.querySelector('#advanced-settings') as HTMLElement;
const switchBtn = document.querySelector('#switch-settings') as HTMLButtonElement;

function setView(view: 'basic' | 'advanced') {
  const isAdvanced = view === 'advanced';
  settings.style.display = isAdvanced ? 'none' : 'flex';
  advanced.style.display = isAdvanced ? 'flex' : 'none';
  switchBtn.setAttribute('aria-expanded', String(isAdvanced));
  // Textos en ES para coherencia con el resto del popup
  switchBtn.textContent = isAdvanced ? 'Volver a configuración' : 'Opciones avanzadas';
}

// Alterna en base al estado ARIA, no a estilos inline
switchBtn.addEventListener('click', e => {
  e.preventDefault();
  const expanded = switchBtn.getAttribute('aria-expanded') === 'true';
  setView(expanded ? 'basic' : 'advanced');
});

// Estado inicial estable
document.addEventListener('DOMContentLoaded', () => setView('basic'));
