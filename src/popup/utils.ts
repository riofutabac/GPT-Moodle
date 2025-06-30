/**
 * Show message into the popup
 */
export function showMessage({
  msg,
  isError,
  isInfinite,
  isLoading
}: {
  msg: string;
  isError?: boolean;
  isInfinite?: boolean;
  isLoading?: boolean;
}) {
  const message: HTMLElement = document.querySelector('#message')!;

  // Limpiar clases previas
  message.className = 'message';

  // Agregar clase según el tipo
  if (isLoading) {
    message.classList.add('loading');
  } else if (isError) {
    message.classList.add('error');
  } else {
    message.classList.add('success');
  }

  message.textContent = msg;
  message.classList.remove('hidden');

  if (!isInfinite) {
    setTimeout(() => {
      message.classList.add('hidden');
    }, 5000);
  }
}

/**
 * Check if the current model support images integrations
 * @param {string} version
 * @returns
 */
export function isCurrentVersionSupportingImages(version: string) {
  const versionNumber = version.match(/gpt-(\d+)/);
  if (!versionNumber?.[1]) {
    return false;
  }
  return Number(versionNumber[1]) >= 4;
}
