# Balanced Bite Compass

Build a complete, fully functional full-stack web application from scratch called NutriGuide – AI-Powered Diet Recommendation System.

Do not create a simple static demo. Build the complete working application with frontend, backend, database, authentication, APIs, calorie calculation, food database, personalized recommendations, allergy filtering, and meal planning.

The application should be suitable as a MTech Artificial Intelligence and Data Science academic project and should have a professional but simple and easy-to-use interface.

1. PROJECT OBJECTIVE

NutriGuide is a personalized diet recommendation web application.

The application should allow a user to:

Create an account.

Log in securely.

Create and update their health/diet profile.

Calculate their BMI.

Calculate their estimated BMR.

Calculate their estimated daily calorie requirement.

Set a weight goal.

Browse a food database.

Search and filter foods.

Specify dietary preferences.

Specify food allergies.

Receive personalized food recommendations.

Generate a personalized daily meal plan.

View nutritional information for recommended foods and meals.

View their profile and saved information after logging in.

The complete user workflow should be:

Register → Login → Profile → Calorie Calculation → Food Database → Personalized Recommendations → Meal Plan

2. TECHNOLOGY STACK

Use the following technologies:

Frontend

HTML5

CSS3

JavaScript

Responsive design

Backend

Node.js

Express.js

Database

MongoDB

Mongoose

Authentication

Secure password hashing using bcrypt

Session-based or JWT-based authentication

Do not store plain-text passwords

Communication

REST APIs

JavaScript fetch() for frontend-backend communication

Use environment variables for sensitive information.

Do not hardcode:

MongoDB credentials

JWT secrets

Passwords

API keys

3. PROJECT STRUCTURE

Create a clean project structure similar to:

nutriguide/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── calculator.html
│   ├── foods.html
│   ├── food-details.html
│   ├── recommendations.html
│   ├── mealplan.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   └── responsive.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── profile.js
│   │   ├── calculator.js
│   │   ├── foods.js
│   │   ├── recommendations.js
│   │   └── mealplan.js
│   │
│   └── images/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Profile.js
│   │   └── Food.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── foodRoutes.js
│   │   ├── recommendationRoutes.js
│   │   └── mealPlanRoutes.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── foodController.js
│   │   ├── recommendationController.js
│   │   └── mealPlanController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   └── services/
│       ├── calorieService.js
│       ├── recommendationService.js
│       └── mealPlanService.js
│
├── package.json
└── README.md


Keep the architecture organized and modular.

4. HOME PAGE

Create a professional landing page.

The homepage should contain:

Navigation Bar

Display:

NutriGuide logo

Home

About

Features

How It Works

Login

Register

After login, replace Login/Register with:

Dashboard

Profile

Logout

Hero Section

Heading:

Your Personal Guide to Smarter Eating

Subtitle:

Calculate your nutritional needs, discover suitable foods, and create personalized meal plans based on your lifestyle and dietary preferences.

Buttons:

Get Started

Calculate Calories

Add an attractive healthy-food visual.

Features Section

Show cards for:

Personalized Calorie Calculation

Food Nutrition Database

Allergy-Aware Recommendations

Personalized Meal Planning

Dietary Preference Support

How It Works

Display four steps:

1. Create Profile

Enter personal and dietary information.

2. Calculate Needs

Calculate estimated calorie requirements.

3. Get Recommendations

Receive suitable food recommendations.

4. Generate Meal Plan

Create a personalized daily meal plan.

Disclaimer

Display:

“NutriGuide provides estimated nutritional information for educational purposes and is not a substitute for professional medical or dietary advice.”

5. REGISTRATION SYSTEM

Create a complete registration page.

Fields:

Full Name

Email

Password

Confirm Password

Validation:

All fields required

Valid email format

Minimum password length

Password confirmation must match

Email must be unique

When the user registers:

Validate the input.

Send data to backend.

Hash password using bcrypt.

Store user in MongoDB.

Return success response.

Redirect user to login.

Display proper success and error messages.

6. LOGIN SYSTEM

Create a complete login page.

Fields:

Email

Password

When the user logs in:

Send credentials to backend.

Find user in MongoDB.

Compare hashed password.

Create authentication token/session.

Store authentication information securely.

Redirect to dashboard.

Handle:

Incorrect email

