import { Gallery } from '../../src';
import landscape from '../../src/assets/artwork/landscape.svg';
import dusk from '../../src/assets/artwork/landscape-dusk.svg';
import sand from '../../src/assets/artwork/landscape-sand.svg';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import '../styles/media-parity.css';
export function GalleryChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string, ...values: (string | number)[]) => translate(locale, text, ...values);
  return <div className="demo-card extra-pad demo-gallery-card">
    <Gallery active={active} items={[
      { id: 'green', src: landscape, alt: t('Green mountains'), filename: 'landscape.svg' },
      { id: 'dusk', src: dusk, alt: t('Dusk'), filename: 'landscape-dusk.svg' },
      { id: 'sand', src: sand, alt: t('Sand dunes'), filename: 'landscape-sand.svg' },
    ]} labels={{ dialog: t('Example gallery'), close: t('Close gallery'), previous: t('Previous image'), next: t('Next image'),
      open: (_, index) => t('Open gallery image {0}', index + 1), zoom: (_, index) => t('Image {0}, click to zoom', index + 1), count: (position, total) => t('{0} of {1}', position, total),
    }} />
    <div className="demo-card-foot"><span>{t('← → Browse; Enter Zoom; Drag Pan; Esc Close')}</span></div>
  </div>;
}
