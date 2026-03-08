const dict = {
  en: {
    overview: 'Overview',
    projects: 'Projects',
    tasks: 'Tasks',
    ideas: 'Ideas',
    passwords: 'Passwords',
    settings: 'Settings',
    comingSoon: 'Coming soon',
    selectTab: 'Select a tab from the sidebar',
  },
  es: {
    overview: 'Resumen',
    projects: 'Proyectos',
    tasks: 'Tareas',
    ideas: 'Ideas',
    passwords: 'Contraseñas',
    settings: 'Configuración',
    comingSoon: 'Próximamente',
    selectTab: 'Selecciona una pestaña del sidebar',
  },
} as const;

export type LangKey = keyof typeof dict.en;

export function t(key: LangKey, lang: 'en' | 'es' = 'en'): string {
  return dict[lang][key];
}