Incorrect password

Missing fields

Server errors

Add:

“Don't have an account? Register here.”

7. USER DASHBOARD

After login, show a personalized dashboard.

Display:

Welcome Message

Example:

Welcome back, Subitsha!

Summary Cards

Display:

Current Weight

BMI

Estimated Daily Calories

Goal

Quick Actions

Buttons:

Update Profile

Calculate Calories

Browse Foods

Get Recommendations

Generate Meal Plan

Today's Recommendation

Show a small preview of recommended foods.

Today's Meal Plan

Show a preview of breakfast, lunch, snack and dinner.

8. USER PROFILE

Create a complete profile page.

Fields:

Personal Information

Full Name

Age

Gender

Body Information

Height in cm

Weight in kg

Lifestyle

Activity level:

Sedentary

Lightly Active

Moderately Active

Very Active

Extremely Active

Goal

Lose Weight

Maintain Weight

Gain Weight

Diet Type

Vegetarian

Non-Vegetarian

Vegan

Eggetarian

Allergies

Allow multiple selections:

Milk/Dairy

Egg

Peanut

Tree Nuts

Soy

Gluten

Fish

Shellfish

Also allow:

No known allergies

Save the profile to MongoDB.

Allow users to edit their profile.

9. CALORIE CALCULATOR

Create a dedicated calorie calculator page.

Inputs:

Age

Gender

Height

Weight

Activity Level

Goal

Calculate:

BMI

Use:

BMI = weight / height²


Display BMI category:

Underweight

Normal

Overweight

Obese

BMR

Use the Mifflin-St Jeor equation.

Male:

BMR = 10 × weight + 6.25 × height − 5 × age + 5


Female:

BMR = 10 × weight + 6.25 × height − 5 × age − 161


TDEE

Calculate estimated daily energy expenditure using:

Sedentary = 1.2
Lightly Active = 1.375
Moderately Active = 1.55
Very Active = 1.725
Extremely Active = 1.9


TDEE = BMR × Activity Factor


Goal Calories

For the initial application:

Weight Loss = TDEE - 500
Maintenance = TDEE
Weight Gain = TDEE + 300


Display:

BMI

BMI category

BMR

TDEE

Target Calories

Use attractive result cards.

Clearly label calorie values as estimates.

10. FOOD DATABASE

Create a large food database.

Do not limit the application to only a few sample foods.

Create food records with:

Food name

Category

Serving size

Calories

Protein

Carbohydrates

Fat

Fiber

Sugar

Diet type

Allergens

Image

Categories can include:

Grains

Vegetables

Fruits

Dairy

Eggs

Meat

Fish

Legumes

Nuts

Seeds

Beverages

Snacks

Include Indian foods as an important part of the database.

Examples:

Rice

Brown Rice

Chapati

Roti

Idli

Dosa

Pongal

Upma

Poha

Dal

Sambar

Rasam

Chana

Rajma

Paneer

Curd

Milk

Egg

Chicken

Fish

Banana

Apple

Guava

Orange

Papaya

Carrot

Spinach

Tomato

Cucumber

Almonds

Peanuts

Pumpkin Seeds

Flax Seeds

Chia Seeds

Include enough food records to make the application look like a real working prototype.

11. FOOD DATABASE UI

Display foods using attractive cards.

Each card should show:

Food image

Food name

Serving size

Calories

Protein

Carbs

Fat

Add:

Search

Search foods by name.

Category Filter

Filter by category.

Diet Filter

Filter by:

Vegetarian

Non-Vegetarian

Vegan

Eggetarian

Calorie Filter

Allow users to filter foods by calorie range.

Protein Filter

Allow users to find high-protein foods.

Allergy Filter

Foods containing selected allergens should be excluded when the allergy filter is active.

12. FOOD DETAILS PAGE

When a user clicks a food card, open a detailed food page/modal.

Display:

Large food image

Food name

Serving size

Calories

Protein

Carbohydrates

Fat

Fiber

Sugar

Diet type

Allergens

Also show a simple nutrition breakdown.

13. RECOMMENDATION ENGINE

Build a real rule-based recommendation engine.

Do not simply display random foods.

The recommendation engine should consider:

User profile

Age

Gender

Height

Weight

Activity

Goal

Diet type

Allergies

Nutritional target

