import { companionSprite } from "@/lib/companion/sprites";

/**
 * Спрайт компаньйона. Про файли знає лише реєстр — тут ми оперуємо
 * видом і станом, тож заміна графіки цього компонента не торкається.
 */
export function CompanionSprite({
  species,
  sleeping,
  name,
  className = "",
}: {
  species: string;
  sleeping: boolean;
  name: string;
  className?: string;
}) {
  const sprite = companionSprite(species, sleeping);

  return (
    // Спрайт масштабується без згладжування: оптимізатор next/image перекодував
    // би PNG і зіпсував піксель-арт, тому тут свідомо звичайний <img>.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sprite.src}
      alt={name}
      width={sprite.width}
      height={sprite.height}
      className={`fq-pixel ${sleeping ? "fq-bob-slow" : "fq-bob"} ${className}`}
      draggable={false}
    />
  );
}
