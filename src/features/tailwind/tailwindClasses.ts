export const tailwindClasses = [
  'absolute', 'relative', 'fixed', 'sticky', 'hidden', 'block', 'inline-block', 'inline-flex',
  'flex', 'grid', 'contents', 'items-start', 'items-center', 'items-end', 'justify-start',
  'justify-center', 'justify-between', 'justify-end', 'gap-1', 'gap-2', 'gap-3', 'gap-4',
  'w-full', 'h-full', 'min-h-screen', 'max-w-full', 'overflow-hidden', 'overflow-auto',
  'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8', 'px-2', 'px-3', 'px-4', 'px-6',
  'py-1', 'py-2', 'py-3', 'py-4', 'm-0', 'mx-auto', 'mt-2', 'mt-4', 'mb-2', 'mb-4',
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'font-normal',
  'font-medium', 'font-semibold', 'font-bold', 'text-left', 'text-center', 'text-right',
  'text-white', 'text-black', 'text-gray-500', 'text-gray-700', 'text-blue-500',
  'bg-white', 'bg-black', 'bg-gray-100', 'bg-gray-800', 'bg-blue-500', 'bg-transparent',
  'border', 'border-0', 'border-gray-200', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-full',
  'shadow', 'shadow-md', 'shadow-lg', 'opacity-0', 'opacity-50', 'opacity-100',
  'transition', 'transition-colors', 'duration-150', 'duration-200', 'duration-300',
  'cursor-pointer', 'select-none', 'truncate', 'whitespace-nowrap',
] as const;

export const tailwindPrefixes = new Set(
  tailwindClasses.map(value => value.replace(/^-/, '').split('-')[0]),
);
