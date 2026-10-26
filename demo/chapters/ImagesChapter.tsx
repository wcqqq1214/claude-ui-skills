import { ImagePreview } from '../../src';
import landscape from '../../src/assets/artwork/landscape.svg';
import type { Locale } from '../i18n';
import { translate } from '../translations';

export function ImagesChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text);
  return <div className="mx-auto max-w-[480px]">
    <ImagePreview src={landscape} active={active}
      alt={t('Teal mountains and a clay-colored sun under a beige sky')}
      previewAlt={t('Enlarged view of teal mountains and a clay-colored sun under a beige sky')}
      openLabel={t('Enlarge landscape example')} dialogLabel={t('Enlarged image preview')}
      actionsLabel={t('Image preview actions')} closeLabel={t('Close image preview')} />
    <p className="demo-implementation mt-4 text-center text-sm leading-[1.5] text-cui-secondary">{t('Click the thumbnail to preview. Click the image or press Esc to return.')}</p>
  </div>;
}
