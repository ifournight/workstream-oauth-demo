'use client'

import { useLocale } from 'next-intl'
import { Globe01, Check } from '@untitledui/icons'
import { Select } from '@/components/base/select/select'
import { Button } from '@/components/base/buttons/button'
import { Dropdown } from '@/components/base/dropdown/dropdown'
import { locales, type Locale } from '@/i18n'

interface LocaleSwitcherProps {
  noBorder?: boolean;
}

export function LocaleSwitcher({ noBorder = false }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale

  const localeOptions = [
    { id: 'en', label: 'English', icon: Globe01 },
    { id: 'zh-CN', label: '简体中文', icon: Globe01 },
  ]

  function handleLocaleChange(newLocale: string | null) {
    if (!newLocale) return
    
    // Set NEXT_LOCALE cookie (Next.js and next-intl automatically detect this)
    const cookieValue = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    document.cookie = cookieValue
    
    // Force a full page reload to apply the new locale
    window.location.reload()
  }

  const currentLocale = localeOptions.find(opt => opt.id === locale) || localeOptions[0]

  // For noBorder mode, use Button + Dropdown for cleaner implementation
  if (noBorder) {
    return (
      <Dropdown.Root>
        <Button
          aria-label="Select language"
          color="tertiary"
          size="sm"
          iconLeading={Globe01}
          className="!h-10 !px-3 !border-none !shadow-none !bg-transparent hover:!bg-secondary"
        >
          {currentLocale.label}
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu selectedKeys={[locale]} selectionMode="single">
            {localeOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <Dropdown.Item
                  key={option.id}
                  id={option.id}
                  onAction={() => handleLocaleChange(option.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {OptionIcon && <OptionIcon className="size-4 text-fg-quaternary" />}
                      <span className="text-sm font-semibold text-secondary">{option.label}</span>
                    </div>
                    {locale === option.id && <Check className="size-4 text-brand-primary" />}
                  </div>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
    );
  }

  // For normal mode, use Select component
  return (
    <Select
      selectedKey={locale}
      onSelectionChange={(key) => {
        const localeValue = typeof key === 'string' ? key : String(key)
        handleLocaleChange(localeValue)
      }}
      items={localeOptions}
      placeholderIcon={Globe01}
      className="w-auto min-w-[120px]"
    >
      {(item) => (
        <Select.Item 
          id={item.id} 
          label={item.label}
          icon={item.icon}
        />
      )}
    </Select>
  )
}

