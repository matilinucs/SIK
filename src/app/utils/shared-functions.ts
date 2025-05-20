// Archivo de funciones compartidas

/**
 * Convierte un valor a metros según la unidad proporcionada.
 * @param value Valor numérico a convertir.
 * @param unit Unidad del valor ('mm', 'cm', 'm').
 * @returns Valor convertido a metros.
 */
export function convertToMeters(value: number, unit: string): number {
  switch (unit) {
    case 'mm': return value / 1000;
    case 'cm': return value / 100;
    case 'm': return value;
    default: throw new Error(`Unidad desconocida: ${unit}`);
  }
}

/**
 * Calcula el área total en metros cuadrados.
 * @param width Ancho en la unidad especificada.
 * @param height Alto en la unidad especificada.
 * @param unit Unidad de las dimensiones ('mm', 'cm', 'm').
 * @returns Área total en metros cuadrados.
 */
export function calculateTotalArea(width: number, height: number, unit: string): number {
  const widthInMeters = convertToMeters(width, unit);
  const heightInMeters = convertToMeters(height, unit);
  return parseFloat((widthInMeters * heightInMeters).toFixed(3));
}

/**
 * Maneja la selección de una imagen y genera una vista previa.
 * @param event Evento de cambio del input de archivo.
 * @param callback Función de callback para manejar la vista previa de la imagen.
 */
export function handleImageSelection(event: Event, callback: (preview: string | null) => void): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  } else {
    callback(null);
  }
}