Use the user's estimated calorie requirement.

Dietary restrictions

Remove foods incompatible with the selected diet.

Allergies

Strictly remove foods containing allergens selected by the user.

For example:

If the user selects:

Milk/Dairy allergy

do not recommend:

Milk

Paneer

Curd

Cheese

If the user selects:

Egg allergy

do not recommend eggs or foods containing egg.

Goal-based recommendation

For weight loss:

Prefer:

Lower-calorie foods

High-protein foods

High-fiber foods

Fruits and vegetables

For maintenance:

Provide balanced foods.

For weight gain:

Prefer:

Nutrient-dense foods

Higher-calorie foods

Protein-rich foods

Healthy fats

Recommendation scoring

Create a simple scoring system.

For example:

Recommendation Score =
Diet Compatibility
+ Allergy Safety
+ Goal Suitability
+ Protein Suitability
+ Calorie Suitability


Rank foods based on score.

Display the reason for each recommendation.

Example:

Chicken Breast

“Recommended because it is high in protein and suitable for your selected diet.”

14. RECOMMENDATION PAGE

Create a dedicated Recommendations page.

Display:

Your Daily Target

Example:

Estimated Target: 1,850 kcal/day

Then sections:

Recommended Foods

Show ranked food cards.

Each card should display:

Food

Calories

Protein

Carbs

Fat

Recommendation score

Why it was recommended

Also provide filters:

Breakfast

Lunch

Dinner

Snacks

High Protein

Low Calorie

High Fiber

15. MEAL PLAN GENERATOR

Create a personalized daily meal planner.

Use the user's target calories.

Divide calories approximately:

Breakfast = 25%
Lunch = 35%
Snack = 10%
Dinner = 30%


Example for 2000 kcal:

Breakfast = 500 kcal
Lunch = 700 kcal
Snack = 200 kcal
Dinner = 600 kcal


Select suitable foods from the database.

The meal plan must respect:

Diet type

Allergies

Weight goal

Calorie target

Each meal should display:

Breakfast

Food items
Calories
Protein
Carbs
Fat

Lunch

Food items
Calories
Protein
Carbs
Fat

Snack

Food items
Calories
Protein
Carbs
Fat

Dinner

Food items
Calories
Protein
Carbs
Fat

At the bottom show:

Total calories

Total protein

Total carbohydrates

Total fat

Compare total calories with the target.

16. MEAL PLAN REGENERATION

Add a:

Generate New Meal Plan

button.

When clicked, generate another suitable meal combination.

Do not generate foods that violate allergies or dietary preferences.

Add:

Save Meal Plan

so that the user can save the generated plan.

17. BACKEND API

Create Express REST APIs.

Authentication

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me


Profile

GET /api/profile
POST /api/profile
PUT /api/profile


Foods

GET /api/foods
GET /api/foods/:id
GET /api/foods/search


Recommendations

POST /api/recommendations


Meal Plans

POST /api/mealplans/generate
POST /api/mealplans/save
GET /api/mealplans
GET /api/mealplans/:id


Protect user-specific APIs with authentication middleware.

18. DATABASE MODELS

Create MongoDB/Mongoose models.

User

name
email
password
createdAt


Profile

userId
age
gender
height
weight
activityLevel
goal
dietType
allergies
updatedAt


Food

name
category
servingSize
calories
protein
carbohydrates
fat
fiber
sugar
dietType
allergens
image


MealPlan

userId
date
targetCalories
breakfast
lunch
snack
dinner
totalCalories
totalProtein
totalCarbohydrates
totalFat
createdAt


19. SECURITY

Implement basic security practices.

Hash passwords using bcrypt.

Never store plain-text passwords.

Protect authenticated routes.

Validate all incoming data.

Sanitize user inputs.

Use environment variables.

Do not expose database credentials.

Add appropriate CORS configuration.

Return safe error messages.

20. RESPONSIVE DESIGN

The website must work properly on:

Desktop

Laptop

Tablet

Mobile

The navigation should become mobile-friendly.

Food cards should automatically adjust to screen size.

Forms should remain easy to use on mobile devices.

21. DESIGN

Use a modern nutrition/health visual style.

Design characteristics:

Clean

Minimal

Professional

Friendly

Modern

Easy to navigate

Use:

Rounded cards

