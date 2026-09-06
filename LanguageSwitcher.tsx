import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Select value={i18n.language?.split('-')[0] || 'en'} onValueChange={handleChange}>
      <SelectTrigger className="w-[110px] h-8 text-xs border-muted-foreground/30">
        <SelectValue placeholder={t('language_switcher.label')} />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map(lang => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
