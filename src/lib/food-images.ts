import grains from "@/assets/foods/grains.jpg";
import vegetables from "@/assets/foods/vegetables.jpg";
import fruits from "@/assets/foods/fruits.jpg";
import dairy from "@/assets/foods/dairy.jpg";
import eggs from "@/assets/foods/eggs.jpg";
import meat from "@/assets/foods/meat.jpg";
import fish from "@/assets/foods/fish.jpg";
import legumes from "@/assets/foods/legumes.jpg";
import nuts from "@/assets/foods/nuts.jpg";
import dishes from "@/assets/foods/dishes.jpg";
import snacks from "@/assets/foods/snacks.jpg";

const MAP: Record<string, string> = { grains, vegetables, fruits, dairy, eggs, meat, fish, legumes, nuts, dishes, snacks };

export const foodImage = (key: string) => MAP[key] ?? grains;

export const CATEGORIES = [
  "Grains", "Indian Dishes", "Vegetables", "Fruits", "Dairy", "Eggs", "Meat", "Fish",
  "Legumes", "Nuts", "Seeds", "Beverages", "Snacks",
];
