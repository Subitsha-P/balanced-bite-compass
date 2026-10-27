import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Clock, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { foodImage } from "@/lib/food-images";
import { DIET_LABELS } from "@/lib/nutrition";
import { SUITABLE_LABELS, type Recipe } from "@/lib/recipes";

export function DietDot({ diet }: { diet: Recipe["diet_type"] }) {
  const veg = diet === "vegan" || diet === "vegetarian";
  return (
    <span
      title={DIET_LABELS[diet]}
      className={cn("inline-grid h-4 w-4 shrink-0 place-items-center rounded-sm border-2", veg ? "border-primary" : diet === "eggetarian" ? "border-accent" : "border-destructive")}
    >
      <i className={cn("h-1.5 w-1.5 rounded-full", veg ? "bg-primary" : diet === "eggetarian" ? "bg-accent" : "bg-destructive")} />
    </span>
  );
}

export function LikeButton({ liked, onClick, disabled }: { liked: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={liked ? "Unlike this dish" : "I like this dish"}
      aria-pressed={liked}
      disabled={disabled}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border bg-card/95 shadow-soft backdrop-blur transition hover:scale-105",
        liked ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground",
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
    </button>
  );
}

export function RecipeCard({ recipe, liked, onLike, top, footer }: {
  recipe: Recipe;
  liked?: boolean | undefined;
  onLike?: (() => void) | undefined;
  top?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5">
      <Link to="/recipes/$slug" params={{ slug: recipe.slug }} className="flex flex-1 flex-col">
        <div className="relative h-36 overflow-hidden">
          <img src={foodImage(recipe.image)} alt="" loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {top && <div className="absolute left-3 top-3">{top}</div>}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start gap-2">
            <DietDot diet={recipe.diet_type} />
            <h3 className="font-semibold leading-tight">{recipe.name}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{recipe.region} · {recipe.course}</p>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{recipe.calories} kcal</span>
            <span>P {recipe.protein}g</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{recipe.prep_minutes + recipe.cook_minutes} min</span>
          </div>
          {recipe.suitable_for.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {recipe.suitable_for.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{SUITABLE_LABELS[t] ?? t}</Badge>)}
            </div>
          )}
          {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
        </div>
      </Link>
      {onLike && <div className="absolute right-3 top-3"><LikeButton liked={!!liked} onClick={onLike} /></div>}
    </article>
  );
}
