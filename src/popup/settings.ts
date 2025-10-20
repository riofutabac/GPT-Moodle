const advanced = document.querySelector('#advanced-settings') as HTMLElement;
const switchBtn = document.querySelector('#switch-settings') as HTMLButtonElement;
const backBtn = document.querySelector('#back-to-basic') as HTMLButtonElement;

// Obtener todas las secciones normales (no advanced)
const normalSections = document.querySelectorAll(
  '.section:not(#advanced-settings)'
) as NodeListOf<HTMLElement>;

function setView(view: 'basic' | 'advanced') {
  const isAdvanced = view === 'advanced';

  // Mostrar/ocultar secciones normales
  normalSections.forEach(section => {
    if (section.contains(switchBtn)) {
      // Mantener visible la sección que contiene el botón
      section.style.display = 'block';
    } else {
      section.style.display = isAdvanced ? 'none' : 'block';
    }
  });

  // Mostrar/ocultar sección avanzada
  if (isAdvanced) {
    advanced.classList.remove('hidden');
    advanced.style.display = 'block';
  } else {
    advanced.classList.add('hidden');
    advanced.style.display = 'none';
  }

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

// Botón de volver desde advanced settings
if (backBtn) {
  backBtn.addEventListener('click', e => {
    e.preventDefault();
    setView('basic');
  });
}

// Estado inicial estable
document.addEventListener('DOMContentLoaded', () => setView('basic'));
