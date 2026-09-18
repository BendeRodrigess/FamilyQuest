import { companionSprite } from "@/lib/companion/sprites";

/**
 * Спрайт компаньйона. Про файли знає лише реєстр — тут ми оперуємо
 * видом і станом, тож заміна графіки цього компонента не торкається.
 *
 * `sleeping` вмикає лежачу позу — вона широка й доречна тільки в сцені
 * кімнати. У маленьких круглих аватарах на інших екранах використовується
 * звичайна поза з приглушеними кольорами (`muted`).
 */
export function CompanionSprite({
  species,
  sleeping = false,
  muted = false,
  name,
  className = "",
}: {
  species: string;
  sleeping?: boolean;
  muted?: boolean;
  name: string;
  className?: string;
}) {
  const sprite = companionSprite(species, sleeping);

  const motion = sleeping ? "fq-breathe" : muted ? "fq-bob-slow" : "fq-bob";

  return (
    // Спрайт масштабується без згладжування: оптимізатор next/image перекодував
    // би PNG і зіпсував піксель-арт, тому тут свідомо звичайний <img>.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sprite.src}
      alt={name}
      width={sprite.width}
      height={sprite.height}
      className={`fq-pixel ${motion} ${className}`}
      draggable={false}
    />
  );
}
