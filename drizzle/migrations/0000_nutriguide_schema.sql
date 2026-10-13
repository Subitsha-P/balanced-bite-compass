CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  age int CHECK (age IS NULL OR (age BETWEEN 10 AND 100)),
  gender text CHECK (gender IS NULL OR gender IN ('male','female')),
  height numeric CHECK (height IS NULL OR (height BETWEEN 100 AND 250)),
  weight numeric CHECK (weight IS NULL OR (weight BETWEEN 25 AND 300)),
  activity_level text CHECK (activity_level IS NULL OR activity_level IN ('sedentary','light','moderate','very','extreme')),
  goal text CHECK (goal IS NULL OR goal IN ('lose','maintain','gain')),
  diet_type text CHECK (diet_type IS NULL OR diet_type IN ('vegetarian','non_vegetarian','vegan','eggetarian')),
  allergies text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'full_name',''),100));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  serving_size text NOT NULL,
  calories numeric NOT NULL,
  protein numeric NOT NULL,
  carbohydrates numeric NOT NULL,
  fat numeric NOT NULL,
  fiber numeric NOT NULL DEFAULT 0,
  sugar numeric NOT NULL DEFAULT 0,
  diet_type text NOT NULL,
  allergens text[] NOT NULL DEFAULT '{}',
  meal_types text[] NOT NULL DEFAULT '{}',
  image text NOT NULL DEFAULT 'grains'
);
GRANT SELECT ON public.foods TO anon, authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods are public" ON public.foods FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_date date NOT NULL DEFAULT current_date,
  target_calories int NOT NULL,
  breakfast jsonb NOT NULL,
  lunch jsonb NOT NULL,
  snack jsonb NOT NULL,
  dinner jsonb NOT NULL,
  total_calories numeric NOT NULL,
  total_protein numeric NOT NULL,
  total_carbohydrates numeric NOT NULL,
  total_fat numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meal_plans_user_idx ON public.meal_plans(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.meal_plans TO authenticated;
GRANT ALL ON public.meal_plans TO service_role;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans select" ON public.meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own plans insert" ON public.meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own plans delete" ON public.meal_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.foods (name,category,serving_size,calories,protein,carbohydrates,fat,fiber,sugar,diet_type,allergens,meal_types,image)
SELECT n,c,s,k,p,cb,f,fi,su,
  CASE d WHEN 'vg' THEN 'vegan' WHEN 'v' THEN 'vegetarian' WHEN 'e' THEN 'eggetarian' ELSE 'non_vegetarian' END,
  CASE WHEN a='' THEN '{}'::text[] ELSE string_to_array(a,',') END,
  array_remove(ARRAY[
    CASE WHEN position('B' in m)>0 THEN 'breakfast' END,
    CASE WHEN position('L' in m)>0 THEN 'lunch' END,
    CASE WHEN position('D' in m)>0 THEN 'dinner' END,
    CASE WHEN position('S' in m)>0 THEN 'snack' END], NULL),
  img
FROM (VALUES
('White Rice (cooked)','Grains','1 cup (160g)',205,4.3,45,0.4,0.6,0.1,'vg','','LD','grains'),
('Brown Rice (cooked)','Grains','1 cup (160g)',216,5,45,1.8,3.5,0.7,'vg','','LD','grains'),
('Chapati','Grains','1 medium (40g)',120,3.1,18,3.7,1.9,0.4,'vg','gluten','BLD','grains'),
('Phulka Roti','Grains','1 medium (30g)',85,3,17,0.5,2.2,0.3,'vg','gluten','LD','grains'),
('Oats Porridge (water)','Grains','1 cup (234g)',166,5.9,28,3.6,4,0.6,'vg','','B','grains'),
('Ragi Mudde','Grains','1 ball (150g)',210,4.8,45,1,5.4,0.5,'vg','','LD','grains'),
('Quinoa (cooked)','Grains','1 cup (185g)',222,8.1,39,3.6,5.2,1.6,'vg','','LD','grains'),
('Whole Wheat Bread','Grains','2 slices (56g)',138,7,23,2,3.8,3,'vg','gluten','BS','grains'),
('Jowar Roti','Grains','1 medium (40g)',110,3.5,23,1,2.8,0.4,'vg','','LD','grains'),
('Bajra Roti','Grains','1 medium (40g)',120,3.6,22,2,3.2,0.4,'vg','','LD','grains'),
('Millet Khichdi','Grains','1 cup (200g)',230,8,38,5,4.5,1,'vg','','LD','grains'),
('Vegetable Pulao','Grains','1 cup (180g)',260,5.5,42,8,3,2,'vg','','LD','grains'),
('Idli','Indian Dishes','2 pieces (80g)',116,4,24,0.4,1.2,0.3,'vg','','BS','dishes'),
('Plain Dosa','Indian Dishes','1 medium (85g)',168,3.9,29,3.7,1,0.5,'vg','','BD','dishes'),
('Masala Dosa','Indian Dishes','1 medium (150g)',290,6,45,10,3,2,'vg','','BL','dishes'),
('Ven Pongal','Indian Dishes','1 cup (200g)',280,8,40,10,2.4,0.5,'v','dairy','B','dishes'),
('Rava Upma','Indian Dishes','1 cup (200g)',250,6,38,8,3,2,'vg','gluten','B','dishes'),
('Poha','Indian Dishes','1 cup (160g)',250,5,42,7,2.5,2,'vg','peanut','B','dishes'),
('Moong Dal Chilla','Indian Dishes','2 pieces (120g)',210,12,26,6,4,1,'vg','','BS','dishes'),
('Pesarattu','Indian Dishes','1 medium (110g)',190,11,26,5,4.5,1,'vg','','B','dishes'),
('Uttapam (vegetable)','Indian Dishes','1 medium (130g)',220,6,36,6,2.5,2,'vg','','B','dishes'),
('Sambar','Indian Dishes','1 cup (240g)',140,7,20,4,5,4,'vg','','BLD','dishes'),
('Rasam','Indian Dishes','1 cup (240g)',60,2,10,1.5,1.5,3,'vg','','LD','dishes'),
('Curd Rice','Indian Dishes','1 cup (200g)',230,6,36,6,0.8,4,'v','dairy','L','dishes'),
('Lemon Rice','Indian Dishes','1 cup (180g)',270,5,46,8,2,1,'vg','peanut','L','dishes'),
('Vegetable Biryani','Indian Dishes','1 cup (200g)',290,7,45,9,3.5,3,'v','dairy','LD','dishes'),
('Chicken Biryani','Indian Dishes','1 cup (200g)',360,18,42,13,2,2,'n','dairy','LD','meat'),
('Palak Paneer','Indian Dishes','1 cup (200g)',280,14,10,20,4,3,'v','dairy','LD','dairy'),
('Paneer Bhurji','Indian Dishes','1 cup (150g)',310,18,8,23,1.5,3,'v','dairy','BLD','dairy'),
('Aloo Paratha','Indian Dishes','1 piece (120g)',300,6,40,13,4,2,'v','gluten,dairy','B','grains'),
('Vegetable Kurma','Indian Dishes','1 cup (200g)',200,5,18,12,4.5,5,'vg','tree_nuts','LD','vegetables'),
('Avial','Indian Dishes','1 cup (200g)',180,4,16,11,5,5,'v','dairy','L','vegetables'),
('Kootu','Indian Dishes','1 cup (200g)',170,8,20,6,6,3,'vg','','LD','legumes'),
('Dhokla','Snacks','4 pieces (100g)',160,6,27,3,2,4,'vg','','BS','snacks'),
('Toor Dal','Legumes','1 cup cooked (200g)',230,13,36,3,9,2,'vg','','LD','legumes'),
('Moong Dal','Legumes','1 cup cooked (200g)',210,14,36,0.8,8,2,'vg','','LD','legumes'),
('Masoor Dal','Legumes','1 cup cooked (200g)',230,18,40,0.8,15,3.6,'vg','','LD','legumes'),
('Chana Masala','Legumes','1 cup (200g)',270,13,40,7,11,6,'vg','','LD','legumes'),
('Rajma Curry','Legumes','1 cup (200g)',250,14,40,4,12,3,'vg','','LD','legumes'),
('Boiled Chickpeas','Legumes','1 cup (165g)',269,14.5,45,4.2,12.5,7.9,'vg','','LS','legumes'),
('Sprouted Moong','Legumes','1 cup (100g)',31,3,6,0.2,1.9,4.1,'vg','','BS','legumes'),
('Black Chana (kala chana)','Legumes','1 cup cooked (160g)',270,15,45,4,12,8,'vg','','LS','legumes'),
('Soya Chunks (cooked)','Legumes','1 cup (100g)',172,26,13,1,6,2,'vg','soy','LD','legumes'),
('Tofu (firm)','Legumes','100g',144,15.7,3.5,8.7,2.3,0.6,'vg','soy','LD','legumes'),
('Edamame','Legumes','1 cup (155g)',188,18.4,13.8,8,8,3.4,'vg','soy','S','legumes'),
('Paneer','Dairy','100g',265,18,3.6,20,0,2.6,'v','dairy','LD','dairy'),
('Curd (plain)','Dairy','1 cup (245g)',150,8.5,11.4,8,0,11.4,'v','dairy','BLS','dairy'),
('Greek Yogurt (low-fat)','Dairy','1 cup (200g)',146,20,8,4,0,7,'v','dairy','BS','dairy'),
('Milk (toned)','Dairy','1 cup (240ml)',120,8,12,4.5,0,12,'v','dairy','BS','dairy'),
('Skimmed Milk','Dairy','1 cup (240ml)',83,8.3,12,0.2,0,12,'v','dairy','BS','dairy'),
('Buttermilk (chaas)','Beverages','1 glass (250ml)',40,3,5,1,0,4,'v','dairy','LS','snacks'),
('Cheese Slice','Dairy','1 slice (20g)',70,4,1,5.5,0,0.5,'v','dairy','BS','dairy'),
('Cottage Cheese','Dairy','1/2 cup (113g)',98,11,3.4,4.3,0,2.7,'v','dairy','BS','dairy'),
('Boiled Egg','Eggs','1 large (50g)',78,6.3,0.6,5.3,0,0.6,'e','egg','BS','eggs'),
('Egg Whites','Eggs','3 large (100g)',52,10.9,0.7,0.2,0,0.7,'e','egg','BS','eggs'),
('Masala Omelette','Eggs','2 eggs (130g)',200,13,3,15,0.8,1.5,'e','egg','BD','eggs'),
('Egg Bhurji','Eggs','2 eggs (130g)',210,13,4,16,1,1.5,'e','egg','BD','eggs'),
('Egg Curry','Eggs','1 cup (200g)',240,14,8,17,2,4,'e','egg','LD','eggs'),
('Chicken Breast (grilled)','Meat','100g',165,31,0,3.6,0,0,'n','','LD','meat'),
('Tandoori Chicken','Meat','2 pieces (150g)',260,36,4,11,1,2,'n','dairy','LD','meat'),
('Chicken Curry','Meat','1 cup (200g)',290,26,8,17,2,3,'n','','LD','meat'),
('Chicken Tikka','Meat','6 pieces (120g)',200,28,4,8,0.5,1.5,'n','dairy','DS','meat'),
('Mutton Curry','Meat','1 cup (200g)',380,28,6,27,1.5,2,'n','','LD','meat'),
('Lean Turkey Breast','Meat','100g',135,30,0,1,0,0,'n','','LD','meat'),
('Chicken Soup (clear)','Meat','1 bowl (250ml)',90,10,6,3,1,2,'n','','DS','meat'),
('Grilled Fish (rohu)','Fish','100g',130,22,0,4.5,0,0,'n','fish','LD','fish'),
('Fish Curry (Kerala)','Fish','1 cup (200g)',250,24,6,14,1.5,2,'n','fish','LD','fish'),
('Salmon (baked)','Fish','100g',206,22,0,12,0,0,'n','fish','LD','fish'),
('Tuna (canned in water)','Fish','100g',116,25.5,0,0.8,0,0,'n','fish','LS','fish'),
('Sardines (grilled)','Fish','100g',208,25,0,11,0,0,'n','fish','LD','fish'),
('Prawn Masala','Fish','1 cup (180g)',220,24,7,10,1.5,2,'n','shellfish','LD','fish'),
('Steamed Prawns','Fish','100g',99,24,0.2,0.3,0,0,'n','shellfish','LD','fish'),
('Crab Curry','Fish','1 cup (180g)',210,22,6,10,1,2,'n','shellfish','LD','fish'),
('Banana','Fruits','1 medium (118g)',105,1.3,27,0.4,3.1,14,'vg','','BS','fruits'),
('Apple','Fruits','1 medium (182g)',95,0.5,25,0.3,4.4,19,'vg','','BS','fruits'),
('Guava','Fruits','1 medium (100g)',68,2.6,14,1,5.4,9,'vg','','S','fruits'),
('Orange','Fruits','1 medium (131g)',62,1.2,15,0.2,3.1,12,'vg','','BS','fruits'),
('Papaya','Fruits','1 cup (145g)',62,0.7,16,0.4,2.5,11,'vg','','BS','fruits'),
('Mango','Fruits','1 cup (165g)',99,1.4,25,0.6,2.6,23,'vg','','S','fruits'),
('Pomegranate','Fruits','1/2 cup arils (87g)',72,1.5,16,1,3.5,12,'vg','','BS','fruits'),
('Watermelon','Fruits','1 cup (152g)',46,0.9,11.5,0.2,0.6,9.4,'vg','','S','fruits'),
('Pineapple','Fruits','1 cup (165g)',82,0.9,22,0.2,2.3,16,'vg','','S','fruits'),
('Grapes','Fruits','1 cup (151g)',104,1.1,27,0.2,1.4,23,'vg','','S','fruits'),
('Pear','Fruits','1 medium (178g)',101,0.6,27,0.2,5.5,17,'vg','','S','fruits'),
('Kiwi','Fruits','2 medium (150g)',92,1.7,22,0.8,4.5,13.5,'vg','','S','fruits'),
('Dates','Fruits','3 pieces (24g)',66,0.6,18,0,1.6,16,'vg','','S','fruits'),
('Avocado','Fruits','1/2 fruit (100g)',160,2,8.5,14.7,6.7,0.7,'vg','','BS','fruits'),
('Carrot','Vegetables','1 medium (61g)',25,0.6,6,0.1,1.7,2.9,'vg','','LS','vegetables'),
('Spinach (cooked)','Vegetables','1 cup (180g)',41,5.3,6.8,0.5,4.3,0.8,'vg','','LD','vegetables'),
('Tomato','Vegetables','1 medium (123g)',22,1.1,4.8,0.2,1.5,3.2,'vg','','LD','vegetables'),
('Cucumber','Vegetables','1 cup sliced (104g)',16,0.7,3.8,0.1,0.5,1.7,'vg','','LDS','vegetables'),
('Broccoli (steamed)','Vegetables','1 cup (156g)',55,3.7,11,0.6,5.1,2.2,'vg','','LD','vegetables'),
('Cauliflower Sabzi','Vegetables','1 cup (150g)',110,3,10,7,4,3,'vg','','LD','vegetables'),
('Bhindi Sabzi (okra)','Vegetables','1 cup (150g)',120,3,12,7,5,3,'vg','','LD','vegetables'),
('Beans Poriyal','Vegetables','1 cup (150g)',100,3,11,5,5,2,'vg','','LD','vegetables'),
('Cabbage Poriyal','Vegetables','1 cup (150g)',90,2.5,10,5,4,4,'vg','','LD','vegetables'),
('Bottle Gourd Curry','Vegetables','1 cup (200g)',80,2,10,4,3,4,'vg','','LD','vegetables'),
('Mixed Vegetable Salad','Vegetables','1 bowl (200g)',60,2.5,12,0.5,4,6,'vg','','LDS','vegetables'),
('Sweet Potato (boiled)','Vegetables','1 medium (130g)',112,2,26,0.1,3.9,5.4,'vg','','BLS','vegetables'),
('Beetroot','Vegetables','1 cup (136g)',58,2.2,13,0.2,3.8,9,'vg','','LS','vegetables'),
('Mushroom Masala','Vegetables','1 cup (150g)',130,5,9,8,3,3,'vg','','LD','vegetables'),
('Green Peas (cooked)','Vegetables','1 cup (160g)',134,8.6,25,0.4,8.8,9.5,'vg','','LD','vegetables'),
('Almonds','Nuts','10 pieces (14g)',82,3,3,7,1.7,0.6,'vg','tree_nuts','BS','nuts'),
('Peanuts (roasted)','Nuts','1 handful (28g)',166,7.5,6,14,2.4,1.2,'vg','peanut','S','nuts'),
('Walnuts','Nuts','7 halves (14g)',92,2.1,1.9,9.2,1,0.4,'vg','tree_nuts','BS','nuts'),
('Cashews','Nuts','10 pieces (16g)',90,2.9,4.9,7,0.5,1,'vg','tree_nuts','S','nuts'),
('Pistachios','Nuts','1 handful (28g)',159,5.7,7.7,12.8,3,2.2,'vg','tree_nuts','S','nuts'),
('Peanut Butter','Nuts','2 tbsp (32g)',188,8,6,16,2,3,'vg','peanut','BS','nuts'),
('Pumpkin Seeds','Seeds','2 tbsp (16g)',90,4.8,1.7,7.8,1,0.2,'vg','','BS','nuts'),
('Flax Seeds','Seeds','1 tbsp (10g)',55,1.9,3,4.3,2.8,0.2,'vg','','BS','nuts'),
('Chia Seeds','Seeds','1 tbsp (12g)',58,2,5,3.7,4.1,0,'vg','','BS','nuts'),
('Sunflower Seeds','Seeds','2 tbsp (18g)',104,3.7,3.6,9,1.6,0.5,'vg','','S','nuts'),
('Sesame Seeds','Seeds','1 tbsp (9g)',52,1.6,2.1,4.5,1.1,0,'vg','sesame','S','nuts'),
('Green Tea','Beverages','1 cup (240ml)',2,0,0,0,0,0,'vg','','BS','snacks'),
('Coconut Water','Beverages','1 glass (240ml)',46,1.7,9,0.5,2.6,6,'vg','','S','snacks'),
('Masala Chai (with milk)','Beverages','1 cup (150ml)',90,2.5,13,3,0,11,'v','dairy','BS','snacks'),
('Filter Coffee (with milk)','Beverages','1 cup (150ml)',80,2.5,10,3,0,9,'v','dairy','BS','snacks'),
('Banana Smoothie (milk)','Beverages','1 glass (300ml)',220,8,38,5,3,26,'v','dairy','BS','fruits'),
('Lassi (sweet)','Beverages','1 glass (250ml)',180,6,30,4,0,28,'v','dairy','S','dairy'),
('Soy Milk (unsweetened)','Beverages','1 cup (240ml)',80,7,4,4,1,1,'vg','soy','BS','dairy'),
('Lemon Water','Beverages','1 glass (250ml)',12,0.2,3.5,0,0.2,1,'vg','','S','fruits'),
('Roasted Makhana','Snacks','1 cup (30g)',105,3.3,23,0.2,0.4,0,'vg','','S','snacks'),
('Roasted Chana','Snacks','1/4 cup (30g)',120,6.5,19,2,5,3,'vg','','S','snacks'),
('Sprouts Chaat','Snacks','1 bowl (150g)',140,9,22,1.5,6,4,'vg','','S','snacks'),
('Fruit Chaat','Snacks','1 bowl (200g)',120,1.5,30,0.5,4,22,'vg','','S','fruits'),
('Vegetable Sandwich','Snacks','1 sandwich (150g)',230,7,36,6,5,5,'v','gluten,dairy','BS','snacks'),
('Peanut Chikki','Snacks','1 piece (25g)',130,3.5,14,7,1,11,'vg','peanut','S','nuts'),
('Ragi Malt','Beverages','1 glass (250ml)',160,5,30,2.5,3,10,'v','dairy','BS','grains'),
('Muesli with Milk','Grains','1 bowl (250g)',290,11,48,6,5,16,'v','dairy,gluten,tree_nuts','B','grains'),
('Overnight Oats with Chia','Grains','1 jar (250g)',310,12,45,9,8,12,'v','dairy','B','grains'),
('Baked Samosa','Snacks','1 piece (60g)',150,3,20,6,2,1,'vg','gluten','S','snacks'),
('Hummus with Carrot Sticks','Snacks','1/4 cup + carrots (110g)',150,5,15,8,5,3,'vg','sesame','S','legumes'),
('Chicken Salad','Meat','1 bowl (250g)',250,30,10,10,4,4,'n','','LD','meat'),
('Egg Sandwich','Eggs','1 sandwich (150g)',280,15,30,11,4,4,'e','egg,gluten','BS','eggs')
) AS t(n,c,s,k,p,cb,f,fi,su,d,a,m,img);