Soft shadows

Attractive food images

Clear typography

Consistent spacing

Icons

Progress indicators

Nutrition badges

Responsive grids

Use a consistent color palette suitable for a health application.

Do not make the design overly complicated.

22. ERROR HANDLING

Every API should return meaningful JSON responses.

Frontend should display friendly messages for:

Invalid login

Registration failure

Missing profile

Database error

Network error

No foods found

No suitable recommendations

No suitable meal plan

Never leave the user with a blank screen.

23. LOADING STATES

Whenever data is being loaded:

Display:

Loading...

or an appropriate loading spinner.

Disable buttons temporarily during important requests to prevent duplicate submissions.

24. EMPTY STATES

If no recommendations are available, display something like:

“No foods match your current dietary restrictions. Try updating your preferences.”

If there are no saved meal plans:

“You haven't saved any meal plans yet.”

25. FRONTEND-BACKEND INTEGRATION

The frontend must not contain fake data for the main application.

Use fetch() to communicate with the backend.

Example:

Frontend
   ↓
fetch()
   ↓
Express API
   ↓
Controller
   ↓
MongoDB
   ↓
Response
   ↓
Frontend


Use real API responses to populate:

Profile

Food database

Recommendations

Meal plans

Dashboard

26. DATABASE SEEDING

Create a seed script that automatically inserts the initial food database into MongoDB.

Provide enough realistic food records for testing.

The seed script should be easy to run, for example:

npm run seed


Do not require manually entering every food into MongoDB.

27. ENVIRONMENT CONFIGURATION

Create a .env file containing placeholders such as:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key


Create .env.example without real credentials.

Make sure .env is included in .gitignore.

28. RUNNING THE PROJECT

Configure the project so it can be started easily.

Backend:

npm install
npm run dev


or:

npm start


Frontend should be served properly by the Express server or through a suitable development server.

The final application should have a clear local URL such as:

http://localhost:5000


29. README

Create a detailed README explaining:

Project overview

Features

Technology stack

Project structure

Installation

MongoDB setup

Environment variables

Database seeding

Running the backend

Opening the application

API endpoints

Recommendation logic

Future improvements

Write the README so that a beginner can follow it.

30. TESTING

Test the complete workflow.

Test 1

Register a new user.

Test 2

Log in.

Test 3

Create profile.

Test 4

Calculate BMI and calories.

Test 5

Browse food database.

Test 6

Search for food.

Test 7

Apply diet filter.

Test 8

Apply allergy filter.

Test 9

Generate recommendations.

Test 10

Generate meal plan.

Test 11

Save meal plan.

Test 12

Log out and log in again.

Verify that the user's profile and saved information remain available.

31. IMPORTANT ALLERGY SAFETY

Allergy filtering must be treated as a strict exclusion rule.

If a user selects an allergy, the recommendation engine must never intentionally recommend a food whose allergen list contains that allergen.

However, clearly state that the database may not capture every ingredient or cross-contamination risk and users with serious allergies should verify food ingredients independently.

32. FUTURE AI EXTENSION

Design the application so that the current rule-based recommendation engine can later be replaced or enhanced with a machine-learning recommendation model.

Create the recommendation service as a separate module so that an ML model can later be integrated.

Possible future improvements:

KNN recommendation

Content-based recommendation

Machine learning personalization

User feedback

Food preference learning

Recommendation ranking

Nutritional optimization

Do not claim that a machine-learning model is being used unless it is actually implemented.

33. FINAL REQUIREMENT

Build the application completely from scratch.

Do not give me only a design or prototype.

Create the actual:

Frontend

Backend

Database integration

Authentication

REST APIs

Food database

Recommendation engine

Meal planner

Responsive UI

Validation

Error handling

README

Database seed system

All buttons and navigation should perform real actions.

All major features should communicate with the backend.

The application should be runnable locally after installing dependencies and configuring MongoDB.

Before finishing, test the complete user journey:

Register → Login → Profile → Calculate Calories → Browse Foods → Search Foods → Get Personalized Recommendations → Generate Meal Plan → Save Meal Plan → Logout → Login Again

Make the final result look like a polished MTech Artificial Intelligence and Data Science project, not a basic tutorial website.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b6111a04-cc29-564d-acb1-d69103b94ed6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
