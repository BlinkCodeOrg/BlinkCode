const spacing: Record<string, string> = { '0': '0px', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '6': '1.5rem', '8': '2rem' };
const colors: Record<string, string> = {
  white: '#ffffff', black: '#000000', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb',
  'gray-500': '#6b7280', 'gray-700': '#374151', 'gray-800': '#1f2937', 'blue-500': '#3b82f6',
};

export function getTailwindClassPreview(className: string): string | null {
  const value = className.split(':').at(-1) || className;
  const exact: Record<string, string> = {
    flex: 'display: flex;', grid: 'display: grid;', block: 'display: block;', hidden: 'display: none;',
    absolute: 'position: absolute;', relative: 'position: relative;', fixed: 'position: fixed;',
    'items-center': 'align-items: center;', 'justify-center': 'justify-content: center;',
    'justify-between': 'justify-content: space-between;', 'w-full': 'width: 100%;', 'h-full': 'height: 100%;',
    'min-h-screen': 'min-height: 100vh;', 'mx-auto': 'margin-left: auto;\nmargin-right: auto;',
    'font-medium': 'font-weight: 500;', 'font-semibold': 'font-weight: 600;', 'font-bold': 'font-weight: 700;',
    'text-center': 'text-align: center;', 'rounded': 'border-radius: 0.25rem;',
    'rounded-md': 'border-radius: 0.375rem;', 'rounded-lg': 'border-radius: 0.5rem;',
    'rounded-full': 'border-radius: 9999px;', 'cursor-pointer': 'cursor: pointer;',
  };
  if (exact[value]) return exact[value];

  const spacingMatch = value.match(/^(p|px|py|m|mt|mb|gap)-(\d+)$/);
  if (spacingMatch && spacing[spacingMatch[2]]) {
    const property: Record<string, string> = {
      p: 'padding', px: 'padding-inline', py: 'padding-block', m: 'margin',
      mt: 'margin-top', mb: 'margin-bottom', gap: 'gap',
    };
    return `${property[spacingMatch[1]]}: ${spacing[spacingMatch[2]]};`;
  }
  const colorMatch = value.match(/^(text|bg|border)-(.+)$/);
  if (colorMatch && colors[colorMatch[2]]) {
    const property = colorMatch[1] === 'text' ? 'color' : colorMatch[1] === 'bg' ? 'background-color' : 'border-color';
    return `${property}: ${colors[colorMatch[2]]};`;
  }
  return null;
}
